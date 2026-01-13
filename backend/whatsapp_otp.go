package main

import (
	"bytes"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/big"
	"net/http"
	"os"
	"sync"
	"time"
)

// WhatsApp Cloud API configuration
type WhatsAppConfig struct {
	PhoneNumberID     string
	AccessToken       string
	BusinessAccountID string
}

// OTP storage with expiration
type OTPEntry struct {
	Code      string
	ExpiresAt time.Time
	Attempts  int
}

var (
	whatsappConfig *WhatsAppConfig
	otpStore       = make(map[string]*OTPEntry) // phone -> OTP
	otpMutex       sync.RWMutex
	otpExpiry      = 5 * time.Minute
	maxOTPAttempts = 3
)

// Initialize WhatsApp config from environment
func initWhatsAppConfig() {
	whatsappConfig = &WhatsAppConfig{
		PhoneNumberID:     os.Getenv("WHATSAPP_PHONE_NUMBER_ID"),
		AccessToken:       os.Getenv("WHATSAPP_ACCESS_TOKEN"),
		BusinessAccountID: os.Getenv("WHATSAPP_BUSINESS_ACCOUNT_ID"),
	}

	// Fallback to hardcoded values for testing (remove in production)
	if whatsappConfig.PhoneNumberID == "" {
		whatsappConfig.PhoneNumberID = "947040551825655"
	}
	if whatsappConfig.BusinessAccountID == "" {
		whatsappConfig.BusinessAccountID = "1170487161509246"
	}
	if whatsappConfig.AccessToken == "" {
		whatsappConfig.AccessToken = os.Getenv("WA_TOKEN")
	}

	if whatsappConfig.PhoneNumberID != "" && whatsappConfig.AccessToken != "" {
		log.Println("✅ WhatsApp Cloud API configured")
		log.Printf("   Phone Number ID: %s", whatsappConfig.PhoneNumberID)
		log.Printf("   Business Account ID: %s", whatsappConfig.BusinessAccountID)
	} else {
		log.Println("⚠️ WhatsApp Cloud API not fully configured")
	}
}

// Generate a 6-digit OTP
func generateOTP() (string, error) {
	max := big.NewInt(1000000)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

// Store OTP for a phone number
func storeOTP(phone, code string) {
	otpMutex.Lock()
	defer otpMutex.Unlock()

	otpStore[phone] = &OTPEntry{
		Code:      code,
		ExpiresAt: time.Now().Add(otpExpiry),
		Attempts:  0,
	}
}

// Verify OTP for a phone number
func verifyOTP(phone, code string) (bool, string) {
	otpMutex.Lock()
	defer otpMutex.Unlock()

	entry, exists := otpStore[phone]
	if !exists {
		return false, "No OTP found for this number. Please request a new code."
	}

	if time.Now().After(entry.ExpiresAt) {
		delete(otpStore, phone)
		return false, "OTP has expired. Please request a new code."
	}

	entry.Attempts++
	if entry.Attempts > maxOTPAttempts {
		delete(otpStore, phone)
		return false, "Too many attempts. Please request a new code."
	}

	if entry.Code != code {
		return false, fmt.Sprintf("Invalid OTP. %d attempts remaining.", maxOTPAttempts-entry.Attempts)
	}

	// Success - remove OTP
	delete(otpStore, phone)
	return true, "OTP verified successfully"
}

// Send OTP via WhatsApp Cloud API
func sendWhatsAppOTP(phone, otp string) error {
	if whatsappConfig == nil || whatsappConfig.AccessToken == "" {
		return fmt.Errorf("WhatsApp not configured")
	}

	url := fmt.Sprintf("https://graph.facebook.com/v18.0/%s/messages", whatsappConfig.PhoneNumberID)

	// WhatsApp Cloud API message payload
	payload := map[string]interface{}{
		"messaging_product": "whatsapp",
		"to":                phone,
		"type":              "template",
		"template": map[string]interface{}{
			"name": "otp_verification",
			"language": map[string]string{
				"code": "en",
			},
			"components": []map[string]interface{}{
				{
					"type": "body",
					"parameters": []map[string]interface{}{
						{
							"type": "text",
							"text": otp,
						},
					},
				},
				{
					"type":       "button",
					"sub_type":   "url",
					"index":      "0",
					"parameters": []map[string]interface{}{
						{
							"type": "text",
							"text": otp,
						},
					},
				},
			},
		},
	}

	// If template not approved, use text message instead
	payloadText := map[string]interface{}{
		"messaging_product": "whatsapp",
		"recipient_type":    "individual",
		"to":                phone,
		"type":              "text",
		"text": map[string]string{
			"preview_url": "false",
			"body":        fmt.Sprintf("🚂 *Africa Railways*\n\nYour verification code is: *%s*\n\nThis code expires in 5 minutes.\n\nIf you didn't request this, please ignore.", otp),
		},
	}

	// Try text message first (works without template approval)
	jsonPayload, err := json.Marshal(payloadText)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonPayload))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+whatsappConfig.AccessToken)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		log.Printf("WhatsApp API error: %s", string(body))

		// Parse error response
		var errorResp struct {
			Error struct {
				Message string `json:"message"`
				Code    int    `json:"code"`
			} `json:"error"`
		}
		if json.Unmarshal(body, &errorResp) == nil && errorResp.Error.Message != "" {
			return fmt.Errorf("WhatsApp API error: %s", errorResp.Error.Message)
		}
		return fmt.Errorf("WhatsApp API returned status %d", resp.StatusCode)
	}

	// Parse success response
	var successResp struct {
		Messages []struct {
			ID string `json:"id"`
		} `json:"messages"`
	}
	if err := json.Unmarshal(body, &successResp); err == nil && len(successResp.Messages) > 0 {
		log.Printf("📱 WhatsApp OTP sent to %s (ID: %s)", phone, successResp.Messages[0].ID)
	}

	// If text message fails, try template
	if resp.StatusCode != http.StatusOK {
		jsonPayload, _ = json.Marshal(payload)
		req, _ = http.NewRequest("POST", url, bytes.NewBuffer(jsonPayload))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+whatsappConfig.AccessToken)
		resp, err = client.Do(req)
		if err != nil {
			return err
		}
		defer resp.Body.Close()
	}

	return nil
}

// API Handlers

// SendOTPRequest represents the request to send an OTP
type SendOTPRequest struct {
	Phone  string `json:"phone"`
	Method string `json:"method"` // "whatsapp" or "sms"
}

// SendOTPResponse represents the response after sending OTP
type SendOTPResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Error   string `json:"error,omitempty"`
}

// VerifyOTPRequest represents the request to verify an OTP
type VerifyOTPRequest struct {
	Phone string `json:"phone"`
	Code  string `json:"code"`
}

// VerifyOTPResponse represents the response after verifying OTP
type VerifyOTPResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Wallet  string `json:"wallet,omitempty"`
	Error   string `json:"error,omitempty"`
}

// sendOTPHandler handles OTP sending requests
func sendOTPHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(SendOTPResponse{
			Success: false,
			Error:   "Method not allowed",
		})
		return
	}

	var req SendOTPRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(SendOTPResponse{
			Success: false,
			Error:   "Invalid request body",
		})
		return
	}

	if req.Phone == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(SendOTPResponse{
			Success: false,
			Error:   "Phone number is required",
		})
		return
	}

	// Generate OTP
	otp, err := generateOTP()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(SendOTPResponse{
			Success: false,
			Error:   "Failed to generate OTP",
		})
		return
	}

	// Store OTP
	storeOTP(req.Phone, otp)

	// Send OTP via selected method
	if req.Method == "whatsapp" {
		err = sendWhatsAppOTP(req.Phone, otp)
		if err != nil {
			log.Printf("WhatsApp OTP error: %v", err)
			w.WriteHeader(http.StatusServiceUnavailable)
			json.NewEncoder(w).Encode(SendOTPResponse{
				Success: false,
				Error:   err.Error(),
			})
			return
		}
		json.NewEncoder(w).Encode(SendOTPResponse{
			Success: true,
			Message: "OTP sent via WhatsApp",
		})
	} else {
		// SMS fallback
		message := fmt.Sprintf("Your Africa Railways verification code is: %s. Valid for 5 minutes.", otp)
		result, err := sendSMS(req.Phone, message)
		if err != nil {
			log.Printf("SMS OTP error: %v", err)
			w.WriteHeader(http.StatusServiceUnavailable)
			json.NewEncoder(w).Encode(SendOTPResponse{
				Success: false,
				Error:   err.Error(),
			})
			return
		}
		if !result.Success {
			json.NewEncoder(w).Encode(SendOTPResponse{
				Success: false,
				Error:   result.Error,
			})
			return
		}
		json.NewEncoder(w).Encode(SendOTPResponse{
			Success: true,
			Message: "OTP sent via SMS",
		})
	}

	log.Printf("📱 OTP sent to %s via %s", req.Phone, req.Method)
}

// verifyOTPHandler handles OTP verification requests
func verifyOTPHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(VerifyOTPResponse{
			Success: false,
			Error:   "Method not allowed",
		})
		return
	}

	var req VerifyOTPRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(VerifyOTPResponse{
			Success: false,
			Error:   "Invalid request body",
		})
		return
	}

	if req.Phone == "" || req.Code == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(VerifyOTPResponse{
			Success: false,
			Error:   "Phone and code are required",
		})
		return
	}

	// Verify OTP
	valid, message := verifyOTP(req.Phone, req.Code)

	if !valid {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(VerifyOTPResponse{
			Success: false,
			Error:   message,
		})
		return
	}

	// Generate deterministic wallet address from phone number
	wallet := generateWalletFromPhone(req.Phone)

	json.NewEncoder(w).Encode(VerifyOTPResponse{
		Success: true,
		Message: "Phone verified successfully",
		Wallet:  wallet,
	})

	log.Printf("✅ OTP verified for %s, wallet: %s", req.Phone, wallet[:16]+"...")
}

// Clean up expired OTPs periodically
func cleanupExpiredOTPs() {
	ticker := time.NewTicker(1 * time.Minute)
	for range ticker.C {
		otpMutex.Lock()
		now := time.Now()
		for phone, entry := range otpStore {
			if now.After(entry.ExpiresAt) {
				delete(otpStore, phone)
			}
		}
		otpMutex.Unlock()
	}
}

func init() {
	go cleanupExpiredOTPs()
}
