# 💰 Revenue Tracking System

## Overview

The Revenue Tracking system provides real-time financial metrics for USSD ticket sales, tracking both confirmed revenue (successful purchases on Polygon) and pending revenue (tickets in active sessions).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    OCC Dashboard                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           💰 Revenue Tracker Card                    │   │
│  │  ✅ Confirmed  ⏳ Pending  📊 Today  💳 Avg Price   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ HTTP /revenue
                            │
┌─────────────────────────────────────────────────────────────┐
│                    USSD Gateway                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           RevenueTracker                             │   │
│  │  • ConfirmedTotal (Polygon purchases)               │   │
│  │  • PendingTotal (Active sessions)                   │   │
│  │  • RevenueToday                                      │   │
│  │  • TicketsSold                                       │   │
│  │  • ConversionRate                                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Active USSD Sessions                      │
│  Session 1: JHB-CPT Economy (R150) - confirm_payment       │
│  Session 2: JHB-DBN Business (R240) - payment_processing   │
│  Session 3: CPT-PE FirstClass (R350) - confirm_payment     │
│                                                              │
│  Pending Total: R740                                        │
└─────────────────────────────────────────────────────────────┘
```

## Revenue States

### 1. Pending Revenue
**Definition**: Sum of ticket prices in active USSD sessions that have reached payment confirmation stage.

**Tracked When**:
- User selects route and class
- Reaches "confirm_payment" state
- Has not yet completed or cancelled

**Example**:
```
Session A: JHB-CPT Economy (R150) - State: confirm_payment
Session B: JHB-DBN Business (R240) - State: confirm_payment
Pending Total: R390
```

### 2. Confirmed Revenue
**Definition**: Total value of successfully completed purchases on Polygon blockchain.

**Tracked When**:
- M-Pesa payment confirmed
- NFT ticket minted on Polygon
- Transaction successful

**Example**:
```
Ticket #1: JHB-CPT Economy (R150) - Minted
Ticket #2: JHB-DBN Business (R240) - Minted
Confirmed Total: R390
```

### 3. Today's Revenue
**Definition**: Total confirmed revenue for the current day (resets at midnight).

### 4. Total Revenue
**Definition**: All-time confirmed revenue since system launch.

## Ticket Pricing

### Route Pricing Table

```go
ticketPrices = map[string]map[string]float64{
    "JHB-CPT": {
        "Economy":     150.00,
        "Business":    300.00,
        "FirstClass":  500.00,
    },
    "JHB-DBN": {
        "Economy":     120.00,
        "Business":    240.00,
        "FirstClass":  400.00,
    },
    "CPT-PE": {
        "Economy":     100.00,
        "Business":    200.00,
        "FirstClass":  350.00,
    },
}
```

### Price Lookup

```go
func getTicketPrice(route, class string) float64 {
    if prices, ok := ticketPrices[route]; ok {
        if price, ok := prices[class]; ok {
            return price
        }
    }
    return 150.00 // Default price
}
```

## Revenue Tracking Flow

### User Journey

```
1. User dials *123#
   └─ Revenue: R0 (no price selected yet)

2. User selects route: JHB-CPT
   └─ Revenue: R0 (no class selected yet)

3. User selects class: Economy (R150)
   └─ Pending Revenue: +R150
   └─ State: confirm_payment

4. User confirms payment
   └─ State: payment_processing

5. Payment successful
   └─ Pending Revenue: -R150
   └─ Confirmed Revenue: +R150
   └─ Revenue Today: +R150
   └─ Tickets Sold: +1
```

### Cancellation Flow

```
1. User at confirm_payment (R150 pending)
2. User selects "0. Cancel"
   └─ Pending Revenue: -R150
   └─ Session removed
```

## API Endpoints

### Get Revenue Metrics

```bash
GET http://localhost:8081/revenue
```

**Response**:
```json
{
  "confirmed_total": 1250.75,
  "pending_total": 390.00,
  "total_revenue": 15420.50,
  "revenue_today": 1250.75,
  "tickets_sold": 103,
  "tickets_today": 8,
  "conversion_rate": 85.5,
  "average_ticket_price": 156.25,
  "pricing": {
    "JHB-CPT": {
      "Economy": 150.00,
      "Business": 300.00,
      "FirstClass": 500.00
    },
    "JHB-DBN": {
      "Economy": 120.00,
      "Business": 240.00,
      "FirstClass": 400.00
    },
    "CPT-PE": {
      "Economy": 100.00,
      "Business": 200.00,
      "FirstClass": 350.00
    }
  }
}
```

### Get USSD Health (includes revenue)

```bash
GET http://localhost:8081/health
```

**Response**:
```json
{
  "connected": true,
  "active_sessions": 3,
  "total_sessions_today": 42,
  "success_rate": 85.5,
  "revenue": {
    "confirmed_total": 1250.75,
    "pending_total": 390.00,
    "revenue_today": 1250.75,
    "tickets_today": 8
  }
}
```

## Dashboard Integration

### Revenue Card Display

The OCC Dashboard shows:

1. **Confirmed Revenue** (✅)
   - Total successful purchases
   - Green color
   - "Successful on Polygon"

2. **Pending Revenue** (⏳)
   - Sum of active session tickets
   - Yellow/orange color
   - "In active sessions"

3. **Today's Revenue** (📊)
   - Revenue for current day
   - Shows ticket count
   - "X tickets sold"

4. **Average Ticket Price** (💳)
   - Total revenue / tickets sold
   - Shows conversion rate
   - "X% conversion"

### Visual Chart

Horizontal bar chart showing:
- **Confirmed bar**: Green gradient
- **Pending bar**: Orange gradient
- Percentage-based width
- Currency values displayed

## Real-Time Updates

### Calculation Frequency

```go
// Recalculate pending revenue from active sessions
func calculateLiveRevenue() RevenueTracker {
    var pending float64
    
    // Iterate through active sessions
    for _, session := range sessionStore.sessions {
        if session.State == "confirm_payment" || 
           session.State == "payment_processing" {
            if price, ok := session.Data["price"].(float64); ok {
                pending += price
            }
        }
    }
    
    return RevenueTracker{
        ConfirmedTotal: revenueTracker.ConfirmedTotal,
        PendingTotal:   pending,
        // ... other fields
    }
}
```

### Update Triggers

Revenue is recalculated:
- Every 5 seconds (dashboard polling)
- On every `/revenue` API call
- On every `/health` API call
- When session state changes

## Metrics Tracked

### Financial Metrics

1. **Confirmed Total**: R1,250.75
   - All successful purchases
   - Minted on Polygon

2. **Pending Total**: R390.00
   - Active sessions at payment stage
   - May convert or cancel

3. **Revenue Today**: R1,250.75
   - Today's confirmed revenue
   - Resets at midnight

4. **Total Revenue**: R15,420.50
   - All-time revenue
   - Never resets

### Performance Metrics

1. **Tickets Sold**: 103
   - Total tickets minted
   - All-time count

2. **Tickets Today**: 8
   - Today's ticket count
   - Resets at midnight

3. **Conversion Rate**: 85.5%
   - Successful sessions / total sessions
   - Indicates funnel efficiency

4. **Average Ticket Price**: R156.25
   - Total revenue / tickets sold
   - Indicates pricing effectiveness

## Testing

### Test Revenue Tracking

```bash
# Start USSD gateway
cd ussd-gateway
./ussd-gateway

# Simulate purchase (in another terminal)
curl -X POST http://localhost:8081/ussd \
  -d "sessionId=test_001" \
  -d "phoneNumber=+27821234567" \
  -d "text=1*1*1*1*1" \
  -d "serviceCode=*123#"

# Check revenue
curl http://localhost:8081/revenue
```

Expected:
```json
{
  "confirmed_total": 150.00,
  "pending_total": 0.00,
  "revenue_today": 150.00,
  "tickets_today": 1
}
```

### Test Pending Revenue

```bash
# Start session and stop at payment confirmation
curl -X POST http://localhost:8081/ussd \
  -d "sessionId=test_002" \
  -d "phoneNumber=+27829876543" \
  -d "text=1*1*1*1" \
  -d "serviceCode=*123#"

# Check revenue (should show pending)
curl http://localhost:8081/revenue
```

Expected:
```json
{
  "confirmed_total": 150.00,
  "pending_total": 150.00,
  "revenue_today": 150.00,
  "tickets_today": 1
}
```

## Production Integration

### Sui Ledger Integration

In production, confirmed revenue should be pulled from Sui blockchain:

```go
func getConfirmedRevenueFromSui() float64 {
    // Query Sui for successful ticket purchases
    // Sum all ticket prices from minted NFTs
    // Return total confirmed revenue
}

func calculateLiveRevenue() RevenueTracker {
    // Get confirmed from Sui
    confirmed := getConfirmedRevenueFromSui()
    
    // Calculate pending from active sessions
    var pending float64
    for _, session := range sessionStore.sessions {
        if session.State == "confirm_payment" {
            pending += session.Data["price"].(float64)
        }
    }
    
    return RevenueTracker{
        ConfirmedTotal: confirmed,
        PendingTotal:   pending,
    }
}
```

### Database Persistence

Store revenue history:

```sql
CREATE TABLE revenue_history (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    confirmed_total DECIMAL(10,2),
    tickets_sold INTEGER,
    average_price DECIMAL(10,2),
    conversion_rate DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Daily Reset

Reset daily metrics at midnight:

```go
func resetDailyMetrics() {
    revenueTracker.mu.Lock()
    defer revenueTracker.mu.Unlock()
    
    // Save to database before reset
    saveDailyRevenue(revenueTracker.RevenueToday, revenueTracker.TicketsToday)
    
    // Reset daily counters
    revenueTracker.RevenueToday = 0
    revenueTracker.TicketsToday = 0
}

// Run at midnight
func startDailyResetScheduler() {
    ticker := time.NewTicker(24 * time.Hour)
    defer ticker.Stop()
    
    for range ticker.C {
        resetDailyMetrics()
    }
}
```

## Monitoring

### Key Metrics to Monitor

1. **Conversion Rate**: Should be >80%
   - Low rate indicates funnel issues
   - May need UX improvements

2. **Average Ticket Price**: Should match pricing strategy
   - Track class distribution
   - Optimize pricing

3. **Pending/Confirmed Ratio**: Should be <10%
   - High ratio indicates abandoned carts
   - May need payment flow improvements

4. **Revenue Growth**: Track daily/weekly trends
   - Identify peak times
   - Plan capacity

### Alerts

Set up alerts for:
- Conversion rate drops below 70%
- No revenue for >1 hour during business hours
- Pending revenue >R5,000 (many abandoned carts)
- Average ticket price deviates >20% from expected

## Troubleshooting

### Pending Revenue Not Updating

```bash
# Check active sessions
curl http://localhost:8081/sessions

# Verify session states
# Should see "confirm_payment" or "payment_processing"

# Check revenue calculation
curl http://localhost:8081/revenue
```

### Confirmed Revenue Not Increasing

```bash
# Check if payments are completing
tail -f logs/ussd-gateway.log | grep "Payment initiated"

# Verify Polygon minting
# Check relayer logs
tail -f logs/relayer.log
```

### Dashboard Not Showing Revenue

```bash
# Check dashboard can reach USSD gateway
curl http://localhost:8080/api/ussd/revenue

# Check USSD gateway is running
curl http://localhost:8081/health

# Check browser console for errors
# Open DevTools > Console
```

## Next Steps

1. ✅ Revenue tracking implemented
2. ✅ Dashboard card added
3. ✅ Real-time updates working
4. ⏳ Integrate with Sui ledger for confirmed revenue
5. ⏳ Add database persistence
6. ⏳ Implement daily reset scheduler
7. ⏳ Set up monitoring alerts
8. ⏳ Add revenue analytics (trends, forecasting)

---

**Your revenue tracking system is live and monitoring sales in real-time! 💰**
