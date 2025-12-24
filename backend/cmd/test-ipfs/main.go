package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"
)

// TicketMetadata represents the NFT metadata
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

// PinataResponse represents the response from Pinata
type PinataResponse struct {
	IpfsHash  string    `json:"IpfsHash"`
	PinSize   int       `json:"PinSize"`
	Timestamp time.Time `json:"Timestamp"`
}

func main() {
	// Load environment variables
	if err := godotenv.Load("/workspaces/africa-railways/.env"); err != nil {
		log.Printf("Warning: .env file not found")
	}

	fmt.Println("📤 IPFS Upload Test - Pinata")
	fmt.Println("=" + string(make([]byte, 50)))

	// Get API credentials - try JWT first, then API key/secret
	jwt := os.Getenv("PINATA_JWT")
	apiKey := os.Getenv("PINATA_API_KEY")
	secretKey := os.Getenv("PINATA_SECRET_KEY")
	
	if jwt == "" && apiKey == "" {
		log.Fatal("❌ PINATA_JWT or PINATA_API_KEY must be set")
	}

	fmt.Println("\n✅ Configuration:")
	if jwt != "" {
		if len(jwt) > 20 {
			fmt.Printf("   JWT Token: %s...%s\n", jwt[:10], jwt[len(jwt)-10:])
		} else {
			fmt.Printf("   JWT Token: %s\n", jwt)
		}
	} else {
		if len(apiKey) > 10 {
			fmt.Printf("   API Key: %s...\n", apiKey[:10])
		} else {
			fmt.Printf("   API Key: %s\n", apiKey)
		}
		if secretKey != "" && secretKey != "your_pinata_secret_key_here" {
			fmt.Println("   Secret Key: Configured")
		}
	}

	// Create sample ticket metadata
	fmt.Println("\n📋 Creating Sample Ticket Metadata...")
	
	ticketID := fmt.Sprintf("TKT%d", time.Now().Unix())
	departureTime := time.Now().Add(24 * time.Hour)
	
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

	// Display metadata
	jsonData, _ := json.MarshalIndent(metadata, "", "  ")
	fmt.Println("\n📄 Metadata to Upload:")
	fmt.Println(string(jsonData))

	// Upload to Pinata
	fmt.Println("\n📤 Uploading to Pinata IPFS...")
	ipfsHash, err := uploadToPinata(jwt, apiKey, secretKey, metadata)
	if err != nil {
		log.Fatalf("❌ Upload failed: %v", err)
	}

	fmt.Println("\n✅ Upload Successful!")
	fmt.Println("=" + string(make([]byte, 50)))
	fmt.Printf("\n📍 IPFS Hash: %s\n", ipfsHash)
	fmt.Printf("🔗 IPFS URI: ipfs://%s\n", ipfsHash)
	fmt.Printf("🌐 Gateway URL: https://gateway.pinata.cloud/ipfs/%s\n", ipfsHash)
	fmt.Printf("🌐 Alternative: https://ipfs.io/ipfs/%s\n", ipfsHash)

	fmt.Println("\n🎉 IPFS Integration Working!")
	fmt.Println("=" + string(make([]byte, 50)))
	fmt.Println("\n✅ You can now:")
	fmt.Println("   1. Upload ticket metadata to IPFS")
	fmt.Println("   2. Get permanent IPFS URIs")
	fmt.Println("   3. Use URIs in NFT minting")
	fmt.Println("   4. Access metadata via IPFS gateways")
}

// uploadToPinata uploads JSON metadata to Pinata
func uploadToPinata(jwt, apiKey, secretKey string, metadata TicketMetadata) (string, error) {
	url := "https://api.pinata.cloud/pinning/pinJSONToIPFS"

	// Prepare request body
	requestBody := map[string]interface{}{
		"pinataContent": metadata,
		"pinataMetadata": map[string]string{
			"name": metadata.Name,
		},
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return "", err
	}

	// Create HTTP request
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	
	// Try different authentication methods
	if jwt != "" {
		// Use JWT Bearer token method (preferred)
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", jwt))
	} else if secretKey != "" && secretKey != "your_pinata_secret_key_here" {
		// Use API Key + Secret Key method
		req.Header.Set("pinata_api_key", apiKey)
		req.Header.Set("pinata_secret_api_key", secretKey)
	} else {
		return "", fmt.Errorf("no valid authentication credentials provided")
	}

	// Send request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	// Check status
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("pinata API error: %s - %s", resp.Status, string(body))
	}

	// Parse response
	var result PinataResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return "", err
	}

	return result.IpfsHash, nil
}
