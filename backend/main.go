package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Event structure with Timestamps and Unique IDs
type Event struct {
	ID        int64     `json:"id"`
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
}

type DashboardStats struct {
	mu           sync.Mutex
	RecentEvents []Event `json:"recent_events"`
	ATCount      int     `json:"at_count"`
	TwilioCount  int     `json:"twilio_count"`
}

var (
	stats    = &DashboardStats{RecentEvents: []Event{}}
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true }, // Essential for iPad/Vercel access
	}
)

// CORS Middleware to allow your iPad to talk to this server
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// WebSocket Handler: Pushes updates to the iPad instantly
func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}
	defer conn.Close()

	log.Println("📡 WebSocket client connected")

	for {
		stats.mu.Lock()
		payload, _ := json.Marshal(stats)
		stats.mu.Unlock()

		if err := conn.WriteMessage(websocket.TextMessage, payload); err != nil {
			log.Println("📡 WebSocket client disconnected")
			break 
		}
		time.Sleep(2 * time.Second) // Throttled update rate
	}
}

// Handler to add new simulated ticket events
func addEventHandler(w http.ResponseWriter, r *http.Request) {
	var e Event
	if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	e.Timestamp = time.Now()
	e.ID = time.Now().UnixNano() // Unique ID based on nanoseconds

	stats.mu.Lock()
	stats.RecentEvents = append([]Event{e}, stats.RecentEvents...) // Prepend (newest first)
	if len(stats.RecentEvents) > 10 {
		stats.RecentEvents = stats.RecentEvents[:10] // Keep only last 10
	}
	stats.mu.Unlock()

	log.Printf("📩 Event added: %s [ID: %d]", e.Message, e.ID)
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "success",
		"id":     e.ID,
	})
}

// UpdateProviderCounts updates the provider counts from handlers
func UpdateProviderCounts(atCount, twilioCount int) {
	stats.mu.Lock()
	stats.ATCount = atCount
	stats.TwilioCount = twilioCount
	stats.mu.Unlock()
}

// Health check endpoint
func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	stats.mu.Lock()
	eventCount := len(stats.RecentEvents)
	atCount := stats.ATCount
	twilioCount := stats.TwilioCount
	stats.mu.Unlock()
	
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":       "ok",
		"event_count":  eventCount,
		"at_count":     atCount,
		"twilio_count": twilioCount,
		"timestamp":    time.Now(),
	})
}

// reportsHandler is defined in reports.go

// validateEnvironment validates required environment variables
func validateEnvironment() string {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
		log.Println("⚠️  PORT not set, using default: 8080")
	}

	// Optional: Validate SMS provider configs
	atKey := os.Getenv("AT_API_KEY")
	twilioSID := os.Getenv("TWILIO_ACCOUNT_SID")

	if atKey == "" && twilioSID == "" {
		log.Println("⚠️  No SMS provider configured (AT_API_KEY or TWILIO_ACCOUNT_SID)")
		log.Println("   SMS notifications will not be available")
	}

	env := os.Getenv("ENVIRONMENT")
	if env == "" {
		env = "development"
	}

	fmt.Println("\n" + strings.Repeat("=", 60))
	fmt.Println("🔍 Environment Configuration")
	fmt.Println(strings.Repeat("=", 60))
	fmt.Printf("  Port:        %s\n", port)
	fmt.Printf("  Environment: %s\n", env)
	fmt.Printf("  AT API:      %s\n", maskValue(atKey))
	fmt.Printf("  Twilio:      %s\n", maskValue(twilioSID))
	fmt.Println(strings.Repeat("=", 60) + "\n")

	return port
}

// maskValue masks sensitive values
func maskValue(value string) string {
	if value == "" {
		return "Not configured"
	}
	if len(value) <= 8 {
		return "***"
	}
	return value[:4] + "..." + value[len(value)-4:]
}

func main() {
	// Validate environment variables
	port := validateEnvironment()

	// Initialize newsfeed database
	if err := InitNewsfeedDB(); err != nil {
		log.Printf("⚠️  Newsfeed DB initialization failed: %v", err)
		log.Println("   Continuing with in-memory storage")
	}

	// Initialize notifications
	InitNotifications()

	mux := http.NewServeMux()
	mux.HandleFunc("/ws", wsHandler)
	mux.HandleFunc("/add-event", addEventHandler)
	mux.HandleFunc("/health", healthHandler)
	mux.HandleFunc("/api/reports", reportsHandler)
	
	// Newsfeed endpoints
	mux.HandleFunc("/api/newsfeed/posts", newsfeedPostsHandler)
	mux.HandleFunc("/api/newsfeed/comments", newsfeedCommentsHandler)
	mux.HandleFunc("/api/newsfeed/like", newsfeedLikeHandler)
	
	// Notification endpoints
	mux.HandleFunc("/api/notifications", notificationsHandler)
	mux.HandleFunc("/api/notifications/action", notificationActionHandler)
	mux.HandleFunc("/api/notifications/count", notificationCountHandler)
	
	// Stations API endpoints
	mux.HandleFunc("/api/stations", stationsHandler)
	mux.HandleFunc("/api/stations/metadata", stationsMetadataHandler)
	mux.HandleFunc("/api/stations/countries", stationsCountriesHandler)
	mux.HandleFunc("/api/stations/cities", stationsCitiesHandler)
	mux.HandleFunc("/api/stations/list", stationsListHandler)
	mux.HandleFunc("/api/stations/search", stationsSearchHandler)
	mux.HandleFunc("/api/stations/station", stationByIDHandler)
	mux.HandleFunc("/api/stations/nearby", stationsNearbyHandler)
	
	// Sentinel mobile app endpoints
	mux.HandleFunc("/api/sentinel/alert", sentinelAlertHandler)
	mux.HandleFunc("/api/sentinel/report", sentinelReportHandler)
	mux.HandleFunc("/api/sentinel/location", sentinelLocationHandler)
	mux.HandleFunc("/api/sentinel/status", sentinelStatusHandler)
	
	// Facebook integration endpoints
	mux.HandleFunc("/api/facebook/share", facebookShareHandler)
	mux.HandleFunc("/api/facebook/status", facebookStatusHandler)

	// Operators API endpoints
	mux.HandleFunc("/api/operators", operatorsListHandler)
	mux.HandleFunc("/api/operators/metadata", operatorsMetadataHandler)
	mux.HandleFunc("/api/operators/regions", operatorsRegionsHandler)
	mux.HandleFunc("/api/operators/countries", operatorsCountriesHandler)
	mux.HandleFunc("/api/operators/search", operatorsSearchHandler)
	mux.HandleFunc("/api/operators/operator", operatorByIDHandler)
	mux.HandleFunc("/api/operators/apikey/generate", generateAPIKeyHandler)
	mux.HandleFunc("/api/operators/apikey/validate", validateAPIKeyHandler)

	// AI Chat endpoints
	mux.HandleFunc("/api/ai/chat", aiChatHandler)
	mux.HandleFunc("/api/admin/apikey", updateAPIKeyHandler)

	// SMS endpoints
	mux.HandleFunc("/api/sms/send", smsHandler)
	mux.HandleFunc("/api/sms/booking-confirmation", bookingConfirmationHandler)

	// Bookings & Payments endpoints
	mux.HandleFunc("/api/bookings", bookingsHandler)
	mux.HandleFunc("/api/bookings/detail", bookingDetailHandler)
	mux.HandleFunc("/api/bookings/stats", bookingStatsHandler)
	mux.HandleFunc("/api/payments", paymentsHandler)
	mux.HandleFunc("/api/tickets/validate", ticketValidateHandler)
	mux.HandleFunc("/api/tickets/use", ticketUseHandler)

	log.Println("🛰️  Sentinel Engine Live on :" + port)
	log.Println("📡 WebSocket endpoint: /ws")
	log.Println("📩 Add event endpoint: /add-event")
	log.Println("💚 Health check: /health")
	log.Println("📊 Reports API: /api/reports")
	log.Println("📰 Newsfeed API: /api/newsfeed/*")
	log.Println("🔔 Notifications API: /api/notifications/*")
	log.Println("📱 Sentinel Mobile API: /api/sentinel/*")
	log.Println("📘 Facebook API: /api/facebook/*")
	log.Println("🚂 Operators API: /api/operators/*")
	log.Println("🤖 AI Chat API: /api/ai/chat")
	log.Println("🎫 Bookings API: /api/bookings/*")
	log.Println("💳 Payments API: /api/payments")
	log.Fatal(http.ListenAndServe(":"+port, corsMiddleware(mux)))
}
