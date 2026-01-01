# 🔐 Auto-Detection Feature - Relayer Address

## Overview

The monitor and OCC dashboard now automatically derive your relayer's public address from the private key in `.env`. You no longer need to manually set `RELAYER_ADDRESS` - it's calculated on startup!

---

## ✅ What Changed

### Before (Manual Setup)
```bash
# .env file
RELAYER_PRIVATE_KEY=your_64_character_hex_private_key_here
RELAYER_ADDRESS=0xYourDerivedAddressHere  # Had to set manually
```

### After (Auto-Detection)
```bash
# .env file
RELAYER_PRIVATE_KEY=your_64_character_hex_private_key_here
# RELAYER_ADDRESS is auto-detected! No need to set it.
```

---

## 🚀 How It Works

### 1. Monitor Engine (`monitor.go`)

On startup, the monitor:
1. Loads `.env` from the root directory
2. Reads `RELAYER_PRIVATE_KEY`
3. Derives the public address using ECDSA cryptography
4. Sets `RELAYER_ADDRESS` in the environment
5. Continues with health checks

**Startup Output:**
```
🛰️  Africa Railways Monitor Engine Starting...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 Auto-detected Relayer Address: 0xYourAddressHere
✅ Configuration loaded
   Relayer: 0xYourAddressHere
   Gas Policy: demo-policy
   Monitoring interval: 30 seconds
```

### 2. OCC Dashboard (`dashboard/main.go`)

On startup, the dashboard:
1. Loads `../.env` from the parent directory
2. Reads `RELAYER_PRIVATE_KEY`
3. Derives the public address
4. Sets `RELAYER_ADDRESS` in the environment
5. Starts monitoring with wallet balance tracking

**Startup Output:**
```
🚂 Africa Railways OCC Dashboard Starting...
🔐 Auto-detected Relayer Address: 0xYourAddressHere
✅ OCC Dashboard running on http://localhost:8080
```

---

## 🔧 Implementation Details

### Core Functions

Both `monitor.go` and `dashboard/main.go` now include:

```go
// autoDetectRelayerAddress derives the public address from RELAYER_PRIVATE_KEY
func autoDetectRelayerAddress() error {
    privKeyHex := os.Getenv("RELAYER_PRIVATE_KEY")
    if privKeyHex == "" {
        return fmt.Errorf("RELAYER_PRIVATE_KEY not found in environment")
    }

    address, err := deriveAddress(privKeyHex)
    if err != nil {
        return fmt.Errorf("failed to derive address: %w", err)
    }

    // Set for session use
    os.Setenv("RELAYER_ADDRESS", address)
    log.Printf("🔐 Auto-detected Relayer Address: %s", address)

    return nil
}

// deriveAddress derives the Ethereum address from a private key hex string
func deriveAddress(hexKey string) (string, error) {
    privateKey, err := crypto.HexToECDSA(hexKey)
    if err != nil {
        return "", err
    }

    publicKey := privateKey.Public()
    publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
    if !ok {
        return "", fmt.Errorf("error casting public key to ECDSA")
    }

    return crypto.PubkeyToAddress(*publicKeyECDSA).Hex(), nil
}
```

### Dependencies Added

```go
import (
    "crypto/ecdsa"
    "github.com/ethereum/go-ethereum/crypto"
    "github.com/joho/godotenv"
)
```

---

## 📋 Setup Instructions

### Step 1: Add Private Key to .env

```bash
# Edit .env in the root directory
RELAYER_PRIVATE_KEY=your_64_character_hex_private_key_here
```

**Note:** Remove the `0x` prefix if present!

### Step 2: Run Monitor or Dashboard

```bash
# Run monitor
./monitor

# Or run OCC dashboard
cd dashboard && ./occ-dashboard
```

The address will be automatically detected and displayed on startup.

### Step 3: Verify Auto-Detection

Check that the correct address is being used:

```bash
# For monitor - check logs
./monitor

# For dashboard - check API
curl -s http://localhost:8080/api/metrics | jq '.wallet.address'
```

**Expected Output:**
```json
"0xYourAddressHere"
```

---

## ✅ Benefits

### 1. **No Manual Configuration**
- Don't need to copy/paste addresses
- Reduces human error
- One source of truth (private key)

### 2. **Key Rotation Made Easy**
- Change `RELAYER_PRIVATE_KEY` in `.env`
- Restart services
- Address automatically updates

### 3. **Consistency**
- Monitor and dashboard always use the same address
- No risk of mismatched addresses

### 4. **Security**
- Private key stays in `.env` (gitignored)
- Address derived on-the-fly
- No need to store address separately

---

## 🔍 Verification

### Test Address Derivation

Use the helper script to verify:

```bash
go run get_address.go
```

**Output:**
```
✅ Your RELAYER_ADDRESS is: 0xYourAddressHere
```

### Check Wallet Balance

```bash
curl -s http://localhost:8080/api/metrics | jq '.wallet'
```

**Output:**
```json
{
  "address": "0xYourAddressHere",
  "balance_pol": 0.1,
  "balance_usd": 0.05,
  "estimated_tx_remaining": 500,
  "gas_price_current_gwei": 81.19,
  "low_balance_alert": false
}
```

---

## 🛡️ Security Notes

### ✅ Safe Practices

1. **Keep `.env` in `.gitignore`** - Already configured
2. **Use environment-specific keys** - Different keys for dev/staging/prod
3. **Monitor balance regularly** - Dashboard shows real-time balance
4. **Set up alerts** - Low balance warnings at 0.05 POL

### ⚠️ Important

- Never commit `.env` to Git
- Never share your private key
- Use a dedicated wallet for the relayer
- Keep production keys separate from development

---

## 🔧 Troubleshooting

### "RELAYER_PRIVATE_KEY not found"

**Problem:** Private key not in `.env`

**Solution:**
```bash
# Add to .env
echo "RELAYER_PRIVATE_KEY=your_key_here" >> .env
```

### "Failed to derive address"

**Problem:** Invalid private key format

**Solution:**
- Ensure key is 64 hex characters
- Remove `0x` prefix if present
- Check for typos or extra spaces

### "Wallet balance shows 0"

**Problem:** Wallet not funded

**Solution:**
1. Visit [Polygon Faucet](https://faucet.polygon.technology/)
2. Select "Polygon Amoy"
3. Enter your address (shown in logs)
4. Request testnet POL

### Address doesn't match expected

**Problem:** Wrong private key in `.env`

**Solution:**
```bash
# Verify with helper script
go run get_address.go

# Compare with expected address
# Update RELAYER_PRIVATE_KEY if needed
```

---

## 📊 Current Status

### Your Configuration

```
Private Key: [PROTECTED - stored in .env]
Public Address: [Auto-detected from private key]
Network: Polygon Amoy Testnet
Balance: Check via dashboard
Estimated TX: Calculated based on balance
```

### Services Status

- ✅ Monitor: Auto-detection working
- ✅ OCC Dashboard: Auto-detection working
- ✅ Wallet Balance: Tracking enabled
- ✅ Gas Price: Real-time monitoring
- ✅ Polygon RPC: Connected (Block 31,069,813+)

---

## 🎯 Next Steps

1. **Fund Your Wallet** (if not already done)
   - Get testnet POL from faucet
   - Minimum 0.1 POL recommended

2. **Set Up Gas Policy**
   - Configure Alchemy Gas Manager
   - Add your address as authorized signer
   - Update `GAS_POLICY_ID` in `.env`

3. **Deploy Smart Contracts**
   - Deploy ticket NFT contract
   - Update contract addresses in config

4. **Start All Services**
   - Run `./start-occ.sh` to start full stack
   - Monitor via dashboard at port 8080

---

## 📚 Related Documentation

- `RELAYER_SETUP_GUIDE.md` - Complete relayer setup
- `OCC_ARCHITECTURE.md` - System architecture
- `dashboard/README.md` - Dashboard features
- `get_address.go` - Address derivation helper

---

## 🎉 Summary

**Auto-detection is now live!** Simply add your `RELAYER_PRIVATE_KEY` to `.env` and both the monitor and dashboard will automatically:

1. ✅ Derive your public address
2. ✅ Track wallet balance
3. ✅ Monitor gas prices
4. ✅ Alert on low balance
5. ✅ Display real-time metrics

No manual address configuration needed!
