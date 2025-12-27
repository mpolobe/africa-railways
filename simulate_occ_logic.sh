#!/bin/bash
# Filename: simulate_occ_logic.sh

# This shows you the raw 'Display Logic' data
echo "Fetching live data for OCC Display Logic..."
echo "------------------------------------------"

gcloud alpha monitoring time-series list \
    --project="africa-railways-481823" \
    --filter='metric.type="compute.googleapis.com/instance/cpu/utilization"' \
    --format="table(resource.labels.project_id:label=NETWORK, resource.labels.instance_id:label=NODE_ID, points[0].value.doubleValue:label=CPU_LOAD)"
