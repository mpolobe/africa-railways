package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
)

// Event represents a system event
type Event struct {
	ID        int64     `json:"id"`
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
}

// Stats holds system statistics and events
type Stats struct {
	mu           sync.Mutex
	RecentEvents []Event
	TotalEvents  int
	SMSSent      int
	SMSFailed    int
	ATCount      int `json:"at_count"`      // Africa's Talking Tally
	TwilioCount  int `json:"twilio_count"`  // Twilio Tally
}

var stats = &Stats{
	RecentEvents: make([]Event, 0),
	ATCount:      0,
	TwilioCount:  0,
}

// recordOnboarding records which provider was used for onboarding
func recordOnboarding(provider string) {
	stats.mu.Lock()
	
	if provider == "AT" || provider == "Africa's Talking" {
		stats.ATCount++
		log.Printf("📊 Africa's Talking count: %d", stats.ATCount)
	} else if provider == "Twilio" || provider == "Twilio (Global)" {
		stats.TwilioCount++
		log.Printf("📊 Twilio count: %d", stats.TwilioCount)
	}
	
	atCount := stats.ATCount
	twilioCount := stats.TwilioCount
	stats.mu.Unlock()
	
	// Update WebSocket stats
	UpdateProviderCounts(atCount, twilioCount)
}

// OTPRequest represents an OTP request payload
type OTPRequest struct {
	PhoneNumber string `json:"phone_number"`
}

// OTPVerifyRequest represents an OTP verification payload
type OTPVerifyRequest struct {
	PhoneNumber string `json:"phone_number"`
	OTP         string `json:"otp"`
}

// onboardHandler handles OTP request for user onboarding
func onboardHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req OTPRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate phone number
	if err := ValidatePhoneNumber(req.PhoneNumber); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	log.Printf("📱 Onboarding request for %s", maskPhoneNumber(req.PhoneNumber))

	// Generate OTP
	otp, err := GenerateOTP()
	if err != nil {
		log.Printf("❌ Failed to generate OTP: %v", err)
		http.Error(w, "Failed to generate OTP", http.StatusInternalServerError)
		return
	}

	// Store OTP
	otpStore.StoreOTP(req.PhoneNumber, otp)

	// Try sending via Africa's Talking first
	provider := "Africa's Talking"
	err = sendOnboardingSMS(req.PhoneNumber, otp)

	if err != nil {
		log.Printf("⚠️  Africa's Talking failed: %v, trying Twilio...", err)
		provider = "Twilio (Global)"
		
		// Fallback to Twilio
		config := LoadSMSConfig()
		err = sendViaTwilio(req.PhoneNumber, 
			fmt.Sprintf("Welcome to Sovereign Hub! Your Africoin Activation Code is: %s", otp),
			config)
		
		if err != nil {
			log.Printf("❌ Both SMS providers failed: %v", err)
			stats.mu.Lock()
			stats.SMSFailed++
			stats.mu.Unlock()
			
			// Broadcast failure event
			broadcastEvent(fmt.Sprintf("❌ SMS Failed: %s", maskPhoneNumber(req.PhoneNumber)))
			
			http.Error(w, "Failed to send SMS", http.StatusInternalServerError)
			RecordSMSFailure()
			return
		}
	}

	// Success - update stats
	stats.mu.Lock()
	stats.SMSSent++
	stats.mu.Unlock()

	// Record provider usage
	recordOnboarding(provider)

	// Broadcast to the iPad Monitor
	broadcastEvent(fmt.Sprintf("📱 Onboarding: %s via %s", maskPhoneNumber(req.PhoneNumber), provider))

	// Record success
	RecordSMSSuccess(req.PhoneNumber, provider)

	log.Printf("✅ OTP sent to %s via %s", maskPhoneNumber(req.PhoneNumber), provider)

	// Return success response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":             "success",
		"message":            "OTP sent to your phone",
		"expires_in_minutes": 10,
		"provider":           provider,
	})
}

// verifyOTPHandler handles OTP verification
func verifyOTPHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req OTPVerifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	log.Printf("🔐 OTP verification attempt for %s", maskPhoneNumber(req.PhoneNumber))

	// Verify OTP
	valid, err := otpStore.VerifyOTP(req.PhoneNumber, req.OTP)
	if err != nil {
		log.Printf("❌ OTP verification failed: %v", err)
		
		// Broadcast failure event
		broadcastEvent(fmt.Sprintf("❌ Verification Failed: %s", maskPhoneNumber(req.PhoneNumber)))
		
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	if !valid {
		log.Printf("❌ Invalid OTP for %s", maskPhoneNumber(req.PhoneNumber))
		
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":  "error",
			"message": "Invalid OTP",
		})
		return
	}

	// Success - user verified
	log.Printf("✅ User verified: %s", maskPhoneNumber(req.PhoneNumber))

	// Broadcast success event
	broadcastEvent(fmt.Sprintf("✅ Wallet Activated: %s (1,250 AFRC)", maskPhoneNumber(req.PhoneNumber)))

	// Send welcome SMS asynchronously
	go func() {
		err := SendWelcomeSMS(req.PhoneNumber, "New User")
		if err != nil {
			log.Printf("⚠️  Failed to send welcome SMS: %v", err)
		} else {
			broadcastEvent(fmt.Sprintf("💎 Welcome SMS sent to %s", maskPhoneNumber(req.PhoneNumber)))
		}
	}()

	// Return success response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":         "success",
		"message":        "Phone number verified successfully",
		"wallet_balance": 1250,
	})
}

// ticketPurchaseHandler handles ticket purchase with SMS notification
func ticketPurchaseHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		PhoneNumber string `json:"phone_number"`
		Route       string `json:"route"`
		Amount      int    `json:"amount"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	log.Printf("🎟️  Ticket purchase: %s for %s", req.Route, maskPhoneNumber(req.PhoneNumber))

	// Broadcast ticket purchase event
	broadcastEvent(fmt.Sprintf("🎟️ Ticket Booked: %s - %d AFRC", req.Route, req.Amount))

	// Send confirmation SMS asynchronously
	go func() {
		err := SendTicketConfirmationSMS(req.PhoneNumber, req.Route, req.Amount)
		if err != nil {
			log.Printf("⚠️  Failed to send ticket confirmation: %v", err)
			RecordSMSFailure()
		} else {
			provider, _ := GetSMSCost(req.PhoneNumber)
			RecordSMSSuccess(req.PhoneNumber, provider)
			broadcastEvent(fmt.Sprintf("📧 Confirmation sent to %s", maskPhoneNumber(req.PhoneNumber)))
		}
	}()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "success",
		"message": "Ticket purchased, confirmation SMS sent",
	})
}

// walletTopUpHandler handles wallet top-up with SMS notification
func walletTopUpHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		PhoneNumber string `json:"phone_number"`
		Amount      int    `json:"amount"`
		NewBalance  int    `json:"new_balance"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	log.Printf("💳 Wallet top-up: +%d AFRC for %s", req.Amount, maskPhoneNumber(req.PhoneNumber))

	// Broadcast top-up event
	broadcastEvent(fmt.Sprintf("💎 Wallet Top-Up: +%d AFRC (Balance: %d)", req.Amount, req.NewBalance))

	// Send confirmation SMS asynchronously
	go func() {
		err := SendWalletTopUpSMS(req.PhoneNumber, req.Amount, req.NewBalance)
		if err != nil {
			log.Printf("⚠️  Failed to send top-up confirmation: %v", err)
			RecordSMSFailure()
		} else {
			provider, _ := GetSMSCost(req.PhoneNumber)
			RecordSMSSuccess(req.PhoneNumber, provider)
		}
	}()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "success",
		"message": "Wallet topped up, confirmation SMS sent",
	})
}

// statsHandler returns system statistics
func statsHandler(w http.ResponseWriter, r *http.Request) {
	stats.mu.Lock()
	defer stats.mu.Unlock()

	smsStats := GetSMSStats()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"total_events":        stats.TotalEvents,
		"sms_sent":            stats.SMSSent,
		"sms_failed":          stats.SMSFailed,
		"recent_events":       stats.RecentEvents,
		"sms_success_rate":    float64(smsStats.SuccessCount) / float64(smsStats.TotalSent) * 100,
		"africastalking_used": smsStats.AfricasTalkingUsed,
		"twilio_used":         smsStats.TwilioUsed,
		"total_cost_usd":      smsStats.TotalCost,
		"at_count":            stats.ATCount,
		"twilio_count":        stats.TwilioCount,
	})
}

// eventsHandler returns recent events for the live feed
func eventsHandler(w http.ResponseWriter, r *http.Request) {
	stats.mu.Lock()
	defer stats.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats.RecentEvents)
}

// broadcastEvent adds an event to the feed and broadcasts it
func broadcastEvent(message string) {
	event := Event{
		ID:        time.Now().UnixNano(),
		Message:   message,
		Timestamp: time.Now(),
	}

	stats.mu.Lock()
	stats.RecentEvents = append([]Event{event}, stats.RecentEvents...)
	stats.TotalEvents++

	// Keep only last 100 events
	if len(stats.RecentEvents) > 100 {
		stats.RecentEvents = stats.RecentEvents[:100]
	}
	stats.mu.Unlock()

	log.Printf("📡 Event: %s", message)

	// TODO: Broadcast via WebSocket to connected clients
	// hub.Broadcast(event)
}

// healthHandler returns server health status
func healthHandler(w http.ResponseWriter, r *http.Request) {
	stats.mu.RLock()
	defer stats.mu.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":       "healthy",
		"total_events": stats.TotalEvents,
		"sms_sent":     stats.SMSSent,
		"sms_failed":   stats.SMSFailed,
		"uptime":       time.Since(startTime).String(),
	})
}

var startTime = time.Now()

// RegisterHandlers registers all HTTP handlers
func RegisterHandlers() {
	// Onboarding endpoints
	http.HandleFunc("/api/otp/request", onboardHandler)
	http.HandleFunc("/api/otp/verify", verifyOTPHandler)

	// Transaction endpoints
	http.HandleFunc("/api/ticket/purchase", ticketPurchaseHandler)
	http.HandleFunc("/api/wallet/topup", walletTopUpHandler)

	// Monitoring endpoints
	http.HandleFunc("/api/stats", statsHandler)
	http.HandleFunc("/api/events", eventsHandler)
	http.HandleFunc("/health", healthHandler)

	// Legacy endpoint for compatibility
	http.HandleFunc("/add-event", addEventHandler)

	log.Println("✅ HTTP handlers registered")
}

// addEventHandler handles legacy event addition (for backward compatibility)
func addEventHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Message string `json:"message"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	broadcastEvent(req.Message)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "success",
		"message": "Event added",
	})
}
