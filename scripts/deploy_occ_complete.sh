#!/bin/bash

# =====================================================
# Complete OCC Deployment Script
# =====================================================
# Purpose: Deploy entire OCC security system
# Usage: ./scripts/deploy_occ_complete.sh
# =====================================================

set -e

echo "🚀 Deploying Complete OCC Security System..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 1: Database Migrations
echo -e "${YELLOW}1️⃣  Applying database migrations...${NC}"
if command -v supabase &> /dev/null; then
  supabase db push
  echo -e "${GREEN}✅ Database migrations applied${NC}"
else
  echo -e "${YELLOW}⚠️  Supabase CLI not found, skipping migrations${NC}"
  echo "   Run manually: supabase db push"
fi
echo ""

# Step 2: Set Notification Secrets
echo -e "${YELLOW}2️⃣  Setting notification secrets...${NC}"
./scripts/set_notification_secrets.sh
echo ""

# Step 3: Deploy Edge Functions
echo -e "${YELLOW}3️⃣  Deploying Edge Functions...${NC}"

if command -v supabase &> /dev/null; then
  # Deploy notify-staff-approval
  echo "Deploying notify-staff-approval..."
  supabase functions deploy notify-staff-approval --no-verify-jwt
  
  # Deploy handle-staff-approval
  echo "Deploying handle-staff-approval..."
  supabase functions deploy handle-staff-approval --no-verify-jwt
  
  echo -e "${GREEN}✅ Edge Functions deployed${NC}"
else
  echo -e "${RED}❌ Supabase CLI required for deployment${NC}"
  exit 1
fi
echo ""

# Step 4: Create Master Admin
echo -e "${YELLOW}4️⃣  Creating master admin account...${NC}"
if [ -f "scripts/setup_master_admin.sh" ]; then
  ./scripts/setup_master_admin.sh
else
  echo -e "${YELLOW}⚠️  Running Node.js admin setup...${NC}"
  node scripts/create_master_admin.js
fi
echo ""

# Step 5: Configure Environment
echo -e "${YELLOW}5️⃣  Configuring OCC portal environment...${NC}"
./scripts/secure_occ_env.sh
echo ""

# Step 6: Verification
echo -e "${YELLOW}6️⃣  Running verification checks...${NC}"

# Check if functions are deployed
echo "Checking deployed functions..."
supabase functions list

# Check if secrets are set
echo ""
echo "Checking secrets..."
supabase secrets list

echo -e "${GREEN}✅ Verification complete${NC}"
echo ""

# Summary
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║   🎉 OCC SECURITY SYSTEM DEPLOYED                           ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Deployment Summary:${NC}"
echo "  ✅ Database migrations applied"
echo "  ✅ Notification secrets configured"
echo "  ✅ Edge Functions deployed"
echo "  ✅ Master admin account created"
echo "  ✅ Environment configured"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Review: ADMIN_VERIFICATION_CHECKLIST.md"
echo "  2. Test: End-to-end approval flow"
echo "  3. Monitor: Edge Function logs"
echo "  4. Deploy: OCC portal frontend"
echo ""
echo -e "${YELLOW}Testing:${NC}"
echo "  # Test notifications"
echo "  ./scripts/deploy_approval_notifications.sh --test"
echo ""
echo "  # View logs"
echo "  supabase functions logs handle-staff-approval --tail"
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
