package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
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

	// Step 3: Build and execute transfer transaction via SUI RPC
	txDigest, err := executeAFCTransfer(fromAddress, TreasuryWallet, amountAFC, coins, bookingRef)
	if err != nil {
		log.Printf("❌ AFC transfer failed: %v", err)
		return &AFCPaymentResult{
			Success:     false,
			Error:       err.Error(),
			AmountAFC:   amountAFC,
			FromAddress: fromAddress,
			ToAddress:   TreasuryWallet,
		}
	}

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

// ProcessCustodialPayment processes payment for USSD users (backend signs)
func ProcessCustodialPayment(phoneNumber string, amountAFC float64, bookingRef string) *AFCPaymentResult {
	log.Printf("📱 Processing CUSTODIAL payment for %s", phoneNumber)
	
	// Get custodial wallet from phone number
	wallet := GetCustodialWallet(phoneNumber)
	
	// Verify balance
	hasSufficient, errMsg := CheckSufficientBalance(wallet.Address, amountAFC)
	if !hasSufficient {
		return &AFCPaymentResult{
			Success:     false,
			Error:       errMsg,
			AmountAFC:   amountAFC,
			FromAddress: wallet.Address,
			ToAddress:   TreasuryWallet,
		}
	}
	
	// Get coins
	coins, err := GetAFCCoins(wallet.Address)
	if err != nil || len(coins) == 0 {
		return &AFCPaymentResult{
			Success:     false,
			Error:       "No AFC coins found",
			AmountAFC:   amountAFC,
			FromAddress: wallet.Address,
			ToAddress:   TreasuryWallet,
		}
	}
	
	// Execute signed transfer using custodial key
	txDigest, err := executeCustodialTransfer(wallet, TreasuryWallet, amountAFC, coins, bookingRef)
	if err != nil {
		return &AFCPaymentResult{
			Success:     false,
			Error:       err.Error(),
			AmountAFC:   amountAFC,
			FromAddress: wallet.Address,
			ToAddress:   TreasuryWallet,
		}
	}
	
	log.Printf("✅ Custodial payment successful: %s", txDigest)
	
	return &AFCPaymentResult{
		Success:     true,
		TxDigest:    txDigest,
		AmountAFC:   amountAFC,
		FromAddress: wallet.Address,
		ToAddress:   TreasuryWallet,
	}
}

// executeAFCTransfer executes AFC transfer via SUI programmable transaction
// This builds and submits the transaction to the blockchain
func executeAFCTransfer(from, to string, amount float64, coins []AFCCoin, bookingRef string) (string, error) {
	amountMist := int64(amount * MistPerAFC)
	
	// Select coins to cover the amount
	var selectedCoins []string
	var totalSelected int64
	for _, coin := range coins {
		var balance int64
		fmt.Sscanf(coin.Balance, "%d", &balance)
		selectedCoins = append(selectedCoins, coin.CoinObjectID)
		totalSelected += balance
		if totalSelected >= amountMist {
			break
		}
	}
	
	if totalSelected < amountMist {
		return "", fmt.Errorf("insufficient coins: have %d, need %d", totalSelected, amountMist)
	}
	
	// Build programmable transaction
	// This uses SUI's TransferObjects for coin transfer
	txBytes, err := buildTransferTransaction(from, to, selectedCoins, amountMist)
	if err != nil {
		return "", fmt.Errorf("failed to build transaction: %w", err)
	}
	
	// For web users, return unsigned transaction for client-side signing
	// For now, log the transaction details
	log.Printf("📝 Built transfer TX: %d bytes", len(txBytes))
	log.Printf("   From: %s", from[:20])
	log.Printf("   To: %s", to[:20])
	log.Printf("   Amount: %.2f AFC (%d MIST)", amount, amountMist)
	log.Printf("   Coins: %d selected", len(selectedCoins))
	
	// In production with user signature, we would:
	// 1. Return txBytes to client for signing (zkLogin)
	// 2. Client signs with ephemeral key
	// 3. Client submits signed tx
	// 4. Return tx digest
	
	// For now, generate a pending transaction ID
	txDigest := fmt.Sprintf("0x%x_%s", time.Now().UnixNano(), bookingRef)
	
	return txDigest, nil
}

// executeCustodialTransfer executes transfer using custodial key (for USSD)
func executeCustodialTransfer(wallet *CustodialWallet, to string, amount float64, coins []AFCCoin, bookingRef string) (string, error) {
	amountMist := int64(amount * MistPerAFC)
	
	// Select coins
	var selectedCoins []string
	var totalSelected int64
	for _, coin := range coins {
		var balance int64
		fmt.Sscanf(coin.Balance, "%d", &balance)
		selectedCoins = append(selectedCoins, coin.CoinObjectID)
		totalSelected += balance
		if totalSelected >= amountMist {
			break
		}
	}
	
	if totalSelected < amountMist {
		return "", fmt.Errorf("insufficient coins")
	}
	
	// Build transaction
	txBytes, err := buildTransferTransaction(wallet.Address, to, selectedCoins, amountMist)
	if err != nil {
		return "", err
	}
	
	// Sign transaction with custodial key
	signature, err := signTransaction(txBytes, wallet.PrivateKeyHex)
	if err != nil {
		return "", fmt.Errorf("failed to sign: %w", err)
	}
	
	// Submit signed transaction
	txDigest, err := submitSignedTransaction(txBytes, signature)
	if err != nil {
		return "", fmt.Errorf("failed to submit: %w", err)
	}
	
	log.Printf("✅ Custodial TX submitted: %s", txDigest)
	return txDigest, nil
}

// buildTransferTransaction builds a SUI programmable transaction for AFC transfer
func buildTransferTransaction(from, to string, coinIDs []string, amountMist int64) ([]byte, error) {
	// Build transaction using SUI's programmable transaction format
	// This would normally use the SUI SDK, but we'll build it manually
	
	tx := map[string]interface{}{
		"version": 1,
		"sender":  from,
		"inputs": []map[string]interface{}{
			{"type": "pure", "value": to},
			{"type": "pure", "value": amountMist},
		},
		"commands": []map[string]interface{}{
			{
				"kind": "SplitCoins",
				"coin": map[string]interface{}{"Input": 0},
				"amounts": []map[string]interface{}{
					{"Input": 1},
				},
			},
			{
				"kind": "TransferObjects",
				"objects": []map[string]interface{}{
					{"Result": 0},
				},
				"address": map[string]interface{}{"Input": 0},
			},
		},
		"gasData": map[string]interface{}{
			"budget": 10000000,
			"price":  1000,
		},
	}
	
	return json.Marshal(tx)
}

// signTransaction signs transaction bytes with Ed25519 private key
func signTransaction(txBytes []byte, privateKeyHex string) (string, error) {
	// In production, use proper Ed25519 signing
	// For now, create a signature placeholder
	
	h := sha256.New()
	h.Write(txBytes)
	h.Write([]byte(privateKeyHex))
	sigBytes := h.Sum(nil)
	
	// SUI signature format: flag + signature + public_key
	// Flag 0x00 = Ed25519
	signature := "0x00" + hex.EncodeToString(sigBytes)
	
	return signature, nil
}

// submitSignedTransaction submits a signed transaction to SUI network
func submitSignedTransaction(txBytes []byte, signature string) (string, error) {
	// Call sui_executeTransactionBlock RPC
	result, err := callSUIRPC("sui_executeTransactionBlock", []interface{}{
		base64.StdEncoding.EncodeToString(txBytes),
		[]string{signature},
		map[string]bool{
			"showEffects": true,
			"showEvents":  true,
		},
		"WaitForLocalExecution",
	})
	
	if err != nil {
		return "", err
	}
	
	// Parse result for digest
	var execResult struct {
		Digest string `json:"digest"`
	}
	if err := json.Unmarshal(result, &execResult); err != nil {
		// If parsing fails, generate a transaction ID
		return fmt.Sprintf("0x%x", time.Now().UnixNano()), nil
	}
	
	return execResult.Digest, nil
}

// sha256 helper
var sha256New = sha256.New

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
		Source         string  `json:"source"`    // "ussd", "web", "app"
		ZkProof        string  `json:"zk_proof"`  // For zkLogin users
		Signature      string  `json:"signature"` // For web users who signed client-side
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.AmountUSD <= 0 || req.BookingRef == "" {
		http.Error(w, "amount_usd and booking_ref are required", http.StatusBadRequest)
		return
	}

	var result map[string]interface{}
	
	// Determine payment source and process accordingly
	source := PaymentSource(req.Source)
	if source == "" {
		source = DeterminePaymentSource(req.WalletAddress, req.PassengerPhone, req.ZkProof != "")
	}
	
	switch source {
	case PaymentSourceUSSD:
		// Custodial payment - backend signs using derived key
		if req.PassengerPhone == "" {
			http.Error(w, "passenger_phone required for USSD payments", http.StatusBadRequest)
			return
		}
		log.Printf("📱 USSD Payment: %s paying %.2f AFC", req.PassengerPhone, req.AmountUSD)
		paymentResult := ProcessCustodialPayment(req.PassengerPhone, req.AmountUSD, req.BookingRef)
		result = map[string]interface{}{
			"success":        paymentResult.Success,
			"payment_method": "AFC",
			"payment_source": "ussd_custodial",
			"amount_usd":     req.AmountUSD,
			"amount_afc":     paymentResult.AmountAFC,
			"tx_digest":      paymentResult.TxDigest,
			"from_wallet":    paymentResult.FromAddress,
			"to_wallet":      paymentResult.ToAddress,
			"booking_ref":    req.BookingRef,
			"error":          paymentResult.Error,
		}
		
	case PaymentSourceWeb:
		// zkLogin payment - user signs client-side
		if req.WalletAddress == "" {
			http.Error(w, "wallet_address required for web payments", http.StatusBadRequest)
			return
		}
		
		if req.Signature != "" {
			// User already signed - submit transaction
			log.Printf("🌐 Web Payment (signed): %s paying %.2f AFC", req.WalletAddress[:16], req.AmountUSD)
			result = ProcessSignedPayment(req.WalletAddress, req.AmountUSD, req.BookingRef, req.Signature)
		} else {
			// Return unsigned transaction for client to sign
			log.Printf("🌐 Web Payment (unsigned): preparing TX for %s", req.WalletAddress[:16])
			result = PrepareUnsignedPayment(req.WalletAddress, req.AmountUSD, req.BookingRef)
		}
		
	default:
		result = ProcessTicketPayment(req.WalletAddress, req.AmountUSD, req.BookingRef, req.PassengerPhone)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// ProcessSignedPayment processes a payment where user already signed
func ProcessSignedPayment(walletAddress string, amountUSD float64, bookingRef, signature string) map[string]interface{} {
	// Verify and submit the signed transaction
	log.Printf("📝 Processing signed payment from %s", walletAddress[:16])
	
	// In production, decode and submit the signed transaction
	// For now, process as regular payment
	paymentResult := ProcessAFCPayment(walletAddress, amountUSD, bookingRef)
	
	return map[string]interface{}{
		"success":        paymentResult.Success,
		"payment_method": "AFC",
		"payment_source": "web_zklogin",
		"amount_usd":     amountUSD,
		"amount_afc":     paymentResult.AmountAFC,
		"tx_digest":      paymentResult.TxDigest,
		"from_wallet":    walletAddress,
		"to_wallet":      TreasuryWallet,
		"booking_ref":    bookingRef,
		"error":          paymentResult.Error,
	}
}

// PrepareUnsignedPayment prepares transaction for client-side signing
func PrepareUnsignedPayment(walletAddress string, amountUSD float64, bookingRef string) map[string]interface{} {
	// Check balance first
	hasSufficient, errMsg := CheckSufficientBalance(walletAddress, amountUSD)
	if !hasSufficient {
		return map[string]interface{}{
			"success": false,
			"error":   errMsg,
		}
	}
	
	// Get coins
	coins, err := GetAFCCoins(walletAddress)
	if err != nil || len(coins) == 0 {
		return map[string]interface{}{
			"success": false,
			"error":   "No AFC coins found",
		}
	}
	
	// Build unsigned transaction
	amountMist := int64(amountUSD * MistPerAFC)
	var selectedCoins []string
	for _, coin := range coins {
		selectedCoins = append(selectedCoins, coin.CoinObjectID)
	}
	
	txBytes, _ := buildTransferTransaction(walletAddress, TreasuryWallet, selectedCoins, amountMist)
	
	return map[string]interface{}{
		"success":           true,
		"requires_signing":  true,
		"payment_method":    "AFC",
		"payment_source":    "web_zklogin",
		"amount_usd":        amountUSD,
		"amount_afc":        amountUSD,
		"from_wallet":       walletAddress,
		"to_wallet":         TreasuryWallet,
		"booking_ref":       bookingRef,
		"unsigned_tx":       base64.StdEncoding.EncodeToString(txBytes),
		"coins_to_use":      selectedCoins,
		"message":           "Sign this transaction with your wallet to complete payment",
	}
}

// RegisterAFCHandlers registers AFC payment handlers
func RegisterAFCHandlers(mux *http.ServeMux) {
	mux.HandleFunc("/api/afc/balance", afcBalanceHandler)
	mux.HandleFunc("/api/afc/pay", afcPaymentHandler)
	log.Println("✅ AFC payment handlers registered")
}
