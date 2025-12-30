#!/bin/bash

# =====================================================
# Setup Master Administrator Account
# =====================================================
# Purpose: Create master admin account with automated email
# Usage: ./scripts/setup_master_admin.sh
# =====================================================

set -e

echo "🔐 Setting up Master Administrator Account..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ADMIN_EMAIL="admin@africarailways.com"
ADMIN_PASSWORD="SentinelAdmin2026!"
ADMIN_PHONE="+260000000000"  # Replace with actual phone
ADMIN_NAME="Master Administrator"

# Check if running from project root
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: Must run from project root${NC}"
  echo "   Usage: ./scripts/setup_master_admin.sh"
  exit 1
fi

# Check for required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${RED}❌ Error: Missing required environment variables${NC}"
  echo ""
  echo "Required variables:"
  echo "  - SUPABASE_URL"
  echo "  - SUPABASE_SERVICE_ROLE_KEY"
  echo ""
  echo "Set these in your .env file or export them:"
  echo "  export SUPABASE_URL='your_supabase_url'"
  echo "  export SUPABASE_SERVICE_ROLE_KEY='your_service_role_key'"
  exit 1
fi

echo -e "${BLUE}📋 Configuration:${NC}"
echo "  Email: $ADMIN_EMAIL"
echo "  Phone: $ADMIN_PHONE"
echo "  Name:  $ADMIN_NAME"
echo ""

# Step 1: Check if Supabase CLI is installed
echo -e "${YELLOW}1️⃣  Checking Supabase CLI...${NC}"
if ! command -v supabase &> /dev/null; then
  echo -e "${YELLOW}⚠️  Supabase CLI not found. Installing...${NC}"
  
  # Install Supabase CLI
  if [[ "$OSTYPE" == "darwin"* ]]; then
    brew install supabase/tap/supabase
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xz
    sudo mv supabase /usr/local/bin/
  else
    echo -e "${RED}❌ Unsupported OS. Please install Supabase CLI manually:${NC}"
    echo "   https://supabase.com/docs/guides/cli"
    exit 1
  fi
  
  echo -e "${GREEN}✅ Supabase CLI installed${NC}"
else
  echo -e "${GREEN}✅ Supabase CLI found${NC}"
fi

echo ""

# Step 2: Create admin user via Supabase CLI
echo -e "${YELLOW}2️⃣  Creating admin user in Supabase Auth...${NC}"

# Use Supabase CLI to create user
supabase auth admin create-user \
  --email "$ADMIN_EMAIL" \
  --password "$ADMIN_PASSWORD" \
  --data "{\"role\": \"admin\", \"full_name\": \"$ADMIN_NAME\", \"phone_number\": \"$ADMIN_PHONE\"}" \
  --confirm 2>&1 | tee /tmp/supabase_admin_create.log

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Admin user created in Supabase Auth${NC}"
else
  # Check if user already exists
  if grep -q "already registered" /tmp/supabase_admin_create.log; then
    echo -e "${YELLOW}ℹ️  User already exists, continuing...${NC}"
  else
    echo -e "${RED}❌ Failed to create admin user${NC}"
    cat /tmp/supabase_admin_create.log
    exit 1
  fi
fi

echo ""

# Step 3: Update profile in database
echo -e "${YELLOW}3️⃣  Updating admin profile in database...${NC}"

# Run the Node.js script to update profile
node scripts/create_master_admin.js

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Admin profile updated${NC}"
else
  echo -e "${RED}❌ Failed to update admin profile${NC}"
  exit 1
fi

echo ""

# Step 4: Send welcome email via Resend
echo -e "${YELLOW}4️⃣  Sending welcome email...${NC}"

if [ -z "$RESEND_API_KEY" ]; then
  echo -e "${YELLOW}⚠️  RESEND_API_KEY not set, skipping email${NC}"
  echo "   Set RESEND_API_KEY to enable automated emails"
else
  # Send email using Resend API
  RESPONSE=$(curl -s -X POST "https://api.resend.com/emails" \
    -H "Authorization: Bearer $RESEND_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"from\": \"Africa Railways <noreply@africarailways.com>\",
      \"to\": [\"$ADMIN_EMAIL\"],
      \"subject\": \"Welcome to Africa Railways OCC - Your Admin Account\",
      \"html\": \"$(cat supabase/email-templates/welcome-admin.html | sed "s/{{ .Email }}/$ADMIN_EMAIL/g" | sed "s/{{ .Password }}/$ADMIN_PASSWORD/g" | sed "s|{{ .SiteURL }}|https://www.africarailways.com|g" | sed "s|{{ .ConfirmationURL }}|https://www.africarailways.com/occ|g" | jq -Rs .)\"
    }")

  if echo "$RESPONSE" | grep -q '"id"'; then
    echo -e "${GREEN}✅ Welcome email sent${NC}"
    EMAIL_ID=$(echo "$RESPONSE" | jq -r '.id')
    echo "   Email ID: $EMAIL_ID"
  else
    echo -e "${YELLOW}⚠️  Failed to send email${NC}"
    echo "   Response: $RESPONSE"
  fi
fi

echo ""

# Step 5: Display summary
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║   🎉 MASTER ADMINISTRATOR ACCOUNT CREATED                   ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Admin Credentials:${NC}"
echo "  📧 Email:    $ADMIN_EMAIL"
echo "  🔑 Password: $ADMIN_PASSWORD"
echo "  📱 Phone:    $ADMIN_PHONE"
echo ""
echo -e "${BLUE}Portal Access:${NC}"
echo "  🌐 URL: https://www.africarailways.com/occ"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT SECURITY STEPS:${NC}"
echo "  1. Change password on first login"
echo "  2. Update ADMIN_PHONE with actual number"
echo "  3. Enable Two-Factor Authentication"
echo "  4. Store credentials in password manager"
echo "  5. Never share admin credentials"
echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""

# Cleanup
rm -f /tmp/supabase_admin_create.log
