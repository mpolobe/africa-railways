#!/bin/bash

# Setup script for local EAS builds
# This script checks prerequisites and sets up the environment

set -e

echo "🔍 Checking prerequisites for local EAS builds..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Docker
echo -n "Checking Docker... "
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | cut -d ' ' -f3 | cut -d ',' -f1)
    echo -e "${GREEN}✓ Installed (v$DOCKER_VERSION)${NC}"
    
    # Check if Docker daemon is running
    if docker ps &> /dev/null; then
        echo -e "${GREEN}✓ Docker daemon is running${NC}"
    else
        echo -e "${RED}✗ Docker daemon is not running${NC}"
        echo "  Start Docker Desktop or run: sudo systemctl start docker"
        exit 1
    fi
else
    echo -e "${RED}✗ Not installed${NC}"
    echo ""
    echo "Docker is required for local builds."
    echo ""
    echo "Install Docker:"
    echo "  Linux:   curl -fsSL https://get.docker.com | sh"
    echo "  macOS:   https://www.docker.com/products/docker-desktop"
    echo "  Windows: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Installed ($NODE_VERSION)${NC}"
    
    # Check version
    NODE_MAJOR=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -ge 18 ]; then
        echo -e "${GREEN}✓ Version is compatible (>= 18)${NC}"
    else
        echo -e "${YELLOW}⚠ Version is old (< 18), recommend upgrading${NC}"
    fi
else
    echo -e "${RED}✗ Not installed${NC}"
    echo "Install Node.js 20: https://nodejs.org/"
    exit 1
fi

# Check npm
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓ Installed (v$NPM_VERSION)${NC}"
else
    echo -e "${RED}✗ Not installed${NC}"
    exit 1
fi

# Check disk space
echo -n "Checking disk space... "
AVAILABLE=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
if [ "$AVAILABLE" -ge 15 ]; then
    echo -e "${GREEN}✓ ${AVAILABLE}GB available${NC}"
else
    echo -e "${YELLOW}⚠ Only ${AVAILABLE}GB available (15GB recommended)${NC}"
fi

# Check if in SmartphoneApp directory
echo -n "Checking directory... "
if [ -f "package.json" ] && [ -f "app.config.js" ]; then
    echo -e "${GREEN}✓ In SmartphoneApp directory${NC}"
else
    echo -e "${RED}✗ Not in SmartphoneApp directory${NC}"
    echo "Run: cd SmartphoneApp"
    exit 1
fi

# Check if dependencies are installed
echo -n "Checking dependencies... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠ Dependencies not installed${NC}"
    echo "Run: npm ci --legacy-peer-deps"
    exit 1
fi

# Check EAS CLI
echo -n "Checking EAS CLI... "
if command -v eas &> /dev/null; then
    EAS_VERSION=$(eas --version)
    echo -e "${GREEN}✓ Installed ($EAS_VERSION)${NC}"
else
    echo -e "${YELLOW}⚠ Not installed${NC}"
    echo "Installing EAS CLI..."
    npm install -g eas-cli
fi

# Check EAS authentication
echo -n "Checking EAS authentication... "
if eas whoami &> /dev/null; then
    EAS_USER=$(eas whoami 2>&1)
    echo -e "${GREEN}✓ Logged in as $EAS_USER${NC}"
else
    echo -e "${YELLOW}⚠ Not logged in${NC}"
    echo "Run: eas login"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ All prerequisites met!${NC}"
echo ""
echo "Ready to build locally:"
echo ""
echo "  Railways:"
echo "    APP_VARIANT=railways eas build --platform android --profile railways --local"
echo ""
echo "  Africoin:"
echo "    APP_VARIANT=africoin eas build --platform android --profile africoin --local"
echo ""
echo "Build time: 30-60 minutes (first build)"
echo "Output: build-[timestamp].apk"
echo ""
