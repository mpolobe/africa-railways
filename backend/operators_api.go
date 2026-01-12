package main

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

// Operator represents a railway operator
type Operator struct {
	ID            string   `json:"id"`
	Name          string   `json:"name"`
	ShortName     string   `json:"shortName"`
	Country       string   `json:"country"`
	Region        string   `json:"region"`
	Type          string   `json:"type"`
	Services      []string `json:"services"`
	Website       string   `json:"website"`
	Currency      string   `json:"currency"`
	TrackGauge    string   `json:"trackGauge"`
	NetworkLength int      `json:"networkLength"`
	Established   int      `json:"established"`
	Status        string   `json:"status"`
	Description   string   `json:"description"`
}

// OperatorsData represents the full operators JSON structure
type OperatorsData struct {
	Metadata struct {
		TotalOperators int      `json:"totalOperators"`
		LastUpdated    string   `json:"lastUpdated"`
		Regions        []string `json:"regions"`
		Source         string   `json:"source"`
	} `json:"metadata"`
	Operators []Operator `json:"operators"`
}

// APIKey represents an issued API key
type APIKey struct {
	Key         string    `json:"key"`
	OperatorID  string    `json:"operatorId"`
	Name        string    `json:"name"`
	Email       string    `json:"email"`
	CreatedAt   time.Time `json:"createdAt"`
	LastUsed    time.Time `json:"lastUsed"`
	RequestCount int64    `json:"requestCount"`
	Active      bool      `json:"active"`
}

var (
	operatorsData *OperatorsData
	apiKeys       = make(map[string]*APIKey)
	apiKeysMu     sync.RWMutex
	operatorsOnce sync.Once
)

// loadOperators loads operators from JSON file
func loadOperators() error {
	var loadErr error
	operatorsOnce.Do(func() {
		data, err := os.ReadFile("data/operators.json")
		if err != nil {
			loadErr = fmt.Errorf("failed to read operators.json: %w", err)
			return
		}

		operatorsData = &OperatorsData{}
		if err := json.Unmarshal(data, operatorsData); err != nil {
			loadErr = fmt.Errorf("failed to parse operators.json: %w", err)
			return
		}

		log.Printf("✅ Loaded %d operators from data/operators.json", len(operatorsData.Operators))
	})
	return loadErr
}

// generateAPIKey creates a secure random API key
func generateAPIKey() string {
	bytes := make([]byte, 32)
	rand.Read(bytes)
	hash := sha256.Sum256(bytes)
	return "afr_" + hex.EncodeToString(hash[:])[:32]
}

// operatorsListHandler returns all operators
func operatorsListHandler(w http.ResponseWriter, r *http.Request) {
	if err := loadOperators(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	// Filter by region if specified
	region := r.URL.Query().Get("region")
	country := r.URL.Query().Get("country")

	if region == "" && country == "" {
		json.NewEncoder(w).Encode(operatorsData)
		return
	}

	filtered := []Operator{}
	for _, op := range operatorsData.Operators {
		if region != "" && !strings.EqualFold(op.Region, region) {
			continue
		}
		if country != "" && !strings.EqualFold(op.Country, country) {
			continue
		}
		filtered = append(filtered, op)
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"operators": filtered,
		"count":     len(filtered),
	})
}

// operatorByIDHandler returns a single operator by ID
func operatorByIDHandler(w http.ResponseWriter, r *http.Request) {
	if err := loadOperators(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "id parameter required", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	for _, op := range operatorsData.Operators {
		if strings.EqualFold(op.ID, id) || strings.EqualFold(op.ShortName, id) {
			json.NewEncoder(w).Encode(op)
			return
		}
	}

	http.Error(w, "operator not found", http.StatusNotFound)
}

// operatorsRegionsHandler returns available regions
func operatorsRegionsHandler(w http.ResponseWriter, r *http.Request) {
	if err := loadOperators(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"regions": operatorsData.Metadata.Regions,
	})
}

// operatorsCountriesHandler returns countries with operators
func operatorsCountriesHandler(w http.ResponseWriter, r *http.Request) {
	if err := loadOperators(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	countries := make(map[string]int)
	for _, op := range operatorsData.Operators {
		countries[op.Country]++
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"countries": countries,
		"count":     len(countries),
	})
}

// APIKeyRequest represents a request to generate an API key
type APIKeyRequest struct {
	OperatorID string `json:"operatorId"`
	Name       string `json:"name"`
	Email      string `json:"email"`
}

// generateAPIKeyHandler creates a new API key for an operator
func generateAPIKeyHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "POST required", http.StatusMethodNotAllowed)
		return
	}

	if err := loadOperators(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var req APIKeyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.OperatorID == "" || req.Name == "" || req.Email == "" {
		http.Error(w, "operatorId, name, and email are required", http.StatusBadRequest)
		return
	}

	// Verify operator exists
	var operator *Operator
	for _, op := range operatorsData.Operators {
		if strings.EqualFold(op.ID, req.OperatorID) {
			operator = &op
			break
		}
	}

	if operator == nil {
		http.Error(w, "operator not found", http.StatusNotFound)
		return
	}

	// Generate API key
	key := generateAPIKey()
	apiKey := &APIKey{
		Key:        key,
		OperatorID: req.OperatorID,
		Name:       req.Name,
		Email:      req.Email,
		CreatedAt:  time.Now(),
		LastUsed:   time.Now(),
		Active:     true,
	}

	apiKeysMu.Lock()
	apiKeys[key] = apiKey
	apiKeysMu.Unlock()

	log.Printf("🔑 API key generated for %s (%s)", operator.Name, req.Email)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"apiKey":   key,
		"operator": operator.Name,
		"message":  "Store this key securely. It will not be shown again.",
	})
}

// validateAPIKeyHandler validates an API key
func validateAPIKeyHandler(w http.ResponseWriter, r *http.Request) {
	key := r.Header.Get("X-API-Key")
	if key == "" {
		key = r.URL.Query().Get("key")
	}

	if key == "" {
		http.Error(w, "API key required", http.StatusUnauthorized)
		return
	}

	apiKeysMu.RLock()
	apiKey, exists := apiKeys[key]
	apiKeysMu.RUnlock()

	w.Header().Set("Content-Type", "application/json")

	if !exists || !apiKey.Active {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"valid": false,
			"error": "invalid or inactive API key",
		})
		return
	}

	// Update last used
	apiKeysMu.Lock()
	apiKey.LastUsed = time.Now()
	apiKey.RequestCount++
	apiKeysMu.Unlock()

	json.NewEncoder(w).Encode(map[string]interface{}{
		"valid":        true,
		"operatorId":   apiKey.OperatorID,
		"name":         apiKey.Name,
		"requestCount": apiKey.RequestCount,
	})
}

// operatorsMetadataHandler returns operators metadata
func operatorsMetadataHandler(w http.ResponseWriter, r *http.Request) {
	if err := loadOperators(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(operatorsData.Metadata)
}

// operatorsSearchHandler searches operators by name
func operatorsSearchHandler(w http.ResponseWriter, r *http.Request) {
	if err := loadOperators(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	query := strings.ToLower(r.URL.Query().Get("q"))
	if query == "" {
		http.Error(w, "q parameter required", http.StatusBadRequest)
		return
	}

	results := []Operator{}
	for _, op := range operatorsData.Operators {
		if strings.Contains(strings.ToLower(op.Name), query) ||
			strings.Contains(strings.ToLower(op.ShortName), query) ||
			strings.Contains(strings.ToLower(op.Country), query) {
			results = append(results, op)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"results": results,
		"count":   len(results),
		"query":   query,
	})
}
