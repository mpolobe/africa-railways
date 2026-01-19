package telemetry

import (
	"testing"
	"time"
)

func TestNewIngestEngine(t *testing.T) {
	engine := NewIngestEngine()
	
	if engine == nil {
		t.Fatal("NewIngestEngine returned nil")
	}
	
	// Check routes are initialized
	if len(engine.routes) == 0 {
		t.Error("Routes not initialized")
	}
	
	// Check TAZARA route exists
	if _, ok := engine.routes["TAZARA-MAIN"]; !ok {
		t.Error("TAZARA-MAIN route not found")
	}
	
	// Check stations are initialized
	if len(engine.stations) == 0 {
		t.Error("Stations not initialized")
	}
	
	// Check Dar es Salaam station exists
	if _, ok := engine.stations["DAR"]; !ok {
		t.Error("DAR station not found")
	}
}

func TestIngestLocomotiveTelemetry(t *testing.T) {
	engine := NewIngestEngine()
	
	msg := &TelemetryMessage{
		DeviceID:   "LOC-001",
		DeviceType: "locomotive",
		TrainID:    "MUKUBA-EXPRESS-1",
		Latitude:   -8.9000,
		Longitude:  33.4500,
		Speed:      60.0,
		Heading:    180.0,
		Status:     "moving",
		RouteID:    "TAZARA-MAIN",
		Timestamp:  time.Now(),
	}
	
	err := engine.Ingest(msg)
	if err != nil {
		t.Fatalf("Ingest failed: %v", err)
	}
	
	// Verify position was stored
	pos, ok := engine.GetPosition("MUKUBA-EXPRESS-1")
	if !ok {
		t.Fatal("Position not found after ingest")
	}
	
	if pos.Latitude != msg.Latitude {
		t.Errorf("Latitude mismatch: got %f, want %f", pos.Latitude, msg.Latitude)
	}
	
	if pos.Speed != msg.Speed {
		t.Errorf("Speed mismatch: got %f, want %f", pos.Speed, msg.Speed)
	}
	
	if pos.RouteName != "TAZARA Main Line" {
		t.Errorf("Route name mismatch: got %s, want TAZARA Main Line", pos.RouteName)
	}
}

func TestIngestRequiresTrainID(t *testing.T) {
	engine := NewIngestEngine()
	
	msg := &TelemetryMessage{
		DeviceID:   "LOC-001",
		DeviceType: "locomotive",
		// TrainID is missing
		Latitude:  -8.9000,
		Longitude: 33.4500,
		Timestamp: time.Now(),
	}
	
	err := engine.Ingest(msg)
	if err == nil {
		t.Error("Expected error for missing TrainID")
	}
}

func TestGetAllPositions(t *testing.T) {
	engine := NewIngestEngine()
	
	// Ingest multiple trains
	trains := []string{"TRAIN-1", "TRAIN-2", "TRAIN-3"}
	for _, trainID := range trains {
		msg := &TelemetryMessage{
			DeviceID:   "LOC-" + trainID,
			DeviceType: "locomotive",
			TrainID:    trainID,
			Latitude:   -8.9000,
			Longitude:  33.4500,
			Speed:      50.0,
			RouteID:    "TAZARA-MAIN",
			Timestamp:  time.Now(),
		}
		engine.Ingest(msg)
	}
	
	positions := engine.GetAllPositions()
	if len(positions) != 3 {
		t.Errorf("Expected 3 positions, got %d", len(positions))
	}
}

func TestHaversineDistance(t *testing.T) {
	// Test distance between Dar es Salaam and Kapiri Mposhi
	// Approximate distance: ~1860 km
	darLat, darLon := -6.8235, 39.2695
	kpmLat, kpmLon := -14.4500, 28.6667
	
	distance := haversineDistance(darLat, darLon, kpmLat, kpmLon)
	
	// Allow 10% tolerance
	expectedMin := 1860.0 * 0.9
	expectedMax := 1860.0 * 1.1
	
	if distance < expectedMin || distance > expectedMax {
		t.Errorf("Distance calculation off: got %.2f km, expected ~1860 km", distance)
	}
}

func TestSubscribeUnsubscribe(t *testing.T) {
	engine := NewIngestEngine()
	
	// Subscribe
	ch := engine.Subscribe()
	if ch == nil {
		t.Fatal("Subscribe returned nil channel")
	}
	
	// Ingest a message
	msg := &TelemetryMessage{
		DeviceID:   "LOC-001",
		DeviceType: "locomotive",
		TrainID:    "TEST-TRAIN",
		Latitude:   -8.9000,
		Longitude:  33.4500,
		Speed:      60.0,
		RouteID:    "TAZARA-MAIN",
		Timestamp:  time.Now(),
	}
	engine.Ingest(msg)
	
	// Check we received the update
	select {
	case pos := <-ch:
		if pos.TrainID != "TEST-TRAIN" {
			t.Errorf("Wrong train ID: got %s, want TEST-TRAIN", pos.TrainID)
		}
	case <-time.After(time.Second):
		t.Error("Timeout waiting for position update")
	}
	
	// Unsubscribe
	engine.Unsubscribe(ch)
	
	// Channel should be closed
	_, ok := <-ch
	if ok {
		t.Error("Channel should be closed after unsubscribe")
	}
}

func TestWorkerTracker(t *testing.T) {
	engine := NewIngestEngine()
	tracker := NewWorkerTracker(engine)
	
	// Ingest worker location
	msg := &WorkerTelemetryMessage{
		WorkerID:       "WORKER-001",
		DeviceID:       "PHONE-001",
		Latitude:       -8.9100,
		Longitude:      33.4600,
		Accuracy:       10.0,
		RouteID:        "TAZARA-MAIN",
		Activity:       "inspection",
		Status:         "on_duty",
		BatteryLevel:   85,
		SignalStrength: 3,
		Timestamp:      time.Now(),
	}
	
	err := tracker.IngestWorkerLocation(msg)
	if err != nil {
		t.Fatalf("IngestWorkerLocation failed: %v", err)
	}
	
	// Verify location was stored
	loc, ok := tracker.GetWorkerLocation("WORKER-001")
	if !ok {
		t.Fatal("Worker location not found")
	}
	
	if loc.Activity != "inspection" {
		t.Errorf("Activity mismatch: got %s, want inspection", loc.Activity)
	}
	
	if loc.BatteryLevel != 85 {
		t.Errorf("Battery level mismatch: got %d, want 85", loc.BatteryLevel)
	}
}

func TestBlockchainBridge(t *testing.T) {
	bridge := NewBlockchainBridge("https://fullnode.testnet.sui.io", "0x123")
	
	// Record a safety report
	report := &SafetyReport{
		WorkerID:    "WORKER-001",
		WorkerName:  "John Doe",
		ReportType:  "inspection",
		Severity:    "low",
		Location:    GeoLocation{Latitude: -8.9, Longitude: 33.4, Accuracy: 10},
		RouteID:     "TAZARA-MAIN",
		SectionKM:   500.0,
		Description: "Track inspection completed, no issues found",
		Timestamp:   time.Now(),
	}
	
	err := bridge.RecordSafetyReport(report)
	if err != nil {
		t.Fatalf("RecordSafetyReport failed: %v", err)
	}
	
	// Check reward was calculated
	if report.SENTReward != 10.0 {
		t.Errorf("SENT reward mismatch: got %.2f, want 10.0", report.SENTReward)
	}
	
	// Wait for blockchain submission
	time.Sleep(200 * time.Millisecond)
	
	// Verify report was stored
	stored, ok := bridge.GetReport(report.ReportID)
	if !ok {
		t.Fatal("Report not found after recording")
	}
	
	if stored.BlockchainTx == "" {
		t.Error("Blockchain transaction not set")
	}
}

func TestCriticalReportBonus(t *testing.T) {
	bridge := NewBlockchainBridge("https://fullnode.testnet.sui.io", "0x123")
	
	// Record a critical hazard report
	report := &SafetyReport{
		WorkerID:    "WORKER-001",
		WorkerName:  "John Doe",
		ReportType:  "hazard",
		Severity:    "critical",
		Location:    GeoLocation{Latitude: -8.9, Longitude: 33.4, Accuracy: 10},
		RouteID:     "TAZARA-MAIN",
		SectionKM:   500.0,
		Description: "Rail break detected, immediate attention required",
		Timestamp:   time.Now(),
	}
	
	bridge.RecordSafetyReport(report)
	
	// Critical hazard should get 2x bonus: 25 * 2 = 50 SENT
	expectedReward := 50.0
	if report.SENTReward != expectedReward {
		t.Errorf("Critical bonus not applied: got %.2f, want %.2f", report.SENTReward, expectedReward)
	}
}

func TestWorkerTotalRewards(t *testing.T) {
	bridge := NewBlockchainBridge("https://fullnode.testnet.sui.io", "0x123")
	
	// Record multiple reports for same worker
	reports := []struct {
		reportType string
		severity   string
	}{
		{"inspection", "low"},    // 10 SENT
		{"hazard", "medium"},     // 25 SENT
		{"incident", "high"},     // 50 * 1.5 = 75 SENT
	}
	
	for _, r := range reports {
		report := &SafetyReport{
			WorkerID:    "WORKER-REWARDS",
			ReportType:  r.reportType,
			Severity:    r.severity,
			Location:    GeoLocation{Latitude: -8.9, Longitude: 33.4},
			RouteID:     "TAZARA-MAIN",
			Description: "Test report",
			Timestamp:   time.Now(),
		}
		bridge.RecordSafetyReport(report)
	}
	
	// Total should be 10 + 25 + 75 = 110 SENT
	total := bridge.GetWorkerTotalRewards("WORKER-REWARDS")
	expectedTotal := 110.0
	if total != expectedTotal {
		t.Errorf("Total rewards mismatch: got %.2f, want %.2f", total, expectedTotal)
	}
}
