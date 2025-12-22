#!/bin/bash

# 🎨 Africa Railways - Multi-App Directory Migration Script
# This script creates separate directories for Railways and Africoin apps

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🎨 Multi-App Directory Structure Migration              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "app.config.js" ]; then
    echo -e "${RED}❌ Error: app.config.js not found${NC}"
    echo "Please run this script from the project root"
    exit 1
fi

echo -e "${YELLOW}This script will:${NC}"
echo "  1. Create separate directories for Railways and Africoin apps"
echo "  2. Copy mobile code to each directory"
echo "  3. Create app-specific configurations"
echo "  4. Update package.json for each app"
echo "  5. Keep the original mobile/ directory as backup"
echo ""

read -p "Continue? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}📁 Step 1: Creating directory structure...${NC}"

# Create app directories
mkdir -p railways-app
mkdir -p africoin-app

echo -e "${GREEN}✅ Created directories${NC}"

echo ""
echo -e "${BLUE}📋 Step 2: Copying mobile code...${NC}"

# Copy mobile code to railways-app
if [ -d "mobile" ]; then
    cp -r mobile/* railways-app/
    echo -e "${GREEN}✅ Copied to railways-app/${NC}"
    
    cp -r mobile/* africoin-app/
    echo -e "${GREEN}✅ Copied to africoin-app/${NC}"
else
    echo -e "${YELLOW}⚠️  mobile/ directory not found, creating from scratch${NC}"
fi

echo ""
echo -e "${BLUE}⚙️  Step 3: Creating Railways app configuration...${NC}"

# Create railways-app package.json
cat > railways-app/package.json << 'EOF'
{
  "name": "africa-railways-app",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~51.0.0",
    "expo-status-bar": "~1.12.1",
    "react": "18.2.0",
    "react-native": "0.74.5"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0"
  },
  "private": true
}
EOF

# Create railways-app App.js
cat > railways-app/App.js << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚂 Africa Railways Hub</Text>
      <Text style={styles.subtitle}>Railway Operations & Ticketing</Text>
      <Text style={styles.status}>Status: Active</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10
  },
  subtitle: {
    color: '#FFB800',
    fontSize: 18,
    marginBottom: 20
  },
  status: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.8
  }
});
EOF

echo -e "${GREEN}✅ Created Railways app configuration${NC}"

echo ""
echo -e "${BLUE}⚙️  Step 4: Creating Africoin app configuration...${NC}"

# Create africoin-app package.json
cat > africoin-app/package.json << 'EOF'
{
  "name": "africoin-wallet-app",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~51.0.0",
    "expo-status-bar": "~1.12.1",
    "react": "18.2.0",
    "react-native": "0.74.5"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0"
  },
  "private": true
}
EOF

# Create africoin-app App.js
cat > africoin-app/App.js << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>💰 Africoin Wallet</Text>
      <Text style={styles.subtitle}>Digital Currency for Africa</Text>
      <Text style={styles.status}>Status: Active</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E1A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  title: {
    color: '#FFB800',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10
  },
  subtitle: {
    color: '#00D4FF',
    fontSize: 18,
    marginBottom: 20
  },
  status: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.8
  }
});
EOF

echo -e "${GREEN}✅ Created Africoin app configuration${NC}"

echo ""
echo -e "${BLUE}📝 Step 5: Creating README files...${NC}"

# Create railways-app README
cat > railways-app/README.md << 'EOF'
# 🚂 Africa Railways Hub

Railway operations and ticketing application.

## Features
- Railway ticketing
- Train schedules
- Station information
- Track worker tools

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## Build

```bash
# Build for production
eas build --platform android --profile railways
```

## Theme
- Primary: Blue (#0066CC)
- Secondary: Gold (#FFB800)
- Package: com.mpolobe.railways
EOF

# Create africoin-app README
cat > africoin-app/README.md << 'EOF'
# 💰 Africoin Wallet

Digital currency wallet for African railways.

## Features
- AFRC token management
- Wallet operations
- Blockchain transactions
- Payment gateway

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## Build

```bash
# Build for production
eas build --platform android --profile africoin
```

## Theme
- Primary: Gold (#FFB800)
- Secondary: Cyan (#00D4FF)
- Package: com.mpolobe.africoin
EOF

echo -e "${GREEN}✅ Created README files${NC}"

echo ""
echo -e "${BLUE}📝 Step 6: Creating .gitignore files...${NC}"

# Create .gitignore for both apps
cat > railways-app/.gitignore << 'EOF'
node_modules/
.expo/
.expo-shared/
npm-debug.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*
web-build/
dist/
EOF

cp railways-app/.gitignore africoin-app/.gitignore

echo -e "${GREEN}✅ Created .gitignore files${NC}"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Migration Complete!                                   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo "Directory structure created:"
echo ""
echo "  railways-app/"
echo "    ├── App.js"
echo "    ├── package.json"
echo "    ├── README.md"
echo "    └── .gitignore"
echo ""
echo "  africoin-app/"
echo "    ├── App.js"
echo "    ├── package.json"
echo "    ├── README.md"
echo "    └── .gitignore"
echo ""

echo -e "${YELLOW}Next steps:${NC}"
echo ""
echo "1. Test Railways app:"
echo "   cd railways-app"
echo "   npm install"
echo "   npm start"
echo ""
echo "2. Test Africoin app:"
echo "   cd africoin-app"
echo "   npm install"
echo "   npm start"
echo ""
echo "3. Update app.config.js to use new directories"
echo ""
echo "4. Build apps:"
echo "   eas build --platform android --profile railways"
echo "   eas build --platform android --profile africoin"
echo ""

echo -e "${BLUE}Note: The original mobile/ directory is preserved as backup${NC}"
echo ""
