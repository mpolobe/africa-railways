# Railway Deployment with GCP Monitoring

## Overview

The OCC dashboard at `africarailways.com/occ` fetches real-time metrics from GCP using the Monitoring API. This guide explains how to configure the Railway deployment with GCP credentials.

## Prerequisites

1. ✅ Service account created: `occ-web-viewer@africa-railways-481823.iam.gserviceaccount.com`
2. ✅ Service account has `roles/monitoring.viewer` permission
3. ✅ Service account key downloaded as `web-viewer-key.json`

## Implementation Details

### Data Fetching Logic

The dashboard queries:
- **Endpoint:** `projects/africa-railways-481823`
- **Metric:** `compute.googleapis.com/instance/cpu/utilization`
- **Refresh Rate:** 60 seconds
- **Method:** GCP Monitoring API via Go backend

### Project Separation

Metrics are automatically separated by `project_id` label:

| Project ID | Display Name | Description |
|------------|--------------|-------------|
| `valued-context-481911-i4` | **SUI NETWORK** | Sui blockchain validator node |
| `africa-railways-481823` | **RAILWAY OPERATIONS** | Railway infrastructure servers |

### Display Components

The dashboard shows:
- **CPU Utilization** - Real-time percentage for each instance
- **Zone** - GCP zone where instance is running
- **Status** - Operational/Warning/Error indicator
- **Last Updated** - Timestamp of last metric fetch

## Railway Environment Variable Setup

### Step 1: Prepare the Service Account Key

You have two options:

#### Option A: Direct JSON (Recommended)
```bash
# Copy the entire contents of web-viewer-key.json
cat web-viewer-key.json
```

#### Option B: Base64 Encoded
```bash
# Encode the key file
cat web-viewer-key.json | base64 -w 0
```

### Step 2: Add to Railway Dashboard

1. Go to your Railway project: [https://railway.app](https://railway.app)
2. Select the **OCC Dashboard** service
3. Click on **Variables** tab
4. Click **+ New Variable**

#### For Option A (Direct JSON):
```
Variable Name: GCP_SERVICE_ACCOUNT_KEY
Variable Value: {
  "type": "service_account",
  "project_id": "africa-railways-481823",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "occ-web-viewer@africa-railways-481823.iam.gserviceaccount.com",
  ...
}
```

#### For Option B (Base64):
```
Variable Name: GCP_SERVICE_ACCOUNT_KEY
Variable Value: <paste-base64-string-here>
```

5. Click **Add** to save
6. Railway will automatically redeploy

### Step 3: Verify Deployment

After deployment completes (2-3 minutes):

1. Visit: [https://africarailways.com/occ](https://africarailways.com/occ)
2. Check the **☁️ GCP Infrastructure** card
3. You should see:
   - **SUI NETWORK** with CPU percentage
   - **RAILWAY OPERATIONS** with CPU percentage
   - Zone information for each
   - Green status indicators if operational

## Backend Implementation

### Go Code Flow

```go
// 1. Load credentials from environment
credJSON := os.Getenv("GCP_SERVICE_ACCOUNT_KEY")

// 2. Create monitoring client
client, err := monitoring.NewMetricClient(ctx, option.WithCredentialsFile(credPath))

// 3. Query metrics from scoping project
req := &monitoringpb.ListTimeSeriesRequest{
    Name:   "projects/africa-railways-481823",
    Filter: `metric.type="compute.googleapis.com/instance/cpu/utilization"`,
    Interval: &monitoringpb.TimeInterval{
        EndTime:   timestamppb.New(endTime),
        StartTime: timestamppb.New(startTime),
    },
}

// 4. Iterate through results
for {
    resp, err := it.Next()
    projectID := resp.Resource.Labels["project_id"]
    cpuValue := resp.Points[0].Value.GetDoubleValue() * 100
    
    // 5. Map to friendly names
    if projectID == "valued-context-481911-i4" {
        metrics.SuiValidator = InstanceMetrics{
            Name: "SUI NETWORK",
            CPUUtilization: cpuValue,
            ...
        }
    }
}
```

### Frontend Update Flow

```javascript
// WebSocket receives metrics every 5 seconds
ws.onmessage = function(event) {
    const metrics = JSON.parse(event.data);
    updateGCPMetrics(metrics.gcp_metrics);
}

// Update display without page refresh
function updateGCPMetrics(gcp) {
    document.getElementById('sui-validator-cpu').textContent = 
        `${gcp.sui_validator.cpu_utilization.toFixed(1)}% CPU`;
    document.getElementById('railway-core-cpu').textContent = 
        `${gcp.railway_core.cpu_utilization.toFixed(1)}% CPU`;
}
```

## Security Considerations

✅ **Implemented:**
- Service account key stored in Railway environment variables (encrypted)
- Key never exposed to frontend/browser
- Temporary credentials file cleaned up after use
- Least privilege: Only `monitoring.viewer` role granted

❌ **Never do:**
- Commit `web-viewer-key.json` to git (already in .gitignore)
- Expose key in frontend JavaScript
- Share key in public channels
- Use keys with broader permissions than needed

## Troubleshooting

### No metrics appearing

**Check 1: Verify credentials are set**
```bash
# In Railway logs, you should see:
✅ OCC Dashboard running on http://localhost:8080
# NOT:
⚠️  No GCP credentials found, skipping GCP metrics
```

**Check 2: Verify service account permissions**
```bash
gcloud projects get-iam-policy africa-railways-481823 \
  --flatten="bindings[].members" \
  --filter="bindings.members:occ-web-viewer@africa-railways-481823.iam.gserviceaccount.com"
```

**Check 3: Test locally**
```bash
export GCP_SERVICE_ACCOUNT_KEY="$(cat web-viewer-key.json)"
cd dashboard
./occ-dashboard
```

### "Authentication failed" errors

- Verify the JSON is complete and valid
- Check that `private_key` field is present
- Ensure no extra quotes or escaping in Railway variable

### Metrics show "No data"

- Instances may not be running
- Metrics may take 1-2 minutes to appear after instance start
- Check GCP Metrics Explorer to verify data exists

## Monitoring Best Practices

### Refresh Rate
- **Current:** 60 seconds (as specified)
- **Rationale:** Balances real-time visibility with API quota usage
- **API Quota:** ~1,440 requests/day per metric

### Metric Retention
- GCP retains metrics for 6 weeks
- Dashboard shows last 5 minutes of data
- Aggregated to 60-second intervals

### Alerting
The dashboard will show alerts when:
- CPU utilization > 80% (warning)
- CPU utilization > 95% (critical)
- Instance status changes to down

## Next Steps

After successful deployment:

1. ✅ Monitor the dashboard for 24 hours
2. ✅ Verify metrics update every 60 seconds
3. ✅ Test with incubator team
4. ✅ Add additional metrics if needed (memory, disk, network)
5. ✅ Set up alerting thresholds

## Additional Metrics (Future)

To add more metrics, update the filter in `collectGCPMetrics()`:

```go
// Memory utilization
Filter: `metric.type="compute.googleapis.com/instance/memory/utilization"`

// Disk I/O
Filter: `metric.type="compute.googleapis.com/instance/disk/read_bytes_count"`

// Network throughput
Filter: `metric.type="compute.googleapis.com/instance/network/received_bytes_count"`
```

## Support

If you encounter issues:
1. Check Railway deployment logs
2. Verify environment variables are set correctly
3. Test the `preview_occ_data.sh` script locally
4. Review `LINKED_PROJECT_ARCHITECTURE.md` for architecture details
