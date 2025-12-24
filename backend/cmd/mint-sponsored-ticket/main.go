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
	"time"

	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/joho/godotenv"
)

// UserOperation represents an ERC-4337 user operation for gasless transactions
type UserOperation struct {
	Sender               string `json:"sender"`
	Nonce                string `json:"nonce"`
	InitCode             string `json:"initCode"`
	CallData             string `json:"callData"`
	CallGasLimit         string `json:"callGasLimit"`
	VerificationGasLimit string `json:"verificationGasLimit"`
	PreVerificationGas   string `json:"preVerificationGas"`
	MaxFeePerGas         string `json:"maxFeePerGas"`
	MaxPriorityFeePerGas string `json:"maxPriorityFeePerGas"`
	PaymasterAndData     string `json:"paymasterAndData"`
	Signature            string `json:"signature"`
}

// GasAndPaymasterResponse from Alchemy Gas Manager
type GasAndPaymasterResponse struct {
	PaymasterAndData     string `json:"paymasterAndData"`
	PreVerificationGas   string `json:"preVerificationGas"`
	VerificationGasLimit string `json:"verificationGasLimit"`
	CallGasLimit         string `json:"callGasLimit"`
	MaxFeePerGas         string `json:"maxFeePerGas"`
	MaxPriorityFeePerGas string `json:"maxPriorityFeePerGas"`
}

func main() {
	// Load environment variables
	if err := godotenv.Load("/workspaces/africa-railways/.env"); err != nil {
		log.Printf("Warning: .env file not found")
	}

	fmt.Println("🎫 Africa Railways - Gasless Ticket Minting")
	fmt.Println("=" + string(make([]byte, 60)))
	fmt.Println("\n🔑 The Secret Sauce: Gas Policy ID")
	fmt.Println("This makes ticketing INVISIBLE to passengers!")
	fmt.Println("No POL needed - Alchemy pays ALL gas fees")

	// Get configuration
	apiKey := os.Getenv("ALCHEMY_API_KEY")
	policyID := os.Getenv("GAS_POLICY_ID")
	relayerAddress := os.Getenv("POLYGON_RELAYER_ADDRESS")

	if apiKey == "" || policyID == "" {
		log.Fatal("❌ ALCHEMY_API_KEY and GAS_POLICY_ID must be set")
	}

	fmt.Println("\n📋 Configuration:")
	fmt.Println("------------------")
	fmt.Printf("✅ Gas Policy ID: %s\n", policyID)
	fmt.Printf("✅ Relayer Address: %s\n", relayerAddress)
	fmt.Printf("✅ API Key: %s...\n", apiKey[:10])

	// Connect to network
	rpcURL := fmt.Sprintf("https://polygon-amoy.g.alchemy.com/v2/%s", apiKey)
	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}
	defer client.Close()

	chainID, _ := client.ChainID(context.Background())
	fmt.Printf("\n🔗 Connected to Chain ID: %s\n", chainID.String())

	// Example ticket details
	passengerAddress := "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"
	contractAddress := "0x0000000000000000000000000000000000000000" // Replace with deployed contract
	tokenURI := "ipfs://QmExampleTicketMetadata"

	fmt.Println("\n🎫 Ticket Details:")
	fmt.Println("------------------")
	fmt.Printf("Passenger: %s\n", passengerAddress)
	fmt.Printf("Contract: %s\n", contractAddress)
	fmt.Printf("Metadata: %s\n", tokenURI)

	// Step 1: Create UserOperation
	fmt.Println("\n📝 Step 1: Creating UserOperation...")
	userOp := createUserOperation(relayerAddress, contractAddress, passengerAddress, tokenURI)
	fmt.Println("✅ UserOperation created")

	// Step 2: Request Gas & Paymaster Data from Alchemy
	fmt.Println("\n🛰️  Step 2: Requesting Gas Sponsorship from Alchemy...")
	fmt.Printf("   Attaching Policy ID: %s\n", policyID)
	
	gasData, err := requestGasAndPaymasterData(rpcURL, policyID, userOp)
	if err != nil {
		log.Fatalf("❌ Failed to get gas sponsorship: %v", err)
	}

	fmt.Println("✅ Gas Sponsorship APPROVED!")
	fmt.Printf("   Paymaster: %s...\n", gasData.PaymasterAndData[:20])

	// Step 3: Update UserOperation with sponsored gas data
	fmt.Println("\n⚙️  Step 3: Updating UserOperation with Paymaster Data...")
	userOp.PaymasterAndData = gasData.PaymasterAndData
	userOp.CallGasLimit = gasData.CallGasLimit
	userOp.VerificationGasLimit = gasData.VerificationGasLimit
	userOp.PreVerificationGas = gasData.PreVerificationGas
	userOp.MaxFeePerGas = gasData.MaxFeePerGas
	userOp.MaxPriorityFeePerGas = gasData.MaxPriorityFeePerGas
	fmt.Println("✅ UserOperation updated with sponsored gas")

	// Step 4: Display cost breakdown
	fmt.Println("\n💰 Cost Breakdown:")
	fmt.Println("------------------")
	displayCostBreakdown(gasData)

	// Step 5: Send UserOperation (commented for safety)
	fmt.Println("\n🚀 Step 5: Sending Gasless Transaction...")
	fmt.Println("⚠️  Transaction sending is disabled for safety")
	fmt.Println("Uncomment the code below to enable gasless minting")

	/*
	txHash, err := sendUserOperation(rpcURL, userOp)
	if err != nil {
		log.Fatalf("Failed to send transaction: %v", err)
	}

	fmt.Printf("✅ Transaction sent! Hash: %s\n", txHash)
	fmt.Printf("🔍 View on PolygonScan: https://amoy.polygonscan.com/tx/%s\n", txHash)
	*/

	// Summary
	fmt.Println("\n" + string(make([]byte, 60)))
	fmt.Println("🎉 Gasless Minting System Ready!")
	fmt.Println("\n✨ What Just Happened:")
	fmt.Println("  1. Created UserOperation (Account Abstraction)")
	fmt.Println("  2. Attached Gas Policy ID to transaction")
	fmt.Println("  3. Alchemy recognized your policy")
	fmt.Println("  4. Alchemy agreed to pay ALL gas fees")
	fmt.Println("  5. Passenger pays: 0 POL ✅")
	fmt.Println("  6. Your relayer pays: 0 POL ✅")
	fmt.Println("  7. Alchemy pays: ALL gas fees ✅")
	fmt.Println("\n🚀 This is the SECRET SAUCE for invisible ticketing!")
	fmt.Println(string(make([]byte, 60)))
}

// createUserOperation creates a UserOperation for minting
func createUserOperation(sender, contract, passenger, tokenURI string) *UserOperation {
	// In production, encode the actual mint function call
	// For now, using placeholder data
	callData := encodeMintCall(passenger, tokenURI)

	return &UserOperation{
		Sender:               sender,
		Nonce:                "0x0", // Should be fetched from contract
		InitCode:             "0x",
		CallData:             callData,
		CallGasLimit:         "0x0", // Will be filled by Alchemy
		VerificationGasLimit: "0x0", // Will be filled by Alchemy
		PreVerificationGas:   "0x0", // Will be filled by Alchemy
		MaxFeePerGas:         "0x0", // Will be filled by Alchemy
		MaxPriorityFeePerGas: "0x0", // Will be filled by Alchemy
		PaymasterAndData:     "0x",  // Will be filled by Alchemy
		Signature:            "0x",  // Will be signed later
	}
}

// encodeMintCall encodes the mint function call
func encodeMintCall(to, tokenURI string) string {
	// Placeholder - in production, use proper ABI encoding
	// Example: safeMint(address to, string memory uri)
	return "0x" // Empty for now
}

// requestGasAndPaymasterData requests gas sponsorship from Alchemy
func requestGasAndPaymasterData(rpcURL, policyID string, userOp *UserOperation) (*GasAndPaymasterResponse, error) {
	// Generate dummy signature (required by Alchemy)
	// This is a placeholder signature that will be replaced with real signature later
	dummySignature := "0x" + string(make([]byte, 130)) // 65 bytes = 130 hex chars
	for i := range dummySignature[2:] {
		dummySignature = dummySignature[:2+i] + "0" + dummySignature[2+i+1:]
	}
	
	// Prepare JSON-RPC request
	request := map[string]interface{}{
		"jsonrpc": "2.0",
		"id":      1,
		"method":  "alchemy_requestGasAndPaymasterAndData",
		"params": []interface{}{
			map[string]interface{}{
				"policyId":       policyID,
				"entryPoint":     "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", // ERC-4337 EntryPoint
				"dummySignature": dummySignature,
				"userOperation":  userOp,
			},
		},
	}

	jsonData, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}

	// Make HTTP request
	httpReq, err := http.NewRequest("POST", rpcURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// Parse response
	var result struct {
		Result *GasAndPaymasterResponse `json:"result"`
		Error  *struct {
			Code    int    `json:"code"`
			Message string `json:"message"`
		} `json:"error"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if result.Error != nil {
		return nil, fmt.Errorf("RPC error %d: %s", result.Error.Code, result.Error.Message)
	}

	if result.Result == nil {
		return nil, fmt.Errorf("no result returned from Alchemy")
	}

	return result.Result, nil
}

// sendUserOperation sends the UserOperation to the network
func sendUserOperation(rpcURL string, userOp *UserOperation) (string, error) {
	request := map[string]interface{}{
		"jsonrpc": "2.0",
		"id":      1,
		"method":  "eth_sendUserOperation",
		"params": []interface{}{
			userOp,
			"0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", // EntryPoint
		},
	}

	jsonData, _ := json.Marshal(request)

	httpReq, _ := http.NewRequest("POST", rpcURL, bytes.NewBuffer(jsonData))
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, _ := client.Do(httpReq)
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var result struct {
		Result string `json:"result"`
	}
	json.Unmarshal(body, &result)

	return result.Result, nil
}

// displayCostBreakdown shows the cost breakdown
func displayCostBreakdown(gasData *GasAndPaymasterResponse) {
	// Parse gas values
	callGas := hexToBigInt(gasData.CallGasLimit)
	verificationGas := hexToBigInt(gasData.VerificationGasLimit)
	preVerificationGas := hexToBigInt(gasData.PreVerificationGas)
	maxFeePerGas := hexToBigInt(gasData.MaxFeePerGas)

	// Calculate total gas
	totalGas := new(big.Int).Add(callGas, verificationGas)
	totalGas.Add(totalGas, preVerificationGas)

	// Calculate cost
	totalCost := new(big.Int).Mul(totalGas, maxFeePerGas)
	costPOL := new(big.Float).Quo(
		new(big.Float).SetInt(totalCost),
		big.NewFloat(1e18),
	)

	fmt.Printf("Gas Limit: %s\n", totalGas.String())
	fmt.Printf("Gas Price: %s Gwei\n", weiToGwei(maxFeePerGas))
	fmt.Printf("Total Cost: %s POL\n", costPOL.Text('f', 6))
	fmt.Println("\n💸 Who Pays:")
	fmt.Println("   Passenger: 0 POL ✅")
	fmt.Println("   Relayer: 0 POL ✅")
	fmt.Printf("   Alchemy Policy: %s POL ✅\n", costPOL.Text('f', 6))
	fmt.Printf("\n💰 Savings: %s POL per ticket!\n", costPOL.Text('f', 6))
}

// hexToBigInt converts hex string to big.Int
func hexToBigInt(hex string) *big.Int {
	if hex == "" || hex == "0x" {
		return big.NewInt(0)
	}
	n := new(big.Int)
	n.SetString(hex[2:], 16)
	return n
}

// weiToGwei converts Wei to Gwei
func weiToGwei(wei *big.Int) string {
	gwei := new(big.Float).Quo(
		new(big.Float).SetInt(wei),
		big.NewFloat(1e9),
	)
	return gwei.Text('f', 2)
}
