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

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
)

// PolicyManager handles Alchemy Gas Policy for sponsored transactions
type PolicyManager struct {
	policyID string
	apiKey   string
	rpcURL   string
	client   *ethclient.Client
}

// NewPolicyManager creates a new gas policy manager
func NewPolicyManager(client *ethclient.Client) *PolicyManager {
	return &PolicyManager{
		policyID: os.Getenv("ALCHEMY_GAS_POLICY_ID"),
		apiKey:   extractAPIKey(os.Getenv("POLYGON_RPC_URL")),
		rpcURL:   os.Getenv("POLYGON_RPC_URL"),
		client:   client,
	}
}

// extractAPIKey extracts the API key from Alchemy RPC URL
func extractAPIKey(rpcURL string) string {
	// Extract from URL like: https://polygon-amoy.g.alchemy.com/v2/API_KEY
	parts := []rune(rpcURL)
	for i := len(parts) - 1; i >= 0; i-- {
		if parts[i] == '/' {
			return string(parts[i+1:])
		}
	}
	return ""
}

// SponsoredTransactionRequest represents a request for gas sponsorship
type SponsoredTransactionRequest struct {
	PolicyID string `json:"policyId"`
	TxHash   string `json:"txHash,omitempty"`
	From     string `json:"from"`
	To       string `json:"to"`
	Data     string `json:"data,omitempty"`
	Value    string `json:"value,omitempty"`
	GasLimit string `json:"gasLimit,omitempty"`
}

// SponsoredTransactionResponse represents the response from Alchemy
type SponsoredTransactionResponse struct {
	Sponsored bool   `json:"sponsored"`
	TxHash    string `json:"txHash,omitempty"`
	Error     string `json:"error,omitempty"`
}

// IsTransactionSponsored checks if a transaction qualifies for gas sponsorship
func (pm *PolicyManager) IsTransactionSponsored(from, to common.Address, data []byte) (bool, error) {
	if pm.policyID == "" {
		return false, fmt.Errorf("gas policy ID not configured")
	}

	req := SponsoredTransactionRequest{
		PolicyID: pm.policyID,
		From:     from.Hex(),
		To:       to.Hex(),
		Data:     fmt.Sprintf("0x%x", data),
	}

	return pm.checkSponsorship(req)
}

// checkSponsorship makes API call to check if transaction is sponsored
func (pm *PolicyManager) checkSponsorship(req SponsoredTransactionRequest) (bool, error) {
	// Alchemy Gas Manager API endpoint
	url := fmt.Sprintf("https://api.g.alchemy.com/v2/%s/gas-manager/check", pm.apiKey)

	jsonData, err := json.Marshal(req)
	if err != nil {
		return false, err
	}

	httpReq, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return false, err
	}

	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return false, err
	}

	var result SponsoredTransactionResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return false, err
	}

	if result.Error != "" {
		return false, fmt.Errorf("sponsorship check failed: %s", result.Error)
	}

	return result.Sponsored, nil
}

// GetPolicyInfo returns information about the gas policy
func (pm *PolicyManager) GetPolicyInfo() map[string]string {
	return map[string]string{
		"policy_id": pm.policyID,
		"status":    pm.getPolicyStatus(),
		"rpc_url":   pm.rpcURL,
	}
}

// getPolicyStatus checks if the policy is configured
func (pm *PolicyManager) getPolicyStatus() string {
	if pm.policyID == "" {
		return "not_configured"
	}
	return "configured"
}

// EstimateGasWithPolicy estimates gas considering policy sponsorship
func (pm *PolicyManager) EstimateGasWithPolicy(
	ctx context.Context,
	from, to common.Address,
	data []byte,
	value *big.Int,
) (uint64, bool, error) {
	// Check if transaction is sponsored
	sponsored, err := pm.IsTransactionSponsored(from, to, data)
	if err != nil {
		// If check fails, proceed with normal gas estimation
		sponsored = false
	}

	// Estimate gas
	msg := map[string]interface{}{
		"from":  from.Hex(),
		"to":    to.Hex(),
		"data":  fmt.Sprintf("0x%x", data),
		"value": fmt.Sprintf("0x%x", value),
	}

	// Use eth_estimateGas
	gasLimit, err := pm.client.EstimateGas(ctx, toCallMsg(msg))
	if err != nil {
		return 0, sponsored, err
	}

	return gasLimit, sponsored, nil
}

// toCallMsg converts map to ethereum.CallMsg
func toCallMsg(msg map[string]interface{}) ethereum.CallMsg {
	// This is a simplified version
	// In production, properly parse all fields
	callMsg := ethereum.CallMsg{}
	
	// Parse from, to, data, value if present
	if fromStr, ok := msg["from"].(string); ok {
		callMsg.From = common.HexToAddress(fromStr)
	}
	if toStr, ok := msg["to"].(string); ok {
		to := common.HexToAddress(toStr)
		callMsg.To = &to
	}
	if dataStr, ok := msg["data"].(string); ok {
		callMsg.Data = common.FromHex(dataStr)
	}
	if valueStr, ok := msg["value"].(string); ok {
		value := new(big.Int)
		value.SetString(valueStr[2:], 16) // Remove "0x" prefix and parse hex
		callMsg.Value = value
	}
	
	return callMsg
}

// SponsorshipInfo contains information about transaction sponsorship
type SponsorshipInfo struct {
	IsSponsored    bool
	PolicyID       string
	EstimatedGas   uint64
	SponsoredBy    string
	UserPays       *big.Int
	PolicyPays     *big.Int
}

// GetSponsorshipInfo returns detailed sponsorship information
func (pm *PolicyManager) GetSponsorshipInfo(
	ctx context.Context,
	from, to common.Address,
	data []byte,
	value *big.Int,
) (*SponsorshipInfo, error) {
	gasLimit, sponsored, err := pm.EstimateGasWithPolicy(ctx, from, to, data, value)
	if err != nil {
		return nil, err
	}

	gasPrice, err := pm.client.SuggestGasPrice(ctx)
	if err != nil {
		return nil, err
	}

	totalCost := new(big.Int).Mul(gasPrice, big.NewInt(int64(gasLimit)))

	info := &SponsorshipInfo{
		IsSponsored:  sponsored,
		PolicyID:     pm.policyID,
		EstimatedGas: gasLimit,
		SponsoredBy:  "Alchemy Gas Manager",
	}

	if sponsored {
		// Policy pays all gas
		info.PolicyPays = totalCost
		info.UserPays = big.NewInt(0)
	} else {
		// User pays all gas
		info.UserPays = totalCost
		info.PolicyPays = big.NewInt(0)
	}

	return info, nil
}

// FormatSponsorshipInfo formats sponsorship info for display
func FormatSponsorshipInfo(info *SponsorshipInfo) string {
	if info.IsSponsored {
		return fmt.Sprintf(
			"✅ Transaction Sponsored by %s\n"+
				"   Policy ID: %s\n"+
				"   Gas Limit: %d\n"+
				"   User Pays: 0 POL\n"+
				"   Policy Pays: %s POL",
			info.SponsoredBy,
			info.PolicyID,
			info.EstimatedGas,
			weiToPOL(info.PolicyPays),
		)
	}

	return fmt.Sprintf(
		"⚠️  Transaction Not Sponsored\n"+
			"   Gas Limit: %d\n"+
			"   User Pays: %s POL",
		info.EstimatedGas,
		weiToPOL(info.UserPays),
	)
}

// weiToPOL converts Wei to POL for display
func weiToPOL(wei *big.Int) string {
	pol := new(big.Float).Quo(
		new(big.Float).SetInt(wei),
		big.NewFloat(1e18),
	)
	return pol.Text('f', 6)
}
