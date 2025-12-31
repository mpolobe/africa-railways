#!/bin/bash
# Filename: scripts/verify_growth_constants.sh
#
# Verifies 2025 market assumptions against real infrastructure capacity
# Ensures projections are realistic and within TAZARA/ZRL limits

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                       ║${NC}"
echo -e "${BLUE}║   📊 2025 MARKET GROWTH VERIFICATION                 ║${NC}"
echo -e "${BLUE}║   TAZARA/ZRL Infrastructure Capacity Check            ║${NC}"
echo -e "${BLUE}║                                                       ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  CURRENT INFRASTRUCTURE CAPACITY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Target Passenger Volumes (Weekly)
WEEKLY_CAPACITY=12000
MONTHLY_CAPACITY=$((WEEKLY_CAPACITY * 4))
ANNUAL_CAPACITY=$((WEEKLY_CAPACITY * 52))

echo "Current Weekly Capacity:  $WEEKLY_CAPACITY passengers"
echo "Current Monthly Demand:   $MONTHLY_CAPACITY passengers"
echo "Current Annual Capacity:  $ANNUAL_CAPACITY passengers"
echo ""
echo -e "${YELLOW}Status: Fully booked 2 weeks in advance (95% utilization)${NC}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  PENETRATION RATE TARGETS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Calculate realistic penetration targets
PENETRATION_RATES=(5 8 10 15 20)

echo "Realistic penetration scenarios for Year 1:"
echo ""

for RATE in "${PENETRATION_RATES[@]}"; do
    TARGET_USERS=$(echo "$MONTHLY_CAPACITY * $RATE / 100" | bc)
    ANNUAL_USERS=$(echo "$ANNUAL_CAPACITY * $RATE / 100" | bc)
    
    if [ $RATE -le 10 ]; then
        STATUS="${GREEN}✅ CONSERVATIVE${NC}"
    elif [ $RATE -le 15 ]; then
        STATUS="${YELLOW}⚠️  MODERATE${NC}"
    else
        STATUS="${YELLOW}⚠️  AGGRESSIVE${NC}"
    fi
    
    echo -e "$STATUS - ${RATE}% penetration:"
    echo "   Monthly subscribers: ~$TARGET_USERS users"
    echo "   Annual subscribers:  ~$ANNUAL_USERS users"
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  RECOMMENDED YEAR 1 TARGET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Recommended 8% penetration (realistic for new platform)
RECOMMENDED_RATE=8
TARGET_USERS=$(echo "$MONTHLY_CAPACITY * $RECOMMENDED_RATE / 100" | bc)
ANNUAL_TARGET=$(echo "$ANNUAL_CAPACITY * $RECOMMENDED_RATE / 100" | bc)

echo -e "${GREEN}Recommended Target: ${RECOMMENDED_RATE}% penetration${NC}"
echo ""
echo "Your Year 1 Target (${RECOMMENDED_RATE}% penetration):"
echo "  • Monthly subscribers: ~$TARGET_USERS users"
echo "  • Annual subscribers:  ~$ANNUAL_TARGET users"
echo ""
echo "Rationale:"
echo "  • Conservative for new platform launch"
echo "  • Achievable with focused marketing"
echo "  • Leaves room for organic growth"
echo "  • Within infrastructure capacity"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  SEGMENT BREAKDOWN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Segment distribution (based on market research)
TRADER_PERCENT=40
COMMUTER_PERCENT=35
TOURIST_PERCENT=15
DOMESTIC_PERCENT=10

TRADER_SUBS=$(echo "$TARGET_USERS * $TRADER_PERCENT / 100" | bc)
COMMUTER_SUBS=$(echo "$TARGET_USERS * $COMMUTER_PERCENT / 100" | bc)
TOURIST_SUBS=$(echo "$TARGET_USERS * $TOURIST_PERCENT / 100" | bc)
DOMESTIC_SUBS=$(echo "$TARGET_USERS * $DOMESTIC_PERCENT / 100" | bc)

echo "Expected segment distribution:"
echo ""
echo "  💼 Trader Pro (${TRADER_PERCENT}%):     ~$TRADER_SUBS subscribers"
echo "     Cross-border traders, weekly travelers"
echo ""
echo "  🚌 Commuter (${COMMUTER_PERCENT}%):     ~$COMMUTER_SUBS subscribers"
echo "     Daily riders (Dar/Lusaka)"
echo ""
echo "  ✈️  Voyager (${TOURIST_PERCENT}%):      ~$TOURIST_SUBS subscribers"
echo "     International tourists"
echo ""
echo "  🎫 Domestic (${DOMESTIC_PERCENT}%):     ~$DOMESTIC_SUBS subscribers"
echo "     Local travelers"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  REVENUE PROJECTIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Pricing (ZMW)
TRADER_PRICE=50
COMMUTER_PRICE=120
TOURIST_PRICE=250
DOMESTIC_PRICE=50

# Calculate monthly revenue
TRADER_REV=$(echo "$TRADER_SUBS * $TRADER_PRICE" | bc)
COMMUTER_REV=$(echo "$COMMUTER_SUBS * $COMMUTER_PRICE" | bc)
TOURIST_REV=$(echo "$TOURIST_SUBS * $TOURIST_PRICE" | bc)
DOMESTIC_REV=$(echo "$DOMESTIC_SUBS * $DOMESTIC_PRICE" | bc)

TOTAL_MRR=$(echo "$TRADER_REV + $COMMUTER_REV + $TOURIST_REV + $DOMESTIC_REV" | bc)
ANNUAL_REV=$(echo "$TOTAL_MRR * 12" | bc)

# Convert to USD (19 ZMW = 1 USD)
MRR_USD=$(echo "$TOTAL_MRR / 19" | bc)
ANNUAL_USD=$(echo "$ANNUAL_REV / 19" | bc)

echo "Monthly Recurring Revenue (MRR):"
echo ""
echo "  Trader Pro:   ZMW $TRADER_REV"
echo "  Commuter:     ZMW $COMMUTER_REV"
echo "  Voyager:      ZMW $TOURIST_REV"
echo "  Domestic:     ZMW $DOMESTIC_REV"
echo "  ─────────────────────────────"
echo "  Total MRR:    ZMW $TOTAL_MRR (\$$MRR_USD USD)"
echo ""
echo "Annual Recurring Revenue (ARR):"
echo "  Total ARR:    ZMW $ANNUAL_REV (\$$ANNUAL_USD USD)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  GROWTH TRAJECTORY (12 MONTHS)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Growth rates (monthly)
TRADER_GROWTH=15
COMMUTER_GROWTH=20
CHURN_RATE=5

echo "Applying growth rates with 5% monthly churn:"
echo ""

CURRENT_TRADER=$TRADER_SUBS
CURRENT_COMMUTER=$COMMUTER_SUBS

for MONTH in {1..12}; do
    if [ $MONTH -gt 1 ]; then
        # Apply churn and growth
        CURRENT_TRADER=$(echo "$CURRENT_TRADER * 0.95 * 1.$TRADER_GROWTH" | bc | cut -d'.' -f1)
        CURRENT_COMMUTER=$(echo "$CURRENT_COMMUTER * 0.95 * 1.$COMMUTER_GROWTH" | bc | cut -d'.' -f1)
    fi
    
    MONTH_TOTAL=$(echo "$CURRENT_TRADER + $CURRENT_COMMUTER + $TOURIST_SUBS + $DOMESTIC_SUBS" | bc)
    MONTH_REV=$(echo "($CURRENT_TRADER * $TRADER_PRICE) + ($CURRENT_COMMUTER * $COMMUTER_PRICE) + ($TOURIST_SUBS * $TOURIST_PRICE) + ($DOMESTIC_SUBS * $DOMESTIC_PRICE)" | bc)
    
    if [ $MONTH -eq 1 ] || [ $MONTH -eq 6 ] || [ $MONTH -eq 12 ]; then
        echo "  Month $MONTH:  $MONTH_TOTAL subscribers → ZMW $MONTH_REV MRR"
    fi
done

echo ""
echo "Growth trajectory shows:"
echo "  • Steady subscriber growth"
echo "  • Churn-adjusted projections"
echo "  • Commuter segment driving growth (20%/month)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣  INFRASTRUCTURE VALIDATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if projections exceed capacity
MONTH_12_SUBS=$(echo "$CURRENT_TRADER + $CURRENT_COMMUTER + $TOURIST_SUBS + $DOMESTIC_SUBS" | bc)
CAPACITY_USAGE=$(echo "scale=2; $MONTH_12_SUBS * 100 / $MONTHLY_CAPACITY" | bc)

echo "Month 12 projected subscribers: $MONTH_12_SUBS"
echo "Monthly capacity:               $MONTHLY_CAPACITY"
echo "Capacity usage:                 ${CAPACITY_USAGE}%"
echo ""

if (( $(echo "$CAPACITY_USAGE < 50" | bc -l) )); then
    echo -e "${GREEN}✅ EXCELLENT: Well within infrastructure limits${NC}"
elif (( $(echo "$CAPACITY_USAGE < 80" | bc -l) )); then
    echo -e "${GREEN}✅ GOOD: Sustainable growth trajectory${NC}"
elif (( $(echo "$CAPACITY_USAGE < 100" | bc -l) )); then
    echo -e "${YELLOW}⚠️  CAUTION: Approaching capacity limits${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING: Exceeds current infrastructure capacity${NC}"
    echo "   Consider: Phased rollout or capacity expansion"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8️⃣  2025 REVITALIZATION IMPACT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "Infrastructure investments supporting growth:"
echo ""
echo "  🚂 TAZARA Revitalization:"
echo "     • \$1.4 Billion investment (Active Phase)"
echo "     • Track rehabilitation"
echo "     • Rolling stock modernization"
echo "     • Signaling system upgrades"
echo ""
echo "  🚂 ZRL Modernization:"
echo "     • K100 Million injection"
echo "     • Passenger coach upgrades"
echo "     • Station improvements"
echo "     • Safety system enhancements"
echo ""
echo "  📈 Market Impact:"
echo "     • Increased capacity (projected 30% by 2026)"
echo "     • Improved reliability"
echo "     • Enhanced passenger experience"
echo "     • Scarcity-driven demand (currently 95% utilization)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "9️⃣  RISK FACTORS & MITIGATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "Identified risks:"
echo ""
echo "  ⚠️  Infrastructure delays"
echo "     Mitigation: Conservative penetration targets (8%)"
echo ""
echo "  ⚠️  Higher than expected churn"
echo "     Mitigation: Focus on trader retention (high LTV)"
echo ""
echo "  ⚠️  Payment gateway issues"
echo "     Mitigation: Multiple providers (Flutterwave, MTN, Airtel)"
echo ""
echo "  ⚠️  Competition from informal booking"
echo "     Mitigation: Zero convenience fees for Pro members"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 FINAL VERDICT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if (( $(echo "$CAPACITY_USAGE < 80" | bc -l) )); then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                       ║${NC}"
    echo -e "${GREEN}║   ✅ PROJECTIONS VALIDATED                           ║${NC}"
    echo -e "${GREEN}║                                                       ║${NC}"
    echo -e "${GREEN}║   Growth targets are realistic and sustainable       ║${NC}"
    echo -e "${GREEN}║   within 2025 infrastructure limits                   ║${NC}"
    echo -e "${GREEN}║                                                       ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Recommended actions:"
    echo "  1. Proceed with 8% penetration target"
    echo "  2. Focus on trader and commuter segments"
    echo "  3. Monitor capacity utilization monthly"
    echo "  4. Scale marketing based on infrastructure readiness"
else
    echo -e "${YELLOW}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║                                                       ║${NC}"
    echo -e "${YELLOW}║   ⚠️  PROJECTIONS NEED ADJUSTMENT                    ║${NC}"
    echo -e "${YELLOW}║                                                       ║${NC}"
    echo -e "${YELLOW}║   Growth targets may exceed infrastructure capacity  ║${NC}"
    echo -e "${YELLOW}║                                                       ║${NC}"
    echo -e "${YELLOW}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Recommended actions:"
    echo "  1. Reduce penetration target to 5-6%"
    echo "  2. Implement phased rollout"
    echo "  3. Coordinate with TAZARA/ZRL on capacity"
    echo "  4. Monitor and adjust growth rates"
fi

echo ""
