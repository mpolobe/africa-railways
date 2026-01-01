# Infrastructure Management Guide

## Overview

The `manage_africoin.sh` script provides a unified interface to monitor and manage all Africoin infrastructure components.

## Quick Start

```bash
# Make script executable
chmod +x manage_africoin.sh

# Check status of all services
./manage_africoin.sh status

# View help
./manage_africoin.sh help
```

## Commands

### Status Check (No gcloud required)

```bash
./manage_africoin.sh status
```

Checks health of:
- **Network Connectivity**: Ping tests for all static IPs
- **Blockchain Services**: Polygon validator and Sui node
- **Backend Services (GCP)**: OCC Dashboard, Relayer, USSD Gateway
- **Web Services (Railway)**: Main website, OCC proxy, DuckDNS

**Output Example:**
```
==========================================
   AFRICOIN INFRASTRUCTURE STATUS
==========================================

--- Network Connectivity ---
  [NETWORK] Polygon Validator (34.10.5.8): ✅ ONLINE
  [NETWORK] Dev Server (34.63.91.33): ✅ ONLINE
  [NETWORK] Static IP (34.60.45.96): ✅ ONLINE
  [NETWORK] OCC Dashboard Server (34.10.37.126): ✅ ONLINE

--- Blockchain Services ---
  [BLOCKCHAIN] Polygon Validator: ✅ SYNCED (Block: 0x1a2b3c)
  [BLOCKCHAIN] Sui Node: ✅ SYNCING

--- Backend Services (GCP) ---
  [SERVICE] OCC Dashboard (Direct GCP): ✅ RUNNING (Status: operational)
  [SERVICE] Relayer Bridge: ✅ RUNNING
  [SERVICE] USSD Gateway: ✅ RUNNING

--- Web Services (Railway) ---
  [WEB] Railway Website: ✅ ONLINE (HTTP 200)
  [WEB] Railway OCC Proxy: ✅ ONLINE (HTTP 200)
  [SERVICE] OCC Dashboard (via Railway): ✅ RUNNING (Status: operational)
  [HTTP] DuckDNS Dashboard: ✅ RUNNING (HTTP 200)
```

### Start Services (Requires gcloud)

```bash
./manage_africoin.sh start
```

Starts all services on GCP VMs:
- OCC Dashboard
- Relayer Bridge
- USSD Gateway

### Stop Services (Requires gcloud)

```bash
./manage_africoin.sh stop
```

Stops all services on GCP VMs.

### Restart Services (Requires gcloud)

```bash
./manage_africoin.sh restart
```

Stops and starts all services.

### View Logs (Requires gcloud)

```bash
./manage_africoin.sh logs
```

Interactive menu to view logs from:
1. OCC Dashboard
2. Relayer Bridge
3. USSD Gateway
4. Monitor Engine
5. All Services

### Deploy Updates (Requires gcloud & Railway CLI)

```bash
./manage_africoin.sh deploy
```

Deploys latest code to:
- Railway (main website and proxy)
- GCP VMs (backend services)

## Infrastructure Components

### Static IPs

| Name | IP Address | Purpose |
|------|------------|---------|
| Polygon Validator | 34.10.5.8 | Polygon Amoy validator node |
| Dev Server | 34.63.91.33 | Development and testing |
| Static IP | 34.60.45.96 | Reserved for future use |
| OCC Dashboard | 34.10.37.126 | OCC Dashboard backend |

### Services

#### Blockchain Services
- **Polygon Validator** (Port 8545): Polygon Amoy testnet validator
- **Sui Node** (Port 9000): Sui testnet full node

#### Backend Services (GCP)
- **OCC Dashboard** (Port 8080): Operational Control Centre
- **Relayer Bridge** (Port 8082): Sui → Polygon event bridge
- **USSD Gateway** (Port 8081): Feature phone ticketing

#### Web Services (Railway)
- **Main Website**: https://www.africarailways.com
- **OCC Dashboard Proxy**: https://www.africarailways.com/occ
- **DuckDNS**: http://africoin.duckdns.org:3000

## Access URLs

### Production URLs
- **Main Website**: [https://www.africarailways.com](https://www.africarailways.com)
- **OCC Dashboard**: [https://www.africarailways.com/occ](https://www.africarailways.com/occ)
- **Sentinel Portal**: [https://www.africarailways.com/dashboard.html](https://www.africarailways.com/dashboard.html)
- **Whitepaper**: [https://www.africarailways.com/whitepaper.html](https://www.africarailways.com/whitepaper.html)
- **Africoin Exchange**: [https://scroll-waitlist-exchange-1-nnjr.vercel.app/](https://scroll-waitlist-exchange-1-nnjr.vercel.app/)

### Direct Access (GCP)
- **OCC Dashboard**: http://34.10.37.126:8080
- **Relayer API**: http://34.10.37.126:8082
- **USSD Gateway**: http://34.10.37.126:8081
- **Polygon Validator**: http://34.10.5.8:8545
- **Sui Node**: http://34.10.5.8:9000

### Development
- **DuckDNS**: http://africoin.duckdns.org:3000

## Prerequisites

### For Status Checks Only
- `curl` (usually pre-installed)
- `ping` (usually pre-installed)

### For Service Management
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
  ```bash
  # Install gcloud CLI
  curl https://sdk.cloud.google.com | bash
  exec -l $SHELL
  gcloud init
  ```

### For Deployments
- Google Cloud SDK (see above)
- [Railway CLI](https://docs.railway.app/develop/cli)
  ```bash
  npm i -g @railway/cli
  railway login
  ```

## Troubleshooting

### Service Not Responding

**Problem**: Service shows as "NOT RESPONDING"

**Solutions**:
1. Check if service is running:
   ```bash
   ./manage_africoin.sh logs
   ```

2. Restart the service:
   ```bash
   ./manage_africoin.sh restart
   ```

3. Check GCP VM status:
   ```bash
   gcloud compute instances list
   ```

### Network Offline

**Problem**: Network check shows "OFFLINE"

**Solutions**:
1. Verify VM is running:
   ```bash
   gcloud compute instances describe africoin-node-1 --zone=us-central1-a
   ```

2. Check firewall rules:
   ```bash
   gcloud compute firewall-rules list
   ```

3. Start VM if stopped:
   ```bash
   gcloud compute instances start africoin-node-1 --zone=us-central1-a
   ```

### Railway Proxy Error

**Problem**: Railway OCC Proxy shows error

**Solutions**:
1. Check Railway deployment status:
   ```bash
   railway status
   ```

2. View Railway logs:
   ```bash
   railway logs --service caddy-proxy
   ```

3. Redeploy proxy:
   ```bash
   ./deploy-proxy.sh
   ```

### Blockchain Not Syncing

**Problem**: Polygon or Sui node not responding

**Solutions**:
1. SSH into validator:
   ```bash
   gcloud compute ssh africoin-node-1 --zone=us-central1-a
   ```

2. Check node logs:
   ```bash
   # Polygon
   journalctl -u polygon-validator -f
   
   # Sui
   journalctl -u sui-node -f
   ```

3. Restart node service:
   ```bash
   sudo systemctl restart polygon-validator
   sudo systemctl restart sui-node
   ```

## Monitoring Best Practices

### Regular Health Checks

Run status check every hour:
```bash
# Add to crontab
0 * * * * /path/to/manage_africoin.sh status >> /var/log/africoin-health.log 2>&1
```

### Alert on Failures

Create alert script:
```bash
#!/bin/bash
./manage_africoin.sh status | grep "❌" && \
  echo "Infrastructure alert!" | mail -s "Africoin Alert" admin@africarailways.com
```

### Log Rotation

Ensure logs don't fill disk:
```bash
# Add to /etc/logrotate.d/africoin
/opt/dashboard/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
```

## Security Notes

### Firewall Rules

Ensure proper firewall configuration:
```bash
# Allow OCC Dashboard
gcloud compute firewall-rules create allow-occ-dashboard \
    --allow tcp:8080 \
    --source-ranges 0.0.0.0/0

# Allow Relayer
gcloud compute firewall-rules create allow-relayer \
    --allow tcp:8082 \
    --source-ranges 0.0.0.0/0

# Allow USSD Gateway
gcloud compute firewall-rules create allow-ussd \
    --allow tcp:8081 \
    --source-ranges 0.0.0.0/0
```

### SSH Access

Use gcloud SSH for secure access:
```bash
gcloud compute ssh africoin-node-1 --zone=us-central1-a
```

### API Keys

Never commit API keys. Use environment variables:
```bash
export ALCHEMY_API_KEY="your-key-here"
export PINATA_API_KEY="your-key-here"
```

## Cost Monitoring

### GCP Costs
- **e2-micro VM**: ~$7/month
- **Static IPs**: ~$3/month each
- **Egress**: ~$0.12/GB

### Railway Costs
- **Hobby Plan**: $5/month
- **Pro Plan**: $20/month

**Total Estimated**: $15-30/month

## Support

- **Documentation**: See `OCC_RAILWAY_DEPLOYMENT.md`
- **GitHub**: https://github.com/mpolobe/africa-railways
- **Email**: admin@africarailways.com

---

**Last Updated**: December 26, 2024
