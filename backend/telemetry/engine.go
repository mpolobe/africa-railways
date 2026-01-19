// Package telemetry provides the Go Ingest Engine for real-time GPS telemetry
// from locomotives and track workers across African railway networks.
package telemetry

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"sync"
	"time"
)

// TelemetryMessage represents incoming GPS data from a locomotive or worker
type TelemetryMessage struct {
	DeviceID    string    `json:"device_id"`
	DeviceType  string    `json:"device_type"` // "locomotive", "worker", "sensor"
	TrainID     string    `json:"train_id,omitempty"`
	WorkerID    string    `json:"worker_id,omitempty"`
	Latitude    float64   `json:"latitude"`
	Longitude   float64   `json:"longitude"`
	Altitude    float64   `json:"altitude,omitempty"`
	Speed       float64   `json:"speed"`       // km/h
	Heading     float64   `json:"heading"`     // degrees from north
	Accuracy    float64   `json:"accuracy"`    // meters
	RouteID     string    `json:"route_id,omitempty"`
	Status      string    `json:"status"`      // "moving", "stopped", "idle"
	Timestamp   time.Time `json:"timestamp"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// TrainPosition represents the current position of a train
type TrainPosition struct {
	TrainID       string    `json:"train_id"`
	TrainName     string    `json:"train_name"`
	Latitude      float64   `json:"latitude"`
	Longitude     float64   `json:"longitude"`
	Speed         float64   `json:"speed"`
	Heading       float64   `json:"heading"`
	Status        string    `json:"status"`
	RouteID       string    `json:"route_id"`
	RouteName     string    `json:"route_name"`
	NextStation   string    `json:"next_station"`
	ETA           time.Time `json:"eta"`
	LastUpdate    time.Time `json:"last_update"`
	DelayMinutes  int       `json:"delay_minutes"`
}

// ToJSON serializes the position to JSON
func (p *TrainPosition) ToJSON() ([]byte, error) {
	return json.Marshal(p)
}

// Route represents a railway route
type Route struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Origin      string    `json:"origin"`
	Destination string    `json:"destination"`
	Distance    float64   `json:"distance_km"`
	Stations    []string  `json:"stations"`
}

// Station represents a railway station
type Station struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	Code      string  `json:"code"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	RouteIDs  []string `json:"route_ids"`
}

// IngestEngine processes real-time GPS telemetry from locomotives
type IngestEngine struct {
	mu          sync.RWMutex
	positions   map[string]*TrainPosition
	routes      map[string]*Route
	stations    map[string]*Station
	subscribers []chan *TrainPosition
	subMu       sync.Mutex
}

// NewIngestEngine creates a new telemetry ingest engine
func NewIngestEngine() *IngestEngine {
	engine := &IngestEngine{
		positions:   make(map[string]*TrainPosition),
		routes:      make(map[string]*Route),
		stations:    make(map[string]*Station),
		subscribers: make([]chan *TrainPosition, 0),
	}
	
	// Initialize with TAZARA route data
	engine.initializeRoutes()
	engine.initializeStations()
	
	return engine
}

// initializeRoutes sets up the railway routes
func (e *IngestEngine) initializeRoutes() {
	e.routes["TAZARA-MAIN"] = &Route{
		ID:          "TAZARA-MAIN",
		Name:        "TAZARA Main Line",
		Origin:      "Dar es Salaam",
		Destination: "Kapiri Mposhi",
		Distance:    1860,
		Stations: []string{
			"DAR", "MOR", "KIL", "IFA", "MBE", "TUN", "MPA", "KAS", "NAK", "KPM",
		},
	}
	
	e.routes["ZRL-MAIN"] = &Route{
		ID:          "ZRL-MAIN",
		Name:        "Zambia Railways Main Line",
		Origin:      "Livingstone",
		Destination: "Kitwe",
		Distance:    850,
		Stations: []string{
			"LIV", "CHO", "KAL", "LUS", "KAB", "NDO", "KIT",
		},
	}
	
	e.routes["MUKUBA"] = &Route{
		ID:          "MUKUBA",
		Name:        "Mukuba Express",
		Origin:      "Kapiri Mposhi",
		Destination: "Dar es Salaam",
		Distance:    1860,
		Stations: []string{
			"KPM", "NAK", "KAS", "MPA", "TUN", "MBE", "IFA", "KIL", "MOR", "DAR",
		},
	}
}

// initializeStations sets up the railway stations
func (e *IngestEngine) initializeStations() {
	// TAZARA stations
	e.stations["DAR"] = &Station{
		ID: "DAR", Name: "Dar es Salaam", Code: "DAR",
		Latitude: -6.8235, Longitude: 39.2695,
		RouteIDs: []string{"TAZARA-MAIN", "MUKUBA"},
	}
	e.stations["MOR"] = &Station{
		ID: "MOR", Name: "Morogoro", Code: "MOR",
		Latitude: -6.8210, Longitude: 37.6591,
		RouteIDs: []string{"TAZARA-MAIN", "MUKUBA"},
	}
	e.stations["KIL"] = &Station{
		ID: "KIL", Name: "Kilosa", Code: "KIL",
		Latitude: -6.8333, Longitude: 36.9833,
		RouteIDs: []string{"TAZARA-MAIN", "MUKUBA"},
	}
	e.stations["IFA"] = &Station{
		ID: "IFA", Name: "Ifakara", Code: "IFA",
		Latitude: -8.1333, Longitude: 36.6833,
		RouteIDs: []string{"TAZARA-MAIN", "MUKUBA"},
	}
	e.stations["MBE"] = &Station{
		ID: "MBE", Name: "Mbeya", Code: "MBE",
		Latitude: -8.9000, Longitude: 33.4500,
		RouteIDs: []string{"TAZARA-MAIN", "MUKUBA"},
	}
	e.stations["TUN"] = &Station{
		ID: "TUN", Name: "Tunduma", Code: "TUN",
		Latitude: -9.3000, Longitude: 32.7667,
		RouteIDs: []string{"TAZARA-MAIN", "MUKUBA"},
	}
	e.stations["MPA"] = &Station{
		ID: "MPA", Name: "Mpika", Code: "MPA",
		Latitude: -11.8333, Longitude: 31.4500,
		RouteIDs: []string{"TAZARA-MAIN", "MUKUBA"},
	}
	e.stations["KAS"] = &Station{
		ID: "KAS", Name: "Kasama", Code: "KAS",
		Latitude: -10.2167, Longitude: 31.1833,
		RouteIDs: []string{"TAZARA-MAIN", "MUKUBA"},
	}
	e.stations["NAK"] = &Station{
		ID: "NAK", Name: "Nakonde", Code: "NAK",
		Latitude: -9.3500, Longitude: 32.7500,
		RouteIDs: []string{"TAZARA-MAIN", "MUKUBA"},
	}
	e.stations["KPM"] = &Station{
		ID: "KPM", Name: "Kapiri Mposhi", Code: "KPM",
		Latitude: -14.4500, Longitude: 28.6667,
		RouteIDs: []string{"TAZARA-MAIN", "MUKUBA", "ZRL-MAIN"},
	}
	
	// ZRL stations
	e.stations["LIV"] = &Station{
		ID: "LIV", Name: "Livingstone", Code: "LIV",
		Latitude: -17.8419, Longitude: 25.8544,
		RouteIDs: []string{"ZRL-MAIN"},
	}
	e.stations["LUS"] = &Station{
		ID: "LUS", Name: "Lusaka", Code: "LUS",
		Latitude: -15.4167, Longitude: 28.2833,
		RouteIDs: []string{"ZRL-MAIN"},
	}
	e.stations["KIT"] = &Station{
		ID: "KIT", Name: "Kitwe", Code: "KIT",
		Latitude: -12.8167, Longitude: 28.2000,
		RouteIDs: []string{"ZRL-MAIN"},
	}
}

// Ingest processes an incoming telemetry message
func (e *IngestEngine) Ingest(msg *TelemetryMessage) error {
	if msg.DeviceType != "locomotive" {
		// For now, only process locomotive telemetry
		log.Printf("Ignoring non-locomotive telemetry from device %s", msg.DeviceID)
		return nil
	}
	
	if msg.TrainID == "" {
		return fmt.Errorf("train_id is required for locomotive telemetry")
	}
	
	e.mu.Lock()
	defer e.mu.Unlock()
	
	// Get or create position record
	pos, exists := e.positions[msg.TrainID]
	if !exists {
		pos = &TrainPosition{
			TrainID:   msg.TrainID,
			TrainName: msg.TrainID, // Default to ID, can be updated
		}
		e.positions[msg.TrainID] = pos
	}
	
	// Update position
	pos.Latitude = msg.Latitude
	pos.Longitude = msg.Longitude
	pos.Speed = msg.Speed
	pos.Heading = msg.Heading
	pos.Status = msg.Status
	pos.RouteID = msg.RouteID
	pos.LastUpdate = msg.Timestamp
	
	// Calculate next station and ETA
	if route, ok := e.routes[msg.RouteID]; ok {
		pos.RouteName = route.Name
		pos.NextStation, pos.ETA = e.calculateNextStation(pos, route)
	}
	
	// Notify subscribers
	e.notifySubscribers(pos)
	
	log.Printf("Ingested telemetry for train %s: lat=%.4f, lon=%.4f, speed=%.1f km/h",
		msg.TrainID, msg.Latitude, msg.Longitude, msg.Speed)
	
	return nil
}

// calculateNextStation determines the next station and ETA
func (e *IngestEngine) calculateNextStation(pos *TrainPosition, route *Route) (string, time.Time) {
	minDist := math.MaxFloat64
	nextStation := ""
	
	for _, stationID := range route.Stations {
		station, ok := e.stations[stationID]
		if !ok {
			continue
		}
		
		dist := haversineDistance(pos.Latitude, pos.Longitude, station.Latitude, station.Longitude)
		if dist < minDist && dist > 1.0 { // More than 1km away
			minDist = dist
			nextStation = station.Name
		}
	}
	
	// Calculate ETA based on current speed
	var eta time.Time
	if pos.Speed > 0 && minDist < math.MaxFloat64 {
		hoursToArrival := minDist / pos.Speed
		eta = time.Now().Add(time.Duration(hoursToArrival * float64(time.Hour)))
	}
	
	return nextStation, eta
}

// haversineDistance calculates the distance between two points in km
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

// GetPosition returns the current position of a train
func (e *IngestEngine) GetPosition(trainID string) (*TrainPosition, bool) {
	e.mu.RLock()
	defer e.mu.RUnlock()
	
	pos, ok := e.positions[trainID]
	if !ok {
		return nil, false
	}
	
	// Return a copy to prevent race conditions
	copy := *pos
	return &copy, true
}

// GetAllPositions returns all current train positions
func (e *IngestEngine) GetAllPositions() []*TrainPosition {
	e.mu.RLock()
	defer e.mu.RUnlock()
	
	positions := make([]*TrainPosition, 0, len(e.positions))
	for _, pos := range e.positions {
		copy := *pos
		positions = append(positions, &copy)
	}
	
	return positions
}

// Subscribe creates a channel for receiving position updates
func (e *IngestEngine) Subscribe() chan *TrainPosition {
	e.subMu.Lock()
	defer e.subMu.Unlock()
	
	ch := make(chan *TrainPosition, 100)
	e.subscribers = append(e.subscribers, ch)
	
	return ch
}

// Unsubscribe removes a subscriber channel
func (e *IngestEngine) Unsubscribe(ch chan *TrainPosition) {
	e.subMu.Lock()
	defer e.subMu.Unlock()
	
	for i, sub := range e.subscribers {
		if sub == ch {
			e.subscribers = append(e.subscribers[:i], e.subscribers[i+1:]...)
			close(ch)
			break
		}
	}
}

// notifySubscribers sends position updates to all subscribers
func (e *IngestEngine) notifySubscribers(pos *TrainPosition) {
	e.subMu.Lock()
	defer e.subMu.Unlock()
	
	copy := *pos
	for _, ch := range e.subscribers {
		select {
		case ch <- &copy:
		default:
			// Channel full, skip this update
		}
	}
}
