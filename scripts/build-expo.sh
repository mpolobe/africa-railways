#!/bin/bash
set -e

echo "🚀 Expo Cloud Build Script"
echo "==========================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
log_info() {
    echo -e "${BLUE}▶ $1${NC}"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

log_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check Node.js
log_info "1. Checking Environment"
node --version
npm --version

# Check EAS CLI
if ! command -v eas &> /dev/null; then
    log_warning "EAS CLI not found. Installing..."
    npm install -g eas-cli
fi
eas --version

# Check login status
log_info "2. Checking Expo Login"
if ! eas whoami &> /dev/null; then
    log_warning "Not logged into Expo"
    
    if [ -n "$EXPO_TOKEN" ]; then
        log_info "Logging in with token..."
        eas login --token "$EXPO_TOKEN" --non-interactive
    else
        log_warning "No EXPO_TOKEN found in environment"
        echo ""
        echo "Please login with one of these methods:"
        echo "1. Set EXPO_TOKEN environment variable"
        echo "2. Run: eas login (interactive)"
        echo "3. Create .env file with EXPO_TOKEN"
        echo ""
        read -p "Enter Expo token (or press Enter for interactive login): " USER_TOKEN
        
        if [ -n "$USER_TOKEN" ]; then
            EXPO_TOKEN=$USER_TOKEN
            eas login --token "$EXPO_TOKEN" --non-interactive
        else
            eas login
        fi
    fi
else
    log_success "Already logged into Expo as: $(eas whoami)"
fi

# Navigate to SmartphoneApp directory
cd "$(dirname "$0")/../SmartphoneApp" || cd SmartphoneApp || {
    log_error "SmartphoneApp directory not found"
    exit 1
}

# Create builds directory
BUILD_DIR="../expo-builds"
mkdir -p $BUILD_DIR
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Platform selection
log_info "3. Select Build Platform"
echo ""
echo "Available platforms:"
echo "1) Android (APK)"
echo "2) iOS (IPA) - Simulator"
echo "3) Web (Static)"
echo "4) All platforms"
echo ""
read -p "Enter choice (1-4): " PLATFORM_CHOICE

case $PLATFORM_CHOICE in
    1)
        PLATFORMS=("android")
        EXTENSIONS=("apk")
        ;;
    2)
        PLATFORMS=("ios")
        EXTENSIONS=("ipa")
        log_warning "iOS simulator builds only in GitPod"
        ;;
    3)
        PLATFORMS=("web")
        EXTENSIONS=("zip")
        ;;
    4)
        PLATFORMS=("android" "ios" "web")
        EXTENSIONS=("apk" "ipa" "zip")
        log_warning "iOS will be simulator build only"
        ;;
    *)
        log_error "Invalid choice"
        exit 1
        ;;
esac

# Build profile selection
log_info "4. Select Build Profile"
echo ""
echo "Available profiles:"
echo "1) Development (fast refresh, debug)"
echo "2) Preview (internal testing)"
echo "3) Production (release)"
echo ""
read -p "Enter choice (1-3): " PROFILE_CHOICE

case $PROFILE_CHOICE in
    1)
        PROFILE="development"
        ;;
    2)
        PROFILE="preview"
        ;;
    3)
        PROFILE="production"
        ;;
    *)
        PROFILE="preview"
        log_warning "Using default: preview"
        ;;
esac

# Confirm build
log_info "5. Build Summary"
echo ""
echo "• Timestamp: $TIMESTAMP"
echo "• Profile: $PROFILE"
echo "• Platforms: ${PLATFORMS[*]}"
echo "• Output: $BUILD_DIR/"
echo ""
read -p "Start build? [Y/n]: " CONFIRM
if [[ $CONFIRM =~ ^[Nn]$ ]]; then
    log_warning "Build cancelled"
    exit 0
fi

# Build function
build_platform() {
    local platform=$1
    local extension=$2
    local output_file="$BUILD_DIR/$platform-$TIMESTAMP.$extension"
    
    log_info "Building for $platform ($PROFILE)..."
    
    case $platform in
        android)
            eas build \
                --platform android \
                --profile $PROFILE \
                --non-interactive \
                --output "$output_file" \
                --local
            ;;
        ios)
            # iOS simulator build (works in GitPod)
            eas build \
                --platform ios \
                --profile $PROFILE \
                --non-interactive \
                --output "$output_file" \
                --local \
                --simulator
            ;;
        web)
            # Web build (no EAS needed)
            npx expo export --platform web --output-dir "$BUILD_DIR/web-$TIMESTAMP"
            cd "$BUILD_DIR/web-$TIMESTAMP"
            zip -r "../web-$TIMESTAMP.zip" .
            cd - > /dev/null
            output_file="$BUILD_DIR/web-$TIMESTAMP.zip"
            ;;
    esac
    
    if [ -f "$output_file" ]; then
        log_success "$platform build complete: $(basename $output_file)"
        echo "$output_file"
    else
        log_error "$platform build failed"
        echo ""
    fi
}

# Main build loop
log_info "6. Starting Build Process"
SUCCESSFUL_BUILDS=0
TOTAL_BUILDS=${#PLATFORMS[@]}
BUILT_FILES=()

for i in "${!PLATFORMS[@]}"; do
    platform=${PLATFORMS[$i]}
    extension=${EXTENSIONS[$i]}
    
    log_info "Processing $platform..."
    
    # Build
    built_file=$(build_platform "$platform" "$extension")
    
    if [ -n "$built_file" ] && [ -f "$built_file" ]; then
        ((SUCCESSFUL_BUILDS++))
        BUILT_FILES+=("$built_file")
        
        # Show file info
        echo "  • Size: $(du -h "$built_file" | cut -f1)"
        echo "  • Path: $built_file"
    fi
    
    echo ""
done

# Generate build summary
log_info "7. Build Summary"
echo "=================="
echo "Timestamp: $TIMESTAMP"
echo "Profile: $PROFILE"
echo "Successful: $SUCCESSFUL_BUILDS/$TOTAL_BUILDS"
echo "Build directory: $BUILD_DIR/"
echo ""

# List generated files
if [ $SUCCESSFUL_BUILDS -gt 0 ]; then
    echo "📁 Generated files:"
    ls -lh $BUILD_DIR/*$TIMESTAMP* 2>/dev/null || ls -lh $BUILD_DIR/
    echo ""
    
    # Generate QR codes for easy download
    if command -v qrencode &> /dev/null; then
        log_info "📱 QR Codes for Local Files:"
        echo ""
        for file in "${BUILT_FILES[@]}"; do
            if [ -f "$file" ]; then
                echo "$(basename $file):"
                qrencode -t UTF8 "file://$(realpath $file)" -m 1
                echo ""
            fi
        done
    fi
    
    # Check for S3 upload option
    if [ -f "../.s3-bucket-name" ] || [ -n "$AWS_S3_BUCKET" ]; then
        echo ""
        read -p "Upload to S3? [y/N]: " UPLOAD_S3
        if [[ $UPLOAD_S3 =~ ^[Yy]$ ]]; then
            if [ -f "../scripts/upload-s3.sh" ]; then
                cd ..
                ./scripts/upload-s3.sh "${BUILT_FILES[@]}"
            else
                log_warning "upload-s3.sh not found. Run ./scripts/setup-s3-gitpod.sh first"
            fi
        fi
    fi
fi

log_success "Build process complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Test builds locally"
echo "2. Upload to S3 (if configured)"
echo "3. Share with testers"
echo "4. Deploy to stores"

# Save build info
cat > "$BUILD_DIR/build-info-$TIMESTAMP.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "profile": "$PROFILE",
  "platforms": [$(printf '"%s",' "${PLATFORMS[@]}" | sed 's/,$//')]  ,
  "successful": $SUCCESSFUL_BUILDS,
  "total": $TOTAL_BUILDS,
  "directory": "$BUILD_DIR",
  "files": [$(printf '"%s",' "${BUILT_FILES[@]}" | sed 's/,$//')]
}
EOF

log_success "Build info saved to: $BUILD_DIR/build-info-$TIMESTAMP.json"
