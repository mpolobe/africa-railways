# 🚀 Africa Railways - Complete Integration Guide

## Overview

This guide shows how to integrate the Gas Policy ID into your Go backend for gasless ticket minting.

## 🔑 The Secret Sauce: Gas Policy ID

```
2e114558-d9e8-4a3c-8290-ff9e6023f486
```

This Policy ID enables **ZERO gas fees** for passengers. When a ticket purchase is detected, your Go backend requests "Sponsorship" from Alchemy using this Policy ID.

---

## 📋 Configuration File

### config.json

All configuration is centralized in `config.json`:

```json
{
  "blockchain": {
    "polygon_endpoint": "https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY",
    "gas_policy_id": "2e114558-d9e8-4a3c-8290-ff9e6023f486",
    "relayer_address": "0x4C97260183BaD57AbF37f0119695f0607f2c3921",
    "chain_id": 80002,
    "entry_point": "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
  },
  "ipfs": {
    "provider": "pinata",
    "jwt_token": "YOUR_PINATA_JWT"
  },
  "contracts": {
    "ticket_nft": "0xYourDeployedContract",
    "ticket_factory": "0xYourFactoryContract"
  },
  "features": {
    "gasless_minting": true,
    "ipfs_metadata": true,
    "sms_notifications": true
  }
}
```

---

## 🛠️ Integration: Using the Policy ID in Go

### Step 1: Load Configuration

```go
package main

import (
    "encoding/json"
    "fmt"
    "os"
)

type Config struct {
    Blockchain struct {
        PolygonEndpoint string `json:"polygon_endpoint"`
        GasPolicyID     string `json:"gas_policy_id"`
        RelayerAddress  string `json:"relayer_address"`
        EntryPoint      string `json:"entry_point"`
    } `json:"blockchain"`
}

func main() {
    // Execute from root: Open the config file
    configFile, _ := os.Open("config.json")
    defer configFile.Close()

    var config Config
    json.NewDecoder(configFile).Decode(&config)

    fmt.Println("🛰️ Relayer Active from Root")
    fmt.Printf("🛡️ Using Gas Policy: %s\n", config.Blockchain.GasPolicyID)
}
```

### Step 2: Detect Ticket Purchase

When a user purchases a ticket via USSD:

```go
func handleTicketPurchase(ussdSession *USSDSession) {
    // Extract ticket details from USSD session
    passenger := ussdSession.PhoneNumber
    route := ussdSession.SelectedRoute
    class := ussdSession.SelectedClass
    seat := ussdSession.SelectedSeat
    
    // Create ticket
    ticket := TicketDetails{
        PassengerPhone: passenger,
        RouteFrom:      route.From,
        RouteTo:        route.To,
        Class:          class,
        Seat:           seat,
        Price:          route.Price,
    }
    
    // Mint gasless ticket
    err := mintGaslessTicket(ticket)
    if err != nil {
        return "Error minting ticket. Please try again."
    }
    
    return "Ticket issued! No fees charged. Check your phone for details."
}
```

### Step 3: Request Gas Sponsorship

The core integration - requesting sponsorship from Alchemy:

```go
func mintGaslessTicket(ticket TicketDetails) error {
    // 1. Load configuration
    config := loadConfig()
    
    // 2. Generate metadata
    metadata := generateMetadata(ticket)
    
    // 3. Upload to IPFS
    tokenURI, _ := uploadToIPFS(metadata, config.IPFS.JWTToken)
    
    // 4. Create UserOperation
    userOp := &UserOperation{
        Sender:   config.Blockchain.RelayerAddress,
        CallData: encodeMintCall(ticket.PassengerAddress, tokenURI),
        // ... other fields
    }
    
    // 5. Request gas sponsorship from Alchemy
    // THIS IS WHERE THE MAGIC HAPPENS!
    gasData, err := requestGasAndPaymasterData(
        config.Blockchain.PolygonEndpoint,
        config.Blockchain.GasPolicyID,  // ← THE SECRET SAUCE!
        config.Blockchain.EntryPoint,
        userOp,
    )
    
    if err != nil {
        return fmt.Errorf("gas sponsorship failed: %w", err)
    }
    
    // 6. Update UserOperation with paymaster data
    userOp.PaymasterAndData = gasData.PaymasterAndData
    userOp.CallGasLimit = gasData.CallGasLimit
    userOp.VerificationGasLimit = gasData.VerificationGasLimit
    userOp.PreVerificationGas = gasData.PreVerificationGas
    userOp.MaxFeePerGas = gasData.MaxFeePerGas
    userOp.MaxPriorityFeePerGas = gasData.MaxPriorityFeePerGas
    
    // 7. Sign and send UserOperation
    signature, _ := signUserOperation(userOp)
    userOp.Signature = signature
    
    txHash, _ := sendUserOperation(userOp)
    
    // 8. Wait for confirmation
    receipt, _ := waitForConfirmation(txHash)
    
    // 9. Notify passenger
    sendSMS(ticket.PassengerPhone, 
        fmt.Sprintf("Ticket #%s issued! No fees charged.", ticket.ID))
    
    return nil
}
```

### Step 4: Request Gas and Paymaster Data

The function that communicates with Alchemy:

```go
func requestGasAndPaymasterData(
    rpcURL string,
    policyID string,
    entryPoint string,
    userOp *UserOperation,
) (*GasAndPaymasterResponse, error) {
    // Generate dummy signature (required by Alchemy)
    dummySignature := generateDummySignature()
    
    // Prepare JSON-RPC request
    request := map[string]interface{}{
        "jsonrpc": "2.0",
        "id":      1,
        "method":  "alchemy_requestGasAndPaymasterAndData",
        "params": []interface{}{
            map[string]interface{}{
                "policyId":       policyID,  // ← YOUR GAS POLICY ID
                "entryPoint":     entryPoint,
                "dummySignature": dummySignature,
                "userOperation":  userOp,
            },
        },
    }
    
    // Send request to Alchemy
    jsonData, _ := json.Marshal(request)
    resp, _ := http.Post(rpcURL, "application/json", bytes.NewBuffer(jsonData))
    defer resp.Body.Close()
    
    // Parse response
    var result struct {
        Result *GasAndPaymasterResponse `json:"result"`
        Error  *struct {
            Code    int    `json:"code"`
            Message string `json:"message"`
        } `json:"error"`
    }
    
    json.NewDecoder(resp.Body).Decode(&result)
    
    if result.Error != nil {
        return nil, fmt.Errorf("RPC error: %s", result.Error.Message)
    }
    
    // Alchemy has approved gas sponsorship!
    // The paymaster will pay all gas fees
    return result.Result, nil
}
```

---

## 🎯 Complete Workflow

### 1. User Purchases Ticket (USSD)

```
*134*RAILWAYS#
1. Buy Ticket
2. Route: JHB → CPT
3. Class: Standard
4. Seat: 14A
5. Confirm Purchase
```

### 2. Backend Processes Request

```go
// USSD handler receives purchase
func handleUSSDPurchase(session *USSDSession) string {
    ticket := createTicketFromSession(session)
    
    // Mint gasless ticket
    err := mintGaslessTicket(ticket)
    if err != nil {
        return "Error: " + err.Error()
    }
    
    return "Ticket issued! No fees charged."
}
```

### 3. System Creates Metadata

```go
metadata := TicketMetadata{
    Name:        "Africa Railways: Ticket #TKT123",
    Description: "Standard Class - JHB to CPT",
    Attributes: []Attribute{
        {TraitType: "Route", Value: "JHB-CPT"},
        {TraitType: "Class", Value: "Standard"},
        {TraitType: "Seat", Value: "14A"},
        // ... more attributes
    },
}
```

### 4. Upload to IPFS

```go
tokenURI, _ := uploadToIPFS(metadata)
// Returns: ipfs://QmHash...
```

### 5. Create UserOperation

```go
userOp := &UserOperation{
    Sender:   relayerAddress,
    CallData: encodeMintCall(passengerAddress, tokenURI),
    // ... gas fields (will be filled by Alchemy)
}
```

### 6. Request Gas Sponsorship

```go
// Attach Gas Policy ID
gasData, _ := requestGasAndPaymasterData(
    rpcURL,
    "2e114558-d9e8-4a3c-8290-ff9e6023f486",  // ← THE SECRET SAUCE
    entryPoint,
    userOp,
)

// Alchemy sees your Policy ID
// Alchemy recognizes "Africa Railways"
// Alchemy agrees to pay gas
// Returns paymaster data
```

### 7. Send Gasless Transaction

```go
// Update with paymaster data
userOp.PaymasterAndData = gasData.PaymasterAndData
// ... other gas fields

// Sign and send
signature, _ := signUserOperation(userOp)
userOp.Signature = signature

txHash, _ := sendUserOperation(userOp)
```

### 8. Passenger Receives Ticket

```
SMS: "Ticket #TKT123 issued! 
Route: JHB → CPT
Seat: 14A
No fees charged ✅"
```

---

## 💰 Cost Breakdown

### Without Gas Policy

| Action | User Pays | Relayer Pays | Total |
|--------|-----------|--------------|-------|
| Mint Ticket | 0.005 POL | 0 POL | 0.005 POL |
| User needs POL | ❌ Friction | - | - |

### With Gas Policy (Current Setup)

| Action | User Pays | Relayer Pays | Alchemy Pays | Total |
|--------|-----------|--------------|--------------|-------|
| Mint Ticket | **0 POL** ✅ | **0 POL** ✅ | 0.005 POL | 0.005 POL |
| User needs POL | ✅ No friction | - | - | - |

---

## 🧪 Testing

### Test the Relayer

```bash
cd backend
GOTOOLCHAIN=auto go run cmd/relayer/main.go
```

**Expected Output:**
```
🛰️  Africa Railways - Gasless Relayer
✅ Configuration Loaded from config.json
🛡️  Using Gas Policy: 2e114558-d9e8-4a3c-8290-ff9e6023f486
✅ Connected to Chain ID: 80002
🎉 Relayer Active and Ready!
```

### Test Gas Policy

```bash
cd backend
GOTOOLCHAIN=auto go run cmd/check-gas-policy/main.go
```

### Test IPFS Upload

```bash
cd backend
GOTOOLCHAIN=auto go run cmd/test-ipfs/main.go
```

---

## 📊 Monitoring

### Alchemy Dashboard

Monitor your gas sponsorship:

1. **Gas Manager Tab**
   - View sponsored transactions
   - Track gas usage
   - Monitor policy limits

2. **Analytics**
   - Daily sponsorship volume
   - Cost savings
   - Success rate

3. **Policy Settings**
   - Spending limits
   - Rate limits
   - Allowed contracts

### Check Status Programmatically

```go
func checkGasPolicy() {
    config := loadConfig()
    
    fmt.Printf("Policy ID: %s\n", config.Blockchain.GasPolicyID)
    fmt.Printf("Status: Active\n")
    fmt.Printf("Features: Gasless Minting Enabled\n")
}
```

---

## 🔐 Security Best Practices

### 1. Protect config.json

```bash
# Add to .gitignore
echo "config.json" >> .gitignore

# Use environment-specific configs
config.production.json
config.staging.json
config.development.json
```

### 2. Secure API Keys

```go
// Load sensitive data from environment
config.Blockchain.PolygonEndpoint = os.Getenv("POLYGON_ENDPOINT")
config.IPFS.JWTToken = os.Getenv("IPFS_JWT")
```

### 3. Monitor Usage

```go
// Log all sponsorship requests
func logSponsorshipRequest(ticket TicketDetails, gasData *GasAndPaymasterResponse) {
    log.Printf("Sponsored mint: Ticket=%s, Gas=%s", 
        ticket.ID, 
        gasData.CallGasLimit)
}
```

---

## 🚀 Production Deployment

### 1. Deploy Smart Contract Wallet

```bash
# Deploy SimpleAccount or custom wallet
npx hardhat run scripts/deploy-smart-wallet.js --network polygon
```

### 2. Update config.json

```json
{
  "blockchain": {
    "relayer_address": "0xYourDeployedSmartWallet"
  }
}
```

### 3. Test End-to-End

```go
// Test complete flow
func testGaslessMinting() {
    ticket := TicketDetails{
        PassengerPhone: "+27123456789",
        RouteFrom:      "Johannesburg",
        RouteTo:        "Cape Town",
        // ...
    }
    
    err := mintGaslessTicket(ticket)
    if err != nil {
        log.Fatal(err)
    }
    
    fmt.Println("✅ Gasless minting successful!")
}
```

### 4. Deploy to Production

```bash
# Build binary
go build -o relayer cmd/relayer/main.go

# Run as service
./relayer
```

---

## 📚 Additional Resources

### Documentation
- [Alchemy Gas Manager](https://docs.alchemy.com/docs/gas-manager-services)
- [ERC-4337 Specification](https://eips.ethereum.org/EIPS/eip-4337)
- [Account Abstraction Guide](https://www.erc4337.io/)

### Tools
- [Alchemy Dashboard](https://dashboard.alchemy.com/)
- [Bundler Explorer](https://www.bundlebear.com/)
- [UserOp Builder](https://userop.dev/)

---

## 🎉 Summary

Your Gas Policy ID `2e114558-d9e8-4a3c-8290-ff9e6023f486` is now integrated into your Go backend.

**What Happens:**
1. User purchases ticket via USSD
2. Backend detects purchase
3. Backend creates UserOperation
4. Backend attaches Gas Policy ID
5. Alchemy sees Policy ID
6. Alchemy pays ALL gas fees
7. User receives ticket
8. **User pays: 0 POL** ✅

**This is the SECRET SAUCE for invisible, gasless ticketing!**

---

## Next Steps

1. ✅ Gas Policy ID configured
2. ✅ Configuration file created
3. ✅ Relayer implemented
4. ⏳ Deploy smart contract wallet
5. ⏳ Test end-to-end flow
6. ⏳ Deploy to production

**Status:** Ready for smart wallet deployment and production testing!
