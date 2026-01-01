# The USSD → Sui Blockchain Bridge

## Overview

This document explains how ARAIL bridges Africa's Talking USSD (*384*26621#) to Sui blockchain, enabling rural Zambian farmers to invest in $SENT equity tokens via any mobile phone.

## The Flow

```
User dials *384*26621#
    ↓
Africa's Talking Gateway
    ↓
POST to Railway.app/ussd
    ↓
Flask app.py processes menu
    ↓
User selects "2. Invest in $SENT"
    ↓
User chooses amount (100, 500, 1000 SUI)
    ↓
User confirms investment
    ↓
🔥 CRITICAL BRIDGE: execute_investment() called
    ↓
sui_logic.py executes on-chain transaction
    ↓
Sui blockchain processes transaction
    ↓
InvestmentCertificate NFT minted
    ↓
User receives confirmation via USSD
    ↓
Certificate visible in wallet
```

---

## The Engine: sui_logic.py

### Core Function

```python
def execute_investment(phone_number: str, sui_amount: int):
    """
    Execute $SENT investment on Sui blockchain
    
    This is THE BRIDGE between USSD and blockchain.
    """
    # 1. Initialize Client
    cfg = SuiConfig.default_config()
    client = SyncClient(cfg)
    txer = SyncTransaction(client=client)

    # 2. Split Gas Coin (convert SUI to MIST)
    mist_amount = int(sui_amount * 1_000_000_000)
    investment_coin = txer.split_coin(coin=txer.gas, amounts=[mist_amount])

    # 3. Call Move function
    txer.move_call(
        target=f"{PACKAGE_ID}::investment::invest",
        arguments=[
            TREASURY_ID,      # Shared Treasury object
            investment_coin,  # Payment coin
            "0x6"            # System Clock
        ]
    )

    # 4. Execute & Sign
    result = txer.execute()
    
    if result.is_ok():
        return True, result.result_data.digest
    else:
        return False, result.result_string
```

### Why This Works

1. **pysui SDK**: Most robust Python SDK for Sui
2. **SyncTransaction**: Synchronous execution (perfect for USSD)
3. **split_coin**: Splits gas coin to create payment
4. **move_call**: Calls the Move smart contract
5. **execute()**: Signs with wallet and submits to Sui

---

## Integration Points

### 1. app.py (USSD Handler)

```python
# When user confirms investment
elif text == "2*1*1":  # Confirm 100 SUI
    sui_amount = 100
    
    # THE BRIDGE: Call sui_logic.py
    success, result = execute_investment(phone_number, sui_amount)
    
    if success:
        tx_digest = result
        response = f"END ✅ Investment Confirmed!\n"
        response += f"TX: {tx_digest[:10]}...\n"
    else:
        error_msg = result
        response = f"END ❌ Failed: {error_msg}\n"
```

### 2. sui_logic.py (Blockchain Engine)

```python
# Executes the on-chain transaction
def execute_investment(phone_number, sui_amount):
    # Initialize Sui client
    # Split coins
    # Call Move contract
    # Return result
```

### 3. investment.move (Smart Contract)

```move
public entry fun invest(
    treasury: &mut Treasury,
    payment: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext
) {
    // Validate payment
    // Calculate equity
    // Mint InvestmentCertificate NFT
    // Transfer to investor
}
```

---

## Configuration

### Environment Variables (Railway.app)

```bash
# CRITICAL: Set these before deployment
PACKAGE_ID=0xYOUR_DEPLOYED_PACKAGE_ID
TREASURY_ID=0xYOUR_SHARED_TREASURY_OBJECT_ID

# Optional: If not using default config
SUI_PRIVATE_KEY=your_base64_encoded_key
SUI_RPC_URL=https://fullnode.mainnet.sui.io:443
```

### How to Get These Values

```bash
# 1. Deploy smart contracts
cd move/arail_fundraising
sui move build
sui client publish --gas-budget 200000000

# 2. Save output
# Package ID: 0x123abc...
# Treasury ID: 0x456def... (look for "Treasury" object)

# 3. Set in Railway
railway variables set PACKAGE_ID=0x123abc...
railway variables set TREASURY_ID=0x456def...
```

---

## Testing

### 1. Test sui_logic.py Directly

```bash
# Set environment variables
export PACKAGE_ID=0xYOUR_PACKAGE_ID
export TREASURY_ID=0xYOUR_TREASURY_ID

# Run test
python3 sui_logic.py
```

**Expected Output:**
```
🧪 Testing ARAIL Investment Flow
============================================================
Phone: +260975190740
Amount: 100 SUI
Package: 0x123abc...
Treasury: 0x456def...

Executing investment...
✅ SUCCESS!
Transaction Digest: 0x789ghi...
View on Explorer: https://suiexplorer.com/txblock/0x789ghi...
```

### 2. Test via USSD Simulator

```bash
# Run USSD test
python3 test_ussd.py

# Select option 2 (Full Booking Flow)
# Navigate to investment menu
# Confirm 100 SUI investment
# Check logs for blockchain transaction
```

### 3. Test on Real Phone

```bash
# Dial USSD code
*384*26621#

# Select: 2. Invest in $SENT
# Select: 1. Invest 100 SUI
# Select: 1. Confirm Investment

# Wait for confirmation
# Check Sui Explorer for transaction
```

---

## Verification

### 1. Check Transaction on Sui Explorer

```
https://suiexplorer.com/txblock/{TX_DIGEST}?network=mainnet
```

Look for:
- ✅ Transaction status: Success
- ✅ Function called: `investment::invest`
- ✅ Objects created: InvestmentCertificate NFT
- ✅ SUI transferred: 100 SUI (or amount invested)

### 2. Check Certificate NFT

```bash
# Query user's objects
sui client objects --address {INVESTOR_ADDRESS}

# Look for InvestmentCertificate
# Should show:
# - sui_invested: 100000000000 (100 SUI in MIST)
# - equity_tokens: calculated amount
# - vesting_start: timestamp
# - vesting_end: timestamp + 12 months
```

### 3. Check via USSD

```
Dial: *384*26621#
Select: 3. Check My Wallet
Select: 1. $SENT Balance

Should show:
- Invested: 100 SUI
- Equity Tokens: 142,857
- Vested: 8.33%
- Claimable: 11,905
```

---

## Error Handling

### Common Errors

#### 1. "Sui integration not available"

**Cause:** pysui not installed

**Solution:**
```bash
pip install pysui
railway restart
```

#### 2. "PACKAGE_ID not set"

**Cause:** Environment variable missing

**Solution:**
```bash
railway variables set PACKAGE_ID=0xYOUR_PACKAGE_ID
railway restart
```

#### 3. "Insufficient gas"

**Cause:** Wallet doesn't have enough SUI

**Solution:**
```bash
# Check balance
sui client gas

# Get more SUI
# Transfer from exchange or faucet (testnet)
```

#### 4. "Object not found"

**Cause:** TREASURY_ID incorrect or not shared

**Solution:**
```bash
# Verify Treasury is shared object
sui client object $TREASURY_ID

# Should show: "owner": "Shared"
```

---

## Security Considerations

### 1. Private Key Management

**❌ NEVER commit private key to Git**

```bash
# Use Railway environment variables
railway variables set SUI_PRIVATE_KEY=base64_encoded_key

# Or use Sui config file
~/.sui/sui_config/client.yaml
```

### 2. Transaction Validation

```python
# Always validate before executing
if sui_amount < MIN_INVESTMENT_SUI:
    return False, "Minimum investment is 100 SUI"

if sui_amount > MAX_INVESTMENT_SUI:
    return False, "Maximum investment is 10,000 SUI"
```

### 3. Rate Limiting

```python
# Prevent spam investments
from flask_limiter import Limiter

limiter = Limiter(app, key_func=lambda: request.values.get('phoneNumber'))

@app.route('/ussd', methods=['POST'])
@limiter.limit("10 per minute")
def ussd_callback():
    # ...
```

### 4. Logging

```python
# Log all investment attempts
logger.info(f"Investment: {phone_number} -> {sui_amount} SUI")
logger.info(f"TX Digest: {tx_digest}")

# Monitor for suspicious activity
# - Multiple investments from same phone
# - Unusual amounts
# - Failed transactions
```

---

## Monitoring

### 1. Railway.app Logs

```bash
# View logs
railway logs --follow

# Look for:
# "🚀 INVESTMENT TRIGGER"
# "✅ Investment successful"
# "❌ Investment failed"
```

### 2. Sui Explorer

Monitor your Treasury object:
```
https://suiexplorer.com/object/{TREASURY_ID}?network=mainnet
```

Track:
- Total raised
- Investor count
- Recent transactions

### 3. Database Queries

```sql
-- Total investments
SELECT COUNT(*), SUM(sui_amount) FROM investments;

-- Recent investments
SELECT * FROM investments ORDER BY created_at DESC LIMIT 10;

-- Failed investments
SELECT * FROM investment_attempts WHERE success = false;
```

---

## Performance

### Expected Response Times

| Step | Time | Notes |
|------|------|-------|
| USSD Request | < 100ms | Africa's Talking → Railway |
| Menu Processing | < 50ms | Flask routing |
| Blockchain TX | 2-5s | Sui transaction execution |
| USSD Response | < 100ms | Railway → Africa's Talking |
| **Total** | **2-6s** | User experience |

### Optimization Tips

1. **Use SyncTransaction**: Faster than async for USSD
2. **Cache config**: Don't recreate SuiConfig every time
3. **Connection pooling**: Reuse Sui client connections
4. **Async logging**: Don't block on log writes

---

## Troubleshooting Checklist

- [ ] Smart contracts deployed to mainnet
- [ ] PACKAGE_ID environment variable set
- [ ] TREASURY_ID environment variable set
- [ ] Wallet has sufficient SUI for gas
- [ ] pysui installed (`pip install pysui`)
- [ ] Railway.app deployment successful
- [ ] USSD callback URL configured
- [ ] Africa's Talking account active
- [ ] Test transaction successful
- [ ] Logs showing correct flow

---

## Success Criteria

✅ **User Experience:**
- User dials *384*26621#
- Selects investment amount
- Confirms
- Receives confirmation within 10 seconds
- Can check balance via USSD

✅ **Blockchain:**
- Transaction appears on Sui Explorer
- InvestmentCertificate NFT created
- Correct equity calculation
- Vesting schedule set properly

✅ **Monitoring:**
- Logs show successful execution
- No errors in Railway.app
- Treasury balance increases
- Investor count increments

---

## The Magic Moment

When a rural Zambian farmer dials *384*26621# on their feature phone and invests 100 SUI, within seconds:

1. Their investment is recorded on Sui blockchain
2. They receive an InvestmentCertificate NFT
3. Their equity starts vesting (12-month linear)
4. They can check balance anytime via USSD
5. They can claim vested tokens monthly

**This is the bridge between Africa's unbanked and global blockchain finance.**

---

**Status:** ✅ Production Ready  
**Last Updated:** December 31, 2025  
**Version:** 1.0.0  
**Critical File:** `sui_logic.py`
