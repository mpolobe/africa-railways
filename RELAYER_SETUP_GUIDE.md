# 🔐 Relayer Address Setup Guide

This guide will help you configure your relayer wallet address for the OCC Dashboard.

---

## 📋 Prerequisites

You need a **relayer private key** for an Ethereum-compatible wallet. This wallet will be used to:
- Sign gasless transactions via Alchemy Gas Manager
- Mint NFT tickets on Polygon Amoy
- Pay for gas fees (covered by Alchemy Gas Policy)

---

## 🛠️ Step 1: Get Your Private Key

### Option A: Use an Existing Wallet
If you already have a MetaMask or other wallet:

1. Open MetaMask
2. Click the three dots → Account Details → Export Private Key
3. Enter your password
4. Copy the private key (64 hex characters)

### Option B: Create a New Wallet
```bash
# Using cast (Foundry)
cast wallet new

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

⚠️ **IMPORTANT:** Never share your private key or commit it to Git!

---

## 🔧 Step 2: Add Private Key to .env

Edit `/workspaces/africa-railways/.env` and add your private key:

```bash
# Remove the 0x prefix if present
RELAYER_PRIVATE_KEY=your_64_character_hex_private_key_here
```

**Example:**
```bash
RELAYER_PRIVATE_KEY=1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

---

## 🔍 Step 3: Derive Your Relayer Address

Run the helper script to get your public address:

```bash
cd /workspaces/africa-railways
go run get_address.go
```

**Expected Output:**
```
✅ Your RELAYER_ADDRESS is: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

---

## 📝 Step 4: Update .env with Address

Add the derived address to your `.env` file:

```bash
RELAYER_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

---

## 💰 Step 5: Fund Your Relayer Wallet

Your relayer needs POL tokens on Polygon Amoy testnet:

### Get Testnet POL
1. Visit [Polygon Faucet](https://faucet.polygon.technology/)
2. Select "Polygon Amoy"
3. Enter your `RELAYER_ADDRESS`
4. Request tokens

**Recommended Balance:** At least 0.1 POL for testing

---

## 🚀 Step 6: Restart OCC Dashboard

Once configured, restart the dashboard to load the new settings:

```bash
# Stop current dashboard
pkill -f occ-dashboard

# Restart with environment variables
cd /workspaces/africa-railways/dashboard
export RELAYER_ADDRESS=$(grep RELAYER_ADDRESS ../.env | cut -d '=' -f2)
./occ-dashboard
```

---

## ✅ Step 7: Verify Configuration

Check that the dashboard now shows your wallet balance:

```bash
curl -s http://localhost:8080/api/metrics | jq '.wallet'
```

**Expected Output:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "balance_pol": 0.1,
  "balance_usd": 0.08,
  "estimated_tx_remaining": 1000,
  "gas_price_current_gwei": 30,
  "low_balance_alert": false
}
```

---

## 🔐 Security Best Practices

### ✅ DO:
- Keep your private key in `.env` (already in `.gitignore`)
- Use a dedicated wallet for the relayer (not your main wallet)
- Monitor the balance regularly
- Set up alerts for low balance

### ❌ DON'T:
- Commit `.env` to Git
- Share your private key
- Use your main wallet as the relayer
- Store large amounts in the relayer wallet

---

## 🛡️ Alchemy Gas Manager Setup

Your relayer will use Alchemy's Gas Manager for gasless transactions:

1. Go to [Alchemy Dashboard](https://dashboard.alchemy.com/)
2. Navigate to Gas Manager
3. Create a new Gas Policy
4. Add your `RELAYER_ADDRESS` as an authorized signer
5. Copy the Gas Policy ID
6. Update `.env`:
   ```bash
   GAS_POLICY_ID=your_gas_policy_id_here
   ```

---

## 📊 Monitoring Your Relayer

### Check Balance
```bash
curl -s http://localhost:8080/api/metrics | jq '.wallet.balance_pol'
```

### Check Transaction Count
```bash
curl -s http://localhost:8080/api/metrics | jq '.wallet.estimated_tx_remaining'
```

### View Alerts
```bash
curl -s http://localhost:8080/api/alerts
```

The dashboard will automatically alert you when:
- Balance drops below 0.05 POL (warning)
- Balance drops below 0.01 POL (critical)

---

## 🔧 Troubleshooting

### "Error loading .env file"
- Ensure `.env` exists in `/workspaces/africa-railways/`
- Check file permissions: `chmod 600 .env`

### "RELAYER_PRIVATE_KEY not found"
- Verify the key is in `.env` without the `0x` prefix
- Check for extra spaces or newlines

### "Invalid private key"
- Ensure the key is exactly 64 hex characters
- Remove any `0x` prefix
- Check for typos

### Balance shows 0
- Verify you funded the correct address
- Check you're on Polygon Amoy testnet
- Wait a few minutes for faucet transaction to confirm

---

## 📚 Additional Resources

- [Alchemy Gas Manager Docs](https://docs.alchemy.com/docs/gas-manager)
- [Polygon Amoy Faucet](https://faucet.polygon.technology/)
- [MetaMask Export Private Key](https://support.metamask.io/hc/en-us/articles/360015289632)

---

## 🎯 Quick Reference

```bash
# 1. Add private key to .env
echo "RELAYER_PRIVATE_KEY=your_key_here" >> .env

# 2. Get address
go run get_address.go

# 3. Add address to .env
echo "RELAYER_ADDRESS=0x..." >> .env

# 4. Fund wallet at faucet
# https://faucet.polygon.technology/

# 5. Restart dashboard
cd dashboard && ./occ-dashboard
```

---

**Need Help?** Check the OCC Dashboard at port 8080 for real-time monitoring.
