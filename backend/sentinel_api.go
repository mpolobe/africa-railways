package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
)

// SentinelAlert represents an alert submitted by a sentinel
type SentinelAlert struct {
	ID          int64     `json:"id"`
	SentinelID  string    `json:"sentinel_id"`
	SentinelName string   `json:"sentinel_name"`
	Type        string    `json:"type"` // "safety", "maintenance", "passenger", "emergency"
	Priority    string    `json:"priority"` // "low", "medium", "high", "critical"
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Location    string    `json:"location"`
	Route       string    `json:"route"`
	Latitude    float64   `json:"latitude,omitempty"`
	Longitude   float64   `json:"longitude,omitempty"`
	Images      []string  `json:"images,omitempty"`
	Status      string    `json:"status"` // "pending", "acknowledged", "resolved"
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// SentinelReport represents a routine report from a sentinel
type SentinelReport struct {
	ID           int64     `json:"id"`
	SentinelID   string    `json:"sentinel_id"`
	SentinelName string    `json:"sentinel_name"`
	ReportType   string    `json:"report_type"` // "shift_start", "shift_end", "inspection", "incident"
	Location     string    `json:"location"`
	Route        string    `json:"route"`
	Notes        string    `json:"notes"`
	Metrics      map[string]interface{} `json:"metrics,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

// SentinelLocation represents a sentinel's current location
type SentinelLocation struct {
	SentinelID   string    `json:"sentinel_id"`
	SentinelName string    `json:"sentinel_name"`
	Latitude     float64   `json:"latitude"`
	Longitude    float64   `json:"longitude"`
	Location     string    `json:"location"`
	Route        string    `json:"route"`
	Status       string    `json:"status"` // "online", "offline", "away"
	LastUpdate   time.Time `json:"last_update"`
}

// SentinelStatus represents a sentinel's current status
type SentinelStatus struct {
	SentinelID   string    `json:"sentinel_id"`
	SentinelName string    `json:"sentinel_name"`
	Status       string    `json:"status"` // "online", "offline", "away"
	Location     string    `json:"location"`
	Route        string    `json:"route"`
	OnDuty       bool      `json:"on_duty"`
	ShiftStart   time.Time `json:"shift_start,omitempty"`
	ShiftEnd     time.Time `json:"shift_end,omitempty"`
	LastUpdate   time.Time `json:"last_update"`
}

var (
	sentinelAlertsMu    sync.RWMutex
	sentinelAlerts      = []SentinelAlert{}
	sentinelAlertIDSeq  = int64(1)

	sentinelReportsMu   sync.RWMutex
	sentinelReports     = []SentinelReport{}
	sentinelReportIDSeq = int64(1)

	sentinelLocationsMu sync.RWMutex
	sentinelLocations   = make(map[string]SentinelLocation)

	sentinelStatusesMu  sync.RWMutex
	sentinelStatuses    = make(map[string]SentinelStatus)
)

// sentinelAlertHandler handles alert submissions from sentinel mobile app
func sentinelAlertHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method == "POST" {
		var alert SentinelAlert
		if err := json.NewDecoder(r.Body).Decode(&alert); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Validate required fields
		if alert.SentinelID == "" || alert.Title == "" || alert.Type == "" {
			http.Error(w, "sentinel_id, title, and type are required", http.StatusBadRequest)
			return
		}

		// Set defaults
		if alert.Priority == "" {
			alert.Priority = "medium"
		}
		if alert.Status == "" {
			alert.Status = "pending"
		}

		sentinelAlertsMu.Lock()
		alert.ID = sentinelAlertIDSeq
		alert.CreatedAt = time.Now()
		alert.UpdatedAt = time.Now()
		sentinelAlertIDSeq++
		sentinelAlerts = append([]SentinelAlert{alert}, sentinelAlerts...)
		sentinelAlertsMu.Unlock()

		// Create notification for admin
		notificationType := "alert"
		notificationIcon := "⚠️"
		
		switch alert.Priority {
		case "critical":
			notificationIcon = "🚨"
		case "high":
			notificationIcon = "⚠️"
		case "medium":
			notificationIcon = "⚡"
		case "low":
			notificationIcon = "ℹ️"
		}

		notification := Notification{
			Type:      notificationType,
			Icon:      notificationIcon,
			Title:     fmt.Sprintf("%s Alert: %s", alert.Priority, alert.Title),
			Message:   fmt.Sprintf("%s reported from %s: %s", alert.SentinelName, alert.Location, alert.Description),
			Time:      "just now",
			Timestamp: time.Now().Unix(),
			UserID:    "admin-1",
		}
		CreateNotification(notification)

		// Add to activity feed
		event := Event{
			ID:        time.Now().UnixNano(),
			Message:   fmt.Sprintf("Alert from %s: %s at %s", alert.SentinelName, alert.Title, alert.Location),
			Timestamp: time.Now(),
		}
		stats.mu.Lock()
		stats.RecentEvents = append([]Event{event}, stats.RecentEvents...)
		if len(stats.RecentEvents) > 10 {
			stats.RecentEvents = stats.RecentEvents[:10]
		}
		stats.mu.Unlock()

		log.Printf("🚨 Alert received from %s: %s [Priority: %s]", alert.SentinelName, alert.Title, alert.Priority)

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"alert":   alert,
		})

	} else if r.Method == "GET" {
		// Get alerts
		status := r.URL.Query().Get("status")
		priority := r.URL.Query().Get("priority")

		sentinelAlertsMu.RLock()
		filtered := []SentinelAlert{}
		for _, alert := range sentinelAlerts {
			if status != "" && alert.Status != status {
				continue
			}
			if priority != "" && alert.Priority != priority {
				continue
			}
			filtered = append(filtered, alert)
		}
		sentinelAlertsMu.RUnlock()

		json.NewEncoder(w).Encode(map[string]interface{}{
			"alerts": filtered,
			"count":  len(filtered),
		})

	} else {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// sentinelReportHandler handles routine reports from sentinel mobile app
func sentinelReportHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method == "POST" {
		var report SentinelReport
		if err := json.NewDecoder(r.Body).Decode(&report); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Validate required fields
		if report.SentinelID == "" || report.ReportType == "" {
			http.Error(w, "sentinel_id and report_type are required", http.StatusBadRequest)
			return
		}

		sentinelReportsMu.Lock()
		report.ID = sentinelReportIDSeq
		report.CreatedAt = time.Now()
		sentinelReportIDSeq++
		sentinelReports = append([]SentinelReport{report}, sentinelReports...)
		sentinelReportsMu.Unlock()

		// Create notification for certain report types
		if report.ReportType == "incident" {
			notification := Notification{
				Type:      "system",
				Icon:      "📋",
				Title:     fmt.Sprintf("Incident Report: %s", report.SentinelName),
				Message:   fmt.Sprintf("Incident reported at %s: %s", report.Location, report.Notes),
				Time:      "just now",
				Timestamp: time.Now().Unix(),
				UserID:    "admin-1",
			}
			CreateNotification(notification)
		}

		log.Printf("📋 Report received from %s: %s", report.SentinelName, report.ReportType)

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"report":  report,
		})

	} else if r.Method == "GET" {
		// Get reports
		reportType := r.URL.Query().Get("type")
		sentinelID := r.URL.Query().Get("sentinel_id")

		sentinelReportsMu.RLock()
		filtered := []SentinelReport{}
		for _, report := range sentinelReports {
			if reportType != "" && report.ReportType != reportType {
				continue
			}
			if sentinelID != "" && report.SentinelID != sentinelID {
				continue
			}
			filtered = append(filtered, report)
		}
		sentinelReportsMu.RUnlock()

		json.NewEncoder(w).Encode(map[string]interface{}{
			"reports": filtered,
			"count":   len(filtered),
		})

	} else {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// sentinelLocationHandler handles location updates from sentinel mobile app
func sentinelLocationHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method == "POST" {
		var location SentinelLocation
		if err := json.NewDecoder(r.Body).Decode(&location); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Validate required fields
		if location.SentinelID == "" {
			http.Error(w, "sentinel_id is required", http.StatusBadRequest)
			return
		}

		location.LastUpdate = time.Now()

		sentinelLocationsMu.Lock()
		sentinelLocations[location.SentinelID] = location
		sentinelLocationsMu.Unlock()

		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
		})

	} else if r.Method == "GET" {
		// Get all sentinel locations
		sentinelLocationsMu.RLock()
		locations := make([]SentinelLocation, 0, len(sentinelLocations))
		for _, loc := range sentinelLocations {
			locations = append(locations, loc)
		}
		sentinelLocationsMu.RUnlock()

		json.NewEncoder(w).Encode(map[string]interface{}{
			"locations": locations,
			"count":     len(locations),
		})

	} else {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// sentinelStatusHandler handles status updates from sentinel mobile app
func sentinelStatusHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method == "POST" {
		var status SentinelStatus
		if err := json.NewDecoder(r.Body).Decode(&status); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Validate required fields
		if status.SentinelID == "" || status.Status == "" {
			http.Error(w, "sentinel_id and status are required", http.StatusBadRequest)
			return
		}

		status.LastUpdate = time.Now()

		sentinelStatusesMu.Lock()
		sentinelStatuses[status.SentinelID] = status
		sentinelStatusesMu.Unlock()

		// Create notification for shift changes
		if status.OnDuty {
			notification := Notification{
				Type:      "system",
				Icon:      "👤",
				Title:     fmt.Sprintf("%s Started Shift", status.SentinelName),
				Message:   fmt.Sprintf("%s is now on duty at %s", status.SentinelName, status.Location),
				Time:      "just now",
				Timestamp: time.Now().Unix(),
				UserID:    "admin-1",
			}
			CreateNotification(notification)
		}

		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
		})

	} else if r.Method == "GET" {
		// Get all sentinel statuses
		sentinelStatusesMu.RLock()
		statuses := make([]SentinelStatus, 0, len(sentinelStatuses))
		for _, s := range sentinelStatuses {
			statuses = append(statuses, s)
		}
		sentinelStatusesMu.RUnlock()

		json.NewEncoder(w).Encode(map[string]interface{}{
			"statuses": statuses,
			"count":    len(statuses),
		})

	} else {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}
