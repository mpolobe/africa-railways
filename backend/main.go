package main

import (
	"encoding/json"
	"log"
	"net/http"
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
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
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

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/ws", wsHandler)
	mux.HandleFunc("/add-event", addEventHandler)
	mux.HandleFunc("/health", healthHandler)
	mux.HandleFunc("/api/reports", reportsHandler)

	log.Println("🛰️  Sentinel Engine Live on :8080")
	log.Println("📡 WebSocket endpoint: /ws")
	log.Println("📩 Add event endpoint: /add-event")
	log.Println("💚 Health check: /health")
	log.Println("📊 Reports API: /api/reports")
	log.Fatal(http.ListenAndServe(":8080", corsMiddleware(mux)))
}
