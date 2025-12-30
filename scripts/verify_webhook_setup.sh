#!/bin/bash
# Filename: scripts/verify_webhook_setup.sh
# Purpose: Verify complete webhook setup

set -e

echo "🔍 Verifying Webhook Setup..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

CHECKS_PASSED=0
CHECKS_FAILED=0

# Function to check and report
check_item() {
  local description=$1
  local command=$2
  
  echo -n "Checking: $description... "
  
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC}"
    ((CHECKS_PASSED++))
    return 0
  else
    echo -e "${RED}❌${NC}"
    ((CHECKS_FAILED++))
    return 1
  fi
}

echo -e "${BLUE}Environment Variables:${NC}"
check_item "SUPABASE_URL" "[ -n \"\$SUPABASE_URL\" ]"
check_item "SUPABASE_SERVICE_ROLE_KEY" "[ -n \"\$SUPABASE_SERVICE_ROLE_KEY\" ]"
check_item "RESEND_API_KEY" "[ -n \"\$RESEND_API_KEY\" ]"
check_item "AFRICAS_TALKING_USERNAME" "[ -n \"\$AFRICAS_TALKING_USERNAME\" ]"
check_item "AFRICAS_TALKING_API_KEY" "[ -n \"\$AFRICAS_TALKING_API_KEY\" ]"
echo ""

echo -e "${BLUE}Supabase CLI:${NC}"
check_item "Supabase CLI installed" "command -v supabase"
echo ""

echo -e "${BLUE}Database Setup:${NC}"
if [ -n "$SUPABASE_URL" ]; then
  # Check if migration files exist
  check_item "Migration 001 exists" "[ -f supabase/migrations/001_occ_security_schema.sql ]"
  check_item "Migration 002 exists" "[ -f supabase/migrations/002_approval_webhook.sql ]"
  
  # Check if Edge Function exists
  check_item "Edge Function exists" "[ -f supabase/functions/handle-staff-approval/index.ts ]"
else
  echo -e "${YELLOW}⚠️  Skipping database checks (SUPABASE_URL not set)${NC}"
fi
echo ""

echo -e "${BLUE}Deployment Scripts:${NC}"
check_item "configure_webhook.sh" "[ -f scripts/configure_webhook.sh ]"
check_item "test_webhook_payload.sh" "[ -f scripts/test_webhook_payload.sh ]"
check_item "set_notification_secrets.sh" "[ -f scripts/set_notification_secrets.sh ]"
check_item "deploy_occ_complete.sh" "[ -f scripts/deploy_occ_complete.sh ]"
echo ""

# Summary
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║   VERIFICATION SUMMARY                                       ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "Checks Passed: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Checks Failed: ${RED}$CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed!${NC}"
  echo ""
  echo -e "${BLUE}Ready to deploy:${NC}"
  echo "  1. Configure webhook: ./scripts/configure_webhook.sh"
  echo "  2. Set secrets: ./scripts/set_notification_secrets.sh"
  echo "  3. Deploy function: supabase functions deploy handle-staff-approval"
  echo "  4. Test webhook: ./scripts/test_webhook_payload.sh"
  echo ""
else
  echo -e "${YELLOW}⚠️  Some checks failed. Review the items above.${NC}"
  echo ""
  echo "Common fixes:"
  echo "  • Set missing environment variables in .env"
  echo "  • Install Supabase CLI: https://supabase.com/docs/guides/cli"
  echo "  • Run migrations: supabase db push"
  echo ""
fi
