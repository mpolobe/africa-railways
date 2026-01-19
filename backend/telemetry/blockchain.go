// Package telemetry provides blockchain integration for immutable telemetry records
package telemetry

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"
)

// TelemetryRecord represents an immutable record of telemetry data
type TelemetryRecord struct {
	RecordID     string    `json:"record_id"`
	RecordType   string    `json:"record_type"` // "position", "alert", "report"
	DeviceID     string    `json:"device_id"`
	DataHash     string    `json:"data_hash"`
	Timestamp    time.Time `json:"timestamp"`
	BlockchainTx string    `json:"blockchain_tx,omitempty"`
	SuiObjectID  string    `json:"sui_object_id,omitempty"`
	Verified     bool      `json:"verified"`
}

// SafetyReport represents a worker safety report to be recorded on-chain
type SafetyReport struct {
	ReportID     string                 `json:"report_id"`
	WorkerID     string                 `json:"worker_id"`
	WorkerName   string                 `json:"worker_name"`
	ReportType   string                 `json:"report_type"` // "inspection", "incident", "hazard"
	Severity     string                 `json:"severity"`    // "low", "medium", "high", "critical"
	Location     GeoLocation            `json:"location"`
	RouteID      string                 `json:"route_id"`
	SectionKM    float64                `json:"section_km"`
	Description  string                 `json:"description"`
	Photos       []string               `json:"photos,omitempty"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
	Timestamp    time.Time              `json:"timestamp"`
	DataHash     string                 `json:"data_hash"`
	BlockchainTx string                 `json:"blockchain_tx,omitempty"`
	SuiObjectID  string                 `json:"sui_object_id,omitempty"`
	SENTReward   float64                `json:"sent_reward,omitempty"`
}

// GeoLocation represents a geographic coordinate
type GeoLocation struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Accuracy  float64 `json:"accuracy"`
}

// BlockchainBridge handles communication with Sui blockchain
type BlockchainBridge struct {
	mu           sync.Mutex
	suiRPCURL    string
	packageID    string
	records      map[string]*TelemetryRecord
	reports      map[string]*SafetyReport
	pendingQueue chan interface{}
	rewardRates  map[string]float64 // SENT reward rates by report type
}

// NewBlockchainBridge creates a new blockchain bridge
func NewBlockchainBridge(suiRPCURL, packageID string) *BlockchainBridge {
	bridge := &BlockchainBridge{
		suiRPCURL:    suiRPCURL,
		packageID:    packageID,
		records:      make(map[string]*TelemetryRecord),
		reports:      make(map[string]*SafetyReport),
		pendingQueue: make(chan interface{}, 1000),
		rewardRates: map[string]float64{
			"inspection": 10.0,  // 10 SENT per inspection
			"incident":   50.0,  // 50 SENT per incident report
			"hazard":     25.0,  // 25 SENT per hazard report
			"shift":      5.0,   // 5 SENT per shift completion
		},
	}
	
	// Start background processor
	go bridge.processQueue()
	
	return bridge
}

// RecordTelemetry creates an immutable record of telemetry data
func (b *BlockchainBridge) RecordTelemetry(msg *TelemetryMessage) (*TelemetryRecord, error) {
	// Create hash of telemetry data
	dataHash := b.hashData(msg)
	
	record := &TelemetryRecord{
		RecordID:   fmt.Sprintf("TEL-%d", time.Now().UnixNano()),
		RecordType: "position",
		DeviceID:   msg.DeviceID,
		DataHash:   dataHash,
		Timestamp:  msg.Timestamp,
		Verified:   false,
	}
	
	b.mu.Lock()
	b.records[record.RecordID] = record
	b.mu.Unlock()
	
	// Queue for blockchain submission
	b.pendingQueue <- record
	
	return record, nil
}

// RecordSafetyReport creates an immutable record of a safety report
func (b *BlockchainBridge) RecordSafetyReport(report *SafetyReport) error {
	// Create hash of report data
	report.DataHash = b.hashData(report)
	report.ReportID = fmt.Sprintf("RPT-%d", time.Now().UnixNano())
	
	// Calculate SENT reward
	if rate, ok := b.rewardRates[report.ReportType]; ok {
		report.SENTReward = rate
		// Bonus for high severity
		if report.Severity == "critical" {
			report.SENTReward *= 2.0
		} else if report.Severity == "high" {
			report.SENTReward *= 1.5
		}
	}
	
	b.mu.Lock()
	b.reports[report.ReportID] = report
	b.mu.Unlock()
	
	// Queue for blockchain submission
	b.pendingQueue <- report
	
	log.Printf("Safety report %s queued for blockchain: type=%s, reward=%.2f SENT",
		report.ReportID, report.ReportType, report.SENTReward)
	
	return nil
}

// hashData creates a SHA256 hash of the data
func (b *BlockchainBridge) hashData(data interface{}) string {
	jsonData, _ := json.Marshal(data)
	hash := sha256.Sum256(jsonData)
	return hex.EncodeToString(hash[:])
}

// processQueue handles background blockchain submissions
func (b *BlockchainBridge) processQueue() {
	for item := range b.pendingQueue {
		switch v := item.(type) {
		case *TelemetryRecord:
			b.submitTelemetryToChain(v)
		case *SafetyReport:
			b.submitReportToChain(v)
		}
	}
}

// submitTelemetryToChain submits telemetry record to Sui blockchain
func (b *BlockchainBridge) submitTelemetryToChain(record *TelemetryRecord) {
	// In production, this would call the Sui RPC to create a Move object
	// For now, simulate the blockchain interaction
	
	log.Printf("Submitting telemetry record %s to Sui blockchain...", record.RecordID)
	
	// Simulate blockchain transaction
	time.Sleep(100 * time.Millisecond)
	
	// Generate mock transaction ID and object ID
	txHash := b.hashData(map[string]interface{}{
		"record_id": record.RecordID,
		"timestamp": time.Now().UnixNano(),
	})
	
	b.mu.Lock()
	record.BlockchainTx = "0x" + txHash[:64]
	record.SuiObjectID = "0x" + txHash[64:] + txHash[:32]
	record.Verified = true
	b.mu.Unlock()
	
	log.Printf("Telemetry record %s verified on-chain: tx=%s", 
		record.RecordID, record.BlockchainTx[:20]+"...")
}

// submitReportToChain submits safety report to Sui blockchain and triggers SENT reward
func (b *BlockchainBridge) submitReportToChain(report *SafetyReport) {
	log.Printf("Submitting safety report %s to Sui blockchain...", report.ReportID)
	
	// Simulate blockchain transaction
	time.Sleep(100 * time.Millisecond)
	
	// Generate mock transaction ID and object ID
	txHash := b.hashData(map[string]interface{}{
		"report_id": report.ReportID,
		"timestamp": time.Now().UnixNano(),
	})
	
	b.mu.Lock()
	report.BlockchainTx = "0x" + txHash[:64]
	report.SuiObjectID = "0x" + txHash[64:] + txHash[:32]
	b.mu.Unlock()
	
	log.Printf("Safety report %s recorded on-chain: tx=%s, reward=%.2f SENT to worker %s",
		report.ReportID, report.BlockchainTx[:20]+"...", report.SENTReward, report.WorkerID)
	
	// In production, this would also trigger the SENT token transfer
	// via the Polygon contract or Sui Move module
}

// GetRecord retrieves a telemetry record by ID
func (b *BlockchainBridge) GetRecord(recordID string) (*TelemetryRecord, bool) {
	b.mu.Lock()
	defer b.mu.Unlock()
	
	record, ok := b.records[recordID]
	if !ok {
		return nil, false
	}
	
	copy := *record
	return &copy, true
}

// GetReport retrieves a safety report by ID
func (b *BlockchainBridge) GetReport(reportID string) (*SafetyReport, bool) {
	b.mu.Lock()
	defer b.mu.Unlock()
	
	report, ok := b.reports[reportID]
	if !ok {
		return nil, false
	}
	
	copy := *report
	return &copy, true
}

// GetWorkerReports retrieves all reports by a specific worker
func (b *BlockchainBridge) GetWorkerReports(workerID string) []*SafetyReport {
	b.mu.Lock()
	defer b.mu.Unlock()
	
	reports := make([]*SafetyReport, 0)
	for _, report := range b.reports {
		if report.WorkerID == workerID {
			copy := *report
			reports = append(reports, &copy)
		}
	}
	
	return reports
}

// GetWorkerTotalRewards calculates total SENT rewards earned by a worker
func (b *BlockchainBridge) GetWorkerTotalRewards(workerID string) float64 {
	b.mu.Lock()
	defer b.mu.Unlock()
	
	total := 0.0
	for _, report := range b.reports {
		if report.WorkerID == workerID {
			total += report.SENTReward
		}
	}
	
	return total
}

// VerifyRecord verifies a telemetry record against the blockchain
func (b *BlockchainBridge) VerifyRecord(recordID string) (bool, error) {
	b.mu.Lock()
	record, ok := b.records[recordID]
	b.mu.Unlock()
	
	if !ok {
		return false, fmt.Errorf("record not found: %s", recordID)
	}
	
	if record.BlockchainTx == "" {
		return false, fmt.Errorf("record not yet submitted to blockchain")
	}
	
	// In production, this would query the Sui blockchain to verify
	// the transaction and object exist with matching data hash
	
	return record.Verified, nil
}

// VerifyReport verifies a safety report against the blockchain
func (b *BlockchainBridge) VerifyReport(reportID string) (bool, error) {
	b.mu.Lock()
	report, ok := b.reports[reportID]
	b.mu.Unlock()
	
	if !ok {
		return false, fmt.Errorf("report not found: %s", reportID)
	}
	
	if report.BlockchainTx == "" {
		return false, fmt.Errorf("report not yet submitted to blockchain")
	}
	
	// In production, verify against Sui blockchain
	return true, nil
}
