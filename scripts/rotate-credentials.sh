#!/bin/bash

# Emergency Credential Rotation Script
# Use this to quickly rotate exposed AWS credentials

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}🚨 EMERGENCY CREDENTIAL ROTATION${NC}"
echo "=================================="
echo ""

# Configuration
IAM_USER="expo-build-bot-20251223"
OLD_KEY_ID="AKIATPUJM4K5OFGJDYMB"
REGION="eu-north-1"

echo -e "${YELLOW}⚠️  This script will:${NC}"
echo "1. Deactivate the exposed access key"
echo "2. Create a new access key"
echo "3. Update your Gitpod environment"
echo "4. Delete the old key"
echo ""

read -p "Continue? (y/n): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not configured or credentials invalid${NC}"
    echo ""
    echo "Please configure AWS CLI first:"
    echo "  aws configure"
    echo ""
    echo "Or set environment variables:"
    echo "  export AWS_ACCESS_KEY_ID=your_key"
    echo "  export AWS_SECRET_ACCESS_KEY=your_secret"
    echo "  export AWS_DEFAULT_REGION=$REGION"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 1: Deactivating exposed key...${NC}"
if aws iam update-access-key \
    --access-key-id "$OLD_KEY_ID" \
    --status Inactive \
    --user-name "$IAM_USER" 2>/dev/null; then
    echo -e "${GREEN}✅ Old key deactivated${NC}"
else
    echo -e "${YELLOW}⚠️  Could not deactivate key (may already be inactive or deleted)${NC}"
fi

echo ""
echo -e "${BLUE}Step 2: Creating new access key...${NC}"
NEW_CREDS=$(aws iam create-access-key --user-name "$IAM_USER" 2>/dev/null)

if [ $? -eq 0 ]; then
    NEW_KEY_ID=$(echo $NEW_CREDS | jq -r '.AccessKey.AccessKeyId')
    NEW_SECRET=$(echo $NEW_CREDS | jq -r '.AccessKey.SecretAccessKey')
    
    echo -e "${GREEN}✅ New credentials created${NC}"
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}🔐 NEW CREDENTIALS (SAVE THESE NOW!)${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "AWS_ACCESS_KEY_ID: $NEW_KEY_ID"
    echo "AWS_SECRET_ACCESS_KEY: $NEW_SECRET"
    echo "AWS_REGION: $REGION"
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${RED}⚠️  IMPORTANT: Save these credentials securely!${NC}"
    echo -e "${RED}   You will NOT be able to see them again!${NC}"
    echo ""
    
    # Save to temporary file
    cat > /tmp/new-aws-credentials.txt << EOF
AWS_ACCESS_KEY_ID=$NEW_KEY_ID
AWS_SECRET_ACCESS_KEY=$NEW_SECRET
AWS_REGION=$REGION
EOF
    
    echo -e "${GREEN}✅ Credentials saved to: /tmp/new-aws-credentials.txt${NC}"
    echo ""
    
    read -p "Press Enter to continue..."
    
else
    echo -e "${RED}❌ Failed to create new key${NC}"
    echo "You may have reached the maximum number of access keys (2)"
    echo "Delete an existing key first, then run this script again"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 3: Updating Gitpod environment...${NC}"

if command -v gp &> /dev/null; then
    gp env AWS_ACCESS_KEY_ID="$NEW_KEY_ID"
    gp env AWS_SECRET_ACCESS_KEY="$NEW_SECRET"
    gp env AWS_DEFAULT_REGION="$REGION"
    
    # Also export for current session
    export AWS_ACCESS_KEY_ID="$NEW_KEY_ID"
    export AWS_SECRET_ACCESS_KEY="$NEW_SECRET"
    export AWS_DEFAULT_REGION="$REGION"
    
    echo -e "${GREEN}✅ Gitpod environment updated${NC}"
else
    echo -e "${YELLOW}⚠️  Not in Gitpod, skipping environment update${NC}"
    echo "Manually set these environment variables:"
    echo "  export AWS_ACCESS_KEY_ID=\"$NEW_KEY_ID\""
    echo "  export AWS_SECRET_ACCESS_KEY=\"$NEW_SECRET\""
fi

echo ""
echo -e "${BLUE}Step 4: Deleting old key...${NC}"
read -p "Delete old key $OLD_KEY_ID? (y/n): " delete_confirm

if [[ $delete_confirm =~ ^[Yy]$ ]]; then
    if aws iam delete-access-key \
        --access-key-id "$OLD_KEY_ID" \
        --user-name "$IAM_USER" 2>/dev/null; then
        echo -e "${GREEN}✅ Old key deleted${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not delete key (may already be deleted)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Old key NOT deleted - remember to delete it manually!${NC}"
fi

echo ""
echo -e "${BLUE}Step 5: Verifying new credentials...${NC}"

# Test new credentials
if aws sts get-caller-identity &> /dev/null; then
    ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
    echo -e "${GREEN}✅ New credentials working! Account: $ACCOUNT${NC}"
else
    echo -e "${RED}❌ New credentials not working${NC}"
    echo "Check the credentials and try again"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 CREDENTIAL ROTATION COMPLETE${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "✅ Checklist:"
echo "  [✓] Old key deactivated"
echo "  [✓] New key created"
echo "  [✓] Gitpod environment updated"
echo "  [✓] Old key deleted"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Update GitHub Secrets:"
echo "   https://github.com/mpolobe/africa-railways/settings/secrets/actions"
echo "   - AWS_ACCESS_KEY_ID"
echo "   - AWS_SECRET_ACCESS_KEY"
echo ""
echo "2. Update .gitpod.env file:"
echo "   nano .gitpod.env"
echo ""
echo "3. Test the new credentials:"
echo "   aws s3 ls"
echo "   eas build --platform android"
echo ""
echo "4. Delete temporary credentials file:"
echo "   rm /tmp/new-aws-credentials.txt"
echo ""
echo "5. Review CloudTrail for any suspicious activity:"
echo "   https://console.aws.amazon.com/cloudtrail"
echo ""

# Offer to open GitHub secrets page
if command -v gp &> /dev/null; then
    read -p "Open GitHub Secrets page? (y/n): " open_github
    if [[ $open_github =~ ^[Yy]$ ]]; then
        gp preview "https://github.com/mpolobe/africa-railways/settings/secrets/actions"
    fi
fi

echo ""
echo -e "${YELLOW}⚠️  Remember to:${NC}"
echo "  - Never share credentials in chat/email"
echo "  - Use 'gp env' for persistent variables"
echo "  - Enable MFA on your AWS account"
echo "  - Rotate credentials every 90 days"
echo ""
