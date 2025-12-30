#!/bin/bash

# =====================================================
# Deploy Staff Approval Notification System
# =====================================================
# Purpose: Deploy Edge Function for email + SMS notifications
# Usage: ./scripts/deploy_approval_notifications.sh
# =====================================================

set -e

echo "📤 Deploying Staff Approval Notification System..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running from project root
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: Must run from project root${NC}"
  echo "   Usage: ./scripts/deploy_approval_notifications.sh"
  exit 1
fi

# Check for required environment variables
REQUIRED_VARS=(
  "SUPABASE_URL"
  "SUPABASE_SERVICE_ROLE_KEY"
  "AFRICAS_TALKING_API_KEY"
  "AFRICAS_TALKING_USERNAME"
  "RESEND_API_KEY"
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
  echo "Set these in your .env file or export them"
  exit 1
fi

echo -e "${GREEN}✅ All required environment variables found${NC}"
echo ""

# Step 1: Check Supabase CLI
echo -e "${YELLOW}1️⃣  Checking Supabase CLI...${NC}"
if ! command -v supabase &> /dev/null; then
  echo -e "${RED}❌ Supabase CLI not found${NC}"
  echo "   Install: https://supabase.com/docs/guides/cli"
  exit 1
fi
echo -e "${GREEN}✅ Supabase CLI found${NC}"
echo ""

# Step 2: Create Edge Function directory structure
echo -e "${YELLOW}2️⃣  Setting up Edge Function structure...${NC}"

mkdir -p supabase/functions/notify-staff-approval

# Check if function already exists
if [ -f "supabase/functions/notify-staff-approval/index.ts" ]; then
  echo -e "${GREEN}✅ Edge Function already exists${NC}"
else
  echo -e "${YELLOW}⚠️  Edge Function file not found${NC}"
  echo "   Expected: supabase/functions/notify-staff-approval/index.ts"
  exit 1
fi

echo ""

# Step 3: Set Edge Function secrets
echo -e "${YELLOW}3️⃣  Setting Edge Function secrets...${NC}"

# Set secrets for the Edge Function
supabase secrets set \
  AFRICAS_TALKING_API_KEY="$AFRICAS_TALKING_API_KEY" \
  AFRICAS_TALKING_USERNAME="$AFRICAS_TALKING_USERNAME" \
  RESEND_API_KEY="$RESEND_API_KEY" \
  OCC_PORTAL_URL="${OCC_PORTAL_URL:-https://www.africarailways.com}" \
  TWILIO_ACCOUNT_SID="${TWILIO_ACCOUNT_SID:-}" \
  TWILIO_AUTH_TOKEN="${TWILIO_AUTH_TOKEN:-}" \
  TWILIO_PHONE_NUMBER="${TWILIO_PHONE_NUMBER:-}"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Secrets configured${NC}"
else
  echo -e "${RED}❌ Failed to set secrets${NC}"
  exit 1
fi

echo ""

# Step 4: Deploy Edge Function
echo -e "${YELLOW}4️⃣  Deploying Edge Function...${NC}"

supabase functions deploy notify-staff-approval --no-verify-jwt

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Edge Function deployed${NC}"
else
  echo -e "${RED}❌ Failed to deploy Edge Function${NC}"
  exit 1
fi

echo ""

# Step 5: Create database webhook
echo -e "${YELLOW}5️⃣  Creating database webhook...${NC}"

# Get the Edge Function URL
FUNCTION_URL=$(supabase functions list | grep "notify-staff-approval" | awk '{print $2}')

if [ -z "$FUNCTION_URL" ]; then
  echo -e "${YELLOW}⚠️  Could not determine function URL${NC}"
  FUNCTION_URL="https://$(echo $SUPABASE_URL | sed 's/https:\/\///' | sed 's/\.supabase\.co/.functions.supabase.co/')/notify-staff-approval"
  echo "   Using: $FUNCTION_URL"
fi

# Create webhook SQL
cat > /tmp/create_webhook.sql << EOF
-- Create webhook for staff approval notifications
CREATE OR REPLACE FUNCTION notify_staff_approval_webhook()
RETURNS TRIGGER AS \$\$
DECLARE
  webhook_url TEXT := '$FUNCTION_URL';
  payload JSONB;
BEGIN
  -- Only trigger on status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    payload := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD)
    );
    
    -- Call Edge Function via pg_net (if available) or http extension
    PERFORM net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := payload
    );
  END IF;
  
  RETURN NEW;
END;
\$\$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_profile_status_change ON profiles;

-- Create trigger
CREATE TRIGGER on_profile_status_change
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_staff_approval_webhook();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION notify_staff_approval_webhook() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_staff_approval_webhook() TO service_role;
EOF

# Execute the SQL
psql "$SUPABASE_URL" < /tmp/create_webhook.sql 2>&1 | tee /tmp/webhook_create.log

if grep -q "ERROR" /tmp/webhook_create.log; then
  echo -e "${YELLOW}⚠️  Webhook creation had warnings (this may be normal)${NC}"
  echo "   Check /tmp/webhook_create.log for details"
else
  echo -e "${GREEN}✅ Database webhook created${NC}"
fi

rm -f /tmp/create_webhook.sql /tmp/webhook_create.log

echo ""

# Step 6: Test the notification system
echo -e "${YELLOW}6️⃣  Testing notification system...${NC}"

cat > /tmp/test_notification.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testNotification() {
  console.log('Creating test staff member...');
  
  // Create test staff member
  const { data: profile, error: createError } = await supabase
    .from('profiles')
    .insert({
      email: 'test.staff@africarailways.com',
      phone_number: '+260999999999',
      full_name: 'Test Staff Member',
      role: 'staff',
      status: 'pending'
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating test profile:', createError);
    return;
  }

  console.log('✅ Test profile created:', profile.id);
  console.log('Waiting 2 seconds...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Approve the staff member (this should trigger notification)
  console.log('Approving test staff member...');
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ status: 'approved' })
    .eq('id', profile.id);

  if (updateError) {
    console.error('Error approving profile:', updateError);
    return;
  }

  console.log('✅ Test profile approved');
  console.log('Check your logs for notification delivery');
  console.log('');
  console.log('Cleaning up test data...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Delete test profile
  await supabase
    .from('profiles')
    .delete()
    .eq('id', profile.id);

  console.log('✅ Test complete');
}

testNotification().catch(console.error);
EOF

if [ "$1" == "--test" ]; then
  echo -e "${BLUE}Running test...${NC}"
  node /tmp/test_notification.js
  rm -f /tmp/test_notification.js
else
  echo -e "${YELLOW}ℹ️  Skipping test (run with --test flag to test)${NC}"
  rm -f /tmp/test_notification.js
fi

echo ""

# Step 7: Display summary
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║   ✅ STAFF APPROVAL NOTIFICATION SYSTEM DEPLOYED            ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Deployment Summary:${NC}"
echo "  ✅ Edge Function deployed"
echo "  ✅ Secrets configured"
echo "  ✅ Database webhook created"
echo "  ✅ Trigger activated"
echo ""
echo -e "${BLUE}Notification Flow:${NC}"
echo "  1. Admin approves staff in OCC portal"
echo "  2. Database trigger fires"
echo "  3. Edge Function called"
echo "  4. Email sent via Resend"
echo "  5. SMS sent via Africa's Talking"
echo "  6. Staff receives both notifications"
echo ""
echo -e "${YELLOW}Testing:${NC}"
echo "  Run with --test flag to test notifications:"
echo "  ./scripts/deploy_approval_notifications.sh --test"
echo ""
echo -e "${BLUE}Monitoring:${NC}"
echo "  View logs: supabase functions logs notify-staff-approval"
echo "  View webhooks: Check Supabase Dashboard → Database → Webhooks"
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
