#!/bin/bash

# Complete secrets setup script for Africa Railways project
# This script helps you set up all required secrets in one go

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║     🔑 Complete Secrets Setup for Africa Railways           ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Your generated API keys
RAILWAYS_KEY="rw_34a9e08f44dadbfd0f376a76df6d5594763a0e4fa77b6f63"
AFRICOIN_KEY="ac_606759e20b550edfc538388d6330a46e272f3b9644719ab1"
EXPO_TOKEN="PU6XiaYTwUlDHY224UJecC_nxeLquM0mLCUDbi41"
BACKEND_URL="https://africa-railways.vercel.app"

echo "📋 This script will set up secrets in:"
echo "   1. GitHub Secrets (for CI/CD)"
echo "   2. EAS Secrets (for mobile builds)"
echo ""
echo "⚠️  Note: You'll need to manually add to Vercel"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo "   Install from: https://cli.github.com/"
    echo ""
    echo "   Or continue manually:"
    echo "   https://github.com/mpolobe/africa-railways/settings/secrets/actions"
    echo ""
    GH_AVAILABLE=false
else
    echo -e "${GREEN}✅ GitHub CLI detected${NC}"
    GH_AVAILABLE=true
fi

# Check if eas CLI is installed
if ! command -v eas &> /dev/null; then
    echo -e "${RED}❌ EAS CLI is not installed${NC}"
    echo "   Install with: npm install -g eas-cli"
    echo ""
    EAS_AVAILABLE=false
else
    echo -e "${GREEN}✅ EAS CLI detected${NC}"
    EAS_AVAILABLE=true
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

# Display the secrets
echo "🔑 Your API Keys:"
echo ""
echo -e "${BLUE}EXPO_TOKEN:${NC}"
echo "   $EXPO_TOKEN"
echo ""
echo -e "${BLUE}BACKEND_URL:${NC}"
echo "   $BACKEND_URL"
echo ""
echo -e "${BLUE}RAILWAYS_API_KEY:${NC}"
echo "   $RAILWAYS_KEY"
echo ""
echo -e "${BLUE}AFRICOIN_API_KEY:${NC}"
echo "   $AFRICOIN_KEY"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

# Ask user what they want to do
echo "What would you like to do?"
echo ""
echo "1) Set up GitHub Secrets (requires gh CLI)"
echo "2) Set up EAS Secrets (requires eas CLI)"
echo "3) Set up both"
echo "4) Show manual setup instructions"
echo "5) Exit"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        if [ "$GH_AVAILABLE" = true ]; then
            echo ""
            echo "🚀 Setting up GitHub Secrets..."
            echo ""
            
            gh secret set EXPO_TOKEN --body "$EXPO_TOKEN" --repo mpolobe/africa-railways
            echo "✅ EXPO_TOKEN set"
            
            gh secret set BACKEND_URL --body "$BACKEND_URL" --repo mpolobe/africa-railways
            echo "✅ BACKEND_URL set"
            
            gh secret set RAILWAYS_API_KEY --body "$RAILWAYS_KEY" --repo mpolobe/africa-railways
            echo "✅ RAILWAYS_API_KEY set"
            
            gh secret set AFRICOIN_API_KEY --body "$AFRICOIN_KEY" --repo mpolobe/africa-railways
            echo "✅ AFRICOIN_API_KEY set"
            
            echo ""
            echo "✅ All GitHub Secrets set successfully!"
        else
            echo ""
            echo "❌ GitHub CLI not available. Please install it first."
        fi
        ;;
    
    2)
        if [ "$EAS_AVAILABLE" = true ]; then
            echo ""
            echo "🚀 Setting up EAS Secrets..."
            echo ""
            
            eas secret:create --scope project --name BACKEND_URL --value "$BACKEND_URL" --force
            echo "✅ BACKEND_URL set"
            
            eas secret:create --scope project --name RAILWAYS_API_KEY --value "$RAILWAYS_KEY" --force
            echo "✅ RAILWAYS_API_KEY set"
            
            eas secret:create --scope project --name AFRICOIN_API_KEY --value "$AFRICOIN_KEY" --force
            echo "✅ AFRICOIN_API_KEY set"
            
            echo ""
            echo "✅ All EAS Secrets set successfully!"
        else
            echo ""
            echo "❌ EAS CLI not available. Please install it first."
        fi
        ;;
    
    3)
        echo ""
        echo "🚀 Setting up all secrets..."
        echo ""
        
        if [ "$GH_AVAILABLE" = true ]; then
            echo "📦 Setting up GitHub Secrets..."
            gh secret set EXPO_TOKEN --body "$EXPO_TOKEN" --repo mpolobe/africa-railways
            gh secret set BACKEND_URL --body "$BACKEND_URL" --repo mpolobe/africa-railways
            gh secret set RAILWAYS_API_KEY --body "$RAILWAYS_KEY" --repo mpolobe/africa-railways
            gh secret set AFRICOIN_API_KEY --body "$AFRICOIN_KEY" --repo mpolobe/africa-railways
            echo "✅ GitHub Secrets set"
            echo ""
        else
            echo "⚠️  Skipping GitHub Secrets (gh CLI not available)"
            echo ""
        fi
        
        if [ "$EAS_AVAILABLE" = true ]; then
            echo "📦 Setting up EAS Secrets..."
            eas secret:create --scope project --name BACKEND_URL --value "$BACKEND_URL" --force
            eas secret:create --scope project --name RAILWAYS_API_KEY --value "$RAILWAYS_KEY" --force
            eas secret:create --scope project --name AFRICOIN_API_KEY --value "$AFRICOIN_KEY" --force
            echo "✅ EAS Secrets set"
            echo ""
        else
            echo "⚠️  Skipping EAS Secrets (eas CLI not available)"
            echo ""
        fi
        
        echo "✅ Setup complete!"
        ;;
    
    4)
        echo ""
        echo "📖 Manual Setup Instructions"
        echo ""
        echo "════════════════════════════════════════════════════════════════"
        echo ""
        echo "1️⃣  GitHub Secrets:"
        echo "   Go to: https://github.com/mpolobe/africa-railways/settings/secrets/actions"
        echo ""
        echo "   Add these secrets:"
        echo "   - EXPO_TOKEN = $EXPO_TOKEN"
        echo "   - BACKEND_URL = $BACKEND_URL"
        echo "   - RAILWAYS_API_KEY = $RAILWAYS_KEY"
        echo "   - AFRICOIN_API_KEY = $AFRICOIN_KEY"
        echo ""
        echo "════════════════════════════════════════════════════════════════"
        echo ""
        echo "2️⃣  Vercel Environment Variables:"
        echo "   Go to: https://vercel.com/[your-project]/settings/environment-variables"
        echo ""
        echo "   Add these variables:"
        echo "   - RAILWAYS_API_KEY = $RAILWAYS_KEY"
        echo "   - AFRICOIN_API_KEY = $AFRICOIN_KEY"
        echo ""
        echo "   Then redeploy your backend!"
        echo ""
        echo "════════════════════════════════════════════════════════════════"
        echo ""
        echo "3️⃣  EAS Secrets (optional):"
        echo "   Run these commands:"
        echo ""
        echo "   eas secret:create --scope project --name BACKEND_URL --value \"$BACKEND_URL\""
        echo "   eas secret:create --scope project --name RAILWAYS_API_KEY --value \"$RAILWAYS_KEY\""
        echo "   eas secret:create --scope project --name AFRICOIN_API_KEY --value \"$AFRICOIN_KEY\""
        echo ""
        echo "════════════════════════════════════════════════════════════════"
        ;;
    
    5)
        echo ""
        echo "👋 Exiting..."
        exit 0
        ;;
    
    *)
        echo ""
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📝 Don't forget to:"
echo ""
echo "1. Add API keys to Vercel:"
echo "   https://vercel.com/[your-project]/settings/environment-variables"
echo ""
echo "2. Redeploy your backend after adding Vercel variables"
echo ""
echo "3. Test your setup:"
echo "   Read: ./TEST_BUILD.md"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "✅ Setup complete! You're ready to build!"
echo ""
echo "Next steps: ./NEXT_STEPS.md"
echo ""
