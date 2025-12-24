# 🚂 Railway Deployment Guide - OCC Dashboard

## 🎯 Quick Overview

Deploy the Africa Railways OCC Dashboard to Railway with custom subdomain `occ.africarailways.com`.

**Time Required:** 10-15 minutes  
**Cost:** $0-5/month (Free $5 credit)  
**Difficulty:** Easy ⭐⭐

---

## ✅ Prerequisites

- [x] GitHub account with `mpolobe/africa-railways` repository
- [x] Railway configuration files (already created)
- [x] Environment variables ready
- [ ] Railway account (we'll create this)

---

## 🚀 Method 1: Deploy via Railway Dashboard (Easiest)

### Step 1: Create Railway Account

1. **Go to Railway**
   ```
   https://railway.app
   ```

2. **Sign up with GitHub**
   - Click "Login with GitHub"
   - Authorize Railway to access your repositories
   - No credit card required!

### Step 2: Create New Project

1. **Click "New Project"**
   
2. **Select "Deploy from GitHub repo"**

3. **Choose Repository**
   - Select: `mpolobe/africa-railways`
   - Railway will scan the repository

4. **Configure Root Directory**
   - Click "Add variables"
   - Set root directory: `dashboard`
   - Railway will auto-detect Go application

### Step 3: Configure Environment Variables

1. **Click "Variables" tab**

2. **Add Required Variables:**
   ```
   RELAYER_PRIVATE_KEY=your_64_character_private_key_here
   ALCHEMY_API_KEY=your_alchemy_api_key_here
   PORT=8080
   ```

3. **Click "Add" for each variable**

### Step 4: Deploy

1. **Railway will automatically:**
   - Detect Go 1.22
   - Run `go build -o occ-dashboard main.go`
   - Start `./occ-dashboard`
   - Expose port 8080

2. **Wait for deployment** (~2-3 minutes)
   - Watch the build logs
   - Look for "Deployment successful"

3. **Get your Railway URL**
   - Example: `https://occ-dashboard-production.up.railway.app`
   - Test it: Click the URL to open dashboard

### Step 5: Add Custom Domain

1. **Go to Settings → Domains**

2. **Click "Add Domain"**

3. **Enter Custom Domain:**
   ```
   occ.africarailways.com
   ```

4. **Railway will provide DNS records:**
   ```
   Type: CNAME
   Name: occ
   Value: [your-app].up.railway.app
   TTL: 3600
   ```

5. **Copy the CNAME value** (you'll need this for DNS)

### Step 6: Update DNS Records

1. **Go to your domain registrar** (Namecheap, GoDaddy, Cloudflare, etc.)

2. **Add CNAME Record:**
   ```
   Type: CNAME
   Name: occ
   Value: [paste from Railway]
   TTL: 3600 (or Auto)
   ```

3. **Save DNS changes**

4. **Wait for propagation** (5 minutes to 48 hours, usually ~15 minutes)

### Step 7: Verify Deployment

1. **Test Railway URL:**
   ```bash
   curl https://occ-dashboard-production.up.railway.app/api/health
   ```

2. **Test Custom Domain** (after DNS propagates):
   ```bash
   curl https://occ.africarailways.com/api/health
   ```

3. **Check Dashboard:**
   - Open: https://occ.africarailways.com
   - Verify wallet balance shows
   - Check blockchain connection

---

## 🚀 Method 2: Deploy via Railway CLI (Advanced)

### Step 1: Install Railway CLI

```bash
# Via npm
npm i -g @railway/cli

# Or via Homebrew (Mac)
brew install railway

# Or via curl (Linux)
curl -fsSL https://railway.app/install.sh | sh
```

### Step 2: Login to Railway

```bash
railway login
```

This will open a browser window to authenticate.

### Step 3: Initialize Project

```bash
cd /workspaces/africa-railways/dashboard
railway init
```

Select:
- Create new project: Yes
- Project name: `occ-dashboard`

### Step 4: Link to GitHub (Optional)

```bash
railway link
```

Select your GitHub repository.

### Step 5: Set Environment Variables

```bash
railway variables set RELAYER_PRIVATE_KEY=your_64_character_private_key_here
railway variables set ALCHEMY_API_KEY=your_alchemy_api_key_here
railway variables set PORT=8080
```

### Step 6: Deploy

```bash
railway up
```

Railway will:
- Upload your code
- Build the Go application
- Deploy to production
- Provide a URL

### Step 7: Add Custom Domain

```bash
railway domain
```

Follow the prompts to add `occ.africarailways.com`.

### Step 8: View Logs

```bash
railway logs
```

---

## 📋 Configuration Files (Already Created)

### ✅ `railway.toml`
```toml
[build]
builder = "NIXPACKS"
buildCommand = "go build -o occ-dashboard main.go"

[deploy]
startCommand = "./occ-dashboard"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[env]
PORT = "8080"
```

### ✅ `Dockerfile`
```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o occ-dashboard main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/occ-dashboard .
COPY --from=builder /app/static ./static
EXPOSE 8080
CMD ["./occ-dashboard"]
```

### ✅ `.railwayignore`
```
occ-dashboard
*.exe
*.dll
*.so
*.dylib
*_test.go
test_*.go
.env
config.json
```

---

## 🔐 Environment Variables

### Required Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `RELAYER_PRIVATE_KEY` | `your_private_key...` | Your wallet private key |
| `ALCHEMY_API_KEY` | `your_alchemy_key...` | Alchemy API key |
| `PORT` | `8080` | Server port |

### Optional Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `GAS_POLICY_ID` | `your-policy-id` | Alchemy Gas Manager policy |
| `IPFS_API_KEY` | `your-pinata-key` | Pinata IPFS API key |

---

## 🌐 DNS Configuration

### For Namecheap

1. Login to Namecheap
2. Go to Domain List → Manage
3. Advanced DNS
4. Add New Record:
   ```
   Type: CNAME Record
   Host: occ
   Value: [from Railway]
   TTL: Automatic
   ```

### For GoDaddy

1. Login to GoDaddy
2. My Products → DNS
3. Add Record:
   ```
   Type: CNAME
   Name: occ
   Value: [from Railway]
   TTL: 1 Hour
   ```

### For Cloudflare

1. Login to Cloudflare
2. Select domain
3. DNS → Add record:
   ```
   Type: CNAME
   Name: occ
   Target: [from Railway]
   Proxy status: DNS only (gray cloud)
   TTL: Auto
   ```

---

## ✅ Verification Checklist

### After Deployment

- [ ] Railway deployment successful
- [ ] Railway URL works: `https://[your-app].up.railway.app`
- [ ] Health endpoint responds: `/api/health`
- [ ] Metrics endpoint works: `/api/metrics`
- [ ] Wallet address shows correctly
- [ ] Blockchain connection active
- [ ] Custom domain added in Railway
- [ ] DNS records updated
- [ ] Custom domain works: `https://occ.africarailways.com`
- [ ] SSL certificate active (https)
- [ ] WebSocket connection works

### Test Commands

```bash
# Test health
curl https://occ.africarailways.com/api/health

# Test metrics
curl https://occ.africarailways.com/api/metrics | jq '.wallet'

# Test blockchain
curl https://occ.africarailways.com/api/metrics | jq '.blockchain.polygon'

# Check SSL
curl -I https://occ.africarailways.com
```

---

## 🔄 Auto-Deployment

### Enable GitHub Auto-Deploy

1. **In Railway Dashboard:**
   - Go to Settings → GitHub
   - Enable "Auto-deploy on push"
   - Select branch: `main`
   - Set root directory: `dashboard`

2. **Now every push to `main` will:**
   - Trigger automatic build
   - Deploy to production
   - Update live site

---

## 📊 Monitoring

### View Logs

**Via Dashboard:**
- Go to Deployments → Logs
- Real-time log streaming

**Via CLI:**
```bash
railway logs --follow
```

### View Metrics

**Via Dashboard:**
- Go to Metrics tab
- See CPU, Memory, Network usage

**Via CLI:**
```bash
railway status
```

### Set Up Alerts

1. Go to Settings → Notifications
2. Add webhook or email
3. Configure alert thresholds

---

## 💰 Cost Breakdown

### Railway Pricing

```
Free Tier: $5 credit per month
OCC Dashboard Usage:
  - CPU: ~$2/month
  - Memory: ~$1/month
  - Network: ~$1/month
Total: ~$4/month (within free tier!)
```

### After Free Credit

```
Hobby Plan: $5/month
Includes:
  - $5 usage credit
  - Custom domains
  - SSL certificates
  - Auto-deploy
```

---

## 🛠️ Troubleshooting

### Build Fails

**Error:** `go: cannot find main module`

**Solution:**
```bash
# Ensure root directory is set to 'dashboard'
railway variables set RAILWAY_ROOT_DIRECTORY=dashboard
```

### Port Issues

**Error:** `bind: address already in use`

**Solution:**
```bash
# Ensure PORT is set to 8080
railway variables set PORT=8080
```

### Environment Variables Not Loading

**Error:** `RELAYER_PRIVATE_KEY not found`

**Solution:**
```bash
# Re-set variables
railway variables set RELAYER_PRIVATE_KEY=your_key
railway restart
```

### Custom Domain Not Working

**Check DNS:**
```bash
dig occ.africarailways.com
nslookup occ.africarailways.com
```

**Wait for propagation:** Can take up to 48 hours

### SSL Certificate Issues

**Solution:**
- Railway auto-provisions SSL
- Wait 5-10 minutes after adding domain
- Check Railway dashboard for certificate status

---

## 📱 Update Website Links

Once deployed, update `index.html`:

```html
<!-- Replace Gitpod URL -->
<a href="https://occ.africarailways.com" target="_blank">OCC Dashboard</a>
```

Commit and push:
```bash
git add index.html
git commit -m "feat: Update OCC Dashboard link to Railway production URL"
git push origin main
```

---

## 🎯 Quick Start Summary

```bash
# 1. Sign up for Railway
open https://railway.app

# 2. Deploy from GitHub
# - Select mpolobe/africa-railways
# - Set root directory: dashboard

# 3. Set environment variables
# - RELAYER_PRIVATE_KEY
# - ALCHEMY_API_KEY
# - PORT=8080

# 4. Add custom domain
# - occ.africarailways.com

# 5. Update DNS
# - Add CNAME record

# 6. Done! 🎉
```

---

## 📞 Support

### Railway Support

- **Documentation:** https://docs.railway.app
- **Discord:** https://discord.gg/railway
- **Status:** https://status.railway.app

### Need Help?

If you encounter issues:
1. Check Railway logs
2. Verify environment variables
3. Test with Railway URL first
4. Then add custom domain

---

## ✅ Next Steps

After successful deployment:

1. ✅ Test all API endpoints
2. ✅ Verify wallet balance tracking
3. ✅ Check blockchain connection
4. ✅ Update website links
5. ✅ Enable auto-deploy
6. ✅ Set up monitoring alerts
7. ✅ Share the live URL!

---

**Your OCC Dashboard will be live at:**
```
https://occ.africarailways.com
```

**Ready to deploy? Follow Method 1 (Dashboard) for the easiest experience!** 🚀
