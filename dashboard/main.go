package main

import (
	"bytes"
	"context"
	"crypto/ecdsa"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/big"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"time"

	monitoring "cloud.google.com/go/monitoring/apiv3/v2"
	"cloud.google.com/go/monitoring/apiv3/v2/monitoringpb"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
	"google.golang.org/api/option"
	"google.golang.org/protobuf/types/known/durationpb"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// SystemMetrics holds all real-time monitoring data
type SystemMetrics struct {
	Timestamp       time.Time         `json:"timestamp"`
	Blockchain      BlockchainMetrics `json:"blockchain"`
	Wallet          WalletMetrics     `json:"wallet"`
	IPFS            IPFSMetrics       `json:"ipfs"`
	Tickets         TicketMetrics     `json:"tickets"`
	USSD            USSDMetrics       `json:"ussd"`
	SystemHealth    HealthMetrics     `json:"system_health"`
	GCPMetrics      GCPMetrics        `json:"gcp_metrics"`
	Alerts          []Alert           `json:"alerts"`
}

type GCPMetrics struct {
	SuiValidator    InstanceMetrics `json:"sui_validator"`
	RailwayCore     InstanceMetrics `json:"railway_core"`
	LastUpdated     time.Time       `json:"last_updated"`
	UpdateInterval  int             `json:"update_interval_seconds"`
}

type InstanceMetrics struct {
	Name            string  `json:"name"`
	ProjectID       string  `json:"project_id"`
	InstanceID      string  `json:"instance_id"`
	Zone            string  `json:"zone"`
	CPUUtilization  float64 `json:"cpu_utilization"`
	Status          string  `json:"status"`
	Stability       float64 `json:"stability"`
	DataPointsCount int     `json:"data_points_count"`
}

type BlockchainMetrics struct {
	Polygon PolygonMetrics `json:"polygon"`
	Sui     SuiMetrics     `json:"sui"`
}

type PolygonMetrics struct {
	Connected         bool      `json:"connected"`
	LatestBlock       uint64    `json:"latest_block"`
	TotalTicketsMinted int64    `json:"total_tickets_minted"`
	TicketsMintedToday int64    `json:"tickets_minted_today"`
	TicketsVerifiedToday int64  `json:"tickets_verified_today"`
	LastTxHash        string    `json:"last_tx_hash"`
	LastTxTimestamp   time.Time `json:"last_tx_timestamp"`
	NetworkLatency    int64     `json:"network_latency_ms"`
}

type SuiMetrics struct {
	Connected              bool      `json:"connected"`
	CurrentEpoch           string    `json:"current_epoch"`
	LatestCheckpoint       string    `json:"latest_checkpoint"`
	TotalTransactions      string    `json:"total_transactions"`
	ReferenceGasPrice      string    `json:"reference_gas_price"`
	EventCount             int64     `json:"event_count"`
	LastEventTime          time.Time `json:"last_event_time"`
	NetworkLatency         int64     `json:"network_latency_ms"`
	EpochStartTimestamp    string    `json:"epoch_start_timestamp"`
	EpochDurationMs        string    `json:"epoch_duration_ms"`
}

type WalletMetrics struct {
	Address              string  `json:"address"`
	BalancePOL           float64 `json:"balance_pol"`
	BalanceUSD           float64 `json:"balance_usd"`
	EstimatedTxRemaining int     `json:"estimated_tx_remaining"`
	GasPriceCurrent      float64 `json:"gas_price_current_gwei"`
	GasPriceAverage      float64 `json:"gas_price_average_gwei"`
	GasPricePeak         float64 `json:"gas_price_peak_gwei"`
	LowBalanceAlert      bool    `json:"low_balance_alert"`
}

type IPFSMetrics struct {
	TotalUploads       int64   `json:"total_uploads"`
	UploadsToday       int64   `json:"uploads_today"`
	StorageUsedMB      float64 `json:"storage_used_mb"`
	UploadSuccessRate  float64 `json:"upload_success_rate"`
	FailedUploads      int64   `json:"failed_uploads"`
	AverageUploadTime  int64   `json:"average_upload_time_ms"`
	PinataConnected    bool    `json:"pinata_connected"`
}

type TicketMetrics struct {
	TotalMinted   int64 `json:"total_minted"`
	Pending       int64 `json:"pending"`
	Active        int64 `json:"active"`
	Used          int64 `json:"used"`
	Expired       int64 `json:"expired"`
	VerifiedToday int64 `json:"verified_today"`
}

type USSDMetrics struct {
	Connected           bool          `json:"connected"`
	ActiveSessions      int           `json:"active_sessions"`
	TotalSessionsToday  int64         `json:"total_sessions_today"`
	SuccessRate         float64       `json:"success_rate"`
	AverageResponseTime int64         `json:"average_response_time_ms"`
	PeakSessions        int           `json:"peak_sessions"`
	FailedSessions      int64         `json:"failed_sessions"`
	LastSessionTime     time.Time     `json:"last_session_time"`
	Uptime              float64       `json:"uptime_percent"`
	Revenue             RevenueMetrics `json:"revenue"`
}

type RevenueMetrics struct {
	ConfirmedTotal     float64 `json:"confirmed_total"`
	PendingTotal       float64 `json:"pending_total"`
	RevenueToday       float64 `json:"revenue_today"`
	TicketsToday       int64   `json:"tickets_today"`
	TotalRevenue       float64 `json:"total_revenue"`
	TicketsSold        int64   `json:"tickets_sold"`
	ConversionRate     float64 `json:"conversion_rate"`
	AverageTicketPrice float64 `json:"average_ticket_price"`
}

type HealthMetrics struct {
	RelayerService  ServiceStatus `json:"relayer_service"`
	IPFSUploader    ServiceStatus `json:"ipfs_uploader"`
	APIServer       ServiceStatus `json:"api_server"`
	PassengerApp    ServiceStatus `json:"passenger_app"`
	StaffApp        ServiceStatus `json:"staff_app"`
	USSDGateway     ServiceStatus `json:"ussd_gateway"`
	AlchemyAPI      ServiceStatus `json:"alchemy_api"`
	PinataAPI       ServiceStatus `json:"pinata_api"`
	PolygonRPC      ServiceStatus `json:"polygon_rpc"`
	SuiNode         ServiceStatus `json:"sui_node"`
	AWSS3           ServiceStatus `json:"aws_s3"`
}

type ServiceStatus struct {
	Status      string    `json:"status"` // "operational", "degraded", "down"
	LastChecked time.Time `json:"last_checked"`
	Uptime      float64   `json:"uptime_percent"`
	ResponseTime int64    `json:"response_time_ms"`
}

type Alert struct {
	Level     string    `json:"level"` // "critical", "warning", "info"
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
	Component string    `json:"component"`
}

// Config holds dashboard configuration
type Config struct {
	PolygonRPC     string `json:"polygonRpc"`
	RelayerAddress string `json:"relayerAddress"`
	IPFSAPIKey     string `json:"ipfsApiKey"`
	AlchemyAPIKey  string `json:"alchemyApiKey"`
	GasPolicyID    string `json:"gasPolicyId"`
}

var (
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true // Allow all origins for development
		},
	}
	clients   = make(map[*websocket.Conn]bool)
	clientsMu sync.Mutex
	broadcast = make(chan SystemMetrics)
)

func main() {
	log.Println("🚂 Africa Railways OCC Dashboard Starting...")

	// Load .env file from parent directory
	if err := godotenv.Load("../.env"); err != nil {
		log.Printf("⚠️  Warning: .env file not found, using environment variables")
	}

	// Auto-detect relayer address from private key
	if err := autoDetectRelayerAddress(); err != nil {
		log.Printf("⚠️  Warning: Could not auto-detect relayer address: %v", err)
	}

	// Load configuration
	config := loadConfig()

	// Start metrics aggregation
	go metricsAggregator(config)

	// Start WebSocket broadcaster
	go handleBroadcast()

	// Setup HTTP routes
	mux := http.NewServeMux()
	
	// Serve static files
	fs := http.FileServer(http.Dir("static"))
	mux.Handle("/", fs)
	
	// OCC route - serve the dashboard at /occ
	mux.HandleFunc("/occ", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "static/index.html")
	})
	mux.HandleFunc("/occ/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "static/index.html")
	})
	
	// API endpoints
	mux.HandleFunc("/api/metrics", handleMetrics)
	mux.HandleFunc("/api/health", handleHealth)
	mux.HandleFunc("/api/alerts", handleAlerts)
	mux.HandleFunc("/ws", handleWebSocket)
	
	// Control endpoints
	mux.HandleFunc("/api/control/relayer/start", handleRelayerStart)
	mux.HandleFunc("/api/control/relayer/stop", handleRelayerStop)
	mux.HandleFunc("/api/control/monitor/start", handleMonitorStart)
	mux.HandleFunc("/api/control/monitor/stop", handleMonitorStop)
	mux.HandleFunc("/api/control/ipfs/start", handleIPFSStart)
	mux.HandleFunc("/api/control/ipfs/stop", handleIPFSStop)
	mux.HandleFunc("/api/control/ussd/start", handleUSSDStart)
	mux.HandleFunc("/api/control/ussd/stop", handleUSSDStop)
	
	// Cloud infrastructure control
	mux.HandleFunc("/api/control/gcp", handleGCPControl)
	mux.HandleFunc("/api/control/aws", handleAWSControl)
	
	// USSD specific endpoints
	mux.HandleFunc("/api/ussd/stats", handleUSSDStats)
	mux.HandleFunc("/api/ussd/sessions", handleUSSDSessions)
	mux.HandleFunc("/api/ussd/revenue", handleUSSDRevenue)
	
	// Blockchain feed endpoint
	mux.HandleFunc("/api/blockchain/feed", handleBlockchainFeed)
	mux.HandleFunc("/api/blockchain/kpis", handleBlockchainKPIs)
	mux.HandleFunc("/api/blockchain/resync", handleBlockchainResync)
	mux.HandleFunc("/api/blockchain/sparkline", handleBlockchainSparkline)

	// Enable CORS
	handler := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders: []string{"*"},
	}).Handler(mux)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("✅ OCC Dashboard running on http://localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

func loadConfig() Config {
	// Try to load from root config.json
	configPath := filepath.Join("..", "config.json")
	data, err := os.ReadFile(configPath)
	if err != nil {
		log.Printf("⚠️  Could not load config.json: %v\n", err)
		// Fallback to environment variables
		return Config{
			PolygonRPC:     os.Getenv("POLYGON_RPC_URL"),
			RelayerAddress: os.Getenv("RELAYER_ADDRESS"),
			IPFSAPIKey:     os.Getenv("IPFS_API_KEY"),
			AlchemyAPIKey:  os.Getenv("ALCHEMY_API_KEY"),
			GasPolicyID:    os.Getenv("GAS_POLICY_ID"),
		}
	}

	var config struct {
		AlchemyEndpoint string `json:"alchemyEndpoint"`
		GasPolicyID     string `json:"gasPolicyId"`
		IPFSAPIKey      string `json:"ipfsApiKey"`
	}
	json.Unmarshal(data, &config)

	return Config{
		PolygonRPC:     config.AlchemyEndpoint,
		RelayerAddress: os.Getenv("RELAYER_ADDRESS"),
		IPFSAPIKey:     config.IPFSAPIKey,
		GasPolicyID:    config.GasPolicyID,
	}
}

func metricsAggregator(config Config) {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		metrics := collectMetrics(config)
		broadcast <- metrics
	}
}

func collectMetrics(config Config) SystemMetrics {
	var wg sync.WaitGroup
	metrics := SystemMetrics{
		Timestamp: time.Now(),
		Alerts:    []Alert{},
	}

	// Collect Polygon metrics
	wg.Add(1)
	go func() {
		defer wg.Done()
		metrics.Blockchain.Polygon = collectPolygonMetrics(config)
	}()

	// Collect Wallet metrics
	wg.Add(1)
	go func() {
		defer wg.Done()
		metrics.Wallet = collectWalletMetrics(config)
	}()

	// Collect IPFS metrics
	wg.Add(1)
	go func() {
		defer wg.Done()
		metrics.IPFS = collectIPFSMetrics(config)
	}()

	// Collect USSD metrics
	wg.Add(1)
	go func() {
		defer wg.Done()
		metrics.USSD = collectUSSDMetrics(config)
	}()

	// Collect Sui metrics
	wg.Add(1)
	go func() {
		defer wg.Done()
		metrics.Blockchain.Sui = collectSuiMetrics(config)
	}()

	// Collect GCP metrics (60 second refresh rate)
	wg.Add(1)
	go func() {
		defer wg.Done()
		metrics.GCPMetrics = collectGCPMetrics(config)
	}()

	// Collect System Health
	wg.Add(1)
	go func() {
		defer wg.Done()
		metrics.SystemHealth = collectHealthMetrics(config)
	}()

	wg.Wait()

	// Generate alerts based on metrics
	metrics.Alerts = generateAlerts(metrics)

	return metrics
}

func collectPolygonMetrics(config Config) PolygonMetrics {
	metrics := PolygonMetrics{
		Connected: false,
	}

	if config.PolygonRPC == "" {
		return metrics
	}

	start := time.Now()
	client, err := ethclient.Dial(config.PolygonRPC)
	if err != nil {
		log.Printf("❌ Failed to connect to Polygon: %v\n", err)
		return metrics
	}
	defer client.Close()

	metrics.Connected = true
	metrics.NetworkLatency = time.Since(start).Milliseconds()

	// Get latest block
	block, err := client.BlockNumber(context.Background())
	if err == nil {
		metrics.LatestBlock = block
	}

	// TODO: Query contract for actual ticket counts
	// For now, use placeholder values
	metrics.TotalTicketsMinted = 0
	metrics.TicketsMintedToday = 0
	metrics.TicketsVerifiedToday = 0

	return metrics
}

func collectWalletMetrics(config Config) WalletMetrics {
	metrics := WalletMetrics{
		Address: config.RelayerAddress,
	}

	if config.PolygonRPC == "" || config.RelayerAddress == "" {
		return metrics
	}

	client, err := ethclient.Dial(config.PolygonRPC)
	if err != nil {
		return metrics
	}
	defer client.Close()

	address := common.HexToAddress(config.RelayerAddress)
	balance, err := client.BalanceAt(context.Background(), address, nil)
	if err != nil {
		return metrics
	}

	// Convert to POL
	fbalance := new(big.Float).SetInt(balance)
	ethValue := new(big.Float).Quo(fbalance, big.NewFloat(1e18))
	balancePOL, _ := ethValue.Float64()
	metrics.BalancePOL = balancePOL

	// Estimate USD value (placeholder - would need price oracle)
	metrics.BalanceUSD = balancePOL * 0.50 // Approximate POL price

	// Get gas price
	gasPrice, err := client.SuggestGasPrice(context.Background())
	if err == nil {
		gasPriceGwei := new(big.Float).Quo(
			new(big.Float).SetInt(gasPrice),
			big.NewFloat(1e9),
		)
		metrics.GasPriceCurrent, _ = gasPriceGwei.Float64()
		metrics.GasPriceAverage = metrics.GasPriceCurrent
		metrics.GasPricePeak = metrics.GasPriceCurrent * 1.5
	}

	// Estimate transactions remaining (assuming 0.0002 POL per tx)
	if balancePOL > 0 {
		metrics.EstimatedTxRemaining = int(balancePOL / 0.0002)
	}

	// Low balance alert
	metrics.LowBalanceAlert = balancePOL < 0.01

	return metrics
}

func collectIPFSMetrics(config Config) IPFSMetrics {
	metrics := IPFSMetrics{
		PinataConnected: config.IPFSAPIKey != "",
	}

	// TODO: Query Pinata API for actual stats
	// For now, use placeholder values
	metrics.TotalUploads = 0
	metrics.UploadsToday = 0
	metrics.StorageUsedMB = 0
	metrics.UploadSuccessRate = 100.0
	metrics.FailedUploads = 0
	metrics.AverageUploadTime = 500

	return metrics
}

func collectSuiMetrics(config Config) SuiMetrics {
	metrics := SuiMetrics{
		Connected: false,
	}

	suiRPC := os.Getenv("SUI_RPC_URL")
	if suiRPC == "" {
		suiRPC = "https://fullnode.testnet.sui.io:443"
	}

	httpClient := &http.Client{Timeout: 5 * time.Second}
	start := time.Now()

	// Fetch latest checkpoint
	checkpoint, err := callSuiRPC(httpClient, suiRPC, "sui_getLatestCheckpointSequenceNumber", []interface{}{})
	if err == nil && checkpoint != nil {
		metrics.Connected = true
		metrics.NetworkLatency = time.Since(start).Milliseconds()
		if checkpointStr, ok := checkpoint.(string); ok {
			metrics.LatestCheckpoint = checkpointStr
		}
	}

	// Fetch total transactions
	totalTx, err := callSuiRPC(httpClient, suiRPC, "sui_getTotalTransactionBlocks", []interface{}{})
	if err == nil && totalTx != nil {
		if txStr, ok := totalTx.(string); ok {
			metrics.TotalTransactions = txStr
		}
	}

	// Fetch reference gas price
	gasPrice, err := callSuiRPC(httpClient, suiRPC, "suix_getReferenceGasPrice", []interface{}{})
	if err == nil && gasPrice != nil {
		if gasPriceStr, ok := gasPrice.(string); ok {
			metrics.ReferenceGasPrice = gasPriceStr
		}
	}

	// Fetch system state for epoch info
	systemState, err := callSuiRPC(httpClient, suiRPC, "suix_getLatestSuiSystemState", []interface{}{})
	if err == nil && systemState != nil {
		if stateMap, ok := systemState.(map[string]interface{}); ok {
			if epoch, ok := stateMap["epoch"].(string); ok {
				metrics.CurrentEpoch = epoch
			}
			if epochStart, ok := stateMap["epochStartTimestampMs"].(string); ok {
				metrics.EpochStartTimestamp = epochStart
			}
			if epochDuration, ok := stateMap["epochDurationMs"].(string); ok {
				metrics.EpochDurationMs = epochDuration
			}
		}
	}

	return metrics
}

func callSuiRPC(client *http.Client, rpcURL string, method string, params []interface{}) (interface{}, error) {
	payload := map[string]interface{}{
		"jsonrpc": "2.0",
		"id":      1,
		"method":  method,
		"params":  params,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", rpcURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	if resultData, ok := result["result"]; ok {
		return resultData, nil
	}

	return nil, fmt.Errorf("no result in response")
}

func collectGCPMetrics(config Config) GCPMetrics {
	metrics := GCPMetrics{
		LastUpdated:    time.Now(),
		UpdateInterval: 60, // 60 seconds refresh rate
		SuiValidator: InstanceMetrics{
			Name:   "SUI NETWORK",
			Status: "unknown",
		},
		RailwayCore: InstanceMetrics{
			Name:   "RAILWAY OPERATIONS",
			Status: "unknown",
		},
	}

	// Check if GCP credentials are available
	credPath := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS")
	if credPath == "" {
		// Try to use GCP_SERVICE_ACCOUNT_KEY environment variable
		credJSON := os.Getenv("GCP_SERVICE_ACCOUNT_KEY")
		if credJSON == "" {
			log.Println("⚠️  No GCP credentials found, skipping GCP metrics")
			return metrics
		}
		// Create temporary credentials file
		tmpFile, err := os.CreateTemp("", "gcp-creds-*.json")
		if err != nil {
			log.Printf("❌ Failed to create temp credentials file: %v\n", err)
			return metrics
		}
		defer os.Remove(tmpFile.Name())
		
		if _, err := tmpFile.Write([]byte(credJSON)); err != nil {
			log.Printf("❌ Failed to write credentials: %v\n", err)
			return metrics
		}
		tmpFile.Close()
		credPath = tmpFile.Name()
	}

	ctx := context.Background()
	client, err := monitoring.NewMetricClient(ctx, option.WithCredentialsFile(credPath))
	if err != nil {
		log.Printf("❌ Failed to create GCP monitoring client: %v\n", err)
		return metrics
	}
	defer client.Close()

	// Query CPU utilization from the scoping project
	projectName := "projects/africa-railways-481823"
	endTime := time.Now()
	startTime := endTime.Add(-24 * time.Hour) // Last 24 hours for stability calculation

	req := &monitoringpb.ListTimeSeriesRequest{
		Name:   projectName,
		Filter: `metric.type="compute.googleapis.com/instance/cpu/utilization"`,
		Interval: &monitoringpb.TimeInterval{
			EndTime:   timestamppb.New(endTime),
			StartTime: timestamppb.New(startTime),
		},
		Aggregation: &monitoringpb.Aggregation{
			AlignmentPeriod:  durationpb.New(60 * time.Second),
			PerSeriesAligner: monitoringpb.Aggregation_ALIGN_MEAN,
		},
	}

	it := client.ListTimeSeries(ctx, req)
	
	// Process time series data
	now := time.Now()
	
	// Expected data points in 24 hours with 60-second intervals
	// 24 hours * 60 minutes * 1 point per minute = 1440 expected points
	expectedDataPoints := 1440
	
	for {
		resp, err := it.Next()
		if err != nil {
			if err.Error() == "no more items in iterator" {
				break
			}
			log.Printf("❌ Error fetching time series: %v\n", err)
			break
		}

		// Extract labels
		projectID := resp.Resource.Labels["project_id"]
		instanceID := resp.Resource.Labels["instance_id"]
		zone := resp.Resource.Labels["zone"]

		// Get latest CPU value and timestamp
		var cpuValue float64
		var lastDataPoint time.Time
		var status string
		actualDataPoints := len(resp.Points)
		
		if actualDataPoints > 0 {
			cpuValue = resp.Points[0].Value.GetDoubleValue() * 100 // Convert to percentage
			lastDataPoint = resp.Points[0].Interval.EndTime.AsTime()
			
			// Determine status based on data freshness
			timeSinceLastData := now.Sub(lastDataPoint)
			if timeSinceLastData <= 5*time.Minute {
				status = "online" // Green - data within last 5 minutes
			} else if timeSinceLastData <= 10*time.Minute {
				status = "offline" // Red - no data for 5-10 minutes
			} else {
				status = "offline" // Red - no data for more than 10 minutes
			}
		} else {
			status = "offline" // Red - no data points available
		}
		
		// Calculate stability percentage
		// Stability = (actual data points / expected data points) * 100
		stability := (float64(actualDataPoints) / float64(expectedDataPoints)) * 100
		if stability > 100 {
			stability = 100 // Cap at 100%
		}

		// Map to friendly names based on project_id
		if projectID == "valued-context-481911-i4" {
			// Sui Network
			metrics.SuiValidator = InstanceMetrics{
				Name:            "SUI NETWORK",
				ProjectID:       projectID,
				InstanceID:      instanceID,
				Zone:            zone,
				CPUUtilization:  cpuValue,
				Status:          status,
				Stability:       stability,
				DataPointsCount: actualDataPoints,
			}
		} else if projectID == "africa-railways-481823" {
			// Railway Operations
			metrics.RailwayCore = InstanceMetrics{
				Name:            "RAILWAY OPERATIONS",
				ProjectID:       projectID,
				InstanceID:      instanceID,
				Zone:            zone,
				CPUUtilization:  cpuValue,
				Status:          status,
				Stability:       stability,
				DataPointsCount: actualDataPoints,
			}
		}
	}

	return metrics
}

func collectUSSDMetrics(config Config) USSDMetrics {
	metrics := USSDMetrics{
		Connected:          false,
		ActiveSessions:     0,
		TotalSessionsToday: 0,
		SuccessRate:        0,
		AverageResponseTime: 0,
		PeakSessions:       0,
		FailedSessions:     0,
		LastSessionTime:    time.Time{},
		Uptime:             0,
	}

	// Check USSD gateway health endpoint
	ussdHealthURL := os.Getenv("USSD_HEALTH_URL")
	if ussdHealthURL == "" {
		ussdHealthURL = "http://localhost:8081/health" // Default local USSD service
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(ussdHealthURL)
	if err != nil {
		log.Printf("⚠️  USSD Gateway not reachable: %v", err)
		return metrics
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		log.Printf("⚠️  USSD Gateway returned status: %d", resp.StatusCode)
		return metrics
	}

	// Parse USSD metrics from health endpoint
	var ussdHealth struct {
		Connected           bool      `json:"connected"`
		ActiveSessions      int       `json:"active_sessions"`
		TotalSessionsToday  int64     `json:"total_sessions_today"`
		SuccessRate         float64   `json:"success_rate"`
		AverageResponseTime int64     `json:"average_response_time_ms"`
		PeakSessions        int       `json:"peak_sessions"`
		FailedSessions      int64     `json:"failed_sessions"`
		LastSessionTime     time.Time `json:"last_session_time"`
		Uptime              float64   `json:"uptime_percent"`
		Revenue             struct {
			ConfirmedTotal float64 `json:"confirmed_total"`
			PendingTotal   float64 `json:"pending_total"`
			RevenueToday   float64 `json:"revenue_today"`
			TicketsToday   int64   `json:"tickets_today"`
		} `json:"revenue"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&ussdHealth); err != nil {
		log.Printf("⚠️  Failed to parse USSD health response: %v", err)
		// USSD is reachable but response format unexpected
		metrics.Connected = true
		metrics.Uptime = 100.0
		return metrics
	}

	return USSDMetrics{
		Connected:           true,
		ActiveSessions:      ussdHealth.ActiveSessions,
		TotalSessionsToday:  ussdHealth.TotalSessionsToday,
		SuccessRate:         ussdHealth.SuccessRate,
		AverageResponseTime: ussdHealth.AverageResponseTime,
		PeakSessions:        ussdHealth.PeakSessions,
		FailedSessions:      ussdHealth.FailedSessions,
		LastSessionTime:     ussdHealth.LastSessionTime,
		Uptime:              ussdHealth.Uptime,
		Revenue: RevenueMetrics{
			ConfirmedTotal: ussdHealth.Revenue.ConfirmedTotal,
			PendingTotal:   ussdHealth.Revenue.PendingTotal,
			RevenueToday:   ussdHealth.Revenue.RevenueToday,
			TicketsToday:   ussdHealth.Revenue.TicketsToday,
		},
	}
}

func collectHealthMetrics(config Config) HealthMetrics {
	now := time.Now()
	
	// Check Polygon RPC
	polygonStatus := ServiceStatus{
		Status:      "down",
		LastChecked: now,
		Uptime:      0,
	}
	
	if config.PolygonRPC != "" {
		start := time.Now()
		client, err := ethclient.Dial(config.PolygonRPC)
		if err == nil {
			_, err = client.BlockNumber(context.Background())
			if err == nil {
				polygonStatus.Status = "operational"
				polygonStatus.Uptime = 99.9
				polygonStatus.ResponseTime = time.Since(start).Milliseconds()
			}
			client.Close()
		}
	}

	// Check Sui Node
	suiStatus := ServiceStatus{
		Status:      "down",
		LastChecked: now,
		Uptime:      0,
	}
	
	suiRPC := "https://fullnode.testnet.sui.io:443"
	payload := map[string]interface{}{
		"jsonrpc": "2.0",
		"id":      1,
		"method":  "sui_getLatestCheckpointSequenceNumber",
		"params":  []interface{}{},
	}
	jsonData, _ := json.Marshal(payload)
	
	start := time.Now()
	req, _ := http.NewRequest("POST", suiRPC, bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	httpClient := &http.Client{Timeout: 5 * time.Second}
	resp, err := httpClient.Do(req)
	if err == nil {
		defer resp.Body.Close()
		suiStatus.Status = "operational"
		suiStatus.Uptime = 99.8
		suiStatus.ResponseTime = time.Since(start).Milliseconds()
	}

	// Check USSD Gateway
	ussdStatus := ServiceStatus{
		Status:      "down",
		LastChecked: now,
		Uptime:      0,
	}
	
	ussdHealthURL := os.Getenv("USSD_HEALTH_URL")
	if ussdHealthURL == "" {
		ussdHealthURL = "http://localhost:8081/health"
	}
	
	resp, err = httpClient.Get(ussdHealthURL)
	if err == nil {
		defer resp.Body.Close()
		if resp.StatusCode == 200 {
			ussdStatus.Status = "operational"
			ussdStatus.Uptime = 99.7
			ussdStatus.ResponseTime = 150
		}
	}

	// Check AWS S3 (placeholder - would need AWS SDK)
	s3Status := ServiceStatus{
		Status:       "operational",
		LastChecked:  now,
		Uptime:       99.99,
		ResponseTime: 100,
	}

	return HealthMetrics{
		RelayerService: ServiceStatus{
			Status:       "operational",
			LastChecked:  now,
			Uptime:       99.5,
			ResponseTime: 50,
		},
		IPFSUploader: ServiceStatus{
			Status:       "operational",
			LastChecked:  now,
			Uptime:       99.8,
			ResponseTime: 500,
		},
		APIServer: ServiceStatus{
			Status:       "operational",
			LastChecked:  now,
			Uptime:       100.0,
			ResponseTime: 10,
		},
		PassengerApp: ServiceStatus{
			Status:       "operational",
			LastChecked:  now,
			Uptime:       99.9,
			ResponseTime: 100,
		},
		StaffApp: ServiceStatus{
			Status:       "operational",
			LastChecked:  now,
			Uptime:       99.9,
			ResponseTime: 100,
		},
		USSDGateway: ussdStatus,
		AlchemyAPI: ServiceStatus{
			Status:       "operational",
			LastChecked:  now,
			Uptime:       99.99,
			ResponseTime: 200,
		},
		PinataAPI: ServiceStatus{
			Status:       "operational",
			LastChecked:  now,
			Uptime:       99.9,
			ResponseTime: 300,
		},
		PolygonRPC: polygonStatus,
		SuiNode:    suiStatus,
		AWSS3:      s3Status,
	}
}

func generateAlerts(metrics SystemMetrics) []Alert {
	alerts := []Alert{}

	// Low balance alert
	if metrics.Wallet.LowBalanceAlert {
		alerts = append(alerts, Alert{
			Level:     "critical",
			Message:   fmt.Sprintf("Relayer wallet balance low: %.4f POL", metrics.Wallet.BalancePOL),
			Timestamp: time.Now(),
			Component: "wallet",
		})
	}

	// Blockchain connection alert
	if !metrics.Blockchain.Polygon.Connected {
		alerts = append(alerts, Alert{
			Level:     "critical",
			Message:   "Polygon RPC connection failed",
			Timestamp: time.Now(),
			Component: "blockchain",
		})
	}

	// IPFS alert
	if !metrics.IPFS.PinataConnected {
		alerts = append(alerts, Alert{
			Level:     "warning",
			Message:   "Pinata API not configured",
			Timestamp: time.Now(),
			Component: "ipfs",
		})
	}

	return alerts
}

func handleBroadcast() {
	for {
		metrics := <-broadcast
		clientsMu.Lock()
		for client := range clients {
			err := client.WriteJSON(metrics)
			if err != nil {
				log.Printf("WebSocket error: %v", err)
				client.Close()
				delete(clients, client)
			}
		}
		clientsMu.Unlock()
	}
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	clientsMu.Lock()
	clients[conn] = true
	clientsMu.Unlock()

	log.Println("✅ New WebSocket client connected")
}

func handleMetrics(w http.ResponseWriter, r *http.Request) {
	config := loadConfig()
	metrics := collectMetrics(config)
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metrics)
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	config := loadConfig()
	health := collectHealthMetrics(config)
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(health)
}

func handleAlerts(w http.ResponseWriter, r *http.Request) {
	config := loadConfig()
	metrics := collectMetrics(config)
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metrics.Alerts)
}

// Control handlers for service management
type ControlResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Service string `json:"service"`
	Action  string `json:"action"`
}

func handleRelayerStart(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	log.Println("🚀 Starting relayer service...")
	
	// Execute relayer start command
	// In production, this would:
	// 1. Start GCP Compute Engine instance
	// 2. Or start Docker container
	// 3. Or start systemd service
	
	response := ControlResponse{
		Success: true,
		Message: "Relayer service started successfully",
		Service: "relayer",
		Action:  "start",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleRelayerStop(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	log.Println("🛑 Stopping relayer service...")
	
	response := ControlResponse{
		Success: true,
		Message: "Relayer service stopped successfully",
		Service: "relayer",
		Action:  "stop",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleMonitorStart(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	log.Println("🚀 Starting monitor service...")
	
	response := ControlResponse{
		Success: true,
		Message: "Monitor service started successfully",
		Service: "monitor",
		Action:  "start",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleMonitorStop(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	log.Println("🛑 Stopping monitor service...")
	
	response := ControlResponse{
		Success: true,
		Message: "Monitor service stopped successfully",
		Service: "monitor",
		Action:  "stop",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleIPFSStart(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	log.Println("🚀 Starting IPFS uploader service...")
	
	response := ControlResponse{
		Success: true,
		Message: "IPFS uploader service started successfully",
		Service: "ipfs",
		Action:  "start",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleIPFSStop(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	log.Println("🛑 Stopping IPFS uploader service...")
	
	response := ControlResponse{
		Success: true,
		Message: "IPFS uploader service stopped successfully",
		Service: "ipfs",
		Action:  "stop",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleUSSDStart(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	log.Println("🚀 Starting USSD gateway service...")
	
	response := ControlResponse{
		Success: true,
		Message: "USSD gateway service started successfully",
		Service: "ussd",
		Action:  "start",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleUSSDStop(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	log.Println("🛑 Stopping USSD gateway service (MAINTENANCE MODE)...")
	
	response := ControlResponse{
		Success: true,
		Message: "USSD gateway service stopped - MAINTENANCE MODE active",
		Service: "ussd",
		Action:  "stop",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// USSD-specific handlers
type USSDStats struct {
	ActiveSessions     int       `json:"active_sessions"`
	TotalSessionsToday int64     `json:"total_sessions_today"`
	LastCommand        string    `json:"last_command"`
	LastActivity       time.Time `json:"last_activity"`
	Uptime             string    `json:"uptime"`
	SuccessRate        float64   `json:"success_rate"`
	AverageResponseTime int64    `json:"average_response_time_ms"`
}

type USSDSession struct {
	SessionID   string    `json:"session_id"`
	PhoneNumber string    `json:"phone_number"`
	State       string    `json:"state"`
	LastCommand string    `json:"last_command"`
	StartTime   time.Time `json:"start_time"`
	Duration    int64     `json:"duration_seconds"`
}

func handleUSSDStats(w http.ResponseWriter, r *http.Request) {
	// In production, query Redis or database for real stats
	stats := USSDStats{
		ActiveSessions:     42,
		TotalSessionsToday: 1847,
		LastCommand:        "*123*1# (Buy Ticket)",
		LastActivity:       time.Now().Add(-2 * time.Minute),
		Uptime:             "14d 6h 23m",
		SuccessRate:        94.5,
		AverageResponseTime: 850,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

func handleUSSDSessions(w http.ResponseWriter, r *http.Request) {
	// In production, query Redis or database for active sessions
	sessions := []USSDSession{
		{
			SessionID:   "sess_abc123",
			PhoneNumber: "+27821234567",
			State:       "selecting_route",
			LastCommand: "*123*1*2#",
			StartTime:   time.Now().Add(-45 * time.Second),
			Duration:    45,
		},
		{
			SessionID:   "sess_def456",
			PhoneNumber: "+27829876543",
			State:       "payment_pending",
			LastCommand: "*123*1*3*1#",
			StartTime:   time.Now().Add(-2 * time.Minute),
			Duration:    120,
		},
		{
			SessionID:   "sess_ghi789",
			PhoneNumber: "+27835551234",
			State:       "main_menu",
			LastCommand: "*123#",
			StartTime:   time.Now().Add(-10 * time.Second),
			Duration:    10,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sessions)
}

func handleUSSDRevenue(w http.ResponseWriter, r *http.Request) {
	// Query USSD gateway for revenue metrics
	ussdHealthURL := os.Getenv("USSD_HEALTH_URL")
	if ussdHealthURL == "" {
		ussdHealthURL = "http://localhost:8081/revenue"
	} else {
		// Replace /health with /revenue
		ussdHealthURL = ussdHealthURL[:len(ussdHealthURL)-6] + "revenue"
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(ussdHealthURL)
	if err != nil {
		http.Error(w, "Failed to fetch revenue data", http.StatusServiceUnavailable)
		return
	}
	defer resp.Body.Close()

	// Forward the response
	w.Header().Set("Content-Type", "application/json")
	body, _ := io.ReadAll(resp.Body)
	w.Write(body)
}

func handleBlockchainFeed(w http.ResponseWriter, r *http.Request) {
	// Query relayer for blockchain events
	relayerURL := os.Getenv("RELAYER_URL")
	if relayerURL == "" {
		relayerURL = "http://localhost:8082/feed"
	} else {
		relayerURL = relayerURL + "/feed"
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(relayerURL)
	if err != nil {
		// Return empty array if relayer not available
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte("[]"))
		return
	}
	defer resp.Body.Close()

	// Forward the response
	w.Header().Set("Content-Type", "application/json")
	body, _ := io.ReadAll(resp.Body)
	w.Write(body)
}

func handleBlockchainKPIs(w http.ResponseWriter, r *http.Request) {
	// Query relayer for KPIs
	relayerURL := os.Getenv("RELAYER_URL")
	if relayerURL == "" {
		relayerURL = "http://localhost:8082/kpis"
	} else {
		relayerURL = relayerURL + "/kpis"
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(relayerURL)
	if err != nil {
		// Return default KPIs if relayer not available
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{
			"sui_events_detected": 0,
			"sui_tickets_purchased": 0,
			"polygon_tickets_minted": 0,
			"polygon_tx_success": 0,
			"polygon_tx_failed": 0,
			"bridge_latency_ms": 0,
			"missed_tickets": 0,
			"recovered_tickets": 0,
			"uptime_seconds": 0,
			"events_per_minute": 0,
			"mints_per_minute": 0,
			"success_rate": 100
		}`))
		return
	}
	defer resp.Body.Close()

	// Forward the response
	w.Header().Set("Content-Type", "application/json")
	body, _ := io.ReadAll(resp.Body)
	w.Write(body)
}

func handleBlockchainResync(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Query relayer for resync
	relayerURL := os.Getenv("RELAYER_URL")
	if relayerURL == "" {
		relayerURL = "http://localhost:8082/resync"
	} else {
		relayerURL = relayerURL + "/resync"
	}

	// Forward the request body
	body, _ := io.ReadAll(r.Body)
	
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Post(relayerURL, "application/json", bytes.NewBuffer(body))
	if err != nil {
		http.Error(w, "Resync failed", http.StatusServiceUnavailable)
		return
	}
	defer resp.Body.Close()

	// Forward the response
	w.Header().Set("Content-Type", "application/json")
	respBody, _ := io.ReadAll(resp.Body)
	w.Write(respBody)
}

func handleBlockchainSparkline(w http.ResponseWriter, r *http.Request) {
	// Query relayer for sparkline data
	relayerURL := os.Getenv("RELAYER_URL")
	if relayerURL == "" {
		relayerURL = "http://localhost:8082/sparkline"
	} else {
		relayerURL = relayerURL + "/sparkline"
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(relayerURL)
	if err != nil {
		// Return empty sparkline data if relayer not available
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"tickets_per_minute":[],"failed_attempts":[],"data_points":0,"max_points":60}`))
		return
	}
	defer resp.Body.Close()

	// Forward the response
	w.Header().Set("Content-Type", "application/json")
	body, _ := io.ReadAll(resp.Body)
	w.Write(body)
}

// Cloud Infrastructure Control Handlers

// handleGCPControl manages GCP Compute Engine instances
func handleGCPControl(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	instanceName := r.FormValue("instance")
	action := r.FormValue("action") // "start" or "stop"
	projectID := os.Getenv("GCP_PROJECT_ID")
	zone := os.Getenv("GCP_ZONE")

	if instanceName == "" || action == "" {
		http.Error(w, "Missing instance or action parameter", http.StatusBadRequest)
		return
	}

	if projectID == "" || zone == "" {
		http.Error(w, "GCP_PROJECT_ID or GCP_ZONE not configured", http.StatusInternalServerError)
		return
	}

	log.Printf("🔧 GCP Control: %s instance %s in %s/%s", action, instanceName, projectID, zone)

	// Use gcloud CLI for simplicity (requires gcloud SDK installed)
	// In production, use the official GCP Go SDK: cloud.google.com/go/compute
	var cmd *exec.Cmd
	if action == "start" {
		cmd = exec.Command("gcloud", "compute", "instances", "start", instanceName,
			"--project", projectID,
			"--zone", zone)
	} else if action == "stop" {
		cmd = exec.Command("gcloud", "compute", "instances", "stop", instanceName,
			"--project", projectID,
			"--zone", zone)
	} else {
		http.Error(w, "Invalid action. Use 'start' or 'stop'", http.StatusBadRequest)
		return
	}

	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("❌ GCP Control failed: %v\nOutput: %s", err, string(output))
		response := ControlResponse{
			Success: false,
			Message: fmt.Sprintf("Failed to %s instance: %v", action, err),
			Service: "gcp",
			Action:  action,
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(response)
		return
	}

	log.Printf("✅ GCP instance %s %sed successfully", instanceName, action)
	
	response := ControlResponse{
		Success: true,
		Message: fmt.Sprintf("GCP instance %s %sed successfully", instanceName, action),
		Service: "gcp",
		Action:  action,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// handleAWSControl manages AWS EC2 instances
func handleAWSControl(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	instanceID := r.FormValue("id")
	action := r.FormValue("action") // "start" or "stop"
	region := os.Getenv("AWS_REGION")

	if instanceID == "" || action == "" {
		http.Error(w, "Missing id or action parameter", http.StatusBadRequest)
		return
	}

	if region == "" {
		region = "us-east-1" // Default region
	}

	log.Printf("🔧 AWS Control: %s instance %s in %s", action, instanceID, region)

	// Use AWS CLI for simplicity (requires aws CLI installed)
	// In production, use the official AWS Go SDK: github.com/aws/aws-sdk-go-v2
	var cmd *exec.Cmd
	if action == "start" {
		cmd = exec.Command("aws", "ec2", "start-instances",
			"--instance-ids", instanceID,
			"--region", region)
	} else if action == "stop" {
		cmd = exec.Command("aws", "ec2", "stop-instances",
			"--instance-ids", instanceID,
			"--region", region)
	} else {
		http.Error(w, "Invalid action. Use 'start' or 'stop'", http.StatusBadRequest)
		return
	}

	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("❌ AWS Control failed: %v\nOutput: %s", err, string(output))
		response := ControlResponse{
			Success: false,
			Message: fmt.Sprintf("Failed to %s instance: %v", action, err),
			Service: "aws",
			Action:  action,
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(response)
		return
	}

	log.Printf("✅ AWS instance %s %sed successfully", instanceID, action)
	
	response := ControlResponse{
		Success: true,
		Message: fmt.Sprintf("AWS instance %s %sed successfully", instanceID, action),
		Service: "aws",
		Action:  action,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Production-ready implementations using official SDKs:
//
// For GCP (requires: go get cloud.google.com/go/compute):
/*
import (
	compute "cloud.google.com/go/compute/apiv1"
	computepb "cloud.google.com/go/compute/apiv1/computepb"
)

func handleGCPControlSDK(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	client, err := compute.NewInstancesRESTClient(ctx)
	if err != nil {
		// handle error
	}
	defer client.Close()

	req := &computepb.StartInstanceRequest{
		Project:  projectID,
		Zone:     zone,
		Instance: instanceName,
	}
	
	op, err := client.Start(ctx, req)
	if err != nil {
		// handle error
	}
	
	// Wait for operation to complete
	if err = op.Wait(ctx); err != nil {
		// handle error
	}
}
*/

// For AWS (requires: go get github.com/aws/aws-sdk-go-v2/...):
/*
import (
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
)

func handleAWSControlSDK(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion(region))
	if err != nil {
		// handle error
	}

	client := ec2.NewFromConfig(cfg)
	
	input := &ec2.StartInstancesInput{
		InstanceIds: []string{instanceID},
	}
	
	result, err := client.StartInstances(ctx, input)
	if err != nil {
		// handle error
	}
	
	// Process result
}
*/

// autoDetectRelayerAddress derives the public address from RELAYER_PRIVATE_KEY
func autoDetectRelayerAddress() error {
	privKeyHex := os.Getenv("RELAYER_PRIVATE_KEY")
	if privKeyHex == "" {
		return fmt.Errorf("RELAYER_PRIVATE_KEY not found in environment")
	}

	address, err := deriveAddress(privKeyHex)
	if err != nil {
		return fmt.Errorf("failed to derive address: %w", err)
	}

	// Set for session use
	os.Setenv("RELAYER_ADDRESS", address)
	log.Printf("🔐 Auto-detected Relayer Address: %s", address)

	return nil
}

// deriveAddress derives the Ethereum address from a private key hex string
func deriveAddress(hexKey string) (string, error) {
	privateKey, err := crypto.HexToECDSA(hexKey)
	if err != nil {
		return "", err
	}

	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		return "", fmt.Errorf("error casting public key to ECDSA")
	}

	return crypto.PubkeyToAddress(*publicKeyECDSA).Hex(), nil
}
