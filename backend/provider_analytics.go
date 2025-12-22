package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

// ProviderAnalytics tracks SMS provider usage and performance
type ProviderAnalytics struct {
	mu sync.RWMutex

	// Provider Counts
	AfricasTalkingCount int `json:"africastalking_count"`
	TwilioCount         int `json:"twilio_count"`
	TotalMessages       int `json:"total_messages"`

	// Success/Failure Rates
	AfricasTalkingSuccess int `json:"africastalking_success"`
	AfricasTalkingFailed  int `json:"africastalking_failed"`
	TwilioSuccess         int `json:"twilio_success"`
	TwilioFailed          int `json:"twilio_failed"`

	// Cost Tracking
	AfricasTalkingCost float64 `json:"africastalking_cost"`
	TwilioCost         float64 `json:"twilio_cost"`
	TotalCost          float64 `json:"total_cost"`

	// Performance Metrics
	AfricasTalkingAvgTime time.Duration `json:"africastalking_avg_time"`
	TwilioAvgTime         time.Duration `json:"twilio_avg_time"`

	// Fallback Tracking
	FallbackCount int `json:"fallback_count"` // Times Twilio was used as fallback

	// Time-based Analytics
	LastHourAT     int       `json:"last_hour_at"`
	LastHourTwilio int       `json:"last_hour_twilio"`
	LastUpdated    time.Time `json:"last_updated"`
}

// DashboardStats combines all statistics for the dashboard
type DashboardStats struct {
	mu sync.RWMutex

	// Provider Analytics
	ProviderStats *ProviderAnalytics `json:"provider_stats"`

	// General Stats
	TotalEvents      int     `json:"total_events"`
	TotalOnboardings int     `json:"total_onboardings"`
	SuccessRate      float64 `json:"success_rate"`
	RecentEvents     []Event `json:"recent_events"`

	// System Health
	Uptime       time.Duration `json:"uptime"`
	ActiveUsers  int           `json:"active_users"`
	SystemStatus string        `json:"system_status"`
}

var (
	providerAnalytics *ProviderAnalytics
	dashboardStats    *DashboardStats
	analyticsStartTime = time.Now()
)

// InitProviderAnalytics initializes the provider analytics system
func InitProviderAnalytics() {
	providerAnalytics = &ProviderAnalytics{
		AfricasTalkingCount:   0,
		TwilioCount:           0,
		TotalMessages:         0,
		AfricasTalkingSuccess: 0,
		AfricasTalkingFailed:  0,
		TwilioSuccess:         0,
		TwilioFailed:          0,
		AfricasTalkingCost:    0.0,
		TwilioCost:            0.0,
		TotalCost:             0.0,
		FallbackCount:         0,
		LastHourAT:            0,
		LastHourTwilio:        0,
		LastUpdated:           time.Now(),
	}

	dashboardStats = &DashboardStats{
		ProviderStats:    providerAnalytics,
		TotalEvents:      0,
		TotalOnboardings: 0,
		SuccessRate:      0.0,
		RecentEvents:     make([]Event, 0),
		Uptime:           0,
		ActiveUsers:      0,
		SystemStatus:     "healthy",
	}

	log.Println("📊 Provider Analytics initialized")
}

// RecordProviderUsage records SMS sent via a specific provider
func RecordProviderUsage(provider string, success bool, cost float64, deliveryTime time.Duration, isFallback bool) {
	providerAnalytics.mu.Lock()
	defer providerAnalytics.mu.Unlock()

	providerAnalytics.TotalMessages++
	providerAnalytics.TotalCost += cost
	providerAnalytics.LastUpdated = time.Now()

	switch provider {
	case "africastalking", "Africa's Talking":
		providerAnalytics.AfricasTalkingCount++
		providerAnalytics.LastHourAT++
		providerAnalytics.AfricasTalkingCost += cost

		if success {
			providerAnalytics.AfricasTalkingSuccess++
		} else {
			providerAnalytics.AfricasTalkingFailed++
		}

		// Update average delivery time
		if providerAnalytics.AfricasTalkingAvgTime == 0 {
			providerAnalytics.AfricasTalkingAvgTime = deliveryTime
		} else {
			providerAnalytics.AfricasTalkingAvgTime = 
				(providerAnalytics.AfricasTalkingAvgTime + deliveryTime) / 2
		}

	case "twilio", "Twilio", "Twilio (Global)":
		providerAnalytics.TwilioCount++
		providerAnalytics.LastHourTwilio++
		providerAnalytics.TwilioCost += cost

		if success {
			providerAnalytics.TwilioSuccess++
		} else {
			providerAnalytics.TwilioFailed++
		}

		// Update average delivery time
		if providerAnalytics.TwilioAvgTime == 0 {
			providerAnalytics.TwilioAvgTime = deliveryTime
		} else {
			providerAnalytics.TwilioAvgTime = 
				(providerAnalytics.TwilioAvgTime + deliveryTime) / 2
		}

		// Track if this was a fallback
		if isFallback {
			providerAnalytics.FallbackCount++
		}
	}

	// Broadcast analytics update
	broadcastAnalyticsUpdate()

	log.Printf("📊 Provider: %s | Success: %v | Cost: $%.4f | Time: %v | Fallback: %v",
		provider, success, cost, deliveryTime, isFallback)
}

// GetProviderAnalytics returns current provider analytics
func GetProviderAnalytics() *ProviderAnalytics {
	providerAnalytics.mu.RLock()
	defer providerAnalytics.mu.RUnlock()

	// Create a copy to avoid race conditions
	analytics := &ProviderAnalytics{
		AfricasTalkingCount:   providerAnalytics.AfricasTalkingCount,
		TwilioCount:           providerAnalytics.TwilioCount,
		TotalMessages:         providerAnalytics.TotalMessages,
		AfricasTalkingSuccess: providerAnalytics.AfricasTalkingSuccess,
		AfricasTalkingFailed:  providerAnalytics.AfricasTalkingFailed,
		TwilioSuccess:         providerAnalytics.TwilioSuccess,
		TwilioFailed:          providerAnalytics.TwilioFailed,
		AfricasTalkingCost:    providerAnalytics.AfricasTalkingCost,
		TwilioCost:            providerAnalytics.TwilioCost,
		TotalCost:             providerAnalytics.TotalCost,
		AfricasTalkingAvgTime: providerAnalytics.AfricasTalkingAvgTime,
		TwilioAvgTime:         providerAnalytics.TwilioAvgTime,
		FallbackCount:         providerAnalytics.FallbackCount,
		LastHourAT:            providerAnalytics.LastHourAT,
		LastHourTwilio:        providerAnalytics.LastHourTwilio,
		LastUpdated:           providerAnalytics.LastUpdated,
	}

	return analytics
}

// GetDashboardStats returns complete dashboard statistics
func GetDashboardStats() *DashboardStats {
	dashboardStats.mu.Lock()
	defer dashboardStats.mu.Unlock()

	// Update uptime
	dashboardStats.Uptime = time.Since(analyticsStartTime)

	// Calculate success rate
	totalAttempts := providerAnalytics.AfricasTalkingSuccess + 
		providerAnalytics.AfricasTalkingFailed + 
		providerAnalytics.TwilioSuccess + 
		providerAnalytics.TwilioFailed

	if totalAttempts > 0 {
		successCount := providerAnalytics.AfricasTalkingSuccess + providerAnalytics.TwilioSuccess
		dashboardStats.SuccessRate = float64(successCount) / float64(totalAttempts) * 100
	}

	// Update provider stats reference
	dashboardStats.ProviderStats = GetProviderAnalytics()

	return dashboardStats
}

// GetProviderComparison returns a comparison between providers
func GetProviderComparison() map[string]interface{} {
	analytics := GetProviderAnalytics()

	atSuccessRate := 0.0
	if analytics.AfricasTalkingCount > 0 {
		atSuccessRate = float64(analytics.AfricasTalkingSuccess) / 
			float64(analytics.AfricasTalkingCount) * 100
	}

	twilioSuccessRate := 0.0
	if analytics.TwilioCount > 0 {
		twilioSuccessRate = float64(analytics.TwilioSuccess) / 
			float64(analytics.TwilioCount) * 100
	}

	atPercentage := 0.0
	twilioPercentage := 0.0
	if analytics.TotalMessages > 0 {
		atPercentage = float64(analytics.AfricasTalkingCount) / 
			float64(analytics.TotalMessages) * 100
		twilioPercentage = float64(analytics.TwilioCount) / 
			float64(analytics.TotalMessages) * 100
	}

	costSavings := 0.0
	if analytics.TwilioCount > 0 {
		// Calculate what it would have cost if all messages went through Twilio
		potentialTwilioCost := float64(analytics.TotalMessages) * 0.055 // Kenya rate
		costSavings = potentialTwilioCost - analytics.TotalCost
	}

	return map[string]interface{}{
		"africastalking": map[string]interface{}{
			"count":        analytics.AfricasTalkingCount,
			"success_rate": fmt.Sprintf("%.2f%%", atSuccessRate),
			"cost":         fmt.Sprintf("$%.4f", analytics.AfricasTalkingCost),
			"percentage":   fmt.Sprintf("%.1f%%", atPercentage),
			"avg_time":     analytics.AfricasTalkingAvgTime.String(),
		},
		"twilio": map[string]interface{}{
			"count":        analytics.TwilioCount,
			"success_rate": fmt.Sprintf("%.2f%%", twilioSuccessRate),
			"cost":         fmt.Sprintf("$%.4f", analytics.TwilioCost),
			"percentage":   fmt.Sprintf("%.1f%%", twilioPercentage),
			"avg_time":     analytics.TwilioAvgTime.String(),
		},
		"summary": map[string]interface{}{
			"total_messages": analytics.TotalMessages,
			"total_cost":     fmt.Sprintf("$%.4f", analytics.TotalCost),
			"fallback_count": analytics.FallbackCount,
			"cost_savings":   fmt.Sprintf("$%.2f", costSavings),
			"primary_provider": func() string {
				if analytics.AfricasTalkingCount > analytics.TwilioCount {
					return "Africa's Talking"
				}
				return "Twilio"
			}(),
		},
	}
}

// broadcastAnalyticsUpdate sends analytics update to connected clients
func broadcastAnalyticsUpdate() {
	analytics := GetProviderAnalytics()
	
	// Create analytics event
	event := Event{
		ID:        time.Now().UnixNano(),
		Message:   fmt.Sprintf("📊 Analytics Update: AT=%d, Twilio=%d, Total=$%.4f", 
			analytics.AfricasTalkingCount, 
			analytics.TwilioCount, 
			analytics.TotalCost),
		Timestamp: time.Now(),
	}

	// Add to stats
	stats.mu.Lock()
	stats.RecentEvents = append([]Event{event}, stats.RecentEvents...)
	if len(stats.RecentEvents) > 100 {
		stats.RecentEvents = stats.RecentEvents[:100]
	}
	stats.mu.Unlock()

	// TODO: Broadcast via WebSocket
	// hub.BroadcastAnalytics(analytics)
}

// ResetHourlyCounters resets hourly tracking counters
func ResetHourlyCounters() {
	providerAnalytics.mu.Lock()
	defer providerAnalytics.mu.Unlock()

	providerAnalytics.LastHourAT = 0
	providerAnalytics.LastHourTwilio = 0

	log.Println("🔄 Hourly counters reset")
}

// StartHourlyReset starts a goroutine to reset hourly counters
func StartHourlyReset() {
	ticker := time.NewTicker(1 * time.Hour)
	go func() {
		for range ticker.C {
			ResetHourlyCounters()
		}
	}()

	log.Println("⏰ Hourly reset service started")
}

// HTTP Handlers

// providerAnalyticsHandler returns provider analytics
func providerAnalyticsHandler(w http.ResponseWriter, r *http.Request) {
	analytics := GetProviderAnalytics()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(analytics)
}

// providerComparisonHandler returns provider comparison
func providerComparisonHandler(w http.ResponseWriter, r *http.Request) {
	comparison := GetProviderComparison()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(comparison)
}

// dashboardStatsHandler returns complete dashboard statistics
func dashboardStatsHandler(w http.ResponseWriter, r *http.Request) {
	stats := GetDashboardStats()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

// RegisterAnalyticsHandlers registers all analytics HTTP handlers
func RegisterAnalyticsHandlers() {
	http.HandleFunc("/api/analytics/providers", providerAnalyticsHandler)
	http.HandleFunc("/api/analytics/comparison", providerComparisonHandler)
	http.HandleFunc("/api/analytics/dashboard", dashboardStatsHandler)

	log.Println("✅ Analytics handlers registered")
}
