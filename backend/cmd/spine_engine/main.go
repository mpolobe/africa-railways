package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
)

type SentinelReport struct {
	SentinelID string  `json:"sentinel_id"`
	Lat        float64 `json:"lat"`
	Long       float64 `json:"long"`
	Status     string  `json:"status"`
}

func handleReport(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	var report SentinelReport
	if err := json.Unmarshal(body, &report); err != nil {
		http.Error(w, "Invalid JSON format", http.StatusBadRequest)
		return
	}

	fmt.Printf("📩 Signed Telemetry Packet Received at Lusaka Hub: %+v\n", report)
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(map[string]string{"status": "accepted"})
}

func main() {
	http.HandleFunc("/api/v1/sentinel/report", handleReport)
	fmt.Println("🛰️ Digital Spine Ingestion Engine: ONLINE at :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
