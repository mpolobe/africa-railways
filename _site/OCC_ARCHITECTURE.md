# Operational Control Centre (OCC) Architecture

## Overview
The OCC provides real-time monitoring and control of the entire Africa Railways ticketing ecosystem from a single interface.

## Architecture Design

### Backend: `dashboard/main.go`
- **HTTP Server**: Serves monitoring interface on port 8080
- **WebSocket Server**: Real-time data streaming to frontend
- **Data Aggregation**: Polls blockchain, IPFS, and system metrics every 5 seconds
- **Alert Engine**: Monitors thresholds and triggers notifications

### Frontend: `dashboard/static/index.html`
- **Real-time Dashboard**: Live metrics with auto-refresh
- **Multi-panel Layout**: Organized by system component
- **Alert Display**: Visual warnings for critical issues
- **Historical Charts**: Trend visualization for key metrics

## Monitoring Capabilities

### 1. Blockchain Monitoring
**Polygon Amoy:**
- Total tickets minted (lifetime)
- Tickets minted today
- Tickets verified today
- Latest transaction hash and timestamp
- Network status (connected/disconnected)

**Sui Network:**
- Event count (dashboard updates only)
- Latest event timestamp
- Network latency

### 2. Relayer Wallet Monitoring
- Current POL balance
- Balance in USD equivalent
- Estimated transactions remaining
- Gas price (current/average/peak)
- Low balance alerts (<0.01 POL)

### 3. IPFS/Pinata Monitoring
- Total metadata uploads
- Uploads today
- Storage used (MB)
- Upload success rate
- Failed upload alerts
- Average upload time

### 4. Ticket Lifecycle Tracking
- **Minted**: Total tickets created
- **Pending**: Awaiting first verification
- **Active**: Currently valid tickets
- **Used**: Verified and consumed
- **Expired**: Past departure date

### 5. System Health
- **Backend Services**: Relayer, IPFS uploader, API server
- **Mobile Apps**: Passenger app, Staff app
- **External APIs**: Alchemy, Pinata, Polygon RPC
- **Database**: Connection status, query latency

### 6. Alert System
**Critical Alerts:**
- Relayer balance < 0.01 POL
- IPFS upload failures > 5%
- Blockchain RPC errors
- Gas price spike > 50 Gwei

**Warning Alerts:**
- Relayer balance < 0.05 POL
- IPFS upload time > 10 seconds
- Ticket verification failures > 2%

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    OCC Dashboard (Browser)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Blockchain│ │  Wallet  │ │   IPFS   │ │  Tickets │       │
│  │ Metrics   │ │ Monitor  │ │  Status  │ │ Lifecycle│       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ WebSocket (real-time)
                            │
┌─────────────────────────────────────────────────────────────┐
│              Backend Server (dashboard/main.go)              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Data Aggregation Engine (5s poll)          │   │
│  └──────────────────────────────────────────────────────┘   │
│         │              │              │              │       │
│         ▼              ▼              ▼              ▼       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Polygon  │  │  Wallet  │  │  Pinata  │  │ Database │   │
│  │   RPC    │  │ Balance  │  │   API    │  │  Queries │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
dashboard/
├── main.go                 # Backend server with WebSocket
├── go.mod                  # Go dependencies
├── static/
│   ├── index.html          # Main dashboard interface
│   ├── css/
│   │   └── dashboard.css   # Styling
│   └── js/
│       ├── websocket.js    # Real-time data handling
│       ├── charts.js       # Visualization (Chart.js)
│       └── alerts.js       # Alert management
├── pkg/
│   ├── aggregator/
│   │   └── metrics.go      # Data collection logic
│   ├── blockchain/
│   │   ├── polygon.go      # Polygon monitoring
│   │   └── sui.go          # Sui monitoring
│   ├── wallet/
│   │   └── monitor.go      # Wallet balance tracking
│   ├── ipfs/
│   │   └── monitor.go      # IPFS health checks
│   └── alerts/
│       └── engine.go       # Alert threshold logic
└── README.md               # OCC usage guide
```

## API Endpoints

### REST API
- `GET /api/metrics` - Current system metrics (JSON)
- `GET /api/health` - System health check
- `GET /api/alerts` - Active alerts
- `GET /api/tickets/stats` - Ticket statistics
- `GET /api/wallet/balance` - Relayer wallet info

### WebSocket
- `ws://localhost:8080/ws` - Real-time metric stream
- Message format: `{"type": "metrics", "data": {...}}`

## Deployment

### Local Development
```bash
cd dashboard
go run main.go
# Open http://localhost:8080
```

### Production (Railway.app)
```bash
railway up
# Access via: https://occ-africa-railways.railway.app
```

### Docker
```bash
docker build -t africa-railways-occ .
docker run -p 8080:8080 africa-railways-occ
```

## Security

- **Authentication**: Basic auth for production deployment
- **HTTPS**: TLS required for production
- **API Keys**: Loaded from environment variables
- **CORS**: Restricted to authorized domains

## Performance

- **Update Frequency**: 5-second polling interval
- **WebSocket**: Efficient real-time updates
- **Caching**: 60-second cache for expensive queries
- **Concurrent Requests**: Goroutines for parallel data fetching

## Future Enhancements

1. **Historical Analytics**: 30-day trend charts
2. **Predictive Alerts**: ML-based anomaly detection
3. **Mobile OCC App**: iOS/Android monitoring
4. **Multi-operator Support**: Separate dashboards per railway
5. **Automated Actions**: Auto-refill wallet, restart services
