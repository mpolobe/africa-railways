#!/bin/bash

# Environment Variables Setup Script for Gitpod
# Interactive script to set up all required environment variables

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔧 Environment Variables Setup${NC}"
echo "================================"
echo ""

# Function to set persistent variable
set_persistent_var() {
    local var_name=$1
    local var_value=$2
    local var_scope=${3:-user}
    
    gp env "$var_name=$var_value" --scope "$var_scope"
    export "$var_name=$var_value"
    echo -e "${GREEN}✅ Set $var_name${NC}"
}

# Function to prompt for variable
prompt_var() {
    local var_name=$1
    local var_description=$2
    local var_example=$3
    local is_secret=${4:-false}
    
    echo -e "\n${YELLOW}$var_description${NC}"
    if [ -n "$var_example" ]; then
        echo -e "${BLUE}Example: $var_example${NC}"
    fi
    
    if [ "$is_secret" = true ]; then
        read -sp "Enter $var_name: " var_value
        echo ""
    else
        read -p "Enter $var_name: " var_value
    fi
    
    if [ -n "$var_value" ]; then
        set_persistent_var "$var_name" "$var_value"
        return 0
    else
        echo -e "${RED}❌ Skipped $var_name${NC}"
        return 1
    fi
}

# Check if running in Gitpod
if [ -z "$GITPOD_WORKSPACE_ID" ]; then
    echo -e "${YELLOW}⚠️  Not running in Gitpod${NC}"
    echo "This script is optimized for Gitpod workspaces."
    echo "Variables will be set for current session only."
    echo ""
    read -p "Continue anyway? (y/n): " continue_anyway
    if [[ ! $continue_anyway =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# EXPO TOKEN
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}1. EXPO CONFIGURATION${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -n "$EXPO_TOKEN" ]; then
    echo -e "${GREEN}✅ EXPO_TOKEN already set${NC}"
    read -p "Update EXPO_TOKEN? (y/n): " update_expo
    if [[ $update_expo =~ ^[Yy]$ ]]; then
        prompt_var "EXPO_TOKEN" \
            "Expo Access Token (get from: https://expo.dev/accounts/[username]/settings/access-tokens)" \
            "exp1b1a2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0" \
            true
    fi
else
    prompt_var "EXPO_TOKEN" \
        "Expo Access Token (get from: https://expo.dev/accounts/[username]/settings/access-tokens)" \
        "exp1b1a2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0" \
        true
fi

# AWS CREDENTIALS
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}2. AWS CONFIGURATION${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

read -p "Configure AWS credentials? (y/n): " setup_aws
if [[ $setup_aws =~ ^[Yy]$ ]]; then
    prompt_var "AWS_ACCESS_KEY_ID" \
        "AWS Access Key ID (get from: https://console.aws.amazon.com/iam)" \
        "AKIAIOSFODNN7EXAMPLE" \
        true
    
    prompt_var "AWS_SECRET_ACCESS_KEY" \
        "AWS Secret Access Key" \
        "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" \
        true
    
    prompt_var "AWS_DEFAULT_REGION" \
        "AWS Default Region" \
        "us-east-1" \
        false
fi

# GITHUB TOKEN (Optional)
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}3. GITHUB CONFIGURATION (Optional)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

read -p "Configure GitHub token? (y/n): " setup_github
if [[ $setup_github =~ ^[Yy]$ ]]; then
    prompt_var "GITHUB_TOKEN" \
        "GitHub Personal Access Token (get from: https://github.com/settings/tokens)" \
        "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        true
fi

# NOTIFICATION SERVICES (Optional)
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}4. NOTIFICATION SERVICES (Optional)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

read -p "Configure notification services? (y/n): " setup_notifications
if [[ $setup_notifications =~ ^[Yy]$ ]]; then
    read -p "Configure Slack webhook? (y/n): " setup_slack
    if [[ $setup_slack =~ ^[Yy]$ ]]; then
        prompt_var "SLACK_WEBHOOK_URL" \
            "Slack Webhook URL" \
            "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \
            false
    fi
    
    read -p "Configure Discord webhook? (y/n): " setup_discord
    if [[ $setup_discord =~ ^[Yy]$ ]]; then
        prompt_var "DISCORD_WEBHOOK_URL" \
            "Discord Webhook URL" \
            "https://discord.com/api/webhooks/YOUR/WEBHOOK/URL" \
            false
    fi
fi

# SUMMARY
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 SETUP SUMMARY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo ""
echo "Configured variables:"
echo ""

# Check each variable
check_var() {
    local var_name=$1
    if [ -n "${!var_name}" ]; then
        echo -e "${GREEN}✅ $var_name${NC}"
    else
        echo -e "${RED}❌ $var_name (not set)${NC}"
    fi
}

check_var "EXPO_TOKEN"
check_var "AWS_ACCESS_KEY_ID"
check_var "AWS_SECRET_ACCESS_KEY"
check_var "AWS_DEFAULT_REGION"
check_var "GITHUB_TOKEN"
check_var "SLACK_WEBHOOK_URL"
check_var "DISCORD_WEBHOOK_URL"

# Save to .gitpod.env file
echo -e "\n${YELLOW}💾 Saving to .gitpod.env file...${NC}"

cat > .gitpod.env << EOF
# Generated by setup-env.sh on $(date)
# DO NOT commit this file to git

# Expo
EXPO_TOKEN=${EXPO_TOKEN:-}

# AWS
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-}
AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION:-us-east-1}

# GitHub (Optional)
GITHUB_TOKEN=${GITHUB_TOKEN:-}

# Notifications (Optional)
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL:-}
DISCORD_WEBHOOK_URL=${DISCORD_WEBHOOK_URL:-}
EOF

echo -e "${GREEN}✅ Saved to .gitpod.env${NC}"

# Verify critical services
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔍 VERIFICATION${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo ""

# Verify Expo
if [ -n "$EXPO_TOKEN" ]; then
    echo -n "Verifying Expo login... "
    if eas whoami &> /dev/null; then
        EXPO_USER=$(eas whoami 2>/dev/null)
        echo -e "${GREEN}✅ Logged in as: $EXPO_USER${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not verify (EAS CLI may not be installed)${NC}"
    fi
fi

# Verify AWS
if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
    echo -n "Verifying AWS credentials... "
    if aws sts get-caller-identity &> /dev/null; then
        AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
        echo -e "${GREEN}✅ Connected to account: $AWS_ACCOUNT${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not verify (AWS CLI may not be configured)${NC}"
    fi
fi

# Next steps
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 NEXT STEPS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo ""
echo "1. Setup AWS S3 bucket:"
echo "   ./scripts/setup-s3-gitpod.sh"
echo ""
echo "2. Build and deploy:"
echo "   ./scripts/deploy-build.sh"
echo ""
echo "3. Or use make commands:"
echo "   make eas-build"
echo ""
echo "4. Load variables in new terminal:"
echo "   source .gitpod.env"
echo ""

echo -e "${GREEN}✅ Setup complete!${NC}"
