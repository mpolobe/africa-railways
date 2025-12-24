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
	PolygonClient  *ethclient.Client
	RelayerAddress common.Address
	Balance        *big.Float
	LastHeartbeat  time.Time
	EventsProcessed int64
	UsingValidator bool
	RPCURL         string
}

var (
	config Config
	state  RelayerState
)

func main() {
	log.Println("🚂 Africa Railways Relayer Bridge")
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	log.Println("Sui → Polygon Event Bridge with Heartbeat")
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

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

	for range ticker.C {
		state.LastHeartbeat = time.Now()

		// Check Polygon connection
		_, err := state.PolygonClient.BlockNumber(context.Background())
		if err != nil {
			log.Printf("💔 Heartbeat: Polygon connection lost (%v)", err)
			continue
		}

		// Update balance
		if err := updateBalance(); err != nil {
			log.Printf("⚠️  Heartbeat: Failed to update balance (%v)", err)
		}

		// Log status
		balancePOL, _ := state.Balance.Float64()
		log.Printf("💓 Heartbeat: OK | Balance: %.4f POL | Events: %d | Validator: %t",
			balancePOL, state.EventsProcessed, state.UsingValidator)
	}
}

func listenSuiEvents() {
	log.Println("👂 Sui event listener started")
	log.Printf("   Listening on: %s", config.SuiRPCURL)

	// TODO: Implement Sui event subscription
	// For now, this is a placeholder that demonstrates the pattern

	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		// In production, this would:
		// 1. Subscribe to Sui events (ticket purchases)
		// 2. Parse event data (user wallet, ticket details)
		// 3. Mint NFT on Polygon using gasless transaction
		// 4. Upload metadata to IPFS
		// 5. Update dashboard via Sui event

		// Placeholder: Check for new events
		// events := checkSuiEvents()
		// for _, event := range events {
		//     processEvent(event)
		// }

		// For now, just log that we're listening
		if state.EventsProcessed == 0 {
			log.Println("👂 Listening for Sui events...")
		}
	}
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
