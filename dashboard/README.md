# 🚂 Africa Railways - Operational Control Centre (OCC)

Real-time monitoring and control dashboard for the Africa Railways NFT ticketing system.

## Features

### Real-Time Monitoring
- **Blockchain Status**: Polygon and Sui network connectivity and latency
- **Wallet Monitor**: Relayer balance, gas prices, transaction capacity
- **Gas Policy**: Alchemy Gas Manager status and budget tracking
- **IPFS/Pinata**: Upload statistics and health checks
- **Ticket Lifecycle**: Track tickets from minting to usage
- **System Health**: Monitor all services and APIs

### Interactive Controls
- **Service Management**: Start/stop relayer, monitor, and IPFS services
- **Cloud Infrastructure**: Control GCP Compute Engine and AWS EC2 instances
- **Alert System**: Real-time notifications for critical issues

### WebSocket Updates
- Live metrics streaming every 5 seconds
- Automatic reconnection on disconnect
- Fallback to REST API polling

## Quick Start

### 1. Install Dependencies

```bash
cd dashboard
go mod download
```

### 2. Configure Environment

Create a `.env` file or set environment variables:

```bash
# Required
export POLYGON_RPC_URL="https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY"
export RELAYER_ADDRESS="0xYourRelayerAddress"

# Optional (for cloud control)
export GCP_PROJECT_ID="your-project-id"
export GCP_ZONE="us-central1-a"
export AWS_REGION="us-east-1"
```

### 3. Run Dashboard

```bash
go run main.go
```

Open [http://localhost:8080](http://localhost:8080)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Dashboard UI)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │Blockchain│ │  Wallet  │ │   IPFS   │ │  Health  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ WebSocket (real-time)
                            │
┌─────────────────────────────────────────────────────────────┐
│              Backend Server (main.go)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │     Data Aggregation Engine (5s polling)             │   │
│  └──────────────────────────────────────────────────────┘   │
│         │              │              │              │       │
│         ▼              ▼              ▼              ▼       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Polygon  │  │  Wallet  │  │  Pinata  │  │   Sui    │   │
│  │   RPC    │  │ Balance  │  │   API    │  │   RPC    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Metrics
- `GET /api/metrics` - Current system metrics (JSON)
- `GET /api/health` - System health check
- `GET /api/alerts` - Active alerts
- `WS /ws` - WebSocket for real-time updates

### Service Control
- `POST /api/control/relayer/start` - Start relayer service
- `POST /api/control/relayer/stop` - Stop relayer service
- `POST /api/control/monitor/start` - Start monitor service
- `POST /api/control/monitor/stop` - Stop monitor service
- `POST /api/control/ipfs/start` - Start IPFS uploader
- `POST /api/control/ipfs/stop` - Stop IPFS uploader

### Cloud Infrastructure Control
- `POST /api/control/gcp` - Control GCP Compute Engine instances
  - Parameters: `instance` (name), `action` (start/stop)
- `POST /api/control/aws` - Control AWS EC2 instances
  - Parameters: `id` (instance ID), `action` (start/stop)

## Configuration

### config.json (Root Directory)
```json
{
  "alchemyEndpoint": "https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY",
  "gasPolicyId": "your-gas-policy-id",
  "ipfsApiKey": "your-pinata-api-key"
}
```

### Environment Variables
```bash
# Blockchain
POLYGON_RPC_URL="https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY"
RELAYER_ADDRESS="0xYourAddress"

# Cloud Control (Optional)
GCP_PROJECT_ID="your-project"
GCP_ZONE="us-central1-a"
AWS_REGION="us-east-1"

# Server
PORT="8080"
```

## Cloud Infrastructure Control

### GCP Setup

1. Install gcloud CLI or use SDK:
```bash
# CLI method (current implementation)
gcloud auth application-default login

# SDK method (production)
go get google.golang.org/api/compute/v1
```

2. Set environment variables:
```bash
export GCP_PROJECT_ID="your-project-id"
export GCP_ZONE="us-central1-a"
```

3. Test control:
```bash
curl -X POST http://localhost:8080/api/control/gcp \
  -d "instance=relayer-instance&action=start"
```

### AWS Setup

1. Configure AWS CLI or use SDK:
```bash
# CLI method (current implementation)
aws configure

# SDK method (production)
go get github.com/aws/aws-sdk-go-v2/service/ec2
go get github.com/aws/aws-sdk-go-v2/config
```

2. Set environment variables:
```bash
export AWS_REGION="us-east-1"
```

3. Test control:
```bash
curl -X POST http://localhost:8080/api/control/aws \
  -d "id=i-1234567890abcdef0&action=start"
```

## Deployment

### Local Development
```bash
go run main.go
```

### Production (Railway.app)
```bash
railway up
```

### Docker
```dockerfile
FROM golang:1.22-alpine
WORKDIR /app
COPY . .
RUN go build -o dashboard main.go
EXPOSE 8080
CMD ["./dashboard"]
```

```bash
docker build -t africa-railways-occ .
docker run -p 8080:8080 --env-file .env africa-railways-occ
```

## Security

### Authentication (Production)
Add API key authentication:

```go
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
```

### HTTPS
Use reverse proxy (nginx, Caddy) or Railway's automatic HTTPS.

### IAM Permissions

**GCP Service Account:**
- `compute.instances.start`
- `compute.instances.stop`
- `compute.instances.get`

**AWS IAM Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "ec2:StartInstances",
      "ec2:StopInstances",
      "ec2:DescribeInstances"
    ],
    "Resource": "*"
  }]
}
```

## Monitoring Metrics

### Blockchain
- Network connectivity (Polygon, Sui)
- Latest block numbers
- Network latency
- Total tickets minted
- Tickets verified today

### Wallet
- POL balance
- USD equivalent
- Gas price (current/average/peak)
- Estimated transactions remaining
- Low balance alerts

### Gas Policy
- Active status
- Budget usage percentage
- Transaction count
- Spend tracking

### IPFS
- Total uploads
- Daily uploads
- Success rate
- Average upload time
- Failed uploads
- Pinata connectivity

### System Health
- Service status (operational/degraded/down)
- Uptime percentage
- Response times
- API connectivity

## Alert Thresholds

### Critical
- Relayer balance < 0.01 POL
- Blockchain RPC connection failed
- Gas Policy inactive
- IPFS upload failures > 10%

### Warning
- Relayer balance < 0.05 POL
- Gas price > 50 Gwei
- IPFS latency > 10 seconds
- Sui latency > 2 seconds

## Troubleshooting

### WebSocket Not Connecting
- Check firewall allows WebSocket connections
- Verify port 8080 is accessible
- Check browser console for errors

### Metrics Not Updating
- Verify config.json exists in root directory
- Check POLYGON_RPC_URL is valid
- Ensure RELAYER_ADDRESS is set

### Cloud Control Not Working
- Verify gcloud/aws CLI is installed and authenticated
- Check GCP_PROJECT_ID and AWS_REGION are set
- Verify IAM permissions

## Development

### Project Structure
```
dashboard/
├── main.go                 # Backend server
├── go.mod                  # Go dependencies
├── static/
│   ├── index.html          # Dashboard UI
│   ├── css/
│   │   └── dashboard.css   # Styling
│   └── js/
│       ├── websocket.js    # WebSocket client
│       └── dashboard.js    # UI updates
├── CLOUD_SDK_SETUP.md      # Cloud SDK guide
└── README.md               # This file
```

### Adding New Metrics

1. Update `SystemMetrics` struct in `main.go`
2. Add collection logic in `collectMetrics()`
3. Update frontend in `dashboard.js`
4. Add UI elements in `index.html`

### Adding New Controls

1. Add handler function in `main.go`
2. Register route in `main()`
3. Add button in `index.html`
4. Add click handler in `dashboard.js`

## Support

For issues or questions:
- Check [CLOUD_SDK_SETUP.md](CLOUD_SDK_SETUP.md) for cloud control setup
- Review [OCC_ARCHITECTURE.md](../OCC_ARCHITECTURE.md) for system design
- See [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) for common issues

## License

Part of the Africa Railways project.
