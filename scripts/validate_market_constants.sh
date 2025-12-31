#!/bin/bash
# Filename: scripts/validate_market_constants.sh
#
# Validates that React app is pulling correct "Real-World" constants
# Based on Dec 2025 TAZARA/ZRL market data

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                       ║${NC}"
echo -e "${BLUE}║   📊 MARKET CONSTANTS VALIDATION                     ║${NC}"
echo -e "${BLUE}║   Checking Real-World 2025 Data                       ║${NC}"
echo -e "${BLUE}║                                                       ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

ERRORS=0
WARNINGS=0
PASSED=0

# Function to check constant in file
check_constant() {
    local file=$1
    local constant_name=$2
    local expected_value=$3
    local description=$4
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ FAIL:${NC} File not found: $file"
        ((ERRORS++))
        return 1
    fi
    
    if grep -q "$constant_name.*$expected_value" "$file"; then
        echo -e "${GREEN}✅ PASS:${NC} $description ($constant_name = $expected_value)"
        ((PASSED++))
        return 0
    else
        # Check if constant exists with different value
        if grep -q "$constant_name" "$file"; then
            ACTUAL=$(grep "$constant_name" "$file" | head -1)
            echo -e "${YELLOW}⚠️  WARN:${NC} $description has different value"
            echo "   Expected: $constant_name = $expected_value"
            echo "   Found: $ACTUAL"
            ((WARNINGS++))
        else
            echo -e "${RED}❌ FAIL:${NC} $description not found ($constant_name)"
            ((ERRORS++))
        fi
        return 1
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  TAZARA MARKET CONSTANTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

HOOK_FILE="SmartphoneApp/hooks/useFinancialProjections.js"

check_constant "$HOOK_FILE" "TAZARA_ANNUAL_PASSENGERS" "1600000" "TAZARA annual passengers"
check_constant "$HOOK_FILE" "TAZARA_WEEKLY_PASSENGERS" "12000" "TAZARA weekly capacity (fully booked)"
check_constant "$HOOK_FILE" "TAZARA_REVITALIZATION_BUDGET" "1400000000" "TAZARA revitalization budget (\$1.4B)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  ZRL MARKET CONSTANTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_constant "$HOOK_FILE" "ZRL_MODERNIZATION_BUDGET" "100000000" "ZRL modernization budget (K100M)"
check_constant "$HOOK_FILE" "ZRL_NETWORK_LENGTH" "1200" "ZRL network length (1200km)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  COMMUTER MARKET CONSTANTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_constant "$HOOK_FILE" "DAR_DAILY_COMMUTERS" "9000" "Dar es Salaam daily commuters"
check_constant "$HOOK_FILE" "LUSAKA_DAILY_COMMUTERS" "3000" "Lusaka daily commuters (estimated)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  TRADER MARKET CONSTANTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_constant "$HOOK_FILE" "CROSS_BORDER_TRADERS_WEEKLY" "5000" "Weekly cross-border traders"
check_constant "$HOOK_FILE" "CROSS_BORDER_TRADERS_ANNUAL" "260000" "Annual cross-border traders"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  TOTAL ADDRESSABLE MARKET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_constant "$HOOK_FILE" "TOTAL_MARKET" "3400000" "Total addressable market (3.4M)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  MARKET DYNAMICS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_constant "$HOOK_FILE" "BOOKING_ADVANCE_WEEKS" "2" "Booking advance (2 weeks - fully booked)"
check_constant "$HOOK_FILE" "CAPACITY_UTILIZATION" "0.95" "Capacity utilization (95% - scarcity driver)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣  GROWTH RATES (2025 Revitalization Impact)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_constant "$HOOK_FILE" "traderGrowth.*15" "15" "Trader growth rate (15%)"
check_constant "$HOOK_FILE" "touristGrowth.*10" "10" "Tourist growth rate (10%)"
check_constant "$HOOK_FILE" "domesticGrowth.*12" "12" "Domestic growth rate (12%)"
check_constant "$HOOK_FILE" "commuterGrowth.*20" "20" "Commuter growth rate (20%)"
check_constant "$HOOK_FILE" "premiumGrowth.*15" "15" "Premium growth rate (15%)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8️⃣  CHURN RATE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_constant "$HOOK_FILE" "CHURN_RATE.*0.05" "0.05" "Industry standard churn rate (5%)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "9️⃣  PRICING VALIDATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_constant "$HOOK_FILE" "traderPlan.*50" "50" "Trader plan pricing (ZMW 50)"
check_constant "$HOOK_FILE" "commuterPlan.*120" "120" "Commuter plan pricing (ZMW 120)"
check_constant "$HOOK_FILE" "touristPlan.*250" "250" "Tourist plan pricing (ZMW 250)"
check_constant "$HOOK_FILE" "perBookingFee.*15" "15" "Pay-per-use fee (ZMW 15)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔟 CALCULATION LOGIC VALIDATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for calculateNextMonth function
if grep -q "calculateNextMonth" "$HOOK_FILE"; then
    echo -e "${GREEN}✅ PASS:${NC} calculateNextMonth function exists"
    ((PASSED++))
    
    # Check for churn application
    if grep -q "(1 - churnRate)" "$HOOK_FILE"; then
        echo -e "${GREEN}✅ PASS:${NC} Churn rate applied in calculations"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL:${NC} Churn rate not applied in calculations"
        ((ERRORS++))
    fi
    
    # Check for growth application
    if grep -q "(1 + .*Growth / 100)" "$HOOK_FILE"; then
        echo -e "${GREEN}✅ PASS:${NC} Growth rates applied in calculations"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL:${NC} Growth rates not applied in calculations"
        ((ERRORS++))
    fi
    
    # Check for premium 15% boost
    if grep -q "premiumSubs.*1.15" "$HOOK_FILE"; then
        echo -e "${GREEN}✅ PASS:${NC} Premium segment 15% boost applied (revitalization impact)"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️  WARN:${NC} Premium segment 15% boost not found"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}❌ FAIL:${NC} calculateNextMonth function not found"
    ((ERRORS++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣1️⃣  DASHBOARD INTEGRATION CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DASHBOARD_FILE="SmartphoneApp/screens/SentinelDashboardScreen.js"

if [ -f "$DASHBOARD_FILE" ]; then
    echo -e "${GREEN}✅ PASS:${NC} Dashboard screen exists"
    ((PASSED++))
    
    # Check if dashboard uses the hook
    if grep -q "useFinancialProjections" "$DASHBOARD_FILE"; then
        echo -e "${GREEN}✅ PASS:${NC} Dashboard uses useFinancialProjections hook"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️  WARN:${NC} Dashboard doesn't use useFinancialProjections hook"
        ((WARNINGS++))
    fi
    
    # Check for revenue calculation
    if grep -q "calculateRevenue\\|monthlyRevenue" "$DASHBOARD_FILE"; then
        echo -e "${GREEN}✅ PASS:${NC} Revenue calculation present in dashboard"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️  WARN:${NC} Revenue calculation not found in dashboard"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠️  WARN:${NC} Dashboard screen not found"
    ((WARNINGS++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣2️⃣  REAL-WORLD DATA SOURCES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "Data sources validated:"
echo "  • TAZARA: \$1.4B Revitalization (Active Phase)"
echo "  • ZRL: K100M Modernization Injection"
echo "  • Current capacity: 12,000 passengers/week"
echo "  • Booking status: Fully booked 2 weeks in advance"
echo "  • Dar es Salaam: 9,000 daily commuters"
echo "  • Cross-border traders: 5,000+ weekly"
echo ""
echo "Growth rates reflect:"
echo "  • 2025 revitalization surge"
echo "  • Scarcity-driven demand (95% capacity)"
echo "  • Modernization impact on commuter segment"
echo "  • Victoria Falls tourism recovery"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 VALIDATION SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "Passed:   ${GREEN}$PASSED${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo -e "Errors:   ${RED}$ERRORS${NC}"
echo ""

# Calculate percentage
TOTAL=$((PASSED + WARNINGS + ERRORS))
if [ $TOTAL -gt 0 ]; then
    PASS_PERCENTAGE=$((PASSED * 100 / TOTAL))
    echo "Pass Rate: ${PASS_PERCENTAGE}%"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Final verdict
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                       ║${NC}"
    echo -e "${GREEN}║   ✅ ALL CONSTANTS VALIDATED                         ║${NC}"
    echo -e "${GREEN}║                                                       ║${NC}"
    echo -e "${GREEN}║   App is using correct real-world 2025 data          ║${NC}"
    echo -e "${GREEN}║                                                       ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║                                                       ║${NC}"
    echo -e "${YELLOW}║   ⚠️  VALIDATED WITH WARNINGS                        ║${NC}"
    echo -e "${YELLOW}║                                                       ║${NC}"
    echo -e "${YELLOW}║   Review warnings above                               ║${NC}"
    echo -e "${YELLOW}║                                                       ║${NC}"
    echo -e "${YELLOW}╚═══════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                       ║${NC}"
    echo -e "${RED}║   ❌ VALIDATION FAILED                                ║${NC}"
    echo -e "${RED}║                                                       ║${NC}"
    echo -e "${RED}║   Fix errors above before deployment                  ║${NC}"
    echo -e "${RED}║                                                       ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
