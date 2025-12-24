# 🚀 OCC Dashboard Deployment on Fam.us.ai

## Overview

Deploy the Africa Railways OCC Dashboard to Fam.us.ai with custom subdomain `occ.africarailways.com`.

---

## 🎯 Why Fam.us.ai?

✅ **AI-Powered Deployment** - Intelligent infrastructure management  
✅ **Easy Setup** - Simple deployment process  
✅ **Custom Domains** - Free subdomain support  
✅ **Auto-Scaling** - Handles traffic automatically  
✅ **Built-in Monitoring** - Real-time metrics  
✅ **GitHub Integration** - Auto-deploy on push  

---

## 📋 Prerequisites

1. **Fam.us.ai Account**
   - Sign up at https://fam.us.ai
   - Connect your GitHub account

2. **GitHub Repository**
   - Repository: `mpolobe/africa-railways`
   - Branch: `main`
   - Directory: `dashboard`

3. **Environment Variables**
   - `RELAYER_PRIVATE_KEY`
   - `ALCHEMY_API_KEY`
   - `PORT=8080`

---

## 🚀 Deployment Steps

### Step 1: Prepare Configuration Files

#### 1.1 Create `fam.config.json`

```json
{
  "name": "occ-dashboard",
  "type": "web",
  "runtime": "go",
  "version": "1.22",
  "buildCommand": "go build -o occ-dashboard main.go",
  "startCommand": "./occ-dashboard",
  "port": 8080,
  "healthCheck": {
    "path": "/api/health",
    "interval": 30
  },
  "env": {
    "PORT": "8080"
  },
  "resources": {
    "cpu": "1",
    "memory": "512Mi"
  },
  "autoScale": {
    "enabled": true,
    "minInstances": 1,
    "maxInstances": 3
  }
}
```

#### 1.2 Create `.famignore`

```
# Ignore build artifacts
occ-dashboard
*.exe
*.dll
*.so
*.dylib

# Ignore test files
*_test.go
test_*.go

# Ignore local config
.env
config.json

# Ignore documentation
*.md
!README.md
```

#### 1.3 Update `Dockerfile` (if needed)

```dockerfile
# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o occ-dashboard main.go

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/occ-dashboard .

# Copy static files
COPY --from=builder /app/static ./static

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Run the application
CMD ["./occ-dashboard"]
```

---

## 🌐 Deployment via Fam.us.ai Dashboard

### Method 1: Web Dashboard (Easiest)

1. **Login to Fam.us.ai**
   ```
   https://fam.us.ai/login
   ```

2. **Create New Project**
   - Click "New Project"
   - Select "Import from GitHub"
   - Choose repository: `mpolobe/africa-railways`
   - Select directory: `dashboard`

3. **Configure Build Settings**
   ```
   Framework: Go
   Build Command: go build -o occ-dashboard main.go
   Start Command: ./occ-dashboard
   Port: 8080
   ```

4. **Set Environment Variables**
   - Go to Settings → Environment Variables
   - Add:
     ```
     RELAYER_PRIVATE_KEY=e4cbd7171db39d6d336b6555e0e1eec1c2da2cbc5ddc4a90c4acf61904552c56
     ALCHEMY_API_KEY=4-gxorN-H4MhqZWrskRQ-
     PORT=8080
     ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)

6. **Add Custom Domain**
   - Go to Settings → Domains
   - Click "Add Domain"
   - Enter: `occ.africarailways.com`
   - Copy DNS records provided

---

### Method 2: CLI Deployment

#### 2.1 Install Fam.us.ai CLI

```bash
# Install via npm
npm install -g @famous/cli

# Or via curl
curl -fsSL https://cli.fam.us.ai/install.sh | sh
```

#### 2.2 Login

```bash
famous login
```

#### 2.3 Initialize Project

```bash
cd /workspaces/africa-railways/dashboard
famous init
```

#### 2.4 Configure Environment

```bash
# Set environment variables
famous env set RELAYER_PRIVATE_KEY=e4cbd7171db39d6d336b6555e0e1eec1c2da2cbc5ddc4a90c4acf61904552c56
famous env set ALCHEMY_API_KEY=4-gxorN-H4MhqZWrskRQ-
famous env set PORT=8080
```

#### 2.5 Deploy

```bash
famous deploy
```

#### 2.6 Add Custom Domain

```bash
famous domain add occ.africarailways.com
```

---

## 🔧 DNS Configuration

After adding the custom domain, Fam.us.ai will provide DNS records:

### CNAME Record (Recommended)

```
Type: CNAME
Name: occ
Value: [provided by Fam.us.ai]
TTL: 3600
```

**Example:**
```
Type: CNAME
Name: occ
Value: occ-dashboard.fam.us.ai
TTL: 3600
```

### A Record (Alternative)

```
Type: A
Name: occ
Value: [IP address from Fam.us.ai]
TTL: 3600
```

---

## 📊 Monitoring & Logs

### View Logs

```bash
# Via CLI
famous logs --follow

# Or in dashboard
# Go to Deployments → Logs
```

### Monitor Metrics

```bash
# Via CLI
famous metrics

# Or in dashboard
# Go to Monitoring → Metrics
```

### Health Checks

Fam.us.ai will automatically monitor:
- `/api/health` endpoint
- Response time
- Error rates
- CPU/Memory usage

---

## 🔄 Auto-Deployment

### Enable GitHub Auto-Deploy

1. Go to Settings → Integrations
2. Connect GitHub repository
3. Enable auto-deploy on push to `main`
4. Select directory: `dashboard`

Now every push to `main` will automatically deploy!

---

## 🔐 Environment Variables

### Required Variables

```bash
RELAYER_PRIVATE_KEY=e4cbd7171db39d6d336b6555e0e1eec1c2da2cbc5ddc4a90c4acf61904552c56
ALCHEMY_API_KEY=4-gxorN-H4MhqZWrskRQ-
PORT=8080
```

### Optional Variables

```bash
GAS_POLICY_ID=your_gas_policy_id
IPFS_API_KEY=your_pinata_key
```

### Set via Dashboard

1. Go to Settings → Environment Variables
2. Click "Add Variable"
3. Enter key and value
4. Click "Save"
5. Redeploy for changes to take effect

### Set via CLI

```bash
famous env set KEY=value
famous env list  # View all variables
famous env delete KEY  # Remove variable
```

---

## ✅ Verification Steps

### 1. Check Deployment Status

```bash
famous status
```

### 2. Test Health Endpoint

```bash
curl https://occ-dashboard.fam.us.ai/api/health
```

### 3. Test Custom Domain

```bash
curl https://occ.africarailways.com/api/health
```

### 4. Test API Endpoints

```bash
# Get metrics
curl https://occ.africarailways.com/api/metrics

# Get wallet info
curl https://occ.africarailways.com/api/metrics | jq '.wallet'

# Get blockchain status
curl https://occ.africarailways.com/api/metrics | jq '.blockchain'
```

### 5. Test WebSocket

```javascript
const ws = new WebSocket('wss://occ.africarailways.com/ws');
ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};
```

---

## 🚀 Deployment Workflow

```
┌─────────────────────────────────────────┐
│  1. Push to GitHub (main branch)        │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  2. Fam.us.ai detects changes           │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  3. Build Go application                │
│     - go mod download                   │
│     - go build -o occ-dashboard         │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  4. Deploy to production                │
│     - Start ./occ-dashboard             │
│     - Health check /api/health          │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  5. Live at occ.africarailways.com      │
└─────────────────────────────────────────┘
```

---

## 📱 Update Website Links

Once deployed, update `index.html`:

```html
<!-- Replace Gitpod URL with Fam.us.ai subdomain -->
<a href="https://occ.africarailways.com" target="_blank">OCC Dashboard</a>
```

---

## 💰 Cost Estimate

Fam.us.ai pricing (typical):
```
Free Tier: Limited resources
Starter: $10-20/month
Pro: $50-100/month
```

For OCC Dashboard:
- **Estimated:** $10-20/month (Starter tier)
- **Resources:** 1 CPU, 512MB RAM
- **Bandwidth:** Included

---

## 🛠️ Troubleshooting

### Build Fails

**Check:**
1. Go version compatibility (1.22+)
2. Dependencies in go.mod
3. Build command is correct

**Solution:**
```bash
# Test build locally
cd dashboard
go build -o occ-dashboard main.go
```

### Deployment Fails

**Check:**
1. Environment variables are set
2. Port is 8080
3. Health check endpoint works

**Solution:**
```bash
# View logs
famous logs --tail 100
```

### Custom Domain Not Working

**Check:**
1. DNS records are correct
2. DNS propagation (can take 24-48 hours)
3. SSL certificate is provisioned

**Solution:**
```bash
# Check DNS
dig occ.africarailways.com

# Check SSL
curl -I https://occ.africarailways.com
```

---

## 📋 Deployment Checklist

- [ ] Create Fam.us.ai account
- [ ] Connect GitHub repository
- [ ] Create `fam.config.json`
- [ ] Set environment variables
- [ ] Deploy application
- [ ] Verify deployment works
- [ ] Add custom domain `occ.africarailways.com`
- [ ] Update DNS records
- [ ] Wait for DNS propagation
- [ ] Test custom domain
- [ ] Update website links
- [ ] Enable auto-deploy
- [ ] Set up monitoring

---

## 🎯 Quick Start Commands

```bash
# Install CLI
npm install -g @famous/cli

# Login
famous login

# Deploy
cd /workspaces/africa-railways/dashboard
famous init
famous env set RELAYER_PRIVATE_KEY=your_key
famous env set ALCHEMY_API_KEY=4-gxorN-H4MhqZWrskRQ-
famous deploy

# Add domain
famous domain add occ.africarailways.com

# View status
famous status
famous logs --follow
```

---

## 📚 Additional Resources

- **Fam.us.ai Documentation:** https://docs.fam.us.ai
- **Go Deployment Guide:** https://docs.fam.us.ai/guides/go
- **Custom Domains:** https://docs.fam.us.ai/domains
- **Environment Variables:** https://docs.fam.us.ai/env-vars

---

## ✅ Summary

**Deployment Plan:**

1. ✅ Configuration files created
2. ⏳ Deploy to Fam.us.ai
3. ⏳ Set environment variables
4. ⏳ Add custom domain
5. ⏳ Update DNS records
6. ⏳ Update website links

**Expected Result:**
- OCC Dashboard live at `https://occ.africarailways.com`
- Auto-deploy on GitHub push
- Real-time monitoring
- Custom subdomain with SSL

---

**Ready to deploy?** Follow the steps above or let me know if you need help with any specific part!
