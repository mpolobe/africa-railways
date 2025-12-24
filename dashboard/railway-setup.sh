#!/bin/bash

# Railway Environment Setup Script
# This script automatically configures environment variables during deployment

set -e

echo "🚂 Railway Environment Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if running on Railway
if [ -z "$RAILWAY_ENVIRONMENT" ]; then
    echo "⚠️  Not running on Railway, skipping environment setup"
    exit 0
fi

echo "✅ Running on Railway environment: $RAILWAY_ENVIRONMENT"

# Load environment variables from .env file if it exists
if [ -f "../.env" ]; then
    echo "📋 Loading environment variables from .env file..."
    export $(cat ../.env | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded"
else
    echo "⚠️  No .env file found, using Railway environment variables"
fi

# Verify required environment variables
echo ""
echo "🔍 Verifying required environment variables..."

REQUIRED_VARS=(
    "RELAYER_PRIVATE_KEY"
    "ALCHEMY_API_KEY"
    "PORT"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
        echo "❌ Missing: $var"
    else
        echo "✅ Found: $var"
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo ""
    echo "❌ Missing required environment variables:"
    printf '   - %s\n' "${MISSING_VARS[@]}"
    echo ""
    echo "Please set these variables in Railway dashboard:"
    echo "   Settings → Variables → Add Variable"
    exit 1
fi

echo ""
echo "✅ All required environment variables are set"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Auto-detect relayer address
if [ -n "$RELAYER_PRIVATE_KEY" ]; then
    echo "🔐 Auto-detecting relayer address..."
    
    # This will be done by the Go application
    # Just verify the key format
    KEY_LENGTH=${#RELAYER_PRIVATE_KEY}
    if [ $KEY_LENGTH -eq 64 ]; then
        echo "✅ Private key format valid (64 characters)"
    else
        echo "⚠️  Warning: Private key should be 64 hex characters (found: $KEY_LENGTH)"
    fi
fi

echo ""
echo "🚀 Environment setup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
