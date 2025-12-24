package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"sync"
	"sync/atomic"
	"syscall"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
)

// Config holds relayer configuration
type Config struct {
	PolygonRPCURL      string `json:"polygonRpcUrl"`
	PolygonRPCExternal string `json:"polygonRpcUrlExternal"`
	AlchemyEndpoint    string `json:"alchemyEndpoint"`
	GasPolicyID        string `json:"gasPolicyId"`
	IPFSAPIKey         string `json:"ipfsApiKey"`
	RelayerAddress     string `json:"relayerAddress"`
	SuiRPCURL          string `json:"suiRpcUrl"`
}

// RelayerState holds runtime state
type RelayerState struct {
	PolygonClient   *ethclient.Client
	RelayerAddress  common.Address
	Balance         *big.Float
	LastHeartbeat   time.Time
	EventsProcessed int64
	UsingValidator  bool
	RPCURL          string
	RecentEvents    []BlockchainEvent
	EventsMu        sync.RWMutex
	KPIs            SystemKPIs
	KPIMu           sync.RWMutex
}

// SystemKPIs holds key performance indicators (thread-safe with atomic operations)
type SystemKPIs struct {
	// Sui Listener Metrics (atomic counters)
	SuiEventsDetected    uint64    `json:"sui_events_detected"`
	SuiTicketsPurchased  uint64    `json:"sui_tickets_purchased"`
	SuiLastEventTime     time.Time `json:"sui_last_event_time"`
	
	// Polygon Relayer Metrics (atomic counters)
	PolygonTicketsMinted uint64    `json:"polygon_tickets_minted"`
	PolygonTxSuccess     uint64    `json:"polygon_tx_success"`
	PolygonTxFailed      uint64    `json:"polygon_tx_failed"`
	PolygonLastMintTime  time.Time `json:"polygon_last_mint_time"`
	
	// Bridge Health (atomic counters)
	BridgeLatencyMs      uint64    `json:"bridge_latency_ms"`
	MissedTickets        uint64    `json:"missed_tickets"`
	RecoveredTickets     uint64    `json:"recovered_tickets"`
	
	// Session Metrics
	SessionStartTime     time.Time `json:"session_start_time"`
	UptimeSeconds        uint64    `json:"uptime_seconds"`
	
	// Rate Metrics (calculated, not atomic)
	EventsPerMinute      float64   `json:"events_per_minute"`
	MintsPerMinute       float64   `json:"mints_per_minute"`
}

// SparklineDataPoint represents a single data point for sparkline charts
type SparklineDataPoint struct {
	Timestamp time.Time `json:"timestamp"`
	Value     float64   `json:"value"`
}

// SparklineHistory holds historical data for sparkline charts (circular buffer)
type SparklineHistory struct {
	TicketsPerMinute []SparklineDataPoint `json:"tickets_per_minute"`
	FailedAttempts   []SparklineDataPoint `json:"failed_attempts"`
	mu               sync.RWMutex
	maxPoints        int
}

// BlockchainEvent represents a blockchain event
type BlockchainEvent struct {
	Timestamp time.Time              `json:"timestamp"`
	Source    string                 `json:"source"` // "polygon" or "sui"
	Type      string                 `json:"type"`   // "block", "transaction", "mint", "transfer"
	Message   string                 `json:"message"`
	Data      map[string]interface{} `json:"data"`
}

var (
	config          Config
	state           RelayerState
	sparklineData   SparklineHistory
)

func main() {
	log.Println("🚂 Africa Railways Relayer Bridge")
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	log.Println("Sui → Polygon Event Bridge with Heartbeat")
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	// Initialize sparkline history (60 data points = 1 hour at 1-minute intervals)
	sparklineData = SparklineHistory{
		TicketsPerMinute: make([]SparklineDataPoint, 0, 60),
		FailedAttempts:   make([]SparklineDataPoint, 0, 60),
		maxPoints:        60,
	}

	// Load configuration
	if err := loadConfig(); err != nil {
		log.Fatalf("❌ Failed to load config: %v", err)
	}

	// Initialize Polygon connection
	if err := initializePolygon(); err != nil {
		log.Fatalf("❌ Failed to initialize Polygon: %v", err)
	}

	// Start HTTP server for health checks
	go startHTTPServer()

	// Start heartbeat (keeps main alive and monitors system)
	go heartbeat()

	// Start Sui event listener
	go listenSuiEvents()

	// Start sparkline data collector (updates every minute)
	go collectSparklineData()

	// Keep main alive
	log.Println("✅ Relayer bridge running")
	log.Println("   HTTP: http://localhost:8082")
	log.Println("   Press Ctrl+C to stop")
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	// Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	<-sigChan

	log.Println("")
	log.Println("🛑 Shutting down gracefully...")
	if state.PolygonClient != nil {
		state.PolygonClient.Close()
	}
	log.Println("✅ Shutdown complete")
}

func loadConfig() error {
	// Try to load from config.json
	configPath := filepath.Join("config.json")
	data, err := os.ReadFile(configPath)
	if err != nil {
		log.Printf("⚠️  config.json not found, using environment variables")
		// Load from environment
		config = Config{
			PolygonRPCURL:      os.Getenv("POLYGON_RPC_URL"),
			PolygonRPCExternal: os.Getenv("POLYGON_RPC_URL_EXTERNAL"),
			AlchemyEndpoint:    os.Getenv("ALCHEMY_RPC_URL"),
			GasPolicyID:        os.Getenv("GAS_POLICY_ID"),
			IPFSAPIKey:         os.Getenv("IPFS_API_KEY"),
			RelayerAddress:     os.Getenv("RELAYER_ADDRESS"),
			SuiRPCURL:          os.Getenv("SUI_RPC_URL"),
		}
	} else {
		if err := json.Unmarshal(data, &config); err != nil {
			return fmt.Errorf("invalid config.json: %w", err)
		}
	}

	// Set defaults
	if config.PolygonRPCURL == "" {
		config.PolygonRPCURL = "http://10.128.0.2:8545" // Internal validator
	}
	if config.AlchemyEndpoint == "" {
		config.AlchemyEndpoint = "https://polygon-amoy.g.alchemy.com/v2/4-gxorN-H4MhqZWrskRQ-"
	}
	if config.RelayerAddress == "" {
		config.RelayerAddress = "0x4C97260183BaD57AbF37f0119695f0607f2c3921"
	}
	if config.SuiRPCURL == "" {
		config.SuiRPCURL = "https://fullnode.testnet.sui.io:443"
	}

	log.Printf("✅ Configuration loaded")
	log.Printf("   Polygon RPC: %s", config.PolygonRPCURL)
	log.Printf("   Sui RPC: %s", config.SuiRPCURL)
	log.Printf("   Relayer: %s", config.RelayerAddress)

	return nil
}

func initializePolygon() error {
	log.Printf("🔗 Connecting to Polygon...")

	// Try internal validator first
	var err error
	state.PolygonClient, err = ethclient.Dial(config.PolygonRPCURL)
	if err != nil {
		log.Printf("⚠️  Validator connection failed, trying Alchemy...")
		state.PolygonClient, err = ethclient.Dial(config.AlchemyEndpoint)
		if err != nil {
			return fmt.Errorf("all Polygon connections failed: %w", err)
		}
		log.Println("✅ Connected to Alchemy (fallback)")
		state.UsingValidator = false
		state.RPCURL = config.AlchemyEndpoint
	} else {
		log.Println("✅ Connected to Polygon validator")
		state.UsingValidator = true
		state.RPCURL = config.PolygonRPCURL
	}

	// Verify connection
	block, err := state.PolygonClient.BlockNumber(context.Background())
	if err != nil {
		return fmt.Errorf("failed to get block number: %w", err)
	}
	log.Printf("📦 Latest Block: %d", block)

	// Set relayer address
	state.RelayerAddress = common.HexToAddress(config.RelayerAddress)

	// Check balance
	if err := updateBalance(); err != nil {
		return fmt.Errorf("failed to get balance: %w", err)
	}
	
	// Initialize KPIs
	state.KPIs.SessionStartTime = time.Now()

	return nil
}

func updateBalance() error {
	balance, err := state.PolygonClient.BalanceAt(context.Background(), state.RelayerAddress, nil)
	if err != nil {
		return err
	}

	fbalance := new(big.Float).SetInt(balance)
	state.Balance = new(big.Float).Quo(fbalance, big.NewFloat(1e18))

	balancePOL, _ := state.Balance.Float64()
	log.Printf("💰 Balance: %.4f POL", balancePOL)

	if balancePOL < 0.01 {
		log.Println("🚨 CRITICAL: Balance critically low!")
	} else if balancePOL < 0.05 {
		log.Println("⚠️  WARNING: Balance low")
	}

	return nil
}

func heartbeat() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	log.Println("💓 Heartbeat started (30s interval)")
	
	var lastBlock uint64

	for range ticker.C {
		state.LastHeartbeat = time.Now()

		// Check Polygon connection and get latest block
		block, err := state.PolygonClient.BlockNumber(context.Background())
		if err != nil {
			log.Printf("💔 Heartbeat: Polygon connection lost (%v)", err)
			addBlockchainEvent("polygon", "error", "Connection lost", map[string]interface{}{
				"error": err.Error(),
			})
			continue
		}
		
		// Check for new blocks
		if lastBlock > 0 && block > lastBlock {
			addBlockchainEvent("polygon", "block", fmt.Sprintf("New block: #%d", block), map[string]interface{}{
				"block_number": block,
				"blocks_since_last": block - lastBlock,
			})
		}
		lastBlock = block

		// Update balance
		if err := updateBalance(); err != nil {
			log.Printf("⚠️  Heartbeat: Failed to update balance (%v)", err)
		}

		// Update uptime
		uptime := time.Since(state.KPIs.SessionStartTime).Seconds()
		atomic.StoreUint64(&state.KPIs.UptimeSeconds, uint64(uptime))
		
		// Log status with KPIs
		balancePOL, _ := state.Balance.Float64()
		suiEvents := atomic.LoadUint64(&state.KPIs.SuiEventsDetected)
		polygonMints := atomic.LoadUint64(&state.KPIs.PolygonTicketsMinted)
		
		log.Printf("💓 Heartbeat: OK | Balance: %.4f POL | Sui Events: %d | Polygon Mints: %d | Validator: %t",
			balancePOL, suiEvents, polygonMints, state.UsingValidator)
	}
}

func listenSuiEvents() {
	log.Println("👂 Sui event listener started")
	log.Printf("   Listening on: %s", config.SuiRPCURL)

	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		// In production, this would:
		// 1. Subscribe to Sui events (ticket purchases)
		// 2. Parse event data (user wallet, ticket details)
		// 3. Mint NFT on Polygon using gasless transaction
		// 4. Upload metadata to IPFS
		// 5. Update dashboard via Sui event

		// Simulate event detection (replace with real Sui WebSocket subscription)
		// events := checkSuiEvents()
		// for _, event := range events {
		//     processSuiEvent(event)
		// }

		// For now, just log that we're listening (no spam to dashboard)
		if atomic.LoadUint64(&state.KPIs.SuiEventsDetected) == 0 {
			log.Println("👂 Polling Sui for events...")
		}
	}
}

// processSuiEvent handles a detected Sui ticket purchase event
func processSuiEvent(eventData map[string]interface{}) error {
	startTime := time.Now()
	
	// Increment Sui event counter (thread-safe)
	atomic.AddUint64(&state.KPIs.SuiEventsDetected, 1)
	atomic.AddUint64(&state.KPIs.SuiTicketsPurchased, 1)
	
	// Update last event time
	state.KPIMu.Lock()
	state.KPIs.SuiLastEventTime = time.Now()
	state.KPIMu.Unlock()
	
	// Log to console (for debugging, not sent to dashboard feed)
	log.Printf("🎫 Sui ticket purchase detected: %v", eventData)
	
	// Extract ticket data
	userWallet := eventData["user"].(string)
	route := eventData["route"].(string)
	class := eventData["class"].(string)
	
	// Mint NFT on Polygon
	err := mintTicketOnPolygon(userWallet, route, class)
	if err != nil {
		// Increment failed counter
		atomic.AddUint64(&state.KPIs.PolygonTxFailed, 1)
		atomic.AddUint64(&state.KPIs.MissedTickets, 1)
		
		log.Printf("❌ Failed to mint ticket on Polygon: %v", err)
		return err
	}
	
	// Increment success counters
	atomic.AddUint64(&state.KPIs.PolygonTicketsMinted, 1)
	atomic.AddUint64(&state.KPIs.PolygonTxSuccess, 1)
	
	// Update last mint time
	state.KPIMu.Lock()
	state.KPIs.PolygonLastMintTime = time.Now()
	state.KPIMu.Unlock()
	
	// Calculate bridge latency
	latency := time.Since(startTime).Milliseconds()
	atomic.StoreUint64(&state.KPIs.BridgeLatencyMs, uint64(latency))
	
	// Increment processed events
	state.EventsProcessed++
	
	log.Printf("✅ Ticket minted successfully (latency: %dms)", latency)
	
	return nil
}

// mintTicketOnPolygon mints an NFT ticket on Polygon (gasless)
func mintTicketOnPolygon(userWallet, route, class string) error {
	// TODO: Implement actual minting logic
	// 1. Generate metadata
	// 2. Upload to IPFS
	// 3. Create UserOperation
	// 4. Request gas sponsorship from Alchemy
	// 5. Sign and submit transaction
	
	// Simulate minting delay
	time.Sleep(100 * time.Millisecond)
	
	return nil
}

func processEvent(eventData map[string]interface{}) error {
	// TODO: Implement event processing
	// 1. Extract ticket data from Sui event
	// 2. Generate metadata
	// 3. Upload to IPFS
	// 4. Mint NFT on Polygon (gasless)
	// 5. Update state

	state.EventsProcessed++
	log.Printf("✅ Event processed: %d total", state.EventsProcessed)

	return nil
}

func startHTTPServer() {
	http.HandleFunc("/health", handleHealth)
	http.HandleFunc("/status", handleStatus)
	http.HandleFunc("/balance", handleBalance)
	http.HandleFunc("/events", handleEvents)
	http.HandleFunc("/feed", handleBlockchainFeed)
	http.HandleFunc("/kpis", handleKPIs)
	http.HandleFunc("/resync", handleResync)
	http.HandleFunc("/sparkline", handleSparkline)

	port := os.Getenv("RELAYER_PORT")
	if port == "" {
		port = "8082"
	}

	log.Printf("🌐 HTTP server starting on port %s", port)

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("❌ HTTP server failed: %v", err)
	}
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	// Check if heartbeat is recent (within last minute)
	timeSinceHeartbeat := time.Since(state.LastHeartbeat)
	healthy := timeSinceHeartbeat < 2*time.Minute

	// Check Polygon connection
	_, err := state.PolygonClient.BlockNumber(context.Background())
	polygonOK := err == nil

	status := "operational"
	if !healthy || !polygonOK {
		status = "degraded"
		w.WriteHeader(http.StatusServiceUnavailable)
	}

	balancePOL, _ := state.Balance.Float64()

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{
		"status": "%s",
		"polygon_connected": %t,
		"using_validator": %t,
		"balance_pol": %.4f,
		"events_processed": %d,
		"last_heartbeat": "%s",
		"uptime_seconds": %.0f
	}`, status, polygonOK, state.UsingValidator, balancePOL,
		state.EventsProcessed, state.LastHeartbeat.Format(time.RFC3339),
		time.Since(state.LastHeartbeat).Seconds())
}

func handleStatus(w http.ResponseWriter, r *http.Request) {
	block, _ := state.PolygonClient.BlockNumber(context.Background())
	gasPrice, _ := state.PolygonClient.SuggestGasPrice(context.Background())

	gasPriceGwei := new(big.Float).Quo(
		new(big.Float).SetInt(gasPrice),
		big.NewFloat(1e9),
	)
	gasPriceVal, _ := gasPriceGwei.Float64()

	balancePOL, _ := state.Balance.Float64()
	estimatedTx := 0
	if balancePOL > 0 {
		estimatedTx = int(balancePOL / 0.0002)
	}

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{
		"rpc_url": "%s",
		"using_validator": %t,
		"latest_block": %d,
		"relayer_address": "%s",
		"balance_pol": %.4f,
		"gas_price_gwei": %.2f,
		"estimated_tx": %d,
		"events_processed": %d,
		"sui_rpc": "%s"
	}`, state.RPCURL, state.UsingValidator, block, state.RelayerAddress.Hex(),
		balancePOL, gasPriceVal, estimatedTx, state.EventsProcessed, config.SuiRPCURL)
}

func handleBalance(w http.ResponseWriter, r *http.Request) {
	if err := updateBalance(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	balancePOL, _ := state.Balance.Float64()
	balanceUSD := balancePOL * 0.50 // Approximate POL price

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{
		"balance_pol": %.4f,
		"balance_usd": %.2f,
		"address": "%s"
	}`, balancePOL, balanceUSD, state.RelayerAddress.Hex())
}

func handleEvents(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{
		"events_processed": %d,
		"last_heartbeat": "%s",
		"status": "listening"
	}`, state.EventsProcessed, state.LastHeartbeat.Format(time.RFC3339))
}

func handleBlockchainFeed(w http.ResponseWriter, r *http.Request) {
	state.EventsMu.RLock()
	defer state.EventsMu.RUnlock()
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(state.RecentEvents)
}

func addBlockchainEvent(source, eventType, message string, data map[string]interface{}) {
	event := BlockchainEvent{
		Timestamp: time.Now(),
		Source:    source,
		Type:      eventType,
		Message:   message,
		Data:      data,
	}
	
	state.EventsMu.Lock()
	defer state.EventsMu.Unlock()
	
	// Add to recent events
	state.RecentEvents = append(state.RecentEvents, event)
	
	// Keep only last 50 events
	if len(state.RecentEvents) > 50 {
		state.RecentEvents = state.RecentEvents[1:]
	}
	
	// Log event (console only, not spamming dashboard)
	log.Printf("📡 [%s] %s: %s", source, eventType, message)
}

func handleKPIs(w http.ResponseWriter, r *http.Request) {
	// Calculate uptime
	uptime := time.Since(state.KPIs.SessionStartTime).Seconds()
	atomic.StoreUint64(&state.KPIs.UptimeSeconds, uint64(uptime))
	
	// Calculate rates (events per minute)
	if uptime > 0 {
		eventsPerMinute := (float64(atomic.LoadUint64(&state.KPIs.SuiEventsDetected)) / uptime) * 60
		mintsPerMinute := (float64(atomic.LoadUint64(&state.KPIs.PolygonTicketsMinted)) / uptime) * 60
		
		state.KPIMu.Lock()
		state.KPIs.EventsPerMinute = eventsPerMinute
		state.KPIs.MintsPerMinute = mintsPerMinute
		state.KPIMu.Unlock()
	}
	
	// Read KPIs (thread-safe)
	kpis := map[string]interface{}{
		"sui_events_detected":     atomic.LoadUint64(&state.KPIs.SuiEventsDetected),
		"sui_tickets_purchased":   atomic.LoadUint64(&state.KPIs.SuiTicketsPurchased),
		"sui_last_event_time":     state.KPIs.SuiLastEventTime,
		"polygon_tickets_minted":  atomic.LoadUint64(&state.KPIs.PolygonTicketsMinted),
		"polygon_tx_success":      atomic.LoadUint64(&state.KPIs.PolygonTxSuccess),
		"polygon_tx_failed":       atomic.LoadUint64(&state.KPIs.PolygonTxFailed),
		"polygon_last_mint_time":  state.KPIs.PolygonLastMintTime,
		"bridge_latency_ms":       atomic.LoadUint64(&state.KPIs.BridgeLatencyMs),
		"missed_tickets":          atomic.LoadUint64(&state.KPIs.MissedTickets),
		"recovered_tickets":       atomic.LoadUint64(&state.KPIs.RecoveredTickets),
		"session_start_time":      state.KPIs.SessionStartTime,
		"uptime_seconds":          atomic.LoadUint64(&state.KPIs.UptimeSeconds),
		"events_per_minute":       state.KPIs.EventsPerMinute,
		"mints_per_minute":        state.KPIs.MintsPerMinute,
		"success_rate":            calculateSuccessRate(),
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(kpis)
}

func calculateSuccessRate() float64 {
	success := atomic.LoadUint64(&state.KPIs.PolygonTxSuccess)
	failed := atomic.LoadUint64(&state.KPIs.PolygonTxFailed)
	total := success + failed
	
	if total == 0 {
		return 100.0
	}
	
	return (float64(success) / float64(total)) * 100
}

func handleResync(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	var req struct {
		Blocks int    `json:"blocks"`
		Source string `json:"source"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	
	if req.Blocks == 0 {
		req.Blocks = 100 // Default
	}
	
	if req.Source == "" {
		req.Source = "sui" // Default
	}
	
	log.Printf("🔄 Force resync requested: %d blocks from %s", req.Blocks, req.Source)
	
	// Perform resync
	result := performResync(req.Source, req.Blocks)
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func performResync(source string, blocks int) map[string]interface{} {
	startTime := time.Now()
	
	// TODO: Implement actual resync logic
	// 1. Get current block number
	// 2. Scan last N blocks
	// 3. Find missed events
	// 4. Process each missed event
	// 5. Update KPIs
	
	// Simulate resync
	eventsFound := 0
	ticketsProcessed := 0
	missedTickets := 0
	
	// For now, return mock data
	log.Printf("✅ Resync complete: scanned %d blocks in %v", blocks, time.Since(startTime))
	
	// Update recovered tickets counter
	if missedTickets > 0 {
		atomic.AddUint64(&state.KPIs.RecoveredTickets, uint64(missedTickets))
	}
	
	return map[string]interface{}{
		"success":           true,
		"source":            source,
		"blocks_scanned":    blocks,
		"start_block":       12345678 - blocks,
		"end_block":         12345678,
		"events_found":      eventsFound,
		"tickets_processed": ticketsProcessed,
		"missed_tickets":    missedTickets,
		"duration_ms":       time.Since(startTime).Milliseconds(),
	}
}

// collectSparklineData runs every minute to collect historical data for sparkline charts
func collectSparklineData() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()
	
	for range ticker.C {
		now := time.Now()
		
		// Calculate tickets per minute (mints per minute from KPIs)
		state.KPIMu.RLock()
		tpm := state.KPIs.MintsPerMinute
		failedAttempts := float64(atomic.LoadUint64(&state.KPIs.PolygonTxFailed))
		state.KPIMu.RUnlock()
		
		// Add data points to sparkline history
		sparklineData.mu.Lock()
		
		// Add TPM data point
		sparklineData.TicketsPerMinute = append(sparklineData.TicketsPerMinute, SparklineDataPoint{
			Timestamp: now,
			Value:     tpm,
		})
		
		// Add failed attempts data point
		sparklineData.FailedAttempts = append(sparklineData.FailedAttempts, SparklineDataPoint{
			Timestamp: now,
			Value:     failedAttempts,
		})
		
		// Keep only last 60 data points (1 hour)
		if len(sparklineData.TicketsPerMinute) > sparklineData.maxPoints {
			sparklineData.TicketsPerMinute = sparklineData.TicketsPerMinute[1:]
		}
		if len(sparklineData.FailedAttempts) > sparklineData.maxPoints {
			sparklineData.FailedAttempts = sparklineData.FailedAttempts[1:]
		}
		
		sparklineData.mu.Unlock()
	}
}

// handleSparkline returns sparkline data for charts
func handleSparkline(w http.ResponseWriter, r *http.Request) {
	sparklineData.mu.RLock()
	defer sparklineData.mu.RUnlock()
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"tickets_per_minute": sparklineData.TicketsPerMinute,
		"failed_attempts":    sparklineData.FailedAttempts,
		"data_points":        len(sparklineData.TicketsPerMinute),
		"max_points":         sparklineData.maxPoints,
	})
}
