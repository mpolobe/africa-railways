package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

type Event struct {
	Message string `json:"message"`
}

type SentinelData struct {
	Status       string   `json:"status"`
	TotalSupply  string   `json:"total_supply"`
	MintedCount  int      `json:"minted_count"`
	RecentEvents []Event  `json:"recent_events"`
	mu           sync.Mutex
}

var stats = &SentinelData{
	Status:      "ok",
	TotalSupply: "1,000,000,000",
	RecentEvents: []Event{
		{Message: fmt.Sprintf("System Online at %s", time.Now().Format(time.Kitchen))},
	},
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	stats.mu.Lock()
	defer stats.mu.Unlock()
	json.NewEncoder(w).Encode(stats)
}

func eventHandler(w http.ResponseWriter, r *http.Request) {
	var newEvent Event
	if err := json.NewDecoder(r.Body).Decode(&newEvent); err == nil {
		stats.mu.Lock()
		stats.RecentEvents = append(stats.RecentEvents, newEvent)
		stats.MintedCount++
		stats.mu.Unlock()
		w.WriteHeader(http.StatusOK)
	}
}

func main() {
	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/add-event", eventHandler)
	fmt.Println("🚀 Sentinel Backend running on :8080")
	http.ListenAndServe(":8080", nil)
}
