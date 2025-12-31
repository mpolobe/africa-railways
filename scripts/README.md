# Sentinel Subscription Scripts

## Available Scripts

### 1. `setup_subscription_api.sh`
**Purpose:** Automated setup for subscription system

**What it does:**
- Creates/updates `.env` with all required variables
- Generates database schema files
- Creates API documentation
- Sets up test scripts

**Usage:**
```bash
./scripts/setup_subscription_api.sh
```

**Output:**
- Updated `.env` file
- `backend/migrations/001_subscription_schema.sql`
- `docs/SUBSCRIPTION_API.md`
- `scripts/test_subscription.sh`

---

### 2. `check_webhook_readiness.sh` ⭐
**Purpose:** Comprehensive pre-deployment validation

**What it checks:**
1. ✅ Environment variables (payment keys, database, SMS)
2. ✅ Node.js and npm installation
3. ✅ Database connection and tables
4. ✅ File structure completeness
5. ✅ Network and port availability
6. ✅ Payment gateway configuration
7. ✅ Security settings
8. ✅ Code syntax validation

**Usage:**
```bash
./scripts/check_webhook_readiness.sh
```

**Example Output:**
```
╔═══════════════════════════════════════════════════════╗
║   🚂 SENTINEL WEBHOOK READINESS CHECK                ║
╚═══════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1️⃣  ENVIRONMENT VARIABLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PASS - Payment secret hash configured
✅ PASS - Flutterwave public key configured
✅ PASS - Database URL configured
✅ PASS - Africa's Talking SMS configured

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2️⃣  NODE.JS & DEPENDENCIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PASS - Node.js installed (v20.11.0)
✅ PASS - npm installed (10.2.4)
✅ PASS - Dependencies installed

📊 SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Passed:   25
⚠️  Warnings: 2
❌ Errors:   0

╔═══════════════════════════════════════════════════════╗
║   🎉 ALL CHECKS PASSED - READY TO DEPLOY!            ║
╚═══════════════════════════════════════════════════════╝
```

**Exit Codes:**
- `0` - All checks passed (ready to deploy)
- `1` - Errors found (fix before deploying)

---

### 3. `test_subscription.sh`
**Purpose:** Test subscription API endpoints

**Usage:**
```bash
# Set API URL and token
export API_BASE_URL=http://localhost:3000
export TEST_JWT_TOKEN=your_test_token

# Run tests
./scripts/test_subscription.sh
```

**Tests:**
- Get available plans
- Initiate subscription payment
- Check payment status

---

## Quick Start Workflow

### First Time Setup
```bash
# 1. Run setup script
./scripts/setup_subscription_api.sh

# 2. Update .env with your actual keys
nano .env

# 3. Check readiness
./scripts/check_webhook_readiness.sh

# 4. If all checks pass, deploy!
cd server
npm install
railway up
```

### Before Each Deployment
```bash
# Always run readiness check
./scripts/check_webhook_readiness.sh

# If errors found, fix them
# If warnings only, you can proceed with caution
```

### After Deployment
```bash
# Test the webhook
cd server
npm test

# Or test API endpoints
./scripts/test_subscription.sh
```

---

## Common Issues & Fixes

### ❌ "PAYMENT_SECRET_HASH not set"
```bash
export PAYMENT_SECRET_HASH='your_flutterwave_secret_hash'
# Or add to .env:
echo "PAYMENT_SECRET_HASH=your_hash" >> .env
```

### ❌ "Node.js not installed"
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm

# Verify
node -v
npm -v
```

### ❌ "Cannot connect to database"
```bash
# Check DATABASE_URL format
export DATABASE_URL='postgresql://user:password@host:5432/dbname'

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

### ⚠️ "Dependencies not installed"
```bash
cd server
npm install
```

### ⚠️ "Sentinel plans not found"
```bash
# Run migrations
psql $DATABASE_URL -f backend/migrations/001_subscription_schema.sql
psql $DATABASE_URL -f backend/migrations/002_sentinel_plans.sql
```

---

## Environment Variables Reference

### Required
```bash
# Payment Gateway
PAYMENT_SECRET_HASH=your_flutterwave_secret_hash
FLW_PUBLIC_KEY=FLWPUBK-xxxxx
FLW_SECRET_KEY=FLWSECK-xxxxx

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# SMS (choose one)
VITE_AFRICAS_TALKING_API_KEY=your_key
VITE_AFRICAS_TALKING_USERNAME=your_username
# OR
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
```

### Optional
```bash
# Server
PORT=3000
NODE_ENV=development

# Webhook
WEBHOOK_BASE_URL=https://your-app.railway.app

# MTN MoMo Direct
MTN_MOMO_API_KEY=your_key

# Airtel Money Direct
AIRTEL_CLIENT_SECRET=your_secret
```

---

## Script Maintenance

### Adding New Checks
Edit `check_webhook_readiness.sh` and add to appropriate section:

```bash
# Example: Check for new environment variable
if [ -z "$NEW_VARIABLE" ]; then
    print_status "warn" "NEW_VARIABLE not set"
else
    print_status "pass" "NEW_VARIABLE configured"
fi
```

### Updating Setup Script
Edit `setup_subscription_api.sh` to add new configuration:

```bash
add_or_update_env "NEW_VARIABLE" "default_value"
```

---

## Support

For issues with scripts:
1. Check script output for specific error messages
2. Review this README for common fixes
3. Check main documentation: `/docs/SUBSCRIPTION_DEPLOYMENT_GUIDE.md`
4. Verify environment variables are set correctly

---

**Last Updated:** 2025-12-31
**Version:** 1.0.0
