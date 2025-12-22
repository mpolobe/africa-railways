# 💳 Sovereign Wallet Implementation Guide

## Overview

The Sovereign Wallet is a self-contained financial system for the Africa Railways platform, featuring real-time transaction tracking, persistent storage, and seamless integration with the booking system.

---

## 🎯 Core Features

### 1. Balance Management
- **Initial Balance**: 1,250 AFRC
- **Currency**: AFRC (Africoin)
- **Ticket Price**: 50 AFRC (flat rate)
- **Top-Up Amount**: 500 AFRC (self-service)

### 2. Transaction History
- **Display**: Last 5 transactions in wallet card
- **Storage**: Last 100 transactions in localStorage
- **Real-time Updates**: Immediate UI refresh on every transaction
- **Color Coding**: Green for credits, Red for debits

### 3. Persistence
- **localStorage**: Wallet state survives page refreshes
- **Sync**: Balance and transactions automatically saved
- **Recovery**: Loads previous state on page load

---

## 📊 Data Structures

### Simple Transaction Array (UI Display)
```javascript
let transactions = [
    {
        type: 'credit',      // 'credit' or 'debit'
        amount: 500,         // AFRC amount
        time: '14:30'        // HH:MM format
    }
];
```

### Wallet State (Persistent Storage)
```javascript
let walletState = {
    balance: 1250,
    transactions: [
        {
            id: 1703234567890,
            type: 'debit',
            amount: 50,
            description: 'Ticket: Lusaka → Dar es Salaam',
            timestamp: '2025-12-22T14:30:00.000Z',
            balanceAfter: 1200
        }
    ],
    lastSync: '2025-12-22T14:30:00.000Z'
};
```

---

## 🔧 Key Functions

### Balance Display
```javascript
const balanceDisplay = document.getElementById('wallet-balance');
balanceDisplay.innerText = currentBalance;
```

### Add Transaction to UI
```javascript
function addTransactionUI(type, amount) {
    const timestamp = new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    const tx = {
        type: type,      // 'credit' or 'debit'
        amount: amount,
        time: timestamp
    };
    
    transactions.unshift(tx);           // Add to start
    if (transactions.length > 5) {
        transactions.pop();              // Keep only last 5
    }
    
    // Render to DOM
    renderTransactionHistory();
}
```

### Top Up Wallet
```javascript
async function topUp() {
    const TOP_UP_AMOUNT = 500;
    
    // 1. Update balance
    currentBalance += TOP_UP_AMOUNT;
    document.getElementById('wallet-balance').innerText = currentBalance;
    
    // 2. Add to UI
    addTransactionUI('credit', TOP_UP_AMOUNT);
    
    // 3. Notify backend
    await fetch('/add-event', {
        method: 'POST',
        body: JSON.stringify({
            message: `💎 Wallet Top-Up: +500 AFRC Minted`
        })
    });
}
```

### Book Ticket
```javascript
async function bookTicket() {
    const TICKET_PRICE = 50;
    
    // 1. Check balance
    if (currentBalance < TICKET_PRICE) {
        alert("Insufficient AFRC!");
        return;
    }
    
    // 2. Send to backend
    const response = await fetch('/add-event', {
        method: 'POST',
        body: JSON.stringify({
            message: `🎟️ Ticket Confirmed: 50 AFRC Deducted`
        })
    });
    
    if (response.ok) {
        // 3. Deduct balance
        currentBalance -= TICKET_PRICE;
        document.getElementById('wallet-balance').innerText = currentBalance;
        
        // 4. Add to UI
        addTransactionUI('debit', TICKET_PRICE);
    }
}
```

---

## 🎨 HTML Structure

### Wallet Card
```html
<div class="card" style="grid-area: wallet; display: flex; flex-direction: column;">
    <h3>💳 Sovereign Wallet</h3>
    
    <!-- Balance Display -->
    <div class="balance" style="margin-bottom: 20px;">
        <small>Current Balance</small>
        <h1>
            <span id="wallet-balance">1250</span> 
            <span style="color:var(--accent)">AFRC</span>
        </h1>
    </div>
    
    <!-- Top Up Button -->
    <button onclick="topUp()" style="width:100%; background:var(--accent); color:white; margin-bottom: 20px;">
        💎 Top Up AFRC (+500)
    </button>

    <!-- Transaction History Header -->
    <div class="history-header" style="display:flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px;">
        <span style="font-size: 0.8rem; opacity: 0.7;">Recent Activity</span>
        <span onclick="checkStatus()" style="font-size: 0.8rem; color: var(--accent); cursor: pointer;">View All</span>
    </div>
    
    <!-- Transaction List -->
    <div id="transaction-history" style="flex-grow: 1; overflow-y: auto; max-height: 200px; margin-top: 10px;">
        <div style="text-align: center; color: #666; padding: 20px;">No transactions yet</div>
    </div>
</div>
```

---

## 🎬 User Flow

### Complete Transaction Flow

```
User Opens App
    ↓
[Initialize Wallet]
    ↓
Load from localStorage
    ↓
Display Balance: 1,250 AFRC
    ↓
Display Last 5 Transactions
    ↓
┌─────────────────────────────────┐
│  User Action: Top Up            │
├─────────────────────────────────┤
│  1. Click "Top Up AFRC"         │
│  2. Balance += 500              │
│  3. Update display              │
│  4. Add to transaction list     │
│  5. Notify backend              │
│  6. Save to localStorage        │
└─────────────────────────────────┘
    ↓
Balance: 1,750 AFRC
    ↓
┌─────────────────────────────────┐
│  User Action: Book Ticket       │
├─────────────────────────────────┤
│  1. Select route                │
│  2. Click "Confirm Booking"     │
│  3. Check balance >= 50         │
│  4. Send to backend             │
│  5. Deduct 50 AFRC              │
│  6. Update display              │
│  7. Add to transaction list     │
│  8. Save to localStorage        │
└─────────────────────────────────┘
    ↓
Balance: 1,700 AFRC
    ↓
Transaction History Updated:
  [14:32] Railway Ticket    -50 AFRC
  [14:30] Wallet Top-Up    +500 AFRC
```

---

## 🎨 Styling

### Transaction Item
```css
.transaction-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    font-size: 0.9rem;
}

.transaction-label {
    display: block;
    font-weight: 500;
}

.transaction-time {
    font-size: 0.7rem;
    opacity: 0.5;
}

.transaction-amount {
    font-weight: bold;
}

.transaction-credit {
    color: #10b981; /* Green */
}

.transaction-debit {
    color: #f87171; /* Red */
}
```

### Scrollbar
```css
#transaction-history {
    scrollbar-width: thin;
    scrollbar-color: var(--accent) rgba(255,255,255,0.1);
}

#transaction-history::-webkit-scrollbar {
    width: 6px;
}

#transaction-history::-webkit-scrollbar-track {
    background: rgba(255,255,255,0.05);
    border-radius: 3px;
}

#transaction-history::-webkit-scrollbar-thumb {
    background: var(--accent);
    border-radius: 3px;
}
```

---

## 📱 Testing

### Test Pages

1. **iPad Control Center**
   ```
   http://localhost:8082/ipad-control-center.html
   ```
   - Full wallet integration
   - Real-time transaction history
   - Top-up and booking

2. **Transaction Demo**
   ```
   http://localhost:3000/transaction-demo.html
   ```
   - Demo sequences
   - Statistics dashboard
   - Bulk operations

3. **Wallet Test Suite**
   ```
   http://localhost:3000/wallet-test.html
   ```
   - Connection testing
   - Activity logging
   - Quick operations

### Test Scenarios

**Scenario 1: First Time User**
```javascript
1. Open app → Balance: 1,250 AFRC
2. Book ticket → Balance: 1,200 AFRC
3. Book 5 more tickets → Balance: 950 AFRC
4. Top up → Balance: 1,450 AFRC
```

**Scenario 2: Heavy User**
```javascript
1. Start: 1,250 AFRC
2. Book 20 tickets → 250 AFRC remaining
3. Top up → 750 AFRC
4. Book 10 more tickets → 250 AFRC
5. Top up → 750 AFRC
```

**Scenario 3: Insufficient Balance**
```javascript
1. Balance: 30 AFRC
2. Try to book ticket (50 AFRC)
3. Alert: "Insufficient AFRC!"
4. Top up → 530 AFRC
5. Book ticket → 480 AFRC
```

---

## 🔄 Backend Integration

### Event Broadcasting

**Top-Up Event**
```json
{
    "message": "💎 Wallet Top-Up: +500 AFRC Minted (Balance: 1750)"
}
```

**Ticket Purchase Event**
```json
{
    "message": "🎟️ Ticket Confirmed: Lusaka → Dar es Salaam - 50 AFRC Deducted"
}
```

### WebSocket Updates
```javascript
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.message.includes('Wallet Top-Up')) {
        // Update live feed
        addEventToFeed(data);
    }
    
    if (data.message.includes('Ticket Confirmed')) {
        // Update monitoring dashboard
        addEventToFeed(data);
    }
};
```

---

## 💡 Best Practices

### 1. Always Check Balance
```javascript
if (currentBalance < TICKET_PRICE) {
    alert("Insufficient AFRC!");
    return;
}
```

### 2. Update UI Immediately
```javascript
// Optimistic UI update
currentBalance -= TICKET_PRICE;
balanceDisplay.innerText = currentBalance;
```

### 3. Add Transactions to Both Stores
```javascript
// UI display (last 5)
addTransactionUI('debit', 50);

// Persistent storage (last 100)
addTransaction('debit', 50, 'Ticket: Route Name');
```

### 4. Notify Backend
```javascript
await fetch('/add-event', {
    method: 'POST',
    body: JSON.stringify({ message: '...' })
});
```

### 5. Handle Errors Gracefully
```javascript
try {
    await fetch('/add-event', { ... });
} catch (error) {
    console.error('Failed to notify backend:', error);
    // Still show success since local balance was updated
}
```

---

## 🚀 Production Considerations

### Payment Gateway Integration
In production, replace self-service top-up with:
- Mobile Money (M-Pesa, MTN, etc.)
- Bank transfers
- Card payments
- Cryptocurrency

### Security
- JWT authentication
- Rate limiting
- Transaction verification
- Fraud detection

### Scalability
- Backend wallet service
- Database persistence
- Transaction ledger
- Audit logs

---

**Last Updated**: 2025-12-22  
**Version**: 1.0  
**Maintained By**: Africa Railways Team
