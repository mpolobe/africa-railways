# 🌐 OCC Dashboard Subdomain Setup Guide

## Overview

This guide explains how to deploy the OCC Dashboard to a production hosting service and configure the subdomain `occ.africarailways.com`.

---

## 🚨 Important Note

**The OCC Dashboard is a Go application that requires a backend server.** It cannot be deployed to Vercel (which is for static sites and serverless functions). You need to deploy it to a service that supports Go applications.

---

## 🎯 Recommended Hosting Options

### Option 1: Railway.app (Recommended)

**Pros:**
- ✅ Easy deployment from GitHub
- ✅ Automatic HTTPS
- ✅ Custom domain support
- ✅ Environment variables management
- ✅ Free tier available

**Steps:**

1. **Sign up for Railway**
   ```
   https://railway.app
   ```

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `mpolobe/africa-railways`
   - Select the `dashboard` directory

3. **Configure Build**
   - Railway will auto-detect Go
   - Build command: `go build -o occ-dashboard main.go`
   - Start command: `./occ-dashboard`

4. **Set Environment Variables**
   ```
   RELAYER_PRIVATE_KEY=your_private_key_here
   ALCHEMY_API_KEY=4-gxorN-H4MhqZWrskRQ-
   PORT=8080
   ```

5. **Add Custom Domain**
   - Go to Settings → Domains
   - Click "Add Domain"
   - Enter: `occ.africarailways.com`
   - Railway will provide DNS records

6. **Update DNS Records**
   - Go to your domain registrar (Namecheap, GoDaddy, etc.)
   - Add CNAME record:
     ```
     Type: CNAME
     Name: occ
     Value: [provided by Railway]
     TTL: 3600
     ```

---

### Option 2: Render.com

**Pros:**
- ✅ Free tier available
- ✅ Automatic deployments
- ✅ Custom domains
- ✅ Built-in SSL

**Steps:**

1. **Sign up for Render**
   ```
   https://render.com
   ```

2. **Create New Web Service**
   - Click "New +"
   - Select "Web Service"
   - Connect GitHub repository
   - Root directory: `dashboard`

3. **Configure Service**
   ```
   Name: occ-dashboard
   Environment: Go
   Build Command: go build -o occ-dashboard main.go
   Start Command: ./occ-dashboard
   ```

4. **Set Environment Variables**
   ```
   RELAYER_PRIVATE_KEY=your_private_key_here
   ALCHEMY_API_KEY=4-gxorN-H4MhqZWrskRQ-
   PORT=8080
   ```

5. **Add Custom Domain**
   - Go to Settings → Custom Domain
   - Add: `occ.africarailways.com`
   - Follow DNS configuration instructions

---

### Option 3: Fly.io

**Pros:**
- ✅ Global edge deployment
- ✅ Free tier
- ✅ Docker support

**Steps:**

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login to Fly**
   ```bash
   fly auth login
   ```

3. **Deploy from Dashboard Directory**
   ```bash
   cd dashboard
   fly launch
   ```

4. **Set Secrets**
   ```bash
   fly secrets set RELAYER_PRIVATE_KEY=your_key_here
   fly secrets set ALCHEMY_API_KEY=4-gxorN-H4MhqZWrskRQ-
   ```

5. **Add Custom Domain**
   ```bash
   fly certs add occ.africarailways.com
   ```

---

## 📋 DNS Configuration

Once you've deployed to your chosen hosting service, configure DNS:

### CNAME Record (Recommended)

```
Type: CNAME
Name: occ
Value: [provided by hosting service]
TTL: 3600
```

**Examples:**
- Railway: `occ-dashboard.up.railway.app`
- Render: `occ-dashboard.onrender.com`
- Fly.io: `occ-dashboard.fly.dev`

### A Record (Alternative)

```
Type: A
Name: occ
Value: [IP address from hosting service]
TTL: 3600
```

---

## 🔐 Environment Variables Required

The OCC Dashboard needs these environment variables:

```bash
# Required
RELAYER_PRIVATE_KEY=your_64_char_hex_private_key
ALCHEMY_API_KEY=4-gxorN-H4MhqZWrskRQ-

# Optional
PORT=8080
GAS_POLICY_ID=your_gas_policy_id
IPFS_API_KEY=your_pinata_key
```

**⚠️ Security:** Never commit these values to Git. Set them in your hosting service's environment variables dashboard.

---

## 🚀 Quick Deploy with Railway (Fastest)

### 1. One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

### 2. Manual Deploy

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
cd dashboard
railway init

# Set environment variables
railway variables set RELAYER_PRIVATE_KEY=your_key_here
railway variables set ALCHEMY_API_KEY=4-gxorN-H4MhqZWrskRQ-

# Deploy
railway up

# Add custom domain
railway domain add occ.africarailways.com
```

---

## 📊 Deployment Files Created

### 1. `railway.json`
Configuration for Railway deployment.

### 2. `Dockerfile`
Docker configuration for containerized deployment.

### 3. `render.yaml` (Optional)
Create this for Render.com:

```yaml
services:
  - type: web
    name: occ-dashboard
    env: go
    buildCommand: go build -o occ-dashboard main.go
    startCommand: ./occ-dashboard
    envVars:
      - key: PORT
        value: 8080
      - key: RELAYER_PRIVATE_KEY
        sync: false
      - key: ALCHEMY_API_KEY
        sync: false
```

---

## ✅ Verification Steps

After deployment:

1. **Test the deployment URL**
   ```bash
   curl https://your-app.railway.app/api/health
   ```

2. **Verify custom domain**
   ```bash
   curl https://occ.africarailways.com/api/health
   ```

3. **Check SSL certificate**
   ```bash
   curl -I https://occ.africarailways.com
   ```

4. **Test API endpoints**
   ```bash
   curl https://occ.africarailways.com/api/metrics
   ```

---

## 🔄 Update Website Links

Once deployed, update `index.html`:

```html
<!-- Replace Gitpod URL with production subdomain -->
<a href="https://occ.africarailways.com">OCC Dashboard</a>
```

---

## 📱 Current Status

### Temporary (Gitpod)
```
https://8080--019b4edd-6fb5-72c3-bce9-ad11fda70f5f.eu-central-1-01.gitpod.dev
```
- ⚠️ Temporary development URL
- ⚠️ Expires when Gitpod workspace stops
- ⚠️ Not suitable for production

### Production (To Be Deployed)
```
https://occ.africarailways.com
```
- ✅ Permanent subdomain
- ✅ Custom SSL certificate
- ✅ Always available
- ✅ Professional URL

---

## 💰 Cost Comparison

| Service | Free Tier | Custom Domain | SSL | Auto-Deploy |
|---------|-----------|---------------|-----|-------------|
| Railway | ✅ $5 credit/month | ✅ Free | ✅ Free | ✅ Yes |
| Render | ✅ 750 hours/month | ✅ Free | ✅ Free | ✅ Yes |
| Fly.io | ✅ 3 VMs free | ✅ Free | ✅ Free | ✅ Yes |

**Recommendation:** Railway.app for easiest setup and best developer experience.

---

## 🛠️ Troubleshooting

### Domain Not Working

1. **Check DNS propagation**
   ```bash
   dig occ.africarailways.com
   ```

2. **Wait for DNS propagation** (can take up to 48 hours)

3. **Verify CNAME record**
   ```bash
   nslookup occ.africarailways.com
   ```

### SSL Certificate Issues

- Most hosting services auto-provision SSL
- Wait 5-10 minutes after adding domain
- Check hosting service dashboard for certificate status

### Application Not Starting

1. Check environment variables are set
2. Review deployment logs
3. Verify Go version compatibility
4. Check port configuration (should be 8080)

---

## 📚 Next Steps

1. **Choose a hosting service** (Railway recommended)
2. **Deploy the OCC dashboard**
3. **Configure environment variables**
4. **Add custom domain** (occ.africarailways.com)
5. **Update DNS records**
6. **Update website links**
7. **Test production deployment**

---

## 🎯 Summary

**Current Situation:**
- OCC Dashboard running on temporary Gitpod URL
- Need permanent production deployment

**Solution:**
1. Deploy to Railway/Render/Fly.io
2. Configure subdomain: occ.africarailways.com
3. Update website links
4. Enjoy permanent, professional URL!

**Estimated Time:** 15-30 minutes

---

## 📞 Support

If you need help with deployment:

1. Check hosting service documentation
2. Review deployment logs
3. Verify environment variables
4. Test with temporary URL first
5. Then add custom domain

---

**Ready to deploy?** Start with Railway.app for the easiest experience!
