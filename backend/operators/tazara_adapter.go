// Package operators provides the TAZARA railway adapter
package operators

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"
)

// TAZARAAdapter implements OperatorAdapter for Tanzania-Zambia Railway Authority
type TAZARAAdapter struct {
	mu            sync.RWMutex
	baseURL       string
	apiKey        string
	stations      map[string]*Station
	routes        map[string]*Route
	positions     map[string]*TrainPosition
	telemetryChan chan TelemetryMessage
}

// NewTAZARAAdapter creates a new TAZARA adapter
func NewTAZARAAdapter(baseURL, apiKey string) *TAZARAAdapter {
	adapter := &TAZARAAdapter{
		baseURL:       baseURL,
		apiKey:        apiKey,
		stations:      make(map[string]*Station),
		routes:        make(map[string]*Route),
		positions:     make(map[string]*TrainPosition),
		telemetryChan: make(chan TelemetryMessage, 100),
	}
	
	// Initialize with known TAZARA data
	adapter.initializeData()
	
	return adapter
}

// initializeData loads TAZARA station and route data
func (a *TAZARAAdapter) initializeData() {
	// TAZARA Main Line Stations (Dar es Salaam to Kapiri Mposhi)
	stations := []Station{
		{ID: "TAZARA-DAR", Code: "DAR", Name: "Dar es Salaam", Country: "Tanzania", Latitude: -6.8235, Longitude: 39.2695, Timezone: "Africa/Dar_es_Salaam", OperatorID: "TAZARA"},
		{ID: "TAZARA-MOR", Code: "MOR", Name: "Morogoro", Country: "Tanzania", Latitude: -6.8210, Longitude: 37.6591, Timezone: "Africa/Dar_es_Salaam", OperatorID: "TAZARA"},
		{ID: "TAZARA-KIL", Code: "KIL", Name: "Kilosa", Country: "Tanzania", Latitude: -6.8333, Longitude: 36.9833, Timezone: "Africa/Dar_es_Salaam", OperatorID: "TAZARA"},
		{ID: "TAZARA-IFA", Code: "IFA", Name: "Ifakara", Country: "Tanzania", Latitude: -8.1333, Longitude: 36.6833, Timezone: "Africa/Dar_es_Salaam", OperatorID: "TAZARA"},
		{ID: "TAZARA-MKB", Code: "MKB", Name: "Makambako", Country: "Tanzania", Latitude: -8.8500, Longitude: 34.8500, Timezone: "Africa/Dar_es_Salaam", OperatorID: "TAZARA"},
		{ID: "TAZARA-MBE", Code: "MBE", Name: "Mbeya", Country: "Tanzania", Latitude: -8.9000, Longitude: 33.4500, Timezone: "Africa/Dar_es_Salaam", OperatorID: "TAZARA"},
		{ID: "TAZARA-TUN", Code: "TUN", Name: "Tunduma", Country: "Tanzania", Latitude: -9.3000, Longitude: 32.7667, Timezone: "Africa/Dar_es_Salaam", OperatorID: "TAZARA"},
		{ID: "TAZARA-NAK", Code: "NAK", Name: "Nakonde", Country: "Zambia", Latitude: -9.3500, Longitude: 32.7500, Timezone: "Africa/Lusaka", OperatorID: "TAZARA"},
		{ID: "TAZARA-KAS", Code: "KAS", Name: "Kasama", Country: "Zambia", Latitude: -10.2167, Longitude: 31.1833, Timezone: "Africa/Lusaka", OperatorID: "TAZARA"},
		{ID: "TAZARA-MPA", Code: "MPA", Name: "Mpika", Country: "Zambia", Latitude: -11.8333, Longitude: 31.4500, Timezone: "Africa/Lusaka", OperatorID: "TAZARA"},
		{ID: "TAZARA-SER", Code: "SER", Name: "Serenje", Country: "Zambia", Latitude: -13.2333, Longitude: 30.2333, Timezone: "Africa/Lusaka", OperatorID: "TAZARA"},
		{ID: "TAZARA-KPM", Code: "KPM", Name: "Kapiri Mposhi", Country: "Zambia", Latitude: -14.4500, Longitude: 28.6667, Timezone: "Africa/Lusaka", OperatorID: "TAZARA"},
	}
	
	for _, s := range stations {
		station := s
		a.stations[s.ID] = &station
	}
	
	// TAZARA Routes
	a.routes["TAZARA-MAIN"] = &Route{
		ID:          "TAZARA-MAIN",
		Name:        "TAZARA Main Line",
		OperatorID:  "TAZARA",
		Origin:      "Dar es Salaam",
		Destination: "Kapiri Mposhi",
		Stations:    []string{"TAZARA-DAR", "TAZARA-MOR", "TAZARA-KIL", "TAZARA-IFA", "TAZARA-MKB", "TAZARA-MBE", "TAZARA-TUN", "TAZARA-NAK", "TAZARA-KAS", "TAZARA-MPA", "TAZARA-SER", "TAZARA-KPM"},
		DistanceKM:  1860,
		Duration:    "46h",
	}
	
	a.routes["TAZARA-MUKUBA"] = &Route{
		ID:          "TAZARA-MUKUBA",
		Name:        "Mukuba Express",
		OperatorID:  "TAZARA",
		Origin:      "Dar es Salaam",
		Destination: "Kapiri Mposhi",
		Stations:    []string{"TAZARA-DAR", "TAZARA-MBE", "TAZARA-KPM"},
		DistanceKM:  1860,
		Duration:    "36h",
	}
}

// GetOperatorInfo returns TAZARA operator information
func (a *TAZARAAdapter) GetOperatorInfo() OperatorInfo {
	return OperatorInfo{
		ID:         "TAZARA",
		Name:       "Tanzania-Zambia Railway Authority",
		Country:    "Tanzania",
		Countries:  []string{"Tanzania", "Zambia"},
		SystemType: "legacy",
		APIVersion: "1.0",
		Capabilities: []string{
			"stations",
			"routes",
			"schedules",
			"bookings",
			"telemetry",
		},
	}
}

// GetStations returns all TAZARA stations
func (a *TAZARAAdapter) GetStations(ctx context.Context) ([]Station, error) {
	a.mu.RLock()
	defer a.mu.RUnlock()
	
	stations := make([]Station, 0, len(a.stations))
	for _, s := range a.stations {
		stations = append(stations, *s)
	}
	return stations, nil
}

// GetStation returns a specific station
func (a *TAZARAAdapter) GetStation(ctx context.Context, stationID string) (*Station, error) {
	a.mu.RLock()
	defer a.mu.RUnlock()
	
	station, ok := a.stations[stationID]
	if !ok {
		return nil, fmt.Errorf("station not found: %s", stationID)
	}
	
	copy := *station
	return &copy, nil
}

// GetRoutes returns all TAZARA routes
func (a *TAZARAAdapter) GetRoutes(ctx context.Context) ([]Route, error) {
	a.mu.RLock()
	defer a.mu.RUnlock()
	
	routes := make([]Route, 0, len(a.routes))
	for _, r := range a.routes {
		routes = append(routes, *r)
	}
	return routes, nil
}

// GetRoute returns a specific route
func (a *TAZARAAdapter) GetRoute(ctx context.Context, routeID string) (*Route, error) {
	a.mu.RLock()
	defer a.mu.RUnlock()
	
	route, ok := a.routes[routeID]
	if !ok {
		return nil, fmt.Errorf("route not found: %s", routeID)
	}
	
	copy := *route
	return &copy, nil
}

// GetSchedule returns schedules for a route on a given date
func (a *TAZARAAdapter) GetSchedule(ctx context.Context, routeID string, date time.Time) ([]Schedule, error) {
	// In production, this would query the TAZARA legacy system
	// For now, return sample schedules
	
	route, ok := a.routes[routeID]
	if !ok {
		return nil, fmt.Errorf("route not found: %s", routeID)
	}
	
	schedules := []Schedule{
		{
			ID:            fmt.Sprintf("SCH-%s-%s", routeID, date.Format("20060102")),
			RouteID:       routeID,
			TrainNumber:   "TAZARA-001",
			TrainName:     route.Name,
			DepartureTime: time.Date(date.Year(), date.Month(), date.Day(), 14, 0, 0, 0, time.UTC),
			ArrivalTime:   time.Date(date.Year(), date.Month(), date.Day()+2, 12, 0, 0, 0, time.UTC),
			Status:        "scheduled",
		},
	}
	
	return schedules, nil
}

// GetTrainPositions returns current positions of all TAZARA trains
func (a *TAZARAAdapter) GetTrainPositions(ctx context.Context) ([]TrainPosition, error) {
	a.mu.RLock()
	defer a.mu.RUnlock()
	
	positions := make([]TrainPosition, 0, len(a.positions))
	for _, p := range a.positions {
		positions = append(positions, *p)
	}
	return positions, nil
}

// GetTrainPosition returns position of a specific train
func (a *TAZARAAdapter) GetTrainPosition(ctx context.Context, trainID string) (*TrainPosition, error) {
	a.mu.RLock()
	defer a.mu.RUnlock()
	
	pos, ok := a.positions[trainID]
	if !ok {
		return nil, fmt.Errorf("train not found: %s", trainID)
	}
	
	copy := *pos
	return &copy, nil
}

// GetDelays returns current delay information
func (a *TAZARAAdapter) GetDelays(ctx context.Context) ([]DelayInfo, error) {
	// In production, query TAZARA system for delays
	return []DelayInfo{}, nil
}

// CheckAvailability checks seat availability
func (a *TAZARAAdapter) CheckAvailability(ctx context.Context, routeID string, date time.Time) ([]Seat, error) {
	// In production, query TAZARA booking system
	return []Seat{
		{Class: "first", Available: 20, Price: 150.00, Currency: "USD"},
		{Class: "second", Available: 80, Price: 75.00, Currency: "USD"},
		{Class: "third", Available: 200, Price: 35.00, Currency: "USD"},
		{Class: "sleeper", Available: 10, Price: 200.00, Currency: "USD"},
	}, nil
}

// CreateBooking creates a new booking
func (a *TAZARAAdapter) CreateBooking(ctx context.Context, booking *BookingRequest) (*Booking, error) {
	// In production, this would:
	// 1. Call TAZARA legacy booking system
	// 2. Mint NFT ticket on Polygon
	// 3. Return combined booking info
	
	bookingID := fmt.Sprintf("TAZARA-%d", time.Now().UnixNano())
	
	return &Booking{
		ID:            bookingID,
		OperatorRef:   fmt.Sprintf("TZ%d", time.Now().Unix()),
		RouteID:       booking.RouteID,
		ScheduleID:    booking.ScheduleID,
		PassengerName: booking.PassengerName,
		Class:         booking.Class,
		SeatNumber:    "A12", // Would be assigned by TAZARA system
		Price:         75.00,
		Currency:      "USD",
		Status:        "confirmed",
		CreatedAt:     time.Now(),
	}, nil
}

// GetBooking retrieves a booking
func (a *TAZARAAdapter) GetBooking(ctx context.Context, bookingID string) (*Booking, error) {
	// In production, query TAZARA system
	return nil, fmt.Errorf("booking not found: %s", bookingID)
}

// CancelBooking cancels a booking
func (a *TAZARAAdapter) CancelBooking(ctx context.Context, bookingID string) error {
	// In production, call TAZARA cancellation API
	log.Printf("Cancelling TAZARA booking: %s", bookingID)
	return nil
}

// SupportsTelemetry returns true as TAZARA supports GPS telemetry
func (a *TAZARAAdapter) SupportsTelemetry() bool {
	return true
}

// SubscribeTelemetry subscribes to real-time telemetry updates
func (a *TAZARAAdapter) SubscribeTelemetry(ctx context.Context) (<-chan TelemetryMessage, error) {
	return a.telemetryChan, nil
}

// UpdatePosition updates a train's position (called by telemetry ingest)
func (a *TAZARAAdapter) UpdatePosition(pos *TrainPosition) {
	a.mu.Lock()
	a.positions[pos.TrainID] = pos
	a.mu.Unlock()
	
	// Broadcast to telemetry subscribers
	select {
	case a.telemetryChan <- TelemetryMessage{
		TrainID:   pos.TrainID,
		Latitude:  pos.Latitude,
		Longitude: pos.Longitude,
		Speed:     pos.Speed,
		Heading:   pos.Heading,
		Timestamp: pos.LastUpdate,
	}:
	default:
		// Channel full, skip
	}
}

// HealthCheck verifies connectivity to TAZARA systems
func (a *TAZARAAdapter) HealthCheck(ctx context.Context) error {
	// In production, ping TAZARA API endpoint
	return nil
}
