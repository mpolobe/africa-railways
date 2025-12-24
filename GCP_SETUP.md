# 🔐 GCP Setup for Africa Railways

Complete guide for setting up Google Cloud Platform authentication and infrastructure management.

## Prerequisites

- Google Cloud SDK installed
- GCP account with billing enabled
- Project created: `africa-railways-481823`

## Step 1: Authentication

### Login to GCP

```bash
# 1. Fully log in as your Gmail account
gcloud auth login ben.mpolokoso@gmail.com
```

This will:
- Open browser for authentication
- Request permissions for gcloud CLI
- Store credentials locally

### Set Active Project

```bash
# 2. Explicitly set your active project
gcloud config set project africa-railways-481823
```

Expected output:
```
Updated property [core/project].
```

### Verify Authentication

```bash
# 3. Verify you are who you think you are
# The output should show your email with an asterisk (*)
gcloud auth list
```

Expected output:
```
           Credentialed Accounts
ACTIVE  ACCOUNT
*       ben.mpolokoso@gmail.com

To set the active account, run:
    $ gcloud config set account `ACCOUNT`
```

## Step 2: Application Default Credentials

For programmatic access (Go applications, dashboard):

```bash
# Set up application default credentials
gcloud auth application-default login
```

This creates credentials at:
- Linux/Mac: `~/.config/gcloud/application_default_credentials.json`
- Windows: `%APPDATA%\gcloud\application_default_credentials.json`

## Step 3: Service Account Setup

### Create Service Account

```bash
# Create service account for Africa Railways
gcloud iam service-accounts create africa-railways-sa \
    --display-name="Africa Railways Service Account" \
    --description="Service account for OCC dashboard and automation"
```

### Grant Permissions

```bash
# Grant Compute Engine permissions
gcloud projects add-iam-policy-binding africa-railways-481823 \
    --member="serviceAccount:africa-railways-sa@africa-railways-481823.iam.gserviceaccount.com" \
    --role="roles/compute.instanceAdmin.v1"

# Grant Storage permissions (for backups)
gcloud projects add-iam-policy-binding africa-railways-481823 \
    --member="serviceAccount:africa-railways-sa@africa-railways-481823.iam.gserviceaccount.com" \
    --role="roles/storage.admin"
```

### Create Service Account Key

```bash
# Create and download key
gcloud iam service-accounts keys create ~/africa-railways-key.json \
    --iam-account=africa-railways-sa@africa-railways-481823.iam.gserviceaccount.com
```

**⚠️ IMPORTANT**: Store this key securely! Never commit to git.

### Set Environment Variable

```bash
# Add to ~/.bashrc or ~/.zshrc
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/africa-railways-key.json"
export GCP_PROJECT_ID="africa-railways-481823"
export GCP_ZONE="us-central1-a"

# Reload shell
source ~/.bashrc
```

## Step 4: Verify Setup

### Check Configuration

```bash
# View current configuration
gcloud config list

# Should show:
# [core]
# account = ben.mpolokoso@gmail.com
# project = africa-railways-481823
```

### Test Compute Engine Access

```bash
# List compute instances
gcloud compute instances list

# List zones
gcloud compute zones list

# Check quotas
gcloud compute project-info describe --project=africa-railways-481823
```

## Step 5: Infrastructure Setup

### Create Sui Full Node Instance

```bash
# Create VM for Sui node
gcloud compute instances create sui-fullnode \
    --project=africa-railways-481823 \
    --zone=us-central1-a \
    --machine-type=e2-standard-4 \
    --boot-disk-size=200GB \
    --boot-disk-type=pd-ssd \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --tags=sui-node,http-server,https-server \
    --metadata=startup-script='#!/bin/bash
        apt-get update
        apt-get install -y docker.io
        systemctl start docker
        systemctl enable docker
        # Install Sui node (add Sui installation commands)
    '
```

### Create Firewall Rules

```bash
# Allow Sui RPC (port 9000)
gcloud compute firewall-rules create allow-sui-rpc \
    --project=africa-railways-481823 \
    --allow=tcp:9000 \
    --target-tags=sui-node \
    --description="Allow Sui RPC access"

# Allow USSD webhook (port 8081)
gcloud compute firewall-rules create allow-ussd-webhook \
    --project=africa-railways-481823 \
    --allow=tcp:8081 \
    --target-tags=ussd-gateway \
    --description="Allow USSD webhook access"

# Allow OCC dashboard (port 8080)
gcloud compute firewall-rules create allow-occ-dashboard \
    --project=africa-railways-481823 \
    --allow=tcp:8080 \
    --target-tags=occ-dashboard \
    --description="Allow OCC dashboard access"
```

## Step 6: OCC Dashboard Integration

### Update Dashboard Configuration

Add to `dashboard/.env`:

```bash
# GCP Configuration
GCP_PROJECT_ID=africa-railways-481823
GCP_ZONE=us-central1-a
GOOGLE_APPLICATION_CREDENTIALS=/path/to/africa-railways-key.json

# Instance names for control
GCP_SUI_NODE_INSTANCE=sui-fullnode
GCP_USSD_GATEWAY_INSTANCE=ussd-gateway
```

### Test Dashboard Controls

```bash
# Start dashboard
cd dashboard
./occ-dashboard

# Test GCP control (in another terminal)
curl -X POST http://localhost:8080/api/control/gcp \
  -d "instance=sui-fullnode&action=start"
```

## Step 7: Monitoring Setup

### Enable Cloud Monitoring

```bash
# Enable Monitoring API
gcloud services enable monitoring.googleapis.com

# Create notification channel (email)
gcloud alpha monitoring channels create \
    --display-name="Africa Railways Alerts" \
    --type=email \
    --channel-labels=email_address=ben.mpolokoso@gmail.com
```

### Create Uptime Checks

```bash
# Check Sui node
gcloud monitoring uptime create sui-node-check \
    --resource-type=uptime-url \
    --host=SUI_NODE_IP \
    --port=9000 \
    --path=/health

# Check USSD gateway
gcloud monitoring uptime create ussd-gateway-check \
    --resource-type=uptime-url \
    --host=USSD_GATEWAY_IP \
    --port=8081 \
    --path=/health
```

## Step 8: Cost Management

### Set Budget Alerts

```bash
# Create budget (e.g., $100/month)
gcloud billing budgets create \
    --billing-account=YOUR_BILLING_ACCOUNT_ID \
    --display-name="Africa Railways Monthly Budget" \
    --budget-amount=100USD \
    --threshold-rule=percent=50 \
    --threshold-rule=percent=90 \
    --threshold-rule=percent=100
```

### View Current Costs

```bash
# View billing info
gcloud billing accounts list

# View project costs (requires billing export setup)
gcloud billing projects describe africa-railways-481823
```

## Infrastructure Management Commands

### Start/Stop Instances

```bash
# Start Sui node
gcloud compute instances start sui-fullnode \
    --project=africa-railways-481823 \
    --zone=us-central1-a

# Stop Sui node
gcloud compute instances stop sui-fullnode \
    --project=africa-railways-481823 \
    --zone=us-central1-a

# Check status
gcloud compute instances describe sui-fullnode \
    --project=africa-railways-481823 \
    --zone=us-central1-a \
    --format="get(status)"
```

### SSH Access

```bash
# SSH into Sui node
gcloud compute ssh sui-fullnode \
    --project=africa-railways-481823 \
    --zone=us-central1-a

# Run command remotely
gcloud compute ssh sui-fullnode \
    --project=africa-railways-481823 \
    --zone=us-central1-a \
    --command="docker ps"
```

### View Logs

```bash
# View instance logs
gcloud compute instances get-serial-port-output sui-fullnode \
    --project=africa-railways-481823 \
    --zone=us-central1-a

# View Cloud Logging
gcloud logging read "resource.type=gce_instance AND resource.labels.instance_id=INSTANCE_ID" \
    --limit=50 \
    --format=json
```

## Backup and Disaster Recovery

### Create Snapshots

```bash
# Create disk snapshot
gcloud compute disks snapshot sui-fullnode \
    --project=africa-railways-481823 \
    --zone=us-central1-a \
    --snapshot-names=sui-fullnode-snapshot-$(date +%Y%m%d)

# List snapshots
gcloud compute snapshots list
```

### Automated Backups

```bash
# Create snapshot schedule
gcloud compute resource-policies create snapshot-schedule daily-backup \
    --project=africa-railways-481823 \
    --region=us-central1 \
    --max-retention-days=7 \
    --on-source-disk-delete=keep-auto-snapshots \
    --daily-schedule \
    --start-time=02:00

# Attach schedule to disk
gcloud compute disks add-resource-policies sui-fullnode \
    --project=africa-railways-481823 \
    --zone=us-central1-a \
    --resource-policies=daily-backup
```

## Security Best Practices

### 1. Least Privilege Access

```bash
# Create custom role with minimal permissions
gcloud iam roles create africaRailwaysOperator \
    --project=africa-railways-481823 \
    --title="Africa Railways Operator" \
    --description="Minimal permissions for railway operations" \
    --permissions=compute.instances.start,compute.instances.stop,compute.instances.get
```

### 2. Enable Audit Logging

```bash
# Enable audit logs
gcloud logging sinks create africa-railways-audit \
    --log-filter='protoPayload.methodName="v1.compute.instances.start" OR protoPayload.methodName="v1.compute.instances.stop"' \
    --destination=storage.googleapis.com/africa-railways-audit-logs
```

### 3. Rotate Service Account Keys

```bash
# List keys
gcloud iam service-accounts keys list \
    --iam-account=africa-railways-sa@africa-railways-481823.iam.gserviceaccount.com

# Delete old key
gcloud iam service-accounts keys delete KEY_ID \
    --iam-account=africa-railways-sa@africa-railways-481823.iam.gserviceaccount.com

# Create new key
gcloud iam service-accounts keys create ~/africa-railways-key-new.json \
    --iam-account=africa-railways-sa@africa-railways-481823.iam.gserviceaccount.com
```

## Troubleshooting

### Authentication Issues

**Problem**: "Could not find default credentials"

```bash
# Solution 1: Re-authenticate
gcloud auth application-default login

# Solution 2: Set credentials explicitly
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"

# Solution 3: Check active account
gcloud auth list
```

**Problem**: "Permission denied"

```bash
# Check IAM permissions
gcloud projects get-iam-policy africa-railways-481823 \
    --flatten="bindings[].members" \
    --filter="bindings.members:ben.mpolokoso@gmail.com"

# Grant missing permissions
gcloud projects add-iam-policy-binding africa-railways-481823 \
    --member="user:ben.mpolokoso@gmail.com" \
    --role="roles/compute.instanceAdmin.v1"
```

### Instance Issues

**Problem**: Instance won't start

```bash
# Check instance status
gcloud compute instances describe sui-fullnode \
    --project=africa-railways-481823 \
    --zone=us-central1-a

# Check quotas
gcloud compute project-info describe \
    --project=africa-railways-481823 \
    --format="get(quotas)"

# View serial console output
gcloud compute instances get-serial-port-output sui-fullnode \
    --project=africa-railways-481823 \
    --zone=us-central1-a
```

### Network Issues

**Problem**: Can't connect to instance

```bash
# Check firewall rules
gcloud compute firewall-rules list

# Test connectivity
gcloud compute ssh sui-fullnode \
    --project=africa-railways-481823 \
    --zone=us-central1-a \
    --command="curl -I http://localhost:9000"
```

## Quick Reference

### Essential Commands

```bash
# Authentication
gcloud auth login
gcloud auth application-default login
gcloud auth list

# Configuration
gcloud config set project africa-railways-481823
gcloud config set compute/zone us-central1-a
gcloud config list

# Instances
gcloud compute instances list
gcloud compute instances start INSTANCE_NAME
gcloud compute instances stop INSTANCE_NAME
gcloud compute instances describe INSTANCE_NAME

# SSH
gcloud compute ssh INSTANCE_NAME

# Logs
gcloud logging read "resource.type=gce_instance" --limit=50
```

### Environment Variables

```bash
# Add to ~/.bashrc or ~/.zshrc
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/africa-railways-key.json"
export GCP_PROJECT_ID="africa-railways-481823"
export GCP_ZONE="us-central1-a"
```

## Next Steps

1. ✅ Complete authentication setup
2. ✅ Create service account and key
3. ✅ Set up infrastructure (Sui node, USSD gateway)
4. ✅ Configure firewall rules
5. ✅ Enable monitoring and alerts
6. ✅ Set up automated backups
7. ✅ Test OCC dashboard controls
8. ✅ Document operational procedures

## Support

- **GCP Console**: https://console.cloud.google.com/
- **Project**: africa-railways-481823
- **Documentation**: https://cloud.google.com/sdk/docs
- **Support**: ben.mpolokoso@gmail.com

---

**Project**: Africa Railways
**GCP Project ID**: africa-railways-481823
**Owner**: ben.mpolokoso@gmail.com
**Last Updated**: 2024-12-24
