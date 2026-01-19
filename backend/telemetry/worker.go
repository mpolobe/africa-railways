// Package telemetry provides worker location tracking for the Sentinel network
package telemetry

import (
	"encoding/json"
	"log"
	"sync"
	"time"
)

// WorkerLocation represents a track worker's current position
type WorkerLocation struct {
	WorkerID     string    `json:"worker_id"`
	WorkerName   string    `json:"worker_name"`
	Latitude     float64   `json:"latitude"`
	Longitude    float64   `json:"longitude"`
	Accuracy     float64   `json:"accuracy"`     // GPS accuracy in meters
	Altitude     float64   `json:"altitude"`     // meters above sea level
	Speed        float64   `json:"speed"`        // km/h (usually 0 or walking speed)
	RouteID      string    `json:"route_id"`
	RouteName    string    `json:"route_name"`
	SectionKM    float64   `json:"section_km"`   // kilometer marker on route
	Status       string    `json:"status"`       // "on_duty", "break", "offline"
	Activity     string    `json:"activity"`     // "inspection", "maintenance", "patrol"
	LastUpdate   time.Time `json:"last_update"`
	BatteryLevel int       `json:"battery_level"` // percentage
	SignalStrength int     `json:"signal_strength"` // 0-4 bars
}

// ToJSON serializes the worker location to JSON
func (w *WorkerLocation) ToJSON() ([]byte, error) {
	return json.Marshal(w)
}

// WorkerTelemetryMessage represents incoming GPS data from a worker's device
type WorkerTelemetryMessage struct {
	WorkerID       string    `json:"worker_id"`
	DeviceID       string    `json:"device_id"`
	Latitude       float64   `json:"latitude"`
	Longitude      float64   `json:"longitude"`
	Accuracy       float64   `json:"accuracy"`
	Altitude       float64   `json:"altitude"`
	Speed          float64   `json:"speed"`
	Heading        float64   `json:"heading"`
	RouteID        string    `json:"route_id"`
	Activity       string    `json:"activity"`
	Status         string    `json:"status"`
	BatteryLevel   int       `json:"battery_level"`
	SignalStrength int       `json:"signal_strength"`
	Timestamp      time.Time `json:"timestamp"`
}

// ProximityAlert represents a safety alert when a worker is near an approaching train
type ProximityAlert struct {
	AlertID      string    `json:"alert_id"`
	WorkerID     string    `json:"worker_id"`
	WorkerName   string    `json:"worker_name"`
	TrainID      string    `json:"train_id"`
	TrainName    string    `json:"train_name"`
	Distance     float64   `json:"distance_km"`
	TimeToArrival float64  `json:"time_to_arrival_minutes"`
	Severity     string    `json:"severity"` // "warning", "danger", "critical"
	WorkerLat    float64   `json:"worker_latitude"`
	WorkerLon    float64   `json:"worker_longitude"`
	TrainLat     float64   `json:"train_latitude"`
	TrainLon     float64   `json:"train_longitude"`
	TrainSpeed   float64   `json:"train_speed_kmh"`
	CreatedAt    time.Time `json:"created_at"`
	Acknowledged bool      `json:"acknowledged"`
}

// WorkerTracker manages worker locations and proximity alerts
type WorkerTracker struct {
	mu            sync.RWMutex
	workers       map[string]*WorkerLocation
	alerts        map[string]*ProximityAlert
	alertChan     chan *ProximityAlert
	trainEngine   *IngestEngine
	alertThresholds struct {
		warningKM  float64 // Distance for warning alert
		dangerKM   float64 // Distance for danger alert
		criticalKM float64 // Distance for critical alert
	}
}

// NewWorkerTracker creates a new worker location tracker
func NewWorkerTracker(trainEngine *IngestEngine) *WorkerTracker {
	tracker := &WorkerTracker{
		workers:     make(map[string]*WorkerLocation),
		alerts:      make(map[string]*ProximityAlert),
		alertChan:   make(chan *ProximityAlert, 100),
		trainEngine: trainEngine,
	}
	
	// Set default alert thresholds
	tracker.alertThresholds.warningKM = 5.0  // 5km warning
	tracker.alertThresholds.dangerKM = 2.0   // 2km danger
	tracker.alertThresholds.criticalKM = 0.5 // 500m critical
	
	// Start proximity monitoring goroutine
	go tracker.monitorProximity()
	
	return tracker
}

// IngestWorkerLocation processes incoming worker GPS data
func (t *WorkerTracker) IngestWorkerLocation(msg *WorkerTelemetryMessage) error {
	t.mu.Lock()
	defer t.mu.Unlock()
	
	// Get or create worker location record
	worker, exists := t.workers[msg.WorkerID]
	if !exists {
		worker = &WorkerLocation{
			WorkerID:   msg.WorkerID,
			WorkerName: msg.WorkerID, // Default to ID
		}
		t.workers[msg.WorkerID] = worker
	}
	
	// Update location
	worker.Latitude = msg.Latitude
	worker.Longitude = msg.Longitude
	worker.Accuracy = msg.Accuracy
	worker.Altitude = msg.Altitude
	worker.Speed = msg.Speed
	worker.RouteID = msg.RouteID
	worker.Status = msg.Status
	worker.Activity = msg.Activity
	worker.BatteryLevel = msg.BatteryLevel
	worker.SignalStrength = msg.SignalStrength
	worker.LastUpdate = msg.Timestamp
	
	// Calculate section kilometer marker
	if route, ok := t.trainEngine.routes[msg.RouteID]; ok {
		worker.RouteName = route.Name
		worker.SectionKM = t.calculateSectionKM(worker, route)
	}
	
	log.Printf("Worker %s location updated: lat=%.4f, lon=%.4f, activity=%s",
		msg.WorkerID, msg.Latitude, msg.Longitude, msg.Activity)
	
	return nil
}

// calculateSectionKM estimates the kilometer marker for a worker's position
func (t *WorkerTracker) calculateSectionKM(worker *WorkerLocation, route *Route) float64 {
	// Find the nearest station and calculate approximate KM marker
	minDist := float64(999999)
	nearestStationIdx := 0
	
	for i, stationID := range route.Stations {
		if station, ok := t.trainEngine.stations[stationID]; ok {
			dist := haversineDistance(worker.Latitude, worker.Longitude, 
				station.Latitude, station.Longitude)
			if dist < minDist {
				minDist = dist
				nearestStationIdx = i
			}
		}
	}
	
	// Approximate KM based on station index and route length
	if len(route.Stations) > 1 {
		return (float64(nearestStationIdx) / float64(len(route.Stations)-1)) * route.Distance
	}
	return 0
}

// GetWorkerLocation returns the current location of a worker
func (t *WorkerTracker) GetWorkerLocation(workerID string) (*WorkerLocation, bool) {
	t.mu.RLock()
	defer t.mu.RUnlock()
	
	worker, ok := t.workers[workerID]
	if !ok {
		return nil, false
	}
	
	copy := *worker
	return &copy, true
}

// GetAllWorkerLocations returns all current worker locations
func (t *WorkerTracker) GetAllWorkerLocations() []*WorkerLocation {
	t.mu.RLock()
	defer t.mu.RUnlock()
	
	locations := make([]*WorkerLocation, 0, len(t.workers))
	for _, worker := range t.workers {
		copy := *worker
		locations = append(locations, &copy)
	}
	
	return locations
}

// GetWorkersOnRoute returns all workers on a specific route
func (t *WorkerTracker) GetWorkersOnRoute(routeID string) []*WorkerLocation {
	t.mu.RLock()
	defer t.mu.RUnlock()
	
	workers := make([]*WorkerLocation, 0)
	for _, worker := range t.workers {
		if worker.RouteID == routeID && worker.Status == "on_duty" {
			copy := *worker
			workers = append(workers, &copy)
		}
	}
	
	return workers
}

// monitorProximity continuously checks for workers near approaching trains
func (t *WorkerTracker) monitorProximity() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()
	
	for range ticker.C {
		t.checkAllProximity()
	}
}

// checkAllProximity checks proximity between all workers and trains
func (t *WorkerTracker) checkAllProximity() {
	t.mu.RLock()
	workers := make([]*WorkerLocation, 0, len(t.workers))
	for _, w := range t.workers {
		if w.Status == "on_duty" {
			copy := *w
			workers = append(workers, &copy)
		}
	}
	t.mu.RUnlock()
	
	trains := t.trainEngine.GetAllPositions()
	
	for _, worker := range workers {
		for _, train := range trains {
			// Only check trains on the same route
			if worker.RouteID != train.RouteID {
				continue
			}
			
			// Calculate distance
			distance := haversineDistance(
				worker.Latitude, worker.Longitude,
				train.Latitude, train.Longitude,
			)
			
			// Check if within alert threshold
			var severity string
			if distance <= t.alertThresholds.criticalKM {
				severity = "critical"
			} else if distance <= t.alertThresholds.dangerKM {
				severity = "danger"
			} else if distance <= t.alertThresholds.warningKM {
				severity = "warning"
			} else {
				continue // No alert needed
			}
			
			// Calculate time to arrival
			timeToArrival := 0.0
			if train.Speed > 0 {
				timeToArrival = (distance / train.Speed) * 60 // minutes
			}
			
			// Create alert
			alertID := worker.WorkerID + "-" + train.TrainID
			alert := &ProximityAlert{
				AlertID:       alertID,
				WorkerID:      worker.WorkerID,
				WorkerName:    worker.WorkerName,
				TrainID:       train.TrainID,
				TrainName:     train.TrainName,
				Distance:      distance,
				TimeToArrival: timeToArrival,
				Severity:      severity,
				WorkerLat:     worker.Latitude,
				WorkerLon:     worker.Longitude,
				TrainLat:      train.Latitude,
				TrainLon:      train.Longitude,
				TrainSpeed:    train.Speed,
				CreatedAt:     time.Now(),
				Acknowledged:  false,
			}
			
			// Store and broadcast alert
			t.mu.Lock()
			t.alerts[alertID] = alert
			t.mu.Unlock()
			
			select {
			case t.alertChan <- alert:
				log.Printf("PROXIMITY ALERT [%s]: Worker %s is %.2f km from train %s (ETA: %.1f min)",
					severity, worker.WorkerID, distance, train.TrainID, timeToArrival)
			default:
				// Channel full, log warning
				log.Printf("Warning: Alert channel full, dropping alert for worker %s", worker.WorkerID)
			}
		}
	}
}

// GetAlerts returns the alert channel for subscribing to proximity alerts
func (t *WorkerTracker) GetAlerts() <-chan *ProximityAlert {
	return t.alertChan
}

// GetActiveAlerts returns all unacknowledged alerts
func (t *WorkerTracker) GetActiveAlerts() []*ProximityAlert {
	t.mu.RLock()
	defer t.mu.RUnlock()
	
	alerts := make([]*ProximityAlert, 0)
	for _, alert := range t.alerts {
		if !alert.Acknowledged {
			copy := *alert
			alerts = append(alerts, &copy)
		}
	}
	
	return alerts
}

// AcknowledgeAlert marks an alert as acknowledged
func (t *WorkerTracker) AcknowledgeAlert(alertID string) bool {
	t.mu.Lock()
	defer t.mu.Unlock()
	
	if alert, ok := t.alerts[alertID]; ok {
		alert.Acknowledged = true
		return true
	}
	return false
}
