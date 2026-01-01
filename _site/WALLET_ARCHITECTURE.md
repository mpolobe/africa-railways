# 💳 Sovereign Wallet Architecture

## Overview

The Africa Railways Sovereign Wallet implements a two-part authorization system that separates user actions from system authorization, mirroring real-world financial systems.

---

## 👥 Roles in the AFRC Ecosystem

### 1. **User (Passenger)**
- **Role**: Initiates transactions
- **Capabilities**:
  - Request ticket purchases
  - Initiate wallet top-ups
  - View balance and transaction history
- **Limitations**:
  - Cannot directly modify balance
  - Cannot authorize credits
  - Must go through authorization layer

### 2. **Payment Gateway**
- **Role**: Validates and processes payments
- **Capabilities**:
  - Verify payment methods
  - Process external payments (bank, mobile money, etc.)
  - Return authorization tokens
- **Limitations**:
  - Cannot directly credit wallets
  - Must communicate with backend for final authorization

### 3. **Backend System (Sovereign Hub)**
- **Role**: Authorizes and executes transactions
- **Capabilities**:
  - Authorize wallet credits
  - Deduct funds for purchases
  - Maintain transaction ledger
  - Broadcast events to WebSocket clients
- **Authority**: Final arbiter of all balance changes

---

## 🔄 Transaction Flows

### Ticket Purchase Flow

```
┌─────────┐         ┌─────────┐         ┌─────────┐
│  User   │         │ Backend │         │ Wallet  │
└────┬────┘         └────┬────┘         └────┬────┘
     │                   │                   │
     │ 1. Click "Book"   │                   │
     ├──────────────────>│                   │
     │                   │                   │
     │ 2. Check Balance  │                   │
     │                   ├──────────────────>│
     │                   │                   │
     │                   │ 3. Balance OK     │
     │                   │<──────────────────┤
     │                   │                   │
     │ 4. Deduct 50 AFRC │                   │
     │                   ├──────────────────>│
     │                   │                   │
     │ 5. Confirmation   │                   │
     │<──────────────────┤                   │
     │                   │                   │
     │ 6. Update UI      │                   │
     │<──────────────────┼───────────────────┤
     │                   │                   │
```

**Key Points:**
- User initiates but cannot directly deduct
- Backend validates balance before deduction
- Wallet updates only after backend authorization
- UI reflects confirmed state

### Wallet Top-Up Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  User   │    │ Backend │    │ Gateway │    │ Wallet  │
└────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘
     │              │              │              │
     │ 1. Request   │              │              │
     │  Top-Up      │              │              │
     ├─────────────>│              │              │
     │              │              │              │
     │              │ 2. Forward   │              │
     │              │  to Gateway  │              │
     │              ├─────────────>│              │
     │              │              │              │
     │              │              │ 3. Process   │
     │              │              │  Payment     │
     │              │              │              │
     │              │ 4. Auth Token│              │
     │              │<─────────────┤              │
     │              │              │              │
     │              │ 5. Authorize │              │
     │              │  Credit      │              │
     │              ├──────────────┼─────────────>│
     │              │              │              │
     │ 6. Confirm   │              │              │
     │<─────────────┤              │              │
     │              │              │              │
```

**Key Points:**
- User initiates request (cannot self-credit)
- Gateway validates payment externally
- Backend receives authorization token
- Backend credits wallet after verification
- User receives confirmation

---

## 🔐 Security Model

### Authorization Hierarchy

```
┌─────────────────────────────────────┐
│         Backend Authority           │
│  (Final arbiter of all changes)     │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────┐
       │               │
┌──────▼──────┐ ┌─────▼──────┐
│   Gateway   │ │   Wallet   │
│ (Validates) │ │  (Stores)  │
└──────┬──────┘ └─────┬──────┘
       │               │
       └───────┬───────┘
               │
        ┌──────▼──────┐
        │    User     │
        │ (Initiates) │
        └─────────────┘
```

### Permission Matrix

| Action | User | Gateway | Backend | Wallet |
|--------|------|---------|---------|--------|
| View Balance | ✅ | ❌ | ✅ | ✅ |
| Request Top-Up | ✅ | ❌ | ❌ | ❌ |
| Validate Payment | ❌ | ✅ | ❌ | ❌ |
| Authorize Credit | ❌ | ❌ | ✅ | ❌ |
| Execute Credit | ❌ | ❌ | ✅ | ✅ |
| Request Purchase | ✅ | ❌ | ❌ | ❌ |
| Authorize Debit | ❌ | ❌ | ✅ | ❌ |
| Execute Debit | ❌ | ❌ | ✅ | ✅ |

---

## 💻 Implementation

### Frontend (User Interface)

```javascript
// User initiates top-up
async function topUpWallet(amount) {
    // Step 1: Send request to backend
    const response = await fetch('/wallet/topup', {
        method: 'POST',
        body: JSON.stringify({ amount, userId })
    });
    
    // Step 2: Wait for authorization
    if (response.ok) {
        // Backend will call authorizeTopUp() via WebSocket or callback
    }
}

// Backend authorizes credit (called by system)
function authorizeTopUp(amount, authSource) {
    currentBalance += amount;
    addTransaction('credit', amount, `Authorized by ${authSource}`);
    updateDisplay();
}
```

### Backend (Authorization Layer)

```go
// Receive top-up request
func HandleTopUpRequest(w http.ResponseWriter, r *http.Request) {
    var req TopUpRequest
    json.NewDecoder(r.Body).Decode(&req)
    
    // Forward to payment gateway
    authToken := gateway.ProcessPayment(req.Amount, req.UserId)
    
    if authToken.Valid {
        // Authorize credit
        wallet.Credit(req.UserId, req.Amount)
        
        // Broadcast event
        hub.Broadcast(Event{
            Type: "wallet_credited",
            Amount: req.Amount,
            UserId: req.UserId
        })
    }
}
```

### Payment Gateway (Validation Layer)

```javascript
// Validate payment (external service)
function processPayment(amount, userId) {
    // Verify payment method
    // Process transaction
    // Return authorization token
    
    return {
        valid: true,
        token: generateAuthToken(),
        timestamp: Date.now()
    };
}
```

---

## 🎯 Design Principles

### 1. **Separation of Concerns**
- Users initiate, systems authorize
- Clear boundaries between roles
- No direct balance manipulation by users

### 2. **Trust Model**
- Backend is the source of truth
- Gateway validates external payments
- Wallet stores state but doesn't authorize

### 3. **Auditability**
- All transactions logged with authorization source
- Transaction history includes who authorized
- Immutable ledger of all changes

### 4. **Fail-Safe Defaults**
- Insufficient balance blocks transactions
- Failed authorizations don't credit wallets
- Errors default to no-change state

---

## 📊 Transaction Types

### Debit Transactions (User → System)

| Type | Initiator | Authorizer | Amount |
|------|-----------|------------|--------|
| Ticket Purchase | User | Backend | 50 AFRC |
| Service Fee | System | Backend | Variable |
| Penalty | System | Backend | Variable |

### Credit Transactions (System → User)

| Type | Initiator | Authorizer | Amount |
|------|-----------|------------|--------|
| Wallet Top-Up | User | Gateway + Backend | Variable |
| Refund | System | Backend | Variable |
| Reward | System | Backend | Variable |
| Airdrop | System | Backend | Variable |

---

## 🔄 State Synchronization

### Local State (Frontend)
```javascript
let currentBalance = 1250; // Optimistic UI
```

### Persistent State (Backend)
```go
type Wallet struct {
    UserID      string
    Balance     int
    Transactions []Transaction
    LastSync    time.Time
}
```

### Synchronization Strategy
1. **Optimistic Updates**: UI updates immediately for better UX
2. **Backend Confirmation**: Backend validates and confirms
3. **Rollback on Failure**: UI reverts if backend rejects
4. **Periodic Sync**: Regular balance checks to ensure consistency

---

## 🚀 Production Considerations

### Payment Gateway Integration

**Supported Gateways:**
- Mobile Money (M-Pesa, MTN Mobile Money, etc.)
- Bank Transfers
- Card Payments
- Cryptocurrency (for cross-border)

**Integration Points:**
```javascript
const GATEWAY_CONFIG = {
    mpesa: {
        endpoint: 'https://api.safaricom.co.ke/mpesa',
        apiKey: process.env.MPESA_API_KEY
    },
    stripe: {
        endpoint: 'https://api.stripe.com/v1',
        apiKey: process.env.STRIPE_API_KEY
    }
};
```

### Security Measures

1. **Authentication**: JWT tokens for user sessions
2. **Authorization**: Role-based access control (RBAC)
3. **Encryption**: TLS for all communications
4. **Rate Limiting**: Prevent abuse of top-up endpoints
5. **Fraud Detection**: Monitor unusual transaction patterns

### Compliance

- **KYC**: Know Your Customer verification for large top-ups
- **AML**: Anti-Money Laundering checks
- **Transaction Limits**: Daily/monthly caps
- **Audit Logs**: Immutable record of all transactions

---

## 📝 API Endpoints

### User Endpoints

```
POST /wallet/topup
Body: { amount: number, userId: string }
Response: { requestId: string, status: 'pending' }

GET /wallet/balance
Response: { balance: number, lastSync: timestamp }

GET /wallet/transactions
Response: { transactions: Transaction[] }
```

### System Endpoints (Internal)

```
POST /wallet/authorize-credit
Body: { userId: string, amount: number, authToken: string }
Response: { success: boolean, newBalance: number }

POST /wallet/debit
Body: { userId: string, amount: number, reason: string }
Response: { success: boolean, newBalance: number }
```

---

## 🧪 Testing

### Unit Tests
```javascript
test('User cannot directly credit wallet', () => {
    expect(() => currentBalance += 100).toThrow();
});

test('Top-up requires gateway authorization', async () => {
    const result = await topUpWallet(500);
    expect(result.status).toBe('pending');
});
```

### Integration Tests
```javascript
test('Complete top-up flow', async () => {
    // User initiates
    const request = await topUpWallet(500);
    
    // Gateway processes
    const auth = await gateway.process(request);
    
    // Backend authorizes
    const result = await backend.authorize(auth);
    
    expect(result.balance).toBe(1750);
});
```

---

**Last Updated**: 2025-12-22  
**Version**: 1.0  
**Maintained By**: Africa Railways Team
