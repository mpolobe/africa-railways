# OCC Dashboard Verification Guide

## Pre-Deployment Verification

Before deploying to Railway or showing to incubators, verify that all data sources are working correctly.

## Verification Scripts

### 1. Display Logic Simulation (Recommended)

**Script:** `simulate_occ_logic.sh`

This shows the **exact data format** that the OCC dashboard will display.

```bash
./simulate_occ_logic.sh
```

**Expected Output:**
```
Fetching live data for OCC Display Logic...
------------------------------------------
NETWORK                      NODE_ID               CPU_LOAD
valued-context-481911-i4     1234567890123456789   0.15234
africa-railways-481823       9876543210987654321   0.08456
```

**What Each Column Means:**

| Column | Description | Dashboard Display |
|--------|-------------|-------------------|
| **NETWORK** | GCP project_id | Mapped to "SUI NETWORK" or "RAILWAY OPERATIONS" |
| **NODE_ID** | GCP instance_id | Used internally, not shown to users |
| **CPU_LOAD** | CPU utilization (0.0-1.0) | Multiplied by 100 to show as percentage |

**Interpretation:**

- `valued-context-481911-i4` with `0.15234` → **SUI NETWORK: 15.2% CPU**
- `africa-railways-481823` with `0.08456` → **RAILWAY OPERATIONS: 8.5% CPU**

### 2. Basic Data Preview

**Script:** `preview_occ_data.sh`

Simpler version for quick checks:

```bash
./preview_occ_data.sh
```

## Success Criteria

✅ **Ready for Incubator Presentation When:**

1. Both networks display data
2. CPU values update every 5 seconds
3. Progress bars animate smoothly
4. Status badges show correct state
5. Stability scores are > 95%
6. No console errors in browser
7. WebSocket connection is stable
8. Colors match thresholds correctly
