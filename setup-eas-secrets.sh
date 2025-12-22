#!/bin/bash

# 🔐 EAS Secrets Setup Script
# Sets up all required secrets for EAS builds

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🔐 EAS Secrets Setup                                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if eas-cli is installed
if ! command -v eas &> /dev/null; then
    echo "📦 EAS CLI not found. Installing..."
    npm install -g eas-cli
fi

# Check authentication
echo "🔐 Checking Expo authentication..."
if ! eas whoami &> /dev/null; then
    echo "Please login to Expo:"
    eas login
fi

EXPO_USER=$(eas whoami 2>/dev/null || echo "unknown")
echo "✅ Logged in as: $EXPO_USER"
echo ""

# Confirm project
echo "📋 This will set up secrets for:"
echo "   Project: africa-railways"
echo "   Owner: mpolobe"
echo ""
read -p "Continue? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Setting up Backend URLs (Public)                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Backend URLs (these are public, not sensitive)
echo "🚂 Setting Railways backend URL..."
eas secret:create --scope project --name RAILWAYS_API_URL --value "https://africa-railways.vercel.app" --force || true
echo "✅ RAILWAYS_API_URL set"

echo ""
echo "💰 Setting Africoin backend URL..."
eas secret:create --scope project --name AFRICOIN_API_URL --value "https://africoin-wallet.vercel.app" --force || true
echo "✅ AFRICOIN_API_URL set"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Setting up API Keys (Sensitive)                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  The following will prompt for sensitive API keys."
echo "    Your input will be hidden for security."
echo ""

# Check if .env exists
if [ -f ".env" ]; then
    echo "📄 Found .env file. Would you like to use keys from it?"
    read -p "Use .env file? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Source .env file
        export $(cat .env | grep -v '^#' | xargs)
        
        if [ -n "$RAILWAYS_API_KEY" ]; then
            echo "🚂 Setting Railways API key from .env..."
            echo "$RAILWAYS_API_KEY" | eas secret:create --scope project --name RAILWAYS_API_KEY --force
            echo "✅ RAILWAYS_API_KEY set"
        fi
        
        if [ -n "$AFRICOIN_API_KEY" ]; then
            echo "💰 Setting Africoin API key from .env..."
            echo "$AFRICOIN_API_KEY" | eas secret:create --scope project --name AFRICOIN_API_KEY --force
            echo "✅ AFRICOIN_API_KEY set"
        fi
        
        if [ -n "$EXPO_TOKEN" ]; then
            echo "📱 Setting Expo token from .env..."
            echo "$EXPO_TOKEN" | eas secret:create --scope project --name EXPO_TOKEN --force
            echo "✅ EXPO_TOKEN set"
        fi
    else
        # Manual input
        echo ""
        echo "Please enter your API keys (input will be hidden):"
        echo ""
        
        read -sp "RAILWAYS_API_KEY: " RAILWAYS_KEY
        echo ""
        if [ -n "$RAILWAYS_KEY" ]; then
            echo "$RAILWAYS_KEY" | eas secret:create --scope project --name RAILWAYS_API_KEY --force
            echo "✅ RAILWAYS_API_KEY set"
        fi
        
        read -sp "AFRICOIN_API_KEY: " AFRICOIN_KEY
        echo ""
        if [ -n "$AFRICOIN_KEY" ]; then
            echo "$AFRICOIN_KEY" | eas secret:create --scope project --name AFRICOIN_API_KEY --force
            echo "✅ AFRICOIN_API_KEY set"
        fi
        
        read -sp "EXPO_TOKEN (optional): " EXPO_KEY
        echo ""
        if [ -n "$EXPO_KEY" ]; then
            echo "$EXPO_KEY" | eas secret:create --scope project --name EXPO_TOKEN --force
            echo "✅ EXPO_TOKEN set"
        fi
    fi
else
    # No .env file, manual input
    echo "Please enter your API keys (input will be hidden):"
    echo ""
    
    read -sp "RAILWAYS_API_KEY: " RAILWAYS_KEY
    echo ""
    if [ -n "$RAILWAYS_KEY" ]; then
        echo "$RAILWAYS_KEY" | eas secret:create --scope project --name RAILWAYS_API_KEY --force
        echo "✅ RAILWAYS_API_KEY set"
    fi
    
    read -sp "AFRICOIN_API_KEY: " AFRICOIN_KEY
    echo ""
    if [ -n "$AFRICOIN_KEY" ]; then
        echo "$AFRICOIN_KEY" | eas secret:create --scope project --name AFRICOIN_API_KEY --force
        echo "✅ AFRICOIN_API_KEY set"
    fi
    
    read -sp "EXPO_TOKEN (optional): " EXPO_KEY
    echo ""
    if [ -n "$EXPO_KEY" ]; then
        echo "$EXPO_KEY" | eas secret:create --scope project --name EXPO_TOKEN --force
        echo "✅ EXPO_TOKEN set"
    fi
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✅ EAS Secrets Setup Complete!                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# List secrets
echo "📋 Current EAS secrets:"
eas secret:list --scope project

echo ""
echo "✅ Your apps can now access these secrets during build:"
echo ""
echo "Backend URLs (public):"
echo "  • RAILWAYS_API_URL: https://africa-railways.vercel.app"
echo "  • AFRICOIN_API_URL: https://africoin-wallet.vercel.app"
echo ""
echo "API Keys (sensitive):"
echo "  • RAILWAYS_API_KEY: ✓ Set"
echo "  • AFRICOIN_API_KEY: ✓ Set"
echo "  • EXPO_TOKEN: ✓ Set (if provided)"
echo ""
echo "🚀 You can now build your apps:"
echo "   eas build --platform android --profile railways"
echo "   eas build --platform android --profile africoin"
echo ""
