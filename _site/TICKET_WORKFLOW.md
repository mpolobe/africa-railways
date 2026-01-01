# Africa Railways - NFT Ticket Workflow

## Complete Ticket Minting Process

This document describes the end-to-end workflow for minting railway tickets as NFTs on Polygon.

## Architecture Overview

```
User (USSD) → Backend API → Metadata Generation → IPFS Upload → Polygon Mint → NFT Ticket
```

## Step-by-Step Workflow

### 1. User Purchases Ticket (USSD)

When a user purchases a ticket via USSD menu:

```
*134*RAILWAYS#
1. Buy Ticket
2. Route: JHB → CPT
3. Class: Standard
4. Seat: 14A
5. Confirm Purchase
```

### 2. Backend Creates Ticket Metadata

The backend generates ERC-721 compliant metadata:

```json
{
  "name": "Africa Railways: Ticket #TKT1735017600",
  "description": "Standard Class Ticket - Johannesburg to Cape Town",
  "image": "ipfs://QmYourTicketDesignCID",
  "external_url": "https://africarailways.com/verify/TKT1735017600",
  "attributes": [
    { "trait_type": "Route", "value": "JHB-CPT" },
    { "trait_type": "Class", "value": "Standard" },
    { "trait_type": "Seat", "value": "14A" },
    { "display_type": "date", "trait_type": "Departure", "value": 1735017600 },
    { "display_type": "date", "trait_type": "Arrival", "value": 1735088400 },
    { "trait_type": "Passenger", "value": "John Doe" },
    { "trait_type": "Phone", "value": "+27123456789" },
    { "display_type": "number", "trait_type": "Price", "value": 450.00 },
    { "trait_type": "Currency", "value": "ZAR" }
  ]
}
```

**Code Implementation:**

```go
import "your-project/backend/pkg/metadata"

ticket := metadata.TicketDetails{
    TicketID:       "TKT1735017600",
    PassengerName:  "John Doe",
    PassengerPhone: "+27123456789",
    RouteFrom:      "Johannesburg",
    RouteTo:        "Cape Town",
    DepartureTime:  time.Unix(1735017600, 0),
    ArrivalTime:    time.Unix(1735088400, 0),
    SeatNumber:     "14A",
    Class:          "Standard",
    Price:          450.00,
    Currency:       "ZAR",
    QRCode:         "ipfs://QmQRCodeHash",
}

metadata := metadata.GenerateMetadata(ticket)
```

### 3. Upload Metadata to IPFS

Upload the JSON metadata to IPFS using Pinata or NFT.Storage:

**Option A: Pinata**

```go
import "your-project/backend/pkg/ipfs"

uploader := ipfs.NewUploader("pinata")
metadataURI, err := uploader.UploadJSON(metadata)
// Returns: "ipfs://QmMetadataHash..."
```

**Environment Variables Required:**

```bash
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
```

**Option B: NFT.Storage (Free)**

```go
uploader := ipfs.NewUploader("nft.storage")
metadataURI, err := uploader.UploadJSON(metadata)
```

**Environment Variables Required:**

```bash
NFT_STORAGE_API_KEY=your_nft_storage_api_key
```

Get a free API key at: [https://nft.storage](https://nft.storage)

### 4. Send Minting Request to Alchemy

The backend sends a JSON-RPC request to Alchemy:

```go
// Connect to Polygon via Alchemy
client, err := ethclient.Dial(os.Getenv("POLYGON_RPC_URL"))

// Prepare mint transaction
// This calls your contract's safeMint(address to, string memory uri) function
tx, err := mintTicketNFT(client, passengerAddress, metadataURI)

// Send transaction
err = client.SendTransaction(ctx, signedTx)
```

**What Happens:**

1. Your Go code creates a signed transaction
2. Sends `eth_sendRawTransaction` to Alchemy endpoint
3. Alchemy broadcasts to Polygon network
4. Transaction enters mempool
5. Validators mine the transaction
6. NFT is minted to passenger's wallet

### 5. Monitor Transaction

**View in Alchemy Dashboard:**

- **Mempool Tab:** See pending transactions before confirmation
- **Analytics Tab:** Track daily minting activity
- **Requests Tab:** Monitor API usage

**View on PolygonScan:**

```
https://amoy.polygonscan.com/tx/{transaction_hash}
```

### 6. Confirm and Notify User

Once the transaction is confirmed:

```go
receipt, err := client.TransactionReceipt(ctx, txHash)
if receipt.Status == 1 {
    // Success! Send SMS to user
    sendSMS(passenger.Phone, fmt.Sprintf(
        "Your ticket #%s has been issued! View at: %s",
        ticketID,
        externalURL,
    ))
}
```

## Gas Management

### Check Balance

```go
func getGasBalance(client *ethclient.Client, account common.Address) *big.Float {
    balance, _ := client.BalanceAt(context.Background(), account, nil)
    // Convert wei to POL (18 decimals)
    fbalance := new(big.Float)
    fbalance.SetString(balance.String())
    polValue := new(big.Float).Quo(fbalance, big.NewFloat(1e18))
    return polValue
}

balance := getGasBalance(client, relayerAddress)
fmt.Printf("Relayer Balance: %s POL\n", balance.Text('f', 6))
```

### Estimate Gas Cost

```go
gasPrice, _ := client.SuggestGasPrice(ctx)
gasLimit := uint64(150000) // Typical for NFT mint

estimatedCost := new(big.Int).Mul(gasPrice, big.NewInt(int64(gasLimit)))
costInPOL := new(big.Float).Quo(
    new(big.Float).SetInt(estimatedCost),
    big.NewFloat(1e18),
)

fmt.Printf("Estimated Cost: %s POL\n", costInPOL.Text('f', 6))
```

### Auto-Refill Logic

```go
const MIN_BALANCE = 0.1 // POL

if balance.Cmp(big.NewFloat(MIN_BALANCE)) < 0 {
    log.Printf("⚠️  Low balance: %s POL", balance.Text('f', 6))
    // Trigger alert or auto-refill
    notifyAdmin("Relayer wallet needs refill")
}
```

## Complete Example: Mint Ticket

```go
package main

import (
    "context"
    "fmt"
    "log"
    "time"
    
    "github.com/ethereum/go-ethereum/ethclient"
    "your-project/backend/pkg/metadata"
    "your-project/backend/pkg/ipfs"
)

func mintTicket(
    ticketID string,
    passengerName string,
    passengerPhone string,
    passengerAddress string,
) error {
    // 1. Create ticket metadata
    ticket := metadata.TicketDetails{
        TicketID:       ticketID,
        PassengerName:  passengerName,
        PassengerPhone: passengerPhone,
        RouteFrom:      "Johannesburg",
        RouteTo:        "Cape Town",
        DepartureTime:  time.Now().Add(24 * time.Hour),
        ArrivalTime:    time.Now().Add(48 * time.Hour),
        SeatNumber:     "14A",
        Class:          "Standard",
        Price:          450.00,
        Currency:       "ZAR",
        QRCode:         "ipfs://QmQRCode...",
    }
    
    metadata := metadata.GenerateMetadata(ticket)
    
    // 2. Upload to IPFS
    uploader := ipfs.NewUploader("nft.storage")
    metadataURI, err := uploader.UploadJSON(metadata)
    if err != nil {
        return fmt.Errorf("IPFS upload failed: %w", err)
    }
    
    log.Printf("✅ Metadata uploaded: %s", metadataURI)
    
    // 3. Connect to Polygon
    client, err := ethclient.Dial(os.Getenv("POLYGON_RPC_URL"))
    if err != nil {
        return fmt.Errorf("connection failed: %w", err)
    }
    defer client.Close()
    
    // 4. Check balance
    relayerAddr := common.HexToAddress(os.Getenv("POLYGON_RELAYER_ADDRESS"))
    balance := getGasBalance(client, relayerAddr)
    
    if balance.Cmp(big.NewFloat(0.01)) < 0 {
        return fmt.Errorf("insufficient balance: %s POL", balance.Text('f', 6))
    }
    
    // 5. Mint NFT
    // (Implementation depends on your contract)
    txHash, err := sendMintTransaction(client, passengerAddress, metadataURI)
    if err != nil {
        return fmt.Errorf("mint failed: %w", err)
    }
    
    log.Printf("✅ Transaction sent: %s", txHash)
    log.Printf("🔍 View: https://amoy.polygonscan.com/tx/%s", txHash)
    
    // 6. Wait for confirmation
    receipt, err := waitForConfirmation(client, txHash)
    if err != nil {
        return fmt.Errorf("confirmation failed: %w", err)
    }
    
    if receipt.Status == 1 {
        log.Printf("🎉 Ticket minted successfully!")
        return nil
    }
    
    return fmt.Errorf("transaction failed")
}
```

## Testing the Workflow

### 1. Run the Full Minting Script

```bash
cd backend
go run cmd/mint-ticket-full/main.go
```

### 2. Expected Output

```
🎫 Africa Railways - NFT Ticket Minting System
==================================================

📋 Step 1: Creating Ticket Metadata...
   ✅ Ticket ID: TKT1735017600
   ✅ Route: JHB → CPT
   ✅ Passenger: John Doe

📤 Step 2: Uploading Metadata to IPFS...
   ✅ Metadata URI: ipfs://QmMockMetadata1735017600

🔗 Step 3: Connecting to Polygon Amoy via Alchemy...
   ✅ Connected to Chain ID: 80002

🔑 Step 4: Loading Relayer Wallet...
   ✅ Relayer Address: 0xYourRelayerAddressHere
   💰 Balance: 0.500000 POL

🎨 Step 5: Preparing Mint Transaction...
   Contract: 0x...
   Recipient: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1
   Token URI: ipfs://QmMockMetadata1735017600

✍️  Step 6: Signing Transaction...

📝 Transaction Summary:
   Nonce: 0
   Gas Price: 1.50 Gwei
   Gas Limit: 150000
   Estimated Cost: 0.000225 POL
   Tx Hash: 0x...

🛰️  Step 7: Sending Request to Alchemy...
   ✅ Transaction sent!
   🔍 View on PolygonScan: https://amoy.polygonscan.com/tx/0x...

⏳ Step 8: Waiting for Confirmation...
   ✅ Transaction Confirmed!
   Block: 12345678
   Gas Used: 142000

🎉 NFT Ticket Successfully Minted!
```

## Production Checklist

- [ ] Deploy ticket NFT contract to Polygon
- [ ] Set up IPFS service (Pinata or NFT.Storage)
- [ ] Configure environment variables
- [ ] Fund relayer wallet with POL
- [ ] Set up balance monitoring and alerts
- [ ] Implement error handling and retries
- [ ] Add transaction logging to database
- [ ] Set up webhook for transaction confirmations
- [ ] Test with small amounts first
- [ ] Monitor Alchemy dashboard for usage

## Monitoring & Analytics

### Alchemy Dashboard

1. **Mempool Tab**
   - View pending transactions
   - Monitor transaction status
   - Check for stuck transactions

2. **Analytics Tab**
   - Daily minting volume
   - API request count
   - Error rates
   - Response times

3. **Requests Tab**
   - Individual request logs
   - Request/response details
   - Debug failed transactions

### PolygonScan

- View all minted tickets: `https://amoy.polygonscan.com/address/{contract_address}`
- Check relayer activity: `https://amoy.polygonscan.com/address/{relayer_address}`
- Verify individual tickets: `https://amoy.polygonscan.com/tx/{tx_hash}`

## Troubleshooting

### "Insufficient funds for gas"

Fund the relayer wallet from the faucet or transfer POL.

### "Transaction underpriced"

Increase gas price or wait for network congestion to clear.

### "Nonce too low"

Reset nonce or wait for pending transactions to confirm.

### "IPFS upload failed"

Check API keys and network connectivity. Use mock uploader for testing.

## Resources

- [Alchemy Dashboard](https://dashboard.alchemy.com/)
- [Polygon Faucet](https://faucet.polygon.technology/)
- [NFT.Storage](https://nft.storage/)
- [Pinata](https://www.pinata.cloud/)
- [PolygonScan Amoy](https://amoy.polygonscan.com/)
