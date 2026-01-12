#!/bin/bash

##############################################################################
# Secure Credentials Setup Script
# 
# This script helps you securely configure API keys and tokens
# Run: bash scripts/setup-credentials.sh
##############################################################################

set -e

echo "🔐 Africa Railways - Secure Credentials Setup"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file already exists${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Exiting without changes."
        exit 0
    fi
    mv .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✅ Backed up existing .env file${NC}"
fi

# Create .env file
cat > .env << 'EOF'
# ============================================
# SENSITIVE CREDENTIALS - NEVER COMMIT
# ============================================
# This file is gitignored and should never be committed to version control

# OpenAI API Key
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=

# Airtable API Token
# Get from: https://airtable.com/create/tokens
AIRTABLE_API_KEY=

# Airtable Base IDs
# Get from each base's API documentation
AIRTABLE_INFRASTRUCTURE_BASE_ID=
AIRTABLE_OPERATIONS_BASE_ID=
AIRTABLE_SENTINEL_BASE_ID=
AIRTABLE_FINANCIAL_BASE_ID=

# Supabase
# Get from: https://supabase.com/dashboard/project/_/settings/api
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Backend APIs
RAILWAYS_API_URL=https://africa-railways.vercel.app
RAILWAYS_API_KEY=

# SMS Providers
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
AT_API_KEY=
AT_USERNAME=

# Blockchain
SUI_RPC_URL=https://fullnode.mainnet.sui.io:443
SUI_ADMIN_ADDRESS=

# Expo/EAS
EXPO_TOKEN=

EOF

echo -e "${GREEN}✅ Created .env file${NC}"
echo ""

# Verify .gitignore
if grep -q "^\.env$" .gitignore; then
    echo -e "${GREEN}✅ .env is in .gitignore${NC}"
else
    echo -e "${RED}❌ .env is NOT in .gitignore${NC}"
    echo "Adding .env to .gitignore..."
    echo ".env" >> .gitignore
    echo -e "${GREEN}✅ Added .env to .gitignore${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📝 Next Steps:"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "1. Edit .env file and add your credentials:"
echo "   nano .env"
echo ""
echo "2. Get your API keys:"
echo "   • OpenAI:   https://platform.openai.com/api-keys"
echo "   • Airtable: https://airtable.com/create/tokens"
echo "   • Supabase: https://supabase.com/dashboard"
echo ""
echo "3. Test your setup:"
echo "   node scripts/openai-test.js simple"
echo "   node scripts/airtable-sync/sync-schedules.js"
echo ""
echo "4. Review security checklist:"
echo "   cat SECURITY_CHECKLIST.md"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Never commit .env file to git!${NC}"
echo -e "${YELLOW}⚠️  IMPORTANT: Revoke any exposed API keys immediately!${NC}"
echo ""
