#!/bin/bash
# Filename: scripts/set_notification_secrets.sh
# Purpose: Sync notification secrets to Supabase Edge Functions

set -e

echo "🔐 Syncing Notification Secrets to Supabase Cloud..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
  echo -e "${RED}❌ Supabase CLI not found${NC}"
  echo "   Install: https://supabase.com/docs/guides/cli"
  exit 1
fi

# Check for required environment variables
REQUIRED_VARS=(
  "RESEND_API_KEY"
  "AFRICAS_TALKING_USERNAME"
  "AFRICAS_TALKING_API_KEY"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_VARS+=("$var")
  fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo -e "${RED}❌ Error: Missing required environment variables:${NC}"
  for var in "${MISSING_VARS[@]}"; do
    echo "  - $var"
  done
  echo ""
  echo "Set these in your .env file or export them:"
  echo "  export RESEND_API_KEY='your_resend_key'"
  echo "  export AFRICAS_TALKING_USERNAME='your_at_username'"
  echo "  export AFRICAS_TALKING_API_KEY='your_at_api_key'"
  exit 1
fi

echo -e "${YELLOW}Setting secrets...${NC}"
echo ""

# Set secrets for Edge Functions
supabase secrets set \
  RESEND_API_KEY="$RESEND_API_KEY" \
  AT_USERNAME="$AFRICAS_TALKING_USERNAME" \
  AT_API_KEY="$AFRICAS_TALKING_API_KEY" \
  AT_SENDER_ID="${AFRICAS_TALKING_SENDER_ID:-SENTINEL}" \
  TWILIO_ACCOUNT_SID="${TWILIO_ACCOUNT_SID:-}" \
  TWILIO_AUTH_TOKEN="${TWILIO_AUTH_TOKEN:-}" \
  TWILIO_PHONE_NUMBER="${TWILIO_PHONE_NUMBER:-}" \
  OCC_PORTAL_URL="${OCC_PORTAL_URL:-https://www.africarailways.com}"

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ All notification secrets are live.${NC}"
  echo ""
  echo "Secrets configured:"
  echo "  ✅ RESEND_API_KEY"
  echo "  ✅ AT_USERNAME (Africa's Talking)"
  echo "  ✅ AT_API_KEY (Africa's Talking)"
  echo "  ✅ AT_SENDER_ID"
  echo "  ✅ OCC_PORTAL_URL"
  
  if [ -n "$TWILIO_ACCOUNT_SID" ]; then
    echo "  ✅ TWILIO_ACCOUNT_SID (Fallback)"
    echo "  ✅ TWILIO_AUTH_TOKEN (Fallback)"
    echo "  ✅ TWILIO_PHONE_NUMBER (Fallback)"
  fi
  
  echo ""
  echo -e "${YELLOW}Next steps:${NC}"
  echo "  1. Deploy Edge Functions: supabase functions deploy"
  echo "  2. Test notifications: ./scripts/test_notifications.sh"
  echo "  3. Monitor logs: supabase functions logs"
else
  echo ""
  echo -e "${RED}❌ Failed to set secrets${NC}"
  exit 1
fi
