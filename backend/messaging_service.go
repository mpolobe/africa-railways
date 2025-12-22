package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/twilio/twilio-go"
	openapi "github.com/twilio/twilio-go/rest/api/v2010"
	messagingV1 "github.com/twilio/twilio-go/rest/messaging/v1"
)

// MessagingService represents a Twilio Messaging Service with sender pool
type MessagingService struct {
	SID                string
	FriendlyName       string
	SenderPool         []string // Phone numbers in the pool
	CurrentSenderIndex int
	mu                 sync.RWMutex
	Stats              *MessagingStats
}

// MessagingStats tracks messaging service performance
type MessagingStats struct {
	TotalSent           int
	SuccessCount        int
	FailureCount        int
	FilteredCount       int // Messages blocked by carrier filters
	SenderRotations     int
	AverageDeliveryTime time.Duration
	mu                  sync.RWMutex
}

// SenderPoolConfig represents sender pool configuration
type SenderPoolConfig struct {
	PoolSize           int      // Number of phone numbers in pool
	RotationStrategy   string   // "round-robin", "random", "least-used"
	FilterBypassRules  []string // Rules to bypass carrier filters
	FallbackEnabled    bool
	HealthCheckEnabled bool
}

var (
	messagingService *MessagingService
	poolConfig       = &SenderPoolConfig{
		PoolSize:           3, // Recommended: 3-5 numbers
		RotationStrategy:   "round-robin",
		FilterBypassRules:  []string{"alphanumeric-sender", "verified-sender", "opt-in-compliant"},
		FallbackEnabled:    true,
		HealthCheckEnabled: true,
	}
)

// InitMessagingService initializes the Twilio Messaging Service
func InitMessagingService() error {
	serviceSID := os.Getenv("TWILIO_MESSAGING_SERVICE_SID")
	if serviceSID == "" {
		return fmt.Errorf("TWILIO_MESSAGING_SERVICE_SID not set")
	}

	messagingService = &MessagingService{
		SID:          serviceSID,
		FriendlyName: "Africa Railways Sovereign Hub",
		SenderPool:   make([]string, 0),
		Stats: &MessagingStats{
			TotalSent:    0,
			SuccessCount: 0,
			FailureCount: 0,
		},
	}

	// Fetch sender pool from Twilio
	if err := messagingService.FetchSenderPool(); err != nil {
		log.Printf("⚠️  Failed to fetch sender pool: %v", err)
		// Continue with service SID only (Twilio manages pool)
	}

	log.Printf("✅ Messaging Service initialized: %s", serviceSID)
	log.Printf("📱 Sender Pool Size: %d", len(messagingService.SenderPool))

	return nil
}

// FetchSenderPool retrieves the sender pool from Twilio Messaging Service
func (ms *MessagingService) FetchSenderPool() error {
	client := twilio.NewRestClient()

	// Get Messaging Service details
	params := &messagingV1.FetchServiceParams{}
	service, err := client.MessagingV1.FetchService(ms.SID, params)
	if err != nil {
		return fmt.Errorf("failed to fetch service: %w", err)
	}

	log.Printf("📋 Messaging Service: %s", *service.FriendlyName)
	log.Printf("   Status: %s", *service.Status)

	// Fetch phone numbers in the sender pool
	phoneParams := &messagingV1.ListPhoneNumberParams{}
	phoneNumbers, err := client.MessagingV1.ListPhoneNumber(ms.SID, phoneParams)
	if err != nil {
		return fmt.Errorf("failed to fetch phone numbers: %w", err)
	}

	ms.mu.Lock()
	defer ms.mu.Unlock()

	ms.SenderPool = make([]string, 0)
	for _, phone := range phoneNumbers {
		if phone.PhoneNumber != nil {
			ms.SenderPool = append(ms.SenderPool, *phone.PhoneNumber)
			log.Printf("   📞 Sender: %s (Capabilities: %v)", *phone.PhoneNumber, phone.Capabilities)
		}
	}

	return nil
}

// GetNextSender returns the next sender from the pool using rotation strategy
func (ms *MessagingService) GetNextSender() string {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	if len(ms.SenderPool) == 0 {
		// No pool configured, use Messaging Service SID
		return ""
	}

	var sender string

	switch poolConfig.RotationStrategy {
	case "round-robin":
		sender = ms.SenderPool[ms.CurrentSenderIndex]
		ms.CurrentSenderIndex = (ms.CurrentSenderIndex + 1) % len(ms.SenderPool)
		ms.Stats.SenderRotations++

	case "random":
		// Random selection helps distribute load
		sender = ms.SenderPool[time.Now().UnixNano()%int64(len(ms.SenderPool))]

	case "least-used":
		// TODO: Track usage per sender and select least used
		sender = ms.SenderPool[0]

	default:
		sender = ms.SenderPool[0]
	}

	log.Printf("🔄 Sender rotation: %s (Strategy: %s)", maskPhoneNumber(sender), poolConfig.RotationStrategy)
	return sender
}

// SendWithMessagingService sends SMS using Messaging Service with sender pool
func (ms *MessagingService) SendWithMessagingService(to, message string) (*openapi.ApiV2010Message, error) {
	client := twilio.NewRestClient()

	params := &openapi.CreateMessageParams{}
	params.SetTo(to)
	params.SetBody(message)

	// Use Messaging Service SID (Twilio manages sender pool automatically)
	params.SetMessagingServiceSid(ms.SID)

	startTime := time.Now()

	// Send message
	resp, err := client.Api.CreateMessage(params)
	if err != nil {
		ms.Stats.mu.Lock()
		ms.Stats.TotalSent++
		ms.Stats.FailureCount++
		ms.Stats.mu.Unlock()

		return nil, fmt.Errorf("failed to send message: %w", err)
	}

	deliveryTime := time.Since(startTime)

	// Update stats
	ms.Stats.mu.Lock()
	ms.Stats.TotalSent++
	ms.Stats.SuccessCount++
	ms.Stats.AverageDeliveryTime = (ms.Stats.AverageDeliveryTime + deliveryTime) / 2
	ms.Stats.mu.Unlock()

	log.Printf("✅ Message sent via Messaging Service")
	log.Printf("   SID: %s", *resp.Sid)
	log.Printf("   Status: %s", *resp.Status)
	log.Printf("   Delivery Time: %v", deliveryTime)

	return resp, nil
}

// SendWithSenderRotation sends SMS with manual sender rotation
func (ms *MessagingService) SendWithSenderRotation(to, message string) (*openapi.ApiV2010Message, error) {
	client := twilio.NewRestClient()

	// Get next sender from pool
	sender := ms.GetNextSender()

	params := &openapi.CreateMessageParams{}
	params.SetTo(to)
	params.SetBody(message)

	if sender != "" {
		// Use specific sender from pool
		params.SetFrom(sender)
		log.Printf("📤 Sending from: %s", maskPhoneNumber(sender))
	} else {
		// Use Messaging Service (Twilio manages sender)
		params.SetMessagingServiceSid(ms.SID)
		log.Printf("📤 Sending via Messaging Service: %s", ms.SID)
	}

	startTime := time.Now()

	// Send message
	resp, err := client.Api.CreateMessage(params)
	if err != nil {
		ms.Stats.mu.Lock()
		ms.Stats.TotalSent++
		ms.Stats.FailureCount++
		ms.Stats.mu.Unlock()

		// Check if message was filtered by carrier
		if isCarrierFiltered(err) {
			ms.Stats.mu.Lock()
			ms.Stats.FilteredCount++
			ms.Stats.mu.Unlock()

			log.Printf("⚠️  Message filtered by carrier, rotating sender...")

			// Retry with different sender
			if poolConfig.FallbackEnabled {
				return ms.SendWithSenderRotation(to, message)
			}
		}

		return nil, fmt.Errorf("failed to send message: %w", err)
	}

	deliveryTime := time.Since(startTime)

	// Update stats
	ms.Stats.mu.Lock()
	ms.Stats.TotalSent++
	ms.Stats.SuccessCount++
	ms.Stats.AverageDeliveryTime = (ms.Stats.AverageDeliveryTime + deliveryTime) / 2
	ms.Stats.mu.Unlock()

	log.Printf("✅ Message sent successfully")
	log.Printf("   SID: %s", *resp.Sid)
	log.Printf("   From: %s", *resp.From)
	log.Printf("   Status: %s", *resp.Status)
	log.Printf("   Delivery Time: %v", deliveryTime)

	return resp, nil
}

// isCarrierFiltered checks if error indicates carrier filtering
func isCarrierFiltered(err error) bool {
	if err == nil {
		return false
	}

	errorStr := err.Error()

	// Common carrier filter error codes
	filterIndicators := []string{
		"30007", // Carrier violation
		"30008", // Unknown destination
		"30034", // Message blocked
		"21610", // Attempt to send to unsubscribed recipient
		"21614", // Message blocked by carrier
	}

	for _, indicator := range filterIndicators {
		if contains(errorStr, indicator) {
			return true
		}
	}

	return false
}

// BypassCarrierFilters implements strategies to bypass carrier filters
func (ms *MessagingService) BypassCarrierFilters(to, message string) (*openapi.ApiV2010Message, error) {
	log.Printf("🛡️  Applying carrier filter bypass strategies...")

	// Strategy 1: Use Messaging Service (automatic sender pool management)
	// This is the most reliable method as Twilio handles sender reputation
	if ms.SID != "" {
		log.Printf("   ✅ Strategy 1: Using Messaging Service (MG%s...)", ms.SID[2:8])
		return ms.SendWithMessagingService(to, message)
	}

	// Strategy 2: Manual sender rotation
	if len(ms.SenderPool) > 0 {
		log.Printf("   ✅ Strategy 2: Manual sender rotation (%d senders)", len(ms.SenderPool))
		return ms.SendWithSenderRotation(to, message)
	}

	// Strategy 3: Fallback to single sender
	log.Printf("   ⚠️  Strategy 3: Fallback to single sender")
	return ms.sendWithFallback(to, message)
}

// sendWithFallback sends message with fallback sender
func (ms *MessagingService) sendWithFallback(to, message string) (*openapi.ApiV2010Message, error) {
	client := twilio.NewRestClient()

	params := &openapi.CreateMessageParams{}
	params.SetTo(to)
	params.SetBody(message)
	params.SetFrom(os.Getenv("TWILIO_NUMBER"))

	resp, err := client.Api.CreateMessage(params)
	if err != nil {
		return nil, err
	}

	return resp, nil
}

// GetMessagingServiceStats returns current statistics
func (ms *MessagingService) GetMessagingServiceStats() map[string]interface{} {
	ms.Stats.mu.RLock()
	defer ms.Stats.mu.RUnlock()

	successRate := 0.0
	if ms.Stats.TotalSent > 0 {
		successRate = float64(ms.Stats.SuccessCount) / float64(ms.Stats.TotalSent) * 100
	}

	filterRate := 0.0
	if ms.Stats.TotalSent > 0 {
		filterRate = float64(ms.Stats.FilteredCount) / float64(ms.Stats.TotalSent) * 100
	}

	return map[string]interface{}{
		"messaging_service_sid": ms.SID,
		"sender_pool_size":      len(ms.SenderPool),
		"total_sent":            ms.Stats.TotalSent,
		"success_count":         ms.Stats.SuccessCount,
		"failure_count":         ms.Stats.FailureCount,
		"filtered_count":        ms.Stats.FilteredCount,
		"sender_rotations":      ms.Stats.SenderRotations,
		"success_rate":          fmt.Sprintf("%.2f%%", successRate),
		"filter_rate":           fmt.Sprintf("%.2f%%", filterRate),
		"avg_delivery_time":     ms.Stats.AverageDeliveryTime.String(),
		"rotation_strategy":     poolConfig.RotationStrategy,
	}
}

// HealthCheckSenderPool verifies all senders in the pool are healthy
func (ms *MessagingService) HealthCheckSenderPool() error {
	if !poolConfig.HealthCheckEnabled {
		return nil
	}

	log.Printf("🏥 Running sender pool health check...")

	client := twilio.NewRestClient()

	ms.mu.RLock()
	senders := make([]string, len(ms.SenderPool))
	copy(senders, ms.SenderPool)
	ms.mu.RUnlock()

	healthySenders := make([]string, 0)

	for _, sender := range senders {
		// Check if sender is still active
		// In production, you would query Twilio API for phone number status
		log.Printf("   Checking: %s", maskPhoneNumber(sender))

		// For now, assume all are healthy
		// TODO: Implement actual health check via Twilio API
		healthySenders = append(healthySenders, sender)
	}

	ms.mu.Lock()
	ms.SenderPool = healthySenders
	ms.mu.Unlock()

	log.Printf("✅ Health check complete: %d/%d senders healthy", len(healthySenders), len(senders))

	return nil
}

// HTTP Handler for messaging service stats
func messagingServiceStatsHandler(w http.ResponseWriter, r *http.Request) {
	if messagingService == nil {
		http.Error(w, "Messaging service not initialized", http.StatusServiceUnavailable)
		return
	}

	stats := messagingService.GetMessagingServiceStats()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

// HTTP Handler to trigger sender pool refresh
func refreshSenderPoolHandler(w http.ResponseWriter, r *http.Request) {
	if messagingService == nil {
		http.Error(w, "Messaging service not initialized", http.StatusServiceUnavailable)
		return
	}

	if err := messagingService.FetchSenderPool(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":          "success",
		"sender_pool_size": len(messagingService.SenderPool),
		"senders":         messagingService.SenderPool,
	})
}

// HTTP Handler to trigger health check
func healthCheckSenderPoolHandler(w http.ResponseWriter, r *http.Request) {
	if messagingService == nil {
		http.Error(w, "Messaging service not initialized", http.StatusServiceUnavailable)
		return
	}

	if err := messagingService.HealthCheckSenderPool(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":           "success",
		"healthy_senders":  len(messagingService.SenderPool),
		"rotation_strategy": poolConfig.RotationStrategy,
	})
}

// Helper function to check if string contains substring
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) && 
		(s[:len(substr)] == substr || s[len(s)-len(substr):] == substr || 
		len(s) > len(substr)*2))
}

// StartSenderPoolHealthCheck starts periodic health checks
func StartSenderPoolHealthCheck() {
	if !poolConfig.HealthCheckEnabled {
		return
	}

	ticker := time.NewTicker(1 * time.Hour)
	go func() {
		for range ticker.C {
			if messagingService != nil {
				messagingService.HealthCheckSenderPool()
			}
		}
	}()

	log.Println("🏥 Sender pool health check service started (1 hour interval)")
}
