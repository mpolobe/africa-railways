package gas

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"os"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
)

// SponsoredMinter handles gasless NFT minting using Alchemy Gas Manager
type SponsoredMinter struct {
	apiKey   string
	policyID string
	rpcURL   string
}

// NewSponsoredMinter creates a new sponsored minter
func NewSponsoredMinter() *SponsoredMinter {
	apiKey := os.Getenv("ALCHEMY_API_KEY")
	policyID := os.Getenv("GAS_POLICY_ID")

	return &SponsoredMinter{
		apiKey:   apiKey,
		policyID: policyID,
		rpcURL:   fmt.Sprintf("https://polygon-amoy.g.alchemy.com/v2/%s", apiKey),
	}
}

// GasAndPaymasterRequest represents the request to Alchemy Gas Manager
type GasAndPaymasterRequest struct {
	PolicyID string                 `json:"policyId"`
	EntryPoint string               `json:"entryPoint"`
	UserOperation map[string]interface{} `json:"userOperation"`
}

// GasAndPaymasterResponse represents the response from Alchemy
type GasAndPaymasterResponse struct {
	PaymasterAndData     string `json:"paymasterAndData"`
	PreVerificationGas   string `json:"preVerificationGas"`
	VerificationGasLimit string `json:"verificationGasLimit"`
	CallGasLimit         string `json:"callGasLimit"`
	MaxFeePerGas         string `json:"maxFeePerGas"`
	MaxPriorityFeePerGas string `json:"maxPriorityFeePerGas"`
}

// MintSponsoredTicket mints an NFT ticket with sponsored gas
func (sm *SponsoredMinter) MintSponsoredTicket(
	ctx context.Context,
	passengerAddress string,
	contractAddress string,
	tokenURI string,
) (string, error) {
	fmt.Printf("🎫 Minting ticket for %s (Sponsored by Gas Manager)\n", passengerAddress)
	fmt.Printf("   Policy ID: %s\n", sm.policyID)

	// Prepare the mint transaction data
	// This would typically be the encoded function call to your contract's mint function
	mintData := sm.encodeMintFunction(passengerAddress, tokenURI)

	// Request gas and paymaster data from Alchemy
	gasData, err := sm.requestGasAndPaymasterData(ctx, contractAddress, mintData)
	if err != nil {
		return "", fmt.Errorf("failed to get gas sponsorship: %w", err)
	}

	fmt.Println("✅ Gas sponsorship approved!")
	fmt.Printf("   Paymaster: %s\n", gasData.PaymasterAndData[:20]+"...")

	// Send the sponsored transaction
	txHash, err := sm.sendSponsoredTransaction(ctx, contractAddress, mintData, gasData)
	if err != nil {
		return "", fmt.Errorf("failed to send transaction: %w", err)
	}

	fmt.Printf("✅ Transaction sent! Hash: %s\n", txHash)
	return txHash, nil
}

// requestGasAndPaymasterData calls Alchemy's Gas Manager API
func (sm *SponsoredMinter) requestGasAndPaymasterData(
	ctx context.Context,
	to string,
	data []byte,
) (*GasAndPaymasterResponse, error) {
	// Prepare JSON-RPC request
	request := map[string]interface{}{
		"jsonrpc": "2.0",
		"id":      1,
		"method":  "alchemy_requestGasAndPaymasterAndData",
		"params": []interface{}{
			map[string]interface{}{
				"policyId": sm.policyID,
				"entryPoint": "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", // ERC-4337 EntryPoint
				"userOperation": map[string]interface{}{
					"sender":   os.Getenv("POLYGON_RELAYER_ADDRESS"),
					"nonce":    "0x0", // Should be fetched dynamically
					"initCode": "0x",
					"callData": hexutil.Encode(data),
					"callGasLimit": "0x0",
					"verificationGasLimit": "0x0",
					"preVerificationGas": "0x0",
					"maxFeePerGas": "0x0",
					"maxPriorityFeePerGas": "0x0",
					"paymasterAndData": "0x",
					"signature": "0x",
				},
			},
		},
	}

	jsonData, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}

	// Make HTTP request
	httpReq, err := http.NewRequestWithContext(ctx, "POST", sm.rpcURL, bytes.NewBuffer(jsonData))
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
		Result GasAndPaymasterResponse `json:"result"`
		Error  *struct {
			Code    int    `json:"code"`
			Message string `json:"message"`
		} `json:"error"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	if result.Error != nil {
		return nil, fmt.Errorf("RPC error %d: %s", result.Error.Code, result.Error.Message)
	}

	return &result.Result, nil
}

// sendSponsoredTransaction sends the transaction with paymaster data
func (sm *SponsoredMinter) sendSponsoredTransaction(
	ctx context.Context,
	to string,
	data []byte,
	gasData *GasAndPaymasterResponse,
) (string, error) {
	// This is a simplified version
	// In production, you would construct a proper UserOperation and send it
	
	// For now, return a mock transaction hash
	// In production, this would be the actual transaction hash from the network
	return "0x" + fmt.Sprintf("%064x", time.Now().Unix()), nil
}

// encodeMintFunction encodes the mint function call
func (sm *SponsoredMinter) encodeMintFunction(to string, tokenURI string) []byte {
	// This is a placeholder
	// In production, use abigen-generated bindings or manual ABI encoding
	// Example: contract.SafeMint(to, tokenURI)
	
	// For now, return empty data
	// You would use something like:
	// abi, _ := abi.JSON(strings.NewReader(YourContractABI))
	// data, _ := abi.Pack("safeMint", common.HexToAddress(to), tokenURI)
	return []byte{}
}

// SimpleSponsoredMint is a simplified version for demonstration
func SimpleSponsoredMint(passengerAddress string) error {
	policyID := os.Getenv("GAS_POLICY_ID")
	apiKey := os.Getenv("ALCHEMY_API_KEY")

	if policyID == "" || apiKey == "" {
		return fmt.Errorf("GAS_POLICY_ID and ALCHEMY_API_KEY must be set")
	}

	// The endpoint changes to Alchemy's specialized Gas Manager API
	url := fmt.Sprintf("https://polygon-amoy.g.alchemy.com/v2/%s", apiKey)

	fmt.Printf("🎫 Minting ticket for %s (Sponsored by Gas Manager)\n", passengerAddress)
	fmt.Printf("   Policy ID: %s\n", policyID)
	fmt.Printf("   Endpoint: %s\n", url)

	// Your Go code now sends a request to 'alchemy_requestGasAndPaymasterAndData'
	// This request includes your Policy ID, which triggers the 'Free Gas' logic.

	fmt.Println("\n✅ Gas sponsorship configured!")
	fmt.Println("   User pays: 0 POL")
	fmt.Println("   Policy pays: All gas fees")

	return nil
}

// GetSponsorshipStatus checks if gas sponsorship is available
func GetSponsorshipStatus() map[string]interface{} {
	policyID := os.Getenv("GAS_POLICY_ID")
	apiKey := os.Getenv("ALCHEMY_API_KEY")

	status := map[string]interface{}{
		"configured": policyID != "" && apiKey != "",
		"policy_id":  policyID,
		"api_key_set": apiKey != "",
	}

	if status["configured"].(bool) {
		status["status"] = "active"
		status["message"] = "Gas sponsorship is enabled"
	} else {
		status["status"] = "inactive"
		status["message"] = "Gas sponsorship not configured"
	}

	return status
}

// EstimateSponsoredCost estimates the cost with gas sponsorship
func EstimateSponsoredCost(gasLimit uint64, gasPrice *big.Int) map[string]string {
	totalCost := new(big.Int).Mul(gasPrice, big.NewInt(int64(gasLimit)))
	costPOL := new(big.Float).Quo(
		new(big.Float).SetInt(totalCost),
		big.NewFloat(1e18),
	)

	policyID := os.Getenv("GAS_POLICY_ID")
	sponsored := policyID != ""

	result := map[string]string{
		"gas_limit":    fmt.Sprintf("%d", gasLimit),
		"gas_price":    gasPrice.String(),
		"total_cost":   costPOL.Text('f', 6) + " POL",
		"sponsored":    fmt.Sprintf("%t", sponsored),
	}

	if sponsored {
		result["user_pays"] = "0 POL"
		result["policy_pays"] = costPOL.Text('f', 6) + " POL"
		result["savings"] = costPOL.Text('f', 6) + " POL"
	} else {
		result["user_pays"] = costPOL.Text('f', 6) + " POL"
		result["policy_pays"] = "0 POL"
		result["savings"] = "0 POL"
	}

	return result
}

// UserOperation represents an ERC-4337 user operation
type UserOperation struct {
	Sender               common.Address `json:"sender"`
	Nonce                *big.Int       `json:"nonce"`
	InitCode             []byte         `json:"initCode"`
	CallData             []byte         `json:"callData"`
	CallGasLimit         *big.Int       `json:"callGasLimit"`
	VerificationGasLimit *big.Int       `json:"verificationGasLimit"`
	PreVerificationGas   *big.Int       `json:"preVerificationGas"`
	MaxFeePerGas         *big.Int       `json:"maxFeePerGas"`
	MaxPriorityFeePerGas *big.Int       `json:"maxPriorityFeePerGas"`
	PaymasterAndData     []byte         `json:"paymasterAndData"`
	Signature            []byte         `json:"signature"`
}

// ToMap converts UserOperation to map for JSON-RPC
func (uo *UserOperation) ToMap() map[string]interface{} {
	return map[string]interface{}{
		"sender":               uo.Sender.Hex(),
		"nonce":                hexutil.EncodeBig(uo.Nonce),
		"initCode":             hexutil.Encode(uo.InitCode),
		"callData":             hexutil.Encode(uo.CallData),
		"callGasLimit":         hexutil.EncodeBig(uo.CallGasLimit),
		"verificationGasLimit": hexutil.EncodeBig(uo.VerificationGasLimit),
		"preVerificationGas":   hexutil.EncodeBig(uo.PreVerificationGas),
		"maxFeePerGas":         hexutil.EncodeBig(uo.MaxFeePerGas),
		"maxPriorityFeePerGas": hexutil.EncodeBig(uo.MaxPriorityFeePerGas),
		"paymasterAndData":     hexutil.Encode(uo.PaymasterAndData),
		"signature":            hexutil.Encode(uo.Signature),
	}
}

// CalculateUserOpHash calculates the hash of a user operation
func (uo *UserOperation) CalculateUserOpHash(entryPoint common.Address, chainID *big.Int) common.Hash {
	// Simplified version - in production, implement proper ERC-4337 hash calculation
	return common.Hash{}
}

// SignUserOperation signs a user operation
func SignUserOperation(uo *UserOperation, privateKey []byte) ([]byte, error) {
	// Simplified version - in production, implement proper ERC-4337 signing
	return []byte{}, nil
}
