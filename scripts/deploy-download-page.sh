#!/bin/bash

# Deploy Download Page to S3
# Uploads the download.html page to S3 bucket

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📤 Deploying Download Page to S3${NC}"
echo "=================================="
echo ""

# Configuration
BUCKET_NAME="expo-builds-239732581050-20251223"
REGION="eu-north-1"
DOWNLOAD_PAGE="download.html"

# Check if download page exists
if [ ! -f "$DOWNLOAD_PAGE" ]; then
    echo -e "${RED}❌ Error: $DOWNLOAD_PAGE not found${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    echo "Run: aws configure"
    exit 1
fi

echo -e "${BLUE}📋 Configuration:${NC}"
echo "  Bucket: $BUCKET_NAME"
echo "  Region: $REGION"
echo "  File: $DOWNLOAD_PAGE"
echo ""

# Upload download page
echo -e "${YELLOW}⏳ Uploading download page...${NC}"

aws s3 cp "$DOWNLOAD_PAGE" "s3://$BUCKET_NAME/index.html" \
    --content-type "text/html" \
    --cache-control "max-age=300" \
    --metadata "updated=$(date -u +%Y-%m-%dT%H:%M:%SZ)"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Download page uploaded successfully${NC}"
else
    echo -e "${RED}❌ Upload failed${NC}"
    exit 1
fi

# Also upload as download.html
aws s3 cp "$DOWNLOAD_PAGE" "s3://$BUCKET_NAME/download.html" \
    --content-type "text/html" \
    --cache-control "max-age=300"

echo -e "${GREEN}✅ Also uploaded as download.html${NC}"

# Configure bucket for website hosting
echo ""
echo -e "${YELLOW}⏳ Configuring website hosting...${NC}"

aws s3 website "s3://$BUCKET_NAME" \
    --index-document index.html \
    --error-document index.html

echo -e "${GREEN}✅ Website hosting configured${NC}"

# Generate URLs
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📱 Download Page URLs:${NC}"
echo ""
echo "Website URL:"
echo "  http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
echo ""
echo "Direct S3 URL:"
echo "  https://$BUCKET_NAME.s3.$REGION.amazonaws.com/index.html"
echo ""
echo "Alternative URL:"
echo "  https://$BUCKET_NAME.s3.$REGION.amazonaws.com/download.html"
echo ""
echo -e "${BLUE}🔗 S3 Console:${NC}"
echo "  https://s3.console.aws.amazon.com/s3/buckets/$BUCKET_NAME"
echo ""
echo -e "${YELLOW}💡 Tip: Share the website URL with your users!${NC}"
echo ""

# Test the page
echo -e "${BLUE}🧪 Testing page...${NC}"
WEBSITE_URL="http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"

if curl -s -o /dev/null -w "%{http_code}" "$WEBSITE_URL" | grep -q "200"; then
    echo -e "${GREEN}✅ Page is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Page may not be publicly accessible${NC}"
    echo "Check bucket policy for public read access"
fi

echo ""
