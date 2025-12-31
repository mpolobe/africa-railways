# Railway.app Deployment Guide - ARAIL USSD Gateway

## Overview

This guide walks through deploying the ARAIL USSD gateway (*384*26621#) to Railway.app, enabling real-time ticket booking and $SENT investment via USSD.

## Prerequisites

- Railway.app account (https://railway.app)
- GitHub repository connected
- Africa's Talking account
- Sui wallet with private key

---

## Quick Deploy

### Option 1: Deploy from GitHub (Recommended)

1. **Connect Repository**
   ```bash
   # Push latest changes
   git add -A
   git commit -m "Add USSD backend"
   git push origin main
   ```

2. **Create Railway Project**
   - Go to https://railway.app/new
   - Click "Deploy from GitHub repo"
   - Select `africa-railways` repository
   - Railway will auto-detect Python and deploy

3. **Set Environment Variables**
   ```bash
   # Using Railway CLI
   railway variables set FLASK_ENV=production
   railway variables set SUI_RPC_URL=https://fullnode.mainnet.sui.io:443
   railway variables set SUI_PRIVATE_KEY=your_base64_key
   railway variables set PACKAGE_ID=0xYOUR_PACKAGE_ID
   railway variables set TREASURY_ID=0xYOUR_TREASURY_ID
   railway variables set AFRICAS_TALKING_API_KEY=your_api_key
   ```

4. **Deploy**
   ```bash
   railway up
   ```

### Option 2: Deploy via Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to existing project or create new
railway link

# Deploy
railway up

# View logs
railway logs
```

---

## File Structure

```
africa-railways/
├── app.py                    # Main Flask application
├── requirements.txt          # Python dependencies
├── Procfile                  # Railway start command
├── runtime.txt              # Python version
├── railway.json             # Railway configuration
├── test_ussd.py             # Testing script
└── .env.example             # Environment variables template
```

---

## Configuration Files

### 1. app.py (Main Application)

Located at root: `/workspaces/africa-railways/app.py`

Key features:
- USSD callback handler at `/ussd`
- Health check at `/health`
- Payment webhook at `/webhook/payment`
- Stats API at `/api/stats`

### 2. requirements.txt

```txt
flask==3.0.0
gunicorn==21.2.0
requests==2.31.0
flask-cors==4.0.0
pysui==0.50.0
python-dotenv==1.0.0
psycopg2-binary==2.9.9
redis==5.0.1
```

### 3. Procfile

```
web: gunicorn app:app
```

This tells Railway to:
- Start a web service
- Use gunicorn as the WSGI server
- Run the Flask app from `app.py`

### 4. runtime.txt

```
python-3.11.7
```

Specifies Python version for Railway.

### 5. railway.json (Optional)

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pip install -r requirements.txt"
  },
  "deploy": {
    "startCommand": "gunicorn app:app",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100
  }
}
```

---

## Environment Variables

### Required Variables

Set these in Railway dashboard or via CLI:

```bash
# Flask
FLASK_ENV=production
PORT=5000  # Railway sets this automatically

# Sui Blockchain
SUI_RPC_URL=https://fullnode.mainnet.sui.io:443
SUI_PRIVATE_KEY=base64_encoded_private_key
PACKAGE_ID=0xYOUR_PACKAGE_ID_HERE
TREASURY_ID=0xYOUR_TREASURY_ID_HERE

# Africa's Talking
AFRICAS_TALKING_API_KEY=your_api_key
AFRICAS_TALKING_USERNAME=your_username
```

### Optional Variables

```bash
# Database (if using PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:5432/arail

# Redis (for session storage)
REDIS_URL=redis://host:6379

# Mobile Money
MTN_API_KEY=your_mtn_key
AIRTEL_API_KEY=your_airtel_key

# Monitoring
SENTRY_DSN=your_sentry_dsn
```

### Setting Variables via Railway Dashboard

1. Go to your project
2. Click "Variables" tab
3. Click "New Variable"
4. Add each variable
5. Click "Deploy" to apply changes

### Setting Variables via CLI

```bash
# Single variable
railway variables set FLASK_ENV=production

# Multiple variables from file
railway variables set -f .env.production

# View all variables
railway variables
```

---

## Deployment Steps

### Step 1: Prepare Code

```bash
cd /workspaces/africa-railways

# Ensure all files are present
ls -la app.py requirements.txt Procfile runtime.txt

# Test locally first
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py

# Test USSD endpoint
curl -X POST http://localhost:5000/ussd \
  -d "sessionId=test&serviceCode=*384*26621#&phoneNumber=%2B260977123456&text="
```

### Step 2: Push to GitHub

```bash
git add app.py requirements.txt Procfile runtime.txt railway.json
git commit -m "Add Railway.app deployment configuration"
git push origin main
```

### Step 3: Deploy to Railway

```bash
# Option A: Via CLI
railway up

# Option B: Via Dashboard
# 1. Go to railway.app/new
# 2. Select GitHub repo
# 3. Railway auto-deploys
```

### Step 4: Configure Callback URL

Once deployed, Railway provides a URL like:
```
https://africa-railways-production.up.railway.app
```

Update Africa's Talking:
1. Go to Africa's Talking dashboard
2. Navigate to USSD → Service Codes
3. Find *384*26621#
4. Set callback URL: `https://africa-railways-production.up.railway.app/ussd`
5. Save changes

### Step 5: Test Deployment

```bash
# Health check
curl https://africa-railways-production.up.railway.app/health

# USSD test
python3 test_ussd.py
```

---

## Monitoring & Logs

### View Logs

```bash
# Via CLI
railway logs

# Follow logs in real-time
railway logs --follow

# Filter by service
railway logs --service web
```

### Railway Dashboard

1. Go to your project
2. Click "Deployments" tab
3. Click on latest deployment
4. View logs, metrics, and build output

### Health Checks

Railway automatically monitors `/health` endpoint:

```bash
curl https://your-app.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "ARAIL USSD Gateway",
  "version": "1.0.0",
  "timestamp": "2025-12-31T20:00:00",
  "sui_integration": true
}
```

---

## Troubleshooting

### Issue: Build Fails

**Error:** `Could not find a version that satisfies the requirement`

**Solution:**
```bash
# Update requirements.txt with specific versions
pip freeze > requirements.txt

# Or use compatible versions
flask>=3.0.0
gunicorn>=21.0.0
```

### Issue: App Crashes on Start

**Error:** `ModuleNotFoundError: No module named 'app'`

**Solution:**
- Ensure `app.py` is in root directory
- Check Procfile: `web: gunicorn app:app`
- Verify file structure

### Issue: USSD Not Responding

**Error:** Africa's Talking shows timeout

**Solution:**
1. Check Railway logs: `railway logs`
2. Verify callback URL is correct
3. Test health endpoint
4. Check IP whitelist in `app.py`

### Issue: Sui Integration Fails

**Error:** `pysui not installed`

**Solution:**
```bash
# Add to requirements.txt
pysui==0.50.0

# Redeploy
railway up
```

### Issue: Environment Variables Not Set

**Error:** `KeyError: 'SUI_PRIVATE_KEY'`

**Solution:**
```bash
# Check variables
railway variables

# Set missing variables
railway variables set SUI_PRIVATE_KEY=your_key

# Restart service
railway restart
```

---

## Performance Optimization

### Gunicorn Configuration

Update Procfile for production:

```
web: gunicorn app:app --workers 4 --threads 2 --timeout 120 --bind 0.0.0.0:$PORT --log-level info --access-logfile - --error-logfile -
```

Options:
- `--workers 4`: 4 worker processes
- `--threads 2`: 2 threads per worker
- `--timeout 120`: 120 second timeout
- `--log-level info`: Info-level logging

### Redis for Session Storage

Add Redis to Railway:

```bash
# Add Redis service
railway add redis

# Update app.py to use Redis
import redis
redis_client = redis.from_url(os.environ.get('REDIS_URL'))
```

### Database Connection Pooling

For PostgreSQL:

```python
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    os.environ.get('DATABASE_URL'),
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20
)
```

---

## Scaling

### Horizontal Scaling

Railway supports multiple replicas:

```bash
# Scale to 3 replicas
railway scale --replicas 3

# Auto-scaling (Pro plan)
railway autoscale --min 2 --max 10
```

### Vertical Scaling

Upgrade resources in Railway dashboard:
- Memory: 512MB → 8GB
- CPU: Shared → Dedicated

---

## Security

### IP Whitelisting

Already implemented in `app.py`:

```python
ALLOWED_IPS = [
    '52.48.80.0/24',
    '54.76.0.0/16',
    '3.8.0.0/16',
    '18.202.0.0/16',
]
```

### HTTPS

Railway provides automatic HTTPS:
- SSL certificate auto-generated
- HTTP → HTTPS redirect enabled
- TLS 1.3 support

### Secrets Management

Never commit secrets to Git:

```bash
# Use Railway variables
railway variables set SECRET_KEY=$(openssl rand -hex 32)

# Or use .env (gitignored)
echo "SECRET_KEY=..." >> .env
```

---

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install Railway CLI
        run: npm i -g @railway/cli
      
      - name: Deploy
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### Automatic Deployments

Railway auto-deploys on:
- Push to main branch
- Pull request merge
- Manual trigger

Disable auto-deploy:
```bash
railway settings --auto-deploy false
```

---

## Cost Estimation

### Railway Pricing (as of 2025)

**Hobby Plan (Free):**
- $5 free credit/month
- 512MB RAM
- Shared CPU
- 1GB disk
- Good for testing

**Pro Plan ($20/month):**
- $20 credit included
- Up to 8GB RAM
- Dedicated CPU
- 100GB disk
- Custom domains
- Priority support

**Usage-Based:**
- $0.000463/GB-hour (RAM)
- $0.000231/vCPU-hour
- $0.25/GB (disk)
- $0.10/GB (bandwidth)

### Estimated Monthly Cost

For ARAIL USSD gateway:
- RAM: 1GB × 730 hours = $0.34
- CPU: 0.5 vCPU × 730 hours = $0.08
- Disk: 5GB = $1.25
- Bandwidth: 10GB = $1.00
- **Total: ~$2.67/month**

---

## Production Checklist

### Pre-Launch

- [ ] All environment variables set
- [ ] Health check endpoint working
- [ ] USSD callback URL configured
- [ ] IP whitelist enabled
- [ ] Logging configured
- [ ] Error monitoring (Sentry) set up
- [ ] Database backups enabled
- [ ] SSL certificate active

### Launch Day

- [ ] Monitor Railway logs
- [ ] Test USSD with real phone
- [ ] Verify Sui transactions
- [ ] Check mobile money integration
- [ ] Monitor response times
- [ ] Have support team ready

### Post-Launch

- [ ] Daily health checks
- [ ] Weekly performance reviews
- [ ] Monthly security audits
- [ ] Quarterly load testing
- [ ] Update dependencies regularly

---

## Support

**Railway.app:**
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app

**ARAIL:**
- Email: tech@africarailways.com
- GitHub: https://github.com/mpolobe/africa-railways
- Telegram: @Africoin_Official

---

**Last Updated:** December 31, 2025  
**Version:** 1.0.0  
**Status:** Production Ready
