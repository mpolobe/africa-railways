package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
)

// Booking represents a ticket booking
type Booking struct {
	ID              string    `json:"id"`
	TicketID        string    `json:"ticket_id"`
	NFTId           string    `json:"nft_id"`
	SouvenirID      string    `json:"souvenir_id,omitempty"`
	PassengerName   string    `json:"passenger_name"`
	PassengerPhone  string    `json:"passenger_phone"`
	PassengerEmail  string    `json:"passenger_email,omitempty"`
	WalletAddress   string    `json:"wallet_address"`
	Route           string    `json:"route"`
	FromStation     string    `json:"from_station"`
	ToStation       string    `json:"to_station"`
	TravelDate      string    `json:"travel_date"`
	DepartureTime   string    `json:"departure_time"`
	Class           string    `json:"class"`
	Seat            string    `json:"seat,omitempty"`
	Passengers      int       `json:"passengers"`
	TotalPrice      float64   `json:"total_price"`
	Currency        string    `json:"currency"`
	PaymentMethod   string    `json:"payment_method"`
	PaymentStatus   string    `json:"payment_status"`
	PaymentTxHash   string    `json:"payment_tx_hash,omitempty"`
	BookingStatus   string    `json:"booking_status"`
	BookingSource   string    `json:"booking_source"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	UsedAt          *time.Time `json:"used_at,omitempty"`
	UsedBy          string    `json:"used_by,omitempty"`
	UsedLocation    string    `json:"used_location,omitempty"`
}

// Payment represents a payment transaction
type Payment struct {
	ID            string    `json:"id"`
	BookingID     string    `json:"booking_id"`
	Amount        float64   `json:"amount"`
	Currency      string    `json:"currency"`
	Method        string    `json:"method"` // AFRC, mobile_money, card, ussd
	Status        string    `json:"status"` // pending, completed, failed, refunded
	TxHash        string    `json:"tx_hash,omitempty"`
	ProviderRef   string    `json:"provider_ref,omitempty"`
	PhoneNumber   string    `json:"phone_number,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	CompletedAt   *time.Time `json:"completed_at,omitempty"`
	FailureReason string    `json:"failure_reason,omitempty"`
}

// BookingsStore manages bookings in memory (would be database in production)
type BookingsStore struct {
	bookings map[string]*Booking
	payments map[string]*Payment
	mu       sync.RWMutex
}

var bookingsStore = &BookingsStore{
	bookings: make(map[string]*Booking),
	payments: make(map[string]*Payment),
}

// CreateBookingRequest represents the request to create a booking
type CreateBookingRequest struct {
	PassengerName  string  `json:"passenger_name"`
	PassengerPhone string  `json:"passenger_phone"`
	PassengerEmail string  `json:"passenger_email,omitempty"`
	Route          string  `json:"route"`
	FromStation    string  `json:"from_station"`
	ToStation      string  `json:"to_station"`
	TravelDate     string  `json:"travel_date"`
	DepartureTime  string  `json:"departure_time,omitempty"`
	Class          string  `json:"class"`
	Passengers     int     `json:"passengers"`
	TotalPrice     float64 `json:"total_price"`
	Currency       string  `json:"currency"`
	PaymentMethod  string  `json:"payment_method"`
	BookingSource  string  `json:"booking_source"` // web, mobile, ussd, pilot
	WalletAddress  string  `json:"wallet_address,omitempty"`
}

// GenerateBookingID generates a unique booking ID
func GenerateBookingID() string {
	return fmt.Sprintf("BKG-%d-%s", time.Now().Unix(), randomString(6))
}

// GenerateTicketID generates a unique ticket ID
func GenerateTicketID() string {
	return fmt.Sprintf("TKT-TAZARA-%s", randomString(6))
}

// GenerateNFTID generates a unique NFT ID
func GenerateNFTID() string {
	return fmt.Sprintf("NFT-%d", time.Now().UnixNano())
}

// GeneratePaymentID generates a unique payment ID
func GeneratePaymentID() string {
	return fmt.Sprintf("PAY-%d-%s", time.Now().Unix(), randomString(6))
}

func randomString(n int) string {
	const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = letters[time.Now().UnixNano()%int64(len(letters))]
		time.Sleep(time.Nanosecond)
	}
	return string(b)
}

// CreateBooking creates a new booking
func (bs *BookingsStore) CreateBooking(req CreateBookingRequest) (*Booking, error) {
	bs.mu.Lock()
	defer bs.mu.Unlock()

	now := time.Now()
	booking := &Booking{
		ID:             GenerateBookingID(),
		TicketID:       GenerateTicketID(),
		NFTId:          GenerateNFTID(),
		PassengerName:  req.PassengerName,
		PassengerPhone: req.PassengerPhone,
		PassengerEmail: req.PassengerEmail,
		WalletAddress:  req.WalletAddress,
		Route:          req.Route,
		FromStation:    req.FromStation,
		ToStation:      req.ToStation,
		TravelDate:     req.TravelDate,
		DepartureTime:  req.DepartureTime,
		Class:          req.Class,
		Passengers:     req.Passengers,
		TotalPrice:     req.TotalPrice,
		Currency:       req.Currency,
		PaymentMethod:  req.PaymentMethod,
		PaymentStatus:  "pending",
		BookingStatus:  "pending",
		BookingSource:  req.BookingSource,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	// Generate wallet if not provided
	if booking.WalletAddress == "" && req.PassengerPhone != "" {
		booking.WalletAddress = generateWalletFromPhone(req.PassengerPhone)
	}

	// Generate souvenir ID for the NFT artwork
	booking.SouvenirID = fmt.Sprintf("SOU-TAZARA-%s", randomString(6))

	bs.bookings[booking.ID] = booking
	log.Printf("📝 Created booking: %s for %s (%s)", booking.ID, booking.PassengerName, booking.Route)

	return booking, nil
}

// generateWalletFromPhone creates a deterministic wallet address from phone number
func generateWalletFromPhone(phone string) string {
	// Simple deterministic generation (in production, use proper key derivation)
	digits := ""
	for _, c := range phone {
		if c >= '0' && c <= '9' {
			digits += string(c)
		}
	}
	if len(digits) < 10 {
		digits = digits + "0000000000"
	}
	digits = digits[len(digits)-10:]
	
	wallet := "0x"
	for i := 0; i < 40; i++ {
		digit := int(digits[i%10] - '0')
		wallet += fmt.Sprintf("%x", (digit*(i+1))%16)
	}
	return wallet
}

// ProcessPayment processes a payment for a booking
func (bs *BookingsStore) ProcessPayment(bookingID string, method string, txHash string) (*Payment, error) {
	bs.mu.Lock()
	defer bs.mu.Unlock()

	booking, exists := bs.bookings[bookingID]
	if !exists {
		return nil, fmt.Errorf("booking not found: %s", bookingID)
	}

	now := time.Now()
	payment := &Payment{
		ID:          GeneratePaymentID(),
		BookingID:   bookingID,
		Amount:      booking.TotalPrice,
		Currency:    booking.Currency,
		Method:      method,
		Status:      "completed",
		TxHash:      txHash,
		PhoneNumber: booking.PassengerPhone,
		CreatedAt:   now,
		CompletedAt: &now,
	}

	bs.payments[payment.ID] = payment

	// Update booking status
	booking.PaymentStatus = "completed"
	booking.PaymentTxHash = txHash
	booking.BookingStatus = "confirmed"
	booking.UpdatedAt = now

	log.Printf("💰 Payment processed: %s for booking %s (%.2f %s)", 
		payment.ID, bookingID, payment.Amount, payment.Currency)

	return payment, nil
}

// GetBooking retrieves a booking by ID
func (bs *BookingsStore) GetBooking(id string) (*Booking, bool) {
	bs.mu.RLock()
	defer bs.mu.RUnlock()
	booking, exists := bs.bookings[id]
	return booking, exists
}

// GetBookingByTicket retrieves a booking by ticket ID
func (bs *BookingsStore) GetBookingByTicket(ticketID string) (*Booking, bool) {
	bs.mu.RLock()
	defer bs.mu.RUnlock()
	for _, booking := range bs.bookings {
		if booking.TicketID == ticketID {
			return booking, true
		}
	}
	return nil, false
}

// GetBookingsByPhone retrieves bookings by phone number
func (bs *BookingsStore) GetBookingsByPhone(phone string) []*Booking {
	bs.mu.RLock()
	defer bs.mu.RUnlock()
	var result []*Booking
	for _, booking := range bs.bookings {
		if booking.PassengerPhone == phone {
			result = append(result, booking)
		}
	}
	return result
}

// GetBookingsByWallet retrieves bookings by wallet address
func (bs *BookingsStore) GetBookingsByWallet(wallet string) []*Booking {
	bs.mu.RLock()
	defer bs.mu.RUnlock()
	var result []*Booking
	for _, booking := range bs.bookings {
		if booking.WalletAddress == wallet {
			result = append(result, booking)
		}
	}
	return result
}

// GetAllBookings retrieves all bookings with optional filters
func (bs *BookingsStore) GetAllBookings(since *time.Time, status string, limit int) []*Booking {
	bs.mu.RLock()
	defer bs.mu.RUnlock()
	
	var result []*Booking
	for _, booking := range bs.bookings {
		if since != nil && booking.CreatedAt.Before(*since) {
			continue
		}
		if status != "" && booking.BookingStatus != status {
			continue
		}
		result = append(result, booking)
		if limit > 0 && len(result) >= limit {
			break
		}
	}
	return result
}

// MarkTicketUsed marks a ticket as used
func (bs *BookingsStore) MarkTicketUsed(ticketID string, staffID string, location string) error {
	bs.mu.Lock()
	defer bs.mu.Unlock()

	for _, booking := range bs.bookings {
		if booking.TicketID == ticketID {
			if booking.BookingStatus == "used" {
				return fmt.Errorf("ticket already used")
			}
			now := time.Now()
			booking.BookingStatus = "used"
			booking.UsedAt = &now
			booking.UsedBy = staffID
			booking.UsedLocation = location
			booking.UpdatedAt = now
			log.Printf("🎫 Ticket used: %s by %s at %s", ticketID, staffID, location)
			return nil
		}
	}
	return fmt.Errorf("ticket not found: %s", ticketID)
}

// GetPayment retrieves a payment by ID
func (bs *BookingsStore) GetPayment(id string) (*Payment, bool) {
	bs.mu.RLock()
	defer bs.mu.RUnlock()
	payment, exists := bs.payments[id]
	return payment, exists
}

// GetPaymentsByBooking retrieves payments for a booking
func (bs *BookingsStore) GetPaymentsByBooking(bookingID string) []*Payment {
	bs.mu.RLock()
	defer bs.mu.RUnlock()
	var result []*Payment
	for _, payment := range bs.payments {
		if payment.BookingID == bookingID {
			result = append(result, payment)
		}
	}
	return result
}

// GetBookingStats returns booking statistics
func (bs *BookingsStore) GetBookingStats() map[string]interface{} {
	bs.mu.RLock()
	defer bs.mu.RUnlock()

	var totalRevenue float64
	var confirmedCount, pendingCount, usedCount int
	sourceCount := make(map[string]int)
	classCount := make(map[string]int)

	for _, booking := range bs.bookings {
		if booking.PaymentStatus == "completed" {
			totalRevenue += booking.TotalPrice
		}
		switch booking.BookingStatus {
		case "confirmed":
			confirmedCount++
		case "pending":
			pendingCount++
		case "used":
			usedCount++
		}
		sourceCount[booking.BookingSource]++
		classCount[booking.Class]++
	}

	return map[string]interface{}{
		"total_bookings":     len(bs.bookings),
		"confirmed_bookings": confirmedCount,
		"pending_bookings":   pendingCount,
		"used_tickets":       usedCount,
		"total_revenue":      totalRevenue,
		"by_source":          sourceCount,
		"by_class":           classCount,
	}
}

// HTTP Handlers

// bookingsHandler handles GET /api/bookings
func bookingsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	switch r.Method {
	case "GET":
		// Get bookings with optional filters
		query := r.URL.Query()
		status := query.Get("status")
		phone := query.Get("phone")
		wallet := query.Get("wallet")

		var bookings []*Booking
		if phone != "" {
			bookings = bookingsStore.GetBookingsByPhone(phone)
		} else if wallet != "" {
			bookings = bookingsStore.GetBookingsByWallet(wallet)
		} else {
			bookings = bookingsStore.GetAllBookings(nil, status, 100)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(bookings)

	case "POST":
		// Create new booking
		var req CreateBookingRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Validate required fields
		if req.PassengerPhone == "" || req.Route == "" || req.TravelDate == "" {
			http.Error(w, "Missing required fields: passenger_phone, route, travel_date", http.StatusBadRequest)
			return
		}

		booking, err := bookingsStore.CreateBooking(req)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(booking)

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// bookingDetailHandler handles GET/PUT /api/bookings/{id}
func bookingDetailHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	bookingID := r.URL.Query().Get("id")
	if bookingID == "" {
		http.Error(w, "Missing booking ID", http.StatusBadRequest)
		return
	}

	booking, exists := bookingsStore.GetBooking(bookingID)
	if !exists {
		http.Error(w, "Booking not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(booking)
}

// paymentsHandler handles payment operations
func paymentsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	switch r.Method {
	case "POST":
		// Process payment
		var req struct {
			BookingID string `json:"booking_id"`
			Method    string `json:"method"`
			TxHash    string `json:"tx_hash,omitempty"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		if req.BookingID == "" {
			http.Error(w, "Missing booking_id", http.StatusBadRequest)
			return
		}

		// Generate tx hash if not provided (simulated)
		if req.TxHash == "" {
			req.TxHash = fmt.Sprintf("0x%s", randomString(64))
		}

		payment, err := bookingsStore.ProcessPayment(req.BookingID, req.Method, req.TxHash)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Get updated booking
		booking, _ := bookingsStore.GetBooking(req.BookingID)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"payment": payment,
			"booking": booking,
		})

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// ticketUseHandler handles marking tickets as used
func ticketUseHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		TicketID string `json:"ticket_id"`
		StaffID  string `json:"staff_id"`
		Location string `json:"location"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.TicketID == "" {
		http.Error(w, "Missing ticket_id", http.StatusBadRequest)
		return
	}

	err := bookingsStore.MarkTicketUsed(req.TicketID, req.StaffID, req.Location)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Get updated booking
	booking, _ := bookingsStore.GetBookingByTicket(req.TicketID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Ticket marked as used",
		"booking": booking,
	})
}

// bookingStatsHandler returns booking statistics
func bookingStatsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	stats := bookingsStore.GetBookingStats()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

// ticketValidateHandler validates a ticket
func ticketValidateHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	ticketID := r.URL.Query().Get("ticket_id")
	if ticketID == "" {
		http.Error(w, "Missing ticket_id", http.StatusBadRequest)
		return
	}

	booking, exists := bookingsStore.GetBookingByTicket(ticketID)
	if !exists {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"valid":   false,
			"message": "Ticket not found",
		})
		return
	}

	// Check if ticket is valid
	isValid := booking.BookingStatus == "confirmed" && booking.PaymentStatus == "completed"
	isUsed := booking.BookingStatus == "used"
	
	// Check expiry
	travelDate, _ := time.Parse("2006-01-02", booking.TravelDate)
	isExpired := travelDate.Before(time.Now().Truncate(24 * time.Hour))

	status := "valid"
	message := "Ticket is valid"
	if isUsed {
		status = "used"
		message = "Ticket has already been used"
	} else if isExpired {
		status = "expired"
		message = "Ticket has expired"
	} else if !isValid {
		status = "invalid"
		message = "Ticket payment not completed"
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"valid":   status == "valid",
		"status":  status,
		"message": message,
		"booking": booking,
	})
}
