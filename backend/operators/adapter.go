// Package operators provides adapters for integrating with national railway operator systems
package operators

import (
	"context"
	"time"
)

// Station represents a railway station in the standardized schema
type Station struct {
	ID          string  `json:"id"`
	Code        string  `json:"code"`
	Name        string  `json:"name"`
	Country     string  `json:"country"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	Timezone    string  `json:"timezone"`
	Facilities  []string `json:"facilities,omitempty"`
	OperatorID  string  `json:"operator_id"`
}

// Route represents a railway route
type Route struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	OperatorID  string   `json:"operator_id"`
	Origin      string   `json:"origin"`
	Destination string   `json:"destination"`
	Stations    []string `json:"stations"`
	DistanceKM  float64  `json:"distance_km"`
	Duration    string   `json:"duration"`
}

// Schedule represents a train schedule
type Schedule struct {
	ID            string    `json:"id"`
	RouteID       string    `json:"route_id"`
	TrainNumber   string    `json:"train_number"`
	TrainName     string    `json:"train_name"`
	DepartureTime time.Time `json:"departure_time"`
	ArrivalTime   time.Time `json:"arrival_time"`
	Status        string    `json:"status"` // "scheduled", "delayed", "cancelled"
	DelayMinutes  int       `json:"delay_minutes,omitempty"`
	Stops         []Stop    `json:"stops"`
}

// Stop represents a scheduled stop
type Stop struct {
	StationID     string    `json:"station_id"`
	StationName   string    `json:"station_name"`
	ArrivalTime   time.Time `json:"arrival_time"`
	DepartureTime time.Time `json:"departure_time"`
	Platform      string    `json:"platform,omitempty"`
}

// TrainPosition represents real-time train location
type TrainPosition struct {
	TrainID      string    `json:"train_id"`
	TrainNumber  string    `json:"train_number"`
	Latitude     float64   `json:"latitude"`
	Longitude    float64   `json:"longitude"`
	Speed        float64   `json:"speed_kmh"`
	Heading      float64   `json:"heading"`
	RouteID      string    `json:"route_id"`
	NextStation  string    `json:"next_station"`
	ETA          time.Time `json:"eta"`
	Status       string    `json:"status"`
	LastUpdate   time.Time `json:"last_update"`
}

// DelayInfo represents delay information
type DelayInfo struct {
	TrainID      string `json:"train_id"`
	TrainNumber  string `json:"train_number"`
	RouteID      string `json:"route_id"`
	DelayMinutes int    `json:"delay_minutes"`
	Reason       string `json:"reason,omitempty"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// Seat represents available seating
type Seat struct {
	Class       string  `json:"class"` // "first", "second", "third", "sleeper"
	Available   int     `json:"available"`
	Price       float64 `json:"price"`
	Currency    string  `json:"currency"`
}

// BookingRequest represents a ticket booking request
type BookingRequest struct {
	RouteID       string    `json:"route_id"`
	ScheduleID    string    `json:"schedule_id"`
	PassengerName string    `json:"passenger_name"`
	PassengerID   string    `json:"passenger_id"`
	Class         string    `json:"class"`
	SeatNumber    string    `json:"seat_number,omitempty"`
	Date          time.Time `json:"date"`
	PaymentMethod string    `json:"payment_method"`
	PaymentRef    string    `json:"payment_ref,omitempty"`
}

// Booking represents a confirmed booking
type Booking struct {
	ID            string    `json:"id"`
	OperatorRef   string    `json:"operator_ref"`
	RouteID       string    `json:"route_id"`
	ScheduleID    string    `json:"schedule_id"`
	PassengerName string    `json:"passenger_name"`
	Class         string    `json:"class"`
	SeatNumber    string    `json:"seat_number"`
	Price         float64   `json:"price"`
	Currency      string    `json:"currency"`
	Status        string    `json:"status"` // "confirmed", "pending", "cancelled"
	QRCode        string    `json:"qr_code,omitempty"`
	NFTTokenID    string    `json:"nft_token_id,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

// TelemetryMessage represents real-time telemetry data
type TelemetryMessage struct {
	DeviceID   string                 `json:"device_id"`
	TrainID    string                 `json:"train_id"`
	Latitude   float64                `json:"latitude"`
	Longitude  float64                `json:"longitude"`
	Speed      float64                `json:"speed"`
	Heading    float64                `json:"heading"`
	Timestamp  time.Time              `json:"timestamp"`
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
}

// OperatorAdapter defines the interface that all national operator adapters must implement
type OperatorAdapter interface {
	// GetOperatorInfo returns information about the operator
	GetOperatorInfo() OperatorInfo
	
	// Station and route information
	GetStations(ctx context.Context) ([]Station, error)
	GetStation(ctx context.Context, stationID string) (*Station, error)
	GetRoutes(ctx context.Context) ([]Route, error)
	GetRoute(ctx context.Context, routeID string) (*Route, error)
	GetSchedule(ctx context.Context, routeID string, date time.Time) ([]Schedule, error)
	
	// Real-time data
	GetTrainPositions(ctx context.Context) ([]TrainPosition, error)
	GetTrainPosition(ctx context.Context, trainID string) (*TrainPosition, error)
	GetDelays(ctx context.Context) ([]DelayInfo, error)
	
	// Booking operations
	CheckAvailability(ctx context.Context, routeID string, date time.Time) ([]Seat, error)
	CreateBooking(ctx context.Context, booking *BookingRequest) (*Booking, error)
	GetBooking(ctx context.Context, bookingID string) (*Booking, error)
	CancelBooking(ctx context.Context, bookingID string) error
	
	// Telemetry (optional - not all operators support this)
	SupportsTelemetry() bool
	SubscribeTelemetry(ctx context.Context) (<-chan TelemetryMessage, error)
	
	// Health check
	HealthCheck(ctx context.Context) error
}

// OperatorInfo contains metadata about an operator
type OperatorInfo struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Country     string   `json:"country"`
	Countries   []string `json:"countries,omitempty"` // For cross-border operators
	SystemType  string   `json:"system_type"` // "legacy", "modern", "mixed"
	APIVersion  string   `json:"api_version"`
	Capabilities []string `json:"capabilities"`
}

// AdapterRegistry manages all registered operator adapters
type AdapterRegistry struct {
	adapters map[string]OperatorAdapter
}

// NewAdapterRegistry creates a new adapter registry
func NewAdapterRegistry() *AdapterRegistry {
	return &AdapterRegistry{
		adapters: make(map[string]OperatorAdapter),
	}
}

// Register adds an operator adapter to the registry
func (r *AdapterRegistry) Register(operatorID string, adapter OperatorAdapter) {
	r.adapters[operatorID] = adapter
}

// Get retrieves an operator adapter by ID
func (r *AdapterRegistry) Get(operatorID string) (OperatorAdapter, bool) {
	adapter, ok := r.adapters[operatorID]
	return adapter, ok
}

// GetAll returns all registered adapters
func (r *AdapterRegistry) GetAll() map[string]OperatorAdapter {
	return r.adapters
}

// ListOperators returns info about all registered operators
func (r *AdapterRegistry) ListOperators() []OperatorInfo {
	operators := make([]OperatorInfo, 0, len(r.adapters))
	for _, adapter := range r.adapters {
		operators = append(operators, adapter.GetOperatorInfo())
	}
	return operators
}
