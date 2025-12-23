#!/bin/bash

# EAS Build Helper Script
# Simplifies building Android and iOS apps with EAS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if EAS CLI is installed
check_eas_cli() {
    if ! command -v eas &> /dev/null; then
        print_error "EAS CLI not found!"
        print_info "Installing EAS CLI..."
        npm install -g eas-cli
        print_success "EAS CLI installed"
    else
        print_success "EAS CLI found"
    fi
}

# Check if logged in
check_login() {
    if ! eas whoami &> /dev/null; then
        print_warning "Not logged in to Expo"
        print_info "Please login with: eas login"
        exit 1
    else
        local username=$(eas whoami 2>/dev/null)
        print_success "Logged in as: $username"
    fi
}

# Show menu
show_menu() {
    print_header "EAS Build Menu"
    echo "1) Configure EAS Build"
    echo "2) Build Android (Local)"
    echo "3) Build Android (Cloud)"
    echo "4) Build iOS (Local - macOS only)"
    echo "5) Build iOS (Cloud)"
    echo "6) Build Both Platforms (Cloud)"
    echo "7) List Recent Builds"
    echo "8) View Build Logs"
    echo "9) Download Build"
    echo "0) Exit"
    echo ""
    read -p "Select option: " choice
}

# Configure EAS
configure_eas() {
    print_header "Configuring EAS Build"
    eas build:configure
    print_success "Configuration complete"
}

# Build Android Local
build_android_local() {
    print_header "Building Android (Local)"
    print_warning "This will take 10-20 minutes..."
    
    read -p "Build profile (development/preview/production) [preview]: " profile
    profile=${profile:-preview}
    
    read -p "Output filename [android-${profile}.apk]: " output
    output=${output:-android-${profile}.apk}
    
    print_info "Starting build..."
    eas build --platform android --local --profile "$profile" --output "./builds/$output"
    
    print_success "Build complete: ./builds/$output"
}

# Build Android Cloud
build_android_cloud() {
    print_header "Building Android (Cloud)"
    
    read -p "Build profile (development/preview/production) [preview]: " profile
    profile=${profile:-preview}
    
    print_info "Starting cloud build..."
    eas build --platform android --profile "$profile"
    
    print_success "Build submitted to EAS"
    print_info "Check status with: eas build:list"
}

# Build iOS Local
build_ios_local() {
    print_header "Building iOS (Local)"
    
    if [[ "$OSTYPE" != "darwin"* ]]; then
        print_error "iOS builds require macOS"
        return 1
    fi
    
    print_warning "This will take 15-30 minutes..."
    
    read -p "Build profile (development/preview/production) [preview]: " profile
    profile=${profile:-preview}
    
    read -p "Output filename [ios-${profile}.ipa]: " output
    output=${output:-ios-${profile}.ipa}
    
    print_info "Starting build..."
    eas build --platform ios --local --profile "$profile" --output "./builds/$output"
    
    print_success "Build complete: ./builds/$output"
}

# Build iOS Cloud
build_ios_cloud() {
    print_header "Building iOS (Cloud)"
    
    read -p "Build profile (development/preview/production) [preview]: " profile
    profile=${profile:-preview}
    
    print_info "Starting cloud build..."
    eas build --platform ios --profile "$profile"
    
    print_success "Build submitted to EAS"
    print_info "Check status with: eas build:list"
}

# Build Both Platforms
build_both() {
    print_header "Building Both Platforms (Cloud)"
    
    read -p "Build profile (development/preview/production) [preview]: " profile
    profile=${profile:-preview}
    
    print_info "Starting builds for both platforms..."
    eas build --platform all --profile "$profile"
    
    print_success "Builds submitted to EAS"
    print_info "Check status with: eas build:list"
}

# List builds
list_builds() {
    print_header "Recent Builds"
    eas build:list --limit 10
}

# View logs
view_logs() {
    print_header "View Build Logs"
    read -p "Enter build ID: " build_id
    
    if [ -z "$build_id" ]; then
        print_error "Build ID required"
        return 1
    fi
    
    eas build:view "$build_id"
}

# Download build
download_build() {
    print_header "Download Build"
    read -p "Enter build ID: " build_id
    
    if [ -z "$build_id" ]; then
        print_error "Build ID required"
        return 1
    fi
    
    mkdir -p ./builds
    cd ./builds
    eas build:download "$build_id"
    cd ..
    
    print_success "Build downloaded to ./builds/"
}

# Main script
main() {
    print_header "Africa Railways - EAS Build Helper"
    
    # Check prerequisites
    check_eas_cli
    check_login
    
    # Create builds directory
    mkdir -p ./builds
    
    # Show menu
    while true; do
        echo ""
        show_menu
        
        case $choice in
            1)
                configure_eas
                ;;
            2)
                build_android_local
                ;;
            3)
                build_android_cloud
                ;;
            4)
                build_ios_local
                ;;
            5)
                build_ios_cloud
                ;;
            6)
                build_both
                ;;
            7)
                list_builds
                ;;
            8)
                view_logs
                ;;
            9)
                download_build
                ;;
            0)
                print_info "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option"
                ;;
        esac
    done
}

# Run main function
main
