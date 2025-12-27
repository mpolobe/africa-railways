# OCC Dashboard Implementation Summary

## Why This Architecture Matters

### The Scoping Project Trick

By querying the **Railway project** (`africa-railways-481823`), the dashboard automatically receives data from **both** projects:

1. **Railway Operations** (`africa-railways-481823`) - Your main infrastructure
2. **SUI NETWORK** (`valued-context-481911-i4`) - Your Sui validator node

This is possible because of the **linked project setup** in GCP. One API call returns metrics from all linked projects, differentiated by the `project_id` label.

**Benefits:**
- ✅ Single API endpoint
- ✅ Single authentication
- ✅ Unified monitoring
- ✅ Simplified code
- ✅ Lower API quota usage

### Trust Building Through Professional Metrics

Instead of showing raw technical data, the dashboard presents:

#### 1. **Stability Score** (Not Just Uptime)
```
99.8% Stability
1,437 / 1,440 points
```

**Why this matters:**
- Shows **data completeness** over 24 hours
- Demonstrates **reliability** to investors/incubators
- Looks like an official Railway OCC portal
- More meaningful than "99.8% uptime" (which could mean anything)

**Calculation:**
```
Stability = (Actual Data Points / Expected Data Points) × 100
Expected = 1,440 points (24 hours × 60 minutes)
```

#### 2. **Status Indicators** (Not Just "Up/Down")
```
[ONLINE]  - Green badge with pulse animation
[OFFLINE] - Red badge, static
```

**Logic:**
- **ONLINE:** Data received within last 5 minutes
- **OFFLINE:** No data for 5+ minutes

This shows **real-time health**, not just "is it running?"

#### 3. **Visual CPU Load Bars** (Not Just Numbers)
```
[████████░░░░░░░░░░] 45.2% CPU
```

**Color Thresholds:**
- 🟢 **0-60%:** Blue/Green (Healthy) - Normal operation
- 🟡 **60-85%:** Yellow (Heavy Load) - Attention needed
- 🔴 **85-100%:** Red (Critical) - Immediate action required

**Why this matters:**
- Instant visual understanding
- No need to interpret numbers
- Clear escalation levels
- Professional appearance

## Data Flow Architecture

### Backend (Go)
```
Every 5 seconds:
├─ Collect Polygon metrics
├─ Collect Sui blockchain metrics
├─ Collect GCP infrastructure metrics (every 60s)
│  ├─ Query: projects/africa-railways-481823
│  ├─ Metric: compute.googleapis.com/instance/cpu/utilization
│  ├─ Time Range: Last 24 hours
│  ├─ Separate by project_id label:
│  │  ├─ valued-context-481911-i4 → SUI NETWORK
│  │  └─ africa-railways-481823 → RAILWAY OPERATIONS
│  ├─ Calculate stability: (actual points / 1440) × 100
│  └─ Determine status: online/offline based on data freshness
├─ Collect wallet metrics
├─ Collect IPFS metrics
├─ Collect USSD metrics
└─ Broadcast via WebSocket to all connected clients
```

### Frontend (JavaScript)
```
WebSocket connection:
├─ Receives metrics every 5 seconds
├─ Updates display without page reload
├─ Updates CPU progress bars with smooth transitions
├─ Updates status badges with animations
├─ Updates stability percentages with color coding
└─ Fallback: REST API polling if WebSocket fails
```

### Refresh Intervals
- **WebSocket Broadcast:** Every 5 seconds
- **GCP Metrics Collection:** Every 60 seconds
- **Page Reload:** Never (background updates only)
- **User Experience:** Smooth, no flicker

## Verification Before Deployment

### Script: `preview_occ_data.sh`

Run this from your root folder to see exactly what data the dashboard will display:

```bash
./preview_occ_data.sh
```

**Expected Output:**
```
Simulating OCC Data Fetch...
---------------------------
PROJECT                      INSTANCE              CPU_LOAD
valued-context-481911-i4     1234567890123456789   0.15
africa-railways-481823       9876543210987654321   0.08
```

**What this shows:**
- ✅ Both projects are returning data
- ✅ Instance IDs are visible
- ✅ CPU load values are being collected
- ✅ The scoping project link is working

### Manual Verification

If the script doesn't work, verify manually:

```bash
gcloud monitoring time-series list \
    --filter='metric.type="compute.googleapis.com/instance/cpu/utilization"' \
    --project="africa-railways-481823" \
    --limit=5 \
    --format="json" | jq '.[] | {project: .resource.labels.project_id, cpu: .points[0].value.doubleValue}'
```

**Expected:**
```json
{
  "project": "valued-context-481911-i4",
  "cpu": 0.15234
}
{
  "project": "africa-railways-481823",
  "cpu": 0.08456
}
```

## Implementation Checklist

### ✅ Completed Features

- [x] **Data Fetching**
  - Query scoping project: `africa-railways-481823`
  - Metric: `compute.googleapis.com/instance/cpu/utilization`
  - Time range: Last 24 hours
  - Refresh: Every 60 seconds

- [x] **Entity Mapping**
  - `valued-context-481911-i4` → **SUI NETWORK**
  - `africa-railways-481823` → **RAILWAY OPERATIONS**

- [x] **Status Logic**
  - ONLINE (Green): Data within 5 minutes
  - OFFLINE (Red): No data for 5+ minutes
  - Animated badges

- [x] **Stability Calculation**
  - Formula: (actual / 1440) × 100
  - Color coding: Green ≥99%, Yellow 95-99%, Red <95%
  - Data point display

- [x] **CPU Visualization**
  - Live progress bars
  - 0-60%: Blue/Green (Healthy)
  - 60-85%: Yellow (Heavy Load)
  - 85-100%: Red (Critical)
  - Smooth transitions

- [x] **Auto-Refresh**
  - WebSocket updates every 5 seconds
  - No page reload
  - Background fetch
  - Fallback to REST API

### 🔐 Security Implementation

- [x] Service account key in environment variables
- [x] Never exposed to frontend
- [x] Temporary credentials cleaned up
- [x] Least privilege permissions (monitoring.viewer only)
- [x] Key files in .gitignore

### 📚 Documentation

- [x] RAILWAY_GCP_SETUP.md - Complete deployment guide
- [x] QUICK_DEPLOY.md - 3-step quick start
- [x] LINKED_PROJECT_ARCHITECTURE.md - Technical details
- [x] OCC_IMPLEMENTATION_SUMMARY.md - This file
- [x] preview_occ_data.sh - Verification script

## Deployment Steps

### 1. Add GCP Credentials to Railway

```bash
# In Railway dashboard:
Variable Name: GCP_SERVICE_ACCOUNT_KEY
Variable Value: <paste complete JSON from web-viewer-key.json>
```

### 2. Wait for Deployment

Railway will automatically:
- Detect the code changes
- Build the Go application
- Deploy to production
- Start serving at africarailways.com/occ

**Time:** 2-3 minutes

### 3. Verify Deployment

Visit: [https://africarailways.com/occ](https://africarailways.com/occ)

**You should see:**
```
☁️ GCP Infrastructure

SUI NETWORK [ONLINE]          RAILWAY OPERATIONS [ONLINE]
15.3% CPU                     8.7% CPU
[████████░░░░░░░░░░]          [████░░░░░░░░░░░░░░]
us-central1-a                 us-east1-b

SUI Stability (24h)           Railway Stability (24h)
99.8%                         100.0%
1,437 / 1,440 points          1,440 / 1,440 points
```

## What Makes This Professional

### For Investors/Incubators

1. **Real-time Monitoring** - Live updates every 5 seconds
2. **Stability Metrics** - Shows reliability over time
3. **Visual Indicators** - Easy to understand at a glance
4. **Professional UI** - Looks like enterprise software
5. **Multi-Project View** - Shows infrastructure complexity

### Technical Excellence

1. **Linked Projects** - Efficient architecture
2. **WebSocket Updates** - Modern real-time tech
3. **Graceful Degradation** - Fallback to REST API
4. **Color-Coded Alerts** - Clear escalation paths
5. **Smooth Animations** - Professional polish

### Operational Value

1. **24-Hour Stability** - Long-term reliability tracking
2. **CPU Load Visualization** - Instant capacity assessment
3. **Status Monitoring** - Real-time health checks
4. **Zone Information** - Geographic distribution visibility
5. **Auto-Refresh** - Always current data

## Troubleshooting

### No metrics appearing?

**Check 1:** Verify credentials in Railway
```bash
# Railway logs should show:
✅ OCC Dashboard running on http://localhost:8080

# NOT:
⚠️  No GCP credentials found, skipping GCP metrics
```

**Check 2:** Test locally
```bash
export GCP_SERVICE_ACCOUNT_KEY="$(cat web-viewer-key.json)"
cd dashboard
./occ-dashboard
```

**Check 3:** Verify data exists
```bash
./preview_occ_data.sh
```

### Progress bars not showing?

- Check browser console for JavaScript errors
- Verify WebSocket connection is established
- Check that CPU values are > 0

### Stability showing 0%?

- Instances may have just started
- Wait 1-2 hours for data to accumulate
- Check GCP Metrics Explorer for data availability

## Next Steps

After successful deployment:

1. ✅ Monitor for 24 hours to verify stability calculation
2. ✅ Test with incubator team
3. ✅ Add alerting thresholds if needed
4. ✅ Consider adding more metrics (memory, disk, network)
5. ✅ Set up automated health checks

## Support Resources

- **Architecture:** `LINKED_PROJECT_ARCHITECTURE.md`
- **Deployment:** `RAILWAY_GCP_SETUP.md`
- **Quick Start:** `QUICK_DEPLOY.md`
- **Verification:** `./preview_occ_data.sh`
- **Service Account:** `WEB_ACCESS_SETUP.md`
