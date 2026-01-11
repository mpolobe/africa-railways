# Ticket Clearing API Documentation
## Payment vs Reward Token Separation

**Last Updated**: January 11, 2026  
**API Version**: v1.0  
**Status**: Production

---

## Token Architecture

### Global Constants
```python
# /scripts/ona_website_updates.py

# GLOBAL CONSTANTS FOR ONA
PAYMENT_TOKEN = "AFC"   # Africoin (Operational Currency)
REWARD_TOKEN = "AFRC"   # Rail Credits (Loyalty Points)
GOVERNANCE_TOKEN = "SENT"  # Sentinel (Infrastructure Governance)

def generate_ticket_ui_logic():
    print(f"--- UI UPDATE: TICKET CHECKOUT ---")
    print(f"Primary Button: 'Pay with {PAYMENT_TOKEN}'")
    print(f"Secondary Text: 'You will earn 50 {REWARD_TOKEN} for this trip.'")
    print(f"Status: ${GOVERNANCE_TOKEN} governance layer monitoring transaction fee-capture.")

if __name__ == "__main__":
    generate_ticket_ui_logic()
```

---

## API Endpoints

### 1. Ticket Purchase (Payment with AFC)

**Endpoint**: `POST /api/v1/tickets/purchase`

**Purpose**: Process ticket payment using AFC (Africoin) tokens

**Request**:
```json
{
  "route": {
    "from": "Kapiri Mposhi",
    "to": "Dar es Salaam"
  },
  "class": "economy",
  "passengers": 2,
  "date": "2026-02-15",
  "payment": {
    "token": "AFC",
    "amount": 50.00,
    "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }
}
```

**Response**:
```json
{
  "status": "success",
  "booking_reference": "AFC-7X9K2M4P",
  "payment": {
    "token": "AFC",
    "amount_paid": 50.00,
    "transaction_hash": "0x8f3e2b1a...",
    "blockchain": "Sui",
    "confirmation_time": "0.8s"
  },
  "rewards": {
    "token": "AFRC",
    "amount_earned": 5.00,
    "reason": "10% cashback on ticket purchase",
    "vesting": "immediate"
  },
  "governance_fee": {
    "token": "SENT",
    "amount": 0.50,
    "purpose": "Infrastructure monitoring",
    "distributed_to": "stakers"
  },
  "ticket": {
    "nft_id": "ticket_12345",
    "qr_code": "data:image/png;base64,...",
    "valid_until": "2026-02-15T23:59:59Z"
  }
}
```

**Token Flow**:
```
Customer Wallet (AFC)
    ↓ 50 AFC
Railway Treasury (AFC)
    ↓ 5 AFC (10% cashback)
Customer Wallet (AFRC) ← Reward
    ↓ 0.5 AFC (1% governance fee)
SENT Stakers ← Governance Fee
```

---

### 2. Reward Balance Check (AFRC)

**Endpoint**: `GET /api/v1/rewards/balance`

**Purpose**: Check AFRC loyalty reward balance

**Request**:
```json
{
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Response**:
```json
{
  "status": "success",
  "balance": {
    "token": "AFRC",
    "available": 125.50,
    "staked": 500.00,
    "pending": 12.30
  },
  "earning_rate": {
    "travel_cashback": "10%",
    "staking_apy": "12%",
    "governance_bonus": "2%"
  },
  "usage_options": [
    "Stake for 12% APY",
    "Vote on governance proposals",
    "Trade on exchanges",
    "Upgrade cabin class (coming soon)",
    "Access station lounges (coming soon)"
  ],
  "cannot_use_for": [
    "Ticket purchases (use AFC instead)",
    "Direct payment for services"
  ]
}
```

---

### 3. Upgrade with AFRC (Future Feature)

**Endpoint**: `POST /api/v1/tickets/upgrade`

**Purpose**: Use AFRC rewards for cabin upgrades

**Request**:
```json
{
  "booking_reference": "AFC-7X9K2M4P",
  "upgrade_to": "business",
  "payment": {
    "token": "AFRC",
    "amount": 20.00
  }
}
```

**Response**:
```json
{
  "status": "success",
  "upgrade": {
    "from": "economy",
    "to": "business",
    "cost": {
      "token": "AFRC",
      "amount": 20.00
    }
  },
  "new_balance": {
    "token": "AFRC",
    "available": 105.50
  },
  "note": "Upgrade applied to booking AFC-7X9K2M4P"
}
```

---

### 4. Worker Rewards (SENT + AFRC)

**Endpoint**: `POST /api/v1/sentinel/submit-report`

**Purpose**: Submit safety report and earn rewards

**Request**:
```json
{
  "worker_id": "SENT-WORKER-12345",
  "report_type": "track_inspection",
  "location": {
    "latitude": -13.9708,
    "longitude": 28.6708,
    "checkpoint": "KM-450"
  },
  "status": "clear",
  "timestamp": "2026-01-11T14:30:00Z",
  "signature": "0x8f3e2b1a..."
}
```

**Response**:
```json
{
  "status": "success",
  "report_id": "REPORT-98765",
  "rewards": {
    "signaling_data": {
      "token": "SENT",
      "amount": 2.00,
      "reason": "Verified track occupancy data",
      "vesting": "immediate"
    },
    "safety_bonus": {
      "token": "AFRC",
      "amount": 5.00,
      "reason": "Safety milestone: 100 reports completed",
      "vesting": "immediate"
    }
  },
  "worker_stats": {
    "total_reports": 100,
    "accuracy_rate": "98.5%",
    "next_milestone": {
      "reports_needed": 50,
      "bonus": "10 AFRC"
    }
  }
}
```

**Token Flow for Workers**:
```
Worker submits report
    ↓
Blockchain verification
    ↓
Worker Wallet (SENT) ← 2 SENT (signaling data)
    ↓
Worker Wallet (AFRC) ← 5 AFRC (safety bonus)
```

---

### 5. Token Conversion (Not Direct)

**Endpoint**: `GET /api/v1/tokens/exchange-info`

**Purpose**: Get information about token exchange (via external DEX)

**Response**:
```json
{
  "status": "info",
  "message": "AFRC cannot be directly converted to AFC. Use external exchanges.",
  "exchange_process": [
    "1. Trade AFRC for USDT on Cetus DEX",
    "2. Trade USDT for AFC on Sui DEX",
    "3. Use AFC for ticket purchases"
  ],
  "supported_exchanges": [
    {
      "name": "Cetus DEX",
      "pair": "AFRC/USDT",
      "liquidity": "$50,000",
      "url": "https://cetus.zone"
    },
    {
      "name": "Sui DEX",
      "pair": "AFC/USDT",
      "liquidity": "$100,000",
      "url": "https://sui.io/dex"
    }
  ],
  "note": "AFC is a stablecoin (1 AFC = 1 USD). AFRC is market-priced."
}
```

---

## Error Handling

### Error: Attempting to Pay with AFRC

**Request**:
```json
{
  "payment": {
    "token": "AFRC",
    "amount": 50.00
  }
}
```

**Response**:
```json
{
  "status": "error",
  "error_code": "INVALID_PAYMENT_TOKEN",
  "message": "AFRC cannot be used for ticket purchases. Please use AFC (Africoin).",
  "details": {
    "provided_token": "AFRC",
    "required_token": "AFC",
    "afrc_usage": [
      "Stake for 12% APY",
      "Vote on governance",
      "Upgrade cabin class",
      "Access station lounges"
    ]
  },
  "help": {
    "how_to_get_afc": "https://africarailways.com/buy-afc",
    "convert_afrc": "Trade AFRC on exchanges, then buy AFC with proceeds"
  }
}
```

---

## Webhook Events

### Event: Ticket Purchased

```json
{
  "event": "ticket.purchased",
  "timestamp": "2026-01-11T14:30:00Z",
  "data": {
    "booking_reference": "AFC-7X9K2M4P",
    "payment_token": "AFC",
    "amount": 50.00,
    "reward_token": "AFRC",
    "reward_amount": 5.00,
    "governance_fee_token": "SENT",
    "governance_fee_amount": 0.50
  }
}
```

### Event: Reward Earned

```json
{
  "event": "reward.earned",
  "timestamp": "2026-01-11T14:30:00Z",
  "data": {
    "wallet_address": "0x742d35Cc...",
    "token": "AFRC",
    "amount": 5.00,
    "reason": "ticket_cashback",
    "source_transaction": "0x8f3e2b1a..."
  }
}
```

### Event: Worker Report Submitted

```json
{
  "event": "sentinel.report_submitted",
  "timestamp": "2026-01-11T14:30:00Z",
  "data": {
    "worker_id": "SENT-WORKER-12345",
    "report_id": "REPORT-98765",
    "rewards": {
      "SENT": 2.00,
      "AFRC": 5.00
    }
  }
}
```

---

## Rate Limits

| Endpoint | Rate Limit | Burst |
|----------|------------|-------|
| `/api/v1/tickets/purchase` | 10 req/min | 20 |
| `/api/v1/rewards/balance` | 60 req/min | 100 |
| `/api/v1/sentinel/submit-report` | 30 req/min | 50 |
| `/api/v1/tokens/exchange-info` | 100 req/min | 200 |

---

## Authentication

All API requests require authentication via JWT token:

```bash
curl -X POST https://api.africarailways.com/api/v1/tickets/purchase \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"route": {...}, "payment": {"token": "AFC", "amount": 50.00}}'
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import { AfricaRailwaysSDK } from '@africarailways/sdk';

const sdk = new AfricaRailwaysSDK({
  apiKey: process.env.API_KEY,
  network: 'mainnet'
});

// Purchase ticket with AFC
const booking = await sdk.tickets.purchase({
  route: { from: 'Kapiri Mposhi', to: 'Dar es Salaam' },
  class: 'economy',
  passengers: 2,
  payment: {
    token: 'AFC',  // Only AFC accepted for payments
    amount: 50.00
  }
});

console.log(`Booking: ${booking.reference}`);
console.log(`Earned: ${booking.rewards.amount} AFRC`);
```

### Python

```python
from africarailways import AfricaRailwaysClient

client = AfricaRailwaysClient(api_key=os.getenv('API_KEY'))

# Purchase ticket with AFC
booking = client.tickets.purchase(
    route={'from': 'Kapiri Mposhi', 'to': 'Dar es Salaam'},
    ticket_class='economy',
    passengers=2,
    payment={
        'token': 'AFC',  # Only AFC accepted for payments
        'amount': 50.00
    }
)

print(f"Booking: {booking['reference']}")
print(f"Earned: {booking['rewards']['amount']} AFRC")
```

---

## Testing

### Testnet Endpoints

- **Base URL**: `https://testnet-api.africarailways.com`
- **AFC Faucet**: `https://testnet.africarailways.com/faucet`
- **AFRC Faucet**: `https://testnet.africarailways.com/rewards-faucet`

### Test Tokens

```bash
# Get test AFC tokens
curl -X POST https://testnet.africarailways.com/faucet \
  -d '{"wallet": "0x742d35Cc...", "token": "AFC", "amount": 100}'

# Get test AFRC tokens
curl -X POST https://testnet.africarailways.com/rewards-faucet \
  -d '{"wallet": "0x742d35Cc...", "token": "AFRC", "amount": 50}'
```

---

## Support

### Documentation
- **API Reference**: https://docs.africarailways.com/api
- **Token Economics**: https://docs.africarailways.com/tokens
- **SDK Documentation**: https://docs.africarailways.com/sdk

### Contact
- **Email**: api-support@africarailways.com
- **Discord**: https://discord.gg/africarailways
- **GitHub**: https://github.com/mpolobe/africa-railways

---

**Document Version**: 1.0  
**Last Updated**: January 11, 2026  
**Maintained By**: Africa Railways API Team
