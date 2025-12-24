package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"
)

// Simplified metadata structures for testing
type TicketMetadata struct {
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Image       string            `json:"image"`
	ExternalURL string            `json:"external_url"`
	Attributes  []TicketAttribute `json:"attributes"`
}

type TicketAttribute struct {
	TraitType   string      `json:"trait_type"`
	Value       interface{} `json:"value"`
	DisplayType string      `json:"display_type,omitempty"`
}

func main() {
	fmt.Println("🧪 Testing Ticket Metadata Generation")
	fmt.Println("=" + string(make([]byte, 50)))

	// Create sample ticket
	ticketID := fmt.Sprintf("TKT%d", time.Now().Unix())
	departureTime := time.Now().Add(24 * time.Hour)
	arrivalTime := departureTime.Add(20 * time.Hour)

	metadata := TicketMetadata{
		Name:        fmt.Sprintf("Africa Railways: Ticket #%s", ticketID),
		Description: "Standard Class Ticket - Johannesburg to Cape Town",
		Image:       "ipfs://QmYourTicketDesignCID",
		ExternalURL: fmt.Sprintf("https://africarailways.com/verify/%s", ticketID),
		Attributes: []TicketAttribute{
			{TraitType: "Route", Value: "JHB-CPT"},
			{TraitType: "Class", Value: "Standard"},
			{TraitType: "Seat", Value: "14A"},
			{
				TraitType:   "Departure",
				Value:       departureTime.Unix(),
				DisplayType: "date",
			},
			{
				TraitType:   "Arrival",
				Value:       arrivalTime.Unix(),
				DisplayType: "date",
			},
			{TraitType: "Passenger", Value: "John Doe"},
			{TraitType: "Phone", Value: "+27123456789"},
			{
				TraitType:   "Price",
				Value:       450.00,
				DisplayType: "number",
			},
			{TraitType: "Currency", Value: "ZAR"},
		},
	}

	// Convert to JSON
	jsonData, err := json.MarshalIndent(metadata, "", "  ")
	if err != nil {
		log.Fatalf("Failed to marshal JSON: %v", err)
	}

	fmt.Println("\n📋 Generated Metadata:")
	fmt.Println(string(jsonData))

	// Validate structure
	fmt.Println("\n✅ Validation:")
	fmt.Printf("   Name: %s\n", metadata.Name)
	fmt.Printf("   Description: %s\n", metadata.Description)
	fmt.Printf("   Attributes: %d\n", len(metadata.Attributes))
	fmt.Printf("   Image URI: %s\n", metadata.Image)
	fmt.Printf("   External URL: %s\n", metadata.ExternalURL)

	// Test IPFS mock upload
	fmt.Println("\n📤 Mock IPFS Upload:")
	mockHash := fmt.Sprintf("QmMockMetadata%d", time.Now().Unix())
	mockURI := fmt.Sprintf("ipfs://%s", mockHash)
	fmt.Printf("   ✅ Metadata URI: %s\n", mockURI)

	// Display human-readable ticket info
	fmt.Println("\n🎫 Ticket Information:")
	fmt.Printf("   Ticket ID: %s\n", ticketID)
	fmt.Printf("   Route: Johannesburg → Cape Town\n")
	fmt.Printf("   Class: Standard\n")
	fmt.Printf("   Seat: 14A\n")
	fmt.Printf("   Departure: %s\n", departureTime.Format("2006-01-02 15:04 MST"))
	fmt.Printf("   Arrival: %s\n", arrivalTime.Format("2006-01-02 15:04 MST"))
	fmt.Printf("   Passenger: John Doe\n")
	fmt.Printf("   Price: R450.00 ZAR\n")

	fmt.Println("\n" + string(make([]byte, 50)))
	fmt.Println("✅ Metadata generation test complete!")
}
