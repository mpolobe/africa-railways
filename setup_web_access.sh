#!/bin/bash
# Filename: setup_web_access.sh

PROJECT_ID="africa-railways-481823"
SA_NAME="occ-web-viewer"
GCLOUD="./google-cloud-sdk/bin/gcloud"

echo "1. Creating Service Account for the website..."
$GCLOUD iam service-accounts create $SA_NAME \
    --display-name="OCC Web Dashboard Viewer" \
    --project=$PROJECT_ID

echo "2. Granting permission to read Monitoring data..."
$GCLOUD projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/monitoring.viewer"

echo "3. Generating the JSON key file..."
$GCLOUD iam service-accounts keys create ./web-viewer-key.json \
    --iam-account=$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com

echo "SUCCESS: 'web-viewer-key.json' created in your root folder. Use this for the website."
