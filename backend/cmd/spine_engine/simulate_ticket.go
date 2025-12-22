package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

func main() {
	fmt.Println("🎟️  Simulating Train Ticket Purchase...")

	eventData := map[string]string{
		"message": fmt.Sprintf("🪙 Africoin Minted: Passenger 0x924... received 50 AFRC at %s", time.Now().Format(time.Kitchen)),
	}
	jsonData, _ := json.Marshal(eventData)

	resp, err := http.Post("http://localhost:8080/add-event", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}
	defer resp.Body.Close()
	fmt.Println("✅ Event pushed to Dashboard!")
}
