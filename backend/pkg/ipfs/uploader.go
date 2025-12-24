package ipfs

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"time"
)

// PinataResponse represents the response from Pinata IPFS service
type PinataResponse struct {
	IpfsHash  string    `json:"IpfsHash"`
	PinSize   int       `json:"PinSize"`
	Timestamp time.Time `json:"Timestamp"`
}

// NFTStorageResponse represents the response from NFT.Storage
type NFTStorageResponse struct {
	Ok    bool   `json:"ok"`
	Value struct {
		CID string `json:"cid"`
	} `json:"value"`
}

// Uploader handles IPFS uploads
type Uploader struct {
	apiKey  string
	service string // "pinata" or "nft.storage"
}

// NewUploader creates a new IPFS uploader
func NewUploader(service string) *Uploader {
	var apiKey string
	
	switch service {
	case "pinata":
		apiKey = os.Getenv("PINATA_API_KEY")
	case "nft.storage":
		apiKey = os.Getenv("NFT_STORAGE_API_KEY")
	default:
		service = "pinata"
		apiKey = os.Getenv("PINATA_API_KEY")
	}
	
	return &Uploader{
		apiKey:  apiKey,
		service: service,
	}
}

// UploadJSON uploads JSON metadata to IPFS
func (u *Uploader) UploadJSON(data interface{}) (string, error) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return "", fmt.Errorf("failed to marshal JSON: %w", err)
	}
	
	switch u.service {
	case "pinata":
		return u.uploadToPinata(jsonData)
	case "nft.storage":
		return u.uploadToNFTStorage(jsonData)
	default:
		return "", fmt.Errorf("unsupported IPFS service: %s", u.service)
	}
}

// uploadToPinata uploads data to Pinata
func (u *Uploader) uploadToPinata(data []byte) (string, error) {
	url := "https://api.pinata.cloud/pinning/pinJSONToIPFS"
	
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(data))
	if err != nil {
		return "", err
	}
	
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("pinata_api_key", u.apiKey)
	req.Header.Set("pinata_secret_api_key", os.Getenv("PINATA_SECRET_KEY"))
	
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("pinata API error: %s - %s", resp.Status, string(body))
	}
	
	var result PinataResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}
	
	return fmt.Sprintf("ipfs://%s", result.IpfsHash), nil
}

// uploadToNFTStorage uploads data to NFT.Storage
func (u *Uploader) uploadToNFTStorage(data []byte) (string, error) {
	url := "https://api.nft.storage/upload"
	
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	
	part, err := writer.CreateFormFile("file", "metadata.json")
	if err != nil {
		return "", err
	}
	
	if _, err := part.Write(data); err != nil {
		return "", err
	}
	
	if err := writer.Close(); err != nil {
		return "", err
	}
	
	req, err := http.NewRequest("POST", url, body)
	if err != nil {
		return "", err
	}
	
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", u.apiKey))
	
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("NFT.Storage API error: %s - %s", resp.Status, string(body))
	}
	
	var result NFTStorageResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}
	
	if !result.Ok {
		return "", fmt.Errorf("NFT.Storage upload failed")
	}
	
	return fmt.Sprintf("ipfs://%s", result.Value.CID), nil
}

// UploadFile uploads a file to IPFS
func (u *Uploader) UploadFile(filePath string) (string, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to read file: %w", err)
	}
	
	// For simplicity, using the same upload methods
	// In production, you'd want separate file upload logic
	return u.uploadToPinata(data)
}

// MockUploader returns a mock IPFS hash for testing
type MockUploader struct{}

func NewMockUploader() *MockUploader {
	return &MockUploader{}
}

func (m *MockUploader) UploadJSON(data interface{}) (string, error) {
	// Generate a mock IPFS hash
	hash := fmt.Sprintf("QmMock%d", time.Now().Unix())
	return fmt.Sprintf("ipfs://%s", hash), nil
}

func (m *MockUploader) UploadFile(filePath string) (string, error) {
	hash := fmt.Sprintf("QmMockFile%d", time.Now().Unix())
	return fmt.Sprintf("ipfs://%s", hash), nil
}
