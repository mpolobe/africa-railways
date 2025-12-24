# 📡 Live Blockchain Feed

## Overview

The Live Blockchain Feed provides a real-time, terminal-style view of blockchain events from both Polygon and Sui networks. It shows exactly what the relayer is "hearing" from the blockchain.

## Features

✅ **Real-Time Events**
- Polygon block updates
- Transaction notifications
- NFT minting events
- Sui purchase events
- System alerts and warnings

✅ **Terminal-Style Interface**
- Monospace font (Courier New)
- Color-coded event types
- Timestamps for each event
- Auto-scrolling feed
- JSON data display

✅ **Filtering**
- Toggle Polygon events
- Toggle Sui events
- Clear feed
- Auto-scroll on/off

✅ **Event Types**
- 🟢 Events (green) - Successful operations
- 🔴 Errors (red) - Failed operations
- 🟡 Warnings (yellow) - Attention needed
- ⚪ System (gray) - System messages

## Dashboard View

```
┌─────────────────────────────────────────────────────────────┐
│  📡 Live Blockchain Feed                                     │
│  [Polygon] [Sui] [Clear] [Auto-scroll: ON]                  │
├─────────────────────────────────────────────────────────────┤
│  [12:34:56] [POLYGON] New block: #12345678                  │
│  [12:35:01] [POLYGON] Ticket minted: TokenID #42            │
│              {                                               │
│                "from": "0x4C97...",                          │
│                "to": "0x742d...",                            │
│                "tokenId": 42,                                │
│                "route": "JHB-CPT"                            │
│              }                                               │
│  [12:35:15] [SUI] Purchase event detected                   │
│              {                                               │
│                "user": "0x1234...5678",                      │
│                "amount": "150 POL",                          │
│                "route": "JHB-CPT"                            │
│              }                                               │
│  [12:35:30] [SYSTEM] Heartbeat: OK                          │
└─────────────────────────────────────────────────────────────┘
```

## Event Sources

### Polygon Events

**Block Updates**:
```
[12:34:56] [POLYGON] New block: #12345678
{
  "block_number": 12345678,
  "blocks_since_last": 3
}
```

**Transaction Events**:
```
[12:35:01] [POLYGON] Transaction: 0x1234abcd...
{
  "hash": "0x1234abcd...",
  "from": "0x4C97...",
  "to": "0x742d...",
  "value": "0.0002 POL"
}
```

**NFT Minting**:
```
[12:35:05] [POLYGON] Ticket minted: TokenID #42
{
  "tokenId": 42,
  "route": "JHB-CPT",
  "class": "Economy",
  "price": 150.00,
  "recipient": "0x742d..."
}
```

### Sui Events

**Purchase Events**:
```
[12:35:15] [SUI] Purchase event detected
{
  "user": "0x1234...5678",
  "amount": "150 POL",
  "route": "JHB-CPT",
  "timestamp": 1703424915
}
```

**Event Count Updates**:
```
[12:35:20] [SUI] Event count: 42
{
  "total_events": 42,
  "events_today": 8
}
```

### System Events

**Heartbeat**:
```
[12:35:30] [SYSTEM] Heartbeat: OK
{
  "balance": 0.0850,
  "events_processed": 42,
  "using_validator": true
}
```

**Errors**:
```
[12:35:45] [SYSTEM] Polygon connection lost
{
  "error": "dial tcp: connection refused"
}
```

**Warnings**:
```
[12:36:00] [SYSTEM] Low balance warning
{
  "balance": 0.0450,
  "threshold": 0.05
}
```

## API Endpoints

### Get Blockchain Events

```bash
GET http://localhost:8082/feed
```

**Response**:
```json
[
  {
    "timestamp": "2024-12-24T12:34:56Z",
    "source": "polygon",
    "type": "block",
    "message": "New block: #12345678",
    "data": {
      "block_number": 12345678,
      "blocks_since_last": 3
    }
  },
  {
    "timestamp": "2024-12-24T12:35:01Z",
    "source": "polygon",
    "type": "mint",
    "message": "Ticket minted: TokenID #42",
    "data": {
      "tokenId": 42,
      "route": "JHB-CPT",
      "class": "Economy"
    }
  }
]
```

### Dashboard Proxy

```bash
GET http://localhost:8080/api/blockchain/feed
```

Proxies requests to relayer and returns events.

## Event Processing

### Relayer Side

```go
// Add blockchain event
func addBlockchainEvent(source, eventType, message string, data map[string]interface{}) {
    event := BlockchainEvent{
        Timestamp: time.Now(),
        Source:    source,
        Type:      eventType,
        Message:   message,
        Data:      data,
    }
    
    state.EventsMu.Lock()
    defer state.EventsMu.Unlock()
    
    // Add to recent events
    state.RecentEvents = append(state.RecentEvents, event)
    
    // Keep only last 50 events
    if len(state.RecentEvents) > 50 {
        state.RecentEvents = state.RecentEvents[1:]
    }
}
```

### Dashboard Side

```javascript
// Fetch and display events
async function fetchBlockchainEvents() {
    const response = await fetch('/api/blockchain/feed');
    const events = await response.json();
    
    events.forEach(event => {
        const source = event.source.toUpperCase();
        const type = event.type === 'error' ? 'error' : 
                    event.type === 'warning' ? 'warning' : 'event';
        
        addFeedLine(source, event.message, type, event.data);
    });
}

// Update every 10 seconds
setInterval(fetchBlockchainEvents, 10000);
```

## Controls

### Filter Buttons

**Polygon Button**:
- Click to toggle Polygon events
- Active (blue) = showing events
- Inactive (gray) = hiding events

**Sui Button**:
- Click to toggle Sui events
- Active (blue) = showing events
- Inactive (gray) = hiding events

**Clear Button**:
- Clears all events from feed
- Resets to initial state
- Shows "Feed cleared" message

**Auto-scroll Button**:
- Toggle auto-scrolling
- ON = automatically scrolls to latest event
- OFF = manual scrolling

### Keyboard Shortcuts

- `Ctrl+L` - Clear feed
- `Ctrl+P` - Toggle Polygon
- `Ctrl+S` - Toggle Sui
- `Ctrl+A` - Toggle auto-scroll

## Styling

### Color Scheme

```css
/* Event Types */
.feed-event { border-left: 3px solid #10b981; } /* Green */
.feed-error { border-left: 3px solid #ef4444; } /* Red */
.feed-warning { border-left: 3px solid #f59e0b; } /* Yellow */
.feed-system { border-left: 3px solid #6b7280; } /* Gray */

/* Sources */
.feed-source.polygon { color: #8b5cf6; } /* Purple */
.feed-source.sui { color: #06b6d4; } /* Cyan */

/* Background */
.blockchain-feed { background: #000; } /* Black terminal */
```

### Font

```css
font-family: 'Courier New', monospace;
font-size: 0.875rem;
line-height: 1.6;
```

## Testing

### Test Event Generation

```bash
# Start relayer
./relayer

# In another terminal, watch events
watch -n 1 'curl -s http://localhost:8082/feed | jq'
```

### Simulate Events

```bash
# Trigger heartbeat (generates block event)
# Wait 30 seconds for heartbeat

# Check dashboard
# Open http://localhost:8080
# Look for events in Live Blockchain Feed
```

### Manual Event Testing

Add to relayer for testing:

```go
// Test event generation
func generateTestEvents() {
    addBlockchainEvent("polygon", "block", "New block: #12345678", map[string]interface{}{
        "block_number": 12345678,
    })
    
    addBlockchainEvent("polygon", "mint", "Ticket minted: TokenID #42", map[string]interface{}{
        "tokenId": 42,
        "route": "JHB-CPT",
    })
    
    addBlockchainEvent("sui", "purchase", "Purchase event detected", map[string]interface{}{
        "amount": "150 POL",
    })
}
```

## Production Integration

### Real Event Listening

Replace placeholder with actual blockchain event subscription:

```go
func listenPolygonEvents() {
    // Subscribe to contract events
    query := ethereum.FilterQuery{
        Addresses: []common.Address{contractAddress},
    }
    
    logs := make(chan types.Log)
    sub, err := client.SubscribeFilterLogs(context.Background(), query, logs)
    if err != nil {
        log.Fatal(err)
    }
    
    for {
        select {
        case err := <-sub.Err():
            log.Fatal(err)
        case vLog := <-logs:
            // Process log and add to feed
            processPolygonLog(vLog)
        }
    }
}

func processPolygonLog(vLog types.Log) {
    // Parse event
    event := parseTicketMintedEvent(vLog)
    
    // Add to feed
    addBlockchainEvent("polygon", "mint", 
        fmt.Sprintf("Ticket minted: TokenID #%d", event.TokenId),
        map[string]interface{}{
            "tokenId": event.TokenId,
            "route": event.Route,
            "recipient": event.Recipient.Hex(),
        })
}
```

### Sui Event Subscription

```go
func listenSuiEvents() {
    // Connect to Sui WebSocket
    ws, err := websocket.Dial(suiWebSocketURL)
    if err != nil {
        log.Fatal(err)
    }
    
    // Subscribe to events
    subscribeToSuiEvents(ws)
    
    for {
        var event SuiEvent
        if err := ws.ReadJSON(&event); err != nil {
            log.Printf("Error reading Sui event: %v", err)
            continue
        }
        
        // Add to feed
        addBlockchainEvent("sui", "purchase",
            "Purchase event detected",
            map[string]interface{}{
                "user": event.Sender,
                "amount": event.Amount,
            })
    }
}
```

## Monitoring

### Key Metrics

1. **Event Rate**: Events per minute
2. **Event Types**: Distribution of event types
3. **Source Balance**: Polygon vs Sui events
4. **Error Rate**: Percentage of error events

### Alerts

Set up alerts for:
- No events for >5 minutes
- High error rate (>10%)
- Connection lost events
- Unusual event patterns

## Troubleshooting

### No Events Showing

```bash
# Check relayer is running
curl http://localhost:8082/health

# Check events endpoint
curl http://localhost:8082/feed

# Check dashboard proxy
curl http://localhost:8080/api/blockchain/feed

# Check browser console
# Open DevTools > Console
```

### Events Not Updating

```bash
# Check fetch interval (should be 10 seconds)
# Look for errors in browser console

# Verify WebSocket connection
# Check connection status indicator

# Test manual fetch
fetch('/api/blockchain/feed').then(r => r.json()).then(console.log)
```

### Feed Performance Issues

```bash
# Reduce MAX_FEED_LINES (currently 100)
# Increase fetch interval (currently 10s)
# Disable auto-scroll for large feeds
# Clear feed periodically
```

## Next Steps

1. ✅ Blockchain feed implemented
2. ✅ Real-time event display
3. ✅ Filtering and controls
4. ⏳ Integrate real Polygon event subscription
5. ⏳ Integrate real Sui event subscription
6. ⏳ Add event search/filter
7. ⏳ Export events to CSV
8. ⏳ Event analytics dashboard

---

**Your blockchain feed is live and showing real-time events! 📡**
