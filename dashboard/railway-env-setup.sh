#!/bin/bash

# Railway Environment Variables Setup Script
# Run this ONCE to set all environment variables in Railway

set -e

echo "🚂 Railway Environment Variables Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found!"
    echo ""
    echo "Install it with:"
    echo "  npm i -g @railway/cli"
    echo ""
    echo "Or:"
    echo "  curl -fsSL https://railway.app/install.sh | sh"
    exit 1
fi

echo "✅ Railway CLI found"
echo ""

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway"
    echo ""
    echo "Please login first:"
    echo "  railway login"
    exit 1
fi

echo "✅ Logged in to Railway"
echo ""

# Load environment variables from .env.railway
if [ ! -f ".env.railway" ]; then
    echo "❌ .env.railway file not found!"
    echo ""
    echo "Please create .env.railway with your environment variables"
    exit 1
fi

echo "📋 Loading variables from .env.railway..."
echo ""

# Read and set each variable
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ $key =~ ^#.*$ ]] && continue
    [[ -z $key ]] && continue
    
    # Remove quotes if present
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    
    # Set the variable in Railway
    echo "Setting: $key"
    railway variables set "$key=$value"
    
done < .env.railway

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All environment variables set in Railway!"
echo ""
echo "Verify with:"
echo "  railway variables"
echo ""
echo "Deploy with:"
echo "  railway up"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
