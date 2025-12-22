#!/bin/bash

# 🚀 Build Both Apps - Railways and Africoin

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🚀 Building Both Apps - Railways & Africoin              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if eas-cli is available
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g eas-cli
fi

# Login check
echo "🔐 Checking authentication..."
if ! eas whoami &> /dev/null; then
    echo "Please login to Expo:"
    eas login
fi

echo ""
echo "You can build both apps:"
echo "  1) Sequential (one after another)"
echo "  2) Parallel (both at once)"
echo ""
read -p "Choose option (1 or 2): " BUILD_OPTION

if [ "$BUILD_OPTION" = "1" ]; then
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║  🚂 Building Railways App First                           ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    
    eas build --platform android --profile railways --non-interactive
    
    echo ""
    echo "✅ Railways build started!"
    echo ""
    read -p "Press Enter to start Africoin build..."
    
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║  💰 Building Africoin App                                 ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    
    eas build --platform android --profile africoin --non-interactive
    
    echo ""
    echo "✅ Africoin build started!"
    
elif [ "$BUILD_OPTION" = "2" ]; then
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║  🚀 Building Both Apps in Parallel                        ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    
    echo "🚂 Starting Railways build..."
    eas build --platform android --profile railways --non-interactive &
    RAILWAYS_PID=$!
    
    sleep 5
    
    echo "💰 Starting Africoin build..."
    eas build --platform android --profile africoin --non-interactive &
    AFRICOIN_PID=$!
    
    echo ""
    echo "✅ Both builds started!"
    echo "   Railways PID: $RAILWAYS_PID"
    echo "   Africoin PID: $AFRICOIN_PID"
    
else
    echo "❌ Invalid option"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✅ Build(s) Triggered!                                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Monitor your builds:"
echo ""
echo "🚂 Railways:"
echo "   https://expo.dev/accounts/mpolobe/projects/africa-railways/builds"
echo ""
echo "💰 Africoin:"
echo "   https://expo.dev/accounts/mpolobe/projects/africoin-app/builds"
echo ""
echo "GitHub Actions:"
echo "   https://github.com/mpolobe/africa-railways/actions"
echo ""
echo "⏱️  Expected time: 20-30 minutes per app"
echo ""
