package uploader

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// TicketMetadata represents the NFT metadata structure
type TicketMetadata struct {
	Name        string                   `json:"name"`
	Description string                   `json:"description"`
	Image       string                   `json:"image"`
	ExternalURL string                   `json:"external_url,omitempty"`
	Attributes  []map[string]interface{} `json:"attributes"`
}

// PinataResponse represents the response from Pinata
type PinataResponse struct {
	IpfsHash  string    `json:"IpfsHash"`
	PinSize   int       `json:"PinSize"`
	Timestamp time.Time `json:"Timestamp"`
}

// Web3StorageResponse represents the response from Web3.Storage
type Web3StorageResponse struct {
	CID string `json:"cid"`
}

// MetadataUploader handles IPFS uploads
type MetadataUploader struct {
	apiKey   string
	provider string
}

// NewMetadataUploader creates a new uploader
func NewMetadataUploader(apiKey, provider string) *MetadataUploader {
	return &MetadataUploader{
		apiKey:   apiKey,
		provider: provider,
	}
}

// UploadMetadataToIPFS uploads ticket metadata to IPFS and returns the CID
func (u *MetadataUploader) UploadMetadataToIPFS(ticket TicketMetadata) (string, error) {
	switch u.provider {
	case "pinata":
		return u.uploadToPinata(ticket)
	case "web3storage":
		return u.uploadToWeb3Storage(ticket)
	default:
		return u.uploadToPinata(ticket) // Default to Pinata
	}
}

// uploadToPinata uploads metadata to Pinata
func (u *MetadataUploader) uploadToPinata(ticket TicketMetadata) (string, error) {
	url := "https://api.pinata.cloud/pinning/pinJSONToIPFS"

	// Prepare request body
	requestBody := map[string]interface{}{
		"pinataContent": ticket,
		"pinataMetadata": map[string]string{
			"name": ticket.Name,
		},
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal JSON: %w", err)
	}

	// Create HTTP request
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers - try JWT Bearer token format
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", u.apiKey))

	// Send request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	// Check status
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("pinata API error: %s - %s", resp.Status, string(body))
	}

	// Parse response
	var result PinataResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	return result.IpfsHash, nil
}

// uploadToWeb3Storage uploads metadata to Web3.Storage
func (u *MetadataUploader) uploadToWeb3Storage(ticket TicketMetadata) (string, error) {
	url := "https://api.web3.storage/upload"

	jsonData, err := json.Marshal(ticket)
	if err != nil {
		return "", fmt.Errorf("failed to marshal JSON: %w", err)
	}

	// Create HTTP request
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", u.apiKey))
	req.Header.Set("Content-Type", "application/json")

	// Send request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	// Check status
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("web3.storage API error: %s - %s", resp.Status, string(body))
	}

	// Parse response
	var result Web3StorageResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	return result.CID, nil
}

// CreateTicketMetadata creates metadata from ticket details
func CreateTicketMetadata(
	ticketID string,
	passengerName string,
	route string,
	class string,
	seat string,
	departureTime int64,
	price float64,
	imageIPFS string,
) TicketMetadata {
	return TicketMetadata{
		Name:        fmt.Sprintf("Africa Railways: Ticket #%s", ticketID),
		Description: fmt.Sprintf("%s Class Ticket - %s", class, route),
		Image:       imageIPFS,
		ExternalURL: fmt.Sprintf("https://africarailways.com/verify/%s", ticketID),
		Attributes: []map[string]interface{}{
			{
				"trait_type": "Route",
				"value":      route,
			},
			{
				"trait_type": "Class",
				"value":      class,
			},
			{
				"trait_type": "Seat",
				"value":      seat,
			},
			{
				"trait_type":   "Departure",
				"value":        departureTime,
				"display_type": "date",
			},
			{
				"trait_type": "Passenger",
				"value":      passengerName,
			},
			{
				"trait_type":   "Price",
				"value":        price,
				"display_type": "number",
			},
			{
				"trait_type": "Currency",
				"value":      "ZAR",
			},
		},
	}
}

// UploadTicketMetadata is a convenience function that creates and uploads metadata
func UploadTicketMetadata(
	apiKey string,
	provider string,
	ticketID string,
	passengerName string,
	route string,
	class string,
	seat string,
	departureTime int64,
	price float64,
	imageIPFS string,
) (string, error) {
	// Create metadata
	metadata := CreateTicketMetadata(
		ticketID,
		passengerName,
		route,
		class,
		seat,
		departureTime,
		price,
		imageIPFS,
	)

	// Upload to IPFS
	uploader := NewMetadataUploader(apiKey, provider)
	cid, err := uploader.UploadMetadataToIPFS(metadata)
	if err != nil {
		return "", err
	}

	return cid, nil
}

// GetIPFSURL returns the full IPFS URL for a CID
func GetIPFSURL(cid string, gateway string) string {
	if gateway == "" {
		gateway = "https://ipfs.io/ipfs/"
	}
	return gateway + cid
}

// GetIPFSURI returns the IPFS URI for a CID
func GetIPFSURI(cid string) string {
	return "ipfs://" + cid
}
