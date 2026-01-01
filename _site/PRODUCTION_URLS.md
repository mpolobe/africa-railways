# Production URLs - Africa Railways

## Live Deployment URLs

### Main Website
**URL**: [https://africarailways.com](https://africarailways.com)

**Hosted on**: Vercel

**Features**:
- Landing page with platform overview
- Feature showcase
- Sentinel Network information
- Tokenomics details
- Links to all dashboards

---

### OCC Dashboard (Operational Control Centre)
**URL**: [https://occ.africarailways.com](https://occ.africarailways.com)

**Hosted on**: TBD (Railway/Render/Vercel)

**Features**:
- Real-time blockchain monitoring (Sui + Polygon)
- Big number KPIs with sparkline charts
- Live blockchain feed (terminal-style)
- Revenue tracking (confirmed + pending)
- System health indicators
- Force resync capability
- Failed attempts counter with visual alerts

**Port**: 8080 (when running locally)

---

### Sentinel Portal
**URL**: [https://africarailways.com/dashboard.html](https://africarailways.com/dashboard.html)

**Hosted on**: Vercel

**Features**:
- Africa map with active routes
- Live activity feed
- Sentinel network status
- AFRC token supply tracking

---

### Backend API
**URL**: [https://api.africarailways.com](https://api.africarailways.com)

**Hosted on**: TBD (Railway/Render)

**Endpoints**:
- `GET /health` - Health check
- `GET /api/reports` - Fetch reports
- `POST /api/report` - Submit report
- `GET /api/metrics` - System metrics
- `GET /api/alerts` - Active alerts
- `POST /api/control/*` - Control endpoints
- `WS /ws` - WebSocket connection

**Port**: 8080 (when running locally)

---

### WebSocket Server
**URL**: [wss://api.africarailways.com/ws](wss://api.africarailways.com/ws)

**Hosted on**: TBD (Railway/Render)

**Features**:
- Real-time event streaming
- Live blockchain updates
- System notifications

**Port**: 8081 (when running locally)

---

## DNS Configuration Required

To make all URLs work, configure these DNS records in your domain registrar:

### A/CNAME Records

```
# Main site (Vercel)
africarailways.com → Vercel IP/CNAME
www.africarailways.com → Vercel IP/CNAME

# OCC Dashboard subdomain
occ.africarailways.com → [Your OCC hosting provider]

# API subdomain
api.africarailways.com → [Your backend hosting provider]
```

### Example for Vercel

```
Type: CNAME
Name: @
Value: cname.vercel-dns.com

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Example for Railway (OCC + API)

```
Type: CNAME
Name: occ
Value: [your-app].up.railway.app

Type: CNAME
Name: api
Value: [your-backend].up.railway.app
```

---

## Environment Variables

### OCC Dashboard (`dashboard/`)

```bash
PORT=8080
RELAYER_URL=https://api.africarailways.com
```

### Backend API

```bash
PORT=8080
POLYGON_RPC_URL=your-polygon-rpc
RELAYER_ADDRESS=your-relayer-address
IPFS_API_KEY=your-ipfs-key
ALCHEMY_API_KEY=your-alchemy-key
GAS_POLICY_ID=your-gas-policy
```

### Relayer Service

```bash
PORT=8082
POLYGON_RPC_URL=your-polygon-rpc
SUI_RPC_URL=your-sui-rpc
```

---

## Deployment Checklist

### ✅ Completed

- [x] Main website updated with production URLs
- [x] OCC Dashboard links added to navigation
- [x] Sentinel Portal API endpoints updated
- [x] Frontend app.js updated to production API
- [x] ReportingTool.js updated to production API
- [x] Mobile app uses production URL from config
- [x] All changes pushed to GitHub

### 🔲 Pending

- [ ] Deploy OCC Dashboard to hosting provider
- [ ] Deploy Backend API to hosting provider
- [ ] Deploy Relayer service to hosting provider
- [ ] Configure DNS records for subdomains
- [ ] Set up SSL certificates (automatic with most providers)
- [ ] Configure environment variables on hosting platforms
- [ ] Test all endpoints after deployment
- [ ] Update CORS settings if needed

---

## Local Development URLs

When running locally, use these URLs:

```
Main site: http://localhost:3000 (or file:// for static)
OCC Dashboard: http://localhost:8080
Backend API: http://localhost:8080
Relayer: http://localhost:8082
USSD Gateway: http://localhost:8081
```

---

## Testing Production URLs

### After Deployment

```bash
# Test main site
curl https://africarailways.com

# Test OCC Dashboard
curl https://occ.africarailways.com

# Test API health
curl https://api.africarailways.com/health

# Test WebSocket (using wscat)
wscat -c wss://api.africarailways.com/ws
```

---

## Hosting Recommendations

### Main Website (Vercel) ✅
- **Status**: Already configured
- **Auto-deploy**: Enabled from GitHub
- **SSL**: Automatic
- **CDN**: Global edge network

### OCC Dashboard (Railway/Render)
- **Recommended**: Railway or Render
- **Reason**: Go binary support, easy deployment
- **Cost**: Free tier available
- **Setup**: Connect GitHub repo, auto-deploy

### Backend API (Railway/Render)
- **Recommended**: Railway or Render
- **Reason**: Go binary support, persistent storage
- **Cost**: Free tier available
- **Setup**: Connect GitHub repo, auto-deploy

### Relayer Service (Railway/Render)
- **Recommended**: Railway (better for long-running processes)
- **Reason**: Needs to run 24/7, blockchain connections
- **Cost**: Paid tier recommended for reliability
- **Setup**: Connect GitHub repo, auto-deploy

---

## Support

For deployment assistance:
1. Check hosting provider documentation
2. Review `DEPLOYMENT.md` in repo
3. Test locally first with `./start-occ.sh`
4. Verify environment variables are set correctly

---

## Security Notes

- All production URLs use HTTPS/WSS
- API keys stored as environment variables
- CORS configured for africarailways.com domain
- Rate limiting recommended for API endpoints
- WebSocket authentication recommended for production

---

## Monitoring

After deployment, monitor:
- Uptime (use UptimeRobot or similar)
- API response times
- Error rates
- WebSocket connection stability
- Blockchain sync status

---

Last Updated: 2024-12-24
