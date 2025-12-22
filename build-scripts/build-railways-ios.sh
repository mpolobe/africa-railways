#!/bin/bash

################################################################################
# 🚂 AFRICA RAILWAYS iOS BUILD SCRIPT
# 
# Builds the Africa Railways Sovereign Hub iOS app
# Bundle ID: com.mpolobe.africarailways.hub
# EAS Project: 82efeb87-20c5-45b4-b945-65d4b9074c32
################################################################################

set -e

# Colors
GOLD='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GOLD}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚂  AFRICA RAILWAYS iOS BUILD                          ║
║   Sovereign Hub Mobile App                               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Navigate to root directory
cd "$(dirname "$0")/.."

echo -e "${BLUE}📦 App Configuration:${NC}"
echo -e "  Name: Africa Railways Sovereign Hub"
echo -e "  Bundle ID: com.mpolobe.africarailways.hub"
echo -e "  Platform: iOS"
echo -e "  Profile: production"
echo ""

# Verify app.json
if [ ! -f "app.json" ]; then
    echo -e "${RED}❌ Error: app.json not found${NC}"
    exit 1
fi

# Check EAS project ID
PROJECT_ID=$(cat app.json | grep -o '"projectId": "[^"]*"' | cut -d'"' -f4)
echo -e "${GREEN}✓ EAS Project ID: ${PROJECT_ID}${NC}"
echo ""

# Check if logged in
echo -e "${BLUE}🔐 Checking Expo authentication...${NC}"
if ! npx eas-cli whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Expo${NC}"
    echo -e "${BLUE}Please run: npx eas-cli login${NC}"
    exit 1
fi

EXPO_USER=$(npx eas-cli whoami 2>/dev/null)
echo -e "${GREEN}✓ Logged in as: ${EXPO_USER}${NC}"
echo ""

# Start build
echo -e "${GOLD}🚀 Starting iOS Build...${NC}"
echo ""

npx eas-cli build \
    --platform ios \
    --profile production \
    --non-interactive

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ BUILD SUBMITTED SUCCESSFULLY                         ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GOLD}📊 Monitor Build:${NC}"
echo -e "  ${BLUE}https://expo.dev/accounts/${EXPO_USER}/projects/africa-railways/builds${NC}"
echo ""
echo -e "${GOLD}📱 Bundle ID:${NC}"
echo -e "  com.mpolobe.africarailways.hub"
echo ""
