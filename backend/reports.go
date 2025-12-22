package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"
)

// NodeReport represents a railway node activity report
type NodeReport struct {
	ID           int64     `json:"id"`
	NodeLocation string    `json:"node_location"`
	TicketCount  int       `json:"ticket_count"`
	Revenue      float64   `json:"revenue"`
	SensorCount  int       `json:"sensor_count"`
	Status       string    `json:"status"`
	LastActivity time.Time `json:"last_activity"`
}

// ReportsStore holds all node reports
type ReportsStore struct {
	mu      sync.RWMutex
	reports []NodeReport
}

var reportsStore = &ReportsStore{
	reports: []NodeReport{
		{
			ID:           1,
			NodeLocation: "Lusaka Hub, Zambia",
			TicketCount:  1247,
			Revenue:      62350.00,
			SensorCount:  12,
			Status:       "Online",
			LastActivity: time.Now().Add(-5 * time.Minute),
		},
		{
			ID:           2,
			NodeLocation: "Nairobi Hub, Kenya",
			TicketCount:  2156,
			Revenue:      107800.00,
			SensorCount:  15,
			Status:       "Online",
			LastActivity: time.Now().Add(-2 * time.Minute),
		},
		{
			ID:           3,
			NodeLocation: "Dar es Salaam Hub, Tanzania",
			TicketCount:  892,
			Revenue:      44600.00,
			SensorCount:  8,
			Status:       "Online",
			LastActivity: time.Now().Add(-10 * time.Minute),
		},
		{
			ID:           4,
			NodeLocation: "Johannesburg Hub, South Africa",
			TicketCount:  3421,
			Revenue:      171050.00,
			SensorCount:  20,
			Status:       "Online",
			LastActivity: time.Now().Add(-1 * time.Minute),
		},
	},
}

// GetReports returns all node reports
func (rs *ReportsStore) GetReports() []NodeReport {
	rs.mu.RLock()
	defer rs.mu.RUnlock()
	
	// Return a copy to avoid race conditions
	reports := make([]NodeReport, len(rs.reports))
	copy(reports, rs.reports)
	return reports
}

// UpdateReport updates a specific node report
func (rs *ReportsStore) UpdateReport(id int64, ticketCount int, revenue float64) {
	rs.mu.Lock()
	defer rs.mu.Unlock()
	
	for i := range rs.reports {
		if rs.reports[i].ID == id {
			rs.reports[i].TicketCount = ticketCount
			rs.reports[i].Revenue = revenue
			rs.reports[i].LastActivity = time.Now()
			log.Printf("📊 Updated report for %s: %d tickets, %.2f AFRC", 
				rs.reports[i].NodeLocation, ticketCount, revenue)
			break
		}
	}
}

// IncrementTickets increments ticket count for a node
func (rs *ReportsStore) IncrementTickets(nodeLocation string, count int, revenue float64) {
	rs.mu.Lock()
	defer rs.mu.Unlock()
	
	for i := range rs.reports {
		if rs.reports[i].NodeLocation == nodeLocation {
			rs.reports[i].TicketCount += count
			rs.reports[i].Revenue += revenue
			rs.reports[i].LastActivity = time.Now()
			log.Printf("🎫 %s: +%d tickets, +%.2f AFRC", nodeLocation, count, revenue)
			break
		}
	}
}

// UpdateNodeStatus updates the online/offline status of a node
func (rs *ReportsStore) UpdateNodeStatus(nodeLocation string, status string) {
	rs.mu.Lock()
	defer rs.mu.Unlock()
	
	for i := range rs.reports {
		if rs.reports[i].NodeLocation == nodeLocation {
			rs.reports[i].Status = status
			rs.reports[i].LastActivity = time.Now()
			log.Printf("🔄 %s status: %s", nodeLocation, status)
			break
		}
	}
}

// reportsHandler handles GET /api/reports
func reportsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	reports := reportsStore.GetReports()
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(reports)
	
	log.Printf("📊 Served %d reports", len(reports))
}

// nodeReportHandler handles GET /api/reports/:id
func nodeReportHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	// Extract node ID from URL
	// For simplicity, we'll return all reports
	// In production, parse the ID and return specific report
	
	reports := reportsStore.GetReports()
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(reports)
}

// simulateNodeActivity simulates railway node activity
func simulateNodeActivity() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()
	
	nodes := []string{
		"Lusaka Hub, Zambia",
		"Nairobi Hub, Kenya",
		"Dar es Salaam Hub, Tanzania",
		"Johannesburg Hub, South Africa",
	}
	
	for range ticker.C {
		// Randomly update a node
		nodeIdx := time.Now().Unix() % int64(len(nodes))
		node := nodes[nodeIdx]
		
		// Simulate ticket sales
		ticketCount := int(time.Now().Unix()%10) + 1
		revenue := float64(ticketCount) * 50.0 // 50 AFRC per ticket
		
		reportsStore.IncrementTickets(node, ticketCount, revenue)
	}
}

// RegisterReportsHandlers registers all report-related HTTP handlers
func RegisterReportsHandlers() {
	http.HandleFunc("/api/reports", reportsHandler)
	http.HandleFunc("/api/reports/", nodeReportHandler)
	
	// Start background simulation
	go simulateNodeActivity()
	
	log.Println("📊 Reports API registered")
}
