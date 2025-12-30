#!/bin/bash
# Filename: scripts/authorize_wallet_telemetry.sh
# Purpose: Authorize Africoin Wallet to access live TAZARA telemetry data

set -e

echo "🚂 Authorizing Africoin Wallet to access live OCC telemetry data..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_ID="africa-railways-481823"
WALLET_SERVICE_ACCOUNT="africoin-wallet-deploy@gen-lang-client-0453426956.iam.gserviceaccount.com"

echo -e "${BLUE}Configuration:${NC}"
echo "  Project ID: $PROJECT_ID"
echo "  Service Account: $WALLET_SERVICE_ACCOUNT"
echo ""

# Check if gcloud is available
if ! command -v gcloud &> /dev/null; then
  echo -e "${RED}❌ gcloud CLI not found${NC}"
  echo "   Install: https://cloud.google.com/sdk/docs/install"
  exit 1
fi

echo -e "${YELLOW}Granting permissions...${NC}"
echo ""

# Grant monitoring.viewer role for real-time train tracking
echo "1️⃣  Granting monitoring.viewer role..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$WALLET_SERVICE_ACCOUNT" \
    --role="roles/monitoring.viewer" \
    --condition=None

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ monitoring.viewer role granted${NC}"
else
  echo -e "${RED}❌ Failed to grant monitoring.viewer role${NC}"
  exit 1
fi

echo ""

# Grant pubsub.subscriber role for real-time updates
echo "2️⃣  Granting pubsub.subscriber role..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$WALLET_SERVICE_ACCOUNT" \
    --role="roles/pubsub.subscriber" \
    --condition=None

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ pubsub.subscriber role granted${NC}"
else
  echo -e "${YELLOW}⚠️  pubsub.subscriber role may already exist${NC}"
fi

echo ""

# Grant datastore.viewer role for train schedules
echo "3️⃣  Granting datastore.viewer role..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$WALLET_SERVICE_ACCOUNT" \
    --role="roles/datastore.viewer" \
    --condition=None

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ datastore.viewer role granted${NC}"
else
  echo -e "${YELLOW}⚠️  datastore.viewer role may already exist${NC}"
fi

echo ""

# Verify permissions
echo -e "${YELLOW}Verifying permissions...${NC}"
echo ""

gcloud projects get-iam-policy $PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:$WALLET_SERVICE_ACCOUNT" \
    --format="table(bindings.role)"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║   ✅ AFRICOIN WALLET TELEMETRY ACCESS GRANTED               ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}SUCCESS:${NC} Africoin Wallet can now access:"
echo "  📍 Real-time train locations"
echo "  🚂 Live train tracking data"
echo "  📊 IoT sensor telemetry"
echo "  📅 Train schedules and delays"
echo "  🔔 Real-time alerts and notifications"
echo ""
echo -e "${BLUE}Enabled Features:${NC}"
echo "  • Live Train Tracking (1,860km Dar-Kapiri corridor)"
echo "  • Predictive arrival times"
echo "  • Delay notifications"
echo "  • Station proximity alerts"
echo "  • Freight tracking updates"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Update app manifest with telemetry permissions"
echo "  2. Test live tracking in staging environment"
echo "  3. Deploy to Google Play Store"
echo "  4. Monitor telemetry API usage"
echo ""
echo -e "${GREEN}✅ Ready for Play Store deployment!${NC}"
echo ""
