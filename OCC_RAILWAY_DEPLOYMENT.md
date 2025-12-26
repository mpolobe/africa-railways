# OCC Dashboard Deployment on Railway with Path-Based Routing

## Overview

This guide explains how to set up path-based routing on Railway so that:
- `www.africarailways.com/` serves the main website
- `www.africarailways.com/occ` proxies to the OCC Dashboard on GCP

## Architecture

```
User Request
    ↓
Railway (www.africarailways.com)
    ↓
Caddy Reverse Proxy
    ├─→ /occ/* → GCP africoin-node-1 (34.10.37.126:8080)
    └─→ /*     → Static website files
```

## Prerequisites

1. Railway account with domain `www.africarailways.com` configured
2. GCP VM `africoin-node-1` running OCC Dashboard on port 8080
3. OCC Dashboard accessible at `http://34.10.37.126:8080`

## Deployment Steps

### Step 1: Verify GCP OCC Dashboard

Ensure the OCC Dashboard is running on your GCP VM:

```bash
# SSH into africoin-node-1
gcloud compute ssh africoin-node-1 --zone=us-central1-a

# Check if OCC Dashboard is running
curl http://localhost:8080/api/health

# If not running, start it
cd /path/to/dashboard
./occ-dashboard
```

### Step 2: Configure Firewall Rules

Allow traffic from Railway to your GCP VM:

```bash
# Create firewall rule for OCC Dashboard
gcloud compute firewall-rules create allow-occ-dashboard \
    --project=africa-railways-481823 \
    --direction=INGRESS \
    --priority=1000 \
    --network=default \
    --action=ALLOW \
    --rules=tcp:8080 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=occ-dashboard

# Add tag to your VM
gcloud compute instances add-tags africoin-node-1 \
    --zone=us-central1-a \
    --tags=occ-dashboard
```

### Step 3: Deploy Caddy Proxy on Railway

#### Option A: Using Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Deploy the proxy service
railway up --service proxy
```

#### Option B: Using Railway Dashboard

1. Go to your Railway project dashboard
2. Click "New Service" → "Empty Service"
3. Name it "caddy-proxy"
4. Go to Settings → Deploy
5. Set Build Command: `docker build -f Dockerfile.proxy -t proxy .`
6. Set Start Command: `caddy run --config /etc/caddy/Caddyfile --adapter caddyfile`
7. Add environment variable: `PORT=8080`
8. Deploy

### Step 4: Update Domain Configuration

In Railway dashboard:

1. Go to your project settings
2. Navigate to "Domains"
3. Ensure `www.africarailways.com` points to the `caddy-proxy` service
4. Wait for DNS propagation (can take up to 48 hours)

### Step 5: Test the Setup

```bash
# Test main website
curl https://www.africarailways.com/

# Test OCC Dashboard proxy
curl https://www.africarailways.com/occ/api/health

# Test in browser
open https://www.africarailways.com/occ
```

## Configuration Files

### Caddyfile

The `Caddyfile` handles routing:

```caddyfile
:{$PORT} {
    # Route /occ requests to GCP
    handle_path /occ/* {
        reverse_proxy http://34.10.37.126:8080 {
            header_up Host {upstream_hostport}
            header_up X-Real-IP {remote_host}
        }
    }

    # Route everything else to static files
    handle /* {
        root * /app
        file_server
    }
}
```

### Dockerfile.proxy

Builds the Caddy container with your configuration:

```dockerfile
FROM caddy:2.7-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY *.html /app/
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
```

## Troubleshooting

### Issue: 502 Bad Gateway on /occ

**Cause**: GCP VM is not accessible or OCC Dashboard is not running

**Solution**:
```bash
# Check if OCC Dashboard is running
gcloud compute ssh africoin-node-1 --zone=us-central1-a
ps aux | grep occ-dashboard

# Check firewall rules
gcloud compute firewall-rules list | grep occ

# Test connectivity from Railway
curl http://34.10.37.126:8080/api/health
```

### Issue: /occ returns 404

**Cause**: Caddy routing is not configured correctly

**Solution**:
1. Check Caddyfile syntax
2. Verify Railway deployed the latest version
3. Check Railway logs: `railway logs --service caddy-proxy`

### Issue: SSL/HTTPS not working

**Cause**: Railway domain not properly configured

**Solution**:
1. Verify domain in Railway dashboard
2. Check DNS records point to Railway
3. Wait for SSL certificate provisioning (automatic with Railway)

### Issue: CORS errors on /occ

**Cause**: OCC Dashboard needs CORS headers

**Solution**: Update `dashboard/main.go` to include CORS middleware:

```go
import "github.com/rs/cors"

func main() {
    mux := http.NewServeMux()
    // ... your routes ...

    // Add CORS
    handler := cors.New(cors.Options{
        AllowedOrigins: []string{"https://www.africarailways.com"},
        AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowedHeaders: []string{"*"},
    }).Handler(mux)

    http.ListenAndServe(":8080", handler)
}
```

## Alternative: Using Railway's Built-in Routing

If you prefer not to use Caddy, you can use Railway's native routing:

1. Deploy OCC Dashboard as a separate Railway service
2. Use Railway's path-based routing in the dashboard
3. Configure custom domain with path prefix

However, this approach requires the OCC Dashboard to run on Railway, not GCP.

## Performance Considerations

### Latency

- **Direct GCP access**: ~50-100ms (depending on location)
- **Via Railway proxy**: +20-50ms overhead
- **Total**: ~70-150ms (acceptable for dashboard)

### Caching

Add caching to Caddyfile for static assets:

```caddyfile
handle_path /occ/* {
    reverse_proxy http://34.10.37.126:8080 {
        header_up Host {upstream_hostport}
        
        # Cache static assets
        @static {
            path *.css *.js *.png *.jpg *.svg
        }
        header @static Cache-Control "public, max-age=3600"
    }
}
```

### Load Balancing

For high availability, deploy multiple OCC Dashboard instances:

```caddyfile
handle_path /occ/* {
    reverse_proxy http://34.10.37.126:8080 http://34.10.37.127:8080 {
        lb_policy round_robin
        health_uri /api/health
        health_interval 30s
    }
}
```

## Security

### IP Whitelisting

Restrict OCC Dashboard access to specific IPs:

```caddyfile
handle_path /occ/* {
    @allowed {
        remote_ip 1.2.3.4 5.6.7.8
    }
    reverse_proxy @allowed http://34.10.37.126:8080
    respond "Access Denied" 403
}
```

### Authentication

Add basic auth to OCC Dashboard:

```caddyfile
handle_path /occ/* {
    basicauth {
        admin $2a$14$hashed_password_here
    }
    reverse_proxy http://34.10.37.126:8080
}
```

Generate hashed password:
```bash
caddy hash-password --plaintext "your-password"
```

## Monitoring

### Railway Logs

```bash
# View proxy logs
railway logs --service caddy-proxy

# Follow logs in real-time
railway logs --service caddy-proxy --follow
```

### GCP Logs

```bash
# View OCC Dashboard logs
gcloud compute ssh africoin-node-1 --zone=us-central1-a
tail -f /path/to/dashboard/logs/occ.log
```

### Health Checks

Set up monitoring for both endpoints:

```bash
# Monitor main site
curl -I https://www.africarailways.com/

# Monitor OCC Dashboard
curl -I https://www.africarailways.com/occ/api/health
```

## Cost Analysis

### Railway Costs

- **Hobby Plan**: $5/month (500 hours)
- **Pro Plan**: $20/month (unlimited hours)
- **Bandwidth**: Included up to 100GB/month

### GCP Costs

- **e2-micro VM**: ~$7/month
- **External IP**: ~$3/month
- **Egress**: ~$0.12/GB

**Total Monthly Cost**: ~$15-30/month

## Next Steps

1. ✅ Deploy Caddy proxy on Railway
2. ✅ Configure domain routing
3. ✅ Test OCC Dashboard access
4. ✅ Set up monitoring and alerts
5. ✅ Configure SSL/HTTPS
6. ✅ Add authentication (optional)
7. ✅ Set up backup OCC instances (optional)

## Support

- **Railway Docs**: https://docs.railway.app/
- **Caddy Docs**: https://caddyserver.com/docs/
- **GCP Docs**: https://cloud.google.com/docs

---

**Status**: Ready for deployment
**Last Updated**: December 26, 2024
