package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

// FacebookPost represents a post to be shared on Facebook
type FacebookPost struct {
	Message string `json:"message"`
	Link    string `json:"link,omitempty"`
}

// FacebookResponse represents the response from Facebook API
type FacebookResponse struct {
	ID    string `json:"id,omitempty"`
	Error struct {
		Message string `json:"message"`
		Type    string `json:"type"`
		Code    int    `json:"code"`
	} `json:"error,omitempty"`
}

// PostToFacebookPage posts content to the facebook.com/afrcsentinel page
func PostToFacebookPage(message string) (*FacebookResponse, error) {
	pageID := os.Getenv("FACEBOOK_PAGE_ID")
	pageAccessToken := os.Getenv("FACEBOOK_PAGE_ACCESS_TOKEN")

	if pageID == "" || pageAccessToken == "" {
		return nil, fmt.Errorf("Facebook credentials not configured")
	}

	// Prepare the post data
	postData := map[string]string{
		"message":      message,
		"access_token": pageAccessToken,
	}

	jsonData, err := json.Marshal(postData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal post data: %w", err)
	}

	// Make request to Facebook Graph API
	url := fmt.Sprintf("https://graph.facebook.com/v18.0/%s/feed", pageID)
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to post to Facebook: %w", err)
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	// Parse response
	var fbResponse FacebookResponse
	if err := json.Unmarshal(body, &fbResponse); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	// Check for errors
	if fbResponse.Error.Message != "" {
		return &fbResponse, fmt.Errorf("Facebook API error: %s", fbResponse.Error.Message)
	}

	return &fbResponse, nil
}

// facebookShareHandler handles requests to share posts to Facebook
func facebookShareHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		PostID  string `json:"post_id"`
		Message string `json:"message"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Validate
	if req.Message == "" {
		http.Error(w, "message is required", http.StatusBadRequest)
		return
	}

	// Add hashtags
	message := fmt.Sprintf("%s\n\n#AfricaRailways #Sentinel #RailwaySafety", req.Message)

	// Post to Facebook
	fbResponse, err := PostToFacebookPage(message)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":      true,
		"facebook_id":  fbResponse.ID,
		"message":      "Successfully posted to facebook.com/afrcsentinel",
	})
}

// facebookStatusHandler checks if Facebook integration is configured
func facebookStatusHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	pageID := os.Getenv("FACEBOOK_PAGE_ID")
	pageAccessToken := os.Getenv("FACEBOOK_PAGE_ACCESS_TOKEN")

	configured := pageID != "" && pageAccessToken != ""

	json.NewEncoder(w).Encode(map[string]interface{}{
		"configured": configured,
		"page_id":    pageID,
	})
}
