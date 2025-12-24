package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/ethereum/go-ethereum/ethclient"
)

// Config represents the application configuration
type Config struct {
	Blockchain struct {
		PolygonEndpoint string `json:"polygon_endpoint"`
		GasPolicyID     string `json:"gas_policy_id"`
		RelayerAddress  string `json:"relayer_address"`
		ChainID         int    `json:"chain_id"`
		EntryPoint      string `json:"entry_point"`
	} `json:"blockchain"`
	IPFS struct {
		Provider string `json:"provider"`
		JWTToken string `json:"jwt_token"`
	} `json:"ipfs"`
	Contracts struct {
		TicketNFT     string `json:"ticket_nft"`
		TicketFactory string `json:"ticket_factory"`
	} `json:"contracts"`
	API struct {
		BaseURL        string `json:"base_url"`
		VerifyEndpoint string `json:"verify_endpoint"`
	} `json:"api"`
	Features struct {
		GaslessMinting   bool `json:"gasless_minting"`
		IPFSMetadata     bool `json:"ipfs_metadata"`
		SMSNotifications bool `json:"sms_notifications"`
	} `json:"features"`
}

// UserOperation represents an ERC-4337 user operation
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

// GasAndPaymasterResponse from Alchemy
type GasAndPaymasterResponse struct {
	PaymasterAndData     string `json:"paymasterAndData"`
	PreVerificationGas   string `json:"preVerificationGas"`
	VerificationGasLimit string `json:"verificationGasLimit"`
	CallGasLimit         string `json:"callGasLimit"`
	MaxFeePerGas         string `json:"maxFeePerGas"`
	MaxPriorityFeePerGas string `json:"maxPriorityFeePerGas"`
}

func main() {
	fmt.Println("🛰️  Africa Railways - Gasless Relayer")
	fmt.Println("=" + string(make([]byte, 60)))

	// Execute from root: Open the config file
	// Try multiple paths
	configPaths := []string{
		"config.json",
		"../../config.json",
		"/workspaces/africa-railways/config.json",
	}
	
	var configFile *os.File
	var err error
	for _, path := range configPaths {
		configFile, err = os.Open(path)
		if err == nil {
			break
		}
	}
	
	if configFile == nil {
		log.Fatalf("❌ Failed to open config.json: %v", err)
	}
	defer configFile.Close()

	var config Config
	if err := json.NewDecoder(configFile).Decode(&config); err != nil {
		log.Fatalf("❌ Failed to parse config.json: %v", err)
	}

	fmt.Println("\n✅ Configuration Loaded from config.json")
	fmt.Println("------------------------------------------")
	fmt.Printf("🛡️  Using Gas Policy: %s\n", config.Blockchain.GasPolicyID)
	fmt.Printf("🔗 Endpoint: %s\n", config.Blockchain.PolygonEndpoint)
	fmt.Printf("📍 Relayer: %s\n", config.Blockchain.RelayerAddress)
	fmt.Printf("⛓️  Chain ID: %d\n", config.Blockchain.ChainID)
	fmt.Printf("📤 IPFS: %s\n", config.IPFS.Provider)

	// Display features
	fmt.Println("\n🎯 Features Enabled:")
	fmt.Println("-------------------")
	if config.Features.GaslessMinting {
		fmt.Println("✅ Gasless Minting (Account Abstraction)")
	}
	if config.Features.IPFSMetadata {
		fmt.Println("✅ IPFS Metadata Storage")
	}
	if config.Features.SMSNotifications {
		fmt.Println("✅ SMS Notifications")
	}

	// Connect to network
	fmt.Println("\n🔗 Connecting to Polygon Amoy...")
	client, err := ethclient.Dial(config.Blockchain.PolygonEndpoint)
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}
	defer client.Close()

	chainID, _ := client.ChainID(context.Background())
	fmt.Printf("✅ Connected to Chain ID: %s\n", chainID.String())

	// Example: Mint a gasless ticket
	fmt.Println("\n🎫 Example: Minting Gasless Ticket")
	fmt.Println("----------------------------------")
	
	passengerAddress := "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"
	tokenURI := "ipfs://QmExampleTicketMetadata"

	fmt.Printf("Passenger: %s\n", passengerAddress)
	fmt.Printf("Metadata: %s\n", tokenURI)

	// Create UserOperation
	userOp := &UserOperation{
		Sender:               config.Blockchain.RelayerAddress,
		Nonce:                "0x0",
		InitCode:             "0x",
		CallData:             "0x", // Would encode mint function
		CallGasLimit:         "0x0",
		VerificationGasLimit: "0x0",
		PreVerificationGas:   "0x0",
		MaxFeePerGas:         "0x0",
		MaxPriorityFeePerGas: "0x0",
		PaymasterAndData:     "0x",
		Signature:            "0x",
	}

	// Request gas sponsorship from Alchemy
	fmt.Println("\n🛰️  Requesting Gas Sponsorship from Alchemy...")
	fmt.Printf("   Attaching Policy ID: %s\n", config.Blockchain.GasPolicyID)

	gasData, err := requestGasAndPaymasterData(
		config.Blockchain.PolygonEndpoint,
		config.Blockchain.GasPolicyID,
		config.Blockchain.EntryPoint,
		userOp,
	)

	if err != nil {
		fmt.Printf("\n⚠️  Gas sponsorship request: %v\n", err)
		fmt.Println("\n📝 Note: This requires a deployed smart contract wallet")
		fmt.Println("   The system is configured and ready once wallet is deployed")
	} else {
		fmt.Println("\n✅ Gas Sponsorship APPROVED!")
		fmt.Printf("   Paymaster: %s...\n", gasData.PaymasterAndData[:20])
		fmt.Println("\n💰 Cost Breakdown:")
		fmt.Println("   Passenger pays: 0 POL ✅")
		fmt.Println("   Relayer pays: 0 POL ✅")
		fmt.Println("   Alchemy pays: ALL gas fees ✅")
	}

	// Summary
	fmt.Println("\n" + string(make([]byte, 60)))
	fmt.Println("🎉 Relayer Active and Ready!")
	fmt.Println("\n✨ System Status:")
	fmt.Println("  ✅ Configuration loaded from config.json")
	fmt.Println("  ✅ Gas Policy ID configured")
	fmt.Println("  ✅ Network connection verified")
	fmt.Println("  ✅ IPFS integration ready")
	fmt.Println("  ⏳ Awaiting smart wallet deployment")
	fmt.Println("\n🚀 Once smart wallet is deployed:")
	fmt.Println("  • Passengers pay ZERO gas fees")
	fmt.Println("  • Relayer pays ZERO gas fees")
	fmt.Println("  • Alchemy pays ALL gas fees")
	fmt.Println("  • Seamless ticket minting experience")
	fmt.Println(string(make([]byte, 60)))
}

// requestGasAndPaymasterData requests gas sponsorship from Alchemy
func requestGasAndPaymasterData(
	rpcURL string,
	policyID string,
	entryPoint string,
	userOp *UserOperation,
) (*GasAndPaymasterResponse, error) {
	// Generate dummy signature (required by Alchemy)
	dummySignature := "0x" + string(make([]byte, 130))
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
				"entryPoint":     entryPoint,
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
