package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"
)

// SMS Service configuration
type SMSConfig struct {
	Provider    string // "africastalking" or "twilio"
	APIKey      string
	APISecret   string // Username for Africa's Talking, Account SID for Twilio
	SenderID    string
	Environment string // "sandbox" or "production"
}

var (
	smsConfig      *SMSConfig
	smsConfigMutex sync.RWMutex
	smsConfigLast  time.Time
	smsConfigTTL   = 5 * time.Minute
)

// SMS Request/Response structures
type SendSMSRequest struct {
	To      string `json:"to"`
	Message string `json:"message"`
}

type SendSMSResponse struct {
	Success   bool   `json:"success"`
	MessageID string `json:"message_id,omitempty"`
	Error     string `json:"error,omitempty"`
}

// Booking confirmation SMS template
type BookingConfirmation struct {
	Reference   string
	Route       string
	Date        string
	Passengers  int
	Class       string
	TotalPrice  string
	WalletAddr  string
	NFTId       string
}

// getSMSConfig retrieves SMS configuration from environment or database
func getSMSConfig() (*SMSConfig, error) {
	smsConfigMutex.RLock()
	if smsConfig != nil && time.Since(smsConfigLast) < smsConfigTTL {
		config := smsConfig
		smsConfigMutex.RUnlock()
		return config, nil
	}
	smsConfigMutex.RUnlock()

	smsConfigMutex.Lock()
	defer smsConfigMutex.Unlock()

	// Double-check after acquiring write lock
	if smsConfig != nil && time.Since(smsConfigLast) < smsConfigTTL {
		return smsConfig, nil
	}

	config := &SMSConfig{}

	// Priority 1: Environment variables
	if apiKey := os.Getenv("AFRICASTALKING_API_KEY"); apiKey != "" {
		config.Provider = "africastalking"
		config.APIKey = apiKey
		config.APISecret = os.Getenv("AFRICASTALKING_USERNAME")
		config.SenderID = getEnvOrDefault("SMS_SENDER_ID", "AFRICARAIL")
		config.Environment = getEnvOrDefault("AFRICASTALKING_ENV", "sandbox")
		log.Println("📱 Using Africa's Talking SMS from environment")
	} else if apiKey := os.Getenv("TWILIO_API_KEY"); apiKey != "" {
		config.Provider = "twilio"
		config.APIKey = apiKey
		config.APISecret = os.Getenv("TWILIO_ACCOUNT_SID")
		config.SenderID = os.Getenv("TWILIO_PHONE_NUMBER")
		config.Environment = "production"
		log.Println("📱 Using Twilio SMS from environment")
	}

	// Priority 2: Database
	if config.Provider == "" && db != nil {
		var apiKey, apiSecret, configJSON string
		err := db.QueryRow(`
			SELECT api_key, COALESCE(api_secret, ''), COALESCE(config::text, '{}')
			FROM service_config 
			WHERE service_name = 'africastalking' AND is_active = true
		`).Scan(&apiKey, &apiSecret, &configJSON)

		if err == nil && apiKey != "" && apiKey != "placeholder" {
			config.Provider = "africastalking"
			config.APIKey = apiKey
			config.APISecret = apiSecret
			config.SenderID = "AFRICARAIL"
			config.Environment = "sandbox"

			// Parse additional config from JSON
			var extraConfig map[string]string
			if json.Unmarshal([]byte(configJSON), &extraConfig) == nil {
				if sender, ok := extraConfig["sender_id"]; ok {
					config.SenderID = sender
				}
				if env, ok := extraConfig["environment"]; ok {
					config.Environment = env
				}
			}
			log.Println("📱 Using Africa's Talking SMS from database")
		}
	}

	if config.Provider == "" {
		return nil, fmt.Errorf("SMS service not configured")
	}

	smsConfig = config
	smsConfigLast = time.Now()
	return config, nil
}

// sendSMS sends an SMS using the configured provider
func sendSMS(to, message string) (*SendSMSResponse, error) {
	config, err := getSMSConfig()
	if err != nil {
		return nil, err
	}

	switch config.Provider {
	case "africastalking":
		return sendAfricasTalkingSMS(config, to, message)
	case "twilio":
		return sendTwilioSMS(config, to, message)
	default:
		return nil, fmt.Errorf("unknown SMS provider: %s", config.Provider)
	}
}

// sendAfricasTalkingSMS sends SMS via Africa's Talking API
func sendAfricasTalkingSMS(config *SMSConfig, to, message string) (*SendSMSResponse, error) {
	baseURL := "https://api.africastalking.com/version1/messaging"
	if config.Environment == "sandbox" {
		baseURL = "https://api.sandbox.africastalking.com/version1/messaging"
	}

	// Prepare form data
	data := url.Values{}
	data.Set("username", config.APISecret)
	data.Set("to", to)
	data.Set("message", message)
	if config.SenderID != "" {
		data.Set("from", config.SenderID)
	}

	req, err := http.NewRequest("POST", baseURL, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("apiKey", config.APIKey)
	req.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send SMS: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var atResponse struct {
		SMSMessageData struct {
			Message    string `json:"Message"`
			Recipients []struct {
				StatusCode string `json:"statusCode"`
				Number     string `json:"number"`
				Status     string `json:"status"`
				MessageId  string `json:"messageId"`
			} `json:"Recipients"`
		} `json:"SMSMessageData"`
	}

	if err := json.Unmarshal(body, &atResponse); err != nil {
		log.Printf("SMS response parse error: %v, body: %s", err, string(body))
		return &SendSMSResponse{Success: false, Error: "Failed to parse response"}, nil
	}

	if len(atResponse.SMSMessageData.Recipients) > 0 {
		recipient := atResponse.SMSMessageData.Recipients[0]
		if recipient.StatusCode == "101" {
			return &SendSMSResponse{
				Success:   true,
				MessageID: recipient.MessageId,
			}, nil
		}
		return &SendSMSResponse{
			Success: false,
			Error:   recipient.Status,
		}, nil
	}

	return &SendSMSResponse{Success: false, Error: atResponse.SMSMessageData.Message}, nil
}

// sendTwilioSMS sends SMS via Twilio API
func sendTwilioSMS(config *SMSConfig, to, message string) (*SendSMSResponse, error) {
	twilioURL := fmt.Sprintf("https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", config.APISecret)

	data := url.Values{}
	data.Set("To", to)
	data.Set("From", config.SenderID)
	data.Set("Body", message)

	req, err := http.NewRequest("POST", twilioURL, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.SetBasicAuth(config.APISecret, config.APIKey)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send SMS: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var twilioResp struct {
		Sid          string `json:"sid"`
		Status       string `json:"status"`
		ErrorCode    int    `json:"error_code"`
		ErrorMessage string `json:"error_message"`
	}

	if err := json.Unmarshal(body, &twilioResp); err != nil {
		return &SendSMSResponse{Success: false, Error: "Failed to parse response"}, nil
	}

	if twilioResp.ErrorCode != 0 {
		return &SendSMSResponse{Success: false, Error: twilioResp.ErrorMessage}, nil
	}

	return &SendSMSResponse{
		Success:   true,
		MessageID: twilioResp.Sid,
	}, nil
}

// formatBookingConfirmationSMS formats a booking confirmation message
func formatBookingConfirmationSMS(booking BookingConfirmation) string {
	return fmt.Sprintf(
		"🚂 AFRICA RAILWAYS\n"+
			"Booking Confirmed!\n\n"+
			"Ref: %s\n"+
			"Route: %s\n"+
			"Date: %s\n"+
			"Passengers: %d\n"+
			"Class: %s\n"+
			"Total: %s\n\n"+
			"NFT Ticket: %s\n"+
			"Wallet: %s\n\n"+
			"Show this SMS at the station.\n"+
			"Safe travels!",
		booking.Reference,
		booking.Route,
		booking.Date,
		booking.Passengers,
		booking.Class,
		booking.TotalPrice,
		booking.NFTId,
		truncateWallet(booking.WalletAddr),
	)
}

func truncateWallet(addr string) string {
	if len(addr) > 16 {
		return addr[:8] + "..." + addr[len(addr)-6:]
	}
	return addr
}

// smsHandler handles SMS sending requests
func smsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req SendSMSRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.To == "" || req.Message == "" {
		http.Error(w, "Missing 'to' or 'message'", http.StatusBadRequest)
		return
	}

	result, err := sendSMS(req.To, req.Message)
	if err != nil {
		log.Printf("SMS error: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(SendSMSResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)

	if result.Success {
		log.Printf("📱 SMS sent to %s (ID: %s)", req.To, result.MessageID)
	} else {
		log.Printf("📱 SMS failed to %s: %s", req.To, result.Error)
	}
}

// bookingConfirmationHandler sends booking confirmation SMS
func bookingConfirmationHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Phone   string              `json:"phone"`
		Booking BookingConfirmation `json:"booking"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	message := formatBookingConfirmationSMS(req.Booking)
	result, err := sendSMS(req.Phone, message)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    result.Success,
		"message_id": result.MessageID,
		"error":      result.Error,
	})
}
