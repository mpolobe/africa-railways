package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHandleReport_Success(t *testing.T) {
	report := SentinelReport{
		SentinelID: "SENTINEL-001",
		Lat:        -15.4167,
		Long:       28.2833,
		Status:     "active",
	}

	body, err := json.Marshal(report)
	if err != nil {
		t.Fatalf("Failed to marshal report: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/sentinel/report", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handleReport(w, req)

	if w.Code != http.StatusAccepted {
		t.Errorf("Expected status %d, got %d", http.StatusAccepted, w.Code)
	}

	var response map[string]string
	if err := json.NewDecoder(w.Body).Decode(&response); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if response["status"] != "accepted" {
		t.Errorf("Expected status 'accepted', got '%s'", response["status"])
	}
}

func TestHandleReport_InvalidMethod(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/sentinel/report", nil)
	w := httptest.NewRecorder()

	handleReport(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("Expected status %d, got %d", http.StatusMethodNotAllowed, w.Code)
	}
}

func TestHandleReport_InvalidJSON(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/v1/sentinel/report", bytes.NewReader([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handleReport(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestHandleReport_EmptyBody(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/v1/sentinel/report", bytes.NewReader([]byte("")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handleReport(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}
