#!/bin/bash
set -e

echo "🚀 Expo Build and Deploy to S3"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Load AWS config
if [ -f .env.aws ]; then
    source .env.aws
else
    echo -e "${RED}❌ .env.aws not found. Run ./scripts/setup-s3-gitpod.sh first${NC}"
    exit 1
fi

# Check if bucket name exists
if [ ! -f .s3-bucket-name ]; then
    echo -e "${RED}❌ S3 bucket not configured. Run ./scripts/setup-s3-gitpod.sh first${NC}"
    exit 1
fi

BUCKET_NAME=$(cat .s3-bucket-name)
BUILD_DIR="./builds"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Create builds directory
mkdir -p $BUILD_DIR

# Function to build for a platform
build_platform() {
    local platform=$1
    local extension=$2
    
    echo -e "\n${GREEN}🏗️  Building for $platform...${NC}"
    
    # Check if EAS is logged in
    if ! eas whoami &> /dev/null; then
        echo -e "${YELLOW}⚠️  Not logged into EAS. Please run:${NC}"
        echo -e "   eas login"
        echo -e "${YELLOW}Or set EXPO_TOKEN environment variable${NC}"
        return 1
    fi
    
    # Build with EAS
    echo "Running: eas build --platform $platform --local --output $BUILD_DIR/app-$platform-$TIMESTAMP.$extension"
    
    if eas build --platform $platform --local --output "$BUILD_DIR/app-$platform-$TIMESTAMP.$extension" --non-interactive; then
        echo -e "${GREEN}✅ $platform build successful${NC}"
        return 0
    else
        echo -e "${RED}❌ $platform build failed${NC}"
        return 1
    fi
}

# Function to upload to S3
upload_to_s3() {
    local file=$1
    local platform=$2
    local extension=$3
    
    echo -e "\n${GREEN}📤 Uploading $platform build to S3...${NC}"
    
    # Upload file
    if aws s3 cp "$file" "s3://$BUCKET_NAME/builds/$(basename $file)" --acl public-read; then
        echo -e "${GREEN}✅ Upload successful${NC}"
        
        # Generate pre-signed URL (valid 7 days)
        PRESIGN_URL=$(aws s3 presign "s3://$BUCKET_NAME/builds/$(basename $file)" --expires-in 604800)
        echo -e "${GREEN}🔗 Download URL (7 days):${NC}"
        echo "$PRESIGN_URL"
        
        # Save URL to file
        echo "$PRESIGN_URL" > "$BUILD_DIR/$platform-url.txt"
        
        # Also create a short alias URL
        SHORT_NAME="latest-$platform.$extension"
        aws s3 cp "$file" "s3://$BUCKET_NAME/builds/$SHORT_NAME" --acl public-read
        
        echo -e "\n${GREEN}🔗 Latest build alias:${NC}"
        echo "https://$BUCKET_NAME.s3.amazonaws.com/builds/$SHORT_NAME"
        
        return 0
    else
        echo -e "${RED}❌ Upload failed${NC}"
        return 1
    fi
}

# Function to create deployment summary
create_summary() {
    echo -e "\n${GREEN}📊 Deployment Summary${NC}"
    echo "========================"
    echo "Timestamp: $TIMESTAMP"
    echo "Bucket: $BUCKET_NAME"
    echo "Region: $AWS_REGION"
    echo ""
    
    if [ -f "$BUILD_DIR/android-url.txt" ]; then
        echo "📱 Android:"
        echo "  • $(cat $BUILD_DIR/android-url.txt)"
        echo ""
    fi
    
    if [ -f "$BUILD_DIR/ios-url.txt" ]; then
        echo "🍏 iOS:"
        echo "  • $(cat $BUILD_DIR/ios-url.txt)"
        echo ""
    fi
    
    echo "🔗 Bucket Console:"
    echo "  • https://s3.console.aws.amazon.com/s3/buckets/$BUCKET_NAME"
    echo ""
    echo "📁 Build Directory: $BUILD_DIR/"
}

# Main execution
echo "📦 Build Configuration:"
echo "• Bucket: $BUCKET_NAME"
echo "• Build Dir: $BUILD_DIR"
echo "• Timestamp: $TIMESTAMP"
echo ""

# Ask which platforms to build
echo "Select platforms to build:"
echo "1) Android only"
echo "2) iOS only (requires macOS)"
echo "3) Both Android and iOS"
echo "4) Web only"
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        PLATFORMS=("android")
        EXTENSIONS=("apk")
        ;;
    2)
        PLATFORMS=("ios")
        EXTENSIONS=("ipa")
        ;;
    3)
        PLATFORMS=("android" "ios")
        EXTENSIONS=("apk" "ipa")
        ;;
    4)
        PLATFORMS=("web")
        EXTENSIONS=("zip")
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

# Build and deploy for each platform
SUCCESS_COUNT=0
TOTAL_COUNT=${#PLATFORMS[@]}

for i in "${!PLATFORMS[@]}"; do
    PLATFORM=${PLATFORMS[$i]}
    EXTENSION=${EXTENSIONS[$i]}
    
    OUTPUT_FILE="$BUILD_DIR/app-$PLATFORM-$TIMESTAMP.$EXTENSION"
    
    if build_platform $PLATFORM $EXTENSION; then
        if upload_to_s3 "$OUTPUT_FILE" "$PLATFORM" "$EXTENSION"; then
            ((SUCCESS_COUNT++))
        fi
    fi
done

# Create summary
create_summary

echo -e "\n${GREEN}🎉 Deployment Complete!${NC}"
echo "Successfully deployed $SUCCESS_COUNT/$TOTAL_COUNT platforms"
echo ""
echo "📋 Next: Share the download URLs with testers"

# Create QR codes for easy mobile access (if qrencode is installed)
if command -v qrencode &> /dev/null; then
    echo -e "\n${GREEN}📱 Generating QR codes...${NC}"
    
    for platform in "${PLATFORMS[@]}"; do
        if [ -f "$BUILD_DIR/$platform-url.txt" ]; then
            URL=$(cat "$BUILD_DIR/$platform-url.txt")
            qrencode -t UTF8 "$URL"
            echo "$platform: $URL"
            echo ""
        fi
    done
fi
