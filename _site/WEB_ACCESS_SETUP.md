# OCC Dashboard Web Access Setup

## Overview
This guide helps you create a GCP service account for the OCC dashboard to read monitoring data.

## Prerequisites
- GCP project: `africa-railways-481823`
- gcloud CLI installed and authenticated
- Project owner or IAM admin permissions

## Option 1: Using the Script (Recommended)

If you have gcloud CLI properly installed:

```bash
./setup_web_access.sh
```

## Option 2: Manual Setup via GCP Console

1. **Go to GCP Console**
   - Navigate to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=africa-railways-481823

2. **Create Service Account**
   - Click "CREATE SERVICE ACCOUNT"
   - Name: `occ-web-viewer`
   - Description: `OCC Web Dashboard Viewer`
   - Click "CREATE AND CONTINUE"

3. **Grant Permissions**
   - Role: `Monitoring Viewer` (roles/monitoring.viewer)
   - Click "CONTINUE" then "DONE"

4. **Create Key**
   - Click on the newly created service account
   - Go to "KEYS" tab
   - Click "ADD KEY" → "Create new key"
   - Choose "JSON" format
   - Click "CREATE"
   - Save the downloaded file as `web-viewer-key.json` in the project root

## Option 3: Using gcloud CLI Commands

```bash
PROJECT_ID="africa-railways-481823"
SA_NAME="occ-web-viewer"

# Create service account
gcloud iam service-accounts create $SA_NAME \
    --display-name="OCC Web Dashboard Viewer" \
    --project=$PROJECT_ID

# Grant monitoring viewer role
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/monitoring.viewer"

# Create and download key
gcloud iam service-accounts keys create ./web-viewer-key.json \
    --iam-account=$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com
```

## Verify the Service Account Key

The downloaded JSON file should contain these fields:

```json
{
  "type": "service_account",
  "project_id": "africa-railways-481823",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "occ-web-viewer@africa-railways-481823.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

⚠️ **Important:** The key must include the `private_key` field. If you only have certificates, you need to regenerate the key.

## Using the Key in the Dashboard

### For Railway Deployment

Add the key as an environment variable:

```bash
# Convert JSON to base64
cat web-viewer-key.json | base64 -w 0

# In Railway dashboard, add environment variable:
# GCP_SERVICE_ACCOUNT_KEY=<base64-encoded-json>
```

Or add the JSON directly as a multiline environment variable in Railway.

### For Local Development

```bash
export GOOGLE_APPLICATION_CREDENTIALS="./web-viewer-key.json"
./dashboard/occ-dashboard
```

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `web-viewer-key.json` to git
- The file is already in `.gitignore`
- Rotate keys regularly (every 90 days recommended)
- Use least privilege principle - only grant necessary permissions

## Troubleshooting

### gcloud not found
Install gcloud CLI: https://cloud.google.com/sdk/docs/install

### Permission denied
Ensure you have IAM admin or project owner role

### Key file not working
- Verify JSON format is valid
- Check service account has correct permissions
- Ensure project ID matches

## Next Steps

After creating the key:
1. Add it to Railway environment variables
2. Update dashboard configuration if needed
3. Test the monitoring data access
4. Document the key location securely
