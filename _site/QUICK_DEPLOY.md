# Quick Deploy Guide - OCC Dashboard with GCP Monitoring

## 🚀 Deploy in 3 Steps

### Step 1: Get Your Service Account Key
```bash
# If you have the key file:
cat web-viewer-key.json

# Or create it via GCP Console:
# https://console.cloud.google.com/iam-admin/serviceaccounts?project=africa-railways-481823
```

### Step 2: Add to Railway
1. Go to [Railway Dashboard](https://railway.app)
2. Select your **OCC Dashboard** service
3. Click **Variables** → **+ New Variable**
4. Add:
   ```
   Name: GCP_SERVICE_ACCOUNT_KEY
   Value: <paste entire JSON from web-viewer-key.json>
   ```
5. Click **Add**

### Step 3: Verify
Wait 2-3 minutes for deployment, then visit:
- [https://africarailways.com/occ](https://africarailways.com/occ)

Look for the **☁️ GCP Infrastructure** card showing:
- ✅ SUI NETWORK: X.X% CPU
- ✅ RAILWAY OPERATIONS: X.X% CPU

## ✅ What's Implemented

| Feature | Status | Details |
|---------|--------|---------|
| **Data Fetching** | ✅ Complete | Queries `projects/africa-railways-481823` |
| **Metric Type** | ✅ Complete | `compute.googleapis.com/instance/cpu/utilization` |
| **Refresh Rate** | ✅ 60 seconds | Background updates, no page blink |
| **Project Separation** | ✅ Complete | Separates by `project_id` label |
| **Friendly Names** | ✅ Complete | "SUI NETWORK" & "RAILWAY OPERATIONS" |
| **Security** | ✅ Complete | Key in env vars, never exposed to frontend |
| **Display** | ✅ Complete | Real-time CPU %, zone, status indicators |

## 🔍 Verification Script

Test locally before deploying:
```bash
./preview_occ_data.sh
```

Expected output:
```
PROJECT                      INSTANCE              CPU_LOAD
valued-context-481911-i4     1234567890123456789   0.15
africa-railways-481823       9876543210987654321   0.08
```

## 📊 Display Logic

### Backend (Go)
```go
// Fetches every 60 seconds
metrics := collectGCPMetrics(config)

// Separates by project_id
if projectID == "valued-context-481911-i4" {
    metrics.SuiValidator = InstanceMetrics{
        Name: "Sui Validator 1",
        CPUUtilization: cpuValue,
    }
} else if projectID == "africa-railways-481823" {
    metrics.RailwayCore = InstanceMetrics{
        Name: "Railway Core",
        CPUUtilization: cpuValue,
    }
}
```

### Frontend (JavaScript)
```javascript
// Updates via WebSocket (no page refresh)
function updateGCPMetrics(gcp) {
    document.getElementById('sui-validator-cpu').textContent = 
        `${gcp.sui_validator.cpu_utilization.toFixed(1)}% CPU`;
    document.getElementById('railway-core-cpu').textContent = 
        `${gcp.railway_core.cpu_utilization.toFixed(1)}% CPU`;
}
```

## 🔐 Security Checklist

- ✅ `web-viewer-key.json` in `.gitignore`
- ✅ Key stored in Railway environment variables (encrypted)
- ✅ Key never sent to browser/frontend
- ✅ Service account has minimal permissions (`monitoring.viewer` only)
- ✅ Temporary credentials file cleaned up after use

## 🐛 Troubleshooting

### No metrics showing?
```bash
# Check Railway logs for:
✅ "OCC Dashboard running on http://localhost:8080"

# Should NOT see:
❌ "No GCP credentials found, skipping GCP metrics"
```

### Still not working?
1. Verify JSON is complete (has `private_key` field)
2. Check no extra quotes in Railway variable
3. Redeploy after adding variable
4. Wait 2-3 minutes for deployment

## 📚 Full Documentation

- **Detailed Setup:** `RAILWAY_GCP_SETUP.md`
- **Architecture:** `LINKED_PROJECT_ARCHITECTURE.md`
- **Service Account:** `WEB_ACCESS_SETUP.md`

## 🎯 Success Criteria

Your dashboard is working correctly when you see:

1. ✅ GCP Infrastructure card displays
2. ✅ CPU percentages update every 60 seconds
3. ✅ Green status indicators
4. ✅ Zone information shows (e.g., "us-central1-a")
5. ✅ Last updated timestamp changes
6. ✅ No console errors in browser

## 🚨 Important Notes

- **Refresh Rate:** 60 seconds (as specified)
- **No Page Blink:** Updates via WebSocket
- **Linked Projects:** Single query returns both Sui and Railway metrics
- **API Quota:** ~1,440 requests/day (well within free tier)

## 🎉 You're Done!

The OCC dashboard now displays real-time infrastructure metrics from your linked GCP projects. The incubator team will see professional, live monitoring data at `africarailways.com/occ`.
