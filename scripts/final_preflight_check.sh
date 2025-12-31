#!/bin/bash
# Filename: scripts/final_preflight_check.sh
#
# Comprehensive pre-deployment validation for Sentinel Africa Railways
# Checks all critical components before production deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

echo ""
echo -e "${PURPLE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║                                                       ║${NC}"
echo -e "${PURPLE}║   🚂 SENTINEL AFRICA RAILWAYS                        ║${NC}"
echo -e "${PURPLE}║   Final System Preflight Check                        ║${NC}"
echo -e "${PURPLE}║                                                       ║${NC}"
echo -e "${PURPLE}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check file existence
check_file() {
    local file=$1
    local description=$2
    ((TOTAL_CHECKS++))
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ FOUND:${NC} $description ($file)"
        ((PASSED_CHECKS++))
        return 0
    else
        echo -e "${RED}❌ MISSING:${NC} $description ($file)"
        ((FAILED_CHECKS++))
        return 1
    fi
}

# Function to check directory existence
check_dir() {
    local dir=$1
    local description=$2
    ((TOTAL_CHECKS++))
    
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✅ FOUND:${NC} $description ($dir)"
        ((PASSED_CHECKS++))
        return 0
    else
        echo -e "${RED}❌ MISSING:${NC} $description ($dir)"
        ((FAILED_CHECKS++))
        return 1
    fi
}

# Function to check file content
check_content() {
    local file=$1
    local pattern=$2
    local description=$3
    ((TOTAL_CHECKS++))
    
    if [ -f "$file" ] && grep -q "$pattern" "$file"; then
        echo -e "${GREEN}✅ VERIFIED:${NC} $description"
        ((PASSED_CHECKS++))
        return 0
    else
        echo -e "${YELLOW}⚠️  WARNING:${NC} $description"
        ((WARNING_CHECKS++))
        return 1
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  CORE CONFIGURATION FILES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_file "codemagic.yaml" "Codemagic CI/CD configuration"
check_file "eas.json" "EAS Build configuration"
check_file "app.config.js" "Expo app configuration"
check_file ".env.example" "Environment variables template"
check_file "package.json" "Root package configuration"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  SUBSCRIPTION SYSTEM - BACKEND"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_file "server/webhook.js" "Main webhook handler"
check_file "server/package.json" "Webhook server dependencies"
check_file "server/test-webhook.js" "Webhook test script"
check_file "server/README.md" "Webhook documentation"
check_file "backend/api/webhooks/webhook.js" "Alternative webhook implementation"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  SUBSCRIPTION SYSTEM - DATABASE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_file "backend/migrations/001_subscription_schema.sql" "Base subscription schema"
check_file "backend/migrations/002_sentinel_plans.sql" "Sentinel plans migration"

# Check if Sentinel plans are defined
check_content "backend/migrations/002_sentinel_plans.sql" "sentinel_trader" "Sentinel Trader plan defined"
check_content "backend/migrations/002_sentinel_plans.sql" "sentinel_commuter" "Sentinel Commuter plan defined"
check_content "backend/migrations/002_sentinel_plans.sql" "sentinel_voyager" "Sentinel Voyager plan defined"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  SUBSCRIPTION SYSTEM - MOBILE APP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_file "SmartphoneApp/screens/SubscriptionScreen.js" "Subscription plan selection"
check_file "SmartphoneApp/screens/SubscriptionCheckoutScreen.js" "Payment checkout flow"
check_file "SmartphoneApp/screens/SubscriptionSuccessScreen.js" "Success screen with Pro badge"
check_file "SmartphoneApp/screens/ProfileScreen.js" "Profile with Pro badge"
check_file "SmartphoneApp/services/subscriptionService.js" "Subscription API service"
check_file "SmartphoneApp/components/ProBadge.js" "Pro badge component"

# Check for Pro badge implementation
check_content "SmartphoneApp/screens/SubscriptionSuccessScreen.js" "PRO" "Pro badge in success screen"
check_content "SmartphoneApp/screens/ProfileScreen.js" "ProBadge" "Pro badge in profile"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  DOCUMENTATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_file "SUBSCRIPTION_SYSTEM_COMPLETE.md" "System overview"
check_file "docs/SUBSCRIPTION_DEPLOYMENT_GUIDE.md" "Deployment guide"
check_file "docs/PAYMENT_INTEGRATION_SPECS.md" "Payment integration specs"
check_file "docs/SUBSCRIPTION_UI_MOCKUP.md" "UI mockups"
check_file "docs/SENTINEL_FINANCIAL_MODEL.html" "Financial model"
check_file "README.md" "Project README"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  SETUP & TESTING SCRIPTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_file "scripts/setup_subscription_api.sh" "Subscription setup script"
check_file "scripts/check_webhook_readiness.sh" "Webhook readiness checker"
check_file "scripts/final_preflight_check.sh" "This preflight check script"
check_file "scripts/README.md" "Scripts documentation"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣  MOBILE APP CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_file "SmartphoneApp/package.json" "Mobile app dependencies"
check_file "SmartphoneApp/app.config.js" "Mobile app config"

# Check for app variants
if [ -f "SmartphoneApp/app.config.js" ]; then
    check_content "SmartphoneApp/app.config.js" "railways" "Railways app variant"
    check_content "SmartphoneApp/app.config.js" "africoin" "Africoin app variant"
    check_content "SmartphoneApp/app.config.js" "sentinel" "Sentinel app variant"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8️⃣  PACKAGE IDENTIFIERS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for correct package IDs in app config
if [ -f "SmartphoneApp/app.config.js" ]; then
    if grep -q "com.africorailways" SmartphoneApp/app.config.js; then
        echo -e "${GREEN}✅ VERIFIED:${NC} Railways package ID (com.africorailways.*)"
        ((PASSED_CHECKS++))
    else
        echo -e "${YELLOW}⚠️  WARNING:${NC} Railways package ID not found"
        ((WARNING_CHECKS++))
    fi
    ((TOTAL_CHECKS++))
    
    if grep -q "com.africoin" SmartphoneApp/app.config.js; then
        echo -e "${GREEN}✅ VERIFIED:${NC} Africoin package ID (com.africoin.*)"
        ((PASSED_CHECKS++))
    else
        echo -e "${YELLOW}⚠️  WARNING:${NC} Africoin package ID not found"
        ((WARNING_CHECKS++))
    fi
    ((TOTAL_CHECKS++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "9️⃣  PAYMENT GATEWAY INTEGRATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for payment integration code
check_content "server/webhook.js" "Flutterwave" "Flutterwave integration"
check_content "server/webhook.js" "MTN" "MTN MoMo integration"
check_content "server/webhook.js" "Airtel" "Airtel Money integration"
check_content "server/webhook.js" "verif-hash" "Webhook signature verification"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔟 SMS NOTIFICATION SYSTEM"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_content "server/webhook.js" "sendSMS" "SMS notification function"
check_content "server/webhook.js" "africastalking\\|twilio" "SMS provider integration"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣1️⃣  TAZARA-SPECIFIC FEATURES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for TAZARA trader features
check_content "SmartphoneApp/screens/SubscriptionSuccessScreen.js" "TAZARA" "TAZARA trader messaging"
check_content "SmartphoneApp/screens/SubscriptionSuccessScreen.js" "receipt" "Receipt download feature"
check_content "SmartphoneApp/screens/SubscriptionSuccessScreen.js" "Pro Tip" "Pro tips for traders"

# Check for offline-first design
check_content "SmartphoneApp/screens/SubscriptionSuccessScreen.js" "polling\\|checkSubscriptionStatus" "Status polling (offline-first)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣2️⃣  SECURITY CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check .gitignore
if [ -f ".gitignore" ]; then
    if grep -q "^\.env$" .gitignore; then
        echo -e "${GREEN}✅ VERIFIED:${NC} .env is in .gitignore"
        ((PASSED_CHECKS++))
    else
        echo -e "${RED}❌ CRITICAL:${NC} .env NOT in .gitignore (security risk!)"
        ((FAILED_CHECKS++))
    fi
    ((TOTAL_CHECKS++))
    
    if grep -q "node_modules" .gitignore; then
        echo -e "${GREEN}✅ VERIFIED:${NC} node_modules in .gitignore"
        ((PASSED_CHECKS++))
    else
        echo -e "${YELLOW}⚠️  WARNING:${NC} node_modules not in .gitignore"
        ((WARNING_CHECKS++))
    fi
    ((TOTAL_CHECKS++))
fi

# Check for hardcoded secrets
echo ""
echo "Scanning for potential hardcoded secrets..."
if grep -r "FLWSECK-" --include="*.js" --include="*.ts" --exclude-dir=node_modules . 2>/dev/null | grep -v ".env" | grep -v "example" | grep -v "docs/" | grep -v "README"; then
    echo -e "${RED}❌ CRITICAL:${NC} Potential hardcoded Flutterwave secret found!"
    ((FAILED_CHECKS++))
else
    echo -e "${GREEN}✅ VERIFIED:${NC} No hardcoded secrets detected"
    ((PASSED_CHECKS++))
fi
((TOTAL_CHECKS++))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣3️⃣  DEPLOYMENT READINESS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if webhook server dependencies are installed
if [ -d "server/node_modules" ]; then
    echo -e "${GREEN}✅ READY:${NC} Webhook server dependencies installed"
    ((PASSED_CHECKS++))
else
    echo -e "${YELLOW}⚠️  WARNING:${NC} Webhook server dependencies not installed"
    echo "   Run: cd server && npm install"
    ((WARNING_CHECKS++))
fi
((TOTAL_CHECKS++))

# Check if mobile app dependencies are installed
if [ -d "SmartphoneApp/node_modules" ]; then
    echo -e "${GREEN}✅ READY:${NC} Mobile app dependencies installed"
    ((PASSED_CHECKS++))
else
    echo -e "${YELLOW}⚠️  WARNING:${NC} Mobile app dependencies not installed"
    echo "   Run: cd SmartphoneApp && npm install"
    ((WARNING_CHECKS++))
fi
((TOTAL_CHECKS++))

# Check for build scripts
if [ -f "build-mobile.sh" ]; then
    echo -e "${GREEN}✅ READY:${NC} Mobile build script available"
    ((PASSED_CHECKS++))
else
    echo -e "${YELLOW}⚠️  WARNING:${NC} Mobile build script not found"
    ((WARNING_CHECKS++))
fi
((TOTAL_CHECKS++))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 FINAL SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "Total Checks:    ${BLUE}$TOTAL_CHECKS${NC}"
echo -e "Passed:          ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Warnings:        ${YELLOW}$WARNING_CHECKS${NC}"
echo -e "Failed:          ${RED}$FAILED_CHECKS${NC}"
echo ""

# Calculate percentage
PASS_PERCENTAGE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Final verdict
if [ $FAILED_CHECKS -eq 0 ] && [ $WARNING_CHECKS -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                       ║${NC}"
    echo -e "${GREEN}║   🎉 ALL SYSTEMS GO - READY FOR DEPLOYMENT!          ║${NC}"
    echo -e "${GREEN}║                                                       ║${NC}"
    echo -e "${GREEN}║   System ready for deployment to Google Play          ║${NC}"
    echo -e "${GREEN}║   Pass Rate: ${PASS_PERCENTAGE}%                                      ║${NC}"
    echo -e "${GREEN}║                                                       ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Deploy webhook server: cd server && railway up"
    echo "  2. Configure payment gateway webhook URL"
    echo "  3. Build mobile app: eas build --platform all"
    echo "  4. Submit to Google Play Store"
    exit 0
    
elif [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${YELLOW}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║                                                       ║${NC}"
    echo -e "${YELLOW}║   ⚠️  READY WITH WARNINGS                            ║${NC}"
    echo -e "${YELLOW}║                                                       ║${NC}"
    echo -e "${YELLOW}║   System is functional but has $WARNING_CHECKS warnings          ║${NC}"
    echo -e "${YELLOW}║   Pass Rate: ${PASS_PERCENTAGE}%                                      ║${NC}"
    echo -e "${YELLOW}║                                                       ║${NC}"
    echo -e "${YELLOW}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Review warnings above before deploying to production."
    echo "You can proceed with deployment, but address warnings for optimal operation."
    exit 0
    
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                       ║${NC}"
    echo -e "${RED}║   ❌ DEPLOYMENT BLOCKED - CRITICAL ISSUES FOUND      ║${NC}"
    echo -e "${RED}║                                                       ║${NC}"
    echo -e "${RED}║   Found $FAILED_CHECKS critical issues                            ║${NC}"
    echo -e "${RED}║   Pass Rate: ${PASS_PERCENTAGE}%                                      ║${NC}"
    echo -e "${RED}║                                                       ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Fix the critical issues above before deploying."
    echo ""
    echo "Quick fixes:"
    echo "  • Missing files: Check git status and commit missing files"
    echo "  • Security issues: Add .env to .gitignore immediately"
    echo "  • Dependencies: Run npm install in server/ and SmartphoneApp/"
    exit 1
fi
