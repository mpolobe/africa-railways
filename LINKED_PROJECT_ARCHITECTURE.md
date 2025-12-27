# Linked Project Architecture

## Overview

The Africa Railways infrastructure uses a **linked project setup** in GCP that allows unified monitoring across multiple services.

## Project Structure

### Scoping Project (Primary)
- **Project ID:** `africa-railways-481823`
- **Purpose:** Main scoping project that aggregates metrics
- **Role:** Central monitoring and management hub

### Linked Project (Sui Node)
- **Project ID:** `valued-context-481911-i4`
- **Purpose:** Sui blockchain validator node
- **Role:** Provides blockchain metrics

### Railway Deployment
- **Platform:** Railway.app
- **Services:** OCC Dashboard, Backend APIs
- **Metrics:** Server performance, API latency, resource usage

## How Linked Projects Work

When you query the GCP Monitoring API using the **scoping project ID** (`africa-railways-481823`), you receive metrics from:

1. ✅ Railway servers (if they report to GCP)
2. ✅ Sui node (`valued-context-481911-i4`)
3. ✅ Any other linked infrastructure

All metrics come in a **single stream** but are labeled with their source `project_id`.

## Metric Separation Strategy

### By Project ID Label

```javascript
// Example metric structure
{
  "metric": {
    "type": "compute.googleapis.com/instance/cpu/utilization",
    "labels": {
      "project_id": "valued-context-481911-i4",  // Identifies source
      "instance_id": "...",
      "zone": "..."
    }
  },
  "points": [...]
}
```

### Dashboard Display Logic

The OCC dashboard separates metrics by checking the `project_id` label:

- **`valued-context-481911-i4`** → Display in "Sui Node" section
- **`africa-railways-481823`** → Display in "Railway Infrastructure" section
- **Other project IDs** → Display in "Additional Services" section

## Monitoring API Query

### Single Query for All Metrics

```go
// Query the scoping project
projectName := "projects/africa-railways-481823"

// This returns metrics from ALL linked projects
request := &monitoringpb.ListTimeSeriesRequest{
    Name:   projectName,
    Filter: "metric.type=\"compute.googleapis.com/instance/cpu/utilization\"",
    Interval: &monitoringpb.TimeInterval{
        EndTime:   timestamppb.Now(),
        StartTime: timestamppb.New(time.Now().Add(-5 * time.Minute)),
    },
}

// Response includes metrics from both projects
// Differentiate by checking: timeSeries.Resource.Labels["project_id"]
```

## Benefits of This Architecture

1. **Single API Call** - No need to query multiple projects separately
2. **Unified Dashboard** - All metrics in one place
3. **Consistent Authentication** - One service account for all access
4. **Simplified Monitoring** - Centralized alerting and visualization

## Service Account Permissions

The `occ-web-viewer` service account needs:
- **Role:** `roles/monitoring.viewer` on `africa-railways-481823`
- **Access:** Automatically includes linked project metrics

## Implementation in OCC Dashboard

### Backend (Go)
```go
// Fetch metrics from scoping project
metrics := fetchGCPMetrics("africa-railways-481823")

// Separate by project_id
suiMetrics := filterByProject(metrics, "valued-context-481911-i4")
railwayMetrics := filterByProject(metrics, "africa-railways-481823")
```

### Frontend (JavaScript)
```javascript
// Display separated metrics
updateSuiSection(suiMetrics);
updateRailwaySection(railwayMetrics);
```

## Metric Types to Monitor

### Sui Node (`valued-context-481911-i4`)
- CPU utilization
- Memory usage
- Disk I/O
- Network throughput
- Sui-specific metrics (if custom metrics are configured)

### Railway Infrastructure (`africa-railways-481823`)
- API response times
- Request rates
- Error rates
- Database connections
- Cache hit rates

## Troubleshooting

### No Metrics Appearing
1. Verify service account has `monitoring.viewer` role
2. Check that projects are properly linked in GCP Console
3. Confirm metrics are being generated (check GCP Metrics Explorer)

### Wrong Project Metrics
1. Verify `project_id` label filtering logic
2. Check that linked project is active
3. Ensure time range includes recent data

### Authentication Errors
1. Verify service account key is valid
2. Check key is properly loaded in environment
3. Confirm project IDs are correct

## References

- [GCP Monitoring API Documentation](https://cloud.google.com/monitoring/api/v3)
- [Scoping Projects Guide](https://cloud.google.com/monitoring/settings/multiple-projects)
- [Service Account Authentication](https://cloud.google.com/docs/authentication/production)
