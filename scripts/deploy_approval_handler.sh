#!/bin/bash
# Filename: scripts/deploy_approval_handler.sh
# Purpose: Deploy staff approval notification handler (Email + SMS)

set -e

echo "🚀 Deploying Staff Approval Handler..."
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

# Create new function if it doesn't exist
if [ ! -d "supabase/functions/notify-staff-approval" ]; then
  echo -e "${YELLOW}Creating new Edge Function...${NC}"
  supabase functions new notify-staff-approval
  echo -e "${GREEN}✅ Function created${NC}"
else
  echo -e "${GREEN}✅ Function already exists${NC}"
fi

echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Ensure supabase/functions/notify-staff-approval/index.ts is updated"
echo "  2. Run: ./scripts/deploy_approval_notifications.sh"
echo "  3. Test with: ./scripts/deploy_approval_notifications.sh --test"
echo ""
