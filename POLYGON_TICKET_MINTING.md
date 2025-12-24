# Polygon NFT Ticket Minting System

## Overview

This system enables minting railway tickets as NFTs on the Polygon Amoy testnet using Alchemy as the RPC provider.

## Configuration

### Environment Variables

The `.env` file contains:

```bash
POLYGON_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/4-gxorN-H4MhqZWrskRQ-
POLYGON_PRIVATE_KEY=0xyour_private_key_here
```

### Wallet Details

- **Network:** Polygon Amoy Testnet (Chain ID: 80002)
- **Relayer Address:** `0xYourRelayerAddressHere`
- **RPC Provider:** Alchemy

## Setup Steps

### 1. Fund the Wallet

Get test MATIC tokens from the Polygon faucet:

1. Visit [https://faucet.polygon.technology](https://faucet.polygon.technology)
2. Enter address: `0xYourRelayerAddressHere`
3. Request test MATIC (needed for gas fees)

### 2. Run the Minting Script

```bash
cd backend
go run cmd/mint-ticket/main.go
```

### 3. Expected Output

```
🔗 Connecting to Polygon Amoy via Alchemy...
✅ Connected to Chain ID: 80002
🔑 Relayer Address: 0xYourRelayerAddressHere
💰 Balance: 0.500000 MATIC

🎫 Preparing NFT Ticket Mint Transaction...
   Contract: 0x...
   Passenger: 0x...
   Metadata: ipfs://QmTicketDataHash

📝 Transaction Details:
   Nonce: 0
   Gas Price: 1.50 Gwei
   Gas Limit: 100000
   Estimated Cost: 0.000150 MATIC
```

## Script Features

### Current Implementation

- ✅ Connects to Polygon Amoy via Alchemy
- ✅ Loads wallet from environment variables
- ✅ Checks wallet balance
- ✅ Prepares and signs transactions
- ✅ Estimates gas costs
- ⚠️ Transaction sending is disabled by default (safety)

### Transaction Flow

1. **Load Configuration:** Reads RPC URL and private key from `.env`
2. **Connect to Network:** Establishes connection via Alchemy
3. **Verify Wallet:** Checks balance and displays address
4. **Prepare Transaction:** Creates unsigned transaction with:
   - Contract address (ticket NFT contract)
   - Passenger address (recipient)
   - Metadata URI (IPFS link to ticket details)
5. **Sign Transaction:** Signs with relayer private key
6. **Send Transaction:** (Currently commented out for safety)
7. **Wait for Confirmation:** Monitors transaction status

## Next Steps

### 1. Deploy Ticket NFT Contract

Deploy your ERC-721 ticket contract to Polygon Amoy:

```bash
cd /workspaces/africa-railways
npx hardhat run blockchain/scripts/deploy.js --network polygon
```

Update the contract address in the minting script.

### 2. Generate Contract Bindings

Use `abigen` to generate Go bindings for your contract:

```bash
# Install abigen
go install github.com/ethereum/go-ethereum/cmd/abigen@latest

# Generate bindings
abigen --abi=blockchain/artifacts/contracts/TicketNFT.sol/TicketNFT.json \
       --pkg=contracts \
       --out=backend/pkg/contracts/ticket_nft.go
```

### 3. Update Minting Logic

Replace the placeholder transaction with actual contract call:

```go
import "your-project/backend/pkg/contracts"

// Create contract instance
ticketNFT, err := contracts.NewTicketNFT(contractAddr, client)

// Call mint function
tx, err := ticketNFT.SafeMint(auth, passengerAddr, tokenURI)
```

### 4. Enable Transaction Sending

Once tested, uncomment the transaction sending code in `main.go`:

```go
err = client.SendTransaction(ctx, signedTx)
if err != nil {
    log.Fatalf("Failed to send transaction: %v", err)
}
```

## Security Notes

- ✅ Private key is stored in `.env` (gitignored)
- ✅ Never commit `.env` to version control
- ✅ Use environment variables in production
- ✅ Consider using a key management service (AWS KMS, HashiCorp Vault)
- ⚠️ This is a testnet wallet - do not use on mainnet without proper security review

## Monitoring

### View Transactions

- **PolygonScan Amoy:** [https://amoy.polygonscan.com/address/0xYourRelayerAddressHere](https://amoy.polygonscan.com/address/0xYourRelayerAddressHere)

### Check Balance

```bash
cd backend
go run cmd/mint-ticket/main.go
```

## Troubleshooting

### "Wallet has 0 balance"

Fund the wallet from the Polygon faucet (see Setup Steps).

### "Failed to connect to Alchemy"

Check that `POLYGON_RPC_URL` is correctly set in `.env`.

### "Failed to load private key"

Ensure `POLYGON_PRIVATE_KEY` starts with `0x` and is a valid hex string.

### "Transaction failed"

- Check wallet has sufficient MATIC for gas
- Verify contract address is correct
- Check transaction data is properly encoded

## Resources

- [Polygon Documentation](https://docs.polygon.technology/)
- [Alchemy Documentation](https://docs.alchemy.com/)
- [go-ethereum Documentation](https://geth.ethereum.org/docs)
- [Hardhat Documentation](https://hardhat.org/docs)
