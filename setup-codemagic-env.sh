#!/bin/bash

# Codemagic Environment Variables Setup Script
# This script helps you quickly add all environment variables to Codemagic

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Your credentials (from setup-all-secrets.sh)
EXPO_TOKEN="PU6XiaYTwUlDHY224UJecC_nxeLquM0mLCUDbi41"
RAILWAYS_KEY="rw_34a9e08f44dadbfd0f376a76df6d5594763a0e4fa77b6f63"
AFRICOIN_KEY="ac_606759e20b550edfc538388d6330a46e272f3b9644719ab1"
BACKEND_URL="https://africa-railways.vercel.app"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Codemagic Environment Variables Setup Helper            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Codemagic API token is available
if [ -z "$CODEMAGIC_API_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  CODEMAGIC_API_TOKEN not found in environment${NC}"
    echo ""
    echo "To use the automated API method:"
    echo "1. Go to https://codemagic.io/user/settings"
    echo "2. Navigate to 'Integrations' → 'Codemagic API'"
    echo "3. Generate a new API token"
    echo "4. Run: export CODEMAGIC_API_TOKEN='your-token-here'"
    echo "5. Run this script again"
    echo ""
    read -p "Do you want to continue with manual setup? (y/n): " MANUAL_SETUP
    
    if [ "$MANUAL_SETUP" != "y" ]; then
        echo "Exiting..."
        exit 0
    fi
    
    # Manual setup mode
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  Manual Setup Instructions${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Go to: https://codemagic.io/apps"
    echo "Navigate to: africa-railways → Settings → Environment variables"
    echo ""
    echo -e "${BLUE}Create these 4 environment groups:${NC}"
    echo ""
    
    # Group 1: railways_credentials
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Group 1: railways_credentials${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Variable 1:"
    echo "  Name: EXPO_TOKEN"
    echo "  Value: $EXPO_TOKEN"
    echo "  Secure: ✅ YES"
    echo ""
    echo "Variable 2:"
    echo "  Name: BACKEND_URL"
    echo "  Value: $BACKEND_URL"
    echo "  Secure: ❌ NO"
    echo ""
    echo "Variable 3:"
    echo "  Name: RAILWAYS_API_KEY"
    echo "  Value: $RAILWAYS_KEY"
    echo "  Secure: ✅ YES"
    echo ""
    read -p "Press Enter when you've added railways_credentials group..."
    
    # Group 2: africoin_credentials
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Group 2: africoin_credentials${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Variable 1:"
    echo "  Name: EXPO_TOKEN"
    echo "  Value: $EXPO_TOKEN"
    echo "  Secure: ✅ YES"
    echo ""
    echo "Variable 2:"
    echo "  Name: BACKEND_URL"
    echo "  Value: $BACKEND_URL"
    echo "  Secure: ❌ NO"
    echo ""
    echo "Variable 3:"
    echo "  Name: AFRICOIN_API_KEY"
    echo "  Value: $AFRICOIN_KEY"
    echo "  Secure: ✅ YES"
    echo ""
    read -p "Press Enter when you've added africoin_credentials group..."
    
    # Group 3: sentinel_credentials
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Group 3: sentinel_credentials${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Variable 1:"
    echo "  Name: EXPO_TOKEN"
    echo "  Value: $EXPO_TOKEN"
    echo "  Secure: ✅ YES"
    echo ""
    echo "Variable 2:"
    echo "  Name: BACKEND_URL"
    echo "  Value: $BACKEND_URL"
    echo "  Secure: ❌ NO"
    echo ""
    echo "Variable 3:"
    echo "  Name: SENTINEL_API_KEY"
    echo "  Value: $RAILWAYS_KEY"
    echo "  Secure: ✅ YES"
    echo ""
    echo "Variable 4:"
    echo "  Name: SUI_NETWORK"
    echo "  Value: mainnet"
    echo "  Secure: ❌ NO"
    echo ""
    read -p "Press Enter when you've added sentinel_credentials group..."
    
    # Group 4: staff_credentials
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Group 4: staff_credentials${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Variable 1:"
    echo "  Name: EXPO_TOKEN"
    echo "  Value: $EXPO_TOKEN"
    echo "  Secure: ✅ YES"
    echo ""
    echo "Variable 2:"
    echo "  Name: BACKEND_URL"
    echo "  Value: $BACKEND_URL"
    echo "  Secure: ❌ NO"
    echo ""
    echo "Variable 3:"
    echo "  Name: STAFF_API_KEY"
    echo "  Value: $RAILWAYS_KEY"
    echo "  Secure: ✅ YES"
    echo ""
    echo "Variable 4:"
    echo "  Name: ALCHEMY_SDK_KEY"
    echo "  Value: [Get from Alchemy dashboard]"
    echo "  Secure: ✅ YES"
    echo ""
    read -p "Press Enter when you've added staff_credentials group..."
    
    echo ""
    echo -e "${GREEN}✅ Manual setup complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Verify all 4 groups are created in Codemagic"
    echo "2. Trigger a test build:"
    echo "   git tag railways-v1.0.0-test"
    echo "   git push origin railways-v1.0.0-test"
    echo ""
    
else
    # Automated API setup
    echo -e "${GREEN}✅ CODEMAGIC_API_TOKEN found!${NC}"
    echo ""
    echo "Fetching your Codemagic app ID..."
    
    # Get app ID
    APP_ID=$(curl -s -H "x-auth-token: $CODEMAGIC_API_TOKEN" \
        https://api.codemagic.io/apps | \
        jq -r '.applications[] | select(.appName == "africa-railways") | ._id')
    
    if [ -z "$APP_ID" ]; then
        echo -e "${RED}❌ Could not find africa-railways app in Codemagic${NC}"
        echo "Please ensure:"
        echo "1. Repository is connected to Codemagic"
        echo "2. App name is 'africa-railways'"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Found app ID: $APP_ID${NC}"
    echo ""
    
    # Function to add environment variable
    add_env_var() {
        local GROUP=$1
        local NAME=$2
        local VALUE=$3
        local SECURE=$4
        
        echo "Adding $NAME to $GROUP..."
        
        curl -s -X POST \
            -H "x-auth-token: $CODEMAGIC_API_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{
                \"key\": \"$NAME\",
                \"value\": \"$VALUE\",
                \"group\": \"$GROUP\",
                \"secure\": $SECURE
            }" \
            "https://api.codemagic.io/apps/$APP_ID/variables" > /dev/null
        
        echo -e "${GREEN}  ✅ $NAME added${NC}"
    }
    
    echo "Setting up environment variables..."
    echo ""
    
    # Group 1: railways_credentials
    echo -e "${BLUE}Setting up railways_credentials...${NC}"
    add_env_var "railways_credentials" "EXPO_TOKEN" "$EXPO_TOKEN" "true"
    add_env_var "railways_credentials" "BACKEND_URL" "$BACKEND_URL" "false"
    add_env_var "railways_credentials" "RAILWAYS_API_KEY" "$RAILWAYS_KEY" "true"
    echo ""
    
    # Group 2: africoin_credentials
    echo -e "${BLUE}Setting up africoin_credentials...${NC}"
    add_env_var "africoin_credentials" "EXPO_TOKEN" "$EXPO_TOKEN" "true"
    add_env_var "africoin_credentials" "BACKEND_URL" "$BACKEND_URL" "false"
    add_env_var "africoin_credentials" "AFRICOIN_API_KEY" "$AFRICOIN_KEY" "true"
    echo ""
    
    # Group 3: sentinel_credentials
    echo -e "${BLUE}Setting up sentinel_credentials...${NC}"
    add_env_var "sentinel_credentials" "EXPO_TOKEN" "$EXPO_TOKEN" "true"
    add_env_var "sentinel_credentials" "BACKEND_URL" "$BACKEND_URL" "false"
    add_env_var "sentinel_credentials" "SENTINEL_API_KEY" "$RAILWAYS_KEY" "true"
    add_env_var "sentinel_credentials" "SUI_NETWORK" "mainnet" "false"
    echo ""
    
    # Group 4: staff_credentials
    echo -e "${BLUE}Setting up staff_credentials...${NC}"
    add_env_var "staff_credentials" "EXPO_TOKEN" "$EXPO_TOKEN" "true"
    add_env_var "staff_credentials" "BACKEND_URL" "$BACKEND_URL" "false"
    add_env_var "staff_credentials" "STAFF_API_KEY" "$RAILWAYS_KEY" "true"
    echo ""
    echo -e "${YELLOW}⚠️  Note: ALCHEMY_SDK_KEY not set (get from Alchemy dashboard)${NC}"
    echo ""
    
    echo -e "${GREEN}✅ All environment variables added to Codemagic!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Verify variables in Codemagic UI"
    echo "2. Add ALCHEMY_SDK_KEY to staff_credentials (if needed)"
    echo "3. Trigger a test build:"
    echo "   git tag railways-v1.0.0-test"
    echo "   git push origin railways-v1.0.0-test"
    echo ""
fi

# Generate quick reference file
cat > CODEMAGIC_ENV_REFERENCE.txt << EOF
Codemagic Environment Variables - Quick Reference
================================================

EXPO_TOKEN: $EXPO_TOKEN
BACKEND_URL: $BACKEND_URL
RAILWAYS_API_KEY: $RAILWAYS_KEY
AFRICOIN_API_KEY: $AFRICOIN_KEY

Groups configured:
✅ railways_credentials
✅ africoin_credentials
✅ sentinel_credentials
✅ staff_credentials

Setup completed: $(date)
EOF

echo -e "${GREEN}✅ Reference file created: CODEMAGIC_ENV_REFERENCE.txt${NC}"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Setup Complete! 🚀${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
