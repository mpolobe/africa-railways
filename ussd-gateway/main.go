package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/rs/cors"
)

// Session represents an active USSD session
type Session struct {
	SessionID   string    `json:"session_id"`
	PhoneNumber string    `json:"phone_number"`
	State       string    `json:"state"`
	LastCommand string    `json:"last_command"`
	StartTime   time.Time `json:"start_time"`
	Data        map[string]interface{} `json:"data"`
}

// SessionStore manages active USSD sessions
type SessionStore struct {
	sessions map[string]*Session
	mu       sync.RWMutex
}

// Stats tracks USSD gateway statistics
type Stats struct {
	TotalSessionsToday int64
	SuccessfulSessions int64
	FailedSessions     int64
	TotalResponseTime  int64
	RequestCount       int64
	StartTime          time.Time
}

// RevenueTracker tracks revenue metrics
type RevenueTracker struct {
	ConfirmedTotal float64 // Transactions successful on Sui/Polygon
	PendingTotal   float64 // Sum of ticket prices in active sessions
	TotalRevenue   float64 // All-time revenue
	RevenueToday   float64 // Today's revenue
	TicketsSold    int64   // Total tickets sold
	TicketsToday   int64   // Tickets sold today
	ConversionRate float64 // Successful purchases / total sessions
	mu             sync.RWMutex
}

// TicketPrice represents pricing for different routes and classes
type TicketPrice struct {
	Route string
	Class string
	Price float64
}

var (
	sessionStore = &SessionStore{
		sessions: make(map[string]*Session),
	}
	stats = &Stats{
		StartTime: time.Now(),
	}
	statsMu sync.RWMutex
	
	revenueTracker = &RevenueTracker{}
	
	// Ticket pricing table
	ticketPrices = map[string]map[string]float64{
		"JHB-CPT": {
			"Economy":     150.00,
			"Business":    300.00,
			"FirstClass":  500.00,
		},
		"JHB-DBN": {
			"Economy":     120.00,
			"Business":    240.00,
			"FirstClass":  400.00,
		},
		"CPT-PE": {
			"Economy":     100.00,
			"Business":    200.00,
			"FirstClass":  350.00,
		},
	}
)

func main() {
	log.Println("📱 Africa Railways USSD Gateway Starting...")
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	// Setup routes
	mux := http.NewServeMux()
	
	// USSD webhook endpoint (receives requests from telecom)
	mux.HandleFunc("/ussd", handleUSSD)
	
	// Health check endpoint (for OCC dashboard)
	mux.HandleFunc("/health", handleHealth)
	
	// Stats endpoint
	mux.HandleFunc("/stats", handleStats)
	
	// Active sessions endpoint
	mux.HandleFunc("/sessions", handleSessions)
	
	// Revenue endpoint
	mux.HandleFunc("/revenue", handleRevenue)

	// Enable CORS
	handler := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders: []string{"*"},
	}).Handler(mux)

	port := os.Getenv("USSD_PORT")
	if port == "" {
		port = "8081"
	}

	log.Printf("✅ USSD Gateway running on http://localhost:%s\n", port)
	log.Printf("   Webhook: http://localhost:%s/ussd\n", port)
	log.Printf("   Health: http://localhost:%s/health\n", port)
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	// Start session cleanup goroutine
	go cleanupSessions()

	log.Fatal(http.ListenAndServe(":"+port, handler))
}

// handleUSSD processes incoming USSD requests from telecom gateway
func handleUSSD(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	
	// Parse USSD request (format varies by provider)
	// Common parameters: sessionId, phoneNumber, text, serviceCode
	sessionID := r.FormValue("sessionId")
	phoneNumber := r.FormValue("phoneNumber")
	text := r.FormValue("text")
	serviceCode := r.FormValue("serviceCode")

	log.Printf("📱 USSD Request: Session=%s, Phone=%s, Text=%s, Code=%s", 
		sessionID, phoneNumber, text, serviceCode)

	// Get or create session
	session := sessionStore.GetOrCreate(sessionID, phoneNumber)
	session.LastCommand = text

	// Process USSD menu
	response := processUSSDMenu(session, text)

	// Update stats
	statsMu.Lock()
	stats.RequestCount++
	stats.TotalResponseTime += time.Since(start).Milliseconds()
	statsMu.Unlock()

	// Send response
	w.Header().Set("Content-Type", "text/plain")
	fmt.Fprint(w, response)

	log.Printf("✅ Response sent in %dms", time.Since(start).Milliseconds())
}

// processUSSDMenu handles the USSD menu logic
func processUSSDMenu(session *Session, input string) string {
	// Main menu
	if input == "" {
		session.State = "main_menu"
		return "CON Welcome to Africa Railways\n" +
			"1. Buy Ticket\n" +
			"2. Check Ticket\n" +
			"3. My Tickets\n" +
			"4. Help"
	}

	// Buy ticket flow
	if input == "1" {
		session.State = "select_route"
		return "CON Select Route:\n" +
			"1. Johannesburg - Cape Town\n" +
			"2. Johannesburg - Durban\n" +
			"3. Cape Town - Port Elizabeth\n" +
			"0. Back"
	}

	if input == "1*1" {
		session.State = "select_date"
		session.Data = map[string]interface{}{
			"route": "JHB-CPT",
			"from":  "Johannesburg",
			"to":    "Cape Town",
		}
		return "CON Select Date:\n" +
			"1. Today\n" +
			"2. Tomorrow\n" +
			"3. Choose Date\n" +
			"0. Back"
	}

	if input == "1*1*1" {
		session.State = "select_class"
		session.Data["date"] = time.Now().Format("2006-01-02")
		return "CON Select Class:\n" +
			"1. Economy (R150)\n" +
			"2. Business (R300)\n" +
			"3. First Class (R500)\n" +
			"0. Back"
	}

	if input == "1*1*1*1" {
		session.State = "confirm_payment"
		session.Data["class"] = "Economy"
		route := session.Data["route"].(string)
		price := getTicketPrice(route, "Economy")
		session.Data["price"] = price
		
		// Add to potential revenue
		revenueTracker.addPotentialRevenue(price)
		
		return fmt.Sprintf("CON Confirm Purchase:\n"+
			"Route: Johannesburg - Cape Town\n"+
			"Date: Today\n"+
			"Class: Economy\n"+
			"Price: R%.2f\n\n"+
			"1. Pay with M-Pesa\n"+
			"2. Pay with Card\n"+
			"0. Cancel", price)
	}

	if input == "1*1*1*1*1" {
		// Process payment and mint ticket
		session.State = "payment_processing"
		
		// Get ticket price
		price, ok := session.Data["price"].(float64)
		if !ok {
			price = 150.00 // Default fallback
		}
		
		// In production:
		// 1. Initiate M-Pesa payment
		// 2. Wait for payment confirmation
		// 3. Mint NFT ticket on Polygon
		// 4. Upload metadata to IPFS
		// 5. Send ticket to user's wallet
		
		// Update revenue tracking
		revenueTracker.confirmPurchase(price)
		
		statsMu.Lock()
		stats.SuccessfulSessions++
		stats.TotalSessionsToday++
		statsMu.Unlock()
		
		// Clean up session
		sessionStore.Remove(session.SessionID)
		
		return fmt.Sprintf("END Payment initiated!\n"+
			"Amount: R%.2f\n"+
			"You will receive an SMS with your ticket details.\n"+
			"Wallet: 0x%s\n"+
			"Thank you for choosing Africa Railways!", price, generateMockWallet())
	}

	// Check ticket
	if input == "2" {
		session.State = "check_ticket"
		return "CON Enter your ticket number:"
	}

	// My tickets
	if input == "3" {
		session.State = "my_tickets"
		return "END Your Tickets:\n" +
			"1. JHB-CPT (Today, 14:00)\n" +
			"2. CPT-JHB (Tomorrow, 09:00)\n\n" +
			"Tickets are stored in your wallet."
	}

	// Help
	if input == "4" {
		return "END Africa Railways Help:\n" +
			"Call: 0800 RAILWAY\n" +
			"WhatsApp: +27 82 123 4567\n" +
			"Email: help@africarailways.com"
	}

	// Back to main menu
	if input == "0" || input[len(input)-1:] == "0" {
		session.State = "main_menu"
		return processUSSDMenu(session, "")
	}

	// Invalid input
	return "END Invalid selection.\nPlease dial *123# to try again."
}

// handleHealth returns health status for OCC dashboard
func handleHealth(w http.ResponseWriter, r *http.Request) {
	sessionStore.mu.RLock()
	activeSessions := len(sessionStore.sessions)
	sessionStore.mu.RUnlock()

	statsMu.RLock()
	totalSessions := stats.TotalSessionsToday
	successRate := 0.0
	if stats.RequestCount > 0 {
		successRate = (float64(stats.SuccessfulSessions) / float64(stats.TotalSessionsToday)) * 100
	}
	avgResponseTime := int64(0)
	if stats.RequestCount > 0 {
		avgResponseTime = stats.TotalResponseTime / stats.RequestCount
	}
	uptime := time.Since(stats.StartTime)
	uptimePercent := 99.7 // Mock uptime
	statsMu.RUnlock()

	// Find last session time
	lastSessionTime := time.Time{}
	sessionStore.mu.RLock()
	for _, session := range sessionStore.sessions {
		if session.StartTime.After(lastSessionTime) {
			lastSessionTime = session.StartTime
		}
	}
	sessionStore.mu.RUnlock()

	// Get revenue metrics
	liveRevenue := calculateLiveRevenue()
	
	health := map[string]interface{}{
		"connected":                true,
		"active_sessions":          activeSessions,
		"total_sessions_today":     totalSessions,
		"success_rate":             successRate,
		"average_response_time_ms": avgResponseTime,
		"peak_sessions":            activeSessions, // Mock
		"failed_sessions":          stats.FailedSessions,
		"last_session_time":        lastSessionTime,
		"uptime_percent":           uptimePercent,
		"uptime_duration":          uptime.String(),
		"revenue": map[string]interface{}{
			"confirmed_total": liveRevenue.ConfirmedTotal,
			"pending_total":   liveRevenue.PendingTotal,
			"revenue_today":   liveRevenue.RevenueToday,
			"tickets_today":   liveRevenue.TicketsToday,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(health)
}

// handleStats returns detailed statistics
func handleStats(w http.ResponseWriter, r *http.Request) {
	statsMu.RLock()
	defer statsMu.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

// handleSessions returns active sessions
func handleSessions(w http.ResponseWriter, r *http.Request) {
	sessionStore.mu.RLock()
	defer sessionStore.mu.RUnlock()

	sessions := make([]*Session, 0, len(sessionStore.sessions))
	for _, session := range sessionStore.sessions {
		sessions = append(sessions, session)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sessions)
}

// SessionStore methods
func (s *SessionStore) GetOrCreate(sessionID, phoneNumber string) *Session {
	s.mu.Lock()
	defer s.mu.Unlock()

	if session, exists := s.sessions[sessionID]; exists {
		return session
	}

	session := &Session{
		SessionID:   sessionID,
		PhoneNumber: phoneNumber,
		State:       "main_menu",
		StartTime:   time.Now(),
		Data:        make(map[string]interface{}),
	}
	s.sessions[sessionID] = session
	return session
}

func (s *SessionStore) Remove(sessionID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.sessions, sessionID)
}

// cleanupSessions removes stale sessions (older than 5 minutes)
func cleanupSessions() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		sessionStore.mu.Lock()
		now := time.Now()
		for id, session := range sessionStore.sessions {
			if now.Sub(session.StartTime) > 5*time.Minute {
				delete(sessionStore.sessions, id)
				log.Printf("🧹 Cleaned up stale session: %s", id)
			}
		}
		sessionStore.mu.Unlock()
	}
}

// generateMockWallet generates a mock wallet address for demo
func generateMockWallet() string {
	return fmt.Sprintf("%x", time.Now().UnixNano())[:40]
}

// getTicketPrice returns the price for a route and class
func getTicketPrice(route, class string) float64 {
	if prices, ok := ticketPrices[route]; ok {
		if price, ok := prices[class]; ok {
			return price
		}
	}
	return 150.00 // Default price
}

// RevenueTracker methods
func (rt *RevenueTracker) addPotentialRevenue(amount float64) {
	rt.mu.Lock()
	defer rt.mu.Unlock()
	rt.PendingTotal += amount
}

func (rt *RevenueTracker) removePotentialRevenue(amount float64) {
	rt.mu.Lock()
	defer rt.mu.Unlock()
	rt.PendingTotal -= amount
	if rt.PendingTotal < 0 {
		rt.PendingTotal = 0
	}
}

func (rt *RevenueTracker) confirmPurchase(amount float64) {
	rt.mu.Lock()
	defer rt.mu.Unlock()
	
	// Remove from pending
	rt.PendingTotal -= amount
	if rt.PendingTotal < 0 {
		rt.PendingTotal = 0
	}
	
	// Add to confirmed
	rt.ConfirmedTotal += amount
	rt.TotalRevenue += amount
	rt.RevenueToday += amount
	rt.TicketsSold++
	rt.TicketsToday++
}

func (rt *RevenueTracker) cancelPurchase(amount float64) {
	rt.mu.Lock()
	defer rt.mu.Unlock()
	
	// Remove from pending
	rt.PendingTotal -= amount
	if rt.PendingTotal < 0 {
		rt.PendingTotal = 0
	}
}

func (rt *RevenueTracker) getMetrics() map[string]interface{} {
	rt.mu.RLock()
	defer rt.mu.RUnlock()
	
	// Calculate conversion rate
	statsMu.RLock()
	totalSessions := stats.TotalSessionsToday
	successfulSessions := stats.SuccessfulSessions
	statsMu.RUnlock()
	
	conversionRate := 0.0
	if totalSessions > 0 {
		conversionRate = (float64(successfulSessions) / float64(totalSessions)) * 100
	}
	
	averageTicketPrice := 0.0
	if rt.TicketsSold > 0 {
		averageTicketPrice = rt.TotalRevenue / float64(rt.TicketsSold)
	}
	
	return map[string]interface{}{
		"confirmed_total":      rt.ConfirmedTotal,
		"pending_total":        rt.PendingTotal,
		"total_revenue":        rt.TotalRevenue,
		"revenue_today":        rt.RevenueToday,
		"tickets_sold":         rt.TicketsSold,
		"tickets_today":        rt.TicketsToday,
		"conversion_rate":      conversionRate,
		"average_ticket_price": averageTicketPrice,
	}
}

// calculateLiveRevenue recalculates pending revenue from active sessions
func calculateLiveRevenue() RevenueTracker {
	sessionStore.mu.RLock()
	defer sessionStore.mu.RUnlock()
	
	var pending float64
	
	// Iterate through active sessions
	for _, session := range sessionStore.sessions {
		// Check if session has reached payment confirmation stage
		if session.State == "confirm_payment" || session.State == "payment_processing" {
			if price, ok := session.Data["price"].(float64); ok {
				pending += price
			}
		}
	}
	
	revenueTracker.mu.Lock()
	revenueTracker.PendingTotal = pending
	revenueTracker.mu.Unlock()
	
	// Return current state
	revenueTracker.mu.RLock()
	defer revenueTracker.mu.RUnlock()
	
	return RevenueTracker{
		ConfirmedTotal: revenueTracker.ConfirmedTotal,
		PendingTotal:   pending,
		TotalRevenue:   revenueTracker.TotalRevenue,
		RevenueToday:   revenueTracker.RevenueToday,
		TicketsSold:    revenueTracker.TicketsSold,
		TicketsToday:   revenueTracker.TicketsToday,
		ConversionRate: revenueTracker.ConversionRate,
	}
}

// handleRevenue returns revenue metrics
func handleRevenue(w http.ResponseWriter, r *http.Request) {
	// Recalculate live revenue
	liveRevenue := calculateLiveRevenue()
	
	metrics := map[string]interface{}{
		"confirmed_total":      liveRevenue.ConfirmedTotal,
		"pending_total":        liveRevenue.PendingTotal,
		"total_revenue":        liveRevenue.TotalRevenue,
		"revenue_today":        liveRevenue.RevenueToday,
		"tickets_sold":         liveRevenue.TicketsSold,
		"tickets_today":        liveRevenue.TicketsToday,
		"conversion_rate":      liveRevenue.ConversionRate,
		"average_ticket_price": 0.0,
	}
	
	if liveRevenue.TicketsSold > 0 {
		metrics["average_ticket_price"] = liveRevenue.TotalRevenue / float64(liveRevenue.TicketsSold)
	}
	
	// Add breakdown by route
	metrics["pricing"] = ticketPrices
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metrics)
}
