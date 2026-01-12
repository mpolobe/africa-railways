# Airtable Integration - Quick Start Guide

Get your Airtable Operational Control Plane up and running in 15 minutes.

## Step 1: Create Airtable Bases (5 minutes)

### 1.1 Sign Up for Airtable
- Go to [airtable.com](https://airtable.com)
- Sign up for a Team plan (recommended) or Pro plan
- Create a new workspace: "Africa Railways"

### 1.2 Create Four Bases

Create these bases in your workspace:

1. **Infrastructure & Assets**
   - Rail Lines
   - Stations
   - Trains / Rolling Stock
   - Maintenance Logs
   - Capacity Allocations

2. **Operations & Ticketing**
   - Schedules
   - Bookings
   - USSD Sessions
   - Transactions

3. **Sentinel & Safety**
   - Safety Reports
   - Incidents

4. **Financial & Analytics**
   - Revenue Tracking
   - Operating Costs
   - Performance Metrics

**Quick Tip:** Use the detailed schema in `AIRTABLE_INTEGRATION.md` to set up each table.

## Step 2: Get API Credentials (2 minutes)

### 2.1 Generate API Key
1. Go to [airtable.com/account](https://airtable.com/account)
2. Scroll to "API" section
3. Click "Generate API key"
4. Copy your API key

### 2.2 Get Base IDs
For each base:
1. Open the base
2. Go to Help → API documentation
3. Copy the Base ID from the URL or introduction section
   - Format: `appXXXXXXXXXXXXXX`

## Step 3: Configure Environment (3 minutes)

### 3.1 Update .env File

```bash
# Copy example file
cp .env.example .env

# Edit .env and add your credentials
nano .env
```

Add these values:
```bash
# Airtable
AIRTABLE_API_KEY=keyXXXXXXXXXXXXXX
AIRTABLE_INFRASTRUCTURE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_OPERATIONS_BASE_ID=appYYYYYYYYYYYYYY
AIRTABLE_SENTINEL_BASE_ID=appZZZZZZZZZZZZZZ
AIRTABLE_FINANCIAL_BASE_ID=appWWWWWWWWWWWWWW

# Backend API (already configured)
RAILWAYS_API_URL=https://africa-railways.vercel.app
```

## Step 4: Install Dependencies (2 minutes)

```bash
cd scripts/airtable-sync
npm install
```

This installs:
- `airtable` - Airtable JavaScript client
- `node-fetch` - HTTP client for API requests
- `dotenv` - Environment variable management

## Step 5: Test Sync (3 minutes)

### 5.1 Test Individual Sync

```bash
# Test schedules sync
npm run sync:schedules

# Test bookings sync
npm run sync:bookings
```

Expected output:
```
🚀 Starting schedule sync...
📍 Backend API: https://africa-railways.vercel.app
📍 Airtable Base: appXXXXXXXXXXXXXX

📡 Fetching schedules from backend API...
✅ Fetched 25 schedules
📤 Syncing schedules to Airtable...
✅ Synced batch 1: 10/25 records
✅ Synced batch 2: 20/25 records
✅ Synced batch 3: 25/25 records
✅ Sync complete: 25/25 records synced

✅ Schedule sync completed successfully
```

### 5.2 Test All Syncs

```bash
npm run sync:all
```

## Step 6: Set Up Automation (Optional)

### Option A: Cron (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add these lines
*/15 * * * * cd /path/to/africa-railways/scripts/airtable-sync && npm run sync:bookings
*/30 * * * * cd /path/to/africa-railways/scripts/airtable-sync && npm run sync:ussd
```

### Option B: PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start sync jobs
cd scripts/airtable-sync
pm2 start ecosystem.config.js

# Save and enable startup
pm2 save
pm2 startup
```

### Option C: GitHub Actions

Already configured in `.github/workflows/airtable-sync.yml`

Just add secrets to your GitHub repository:
1. Go to Settings → Secrets and variables → Actions
2. Add these secrets:
   - `AIRTABLE_API_KEY`
   - `AIRTABLE_OPERATIONS_BASE_ID`
   - `RAILWAYS_API_URL`

## Verification Checklist

- [ ] Airtable bases created with correct tables
- [ ] API key generated and added to `.env`
- [ ] Base IDs copied and added to `.env`
- [ ] Dependencies installed (`npm install`)
- [ ] Test sync completed successfully
- [ ] Data visible in Airtable bases
- [ ] Automation scheduled (optional)

## Common Issues

### "AIRTABLE_API_KEY environment variable is required"

**Solution:** Make sure `.env` file exists and contains your API key.

```bash
# Check if .env exists
ls -la .env

# Verify it contains the key
grep AIRTABLE_API_KEY .env
```

### "API request failed: 401 Unauthorized"

**Solution:** Your API key is invalid or expired. Generate a new one.

### "API request failed: 404 Not Found"

**Solution:** Base ID is incorrect. Double-check the Base ID from Airtable API docs.

### No data syncing

**Solution:** Check if backend API is returning data:

```bash
curl https://africa-railways.vercel.app/api/schedules
```

## Next Steps

### 1. Customize Field Mappings

Edit `scripts/airtable-sync/config.js` to match your specific field names.

### 2. Set Up Monitoring

```bash
# View health report
node scripts/airtable-sync/monitor.js report

# Check logs
tail -f logs/airtable-sync/sync-$(date +%Y-%m-%d).log
```

### 3. Connect ChatGPT

Use Airtable's API or share base with ChatGPT to enable AI-powered analytics:

**Example Prompts:**
- "Analyze booking trends for the last 30 days"
- "Which routes have the highest revenue per kilometer?"
- "Predict maintenance needs based on train usage patterns"

### 4. Build Dashboards

Create Airtable views and interfaces for:
- Real-time operations monitoring
- Financial performance tracking
- Safety incident management
- Capacity planning

## Support

- **Documentation:** `AIRTABLE_INTEGRATION.md`
- **Sync Scripts:** `scripts/airtable-sync/README.md`
- **Airtable API:** https://airtable.com/developers/web/api/introduction

## Success Metrics

After setup, you should see:
- ✅ Data syncing every 15-30 minutes
- ✅ 95%+ sync success rate
- ✅ Real-time operational visibility in Airtable
- ✅ AI-powered insights via ChatGPT

---

**Estimated Total Time:** 15 minutes  
**Difficulty:** Beginner  
**Prerequisites:** Node.js, Airtable account
