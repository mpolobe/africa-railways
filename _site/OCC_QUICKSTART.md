# 🚂 Africa Railways OCC - Quick Start Guide

## What is the OCC?

The **Operational Control Centre (OCC)** is your command center for monitoring and controlling the entire Africa Railways NFT ticketing system in real-time.

## Features at a Glance

✅ **Real-Time Monitoring**
- Blockchain status (Polygon + Sui)
- Relayer wallet balance and gas prices
- IPFS upload statistics
- Ticket lifecycle tracking
- System health checks

✅ **Interactive Controls**
- Start/stop services (relayer, monitor, IPFS)
- Control cloud infrastructure (GCP, AWS)
- Alert management

✅ **Live Updates**
- WebSocket streaming (5-second updates)
- Automatic reconnection
- REST API fallback

## Quick Start (3 Steps)

### Step 1: Verify Configuration

Ensure `config.json` exists in the root directory:

```bash
ls -l config.json
```

If missing, copy from template:

```bash
cp config.example.json config.json
# Edit with your credentials
```

### Step 2: Start the OCC

```bash
./start-occ.sh
```

This will:
1. Build binaries (if needed)
2. Start the Monitor Engine (background)
3. Start the OCC Dashboard (foreground)

### Step 3: Open Dashboard

Navigate to: **[http://localhost:8080](http://localhost:8080)**

## What You'll See

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│  🚂 Africa Railways OCC          ● Connected  12:34:56  │
├─────────────────────────────────────────────────────────┤
│  ⛓️ Blockchain    💰 Wallet      ⛽ Gas Policy          │
│  📦 IPFS          🎫 Tickets     🏥 System Health       │
│  🚨 Active Alerts                                       │
└─────────────────────────────────────────────────────────┘
```

### Key Metrics

**Blockchain Status**
- ✅ Polygon: Connected (Block 12345678, 150ms latency)
- ✅ Sui: Connected (250ms latency)
- Total Tickets Minted: 1,234

**Relayer Wallet**
- Balance: 0.0850 POL ($0.04 USD)
- Gas Price: 35.2 Gwei
- TX Capacity: ~425 mints

**Gas Policy**
- Status: ✅ Active
- Budget Used: 45.2% ($22.60 / $50.00)

**IPFS/Pinata**
- Total Uploads: 1,234
- Success Rate: 99.8%
- Avg Upload Time: 450ms

## Monitor Engine

The monitor runs in the background and checks system vitals every 30 seconds:

### What It Monitors

1. **Gas Policy Balance** - Via Alchemy API
2. **IPFS Pinning Status** - Via Pinata API
3. **Sui Node Latency** - For fast USSD response
4. **Polygon RPC** - Network connectivity
5. **Relayer Wallet** - Balance and gas prices

### View Monitor Logs

```bash
tail -f logs/monitor.log
```

### Monitor Output Example

```
🔍 Health Check: 2024-12-24 12:34:56
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Checking Polygon RPC... ✅ OK (Block: 12345678, Latency: 150ms)
💰 Checking relayer wallet... ✅ OK (0.0850 POL = $0.04, ~425 tx left)
⛽ Checking Alchemy Gas Policy... ✅ OK (45.2% used: $22.60/$50.00, 1234 tx)
📦 Checking IPFS/Pinata... ✅ OK (Latency: 450ms, No pending pins)
🌊 Checking Sui node latency... ✅ OK (Latency: 250ms - good for USSD)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SYSTEM STATUS SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ALL SYSTEMS OPERATIONAL

Polygon:       ✅ OK
Sui Node:      ✅ OK (250ms latency)
Wallet:        ✅ OK (0.0850 POL)
Gas Policy:    ✅ OK
IPFS:          ✅ OK
Gas Price:     35.20 Gwei
TX Capacity:   ~425 mints
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Service Controls

### From Dashboard UI

Click the **Start/Stop** buttons in the System Health section:

- **Relayer Service**: Manages gasless minting
- **IPFS Uploader**: Handles metadata uploads
- **Monitor Engine**: System health checks

### From Command Line

```bash
# Start relayer
curl -X POST http://localhost:8080/api/control/relayer/start

# Stop relayer
curl -X POST http://localhost:8080/api/control/relayer/stop

# Start monitor
curl -X POST http://localhost:8080/api/control/monitor/start

# Stop monitor
curl -X POST http://localhost:8080/api/control/monitor/stop
```

## Cloud Infrastructure Control

### GCP Compute Engine

```bash
# Start instance
curl -X POST http://localhost:8080/api/control/gcp \
  -d "instance=relayer-instance&action=start"

# Stop instance
curl -X POST http://localhost:8080/api/control/gcp \
  -d "instance=relayer-instance&action=stop"
```

**Requirements:**
- `gcloud` CLI installed and authenticated
- `GCP_PROJECT_ID` and `GCP_ZONE` environment variables set

### AWS EC2

```bash
# Start instance
curl -X POST http://localhost:8080/api/control/aws \
  -d "id=i-1234567890abcdef0&action=start"

# Stop instance
curl -X POST http://localhost:8080/api/control/aws \
  -d "id=i-1234567890abcdef0&action=stop"
```

**Requirements:**
- `aws` CLI installed and configured
- `AWS_REGION` environment variable set

## Alert System

### Alert Levels

**🚨 CRITICAL** (Red)
- Relayer balance < 0.01 POL
- Blockchain RPC connection failed
- Gas Policy inactive

**⚠️ WARNING** (Yellow)
- Relayer balance < 0.05 POL
- Gas price > 50 Gwei
- IPFS latency > 10 seconds
- Sui latency > 2 seconds

**ℹ️ INFO** (Blue)
- System notifications
- Service status changes

### Alert Actions

Alerts are:
1. Displayed in dashboard banner
2. Listed in Active Alerts section
3. Logged to `alerts.log`
4. (Production) Sent via SMS/email/Slack

## API Reference

### REST Endpoints

```bash
# Get current metrics
GET /api/metrics

# Get system health
GET /api/health

# Get active alerts
GET /api/alerts
```

### WebSocket

```javascript
const ws = new WebSocket('ws://localhost:8080/ws');

ws.onmessage = (event) => {
    const metrics = JSON.parse(event.data);
    console.log('Metrics:', metrics);
};
```

## Troubleshooting

### Dashboard Won't Start

**Error: "config.json not found"**
```bash
cp config.example.json config.json
# Edit with your credentials
```

**Error: "port 8080 already in use"**
```bash
# Find and kill process
lsof -ti:8080 | xargs kill -9

# Or use different port
PORT=8081 ./start-occ.sh
```

### Monitor Shows Errors

**"Polygon RPC connection failed"**
- Check `config.json` has valid `alchemyEndpoint`
- Verify network connectivity
- Test: `curl https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY`

**"IPFS/Pinata authentication failed"**
- Check `config.json` has valid `ipfsApiKey`
- Verify API key is active in Pinata dashboard

**"Sui node connection failed"**
- Check network connectivity
- Sui testnet may be down (check status.sui.io)

### WebSocket Not Connecting

**Browser console shows "WebSocket connection failed"**
- Check dashboard is running on port 8080
- Verify firewall allows WebSocket connections
- Try REST API fallback (automatic after 10 seconds)

## Production Deployment

### Railway.app

```bash
cd dashboard
railway up
```

Dashboard will be available at: `https://your-app.railway.app`

### Docker

```bash
# Build image
docker build -t africa-railways-occ -f dashboard/Dockerfile .

# Run container
docker run -p 8080:8080 \
  -e POLYGON_RPC_URL="your-rpc-url" \
  -e RELAYER_ADDRESS="your-address" \
  africa-railways-occ
```

### Systemd Service

Create `/etc/systemd/system/africa-railways-occ.service`:

```ini
[Unit]
Description=Africa Railways OCC Dashboard
After=network.target

[Service]
Type=simple
User=railways
WorkingDirectory=/opt/africa-railways
ExecStart=/opt/africa-railways/dashboard/occ-dashboard
Restart=always
Environment="PORT=8080"
Environment="POLYGON_RPC_URL=your-rpc-url"
Environment="RELAYER_ADDRESS=your-address"

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable africa-railways-occ
sudo systemctl start africa-railways-occ
sudo systemctl status africa-railways-occ
```

## Security Best Practices

### Production Checklist

- [ ] Add authentication (API keys or JWT)
- [ ] Enable HTTPS (use reverse proxy)
- [ ] Restrict CORS origins
- [ ] Set up firewall rules
- [ ] Rotate credentials regularly
- [ ] Monitor access logs
- [ ] Set up backup monitoring

### Authentication Example

```go
// Add to main.go
func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        apiKey := r.Header.Get("X-API-Key")
        if apiKey != os.Getenv("DASHBOARD_API_KEY") {
            http.Error(w, "Unauthorized", http.StatusUnauthorized)
            return
        }
        next(w, r)
    }
}

// Protect endpoints
mux.HandleFunc("/api/control/relayer/start", authMiddleware(handleRelayerStart))
```

## Next Steps

1. ✅ Start the OCC dashboard
2. ✅ Monitor system health
3. ✅ Set up alerts (SMS/email)
4. ✅ Configure cloud controls (GCP/AWS)
5. ✅ Deploy to production
6. ✅ Set up backup monitoring

## Support

- **Documentation**: See `dashboard/README.md` for detailed API docs
- **Cloud Setup**: See `dashboard/CLOUD_SDK_SETUP.md` for GCP/AWS configuration
- **Architecture**: See `OCC_ARCHITECTURE.md` for system design

## Summary

The OCC gives you complete visibility and control over your Africa Railways ticketing system:

- **Monitor**: Real-time metrics for all system components
- **Control**: Start/stop services and cloud infrastructure
- **Alert**: Get notified of critical issues immediately
- **Analyze**: Track trends and system performance

**You're now ready to operate your railway like a pro! 🚂**
