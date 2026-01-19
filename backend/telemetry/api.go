// Package telemetry provides HTTP API handlers for GPS telemetry
package telemetry

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

// APIHandler provides HTTP endpoints for telemetry data
type APIHandler struct {
	engine   *IngestEngine
	upgrader websocket.Upgrader
}

// NewAPIHandler creates a new telemetry API handler
func NewAPIHandler(engine *IngestEngine) *APIHandler {
	return &APIHandler{
		engine: engine,
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true // Allow all origins for development
			},
		},
	}
}

// RegisterRoutes registers HTTP routes for telemetry API
func (h *APIHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/telemetry", h.handleIngest)
	mux.HandleFunc("/api/v1/telemetry/positions", h.handleGetPositions)
	mux.HandleFunc("/api/v1/telemetry/positions/", h.handleGetPosition)
	mux.HandleFunc("/api/v1/telemetry/routes", h.handleGetRoutes)
	mux.HandleFunc("/api/v1/telemetry/stations", h.handleGetStations)
	mux.HandleFunc("/api/v1/telemetry/ws", h.handleWebSocket)
}

// handleIngest processes incoming GPS telemetry data
// POST /api/v1/telemetry
func (h *APIHandler) handleIngest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Validate API key
	apiKey := r.Header.Get("X-API-Key")
	if !validateAPIKey(apiKey) {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var msg TelemetryMessage
	if err := json.NewDecoder(r.Body).Decode(&msg); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Set timestamp if not provided
	if msg.Timestamp.IsZero() {
		msg.Timestamp = time.Now().UTC()
	}

	if err := h.engine.Ingest(&msg); err != nil {
		log.Printf("Failed to ingest telemetry: %v", err)
		http.Error(w, "Failed to process telemetry", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "accepted",
		"message": "Telemetry data received",
	})
}

// handleGetPositions returns all current train positions
// GET /api/v1/telemetry/positions
func (h *APIHandler) handleGetPositions(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	positions := h.engine.GetAllPositions()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"count":     len(positions),
		"positions": positions,
		"timestamp": time.Now().UTC(),
	})
}

// handleGetPosition returns position for a specific train
// GET /api/v1/telemetry/positions/{trainID}
func (h *APIHandler) handleGetPosition(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract train ID from path
	trainID := r.URL.Path[len("/api/v1/telemetry/positions/"):]
	if trainID == "" {
		http.Error(w, "Train ID required", http.StatusBadRequest)
		return
	}

	position, ok := h.engine.GetPosition(trainID)
	if !ok {
		http.Error(w, "Train not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(position)
}

// handleGetRoutes returns all available routes
// GET /api/v1/telemetry/routes
func (h *APIHandler) handleGetRoutes(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	routes := []Route{}
	for _, route := range h.engine.routes {
		routes = append(routes, *route)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"count":  len(routes),
		"routes": routes,
	})
}

// handleGetStations returns all stations
// GET /api/v1/telemetry/stations
func (h *APIHandler) handleGetStations(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	stations := []Station{}
	for _, station := range h.engine.stations {
		stations = append(stations, *station)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"count":    len(stations),
		"stations": stations,
	})
}

// handleWebSocket provides real-time position updates via WebSocket
// GET /api/v1/telemetry/ws
func (h *APIHandler) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	// Subscribe to position updates
	updates := h.engine.Subscribe()
	defer h.engine.Unsubscribe(updates)

	// Send initial positions
	positions := h.engine.GetAllPositions()
	for _, pos := range positions {
		data, _ := pos.ToJSON()
		if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
			log.Printf("WebSocket write error: %v", err)
			return
		}
	}

	// Stream updates to client
	for update := range updates {
		data, _ := update.ToJSON()
		if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
			log.Printf("WebSocket write error: %v", err)
			return
		}
	}
}

// validateAPIKey checks if the provided API key is valid
func validateAPIKey(key string) bool {
	// In production, validate against database or environment variable
	if key == "" {
		return false
	}
	// For now, accept any non-empty key
	// TODO: Implement proper API key validation
	return true
}
