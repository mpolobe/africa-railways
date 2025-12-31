# ARAIL Fundraising Smart Contract

Milestone-based fundraising contract for Africa Railways Pre-Seed round on Sui blockchain.

## Overview

This Move smart contract enables:
- **$500,000 USD fundraising goal** (~350,000 SUI at $1.44/SUI)
- **10% equity distribution** to investors via Receipt NFTs
- **Minimum investment**: 100 SUI
- **Transparent tracking**: All investments recorded on-chain
- **Equity NFTs**: Each investor receives a Receipt NFT representing their equity stake

## Contract Structure

### Objects

1. **Fund** (Shared Object)
   - `target`: Fundraising goal in MIST (350,000 SUI = 350,000,000,000,000 MIST)
   - `raised`: Current amount raised
   - `investor_count`: Number of investors
   - `active`: Whether fund is still accepting investments

2. **Receipt** (Owned NFT)
   - `fund_id`: Reference to the Fund object
   - `investor`: Investor's address
   - `amount`: Amount invested in MIST
   - `equity_percentage`: Equity in basis points (10000 = 100%)
   - `timestamp`: Investment epoch

### Functions

#### `invest(fund: &mut Fund, payment: Coin<SUI>, ctx: &mut TxContext)`
Public entry function for investors to stake SUI.
- Validates minimum investment (100 SUI)
- Calculates equity percentage
- Issues Receipt NFT to investor
- Emits InvestEvent
- Auto-closes fund when goal reached

#### `withdraw(fund: &mut Fund, amount: u64, ctx: &mut TxContext)`
Owner-only function to withdraw raised funds.
- Only fund owner can call
- Emits WithdrawEvent

#### `get_fund_details(fund: &Fund): (u64, u64, u64, bool)`
View function returning: (target, raised, investor_count, active)

#### `get_receipt_details(receipt: &Receipt): (ID, address, u64, u64, u64)`
View function returning: (fund_id, investor, amount, equity_percentage, timestamp)

## Deployment Instructions

### Prerequisites

```bash
# Install Sui CLI
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui

# Verify installation
sui --version
```

### Step 1: Configure Sui Client

```bash
# Initialize Sui client
sui client

# Create new address or import existing
sui client new-address ed25519

# Get testnet SUI from faucet
sui client faucet

# Check balance
sui client gas
```

### Step 2: Build the Contract

```bash
cd /workspaces/africa-railways/move/arail_fundraising

# Build the package
sui move build

# Run tests (if any)
sui move test
```

### Step 3: Deploy to Testnet

```bash
# Deploy the package
sui client publish --gas-budget 100000000

# Save the output - you'll need:
# 1. Package ID (e.g., 0x123abc...)
# 2. Fund Object ID (the shared object created in init)
```

### Step 4: Update Frontend Configuration

After deployment, update `/workspaces/africa-railways/investor.html`:

```javascript
// Replace these values with your deployed contract
const PACKAGE_ID = "0xYOUR_PACKAGE_ID_HERE";
const FUND_OBJECT_ID = "0xYOUR_FUND_OBJECT_ID_HERE";
```

### Step 5: Deploy to Mainnet (Production)

```bash
# Switch to mainnet
sui client switch --env mainnet

# Ensure you have enough SUI for gas
sui client gas

# Deploy
sui client publish --gas-budget 100000000
```

## Testing the Contract

### Test Investment (Testnet)

```bash
# Get your active address
sui client active-address

# Call invest function
sui client call \
  --package $PACKAGE_ID \
  --module fundraising \
  --function invest \
  --args $FUND_OBJECT_ID "100000000000" \
  --gas-budget 10000000

# Check your Receipt NFT
sui client objects
```

### Query Fund Status

```bash
# View fund details
sui client object $FUND_OBJECT_ID
```

## Integration with Frontend

### Using @suiet/wallet-kit

```javascript
import { useWallet } from "@suiet/wallet-kit";
import { TransactionBlock } from "@mysten/sui.js/transactions";

function InvestButton({ amount }) {
  const { signAndExecuteTransactionBlock } = useWallet();
  
  const handleInvest = async () => {
    const tx = new TransactionBlock();
    
    // Split coins for payment
    const [coin] = tx.splitCoins(tx.gas, [
      tx.pure(amount * 1_000_000_000) // Convert SUI to MIST
    ]);
    
    // Call invest function
    tx.moveCall({
      target: `${PACKAGE_ID}::fundraising::invest`,
      arguments: [
        tx.object(FUND_OBJECT_ID),
        coin
      ],
    });
    
    const result = await signAndExecuteTransactionBlock({
      transactionBlock: tx
    });
    
    console.log("Investment successful:", result.digest);
  };
  
  return <button onClick={handleInvest}>Invest {amount} SUI</button>;
}
```

## Security Considerations

1. **Minimum Investment**: 100 SUI minimum prevents spam
2. **Owner Controls**: Only owner can withdraw funds
3. **Auto-Close**: Fund automatically closes when goal reached
4. **Immutable Receipts**: Receipt NFTs are permanent proof of investment
5. **Event Logging**: All investments logged on-chain

## Equity Calculation

```
Equity % = (Investment Amount / Total Goal) × 10% × 10000 basis points

Example:
- Investment: 1,000 SUI
- Goal: 350,000 SUI
- Equity: (1000 / 350000) × 10% × 10000 = 28.57 basis points = 0.2857%
```

## Roadmap

- [ ] Deploy to Sui Testnet
- [ ] Test with multiple investors
- [ ] Audit smart contract
- [ ] Deploy to Sui Mainnet
- [ ] Integrate with investor portal
- [ ] Add milestone-based vesting
- [ ] Implement governance features

## Support

For technical support or questions:
- Email: investors@africarailways.com
- GitHub: https://github.com/mpolobe/africa-railways
- Telegram: https://t.me/Africoin_Official

## License

Copyright 2025 Africa Railways. All rights reserved.
