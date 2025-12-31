#!/bin/bash
# Filename: scripts/check_webhook_readiness.sh
# 
# Comprehensive webhook readiness checker for Sentinel subscription system
# Validates environment, dependencies, database, and payment gateway configuration

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
ERRORS=0
WARNINGS=0
PASSED=0

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║   🚂 SENTINEL WEBHOOK READINESS CHECK                ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Function to print status
print_status() {
    local status=$1
    local message=$2
    
    if [ "$status" = "pass" ]; then
        echo -e "${GREEN}✅ PASS${NC} - $message"
        ((PASSED++))
    elif [ "$status" = "fail" ]; then
        echo -e "${RED}❌ FAIL${NC} - $message"
        ((ERRORS++))
    elif [ "$status" = "warn" ]; then
        echo -e "${YELLOW}⚠️  WARN${NC} - $message"
        ((WARNINGS++))
    elif [ "$status" = "info" ]; then
        echo -e "${BLUE}ℹ️  INFO${NC} - $message"
    fi
}

# 1. Check Environment Variables
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  ENVIRONMENT VARIABLES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Payment Gateway
if [ -z "$PAYMENT_SECRET_HASH" ] && [ -z "$FLW_SECRET_HASH" ]; then
    print_status "fail" "PAYMENT_SECRET_HASH or FLW_SECRET_HASH not set"
    echo "   Fix: export PAYMENT_SECRET_HASH='your_flutterwave_secret_hash'"
else
    print_status "pass" "Payment secret hash configured"
fi

if [ -z "$FLW_PUBLIC_KEY" ]; then
    print_status "warn" "FLW_PUBLIC_KEY not set (required for Flutterwave)"
    echo "   Fix: export FLW_PUBLIC_KEY='FLWPUBK-xxxxx'"
else
    print_status "pass" "Flutterwave public key configured"
fi

if [ -z "$FLW_SECRET_KEY" ]; then
    print_status "warn" "FLW_SECRET_KEY not set (required for Flutterwave)"
    echo "   Fix: export FLW_SECRET_KEY='FLWSECK-xxxxx'"
else
    print_status "pass" "Flutterwave secret key configured"
fi

# Database
if [ -z "$DATABASE_URL" ]; then
    print_status "fail" "DATABASE_URL not set"
    echo "   Fix: export DATABASE_URL='postgresql://user:pass@host:5432/dbname'"
else
    print_status "pass" "Database URL configured"
fi

# SMS Provider
if [ -z "$VITE_AFRICAS_TALKING_API_KEY" ] && [ -z "$AT_API_KEY" ] && [ -z "$TWILIO_ACCOUNT_SID" ]; then
    print_status "warn" "No SMS provider configured (Africa's Talking or Twilio)"
    echo "   Fix: export VITE_AFRICAS_TALKING_API_KEY='your_key'"
else
    if [ -n "$VITE_AFRICAS_TALKING_API_KEY" ] || [ -n "$AT_API_KEY" ]; then
        print_status "pass" "Africa's Talking SMS configured"
    fi
    if [ -n "$TWILIO_ACCOUNT_SID" ]; then
        print_status "pass" "Twilio SMS configured"
    fi
fi

echo ""

# 2. Check Node.js and Dependencies
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  NODE.JS & DEPENDENCIES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_status "pass" "Node.js installed ($NODE_VERSION)"
    
    # Check version (need >= 18)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -ge 18 ]; then
        print_status "pass" "Node.js version is compatible (>= 18)"
    else
        print_status "warn" "Node.js version is old (< 18). Upgrade recommended."
    fi
else
    print_status "fail" "Node.js not installed"
    echo "   Fix: sudo apt install nodejs npm"
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    print_status "pass" "npm installed ($NPM_VERSION)"
else
    print_status "fail" "npm not installed"
    echo "   Fix: sudo apt install npm"
fi

# Check if server directory exists
if [ -d "server" ]; then
    print_status "pass" "Server directory exists"
    
    # Check if package.json exists
    if [ -f "server/package.json" ]; then
        print_status "pass" "package.json found"
        
        # Check if node_modules exists
        if [ -d "server/node_modules" ]; then
            print_status "pass" "Dependencies installed (node_modules exists)"
        else
            print_status "warn" "Dependencies not installed"
            echo "   Fix: cd server && npm install"
        fi
    else
        print_status "fail" "package.json not found in server/"
    fi
    
    # Check if webhook.js exists
    if [ -f "server/webhook.js" ]; then
        print_status "pass" "webhook.js found"
    else
        print_status "fail" "webhook.js not found in server/"
    fi
else
    print_status "fail" "Server directory not found"
fi

echo ""

# 3. Check Database Connection
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  DATABASE CONNECTION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -n "$DATABASE_URL" ]; then
    # Check if psql is available
    if command -v psql &> /dev/null; then
        print_status "pass" "PostgreSQL client (psql) installed"
        
        # Try to connect
        if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
            print_status "pass" "Database connection successful"
            
            # Check if tables exist
            TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('subscription_plans', 'subscriptions', 'transactions');" 2>/dev/null | xargs)
            
            if [ "$TABLE_COUNT" = "3" ]; then
                print_status "pass" "All required tables exist"
                
                # Check if Sentinel plans exist
                PLAN_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM subscription_plans WHERE id IN ('sentinel_trader', 'sentinel_commuter', 'sentinel_voyager');" 2>/dev/null | xargs)
                
                if [ "$PLAN_COUNT" = "3" ]; then
                    print_status "pass" "Sentinel plans configured in database"
                else
                    print_status "warn" "Sentinel plans not found in database"
                    echo "   Fix: psql \$DATABASE_URL -f backend/migrations/002_sentinel_plans.sql"
                fi
            else
                print_status "warn" "Some required tables missing (found $TABLE_COUNT/3)"
                echo "   Fix: Run database migrations"
                echo "   psql \$DATABASE_URL -f backend/migrations/001_subscription_schema.sql"
                echo "   psql \$DATABASE_URL -f backend/migrations/002_sentinel_plans.sql"
            fi
        else
            print_status "fail" "Cannot connect to database"
            echo "   Check: DATABASE_URL is correct and database is running"
        fi
    else
        print_status "warn" "PostgreSQL client not installed (cannot test connection)"
        echo "   Install: sudo apt install postgresql-client"
    fi
else
    print_status "fail" "DATABASE_URL not set (skipping connection test)"
fi

echo ""

# 4. Check File Structure
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  FILE STRUCTURE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check critical files
FILES=(
    "server/webhook.js:Webhook server"
    "server/package.json:Package configuration"
    "server/test-webhook.js:Test script"
    "backend/migrations/001_subscription_schema.sql:Database schema"
    "backend/migrations/002_sentinel_plans.sql:Sentinel plans"
    "SmartphoneApp/screens/SubscriptionScreen.js:Subscription UI"
    "SmartphoneApp/services/subscriptionService.js:Subscription service"
    "docs/SUBSCRIPTION_DEPLOYMENT_GUIDE.md:Deployment guide"
)

for file_info in "${FILES[@]}"; do
    IFS=':' read -r file desc <<< "$file_info"
    if [ -f "$file" ]; then
        print_status "pass" "$desc exists"
    else
        print_status "warn" "$desc not found ($file)"
    fi
done

echo ""

# 5. Check Network & Ports
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  NETWORK & PORTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if port 3000 is available
PORT=${PORT:-3000}
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_status "warn" "Port $PORT is already in use"
    echo "   Fix: Stop the process using port $PORT or set PORT env variable"
else
    print_status "pass" "Port $PORT is available"
fi

# Check internet connectivity
if ping -c 1 google.com &> /dev/null; then
    print_status "pass" "Internet connection available"
else
    print_status "warn" "No internet connection (required for payment gateway)"
fi

echo ""

# 6. Check Payment Gateway Configuration
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  PAYMENT GATEWAY CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if keys look like test or production
if [ -n "$FLW_PUBLIC_KEY" ]; then
    if [[ "$FLW_PUBLIC_KEY" == *"test"* ]]; then
        print_status "info" "Using Flutterwave TEST keys (sandbox mode)"
    else
        print_status "info" "Using Flutterwave PRODUCTION keys"
    fi
fi

# Check if webhook URL is configured
if [ -n "$WEBHOOK_BASE_URL" ]; then
    print_status "pass" "Webhook base URL configured: $WEBHOOK_BASE_URL"
else
    print_status "warn" "WEBHOOK_BASE_URL not set"
    echo "   Set after deployment: export WEBHOOK_BASE_URL='https://your-app.railway.app'"
fi

echo ""

# 7. Security Checks
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣  SECURITY CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if .env file exists
if [ -f ".env" ]; then
    print_status "pass" ".env file exists"
    
    # Check if .env is in .gitignore
    if [ -f ".gitignore" ] && grep -q "^\.env$" .gitignore; then
        print_status "pass" ".env is in .gitignore (secrets protected)"
    else
        print_status "fail" ".env is NOT in .gitignore (security risk!)"
        echo "   Fix: echo '.env' >> .gitignore"
    fi
else
    print_status "warn" ".env file not found"
    echo "   Create: cp .env.example .env"
fi

# Check NODE_ENV
if [ "$NODE_ENV" = "production" ]; then
    print_status "info" "Running in PRODUCTION mode"
    
    # Production-specific checks
    if [[ "$FLW_PUBLIC_KEY" == *"test"* ]]; then
        print_status "fail" "Using TEST keys in PRODUCTION mode!"
        echo "   Fix: Update to production keys from Flutterwave dashboard"
    fi
else
    print_status "info" "Running in DEVELOPMENT mode"
fi

echo ""

# 8. Quick Test
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8️⃣  QUICK FUNCTIONALITY TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "server/webhook.js" ] && command -v node &> /dev/null; then
    # Try to load the webhook file (syntax check)
    if node -c server/webhook.js 2>/dev/null; then
        print_status "pass" "webhook.js syntax is valid"
    else
        print_status "fail" "webhook.js has syntax errors"
        echo "   Check: node -c server/webhook.js"
    fi
fi

echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ Passed:${NC}   $PASSED"
echo -e "${YELLOW}⚠️  Warnings:${NC} $WARNINGS"
echo -e "${RED}❌ Errors:${NC}   $ERRORS"
echo ""

# Final verdict
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                       ║${NC}"
    echo -e "${GREEN}║   🎉 ALL CHECKS PASSED - READY TO DEPLOY!            ║${NC}"
    echo -e "${GREEN}║                                                       ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. cd server && npm install"
    echo "  2. npm run dev (test locally)"
    echo "  3. railway up (deploy to production)"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║                                                       ║${NC}"
    echo -e "${YELLOW}║   ⚠️  READY WITH WARNINGS                            ║${NC}"
    echo -e "${YELLOW}║                                                       ║${NC}"
    echo -e "${YELLOW}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "You can proceed, but review warnings above."
    exit 0
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                       ║${NC}"
    echo -e "${RED}║   ❌ ERRORS FOUND - FIX BEFORE DEPLOYING             ║${NC}"
    echo -e "${RED}║                                                       ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Fix the errors above before deploying."
    exit 1
fi
