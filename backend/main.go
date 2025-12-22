package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var (
	startTime = time.Now()
	upgrader  = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true }, // Allow iPad connection
	}
)

type Event struct {
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
	ID        string    `json:"id"` // Unique hash for the "Sui" block
}

type SentinelData struct {
	Status       string   `json:"status"`
	TotalSupply  string   `json:"total_supply"`
	MintedCount  int      `json:"minted_count"`
	RecentEvents []Event  `json:"recent_events"`
	Uptime       string   `json:"uptime"`
	Version      string   `json:"version"`
	mu           sync.Mutex
}

var stats = &SentinelData{
	Status:      "ok",
	TotalSupply: "1,000,000,000",
	Version:     "1.0.0",
	RecentEvents: []Event{
		{
			Message:   fmt.Sprintf("System Online at %s", time.Now().Format(time.Kitchen)),
			Timestamp: time.Now(),
			ID:        generateEventID("System Online", time.Now()),
		},
	},
}

// generateEventID creates a unique hash for each event (like a Sui block hash)
func generateEventID(message string, timestamp time.Time) string {
	data := fmt.Sprintf("%s-%d", message, timestamp.UnixNano())
	hash := sha256.Sum256([]byte(data))
	return "0x" + hex.EncodeToString(hash[:])[:16] // Return first 16 chars with 0x prefix
}

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		
		next(w, r)
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	stats.mu.Lock()
	stats.Uptime = time.Since(startTime).Round(time.Second).String()
	data := *stats
	stats.mu.Unlock()
	json.NewEncoder(w).Encode(data)
}

func eventHandler(w http.ResponseWriter, r *http.Request) {
	var newEvent Event
	if err := json.NewDecoder(r.Body).Decode(&newEvent); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Add timestamp if not provided
	if newEvent.Timestamp.IsZero() {
		newEvent.Timestamp = time.Now()
	}
	
	// Generate unique ID if not provided
	if newEvent.ID == "" {
		newEvent.ID = generateEventID(newEvent.Message, newEvent.Timestamp)
	}

	stats.mu.Lock()
	stats.RecentEvents = append(stats.RecentEvents, newEvent)
	stats.MintedCount++
	
	// Keep only last 50 events
	if len(stats.RecentEvents) > 50 {
		stats.RecentEvents = stats.RecentEvents[len(stats.RecentEvents)-50:]
	}
	stats.mu.Unlock()

	log.Printf("📩 Event received: %s [ID: %s]", newEvent.Message, newEvent.ID)
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "success",
		"id":     newEvent.ID,
	})
}

func historyHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	stats.mu.Lock()
	defer stats.mu.Unlock()
	json.NewEncoder(w).Encode(stats.RecentEvents)
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	log.Println("📡 WebSocket client connected")

	// Keep connection open and send updates
	for {
		time.Sleep(1 * time.Second)
		stats.mu.Lock()
		err := conn.WriteJSON(stats.RecentEvents)
		stats.mu.Unlock()
		
		if err != nil {
			log.Println("📡 WebSocket client disconnected")
			break
		}
	}
}

func main() {
	// Setup routes
	http.HandleFunc("/health", corsMiddleware(healthHandler))
	http.HandleFunc("/add-event", corsMiddleware(eventHandler))
	http.HandleFunc("/history", corsMiddleware(historyHandler))
	http.HandleFunc("/ws", wsHandler)

	fmt.Println("🚀 Africa Railways Backend Server")
	fmt.Println("📡 WebSocket support enabled")
	fmt.Println("🌐 Running on :8080")
	fmt.Println("")
	fmt.Println("Endpoints:")
	fmt.Println("  GET  /health     - Health check")
	fmt.Println("  POST /add-event  - Add new event")
	fmt.Println("  GET  /history    - Get event history")
	fmt.Println("  WS   /ws         - WebSocket connection")
	fmt.Println("")
	
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
