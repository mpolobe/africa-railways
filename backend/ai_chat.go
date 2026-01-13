package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"sync"
	"time"
)

// OpenAI API structures
type OpenAIChatRequest struct {
	Model       string          `json:"model"`
	Messages    []OpenAIMessage `json:"messages"`
	MaxTokens   int             `json:"max_tokens"`
	Temperature float64         `json:"temperature"`
}

type OpenAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type OpenAIChatResponse struct {
	ID      string `json:"id"`
	Object  string `json:"object"`
	Created int64  `json:"created"`
	Model   string `json:"model"`
	Choices []struct {
		Index   int `json:"index"`
		Message struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		} `json:"message"`
		FinishReason string `json:"finish_reason"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
	Error *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
		Code    string `json:"code"`
	} `json:"error,omitempty"`
}

// AI Chat request/response for our API
type AIChatRequest struct {
	Message string `json:"message"`
	Context string `json:"context,omitempty"`
}

type AIChatResponse struct {
	Response string `json:"response"`
	Error    string `json:"error,omitempty"`
}

// Cache for API key
var (
	openaiAPIKey     string
	openaiKeyMutex   sync.RWMutex
	openaiKeyLastFetch time.Time
	openaiKeyCacheTTL  = 5 * time.Minute
)

// System context for the AI assistant
const aiSystemContext = `You are an AI assistant for Africa Railways Sentinel Dashboard. 
You help railway safety officers, track inspectors, and station masters with:
- Railway safety protocols and procedures
- Track inspection guidelines
- Incident reporting assistance
- Equipment maintenance schedules
- Emergency response procedures
- TAZARA railway operations (Tanzania-Zambia Railway)
- Train scheduling and delays
- Passenger safety information

Keep responses concise and professional. Use bullet points for lists.
If asked about specific incidents, remind users to file official reports through the dashboard.`

// getOpenAIKey retrieves the API key from database with caching
func getOpenAIKey() (string, error) {
	openaiKeyMutex.RLock()
	if openaiAPIKey != "" && time.Since(openaiKeyLastFetch) < openaiKeyCacheTTL {
		key := openaiAPIKey
		openaiKeyMutex.RUnlock()
		return key, nil
	}
	openaiKeyMutex.RUnlock()

	// Fetch from database
	openaiKeyMutex.Lock()
	defer openaiKeyMutex.Unlock()

	// Double-check after acquiring write lock
	if openaiAPIKey != "" && time.Since(openaiKeyLastFetch) < openaiKeyCacheTTL {
		return openaiAPIKey, nil
	}

	if db == nil {
		return "", fmt.Errorf("database not initialized")
	}

	var key string
	err := db.QueryRow(`
		SELECT api_key FROM api_keys 
		WHERE service_name = 'openai' AND is_active = true
	`).Scan(&key)

	if err != nil {
		return "", fmt.Errorf("failed to get OpenAI API key: %w", err)
	}

	if key == "" || key == "placeholder" {
		return "", fmt.Errorf("OpenAI API key not configured")
	}

	openaiAPIKey = key
	openaiKeyLastFetch = time.Now()
	return key, nil
}

// aiChatHandler handles AI chat requests
func aiChatHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse request
	var req AIChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendAIError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Message == "" {
		sendAIError(w, "Message is required", http.StatusBadRequest)
		return
	}

	// Get API key
	apiKey, err := getOpenAIKey()
	if err != nil {
		log.Printf("AI Chat: Failed to get API key: %v", err)
		sendAIError(w, "AI service not configured. Please contact administrator.", http.StatusServiceUnavailable)
		return
	}

	// Build OpenAI request
	openaiReq := OpenAIChatRequest{
		Model: "gpt-3.5-turbo",
		Messages: []OpenAIMessage{
			{Role: "system", Content: aiSystemContext},
			{Role: "user", Content: req.Message},
		},
		MaxTokens:   1024,
		Temperature: 0.7,
	}

	reqBody, err := json.Marshal(openaiReq)
	if err != nil {
		sendAIError(w, "Failed to prepare request", http.StatusInternalServerError)
		return
	}

	// Call OpenAI API
	httpReq, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(reqBody))
	if err != nil {
		sendAIError(w, "Failed to create request", http.StatusInternalServerError)
		return
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		log.Printf("AI Chat: OpenAI API error: %v", err)
		sendAIError(w, "Failed to connect to AI service", http.StatusServiceUnavailable)
		return
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		sendAIError(w, "Failed to read AI response", http.StatusInternalServerError)
		return
	}

	var openaiResp OpenAIChatResponse
	if err := json.Unmarshal(body, &openaiResp); err != nil {
		log.Printf("AI Chat: Failed to parse response: %v", err)
		sendAIError(w, "Failed to parse AI response", http.StatusInternalServerError)
		return
	}

	// Check for API errors
	if openaiResp.Error != nil {
		log.Printf("AI Chat: OpenAI error: %s (%s)", openaiResp.Error.Message, openaiResp.Error.Code)
		
		if openaiResp.Error.Code == "insufficient_quota" {
			sendAIError(w, "AI service quota exceeded. Please contact administrator.", http.StatusServiceUnavailable)
		} else if openaiResp.Error.Code == "invalid_api_key" {
			// Clear cached key
			openaiKeyMutex.Lock()
			openaiAPIKey = ""
			openaiKeyMutex.Unlock()
			sendAIError(w, "AI service configuration error. Please contact administrator.", http.StatusServiceUnavailable)
		} else {
			sendAIError(w, "AI service error: "+openaiResp.Error.Message, http.StatusServiceUnavailable)
		}
		return
	}

	// Extract response
	if len(openaiResp.Choices) == 0 {
		sendAIError(w, "No response from AI", http.StatusInternalServerError)
		return
	}

	aiResponse := openaiResp.Choices[0].Message.Content

	// Send success response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AIChatResponse{
		Response: aiResponse,
	})

	log.Printf("AI Chat: Processed message (%d tokens used)", openaiResp.Usage.TotalTokens)
}

// sendAIError sends an error response
func sendAIError(w http.ResponseWriter, message string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(AIChatResponse{
		Error: message,
	})
}

// updateAPIKeyHandler allows updating API keys (admin only)
func updateAPIKeyHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse request
	var req struct {
		ServiceName string `json:"service_name"`
		APIKey      string `json:"api_key"`
		AdminKey    string `json:"admin_key"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Validate admin key (simple check - in production use proper auth)
	expectedAdminKey := getEnvOrDefault("ADMIN_API_KEY", "africa-railways-admin-2026")
	if req.AdminKey != expectedAdminKey {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if db == nil {
		http.Error(w, "Database not available", http.StatusServiceUnavailable)
		return
	}

	// Update API key
	_, err := db.Exec(`
		INSERT INTO api_keys (service_name, api_key, description)
		VALUES ($1, $2, $3)
		ON CONFLICT (service_name) 
		DO UPDATE SET api_key = $2, updated_at = CURRENT_TIMESTAMP
	`, req.ServiceName, req.APIKey, "Updated via API")

	if err != nil {
		log.Printf("Failed to update API key: %v", err)
		http.Error(w, "Failed to update API key", http.StatusInternalServerError)
		return
	}

	// Clear cache if it's the OpenAI key
	if req.ServiceName == "openai" {
		openaiKeyMutex.Lock()
		openaiAPIKey = ""
		openaiKeyMutex.Unlock()
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "success",
		"message": "API key updated",
	})

	log.Printf("API key updated for service: %s", req.ServiceName)
}
