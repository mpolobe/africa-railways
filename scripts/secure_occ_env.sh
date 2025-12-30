#!/bin/bash

# =====================================================
# OCC Environment Security Hardening Script
# =====================================================
# Purpose: Configure secure environment variables for OCC portal
# Usage: ./scripts/secure_occ_env.sh
# =====================================================

set -e

echo "🔒 Hardening OCC Environment Security..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running from project root
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: Must run from project root${NC}"
  echo "   Usage: ./scripts/secure_occ_env.sh"
  exit 1
fi

# Create apps/occ-portal directory if it doesn't exist
if [ ! -d "apps/occ-portal" ]; then
  echo -e "${YELLOW}⚠️  Creating apps/occ-portal directory...${NC}"
  mkdir -p apps/occ-portal
fi

# Create .env.production file
ENV_FILE="apps/occ-portal/.env.production"

echo -e "${GREEN}📝 Creating ${ENV_FILE}...${NC}"

cat > "$ENV_FILE" << 'EOF'
# =====================================================
# OCC Portal - Production Environment Variables
# =====================================================
# SECURITY: Never commit this file to version control
# =====================================================

# =====================================================
# Alchemy Account Kit
# =====================================================
VITE_ALCHEMY_API_KEY=your_alchemy_api_key_here
VITE_ALCHEMY_GAS_MANAGER_POLICY_ID=your_gas_policy_id_here
VITE_ALCHEMY_CHAIN=polygon-amoy
# Options: polygon-amoy (testnet), polygon (mainnet)

# =====================================================
# OTP Providers (SMS Authentication)
# =====================================================
# Primary: Africa's Talking
VITE_AFRICAS_TALKING_API_KEY=your_africas_talking_api_key
VITE_AFRICAS_TALKING_USERNAME=your_africas_talking_username

# Fallback: Twilio
VITE_TWILIO_ACCOUNT_SID=your_twilio_account_sid
VITE_TWILIO_AUTH_TOKEN=your_twilio_auth_token
VITE_TWILIO_PHONE_NUMBER=your_twilio_phone_number

# =====================================================
# Supabase (Database & Auth)
# =====================================================
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# =====================================================
# Email Providers (Admin Notifications)
# =====================================================
# Option 1: Resend (Recommended)
RESEND_API_KEY=your_resend_api_key

# Option 2: SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key

# =====================================================
# OCC Security Settings
# =====================================================
OCC_RESTRICTED_ACCESS=true
STAFF_WHITELIST_ONLY=true
REQUIRE_LOCATION_VERIFICATION=true
MAX_LOGIN_ATTEMPTS=3
SESSION_TIMEOUT_MINUTES=30

# =====================================================
# Portal Configuration
# =====================================================
OCC_PORTAL_URL=https://www.africarailways.com
VITE_API_BASE_URL=https://api.africarailways.com
VITE_WS_URL=wss://api.africarailways.com

# =====================================================
# Monitoring & Analytics
# =====================================================
VITE_SENTRY_DSN=your_sentry_dsn
VITE_GOOGLE_ANALYTICS_ID=your_ga_id

# =====================================================
# Feature Flags
# =====================================================
ENABLE_VERTEX_AI_MONITORING=true
ENABLE_HARDWARE_PASSKEY=false
ENABLE_BIOMETRIC_AUTH=false

# =====================================================
# Railway Specific
# =====================================================
TAZARA_CORRIDOR_ENABLED=true
ZRL_CORRIDOR_ENABLED=true
DEFAULT_TIMEZONE=Africa/Lusaka
EOF

echo -e "${GREEN}✅ Environment file created${NC}"
echo ""

# Create .env.example for reference
ENV_EXAMPLE="apps/occ-portal/.env.example"
echo -e "${GREEN}📝 Creating ${ENV_EXAMPLE}...${NC}"

cp "$ENV_FILE" "$ENV_EXAMPLE"

# Replace actual values with placeholders in example
sed -i 's/=your_/=YOUR_/g' "$ENV_EXAMPLE" 2>/dev/null || sed -i '' 's/=your_/=YOUR_/g' "$ENV_EXAMPLE"

echo -e "${GREEN}✅ Example environment file created${NC}"
echo ""

# Update .gitignore
GITIGNORE=".gitignore"
echo -e "${GREEN}📝 Updating .gitignore...${NC}"

if ! grep -q "apps/occ-portal/.env.production" "$GITIGNORE" 2>/dev/null; then
  cat >> "$GITIGNORE" << 'EOF'

# OCC Portal Environment Files
apps/occ-portal/.env.production
apps/occ-portal/.env.local
apps/occ-portal/.env.*.local
EOF
  echo -e "${GREEN}✅ .gitignore updated${NC}"
else
  echo -e "${YELLOW}ℹ️  .gitignore already configured${NC}"
fi

echo ""

# Create setup instructions
SETUP_INSTRUCTIONS="apps/occ-portal/SETUP_INSTRUCTIONS.md"
echo -e "${GREEN}📝 Creating setup instructions...${NC}"

cat > "$SETUP_INSTRUCTIONS" << 'EOF'
# OCC Portal Setup Instructions

## 1. Configure Environment Variables

Edit `apps/occ-portal/.env.production` and replace all placeholder values:

### Alchemy Account Kit
1. Go to: https://dashboard.alchemy.com/
2. Create new app: "Africa Railways OCC"
3. Enable Account Kit
4. Copy API key → `VITE_ALCHEMY_API_KEY`
5. Create Gas Manager policy
6. Copy Policy ID → `VITE_ALCHEMY_GAS_MANAGER_POLICY_ID`

### OTP Providers
1. **Africa's Talking**: https://account.africastalking.com/
   - Get API key and username
2. **Twilio**: https://console.twilio.com/
   - Get Account SID, Auth Token, and Phone Number

### Supabase
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Settings → API
4. Copy Project URL and anon key

### Email Provider
Choose one:
- **Resend**: https://resend.com/api-keys
- **SendGrid**: https://app.sendgrid.com/settings/api_keys

## 2. Run Database Migrations

```bash
# Apply OCC security schema
supabase db push

# Or manually run:
psql $DATABASE_URL < supabase/migrations/001_occ_security_schema.sql
```

## 3. Create Master Admin

```bash
# Set environment variables
export SUPABASE_URL="your_supabase_url"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# Run setup script
node scripts/create_master_admin.js
```

## 4. Install Dependencies

```bash
cd apps/occ-portal
npm install
```

## 5. Test Locally

```bash
npm run dev
```

Visit: http://localhost:5173

## 6. Deploy to Production

```bash
npm run build
# Deploy dist/ folder to your hosting provider
```

## Security Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Master admin account created
- [ ] .env.production NOT committed to git
- [ ] SSL/TLS enabled on production domain
- [ ] Alchemy Gas Manager configured
- [ ] OTP providers tested
- [ ] RLS policies verified
- [ ] Audit logging enabled

## Support

- Alchemy: https://docs.alchemy.com/docs/account-kit-overview
- Supabase: https://supabase.com/docs
- OTP Service: See SmartphoneApp/lib/otpService.ts
EOF

echo -e "${GREEN}✅ Setup instructions created${NC}"
echo ""

# Summary
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║   ✅  OCC Environment Security Hardened                     ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Files Created:${NC}"
echo "  ✅ apps/occ-portal/.env.production"
echo "  ✅ apps/occ-portal/.env.example"
echo "  ✅ apps/occ-portal/SETUP_INSTRUCTIONS.md"
echo "  ✅ .gitignore updated"
echo ""
echo -e "${YELLOW}⚠️  NEXT STEPS:${NC}"
echo "  1. Edit apps/occ-portal/.env.production with actual values"
echo "  2. Run database migrations: supabase db push"
echo "  3. Create master admin: node scripts/create_master_admin.js"
echo "  4. Review: apps/occ-portal/SETUP_INSTRUCTIONS.md"
echo ""
echo -e "${RED}🔒 SECURITY REMINDER:${NC}"
echo "  • Never commit .env.production to git"
echo "  • Store credentials in secure password manager"
echo "  • Rotate API keys every 90 days"
echo "  • Enable 2FA on all admin accounts"
echo ""
