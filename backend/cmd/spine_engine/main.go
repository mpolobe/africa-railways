package main

import (
	"fmt"
	"net/http"
)

type SentinelReport struct {
	SentinelID string  `json:"sentinel_id"`
	Lat        float64 `json:"lat"`
	Long       float64 `json:"long"`
	Status     string  `json:"status"`
}

func handleReport(w http.ResponseWriter, r *http.Request) {
	fmt.Println("📩 Signed Telemetry Packet Received at Lusaka Hub")
	w.WriteHeader(http.StatusAccepted)
}

func main() {
	http.HandleFunc("/api/v1/sentinel/report", handleReport)
	fmt.Println("🛰️ Digital Spine Ingestion Engine: ONLINE at :8080")
	http.ListenAndServe(":8080", nil)
}
