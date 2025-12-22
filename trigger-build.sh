#!/bin/bash

# 🚀 Africa Railways - GitHub Actions Build Trigger Script
# This script helps you set up and trigger EAS builds via GitHub Actions

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_OWNER="mpolobe"
REPO_NAME="africa-railways"
WORKFLOW_FILE="eas-build.yml"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🚂 Africa Railways - GitHub Actions Build Trigger       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if gh CLI is authenticated
check_gh_auth() {
    if gh auth status >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Step 1: Check prerequisites
echo -e "${YELLOW}📋 Step 1: Checking prerequisites...${NC}"
echo ""

if ! command_exists gh; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo ""
    echo "Please install it:"
    echo "  • macOS: brew install gh"
    echo "  • Linux: https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
    echo "  • Or use the web interface: https://github.com/${REPO_OWNER}/${REPO_NAME}/actions"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI is installed${NC}"

# Step 2: Check authentication
echo ""
echo -e "${YELLOW}📋 Step 2: Checking GitHub authentication...${NC}"
echo ""

if ! check_gh_auth; then
    echo -e "${YELLOW}⚠️  Not authenticated with GitHub${NC}"
    echo ""
    echo "Authenticating now..."
    gh auth login
    echo ""
fi

if check_gh_auth; then
    GITHUB_USER=$(gh api user --jq .login)
    echo -e "${GREEN}✅ Authenticated as: ${GITHUB_USER}${NC}"
else
    echo -e "${RED}❌ Authentication failed${NC}"
    exit 1
fi

# Step 3: Check if EXPO_TOKEN secret exists
echo ""
echo -e "${YELLOW}📋 Step 3: Checking for EXPO_TOKEN secret...${NC}"
echo ""

# Try to list secrets (this will fail if we don't have permission, but that's ok)
if gh secret list -R "${REPO_OWNER}/${REPO_NAME}" 2>/dev/null | grep -q "EXPO_TOKEN"; then
    echo -e "${GREEN}✅ EXPO_TOKEN secret is configured${NC}"
    HAS_TOKEN=true
else
    echo -e "${YELLOW}⚠️  EXPO_TOKEN secret not found or cannot verify${NC}"
    HAS_TOKEN=false
fi

# Step 4: Offer to set EXPO_TOKEN if not found
if [ "$HAS_TOKEN" = false ]; then
    echo ""
    echo -e "${YELLOW}📋 Step 4: Setting up EXPO_TOKEN...${NC}"
    echo ""
    echo "You need an Expo access token to build your app."
    echo ""
    echo "To get your token:"
    echo "  1. Go to: https://expo.dev/accounts/[your-account]/settings/access-tokens"
    echo "  2. Click 'Create Token'"
    echo "  3. Name it 'GitHub Actions'"
    echo "  4. Copy the token"
    echo ""
    echo "Or create one via CLI:"
    echo "  npx eas-cli@latest login"
    echo "  npx eas-cli@latest token:create"
    echo ""
    
    read -p "Do you have your EXPO_TOKEN ready? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        read -sp "Paste your EXPO_TOKEN: " EXPO_TOKEN
        echo ""
        
        if [ -n "$EXPO_TOKEN" ]; then
            echo ""
            echo "Setting secret..."
            if gh secret set EXPO_TOKEN -b"$EXPO_TOKEN" -R "${REPO_OWNER}/${REPO_NAME}"; then
                echo -e "${GREEN}✅ EXPO_TOKEN secret set successfully${NC}"
                HAS_TOKEN=true
            else
                echo -e "${RED}❌ Failed to set EXPO_TOKEN secret${NC}"
                exit 1
            fi
        else
            echo -e "${RED}❌ No token provided${NC}"
            exit 1
        fi
    else
        echo ""
        echo -e "${YELLOW}Please set up your EXPO_TOKEN first:${NC}"
        echo "  1. Get token from: https://expo.dev/accounts/[your-account]/settings/access-tokens"
        echo "  2. Run: gh secret set EXPO_TOKEN -R ${REPO_OWNER}/${REPO_NAME}"
        echo "  3. Run this script again"
        echo ""
        exit 1
    fi
fi

# Step 5: Select build options
echo ""
echo -e "${YELLOW}📋 Step 5: Configure build options...${NC}"
echo ""

# Select platform
echo "Select platform:"
echo "  1) Android (recommended for first build)"
echo "  2) iOS (requires Apple Developer account)"
echo "  3) All (both Android and iOS)"
echo ""
read -p "Enter choice (1-3): " PLATFORM_CHOICE

case $PLATFORM_CHOICE in
    1) PLATFORM="android" ;;
    2) PLATFORM="ios" ;;
    3) PLATFORM="all" ;;
    *) 
        echo -e "${RED}Invalid choice. Defaulting to Android.${NC}"
        PLATFORM="android"
        ;;
esac

echo -e "${GREEN}✅ Platform: ${PLATFORM}${NC}"
echo ""

# Select profile
echo "Select app variant:"
echo "  1) Railways (Africa Railways Hub)"
echo "  2) Africoin (Africoin Wallet)"
echo "  3) Production (default)"
echo ""
read -p "Enter choice (1-3): " PROFILE_CHOICE

case $PROFILE_CHOICE in
    1) PROFILE="railways" ;;
    2) PROFILE="africoin" ;;
    3) PROFILE="production" ;;
    *) 
        echo -e "${RED}Invalid choice. Defaulting to Railways.${NC}"
        PROFILE="railways"
        ;;
esac

echo -e "${GREEN}✅ Profile: ${PROFILE}${NC}"
echo ""

# Step 6: Confirm and trigger
echo -e "${YELLOW}📋 Step 6: Ready to trigger build!${NC}"
echo ""
echo "Build configuration:"
echo "  • Repository: ${REPO_OWNER}/${REPO_NAME}"
echo "  • Platform: ${PLATFORM}"
echo "  • Profile: ${PROFILE}"
echo "  • Workflow: ${WORKFLOW_FILE}"
echo ""

if [ "$PROFILE" = "railways" ]; then
    echo "This will build: ${BLUE}Africa Railways Hub${NC}"
    echo "  • Package: com.mpolobe.railways"
    echo "  • Theme: Blue"
elif [ "$PROFILE" = "africoin" ]; then
    echo "This will build: ${YELLOW}Africoin Wallet${NC}"
    echo "  • Package: com.mpolobe.africoin"
    echo "  • Theme: Gold"
fi

echo ""
read -p "Trigger build now? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Build cancelled.${NC}"
    exit 0
fi

# Trigger the workflow
echo ""
echo -e "${BLUE}🚀 Triggering build...${NC}"
echo ""

if gh workflow run "${WORKFLOW_FILE}" \
    -R "${REPO_OWNER}/${REPO_NAME}" \
    -f platform="${PLATFORM}" \
    -f profile="${PROFILE}"; then
    
    echo ""
    echo -e "${GREEN}✅ Build triggered successfully!${NC}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${GREEN}🎉 Your build is now running!${NC}"
    echo ""
    echo "What happens next:"
    echo "  1. GitHub Actions starts the workflow (~1 min)"
    echo "  2. EAS builds your app (~15-25 min)"
    echo "  3. Build completes and uploads (~1 min)"
    echo ""
    echo "Total time: ~20-30 minutes"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Monitor your build:"
    echo ""
    echo "  • GitHub Actions:"
    echo "    https://github.com/${REPO_OWNER}/${REPO_NAME}/actions"
    echo ""
    echo "  • Expo Dashboard:"
    if [ "$PROFILE" = "railways" ]; then
        echo "    https://expo.dev/accounts/mpolobe/projects/africa-railways/builds"
    elif [ "$PROFILE" = "africoin" ]; then
        echo "    https://expo.dev/accounts/mpolobe/projects/africoin-app/builds"
    else
        echo "    https://expo.dev/accounts/mpolobe/projects/africa-railways/builds"
    fi
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Offer to open browser
    read -p "Open GitHub Actions in browser? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command_exists open; then
            open "https://github.com/${REPO_OWNER}/${REPO_NAME}/actions"
        elif command_exists xdg-open; then
            xdg-open "https://github.com/${REPO_OWNER}/${REPO_NAME}/actions"
        else
            echo "Please open: https://github.com/${REPO_OWNER}/${REPO_NAME}/actions"
        fi
    fi
    
    echo ""
    echo -e "${GREEN}✨ Build triggered successfully! Check the links above for progress.${NC}"
    echo ""
    
else
    echo ""
    echo -e "${RED}❌ Failed to trigger build${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  • Check your GitHub permissions"
    echo "  • Verify the workflow file exists"
    echo "  • Try manually: https://github.com/${REPO_OWNER}/${REPO_NAME}/actions"
    echo ""
    exit 1
fi
