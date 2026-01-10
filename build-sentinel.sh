#!/bin/bash

# Build script for Sentinel mobile app
# Usage: ./build-sentinel.sh [local|android|ios|both]

set -e

MODE=${1:-local}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR/SmartphoneApp"

echo "🛡️  Sentinel Mobile App Build Script"
echo "======================================"
echo ""

cd "$APP_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
    echo ""
fi

case $MODE in
    local)
        echo "🧪 Starting Sentinel app in development mode..."
        echo ""
        echo "The app will open in Expo Go on your device."
        echo "Make sure you have Expo Go installed on your phone."
        echo ""
        APP_VARIANT=sentinel npx expo start
        ;;
        
    android)
        echo "🤖 Building Sentinel Android APK..."
        echo ""
        
        # Check for EXPO_TOKEN
        if [ -z "$EXPO_TOKEN" ]; then
            echo "⚠️  EXPO_TOKEN not set. Checking for .env file..."
            if [ -f ".env" ]; then
                export $(cat .env | grep EXPO_TOKEN | xargs)
            fi
            
            if [ -z "$EXPO_TOKEN" ]; then
                echo "❌ ERROR: EXPO_TOKEN is required for building"
                echo ""
                echo "Please set EXPO_TOKEN environment variable:"
                echo "  export EXPO_TOKEN=your_token_here"
                echo ""
                echo "Or create a .env file with:"
                echo "  EXPO_TOKEN=your_token_here"
                exit 1
            fi
        fi
        
        echo "✅ EXPO_TOKEN is set"
        echo ""
        echo "Building with EAS..."
        APP_VARIANT=sentinel eas build --platform android --profile sentinel --non-interactive
        ;;
        
    ios)
        echo "🍎 Building Sentinel iOS IPA..."
        echo ""
        
        # Check for EXPO_TOKEN
        if [ -z "$EXPO_TOKEN" ]; then
            echo "⚠️  EXPO_TOKEN not set. Checking for .env file..."
            if [ -f ".env" ]; then
                export $(cat .env | grep EXPO_TOKEN | xargs)
            fi
            
            if [ -z "$EXPO_TOKEN" ]; then
                echo "❌ ERROR: EXPO_TOKEN is required for building"
                exit 1
            fi
        fi
        
        echo "✅ EXPO_TOKEN is set"
        echo ""
        echo "Building with EAS..."
        APP_VARIANT=sentinel eas build --platform ios --profile sentinel --non-interactive
        ;;
        
    both)
        echo "📱 Building Sentinel for both Android and iOS..."
        echo ""
        
        # Check for EXPO_TOKEN
        if [ -z "$EXPO_TOKEN" ]; then
            echo "⚠️  EXPO_TOKEN not set. Checking for .env file..."
            if [ -f ".env" ]; then
                export $(cat .env | grep EXPO_TOKEN | xargs)
            fi
            
            if [ -z "$EXPO_TOKEN" ]; then
                echo "❌ ERROR: EXPO_TOKEN is required for building"
                exit 1
            fi
        fi
        
        echo "✅ EXPO_TOKEN is set"
        echo ""
        echo "Building with EAS..."
        APP_VARIANT=sentinel eas build --platform all --profile sentinel --non-interactive
        ;;
        
    *)
        echo "❌ Invalid mode: $MODE"
        echo ""
        echo "Usage: ./build-sentinel.sh [local|android|ios|both]"
        echo ""
        echo "Modes:"
        echo "  local   - Start development server (default)"
        echo "  android - Build Android APK"
        echo "  ios     - Build iOS IPA"
        echo "  both    - Build for both platforms"
        exit 1
        ;;
esac

echo ""
echo "✅ Done!"
