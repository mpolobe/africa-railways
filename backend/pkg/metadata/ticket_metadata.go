package metadata

import (
	"encoding/json"
	"fmt"
	"time"
)

// TicketMetadata represents the NFT metadata for a railway ticket
// Following ERC-721 metadata standard
type TicketMetadata struct {
	Name        string           `json:"name"`
	Description string           `json:"description"`
	Image       string           `json:"image"`
	ExternalURL string           `json:"external_url,omitempty"`
	Attributes  []TicketAttribute `json:"attributes"`
}

// TicketAttribute represents a trait of the ticket NFT
type TicketAttribute struct {
	TraitType   string      `json:"trait_type"`
	Value       interface{} `json:"value"`
	DisplayType string      `json:"display_type,omitempty"` // "date", "number", etc.
}

// TicketDetails contains the business logic data for a ticket
type TicketDetails struct {
	TicketID       string
	PassengerName  string
	PassengerPhone string
	RouteFrom      string
	RouteTo        string
	DepartureTime  time.Time
	ArrivalTime    time.Time
	SeatNumber     string
	Class          string // "Economy", "Business", "VIP"
	Price          float64
	Currency       string
	QRCode         string // Base64 encoded QR code or IPFS hash
}

// GenerateMetadata creates NFT metadata from ticket details
func GenerateMetadata(ticket TicketDetails) *TicketMetadata {
	// Format route code (e.g., "JHB-CPT")
	routeCode := fmt.Sprintf("%s-%s", 
		getRouteCode(ticket.RouteFrom), 
		getRouteCode(ticket.RouteTo))

	return &TicketMetadata{
		Name: fmt.Sprintf("Africa Railways: Ticket #%s", ticket.TicketID),
		Description: fmt.Sprintf(
			"%s Class Ticket - %s to %s",
			ticket.Class,
			ticket.RouteFrom,
			ticket.RouteTo,
		),
		Image:       ticket.QRCode, // IPFS hash of ticket image/QR code
		ExternalURL: fmt.Sprintf("https://africarailways.com/verify/%s", ticket.TicketID),
		Attributes: []TicketAttribute{
			{TraitType: "Route", Value: routeCode},
			{TraitType: "Class", Value: ticket.Class},
			{TraitType: "Seat", Value: ticket.SeatNumber},
			{
				TraitType:   "Departure",
				Value:       ticket.DepartureTime.Unix(),
				DisplayType: "date",
			},
			{
				TraitType:   "Arrival",
				Value:       ticket.ArrivalTime.Unix(),
				DisplayType: "date",
			},
			{TraitType: "Passenger", Value: ticket.PassengerName},
			{TraitType: "Phone", Value: ticket.PassengerPhone},
			{
				TraitType:   "Price",
				Value:       ticket.Price,
				DisplayType: "number",
			},
			{TraitType: "Currency", Value: ticket.Currency},
		},
	}
}

// getRouteCode converts city names to 3-letter codes
func getRouteCode(city string) string {
	codes := map[string]string{
		"Johannesburg": "JHB",
		"Cape Town":    "CPT",
		"Durban":       "DUR",
		"Pretoria":     "PTA",
		"Port Elizabeth": "PLZ",
		"Bloemfontein": "BFN",
		"East London":  "ELS",
		"Kimberley":    "KIM",
		"Polokwane":    "PTG",
		"Nelspruit":    "NLP",
	}
	
	if code, ok := codes[city]; ok {
		return code
	}
	
	// Default: use first 3 letters uppercase
	if len(city) >= 3 {
		return city[:3]
	}
	return city
}

// ToJSON converts metadata to JSON string
func (m *TicketMetadata) ToJSON() (string, error) {
	data, err := json.MarshalIndent(m, "", "  ")
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// ToBytes converts metadata to JSON bytes
func (m *TicketMetadata) ToBytes() ([]byte, error) {
	return json.Marshal(m)
}
