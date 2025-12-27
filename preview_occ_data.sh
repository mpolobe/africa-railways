#!/bin/bash
# Filename: preview_occ_data.sh

# This simulates the data Ona's backend will see
echo "Simulating OCC Data Fetch..."
echo "---------------------------"

gcloud monitoring time-series list \
    --filter='metric.type="compute.googleapis.com/instance/cpu/utilization"' \
    --project="africa-railways-481823" \
    --limit=5 \
    --format="table(resource.labels.project_id:label=PROJECT, resource.labels.instance_id:label=INSTANCE, points[0].value.doubleValue:label=CPU_LOAD)"
