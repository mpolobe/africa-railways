#!/bin/bash
# Filename: scripts/configure_webhook.sh
# Purpose: Configure database webhook settings

set -e

echo "⚙️  Configuring Database Webhook Settings..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check for required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${RED}❌ Error: Missing required environment variables${NC}"
  echo ""
  echo "Required:"
  echo "  SUPABASE_URL"
  echo "  SUPABASE_SERVICE_ROLE_KEY"
  echo ""
  echo "Set these in your .env file or export them"
  exit 1
fi

# Extract project reference from URL
PROJECT_REF=$(echo "$SUPABASE_URL" | sed -E 's|https://([^.]+)\.supabase\.co|\1|')

if [ -z "$PROJECT_REF" ]; then
  echo -e "${RED}❌ Could not extract project reference from SUPABASE_URL${NC}"
  exit 1
fi

FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1/handle-staff-approval"

echo -e "${BLUE}Configuration:${NC}"
echo "  Project Ref: $PROJECT_REF"
echo "  Function URL: $FUNCTION_URL"
echo ""

# Create SQL to configure settings
SQL=$(cat <<EOF
-- Configure webhook settings
ALTER DATABASE postgres 
SET app.settings.function_url = '$FUNCTION_URL';

ALTER DATABASE postgres 
SET app.settings.service_role_key = '$SUPABASE_SERVICE_ROLE_KEY';

-- Verify settings
SELECT 
  'function_url' as setting,
  current_setting('app.settings.function_url', true) as value
UNION ALL
SELECT 
  'service_role_key' as setting,
  CASE 
    WHEN current_setting('app.settings.service_role_key', true) IS NOT NULL 
    THEN '***configured***'
    ELSE 'NOT SET'
  END as value;
EOF
)

echo -e "${YELLOW}Applying configuration...${NC}"
echo ""

# Apply configuration using psql
if command -v psql &> /dev/null; then
  echo "$SQL" | psql "$SUPABASE_URL"
  
  if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Webhook configuration applied${NC}"
  else
    echo ""
    echo -e "${RED}❌ Failed to apply configuration${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}⚠️  psql not found. Run this SQL manually in Supabase SQL Editor:${NC}"
  echo ""
  echo "$SQL"
  echo ""
fi

echo ""
echo -e "${GREEN}Configuration Summary:${NC}"
echo "  ✅ Function URL configured"
echo "  ✅ Service Role Key configured"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Deploy Edge Function:"
echo "     supabase functions deploy handle-staff-approval"
echo ""
echo "  2. Test webhook:"
echo "     ./scripts/test_webhook_payload.sh"
echo ""
echo "  3. Test end-to-end:"
echo "     Update a test user status to 'approved' in Supabase Dashboard"
echo ""
