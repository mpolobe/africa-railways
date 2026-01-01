# ARAIL Wallet Balance Feature

## Overview

The Wallet Balance feature allows investors to check their $SENT token holdings directly from their feature phones via USSD, with optional SMS delivery of detailed information.

## User Flow

```
User dials: *384*26621#
    ↓
Main Menu → 3. Check My Wallet
    ↓
Wallet Menu → 1. $SENT Balance
    ↓
Query Sui Blockchain
    ↓
Display Balance:
├── Total tokens allocated
├── Vested tokens (claimable)
├── Locked tokens (still vesting)
└── Vesting progress %
    ↓
User Options:
├── 1. Claim Vested Tokens → Execute on-chain claim
├── 2. SMS Full Details → Receive SMS with breakdown
└── 0. Back
```

## Technical Architecture

### 1. USSD Menu Flow

**Path: `app.py`**

```python
# Menu: 3*1 - Check $SENT Balance
elif text == "3*1":
    success, data = check_investment_status(phone_number)
    
    if success and data.get('has_investment'):
        # Display balance with claim option
        response = f"CON Your $SENT Balance:\n\n"
        response += f"Total: {data['equity_tokens']:,} tokens\n"
        response += f"Vested: {data['vested_tokens']:,} ({data['vesting_progress']:.1f}%)\n"
        response += f"Locked: {data['locked_tokens']:,}\n\n"
        
        if data['claimable_tokens'] > 0:
            response += f"1. Claim {data['claimable_tokens']:,} Tokens\n"
```

### 2. Blockchain Query

**Path: `sui_logic.py`**

```python
def check_investment_status(phone_number: str):
    """
    Queries Sui blockchain for InvestmentCertificate NFTs
    
    Returns:
        (success: bool, data: dict)
        
    Data structure:
        {
            'has_investment': bool,
            'total_invested': int,        # Total SUI invested
            'equity_tokens': int,         # Total $SENT allocated
            'vested_tokens': int,         # Tokens vested so far
            'locked_tokens': int,         # Tokens still locked
            'vesting_progress': float,    # % complete
            'claimable_tokens': int,      # Ready to claim
            'days_until_fully_vested': int,
            'certificate_id': str         # NFT object ID
        }
    """
```

### 3. Token Claiming

**Path: `app.py` → Menu 3*1*1**

```python
# Execute on-chain claim
success, result = claim_vested_tokens(phone_number, certificate_id)

if success:
    # Send SMS confirmation
    if SMS_AVAILABLE:
        send_vesting_reminder_sms(phone_number, claimable_tokens)
    
    response = f"END ✅ Tokens Claimed!\n\n"
    response += f"Amount: {claimable_tokens:,} $SENT\n"
    response += f"TX: {tx_digest[:10]}...\n"
```

### 4. SMS Notifications

**Path: `notifications.py`**

```python
def send_vesting_reminder_sms(phone_number: str, claimable_tokens: int, wallet_data: dict = None):
    """
    Sends wallet balance via SMS
    
    Two modes:
    1. Simple reminder (automated monthly)
    2. Detailed balance (on-demand via USSD 3*1*2)
    """
    
    if wallet_data:
        # Detailed balance - OPTIMIZED to 116 chars (single SMS)
        message = (
            f"$SENT Balance:\n"
            f"Total: {wallet_data['equity_tokens']:,}\n"
            f"Vested: {wallet_data['vested_tokens']:,} ({wallet_data['vesting_progress']:.1f}%)\n"
            f"Locked: {wallet_data['locked_tokens']:,}\n"
            f"Claimable: {claimable_tokens:,}\n\n"
            f"Dial *384*26621#→3→1 to claim"
        )
```

## SMS Character Optimization

All SMS messages are optimized to stay under 160 characters (single SMS segment) to minimize costs:

| Message Type | Characters | Segments | Cost Factor |
|-------------|-----------|----------|-------------|
| Wallet Balance (Detailed) | 116 | 1 | ✅ Optimized |
| Vesting Reminder | 140 | 1 | ✅ Optimized |
| Investment Confirmation | 145 | 1 | ✅ Optimized |
| Ticket Confirmation | 137 | 1 | ✅ Optimized |

**Cost Savings:**
- Single SMS: ~$0.01 USD per message
- Multi-segment: ~$0.02+ USD per message
- **Savings: 50%+ on high-volume campaigns**

## Production Implementation

### 1. Environment Variables

Add to Railway.app or your deployment platform:

```bash
# Africa's Talking SMS
AT_USERNAME=your_username
AT_API_KEY=your_api_key
AT_SENDER_ID=ARAIL

# Sui Blockchain
PACKAGE_ID=0xYOUR_DEPLOYED_PACKAGE_ID
TREASURY_ID=0xYOUR_SHARED_TREASURY_OBJECT_ID
SUI_PRIVATE_KEY=your_private_key
```

### 2. Database Schema

For production, map phone numbers to wallet addresses:

```sql
CREATE TABLE investor_wallets (
    phone_number VARCHAR(20) PRIMARY KEY,
    wallet_address VARCHAR(66) NOT NULL,
    certificate_id VARCHAR(66),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_claim_at TIMESTAMP
);

CREATE INDEX idx_wallet_address ON investor_wallets(wallet_address);
```

### 3. Real Blockchain Queries

Update `sui_logic.py` to query actual blockchain data:

```python
def check_investment_status(phone_number: str):
    # 1. Get wallet address from database
    wallet_address = get_wallet_for_phone(phone_number)
    
    # 2. Query Sui blockchain
    cfg = SuiConfig.default_config()
    client = SyncClient(cfg)
    
    # 3. Get InvestmentCertificate objects
    objects = client.get_objects_owned_by_address(wallet_address)
    certificates = [obj for obj in objects 
                   if "InvestmentCertificate" in obj.object_type]
    
    # 4. Parse certificate data
    cert = certificates[0]  # Assuming one certificate per investor
    
    # 5. Calculate vesting progress
    current_time = int(time.time())
    vesting_start = cert.data.vesting_start
    vesting_duration = 365 * 24 * 60 * 60  # 12 months in seconds
    
    elapsed = current_time - vesting_start
    vesting_progress = min(100, (elapsed / vesting_duration) * 100)
    
    vested_tokens = int(cert.data.equity_tokens * vesting_progress / 100)
    locked_tokens = cert.data.equity_tokens - vested_tokens
    
    return True, {
        'has_investment': True,
        'total_invested': cert.data.sui_invested,
        'equity_tokens': cert.data.equity_tokens,
        'vested_tokens': vested_tokens,
        'locked_tokens': locked_tokens,
        'vesting_progress': vesting_progress,
        'claimable_tokens': vested_tokens - cert.data.claimed_tokens,
        'days_until_fully_vested': int((vesting_duration - elapsed) / 86400),
        'certificate_id': cert.object_id
    }
```

## Testing

### Manual USSD Testing

1. **Check Balance:**
   ```
   Dial: *384*26621#
   Enter: 3 (Check My Wallet)
   Enter: 1 ($SENT Balance)
   ```

2. **Claim Tokens:**
   ```
   From balance screen
   Enter: 1 (Claim Tokens)
   ```

3. **Request SMS:**
   ```
   From balance screen
   Enter: 2 (SMS Full Details)
   ```

### Automated Testing

```bash
# Test blockchain queries
python3 sui_logic.py

# Test SMS notifications
python3 notifications.py

# Test USSD flow
python3 app.py
```

## Monitoring

### Key Metrics

1. **Balance Queries:**
   - Track daily/weekly query volume
   - Monitor query success rate
   - Alert on blockchain query failures

2. **Token Claims:**
   - Track claim frequency
   - Monitor claim success rate
   - Alert on failed claims

3. **SMS Delivery:**
   - Track SMS delivery rate
   - Monitor character count distribution
   - Alert on multi-segment messages

### Logging

All operations are logged with structured data:

```python
logger.info(f"📊 Balance check for {phone_number}")
logger.info(f"🎁 Claiming {claimable} tokens for {phone_number}")
logger.info(f"📱 Wallet SMS sent to {phone_number} ({len(message)} chars)")
```

## Cost Analysis

### SMS Costs (Africa's Talking)

**Scenario: 1,000 investors checking balance monthly**

| Optimization | Chars/SMS | Segments | Cost/SMS | Monthly Cost |
|-------------|-----------|----------|----------|--------------|
| Optimized | 116 | 1 | $0.01 | $10 |
| Unoptimized | 215 | 2 | $0.02 | $20 |
| **Savings** | - | - | - | **$10/month** |

**Annual savings: $120 for 1,000 investors**

### Blockchain Costs

- Query operations: Free (read-only)
- Claim transactions: ~0.001 SUI gas (~$0.0014 USD)
- Paid by investor's wallet

## Security Considerations

1. **Phone Number Verification:**
   - Implement OTP verification for first-time users
   - Rate limit balance queries (max 10/day per number)

2. **Wallet Association:**
   - Secure database storage of phone-to-wallet mappings
   - Encrypt sensitive data at rest

3. **Transaction Signing:**
   - Use secure key management (AWS KMS, HashiCorp Vault)
   - Never log private keys

4. **SMS Security:**
   - Don't include full wallet addresses in SMS
   - Use shortened transaction hashes
   - Include warning about phishing

## Future Enhancements

1. **Multi-language Support:**
   - Swahili, French, Portuguese
   - Language selection in main menu

2. **Price Alerts:**
   - SMS when $SENT price changes significantly
   - Customizable alert thresholds

3. **Vesting Calendar:**
   - SMS reminders before major vesting milestones
   - Monthly vesting summaries

4. **Referral Tracking:**
   - Track referrals via USSD
   - Bonus tokens for successful referrals

## Support

For technical issues:
- Email: tech@africarailways.com
- Phone: +260 977 000 000
- Docs: africarailways.com/docs

For investor support:
- Email: investors@africarailways.com
- USSD: *384*26621# → 4 (Help & Support)
