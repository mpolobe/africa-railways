#!/bin/bash

# Deploy Caddy Reverse Proxy to Railway
# This script sets up path-based routing for www.africarailways.com/occ

set -e

echo "🚂 Africa Railways - Caddy Proxy Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found${NC}"
    echo "Install it with: npm i -g @railway/cli"
    exit 1
fi

echo -e "${GREEN}✅ Railway CLI found${NC}"

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Railway${NC}"
    echo "Logging in..."
    railway login
fi

echo -e "${GREEN}✅ Logged in to Railway${NC}"

# Check if Caddyfile exists
if [ ! -f "Caddyfile" ]; then
    echo -e "${RED}❌ Caddyfile not found${NC}"
    echo "Please ensure Caddyfile exists in the project root"
    exit 1
fi

echo -e "${GREEN}✅ Caddyfile found${NC}"

# Check if Dockerfile.proxy exists
if [ ! -f "Dockerfile.proxy" ]; then
    echo -e "${RED}❌ Dockerfile.proxy not found${NC}"
    echo "Please ensure Dockerfile.proxy exists in the project root"
    exit 1
fi

echo -e "${GREEN}✅ Dockerfile.proxy found${NC}"

# Verify GCP OCC Dashboard is accessible
echo ""
echo "🔍 Verifying GCP OCC Dashboard..."
if curl -s -f -m 5 http://34.10.37.126:8080/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OCC Dashboard is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: OCC Dashboard at 34.10.37.126:8080 is not responding${NC}"
    echo "   Make sure the OCC Dashboard is running on your GCP VM"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Link to Railway project (if not already linked)
echo ""
echo "🔗 Linking to Railway project..."
if ! railway status &> /dev/null; then
    echo "Please select your Railway project:"
    railway link
else
    echo -e "${GREEN}✅ Already linked to Railway project${NC}"
fi

# Create or select proxy service
echo ""
echo "📦 Setting up proxy service..."
echo "If you don't have a 'caddy-proxy' service, create one in Railway dashboard first"
read -p "Press Enter to continue..."

# Set environment variables
echo ""
echo "⚙️  Setting environment variables..."
railway variables set PORT=8080 --service caddy-proxy 2>/dev/null || echo "Note: Set PORT=8080 manually in Railway dashboard"

# Deploy
echo ""
echo "🚀 Deploying Caddy proxy to Railway..."
echo "This may take a few minutes..."

# Build and deploy using Docker
railway up --service caddy-proxy --dockerfile Dockerfile.proxy

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Configure domain in Railway dashboard:"
echo "   - Go to your Railway project"
echo "   - Navigate to caddy-proxy service"
echo "   - Settings → Domains"
echo "   - Add: www.africarailways.com"
echo ""
echo "2. Wait for DNS propagation (up to 48 hours)"
echo ""
echo "3. Test the deployment:"
echo "   Main site:     https://www.africarailways.com/"
echo "   OCC Dashboard: https://www.africarailways.com/occ"
echo ""
echo "4. Monitor logs:"
echo "   railway logs --service caddy-proxy --follow"
echo ""
echo "📚 For detailed instructions, see: OCC_RAILWAY_DEPLOYMENT.md"
echo ""
