#!/bin/bash

# 🚨 Emergency Key Rotation Script
# Use this after keys have been exposed

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🚨 EMERGENCY KEY ROTATION                                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  This script helps you rotate compromised API keys."
echo ""

# Warning
echo "🔴 CRITICAL: Have you revoked the old keys?"
echo ""
echo "You MUST revoke these keys first:"
echo "  1. Railways API key"
echo "  2. Africoin API key"
echo "  3. Expo token"
echo ""
read -p "Have you revoked ALL old keys? (yes/no): " REVOKED

if [ "$REVOKED" != "yes" ]; then
    echo ""
    echo "❌ Please revoke the old keys first!"
    echo ""
    echo "Where to revoke:"
    echo "  • Railways: Your Railways API dashboard"
    echo "  • Africoin: Your Africoin API dashboard"
    echo "  • Expo: https://expo.dev/accounts/[your-account]/settings/access-tokens"
    echo ""
    exit 1
fi

echo ""
echo "✅ Good! Now let's set up the new keys securely."
echo ""

# Check if .env exists
if [ -f ".env" ]; then
    echo "⚠️  Backing up old .env file..."
    mv .env .env.backup.$(date +%s)
    echo "✅ Old .env backed up"
fi

# Create new .env
echo "📝 Creating new .env file..."
cat > .env << 'EOF'
# Environment Variables - Rotated Keys
# Generated: $(date)
# DO NOT COMMIT THIS FILE!

# Railways Configuration
RAILWAYS_API_KEY=
RAILWAYS_API_URL=https://africa-railways.vercel.app

# Africoin Configuration
AFRICOIN_API_KEY=
AFRICOIN_API_URL=https://africoin-wallet.vercel.app

# Expo/EAS
EXPO_TOKEN=

# Database
DATABASE_URL=

# Sui Blockchain
SUI_RPC_URL=https://fullnode.mainnet.sui.io:443
EOF

echo "✅ New .env file created"
echo ""

# Prompt for NEW keys
echo "📋 Enter your NEW API keys"
echo "   (Keys will be hidden for security)"
echo ""
echo "⚠️  Make sure these are NEW keys, not the old ones!"
echo ""

read -sp "Enter NEW RAILWAYS_API_KEY: " NEW_RAILWAYS_KEY
echo ""
read -sp "Enter NEW AFRICOIN_API_KEY: " NEW_AFRICOIN_KEY
echo ""
read -sp "Enter NEW EXPO_TOKEN: " NEW_EXPO_KEY
echo ""

# Validate keys are different
if [ "$NEW_RAILWAYS_KEY" = "aKjXUKD22TMSDbhdoxxuEjFGn7RlxvQmd_tQW39E" ]; then
    echo ""
    echo "❌ ERROR: You entered the OLD Railways key!"
    echo "   Please generate a NEW key and run this script again."
    exit 1
fi

if [ "$NEW_AFRICOIN_KEY" = "peV4FAZUHSRIu8H2_FZmZo0oJuSkgX93ILTakG-E" ]; then
    echo ""
    echo "❌ ERROR: You entered the OLD Africoin key!"
    echo "   Please generate a NEW key and run this script again."
    exit 1
fi

if [ "$NEW_EXPO_KEY" = "NxtWhb_j9jj5fGVmW98TpGriq9NCDzYCjGfRTyvG" ]; then
    echo ""
    echo "❌ ERROR: You entered the OLD Expo key!"
    echo "   Please generate a NEW key and run this script again."
    exit 1
fi

# Update .env file
echo ""
echo "💾 Saving new keys..."

if [ -n "$NEW_RAILWAYS_KEY" ]; then
    sed -i "s|RAILWAYS_API_KEY=|RAILWAYS_API_KEY=$NEW_RAILWAYS_KEY|" .env
    echo "✅ Railways API key saved"
fi

if [ -n "$NEW_AFRICOIN_KEY" ]; then
    sed -i "s|AFRICOIN_API_KEY=|AFRICOIN_API_KEY=$NEW_AFRICOIN_KEY|" .env
    echo "✅ Africoin API key saved"
fi

if [ -n "$NEW_EXPO_KEY" ]; then
    sed -i "s|EXPO_TOKEN=|EXPO_TOKEN=$NEW_EXPO_KEY|" .env
    echo "✅ Expo token saved"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✅ Local Keys Rotated!                                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Update GitHub Secrets
echo "Would you like to update GitHub Secrets now?"
echo "(Requires GitHub CLI: gh)"
echo ""
read -p "Update GitHub Secrets? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v gh &> /dev/null; then
        echo ""
        echo "🔄 Updating GitHub Secrets..."
        
        if [ -n "$NEW_RAILWAYS_KEY" ]; then
            echo "$NEW_RAILWAYS_KEY" | gh secret set RAILWAYS_API_KEY
            echo "✅ RAILWAYS_API_KEY updated in GitHub"
        fi
        
        if [ -n "$NEW_AFRICOIN_KEY" ]; then
            echo "$NEW_AFRICOIN_KEY" | gh secret set AFRICOIN_API_KEY
            echo "✅ AFRICOIN_API_KEY updated in GitHub"
        fi
        
        if [ -n "$NEW_EXPO_KEY" ]; then
            echo "$NEW_EXPO_KEY" | gh secret set EXPO_TOKEN
            echo "✅ EXPO_TOKEN updated in GitHub"
        fi
        
        echo ""
        echo "✅ GitHub Secrets updated!"
    else
        echo "❌ GitHub CLI (gh) not found."
        echo ""
        echo "Please update manually:"
        echo "https://github.com/mpolobe/africa-railways/settings/secrets/actions"
    fi
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🎉 Key Rotation Complete!                                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ What was done:"
echo "  • Old .env backed up"
echo "  • New .env created with new keys"
echo "  • Keys validated (not the old ones)"
echo "  • GitHub Secrets updated (if selected)"
echo ""
echo "⚠️  Still TODO:"
echo "  • Update Vercel environment variables (if deployed)"
echo "  • Update EAS secrets (if building apps)"
echo "  • Test all services with new keys"
echo ""
echo "Commands to update other services:"
echo ""
echo "Vercel:"
echo "  vercel env add RAILWAYS_API_KEY production"
echo "  vercel env add AFRICOIN_API_KEY production"
echo ""
echo "EAS:"
echo "  eas secret:create --scope project --name RAILWAYS_API_KEY"
echo "  eas secret:create --scope project --name AFRICOIN_API_KEY"
echo "  eas secret:create --scope project --name EXPO_TOKEN"
echo ""
echo "For more info: SECURITY_GUIDE.md"
echo ""
