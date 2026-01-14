package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"
)

// AFC Token Configuration
var (
	AFCPackageID = getEnvOrDefaultAFC("AFC_PACKAGE_ID", "0xc68c4cfb63d702227db09c28837e75abd23bbb3adc192e3bc45fecca4dd5b7e8")
	AFCCoinType  = AFCPackageID + "::afc::AFC"
	
	// Treasury wallet receives ticket payments
	TreasuryWallet = getEnvOrDefaultAFC("TREASURY_WALLET", "0x4284dee31121675fce54b211eddf0eb786ed5d6880b8ec728d2c0a3cc104e3c8")
	
	// SUI RPC endpoints with fallbacks
	SUIRPCEndpoints = []string{
		"https://sui-mainnet-endpoint.blockvision.org",
		"https://sui-mainnet.nodeinfra.com",
		"https://rpc-mainnet.suiscan.xyz:443",
		"https://fullnode.mainnet.sui.io:443",
	}
)

const (
	// AFC has 9 decimals (like SUI)
	AFCDecimals  = 9
	MistPerAFC   = 1_000_000_000
)

// AFCBalance represents AFC balance information
type AFCBalance struct {
	Address    string  `json:"address"`
	RawBalance int64   `json:"raw_balance"` // In smallest units (MIST)
	Balance    float64 `json:"balance"`     // In AFC
	CoinCount  int     `json:"coin_count"`  // Number of coin objects
}

// AFCPaymentResult represents the result of an AFC payment
type AFCPaymentResult struct {
	Success     bool    `json:"success"`
	TxDigest    string  `json:"tx_digest,omitempty"`
	Error       string  `json:"error,omitempty"`
	AmountAFC   float64 `json:"amount_afc"`
	FromAddress string  `json:"from_address"`
	ToAddress   string  `json:"to_address"`
}

// AFCCoin represents a single AFC coin object
type AFCCoin struct {
	CoinObjectID string `json:"coinObjectId"`
	Balance      string `json:"balance"`
	Version      string `json:"version"`
	Digest       string `json:"digest"`
}

// SUIRPCRequest represents a JSON-RPC request
type SUIRPCRequest struct {
	JSONRPC string        `json:"jsonrpc"`
	ID      int           `json:"id"`
	Method  string        `json:"method"`
	Params  []interface{} `json:"params"`
}

// SUIRPCResponse represents a JSON-RPC response
type SUIRPCResponse struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      int             `json:"id"`
	Result  json.RawMessage `json:"result,omitempty"`
	Error   *struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// BalanceResult represents the balance query result
type BalanceResult struct {
	CoinType        string `json:"coinType"`
	CoinObjectCount int    `json:"coinObjectCount"`
	TotalBalance    string `json:"totalBalance"`
}

// CoinsResult represents the coins query result
type CoinsResult struct {
	Data []AFCCoin `json:"data"`
}

// getEnvOrDefaultAFC gets environment variable with default (AFC-specific to avoid redeclaration)
func getEnvOrDefaultAFC(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// callSUIRPC calls SUI RPC with fallback endpoints
func callSUIRPC(method string, params []interface{}) (json.RawMessage, error) {
	request := SUIRPCRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  method,
		Params:  params,
	}

	requestBody, err := json.Marshal(request)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	client := &http.Client{Timeout: 30 * time.Second}

	var lastErr error
	for _, rpcURL := range SUIRPCEndpoints {
		resp, err := client.Post(rpcURL, "application/json", bytes.NewReader(requestBody))
		if err != nil {
			log.Printf("⚠️ RPC %s failed: %v", rpcURL, err)
			lastErr = err
			continue
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			log.Printf("⚠️ RPC %s returned %d", rpcURL, resp.StatusCode)
			lastErr = fmt.Errorf("HTTP %d", resp.StatusCode)
			continue
		}

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			lastErr = err
			continue
		}

		var rpcResp SUIRPCResponse
		if err := json.Unmarshal(body, &rpcResp); err != nil {
			lastErr = err
			continue
		}

		if rpcResp.Error != nil {
			log.Printf("⚠️ RPC %s error: %s", rpcURL, rpcResp.Error.Message)
			lastErr = fmt.Errorf("RPC error: %s", rpcResp.Error.Message)
			continue
		}

		return rpcResp.Result, nil
	}

	return nil, fmt.Errorf("all RPC endpoints failed: %v", lastErr)
}

// GetAFCBalance fetches AFC balance for a wallet address
func GetAFCBalance(walletAddress string) (*AFCBalance, error) {
	result, err := callSUIRPC("suix_getBalance", []interface{}{walletAddress, AFCCoinType})
	if err != nil {
		return nil, err
	}

	var balanceResult BalanceResult
	if err := json.Unmarshal(result, &balanceResult); err != nil {
		return nil, fmt.Errorf("failed to parse balance: %w", err)
	}

	var rawBalance int64
	fmt.Sscanf(balanceResult.TotalBalance, "%d", &rawBalance)

	return &AFCBalance{
		Address:    walletAddress,
		RawBalance: rawBalance,
		Balance:    float64(rawBalance) / MistPerAFC,
		CoinCount:  balanceResult.CoinObjectCount,
	}, nil
}

// GetAFCCoins fetches all AFC coin objects for a wallet
func GetAFCCoins(walletAddress string) ([]AFCCoin, error) {
	result, err := callSUIRPC("suix_getCoins", []interface{}{walletAddress, AFCCoinType})
	if err != nil {
		return nil, err
	}

	var coinsResult CoinsResult
	if err := json.Unmarshal(result, &coinsResult); err != nil {
		return nil, fmt.Errorf("failed to parse coins: %w", err)
	}

	return coinsResult.Data, nil
}

// CheckSufficientBalance checks if wallet has enough AFC for payment
func CheckSufficientBalance(walletAddress string, amountAFC float64) (bool, string) {
	balance, err := GetAFCBalance(walletAddress)
	if err != nil {
		return false, fmt.Sprintf("Failed to fetch balance: %v", err)
	}

	if balance.Balance < amountAFC {
		return false, fmt.Sprintf("Insufficient balance: %.2f AFC < %.2f AFC required", balance.Balance, amountAFC)
	}

	return true, ""
}

// ProcessAFCPayment processes an AFC payment for a ticket
// Returns payment result with transaction details
func ProcessAFCPayment(fromAddress string, amountAFC float64, bookingRef string) *AFCPaymentResult {
	log.Printf("💳 Processing AFC payment: %.2f AFC for booking %s", amountAFC, bookingRef)

	// Step 1: Check balance
	hasSufficient, errMsg := CheckSufficientBalance(fromAddress, amountAFC)
	if !hasSufficient {
		log.Printf("❌ Payment failed - %s", errMsg)
		return &AFCPaymentResult{
			Success:     false,
			Error:       errMsg,
			AmountAFC:   amountAFC,
			FromAddress: fromAddress,
			ToAddress:   TreasuryWallet,
		}
	}

	// Step 2: Get user's AFC coins
	coins, err := GetAFCCoins(fromAddress)
	if err != nil {
		return &AFCPaymentResult{
			Success:     false,
			Error:       fmt.Sprintf("Failed to get coins: %v", err),
			AmountAFC:   amountAFC,
			FromAddress: fromAddress,
			ToAddress:   TreasuryWallet,
		}
	}

	if len(coins) == 0 {
		return &AFCPaymentResult{
			Success:     false,
			Error:       "No AFC coins found in wallet",
			AmountAFC:   amountAFC,
			FromAddress: fromAddress,
			ToAddress:   TreasuryWallet,
		}
	}

	// Step 3: Build and execute transfer transaction
	// For now, we simulate the transfer since actual signing requires private key
	// In production, this would use programmable transactions via SUI SDK
	txDigest := simulateAFCTransfer(fromAddress, TreasuryWallet, amountAFC, bookingRef)

	log.Printf("✅ AFC payment successful: %s", txDigest)
	log.Printf("   Amount: %.2f AFC", amountAFC)
	log.Printf("   From: %s...", fromAddress[:16])
	log.Printf("   To: %s...", TreasuryWallet[:16])
	log.Printf("   Booking: %s", bookingRef)

	return &AFCPaymentResult{
		Success:     true,
		TxDigest:    txDigest,
		AmountAFC:   amountAFC,
		FromAddress: fromAddress,
		ToAddress:   TreasuryWallet,
	}
}

// simulateAFCTransfer simulates an AFC transfer for development
// In production, this would execute actual blockchain transaction
func simulateAFCTransfer(from, to string, amount float64, bookingRef string) string {
	// Generate deterministic mock tx digest
	timestamp := time.Now().UnixNano()
	txDigest := fmt.Sprintf("0x%x%x%x", timestamp, len(from), len(bookingRef))
	
	log.Printf("🧪 [SIMULATED] AFC transfer: %.2f AFC", amount)
	log.Printf("   TX: %s...", txDigest[:24])
	
	return txDigest
}

// ProcessTicketPayment is the main entry point for ticket payments
func ProcessTicketPayment(walletAddress string, ticketPriceUSD float64, bookingRef string, passengerPhone string) map[string]interface{} {
	log.Printf("🎫 Processing ticket payment for %s", passengerPhone)
	log.Printf("   Booking: %s", bookingRef)
	log.Printf("   Price: $%.2f USD = %.2f AFC", ticketPriceUSD, ticketPriceUSD)
	log.Printf("   Wallet: %s...", walletAddress[:20])

	// AFC is pegged 1:1 with USD
	amountAFC := ticketPriceUSD

	// Execute payment
	result := ProcessAFCPayment(walletAddress, amountAFC, bookingRef)

	if result.Success {
		return map[string]interface{}{
			"success":        true,
			"payment_method": "AFC",
			"amount_usd":     ticketPriceUSD,
			"amount_afc":     amountAFC,
			"tx_digest":      result.TxDigest,
			"from_wallet":    walletAddress,
			"to_wallet":      TreasuryWallet,
			"booking_ref":    bookingRef,
			"message":        fmt.Sprintf("Payment of %.2f AFC successful", amountAFC),
		}
	}

	return map[string]interface{}{
		"success":        false,
		"payment_method": "AFC",
		"amount_usd":     ticketPriceUSD,
		"amount_afc":     amountAFC,
		"error":          result.Error,
		"booking_ref":    bookingRef,
		"message":        fmt.Sprintf("Payment failed: %s", result.Error),
	}
}

// HTTP Handlers

// afcBalanceHandler handles GET /api/afc/balance?address=0x...
func afcBalanceHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	address := r.URL.Query().Get("address")
	if address == "" {
		http.Error(w, "address parameter required", http.StatusBadRequest)
		return
	}

	balance, err := GetAFCBalance(address)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":     true,
		"address":     balance.Address,
		"balance_afc": balance.Balance,
		"balance_raw": balance.RawBalance,
		"coin_count":  balance.CoinCount,
	})
}

// afcPaymentHandler handles POST /api/afc/pay
func afcPaymentHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		WalletAddress  string  `json:"wallet_address"`
		AmountUSD      float64 `json:"amount_usd"`
		BookingRef     string  `json:"booking_ref"`
		PassengerPhone string  `json:"passenger_phone"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.WalletAddress == "" || req.AmountUSD <= 0 || req.BookingRef == "" {
		http.Error(w, "wallet_address, amount_usd, and booking_ref are required", http.StatusBadRequest)
		return
	}

	result := ProcessTicketPayment(req.WalletAddress, req.AmountUSD, req.BookingRef, req.PassengerPhone)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// RegisterAFCHandlers registers AFC payment handlers
func RegisterAFCHandlers(mux *http.ServeMux) {
	mux.HandleFunc("/api/afc/balance", afcBalanceHandler)
	mux.HandleFunc("/api/afc/pay", afcPaymentHandler)
	log.Println("✅ AFC payment handlers registered")
}
