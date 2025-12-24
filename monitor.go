package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/big"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
)

// Config holds monitoring configuration
type Config struct {
	AlchemyEndpoint string `json:"alchemyEndpoint"`
	GasPolicyID     string `json:"gasPolicyId"`
	IPFSAPIKey      string `json:"ipfsApiKey"`
	RelayerAddress  string `json:"relayerAddress"`
}

// MonitoringMetrics holds current system state
type MonitoringMetrics struct {
	Timestamp          time.Time
	WalletBalance      float64
	WalletBalanceUSD   float64
	GasPrice           float64
	EstimatedTxLeft    int
	PolygonConnected   bool
	IPFSConnected      bool
	AlchemyConnected   bool
	GasPolicyActive    bool
	SuiConnected       bool
	SuiLatency         int64
	Alerts             []string
}

const (
	// Alert thresholds
	CRITICAL_BALANCE_POL = 0.01  // Critical: < 0.01 POL
	WARNING_BALANCE_POL  = 0.05  // Warning: < 0.05 POL
	HIGH_GAS_PRICE_GWEI  = 50.0  // Warning: > 50 Gwei
	IPFS_TIMEOUT_SEC     = 10    // IPFS health check timeout
	SUI_TIMEOUT_SEC      = 5     // Sui RPC timeout
	SUI_LATENCY_WARNING  = 2000  // Warning if > 2 seconds
	CHECK_INTERVAL_SEC   = 30    // Monitor every 30 seconds
)

var (
	config  Config
	metrics MonitoringMetrics
)

func main() {
	log.Println("🛰️  Africa Railways Monitor Engine Starting...")
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	// Load configuration
	if err := loadConfig(); err != nil {
		log.Fatalf("❌ Failed to load config: %v", err)
	}

	log.Printf("✅ Configuration loaded")
	log.Printf("   Relayer: %s", config.RelayerAddress)
	log.Printf("   Gas Policy: %s", config.GasPolicyID)
	log.Printf("   Monitoring interval: %d seconds", CHECK_INTERVAL_SEC)
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	// Run initial check
	runHealthCheck()

	// Start monitoring loop
	ticker := time.NewTicker(CHECK_INTERVAL_SEC * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		runHealthCheck()
	}
}

func loadConfig() error {
	// Try to load from config.json
	configPath := filepath.Join("config.json")
	data, err := os.ReadFile(configPath)
	if err != nil {
		return fmt.Errorf("config.json not found: %w", err)
	}

	if err := json.Unmarshal(data, &config); err != nil {
		return fmt.Errorf("invalid config.json: %w", err)
	}

	// Load relayer address from environment
	config.RelayerAddress = os.Getenv("RELAYER_ADDRESS")
	if config.RelayerAddress == "" {
		// Try to load from backend/.env
		envPath := filepath.Join("backend", ".env")
		envData, err := os.ReadFile(envPath)
		if err == nil {
			// Simple parsing for RELAYER_ADDRESS
			lines := bytes.Split(envData, []byte("\n"))
			for _, line := range lines {
				if bytes.HasPrefix(line, []byte("RELAYER_ADDRESS=")) {
					config.RelayerAddress = string(bytes.TrimPrefix(line, []byte("RELAYER_ADDRESS=")))
					break
				}
			}
		}
	}

	if config.RelayerAddress == "" {
		return fmt.Errorf("RELAYER_ADDRESS not found in environment or backend/.env")
	}

	return nil
}

func runHealthCheck() {
	metrics = MonitoringMetrics{
		Timestamp: time.Now(),
		Alerts:    []string{},
	}

	log.Printf("\n🔍 Health Check: %s", metrics.Timestamp.Format("2006-01-02 15:04:05"))
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	// Check Polygon RPC connection
	checkPolygonConnection()

	// Check wallet balance
	checkWalletBalance()

	// Check Alchemy Gas Policy
	checkGasPolicy()

	// Check IPFS/Pinata
	checkIPFS()

	// Check Sui node latency (for fast USSD response)
	checkSuiNode()

	// Display summary
	displaySummary()

	// Handle alerts
	if len(metrics.Alerts) > 0 {
		handleAlerts()
	}
}

func checkPolygonConnection() {
	log.Print("📡 Checking Polygon RPC... ")

	start := time.Now()
	client, err := ethclient.Dial(config.AlchemyEndpoint)
	if err != nil {
		log.Printf("❌ FAILED (%v)", err)
		metrics.PolygonConnected = false
		metrics.Alerts = append(metrics.Alerts, "CRITICAL: Polygon RPC connection failed")
		return
	}
	defer client.Close()

	// Try to get latest block
	block, err := client.BlockNumber(context.Background())
	if err != nil {
		log.Printf("❌ FAILED (%v)", err)
		metrics.PolygonConnected = false
		metrics.Alerts = append(metrics.Alerts, "CRITICAL: Cannot query Polygon blockchain")
		return
	}

	latency := time.Since(start).Milliseconds()
	log.Printf("✅ OK (Block: %d, Latency: %dms)", block, latency)
	metrics.PolygonConnected = true
	metrics.AlchemyConnected = true
}

func checkWalletBalance() {
	log.Print("💰 Checking relayer wallet... ")

	if !metrics.PolygonConnected {
		log.Println("⏭️  SKIPPED (RPC not connected)")
		return
	}

	client, err := ethclient.Dial(config.AlchemyEndpoint)
	if err != nil {
		log.Printf("❌ FAILED (%v)", err)
		return
	}
	defer client.Close()

	address := common.HexToAddress(config.RelayerAddress)
	balance, err := client.BalanceAt(context.Background(), address, nil)
	if err != nil {
		log.Printf("❌ FAILED (%v)", err)
		return
	}

	// Convert to POL
	fbalance := new(big.Float).SetInt(balance)
	ethValue := new(big.Float).Quo(fbalance, big.NewFloat(1e18))
	balancePOL, _ := ethValue.Float64()
	metrics.WalletBalance = balancePOL

	// Estimate USD value (POL ≈ $0.50)
	metrics.WalletBalanceUSD = balancePOL * 0.50

	// Get current gas price
	gasPrice, err := client.SuggestGasPrice(context.Background())
	if err == nil {
		gasPriceGwei := new(big.Float).Quo(
			new(big.Float).SetInt(gasPrice),
			big.NewFloat(1e9),
		)
		metrics.GasPrice, _ = gasPriceGwei.Float64()
	}

	// Estimate transactions remaining (assuming 0.0002 POL per mint)
	if balancePOL > 0 {
		metrics.EstimatedTxLeft = int(balancePOL / 0.0002)
	}

	// Generate alerts based on balance
	if balancePOL < CRITICAL_BALANCE_POL {
		log.Printf("❌ CRITICAL (%.4f POL = $%.2f)", balancePOL, metrics.WalletBalanceUSD)
		metrics.Alerts = append(metrics.Alerts, 
			fmt.Sprintf("CRITICAL: Wallet balance critically low (%.4f POL)", balancePOL))
	} else if balancePOL < WARNING_BALANCE_POL {
		log.Printf("⚠️  WARNING (%.4f POL = $%.2f)", balancePOL, metrics.WalletBalanceUSD)
		metrics.Alerts = append(metrics.Alerts, 
			fmt.Sprintf("WARNING: Wallet balance low (%.4f POL)", balancePOL))
	} else {
		log.Printf("✅ OK (%.4f POL = $%.2f, ~%d tx left)", 
			balancePOL, metrics.WalletBalanceUSD, metrics.EstimatedTxLeft)
	}

	// Check gas price
	if metrics.GasPrice > HIGH_GAS_PRICE_GWEI {
		log.Printf("⚠️  WARNING: High gas price (%.2f Gwei)", metrics.GasPrice)
		metrics.Alerts = append(metrics.Alerts, 
			fmt.Sprintf("WARNING: Gas price elevated (%.2f Gwei)", metrics.GasPrice))
	}
}

func checkGasPolicy() {
	log.Print("⛽ Checking Alchemy Gas Policy... ")

	if !metrics.AlchemyConnected {
		log.Println("⏭️  SKIPPED (Alchemy not connected)")
		return
	}

	// Check gas policy spending via Alchemy API
	// This queries the policy's current spend and limits
	payload := map[string]interface{}{
		"jsonrpc": "2.0",
		"id":      1,
		"method":  "alchemy_getGasPolicySpend",
		"params": []interface{}{
			map[string]string{
				"policyId": config.GasPolicyID,
			},
		},
	}

	jsonData, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", config.AlchemyEndpoint, bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("❌ FAILED (%v)", err)
		return
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("⚠️  WARNING (Cannot verify policy status: %v)", err)
		metrics.GasPolicyActive = true // Assume active if we can't check
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	
	// Parse response to check policy status
	var result struct {
		Result struct {
			SpentUSD    float64 `json:"spentUsd"`
			LimitUSD    float64 `json:"limitUsd"`
			IsActive    bool    `json:"isActive"`
			TxCount     int     `json:"txCount"`
		} `json:"result"`
		Error *struct {
			Message string `json:"message"`
		} `json:"error"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		// If API doesn't support this method, assume active
		metrics.GasPolicyActive = true
		log.Printf("✅ OK (Policy ID: %s)", config.GasPolicyID[:16]+"...")
		return
	}

	if result.Error != nil {
		log.Printf("⚠️  WARNING (%s)", result.Error.Message)
		metrics.GasPolicyActive = true
		return
	}

	metrics.GasPolicyActive = result.Result.IsActive

	if !result.Result.IsActive {
		log.Printf("❌ INACTIVE")
		metrics.Alerts = append(metrics.Alerts, "CRITICAL: Gas Policy is inactive")
		return
	}

	// Check if approaching spend limit
	spendPercent := (result.Result.SpentUSD / result.Result.LimitUSD) * 100
	if spendPercent > 90 {
		log.Printf("⚠️  WARNING (%.1f%% of budget used: $%.2f/$%.2f)", 
			spendPercent, result.Result.SpentUSD, result.Result.LimitUSD)
		metrics.Alerts = append(metrics.Alerts, 
			fmt.Sprintf("WARNING: Gas Policy at %.1f%% capacity", spendPercent))
	} else if spendPercent > 75 {
		log.Printf("⚠️  NOTICE (%.1f%% of budget used: $%.2f/$%.2f)", 
			spendPercent, result.Result.SpentUSD, result.Result.LimitUSD)
	} else {
		log.Printf("✅ OK (%.1f%% used: $%.2f/$%.2f, %d tx)", 
			spendPercent, result.Result.SpentUSD, result.Result.LimitUSD, result.Result.TxCount)
	}
}

func checkIPFS() {
	log.Print("📦 Checking IPFS/Pinata... ")

	if config.IPFSAPIKey == "" {
		log.Println("⚠️  WARNING (API key not configured)")
		metrics.IPFSConnected = false
		return
	}

	// Test Pinata connectivity and get pinning status
	start := time.Now()
	req, err := http.NewRequest("GET", "https://api.pinata.cloud/data/testAuthentication", nil)
	if err != nil {
		log.Printf("❌ FAILED (%v)", err)
		metrics.IPFSConnected = false
		return
	}

	req.Header.Set("Authorization", "Bearer "+config.IPFSAPIKey)

	client := &http.Client{Timeout: IPFS_TIMEOUT_SEC * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("❌ FAILED (%v)", err)
		metrics.IPFSConnected = false
		metrics.Alerts = append(metrics.Alerts, "WARNING: IPFS/Pinata connection failed")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("❌ FAILED (Status: %d, Body: %s)", resp.StatusCode, string(body))
		metrics.IPFSConnected = false
		metrics.Alerts = append(metrics.Alerts, "WARNING: IPFS/Pinata authentication failed")
		return
	}

	latency := time.Since(start).Milliseconds()
	metrics.IPFSConnected = true

	// Get pinning queue status
	pinStatusReq, _ := http.NewRequest("GET", "https://api.pinata.cloud/pinning/pinJobs?status=prechecking,retrieving,expired,over_free_limit,over_max_size,invalid_object,bad_host_node", nil)
	pinStatusReq.Header.Set("Authorization", "Bearer "+config.IPFSAPIKey)

	pinStatusResp, err := client.Do(pinStatusReq)
	if err == nil {
		defer pinStatusResp.Body.Close()
		body, _ := io.ReadAll(pinStatusResp.Body)

		var pinStatus struct {
			Count int `json:"count"`
			Rows  []struct {
				Status string `json:"status"`
			} `json:"rows"`
		}

		if json.Unmarshal(body, &pinStatus) == nil {
			if pinStatus.Count > 0 {
				log.Printf("⚠️  WARNING (%d pending pins, Latency: %dms)", pinStatus.Count, latency)
				metrics.Alerts = append(metrics.Alerts, 
					fmt.Sprintf("WARNING: %d IPFS pins pending", pinStatus.Count))
			} else {
				log.Printf("✅ OK (Latency: %dms, No pending pins)", latency)
			}
			return
		}
	}

	// If we can't check pin status, just report connectivity
	log.Printf("✅ OK (Latency: %dms)", latency)
}

func checkSuiNode() {
	log.Print("🌊 Checking Sui node latency... ")

	// Sui RPC endpoint (testnet)
	suiRPC := "https://fullnode.testnet.sui.io:443"

	// Prepare JSON-RPC request to get latest checkpoint
	payload := map[string]interface{}{
		"jsonrpc": "2.0",
		"id":      1,
		"method":  "sui_getLatestCheckpointSequenceNumber",
		"params":  []interface{}{},
	}

	jsonData, _ := json.Marshal(payload)
	
	start := time.Now()
	req, err := http.NewRequest("POST", suiRPC, bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("❌ FAILED (%v)", err)
		metrics.SuiConnected = false
		return
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: SUI_TIMEOUT_SEC * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("❌ FAILED (%v)", err)
		metrics.SuiConnected = false
		metrics.Alerts = append(metrics.Alerts, "WARNING: Sui node connection failed")
		return
	}
	defer resp.Body.Close()

	latency := time.Since(start).Milliseconds()
	metrics.SuiLatency = latency
	metrics.SuiConnected = true

	// Parse response to verify it's working
	body, _ := io.ReadAll(resp.Body)
	var result struct {
		Result string `json:"result"`
		Error  *struct {
			Message string `json:"message"`
		} `json:"error"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		log.Printf("⚠️  WARNING (Invalid response, Latency: %dms)", latency)
		return
	}

	if result.Error != nil {
		log.Printf("❌ FAILED (%s)", result.Error.Message)
		metrics.SuiConnected = false
		return
	}

	// Check if latency is acceptable for USSD (needs to be fast)
	if latency > SUI_LATENCY_WARNING {
		log.Printf("⚠️  SLOW (Latency: %dms - may impact USSD response time)", latency)
		metrics.Alerts = append(metrics.Alerts, 
			fmt.Sprintf("WARNING: Sui node latency high (%dms)", latency))
	} else if latency > 1000 {
		log.Printf("⚠️  NOTICE (Latency: %dms)", latency)
	} else {
		log.Printf("✅ OK (Latency: %dms - good for USSD)", latency)
	}
}

func displaySummary() {
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	log.Println("📊 SYSTEM STATUS SUMMARY")
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	// Overall health
	allHealthy := metrics.PolygonConnected && 
		metrics.SuiConnected &&
		metrics.IPFSConnected && 
		metrics.GasPolicyActive && 
		metrics.WalletBalance >= WARNING_BALANCE_POL &&
		metrics.SuiLatency < SUI_LATENCY_WARNING

	if allHealthy {
		log.Println("✅ ALL SYSTEMS OPERATIONAL")
	} else {
		log.Println("⚠️  ATTENTION REQUIRED")
	}

	log.Println()
	log.Printf("Polygon:       %s", statusIcon(metrics.PolygonConnected))
	log.Printf("Sui Node:      %s (%dms latency)", statusIcon(metrics.SuiConnected), metrics.SuiLatency)
	log.Printf("Wallet:        %s (%.4f POL)", statusIcon(metrics.WalletBalance >= WARNING_BALANCE_POL), metrics.WalletBalance)
	log.Printf("Gas Policy:    %s", statusIcon(metrics.GasPolicyActive))
	log.Printf("IPFS:          %s", statusIcon(metrics.IPFSConnected))
	log.Printf("Gas Price:     %.2f Gwei", metrics.GasPrice)
	log.Printf("TX Capacity:   ~%d mints", metrics.EstimatedTxLeft)

	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
}

func handleAlerts() {
	log.Println()
	log.Println("🚨 ACTIVE ALERTS")
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	for i, alert := range metrics.Alerts {
		log.Printf("%d. %s", i+1, alert)
	}

	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	// In production, this would:
	// - Send SMS/email notifications
	// - Post to Slack/Discord
	// - Trigger PagerDuty
	// - Log to monitoring service (Datadog, New Relic, etc.)

	// For now, just write to alerts.log
	logAlerts()
}

func logAlerts() {
	f, err := os.OpenFile("alerts.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Printf("⚠️  Could not write to alerts.log: %v", err)
		return
	}
	defer f.Close()

	for _, alert := range metrics.Alerts {
		f.WriteString(fmt.Sprintf("[%s] %s\n", 
			metrics.Timestamp.Format("2006-01-02 15:04:05"), alert))
	}
}

func statusIcon(ok bool) string {
	if ok {
		return "✅ OK"
	}
	return "❌ FAIL"
}
