package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"sync"
	"time"
)

// SensorGPSLog represents a GPS data point from a train sensor
type SensorGPSLog struct {
	ID         string    `json:"id,omitempty"`
	TrainID    string    `json:"train_id"`
	SentinelID string    `json:"sentinel_id,omitempty"`
	Timestamp  string    `json:"timestamp"`
	Lat        float64   `json:"lat"`
	Lon        float64   `json:"lon"`
	AltitudeM  float64   `json:"altitude_m,omitempty"`
	SpeedKmh   float64   `json:"speed_kmh,omitempty"`
	Heading    float64   `json:"heading,omitempty"`
	AccuracyM  float64   `json:"accuracy_m,omitempty"`
	TripID     string    `json:"trip_id,omitempty"`
	RouteID    string    `json:"route_id,omitempty"`
	CreatedAt  time.Time `json:"created_at,omitempty"`
}

// DetectedTrip represents a trip detected from sensor data
type DetectedTrip struct {
	ID              string    `json:"id"`
	TrainID         string    `json:"train_id"`
	RouteID         string    `json:"route_id,omitempty"`
	StartTime       time.Time `json:"start_time"`
	EndTime         time.Time `json:"end_time,omitempty"`
	StartLat        float64   `json:"start_lat"`
	StartLon        float64   `json:"start_lon"`
	StartStopID     string    `json:"start_stop_id,omitempty"`
	EndLat          float64   `json:"end_lat,omitempty"`
	EndLon          float64   `json:"end_lon,omitempty"`
	EndStopID       string    `json:"end_stop_id,omitempty"`
	DistanceKm      float64   `json:"distance_km"`
	DurationMinutes int       `json:"duration_minutes,omitempty"`
	AvgSpeedKmh     float64   `json:"avg_speed_kmh,omitempty"`
	GPSPointCount   int       `json:"gps_point_count"`
	Status          string    `json:"status"` // active, completed, cancelled
}

// CommunityContribution represents user-submitted GTFS data
type CommunityContribution struct {
	ID               string                 `json:"id,omitempty"`
	UserID           string                 `json:"user_id,omitempty"`
	ContributionType string                 `json:"contribution_type"` // stop_location, arrival_time, departure_time, route_verification, service_exception
	EntityType       string                 `json:"entity_type"`       // stop, trip, route, calendar
	EntityID         string                 `json:"entity_id"`
	Data             map[string]interface{} `json:"data"`
	Lat              float64                `json:"lat,omitempty"`
	Lon              float64                `json:"lon,omitempty"`
	Status           string                 `json:"status,omitempty"` // pending, verified, rejected
	CreatedAt        time.Time              `json:"created_at,omitempty"`
}

// StopEvent represents an arrival or departure at a stop
type StopEvent struct {
	ID             string    `json:"id,omitempty"`
	DetectedTripID string    `json:"detected_trip_id,omitempty"`
	StopID         string    `json:"stop_id"`
	EventType      string    `json:"event_type"` // arrival, departure
	EventTime      time.Time `json:"event_time"`
	Source         string    `json:"source"` // sensor, community
	SentinelID     string    `json:"sentinel_id,omitempty"`
	UserID         string    `json:"user_id,omitempty"`
	Lat            float64   `json:"lat,omitempty"`
	Lon            float64   `json:"lon,omitempty"`
	AccuracyM      float64   `json:"accuracy_m,omitempty"`
}

// In-memory storage (replace with Supabase in production)
var (
	gpsLogsMu      sync.RWMutex
	gpsLogs        = []SensorGPSLog{}
	gpsLogIDSeq    = int64(1)

	detectedTripsMu sync.RWMutex
	detectedTrips   = make(map[string]*DetectedTrip) // trainID -> active trip
	allTrips        = []DetectedTrip{}

	contributionsMu  sync.RWMutex
	contributions    = []CommunityContribution{}
	contributionSeq  = int64(1)

	stopEventsMu sync.RWMutex
	stopEvents   = []StopEvent{}
	stopEventSeq = int64(1)
)

// sensorLogHandler handles GPS data from train sensors
func sensorLogHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method == "POST" {
		var logEntry SensorGPSLog
		if err := json.NewDecoder(r.Body).Decode(&logEntry); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Validate required fields
		if logEntry.TrainID == "" {
			http.Error(w, "train_id is required", http.StatusBadRequest)
			return
		}
		if logEntry.Lat == 0 && logEntry.Lon == 0 {
			http.Error(w, "lat and lon are required", http.StatusBadRequest)
			return
		}

		// Set defaults
		if logEntry.Timestamp == "" {
			logEntry.Timestamp = time.Now().UTC().Format(time.RFC3339)
		}
		logEntry.CreatedAt = time.Now()

		gpsLogsMu.Lock()
		logEntry.ID = fmt.Sprintf("gps-%d", gpsLogIDSeq)
		gpsLogIDSeq++
		gpsLogs = append(gpsLogs, logEntry)
		// Keep only last 10000 entries in memory
		if len(gpsLogs) > 10000 {
			gpsLogs = gpsLogs[len(gpsLogs)-10000:]
		}
		gpsLogsMu.Unlock()

		// Process for trip detection
		processGPSForTrip(logEntry)

		log.Printf("📍 GPS log: train=%s lat=%.6f lon=%.6f", logEntry.TrainID, logEntry.Lat, logEntry.Lon)

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"id":      logEntry.ID,
		})

	} else if r.Method == "GET" {
		// Get GPS logs for a train
		trainID := r.URL.Query().Get("train_id")
		limit := 100

		gpsLogsMu.RLock()
		var filtered []SensorGPSLog
		for i := len(gpsLogs) - 1; i >= 0 && len(filtered) < limit; i-- {
			if trainID == "" || gpsLogs[i].TrainID == trainID {
				filtered = append(filtered, gpsLogs[i])
			}
		}
		gpsLogsMu.RUnlock()

		json.NewEncoder(w).Encode(map[string]interface{}{
			"logs":  filtered,
			"count": len(filtered),
		})

	} else {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// processGPSForTrip detects trips from GPS data
func processGPSForTrip(log SensorGPSLog) {
	detectedTripsMu.Lock()
	defer detectedTripsMu.Unlock()

	activeTrip, exists := detectedTrips[log.TrainID]

	if !exists {
		// Start a new trip
		trip := &DetectedTrip{
			ID:            fmt.Sprintf("trip-%s-%d", log.TrainID, time.Now().UnixNano()),
			TrainID:       log.TrainID,
			StartTime:     time.Now(),
			StartLat:      log.Lat,
			StartLon:      log.Lon,
			GPSPointCount: 1,
			Status:        "active",
		}
		detectedTrips[log.TrainID] = trip
		log.Printf("🚂 New trip detected: %s for train %s", trip.ID, log.TrainID)
		return
	}

	// Update existing trip
	activeTrip.GPSPointCount++
	activeTrip.EndLat = log.Lat
	activeTrip.EndLon = log.Lon

	// Calculate distance
	dist := haversineDistance(activeTrip.StartLat, activeTrip.StartLon, log.Lat, log.Lon)
	activeTrip.DistanceKm = dist

	// Check if trip should be completed (no movement for 10 minutes would be handled by a background job)
}

// haversineDistance calculates distance between two GPS points in km
func haversineDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371 // Earth's radius in km
	dLat := (lat2 - lat1) * math.Pi / 180
	dLon := (lon2 - lon1) * math.Pi / 180
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
			math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}

// tripsHandler handles trip queries
func tripsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method == "GET" {
		trainID := r.URL.Query().Get("train_id")
		status := r.URL.Query().Get("status")

		detectedTripsMu.RLock()
		var trips []DetectedTrip

		// Add active trips
		for _, trip := range detectedTrips {
			if (trainID == "" || trip.TrainID == trainID) &&
				(status == "" || trip.Status == status) {
				trips = append(trips, *trip)
			}
		}

		// Add completed trips
		for _, trip := range allTrips {
			if (trainID == "" || trip.TrainID == trainID) &&
				(status == "" || trip.Status == status) {
				trips = append(trips, trip)
			}
		}
		detectedTripsMu.RUnlock()

		json.NewEncoder(w).Encode(map[string]interface{}{
			"trips": trips,
			"count": len(trips),
		})

	} else if r.Method == "POST" {
		// Complete a trip
		var req struct {
			TrainID string `json:"train_id"`
			Action  string `json:"action"` // complete, cancel
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		detectedTripsMu.Lock()
		trip, exists := detectedTrips[req.TrainID]
		if exists {
			trip.EndTime = time.Now()
			trip.DurationMinutes = int(trip.EndTime.Sub(trip.StartTime).Minutes())
			if trip.DurationMinutes > 0 {
				trip.AvgSpeedKmh = trip.DistanceKm / (float64(trip.DurationMinutes) / 60)
			}
			if req.Action == "cancel" {
				trip.Status = "cancelled"
			} else {
				trip.Status = "completed"
			}
			allTrips = append(allTrips, *trip)
			delete(detectedTrips, req.TrainID)
			log.Printf("🏁 Trip %s: %s (%.2f km in %d min)", trip.Status, trip.ID, trip.DistanceKm, trip.DurationMinutes)
		}
		detectedTripsMu.Unlock()

		if !exists {
			http.Error(w, "No active trip for train", http.StatusNotFound)
			return
		}

		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"trip":    trip,
		})

	} else {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// communityContributionHandler handles user-submitted GTFS data
func communityContributionHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method == "POST" {
		var contrib CommunityContribution
		if err := json.NewDecoder(r.Body).Decode(&contrib); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Validate required fields
		if contrib.ContributionType == "" || contrib.EntityType == "" || contrib.EntityID == "" {
			http.Error(w, "contribution_type, entity_type, and entity_id are required", http.StatusBadRequest)
			return
		}

		contrib.Status = "pending"
		contrib.CreatedAt = time.Now()

		contributionsMu.Lock()
		contrib.ID = fmt.Sprintf("contrib-%d", contributionSeq)
		contributionSeq++
		contributions = append(contributions, contrib)
		contributionsMu.Unlock()

		log.Printf("📝 Community contribution: type=%s entity=%s/%s", contrib.ContributionType, contrib.EntityType, contrib.EntityID)

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success":      true,
			"id":           contrib.ID,
			"reward_afrc":  0.5, // Reward for contribution
		})

	} else if r.Method == "GET" {
		status := r.URL.Query().Get("status")
		contribType := r.URL.Query().Get("type")

		contributionsMu.RLock()
		var filtered []CommunityContribution
		for _, c := range contributions {
			if (status == "" || c.Status == status) &&
				(contribType == "" || c.ContributionType == contribType) {
				filtered = append(filtered, c)
			}
		}
		contributionsMu.RUnlock()

		json.NewEncoder(w).Encode(map[string]interface{}{
			"contributions": filtered,
			"count":         len(filtered),
		})

	} else {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// stopEventHandler handles arrival/departure events
func stopEventHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method == "POST" {
		var event StopEvent
		if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Validate required fields
		if event.StopID == "" || event.EventType == "" {
			http.Error(w, "stop_id and event_type are required", http.StatusBadRequest)
			return
		}

		if event.EventTime.IsZero() {
			event.EventTime = time.Now()
		}
		if event.Source == "" {
			event.Source = "community"
		}

		stopEventsMu.Lock()
		event.ID = fmt.Sprintf("event-%d", stopEventSeq)
		stopEventSeq++
		stopEvents = append(stopEvents, event)
		stopEventsMu.Unlock()

		log.Printf("🚉 Stop event: %s at %s (%s)", event.EventType, event.StopID, event.Source)

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"id":      event.ID,
		})

	} else if r.Method == "GET" {
		stopID := r.URL.Query().Get("stop_id")
		eventType := r.URL.Query().Get("type")

		stopEventsMu.RLock()
		var filtered []StopEvent
		for _, e := range stopEvents {
			if (stopID == "" || e.StopID == stopID) &&
				(eventType == "" || e.EventType == eventType) {
				filtered = append(filtered, e)
			}
		}
		stopEventsMu.RUnlock()

		json.NewEncoder(w).Encode(map[string]interface{}{
			"events": filtered,
			"count":  len(filtered),
		})

	} else {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// gtfsExportHandler exports GTFS data in standard format
func gtfsExportHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	fileType := r.URL.Query().Get("file")

	switch fileType {
	case "agency":
		// Export agency.txt format
		agencies := []map[string]string{
			{
				"agency_id":       "tazara",
				"agency_name":     "Tanzania-Zambia Railway Authority",
				"agency_url":      "https://www.tazarasite.com",
				"agency_timezone": "Africa/Dar_es_Salaam",
				"agency_lang":     "en",
				"agency_phone":    "+255739998855",
			},
			{
				"agency_id":       "zrl",
				"agency_name":     "Zambia Railways Limited",
				"agency_url":      "https://www.zrl.com.zm",
				"agency_timezone": "Africa/Lusaka",
				"agency_lang":     "en",
			},
			{
				"agency_id":       "sgr_kenya",
				"agency_name":     "Kenya Standard Gauge Railway",
				"agency_url":      "https://metickets.krc.co.ke",
				"agency_timezone": "Africa/Nairobi",
				"agency_lang":     "en",
			},
			{
				"agency_id":       "gautrain",
				"agency_name":     "Gautrain Rapid Rail Link",
				"agency_url":      "https://www.gautrain.co.za",
				"agency_timezone": "Africa/Johannesburg",
				"agency_lang":     "en",
			},
		}
		json.NewEncoder(w).Encode(map[string]interface{}{
			"file":    "agency.txt",
			"records": agencies,
			"count":   len(agencies),
		})

	case "stops":
		// Export stops.txt format from collected data
		stops := []map[string]interface{}{
			{"stop_id": "DSM", "stop_name": "Dar es Salaam Station", "stop_lat": -6.8235, "stop_lon": 39.2695, "location_type": 1},
			{"stop_id": "KPM", "stop_name": "Kapiri Mposhi Station", "stop_lat": -14.4667, "stop_lon": 28.6833, "location_type": 1},
			{"stop_id": "LSK", "stop_name": "Lusaka Central Station", "stop_lat": -15.4167, "stop_lon": 28.2833, "location_type": 1},
			{"stop_id": "LVS", "stop_name": "Livingstone Station", "stop_lat": -17.8419, "stop_lon": 25.8544, "location_type": 1},
			{"stop_id": "NRB", "stop_name": "Nairobi Terminus", "stop_lat": -1.3189, "stop_lon": 36.9275, "location_type": 1},
			{"stop_id": "MBA", "stop_name": "Mombasa Terminus", "stop_lat": -4.0435, "stop_lon": 39.6682, "location_type": 1},
		}
		json.NewEncoder(w).Encode(map[string]interface{}{
			"file":    "stops.txt",
			"records": stops,
			"count":   len(stops),
		})

	case "routes":
		routes := []map[string]interface{}{
			{"route_id": "tazara-mukuba-express", "agency_id": "tazara", "route_short_name": "Mukuba", "route_long_name": "Mukuba Express", "route_type": 2, "route_color": "1E40AF"},
			{"route_id": "zrl-main-line", "agency_id": "zrl", "route_short_name": "ZRL", "route_long_name": "ZRL Express", "route_type": 2, "route_color": "006B3F"},
			{"route_id": "sgr-nairobi-mombasa", "agency_id": "sgr_kenya", "route_short_name": "Madaraka", "route_long_name": "Madaraka Express", "route_type": 2, "route_color": "DC2626"},
		}
		json.NewEncoder(w).Encode(map[string]interface{}{
			"file":    "routes.txt",
			"records": routes,
			"count":   len(routes),
		})

	case "shapes":
		// Export shapes from GPS tracks
		gpsLogsMu.RLock()
		var shapes []map[string]interface{}
		shapeSeq := 1
		for _, log := range gpsLogs {
			if log.TripID != "" {
				shapes = append(shapes, map[string]interface{}{
					"shape_id":            log.TripID,
					"shape_pt_lat":        log.Lat,
					"shape_pt_lon":        log.Lon,
					"shape_pt_sequence":   shapeSeq,
				})
				shapeSeq++
			}
		}
		gpsLogsMu.RUnlock()

		json.NewEncoder(w).Encode(map[string]interface{}{
			"file":    "shapes.txt",
			"records": shapes,
			"count":   len(shapes),
		})

	default:
		// Return available files
		json.NewEncoder(w).Encode(map[string]interface{}{
			"available_files": []string{"agency", "stops", "routes", "trips", "stop_times", "calendar", "shapes", "fare_attributes"},
			"usage":           "Add ?file=<filename> to export specific GTFS file",
		})
	}
}

// RegisterGTFSHandlers registers all GTFS-related API endpoints
func RegisterGTFSHandlers(mux *http.ServeMux) {
	mux.HandleFunc("/api/sensor/log", sensorLogHandler)
	mux.HandleFunc("/api/gtfs/trips", tripsHandler)
	mux.HandleFunc("/api/gtfs/contribution", communityContributionHandler)
	mux.HandleFunc("/api/gtfs/stop-event", stopEventHandler)
	mux.HandleFunc("/api/gtfs/export", gtfsExportHandler)
}
