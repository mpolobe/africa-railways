#!/bin/bash
# Filename: init_gcp_wallet.sh
# Purpose: Initialize GCP service account for Play Store deployment

set -e

PROJECT_ID="gen-lang-client-0453426956"
SERVICE_ACCOUNT_EMAIL="africoin-wallet-deploy@${PROJECT_ID}.iam.gserviceaccount.com"
KEY_FILE="google-play-service-account.json"

echo "=================================================="
echo "GCP Wallet Service Account Initialization"
echo "=================================================="
echo ""
echo "Project ID: $PROJECT_ID"
echo "Service Account: $SERVICE_ACCOUNT_EMAIL"
echo "Key File: $KEY_FILE"
echo ""

# Check if gcloud is available
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI not found"
    echo ""
    echo "Please install gcloud CLI:"
    echo "  curl -sSL https://sdk.cloud.google.com | bash"
    echo ""
    exit 1
fi

# Check if authenticated
echo "Checking authentication status..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo "❌ Not authenticated with GCP"
    echo ""
    echo "Please authenticate first:"
    echo "  gcloud auth login"
    echo ""
    exit 1
fi

ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | head -1)
echo "✅ Authenticated as: $ACTIVE_ACCOUNT"
echo ""

# Set project
echo "Setting project to $PROJECT_ID..."
if ! gcloud config set project "$PROJECT_ID" 2>&1; then
    echo "❌ Failed to set project. You may not have access to this project."
    echo ""
    echo "Please verify:"
    echo "  1. Project exists: gcloud projects list"
    echo "  2. You have access to the project"
    echo "  3. Project ID is correct: $PROJECT_ID"
    echo ""
    exit 1
fi

# Verify service account exists
echo "Checking if service account exists..."
if ! gcloud iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" &> /dev/null; then
    echo "❌ Service account does not exist: $SERVICE_ACCOUNT_EMAIL"
    echo ""
    echo "Would you like to create it? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "Creating service account..."
        gcloud iam service-accounts create africoin-wallet-deploy \
            --display-name="Africoin Wallet Play Store Deploy" \
            --description="Service account for deploying Africoin Wallet to Google Play Store"
        
        echo "✅ Service account created"
        echo ""
        echo "⚠️  You may need to grant additional permissions for Play Store deployment."
        echo "   Typically requires: roles/androidpublisher.admin"
    else
        echo "Exiting without creating service account."
        exit 1
    fi
else
    echo "✅ Service account exists"
fi

# Check if key file already exists
if [ -f "$KEY_FILE" ]; then
    echo ""
    echo "⚠️  Key file already exists: $KEY_FILE"
    echo "   Do you want to create a new key? This will overwrite the existing file. (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Keeping existing key file."
        exit 0
    fi
    echo "Creating new key (old key will be overwritten)..."
fi

# Create service account key
echo "Creating service account key..."
if gcloud iam service-accounts keys create "$KEY_FILE" \
    --iam-account="$SERVICE_ACCOUNT_EMAIL"; then
    echo ""
    echo "✅ Key created successfully: $KEY_FILE"
    echo ""
    echo "=================================================="
    echo "IMPORTANT SECURITY NOTES"
    echo "=================================================="
    echo ""
    echo "1. ⚠️  This file contains sensitive credentials"
    echo "2. ⚠️  Never commit this file to git"
    echo "3. ✅ Verify .gitignore includes: $KEY_FILE"
    echo "4. 📤 Upload to Codemagic environment variables"
    echo "5. 📤 Upload to GitHub Secrets (if using GitHub Actions)"
    echo ""
    
    # Check .gitignore
    if [ -f ".gitignore" ]; then
        if grep -q "$KEY_FILE" .gitignore; then
            echo "✅ $KEY_FILE is in .gitignore"
        else
            echo "⚠️  Adding $KEY_FILE to .gitignore..."
            echo "" >> .gitignore
            echo "# GCP Service Account Keys" >> .gitignore
            echo "$KEY_FILE" >> .gitignore
            echo "google-play-*.json" >> .gitignore
            echo "*-service-account.json" >> .gitignore
            echo "✅ Added to .gitignore"
        fi
    else
        echo "⚠️  No .gitignore found. Creating one..."
        cat > .gitignore << 'EOF'
# GCP Service Account Keys
google-play-service-account.json
google-play-*.json
*-service-account.json
EOF
        echo "✅ Created .gitignore"
    fi
    
    echo ""
    echo "=================================================="
    echo "Next Steps"
    echo "=================================================="
    echo ""
    echo "For Codemagic:"
    echo "  1. Go to: https://codemagic.io/apps"
    echo "  2. Select your app"
    echo "  3. Go to: Environment variables"
    echo "  4. Add variable: GCLOUD_SERVICE_ACCOUNT_CREDENTIALS"
    echo "  5. Paste contents of: $KEY_FILE"
    echo ""
    echo "For GitHub Actions:"
    echo "  1. Go to: https://github.com/mpolobe/africa-railways/settings/secrets/actions"
    echo "  2. Click: New repository secret"
    echo "  3. Name: GOOGLE_PLAY_SERVICE_ACCOUNT"
    echo "  4. Value: (paste contents of $KEY_FILE)"
    echo ""
    echo "For EAS Build:"
    echo "  1. Run: eas secret:create --scope project --name GOOGLE_PLAY_SERVICE_ACCOUNT --type file --value $KEY_FILE"
    echo ""
else
    echo ""
    echo "❌ Failed to create service account key"
    echo ""
    echo "Common issues:"
    echo "  1. Insufficient permissions"
    echo "  2. Service account doesn't exist"
    echo "  3. Project billing not enabled"
    echo ""
    exit 1
fi
