# Balance Monitoring Guide

## Overview

The relayer wallet needs POL tokens to pay for gas fees when minting NFT tickets. This guide covers balance monitoring and management.

## Current Status

✅ **Wallet Funded and Ready**

- **Address:** `0x4C97260183BaD57AbF37f0119695f0607f2c3921`
- **Balance:** 0.1 POL
- **Network:** Polygon Amoy Testnet
- **Estimated Mints:** ~500 transactions

## Quick Balance Check

### Command Line

```bash
cd backend
GOTOOLCHAIN=auto go run cmd/check-balance/main.go
```

### Expected Output

```
💰 Africa Railways - Relayer Balance Checker
==================================================

🔗 Connecting to Polygon Amoy via Alchemy...
✅ Connected to Chain ID: 80002

📍 Relayer Address: 0x4C97260183BaD57AbF37f0119695f0607f2c3921

💰 Fetching Live Balance...

==================================================
Balance: 0.100000 POL
==================================================

✅ Balance is sufficient for minting!

📊 Estimated transactions possible: ~500

🎫 Ready to mint tickets!

⛽ Current Network Gas Price:
   35.00 Gwei

💸 Estimated cost per mint: 0.005250 POL

==================================================
✅ Balance check complete!
```

## Balance Monitoring Function

### Recommended Implementation

```go
// getRelayerBalance fetches and displays the live balance
func getRelayerBalance(client *ethclient.Client, address common.Address) (*big.Float, error) {
    balance, err := client.BalanceAt(context.Background(), address, nil)
    if err != nil {
        return nil, err
    }
    // Convert from Wei to POL (18 decimals)
    fbalance := new(big.Float).SetInt(balance)
    return new(big.Float).Quo(fbalance, big.NewFloat(1e18)), nil
}
```

### Usage Example

```go
import (
    "github.com/ethereum/go-ethereum/common"
    "github.com/ethereum/go-ethereum/ethclient"
)

client, _ := ethclient.Dial(os.Getenv("POLYGON_RPC_URL"))
address := common.HexToAddress("0x4C97260183BaD57AbF37f0119695f0607f2c3921")

balance, err := getRelayerBalance(client, address)
if err != nil {
    log.Fatal(err)
}

fmt.Printf("Balance: %s POL\n", balance.Text('f', 6))
```

## Balance Monitor Package

For production use, the `balance` package provides advanced monitoring:

```go
import "your-project/backend/pkg/balance"

// Create monitor
monitor := balance.NewMonitor(client, address, 0.01) // Min 0.01 POL

// Get current balance
balance, err := monitor.GetBalance()

// Check if sufficient
sufficient, balance, err := monitor.CheckBalance()

// Estimate transactions
txCount, err := monitor.EstimateTransactions(0.0002) // Avg cost per tx

// Get gas price
gasPrice, err := monitor.GetGasPrice()

// Estimate mint cost
cost, err := monitor.EstimateMintCost(150000) // Gas limit
```

## Gas Cost Estimation

### Current Network Conditions

Based on live data:
- **Gas Price:** ~35 Gwei
- **Gas Limit (NFT Mint):** ~150,000
- **Cost per Mint:** ~0.00525 POL

### Calculate Cost

```go
func estimateMintCost(client *ethclient.Client) (*big.Float, error) {
    gasPrice, err := client.SuggestGasPrice(context.Background())
    if err != nil {
        return nil, err
    }
    
    gasLimit := uint64(150000) // Typical for NFT mint
    cost := new(big.Int).Mul(gasPrice, big.NewInt(int64(gasLimit)))
    
    // Convert to POL
    costPOL := new(big.Float).Quo(
        new(big.Float).SetInt(cost),
        big.NewFloat(1e18),
    )
    
    return costPOL, nil
}
```

## Balance Thresholds

### Recommended Levels

| Status | Balance | Action |
|--------|---------|--------|
| 🟢 Good | > 0.05 POL | Continue operations |
| 🟡 Low | 0.01 - 0.05 POL | Plan refill |
| 🔴 Critical | < 0.01 POL | Refill immediately |
| ⚫ Empty | 0 POL | Cannot mint |

### Check Before Minting

```go
func canMint(client *ethclient.Client, address common.Address) (bool, error) {
    balance, err := getRelayerBalance(client, address)
    if err != nil {
        return false, err
    }
    
    minBalance := big.NewFloat(0.01)
    return balance.Cmp(minBalance) >= 0, nil
}
```

## Automated Monitoring

### Continuous Monitoring

```go
import "your-project/backend/pkg/balance"

monitor := balance.NewMonitor(client, address, 0.01)

// Set alert callback
monitor.SetAlertCallback(func(balance *big.Float) {
    log.Printf("⚠️  Low balance alert: %s POL", balance.Text('f', 6))
    // Send email, SMS, or webhook notification
    notifyAdmin(balance)
})

// Set check interval
monitor.SetCheckInterval(5 * time.Minute)

// Start monitoring
stopChan := make(chan bool)
go monitor.StartMonitoring(stopChan)

// Stop when done
stopChan <- true
```

### Integration with Minting

```go
func mintTicketWithBalanceCheck(ticket TicketDetails) error {
    // Check balance before minting
    canMint, err := canMint(client, relayerAddress)
    if err != nil {
        return fmt.Errorf("balance check failed: %w", err)
    }
    
    if !canMint {
        return fmt.Errorf("insufficient balance for minting")
    }
    
    // Proceed with minting
    return mintTicket(ticket)
}
```

## Refilling the Wallet

### Testnet (Polygon Amoy)

**Faucet:**
1. Visit: [https://faucet.polygon.technology](https://faucet.polygon.technology)
2. Enter address: `0x4C97260183BaD57AbF37f0119695f0607f2c3921`
3. Request tokens (usually 0.1 - 0.5 POL per request)
4. Wait 1-2 minutes for confirmation

**Check Transaction:**
```
https://amoy.polygonscan.com/address/0x4C97260183BaD57AbF37f0119695f0607f2c3921
```

### Mainnet (Production)

**Manual Transfer:**
1. Send POL from your main wallet
2. Recommended amount: 1-5 POL
3. Monitor usage and refill as needed

**Automated Refill:**
```go
func autoRefill(client *ethclient.Client, relayer, funder common.Address) error {
    balance, _ := getRelayerBalance(client, relayer)
    
    if balance.Cmp(big.NewFloat(0.1)) < 0 {
        // Transfer 1 POL from funder to relayer
        amount := big.NewInt(1e18) // 1 POL in Wei
        return transferPOL(client, funder, relayer, amount)
    }
    
    return nil
}
```

## Monitoring Dashboard

### Key Metrics to Track

1. **Current Balance**
   - Real-time POL balance
   - Update frequency: Every 5 minutes

2. **Daily Usage**
   - Tickets minted per day
   - POL spent per day
   - Average cost per mint

3. **Projections**
   - Estimated days until refill needed
   - Projected monthly cost

4. **Alerts**
   - Low balance warnings
   - Failed transactions
   - Unusual gas spikes

### Example Dashboard Query

```go
type BalanceMetrics struct {
    CurrentBalance    *big.Float
    DailyMints        int
    DailySpend        *big.Float
    AvgCostPerMint    *big.Float
    EstimatedDaysLeft int
}

func getMetrics(client *ethclient.Client, address common.Address) (*BalanceMetrics, error) {
    balance, err := getRelayerBalance(client, address)
    if err != nil {
        return nil, err
    }
    
    // Calculate metrics
    avgCost := big.NewFloat(0.0002) // Historical average
    dailyMints := 100 // From database
    dailySpend := new(big.Float).Mul(avgCost, big.NewFloat(float64(dailyMints)))
    
    daysLeft := new(big.Float).Quo(balance, dailySpend)
    days, _ := daysLeft.Int64()
    
    return &BalanceMetrics{
        CurrentBalance:    balance,
        DailyMints:        dailyMints,
        DailySpend:        dailySpend,
        AvgCostPerMint:    avgCost,
        EstimatedDaysLeft: int(days),
    }, nil
}
```

## Troubleshooting

### Balance Shows 0 But Faucet Claimed

**Wait Time:** Testnet faucets can take 1-5 minutes to process.

**Check:**
```bash
# Run balance checker multiple times
cd backend
GOTOOLCHAIN=auto go run cmd/check-balance/main.go
```

**Verify on PolygonScan:**
```
https://amoy.polygonscan.com/address/0x4C97260183BaD57AbF37f0119695f0607f2c3921
```

### "Insufficient Funds" Error

**Cause:** Balance too low for gas fees.

**Solution:**
1. Check current balance
2. Refill from faucet
3. Wait for confirmation
4. Retry transaction

### High Gas Costs

**Cause:** Network congestion.

**Solutions:**
1. Wait for lower gas prices
2. Increase gas limit slightly
3. Use gas price oracle for optimal timing

## Best Practices

1. **Monitor Regularly**
   - Check balance daily
   - Set up automated alerts
   - Track spending patterns

2. **Maintain Buffer**
   - Keep minimum 0.05 POL
   - Refill before critical level
   - Plan for usage spikes

3. **Optimize Gas Usage**
   - Batch transactions when possible
   - Monitor gas prices
   - Use appropriate gas limits

4. **Security**
   - Never expose private key
   - Use separate wallet for relayer
   - Monitor for unauthorized transactions

5. **Documentation**
   - Log all refills
   - Track spending trends
   - Document gas optimizations

## Resources

- **Polygon Faucet:** [https://faucet.polygon.technology](https://faucet.polygon.technology)
- **PolygonScan:** [https://amoy.polygonscan.com](https://amoy.polygonscan.com)
- **Gas Tracker:** [https://polygonscan.com/gastracker](https://polygonscan.com/gastracker)
- **Alchemy Dashboard:** [https://dashboard.alchemy.com](https://dashboard.alchemy.com)
