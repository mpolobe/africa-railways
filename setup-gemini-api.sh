#!/bin/bash

# Gemini API Key Setup Script for Africa Railways
# Adds Gemini API key to Codemagic and GitHub

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Gemini API Configuration
GEMINI_API_KEY="AIzaSyAqJaTc_LubzhXsohzA8Qi4PyQ-LtNPrhc"
GEMINI_PROJECT_NAME="AfriCoin-Sovereign-Key"
GEMINI_PROJECT_NUMBER="5780586642"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Gemini API Key Setup for Africa Railways                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo "📋 Gemini API Details:"
echo "   Project: $GEMINI_PROJECT_NAME"
echo "   Project Number: $GEMINI_PROJECT_NUMBER"
echo "   API Key: ${GEMINI_API_KEY:0:20}..."
echo ""

# ============================================================================
# CODEMAGIC SETUP
# ============================================================================

if [ -z "$CODEMAGIC_API_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  CODEMAGIC_API_TOKEN not set${NC}"
    echo ""
    echo "To add to Codemagic automatically:"
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
    
    APP_ID="69502eb9a1902c6825c51679"
    
    echo ""
    echo "Adding Gemini API key to Codemagic environment groups..."
    echo ""
    
    # Add to web_credentials group
    echo "→ Adding to web_credentials group..."
    curl -s -X POST \
        -H "x-auth-token: $CODEMAGIC_API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"GEMINI_API_KEY\",
            \"value\": \"$GEMINI_API_KEY\",
            \"group\": \"web_credentials\",
            \"secure\": true
        }" \
        "https://api.codemagic.io/apps/$APP_ID/variables" > /dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}  ✅ Added to web_credentials${NC}"
    else
        echo -e "${RED}  ❌ Failed to add to web_credentials${NC}"
    fi
    
    # Add to railways_credentials group
    echo "→ Adding to railways_credentials group..."
    curl -s -X POST \
        -H "x-auth-token: $CODEMAGIC_API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"GEMINI_API_KEY\",
            \"value\": \"$GEMINI_API_KEY\",
            \"group\": \"railways_credentials\",
            \"secure\": true
        }" \
        "https://api.codemagic.io/apps/$APP_ID/variables" > /dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}  ✅ Added to railways_credentials${NC}"
    else
        echo -e "${RED}  ❌ Failed to add to railways_credentials${NC}"
    fi
    
    # Add to africoin_credentials group
    echo "→ Adding to africoin_credentials group..."
    curl -s -X POST \
        -H "x-auth-token: $CODEMAGIC_API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"GEMINI_API_KEY\",
            \"value\": \"$GEMINI_API_KEY\",
            \"group\": \"africoin_credentials\",
            \"secure\": true
        }" \
        "https://api.codemagic.io/apps/$APP_ID/variables" > /dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}  ✅ Added to africoin_credentials${NC}"
    else
        echo -e "${RED}  ❌ Failed to add to africoin_credentials${NC}"
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
    echo "To add to GitHub automatically:"
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
    
    if ! gh auth status &> /dev/null; then
        echo -e "${YELLOW}⚠️  Not authenticated with GitHub${NC}"
        echo "Run: gh auth login"
        echo ""
        SKIP_GITHUB=true
    else
        echo ""
        echo "Adding Gemini API key to GitHub Secrets..."
        echo ""
        
        echo "→ Adding GEMINI_API_KEY..."
        echo "$GEMINI_API_KEY" | gh secret set GEMINI_API_KEY
        echo -e "${GREEN}  ✅ GEMINI_API_KEY added${NC}"
        
        echo ""
        echo -e "${GREEN}✅ GitHub Secrets configured!${NC}"
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
    echo -e "${GREEN}✅ Codemagic:${NC} GEMINI_API_KEY added to:"
    echo "   - web_credentials"
    echo "   - railways_credentials"
    echo "   - africoin_credentials"
else
    echo -e "${YELLOW}⚠️  Codemagic:${NC} Manual setup required"
    echo "   → https://codemagic.io/apps/$APP_ID/settings"
    echo "   → Add to environment groups:"
    echo "     - web_credentials"
    echo "     - railways_credentials"
    echo "     - africoin_credentials"
    echo "   → Variable: GEMINI_API_KEY (secure)"
    echo "   → Value: $GEMINI_API_KEY"
fi

echo ""

if [ -z "$SKIP_GITHUB" ]; then
    echo -e "${GREEN}✅ GitHub:${NC} GEMINI_API_KEY added to repository secrets"
else
    echo -e "${YELLOW}⚠️  GitHub:${NC} Manual setup required"
    echo "   → https://github.com/mpolobe/africa-railways/settings/secrets/actions"
    echo "   → Add secret: GEMINI_API_KEY"
    echo "   → Value: $GEMINI_API_KEY"
fi

echo ""
echo "─────────────────────────────────────────────────────────────"
echo ""
echo "📚 Gemini API Features:"
echo ""
echo "✅ AI-powered chatbot for customer support"
echo "✅ Natural language ticket booking"
echo "✅ Route recommendations"
echo "✅ Travel assistance"
echo "✅ Multi-language support"
echo ""
echo "📖 Documentation:"
echo "   - Project: $GEMINI_PROJECT_NAME"
echo "   - Project Number: $GEMINI_PROJECT_NUMBER"
echo "   - Model: gemini-pro / gemini-3-flash-preview"
echo ""
echo "🔗 Resources:"
echo "   - Gemini API Docs: https://ai.google.dev/docs"
echo "   - Google AI Studio: https://aistudio.google.com/"
echo "   - Project Console: https://console.cloud.google.com/apis/dashboard?project=$GEMINI_PROJECT_NUMBER"
echo ""
echo "─────────────────────────────────────────────────────────────"
echo ""
echo -e "${GREEN}🎉 Gemini API integration ready!${NC}"
echo ""
