#!/bin/bash

# BrowserStack Integration Setup Script
# Adds BrowserStack credentials to Codemagic and GitHub

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# BrowserStack Credentials
BROWSERSTACK_ACCESS_KEY="YkRwgayd5JiTUZWKBCNp"
BROWSERSTACK_URL="http://benjaminmpolokos_dzbone.browserstack.com"
BROWSERSTACK_USERNAME="benjaminmpolokos_dzbone"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   BrowserStack Integration Setup                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo "📋 This script will configure BrowserStack credentials in:"
echo "   1. Codemagic (via API)"
echo "   2. GitHub Secrets (via gh CLI)"
echo "   3. Local .env file"
echo ""

# ============================================================================
# CODEMAGIC SETUP
# ============================================================================

if [ -z "$CODEMAGIC_API_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  CODEMAGIC_API_TOKEN not set${NC}"
    echo ""
    echo "To add credentials to Codemagic automatically:"
    echo "1. Go to https://codemagic.io/user/settings"
    echo "2. Navigate to 'Integrations' → 'Codemagic API'"
    echo "3. Generate a new API token"
    echo "4. Run: export CODEMAGIC_API_TOKEN='your-token-here'"
    echo "5. Run this script again"
    echo ""
    echo "Or add manually at: https://codemagic.io/apps"
    echo ""
    SKIP_CODEMAGIC=true
else
    echo -e "${GREEN}✅ CODEMAGIC_API_TOKEN found${NC}"
    
    # Get App ID
    APP_ID="69502eb9a1902c6825c51679"
    
    echo ""
    echo "Adding BrowserStack credentials to Codemagic..."
    echo ""
    
    # Add BROWSERSTACK_ACCESS_KEY
    echo "→ Adding BROWSERSTACK_ACCESS_KEY..."
    curl -s -X POST \
        -H "x-auth-token: $CODEMAGIC_API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"BROWSERSTACK_ACCESS_KEY\",
            \"value\": \"$BROWSERSTACK_ACCESS_KEY\",
            \"group\": \"browserstack_credentials\",
            \"secure\": true
        }" \
        "https://api.codemagic.io/apps/$APP_ID/variables" > /dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}  ✅ BROWSERSTACK_ACCESS_KEY added${NC}"
    else
        echo -e "${RED}  ❌ Failed to add BROWSERSTACK_ACCESS_KEY${NC}"
    fi
    
    # Add BROWSERSTACK_USERNAME
    echo "→ Adding BROWSERSTACK_USERNAME..."
    curl -s -X POST \
        -H "x-auth-token: $CODEMAGIC_API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"BROWSERSTACK_USERNAME\",
            \"value\": \"$BROWSERSTACK_USERNAME\",
            \"group\": \"browserstack_credentials\",
            \"secure\": false
        }" \
        "https://api.codemagic.io/apps/$APP_ID/variables" > /dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}  ✅ BROWSERSTACK_USERNAME added${NC}"
    else
        echo -e "${RED}  ❌ Failed to add BROWSERSTACK_USERNAME${NC}"
    fi
    
    # Add BROWSERSTACK_URL
    echo "→ Adding BROWSERSTACK_URL..."
    curl -s -X POST \
        -H "x-auth-token: $CODEMAGIC_API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"BROWSERSTACK_URL\",
            \"value\": \"$BROWSERSTACK_URL\",
            \"group\": \"browserstack_credentials\",
            \"secure\": false
        }" \
        "https://api.codemagic.io/apps/$APP_ID/variables" > /dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}  ✅ BROWSERSTACK_URL added${NC}"
    else
        echo -e "${RED}  ❌ Failed to add BROWSERSTACK_URL${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}✅ Codemagic credentials configured!${NC}"
fi

# ============================================================================
# GITHUB SECRETS SETUP
# ============================================================================

echo ""
echo "─────────────────────────────────────────────────────────────"
echo ""

if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}⚠️  GitHub CLI (gh) not installed${NC}"
    echo ""
    echo "To add credentials to GitHub automatically:"
    echo "1. Install gh CLI: https://cli.github.com/"
    echo "2. Run: gh auth login"
    echo "3. Run this script again"
    echo ""
    echo "Or add manually at:"
    echo "https://github.com/mpolobe/africa-railways/settings/secrets/actions"
    echo ""
    SKIP_GITHUB=true
else
    echo -e "${GREEN}✅ GitHub CLI detected${NC}"
    
    # Check if authenticated
    if ! gh auth status &> /dev/null; then
        echo -e "${YELLOW}⚠️  Not authenticated with GitHub${NC}"
        echo "Run: gh auth login"
        echo ""
        SKIP_GITHUB=true
    else
        echo ""
        echo "Adding BrowserStack credentials to GitHub Secrets..."
        echo ""
        
        # Add secrets
        echo "→ Adding BROWSERSTACK_ACCESS_KEY..."
        echo "$BROWSERSTACK_ACCESS_KEY" | gh secret set BROWSERSTACK_ACCESS_KEY
        echo -e "${GREEN}  ✅ BROWSERSTACK_ACCESS_KEY added${NC}"
        
        echo "→ Adding BROWSERSTACK_USERNAME..."
        echo "$BROWSERSTACK_USERNAME" | gh secret set BROWSERSTACK_USERNAME
        echo -e "${GREEN}  ✅ BROWSERSTACK_USERNAME added${NC}"
        
        echo "→ Adding BROWSERSTACK_URL..."
        echo "$BROWSERSTACK_URL" | gh secret set BROWSERSTACK_URL
        echo -e "${GREEN}  ✅ BROWSERSTACK_URL added${NC}"
        
        echo ""
        echo -e "${GREEN}✅ GitHub Secrets configured!${NC}"
    fi
fi

# ============================================================================
# LOCAL .ENV SETUP
# ============================================================================

echo ""
echo "─────────────────────────────────────────────────────────────"
echo ""
echo "Updating local .env.example..."

# Check if .env.example exists
if [ ! -f .env.example ]; then
    echo -e "${RED}❌ .env.example not found${NC}"
else
    # Check if BrowserStack variables already exist
    if grep -q "BROWSERSTACK" .env.example; then
        echo -e "${YELLOW}⚠️  BrowserStack variables already in .env.example${NC}"
    else
        # Add BrowserStack section
        cat >> .env.example << 'EOF'

# BrowserStack Testing
BROWSERSTACK_USERNAME=benjaminmpolokos_dzbone
BROWSERSTACK_ACCESS_KEY=your_browserstack_access_key_here
BROWSERSTACK_URL=http://benjaminmpolokos_dzbone.browserstack.com
EOF
        echo -e "${GREEN}✅ BrowserStack variables added to .env.example${NC}"
    fi
fi

# ============================================================================
# SUMMARY
# ============================================================================

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Setup Complete!                                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ -z "$SKIP_CODEMAGIC" ]; then
    echo -e "${GREEN}✅ Codemagic:${NC} Credentials added to 'browserstack_credentials' group"
else
    echo -e "${YELLOW}⚠️  Codemagic:${NC} Manual setup required"
    echo "   → https://codemagic.io/apps/$APP_ID/settings"
    echo "   → Add to 'browserstack_credentials' group:"
    echo "     - BROWSERSTACK_ACCESS_KEY (secure): $BROWSERSTACK_ACCESS_KEY"
    echo "     - BROWSERSTACK_USERNAME: $BROWSERSTACK_USERNAME"
    echo "     - BROWSERSTACK_URL: $BROWSERSTACK_URL"
fi

echo ""

if [ -z "$SKIP_GITHUB" ]; then
    echo -e "${GREEN}✅ GitHub:${NC} Secrets added to repository"
else
    echo -e "${YELLOW}⚠️  GitHub:${NC} Manual setup required"
    echo "   → https://github.com/mpolobe/africa-railways/settings/secrets/actions"
    echo "   → Add these secrets:"
    echo "     - BROWSERSTACK_ACCESS_KEY: $BROWSERSTACK_ACCESS_KEY"
    echo "     - BROWSERSTACK_USERNAME: $BROWSERSTACK_USERNAME"
    echo "     - BROWSERSTACK_URL: $BROWSERSTACK_URL"
fi

echo ""
echo -e "${GREEN}✅ Local:${NC} .env.example updated"

echo ""
echo "─────────────────────────────────────────────────────────────"
echo ""
echo "📚 Next Steps:"
echo ""
echo "1. Review the integration guide:"
echo "   → cat BROWSERSTACK_SCAN_REPORT.md"
echo ""
echo "2. Test BrowserStack connection:"
echo "   → curl -u \"$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY\" \\"
echo "     https://api.browserstack.com/app-automate/plan.json"
echo ""
echo "3. Upload your first APK:"
echo "   → See BROWSERSTACK_SCAN_REPORT.md for upload commands"
echo ""
echo "4. Update codemagic.yaml to use BrowserStack:"
echo "   → Add 'browserstack_credentials' to workflow environment groups"
echo ""
echo "─────────────────────────────────────────────────────────────"
echo ""
echo -e "${GREEN}🎉 BrowserStack integration ready!${NC}"
echo ""
