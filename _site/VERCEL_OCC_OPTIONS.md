# 🌐 OCC Dashboard on Vercel - Options

## ❌ Why the Current OCC Dashboard Can't Run on Vercel

**The Problem:**
- The OCC Dashboard is a **Go backend server** that runs continuously
- It maintains WebSocket connections
- It polls blockchain data every 5 seconds
- Vercel only supports:
  - Static sites (HTML/CSS/JS)
  - Serverless functions (max 10-60 second execution time)

---

## ✅ Solution Options

### Option 1: Static Dashboard + External API (Recommended)

**How it works:**
1. Deploy static HTML/CSS/JS dashboard to Vercel at `occ.africarailways.com`
2. Keep Go backend running on Railway/Render
3. Static dashboard fetches data from backend API via CORS

**Pros:**
- ✅ Can use Vercel subdomain
- ✅ Fast static site delivery
- ✅ Vercel's global CDN
- ✅ Free SSL certificate

**Cons:**
- ⚠️ Need separate backend hosting (Railway/Render)
- ⚠️ Two services to manage

**Implementation:**
```
Vercel (occ.africarailways.com)
  ↓ Static HTML/JS
  ↓ Fetches data from ↓
Railway (api.africarailways.com)
  ↓ Go Backend API
```

---

### Option 2: Vercel Serverless Functions

**How it works:**
- Convert Go backend to Vercel serverless functions
- Each API endpoint becomes a separate function
- No WebSocket support
- No continuous polling

**Pros:**
- ✅ Everything on Vercel
- ✅ Single deployment
- ✅ Subdomain works

**Cons:**
- ❌ No real-time updates (no WebSocket)
- ❌ Cold starts (slower first request)
- ❌ 10-60 second timeout limit
- ❌ No continuous blockchain polling

**Not Recommended** - Loses key features

---

### Option 3: Hybrid Approach (Best of Both Worlds)

**How it works:**
1. **Vercel** hosts static dashboard at `occ.africarailways.com`
2. **Railway** hosts Go backend at `api-occ.africarailways.com`
3. Dashboard connects to API for real-time data

**Architecture:**
```
User Browser
    ↓
Vercel Static Site (occ.africarailways.com)
    ↓ API Calls
Railway Go Backend (api-occ.africarailways.com)
    ↓ Blockchain Data
Polygon Amoy / Alchemy
```

**Pros:**
- ✅ Professional subdomain on Vercel
- ✅ Real-time updates from Go backend
- ✅ WebSocket support
- ✅ Fast static delivery
- ✅ Continuous blockchain monitoring

**Cons:**
- ⚠️ Two services (but both free tier)

---

## 🚀 Recommended: Option 3 (Hybrid)

### Step 1: Deploy Go Backend to Railway

```bash
# Deploy backend to Railway
cd dashboard
railway init
railway up

# Get your Railway URL
# Example: https://occ-backend.up.railway.app
```

### Step 2: Create Static Dashboard for Vercel

I'll create a static version that connects to your Railway backend:

```html
<!-- dashboard-static/index.html -->
<!DOCTYPE html>
<html>
<head>
    <title>OCC Dashboard</title>
    <script>
        const API_URL = 'https://occ-backend.up.railway.app';
        
        async function fetchMetrics() {
            const response = await fetch(`${API_URL}/api/metrics`);
            const data = await response.json();
            updateDashboard(data);
        }
        
        setInterval(fetchMetrics, 5000);
    </script>
</head>
<body>
    <!-- Dashboard UI -->
</body>
</html>
```

### Step 3: Deploy to Vercel with Subdomain

```bash
# Deploy static dashboard to Vercel
cd dashboard-static
vercel --prod

# Add custom domain in Vercel dashboard
# Domain: occ.africarailways.com
```

---

## 📋 Quick Setup Guide

### 1. Deploy Backend (Railway)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy from dashboard directory
cd /workspaces/africa-railways/dashboard
railway init
railway up

# Set environment variables
railway variables set RELAYER_PRIVATE_KEY=your_key
railway variables set ALCHEMY_API_KEY=4-gxorN-H4MhqZWrskRQ-

# Note your Railway URL
railway domain
# Example: occ-backend-production.up.railway.app
```

### 2. Create Static Dashboard

I'll create this for you with the Railway API URL.

### 3. Deploy to Vercel

```bash
# Deploy static dashboard
cd dashboard-static
vercel --prod

# In Vercel dashboard:
# 1. Go to Settings → Domains
# 2. Add: occ.africarailways.com
# 3. Add DNS records provided by Vercel
```

### 4. Update DNS

Add to your domain registrar:

```
Type: CNAME
Name: occ
Value: cname.vercel-dns.com
TTL: 3600
```

---

## 💰 Cost Breakdown

### Hybrid Approach (Recommended)

| Service | Purpose | Cost |
|---------|---------|------|
| Vercel | Static dashboard | ✅ Free |
| Railway | Go backend | ✅ Free ($5 credit/month) |
| **Total** | | **$0/month** |

Both services have generous free tiers!

---

## 🎯 What I'll Create for You

### 1. Static Dashboard (`dashboard-static/`)
- HTML/CSS/JS only
- Connects to Railway backend API
- Real-time updates via polling
- Responsive design
- All current features

### 2. Vercel Configuration (`vercel.json`)
```json
{
  "version": 2,
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

### 3. Backend CORS Configuration
Update Go backend to allow Vercel domain:
```go
cors.New(cors.Options{
    AllowedOrigins: []string{
        "https://occ.africarailways.com",
        "https://*.vercel.app"
    },
})
```

---

## ✅ Final Architecture

```
┌─────────────────────────────────────────┐
│  User Browser                           │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  Vercel (occ.africarailways.com)        │
│  - Static HTML/CSS/JS                   │
│  - Dashboard UI                         │
│  - Free SSL                             │
│  - Global CDN                           │
└─────────────────────────────────────────┘
                 ↓ API Calls
┌─────────────────────────────────────────┐
│  Railway (api-occ.africarailways.com)   │
│  - Go Backend                           │
│  - WebSocket Server                     │
│  - Blockchain Polling                   │
│  - Real-time Metrics                    │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  Polygon Amoy / Alchemy                 │
│  - Blockchain Data                      │
└─────────────────────────────────────────┘
```

---

## 🚀 Next Steps

**Would you like me to:**

1. ✅ Create the static dashboard for Vercel
2. ✅ Set up the Railway deployment configuration
3. ✅ Update CORS settings for cross-origin requests
4. ✅ Create deployment scripts

**This will give you:**
- `occ.africarailways.com` hosted on Vercel (static dashboard)
- Backend API on Railway (free tier)
- Full real-time functionality
- Professional subdomain

---

## 📞 Summary

**Answer:** No, the current Go backend can't run on Vercel, BUT we can:

1. **Deploy static dashboard to Vercel** at `occ.africarailways.com`
2. **Deploy Go backend to Railway** (free tier)
3. **Connect them via API** for full functionality

This gives you the Vercel subdomain you want while keeping all features!

**Ready to proceed?** I can create the static dashboard and deployment configs now.
