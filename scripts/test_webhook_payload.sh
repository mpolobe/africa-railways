#!/bin/bash
# Filename: scripts/test_webhook_payload.sh
# Purpose: Test Edge Function with webhook mock payload

set -e

echo "🧪 Testing Edge Function with Webhook Mock Payload..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
LOCAL_URL="http://localhost:54321/functions/v1/handle-staff-approval"
PROD_URL="${SUPABASE_URL}/functions/v1/handle-staff-approval"
TEST_EMAIL="test-staff@africarailways.com"
TEST_PHONE="+260970000000"
TEST_NAME="Test Staff Member"

# Check if testing locally or production
if [ "$1" == "--prod" ]; then
  FUNCTION_URL="$PROD_URL"
  echo -e "${YELLOW}Testing PRODUCTION Edge Function${NC}"
  echo "URL: $FUNCTION_URL"
  
  if [ -z "$SUPABASE_URL" ]; then
    echo -e "${RED}❌ SUPABASE_URL not set${NC}"
    exit 1
  fi
else
  FUNCTION_URL="$LOCAL_URL"
  echo -e "${BLUE}Testing LOCAL Edge Function${NC}"
  echo "URL: $FUNCTION_URL"
  echo ""
  echo -e "${YELLOW}⚠️  Make sure Supabase is running locally:${NC}"
  echo "   supabase start"
  echo ""
fi

echo ""
echo "Test Payload:"
echo "  Email: $TEST_EMAIL"
echo "  Phone: $TEST_PHONE"
echo "  Name:  $TEST_NAME"
echo "  Status: approved"
echo ""

# Create test payload
PAYLOAD=$(cat <<EOF
{
  "staff_email": "$TEST_EMAIL",
  "staff_phone": "$TEST_PHONE",
  "staff_name": "$TEST_NAME",
  "status": "approved"
}
EOF
)

echo -e "${YELLOW}Sending request...${NC}"
echo ""

# Send request
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY:-anon-key}" \
  -d "$PAYLOAD")

# Parse response
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""
echo "HTTP Status: $HTTP_CODE"
echo ""

# Check result
if [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✅ Test successful!${NC}"
  echo ""
  echo "Expected outcomes:"
  echo "  📧 Email sent to: $TEST_EMAIL"
  echo "  📱 SMS sent to: $TEST_PHONE"
  echo ""
  echo "Verify:"
  echo "  1. Check email inbox for approval message"
  echo "  2. Check phone for SMS notification"
  echo "  3. Review Edge Function logs:"
  echo "     supabase functions logs handle-staff-approval --tail"
else
  echo -e "${RED}❌ Test failed with HTTP $HTTP_CODE${NC}"
  echo ""
  echo "Troubleshooting:"
  echo "  1. Check Edge Function is deployed"
  echo "  2. Verify secrets are set (RESEND_API_KEY, AT_USERNAME, AT_API_KEY)"
  echo "  3. Review function logs for errors"
  echo "  4. Ensure phone number is in E.164 format (+country_code)"
fi

echo ""
