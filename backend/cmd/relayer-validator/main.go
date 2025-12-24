package main

import (
	"context"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
)

var (
	client         *ethclient.Client
	relayerAddress common.Address
	rpcURL         string
	usingValidator bool
)

func main() {
	log.Println("🚂 Africa Railways Relayer with Polygon Validator")
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	// Initialize
	if err := initialize(); err != nil {
		log.Fatalf("❌ Initialization failed: %v", err)
	}

	// Start HTTP server for health checks and minting
	go startHTTPServer()

	// Start background monitoring
	go monitorWallet()

	// Keep main alive
	log.Println("✅ Relayer running. Press Ctrl+C to stop.")
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	<-sigChan
	
	log.Println("")
	log.Println("🛑 Shutting down gracefully...")
	client.Close()
}

func initialize() error {
	// Get RPC URL (prefer internal validator)
	rpcURL = os.Getenv("POLYGON_RPC_URL")
	if rpcURL == "" {
		rpcURL = "http://10.128.0.2:8545" // Default to internal validator
	}

	log.Printf("🔗 Connecting to Polygon: %s", rpcURL)

	// Connect to validator
	var err error
	client, err = ethclient.Dial(rpcURL)
	if err != nil {
		// Fallback to Alchemy
		log.Printf("⚠️  Primary RPC failed, trying Alchemy fallback...")
		alchemyURL := os.Getenv("ALCHEMY_RPC_URL")
		if alchemyURL == "" {
			alchemyURL = "https://polygon-amoy.g.alchemy.com/v2/4-gxorN-H4MhqZWrskRQ-"
		}
		client, err = ethclient.Dial(alchemyURL)
		if err != nil {
			return fmt.Errorf("all RPC connections failed: %w", err)
		}
		log.Println("✅ Connected to Alchemy (fallback)")
		rpcURL = alchemyURL
		usingValidator = false
	} else {
		log.Println("✅ Connected to Polygon validator")
		usingValidator = true
	}

	// Verify connection with block number
	block, err := client.BlockNumber(context.Background())
	if err != nil {
		return fmt.Errorf("failed to get block number: %w", err)
	}
	log.Printf("📦 Latest Block: %d", block)

	// Get relayer address
	addressStr := os.Getenv("RELAYER_ADDRESS")
	if addressStr == "" {
		addressStr = "0x4C97260183BaD57AbF37f0119695f0607f2c3921" // Default
	}
	relayerAddress = common.HexToAddress(addressStr)
	log.Printf("📍 Relayer Address: %s", relayerAddress.Hex())

	// Check balance
	balance, err := client.BalanceAt(context.Background(), relayerAddress, nil)
	if err != nil {
		return fmt.Errorf("failed to get balance: %w", err)
	}

	fbalance := new(big.Float).SetInt(balance)
	ethValue := new(big.Float).Quo(fbalance, big.NewFloat(1e18))
	balancePOL, _ := ethValue.Float64()

	log.Printf("💰 Balance: %.4f POL", balancePOL)

	// Get gas price
	gasPrice, err := client.SuggestGasPrice(context.Background())
	if err == nil {
		gasPriceGwei := new(big.Float).Quo(
			new(big.Float).SetInt(gasPrice),
			big.NewFloat(1e9),
		)
		gasPriceVal, _ := gasPriceGwei.Float64()
		log.Printf("⛽ Gas Price: %.2f Gwei", gasPriceVal)
	}

	// Estimate transaction capacity
	if balancePOL > 0 {
		estimatedTx := int(balancePOL / 0.0002)
		log.Printf("🎫 Estimated Capacity: ~%d mints", estimatedTx)
	}

	if balancePOL < 0.01 {
		log.Println("⚠️  WARNING: Low balance! Please fund relayer wallet.")
		log.Println("   Fund address: " + relayerAddress.Hex())
	}

	return nil
}

func startHTTPServer() {
	http.HandleFunc("/health", handleHealth)
	http.HandleFunc("/mint", handleMint)
	http.HandleFunc("/balance", handleBalance)
	http.HandleFunc("/status", handleStatus)

	port := os.Getenv("RELAYER_PORT")
	if port == "" {
		port = "8082"
	}

	log.Printf("🌐 HTTP server starting on port %s", port)
	log.Printf("   Health: http://localhost:%s/health", port)
	log.Printf("   Balance: http://localhost:%s/balance", port)
	log.Printf("   Status: http://localhost:%s/status", port)
	
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("❌ HTTP server failed: %v", err)
	}
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	// Check validator connectivity
	start := time.Now()
	_, err := client.BlockNumber(context.Background())
	latency := time.Since(start).Milliseconds()
	
	if err != nil {
		w.WriteHeader(http.StatusServiceUnavailable)
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"status":"down","error":"%s"}`, err.Error())
		return
	}

	// Check balance
	balance, err := client.BalanceAt(context.Background(), relayerAddress, nil)
	if err != nil {
		w.WriteHeader(http.StatusServiceUnavailable)
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"status":"degraded","error":"%s"}`, err.Error())
		return
	}

	fbalance := new(big.Float).SetInt(balance)
	ethValue := new(big.Float).Quo(fbalance, big.NewFloat(1e18))
	balancePOL, _ := ethValue.Float64()

	status := "operational"
	if balancePOL < 0.01 {
		status = "critical"
	} else if balancePOL < 0.05 {
		status = "warning"
	}

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{"status":"%s","balance_pol":%.4f,"latency_ms":%d,"using_validator":%t}`, 
		status, balancePOL, latency, usingValidator)
}

func handleMint(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// TODO: Implement minting logic with Gas Policy
	// 1. Parse request (recipient, metadata)
	// 2. Generate UserOperation
	// 3. Request gas sponsorship from Alchemy
	// 4. Sign and submit transaction
	// 5. Return transaction hash

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprint(w, `{"status":"success","message":"Minting endpoint ready (implementation pending)"}`)
}

func handleBalance(w http.ResponseWriter, r *http.Request) {
	balance, err := client.BalanceAt(context.Background(), relayerAddress, nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	fbalance := new(big.Float).SetInt(balance)
	ethValue := new(big.Float).Quo(fbalance, big.NewFloat(1e18))
	balancePOL, _ := ethValue.Float64()

	// Get gas price
	gasPrice, _ := client.SuggestGasPrice(context.Background())
	gasPriceGwei := new(big.Float).Quo(
		new(big.Float).SetInt(gasPrice),
		big.NewFloat(1e9),
	)
	gasPriceVal, _ := gasPriceGwei.Float64()

	// Estimate capacity
	estimatedTx := 0
	if balancePOL > 0 {
		estimatedTx = int(balancePOL / 0.0002)
	}

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{"balance_pol":%.4f,"balance_usd":%.2f,"address":"%s","gas_price_gwei":%.2f,"estimated_tx":%d}`, 
		balancePOL, balancePOL*0.50, relayerAddress.Hex(), gasPriceVal, estimatedTx)
}

func handleStatus(w http.ResponseWriter, r *http.Request) {
	// Get block number
	block, err := client.BlockNumber(context.Background())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Get balance
	balance, _ := client.BalanceAt(context.Background(), relayerAddress, nil)
	fbalance := new(big.Float).SetInt(balance)
	ethValue := new(big.Float).Quo(fbalance, big.NewFloat(1e18))
	balancePOL, _ := ethValue.Float64()

	// Get gas price
	gasPrice, _ := client.SuggestGasPrice(context.Background())
	gasPriceGwei := new(big.Float).Quo(
		new(big.Float).SetInt(gasPrice),
		big.NewFloat(1e9),
	)
	gasPriceVal, _ := gasPriceGwei.Float64()

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{
		"rpc_url": "%s",
		"using_validator": %t,
		"latest_block": %d,
		"relayer_address": "%s",
		"balance_pol": %.4f,
		"gas_price_gwei": %.2f,
		"status": "operational"
	}`, rpcURL, usingValidator, block, relayerAddress.Hex(), balancePOL, gasPriceVal)
}

func monitorWallet() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		balance, err := client.BalanceAt(context.Background(), relayerAddress, nil)
		if err != nil {
			log.Printf("⚠️  Failed to check balance: %v", err)
			continue
		}

		fbalance := new(big.Float).SetInt(balance)
		ethValue := new(big.Float).Quo(fbalance, big.NewFloat(1e18))
		balancePOL, _ := ethValue.Float64()

		if balancePOL < 0.01 {
			log.Printf("🚨 CRITICAL: Balance low (%.4f POL) - Fund immediately!", balancePOL)
		} else if balancePOL < 0.05 {
			log.Printf("⚠️  WARNING: Balance low (%.4f POL)", balancePOL)
		} else {
			log.Printf("✅ Balance OK: %.4f POL", balancePOL)
		}
	}
}
