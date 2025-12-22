#!/bin/bash

################################################################################
# 📱 MOBILE APP BUILD SCRIPT
# 
# Builds the Sovereign Hub mobile app using EAS
#
# Usage: 
#   ./build-mobile.sh                    # Build all platforms (production)
#   ./build-mobile.sh android preview    # Build Android (preview)
#   ./build-mobile.sh ios development    # Build iOS (development)
################################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GOLD='\033[1;33m'
NC='\033[0m'

# Default values
PLATFORM="${1:-all}"
PROFILE="${2:-production}"

# Banner
echo -e "${GOLD}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   📱  SOVEREIGN HUB MOBILE BUILD                         ║
║   EAS Build System                                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${CYAN}Platform: ${GOLD}${PLATFORM}${NC}"
echo -e "${CYAN}Profile:  ${GOLD}${PROFILE}${NC}"
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo -e "${YELLOW}⚠ EAS CLI not found. Installing...${NC}"
    npm install -g eas-cli
    echo -e "${GREEN}✓ EAS CLI installed${NC}"
fi

# Check if logged in to Expo
echo -e "${CYAN}Checking Expo authentication...${NC}"
if ! eas whoami &> /dev/null; then
    echo -e "${YELLOW}⚠ Not logged in to Expo${NC}"
    echo -e "${BLUE}Please log in:${NC}"
    eas login
fi

EXPO_USER=$(eas whoami 2>/dev/null || echo "unknown")
echo -e "${GREEN}✓ Logged in as: ${EXPO_USER}${NC}"
echo ""

# Validate platform
case $PLATFORM in
    all|android|ios)
        ;;
    *)
        echo -e "${RED}❌ Invalid platform: ${PLATFORM}${NC}"
        echo -e "${YELLOW}Valid options: all, android, ios${NC}"
        exit 1
        ;;
esac

# Validate profile
case $PROFILE in
    development|preview|production)
        ;;
    *)
        echo -e "${RED}❌ Invalid profile: ${PROFILE}${NC}"
        echo -e "${YELLOW}Valid options: development, preview, production${NC}"
        exit 1
        ;;
esac

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${CYAN}📦 Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
    echo ""
fi

# Start build
echo -e "${CYAN}🚀 Starting EAS Build...${NC}"
echo ""

eas build \
    --platform $PLATFORM \
    --profile $PROFILE \
    --non-interactive

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ BUILD SUBMITTED SUCCESSFULLY                         ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GOLD}📊 Build Status:${NC}"
echo -e "  Platform: ${CYAN}${PLATFORM}${NC}"
echo -e "  Profile:  ${CYAN}${PROFILE}${NC}"
echo ""
echo -e "${GOLD}🔗 Monitor Build:${NC}"
echo -e "  ${BLUE}https://expo.dev/accounts/${EXPO_USER}/projects/africa-railways/builds${NC}"
echo ""
echo -e "${YELLOW}💡 Tip: Use 'eas build:list' to check build status${NC}"
echo ""
