# 🚀 Quick Start: Building Your Apps

## Prerequisites
- Node.js 20+ installed
- EAS CLI installed globally: `npm install -g eas-cli`
- Expo account with access token

## One-Time Setup

### 1. Install Node 20 (using nvm)
```bash
# Install nvm if not already installed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install and use Node 20
nvm install 20
nvm use 20
```

### 2. Install Dependencies
```bash
cd SmartphoneApp
npm install --legacy-peer-deps
```

### 3. Authenticate with Expo
```bash
eas login
# Enter your Expo credentials
```

## Building Apps

### Build Railways App 🚂
```bash
cd SmartphoneApp
APP_VARIANT=railways eas build --platform android --profile railways
```

### Build Africoin App 💰
```bash
cd SmartphoneApp
APP_VARIANT=africoin eas build --platform android --profile africoin
```

### Build Both Apps
```bash
cd SmartphoneApp

# Build Railways
APP_VARIANT=railways eas build --platform android --profile railways --no-wait

# Build Africoin
APP_VARIANT=africoin eas build --platform android --profile africoin --no-wait
```

## Build Profiles

### Available Profiles (in eas.json)
- `railways` - Railways Hub app
- `africoin` - Africoin Wallet app
- `preview` - Preview builds (if configured)
- `production` - Production builds (if configured)

## App Identities

### Railways Hub 🚂
- **Name:** Africa Railways Hub
- **Package:** com.mpolobe.railways
- **Slug:** africa-railways-app
- **Project ID:** 82efeb87-20c5-45b4-b945-65d4b9074c32

### Africoin Wallet 💰
- **Name:** Africoin Wallet
- **Package:** com.mpolobe.africoin
- **Slug:** africa-railways-monorepo
- **Project ID:** 5fa2f2b4-5c9f-43bf-b1eb-20d90ae19185

## Monitoring Builds

### Check Build Status
```bash
cd SmartphoneApp
eas build:list --platform android --limit 5
```

### View Specific Build
```bash
eas build:view [BUILD_ID]
```

### Download APK
Once build completes, download from:
- Expo Dashboard: https://expo.dev/
- Or use: `eas build:download [BUILD_ID]`

## GitHub Actions (Automated Builds)

### Trigger via GitHub UI
1. Go to repository → Actions tab
2. Select workflow:
   - "Build Railways App"
   - "Build Africoin App"
   - "Build Both Apps"
3. Click "Run workflow"
4. Select branch (usually `main`)
5. Click "Run workflow" button

### Automatic Triggers
Builds automatically trigger on:
- Push to `main` branch
- Pull requests to `main` branch

## Common Issues & Solutions

### Issue: `.toReversed is not a function`
**Solution:** Upgrade to Node 20
```bash
nvm install 20
nvm use 20
```

### Issue: `Slug mismatch error`
**Solution:** Already fixed! Africoin now uses correct slug `africa-railways-monorepo`

### Issue: `Peer dependency conflicts`
**Solution:** Use `--legacy-peer-deps` flag
```bash
npm install --legacy-peer-deps
```

### Issue: `EXPO_TOKEN not found`
**Solution:** Login to EAS
```bash
eas login
```

Or set token manually:
```bash
export EXPO_TOKEN=your_token_here
```

## Build Times
- Typical build time: 10-15 minutes
- Builds run on Expo's cloud infrastructure
- You can close terminal/browser - build continues in cloud

## Getting Build Artifacts

### Option 1: Expo Dashboard
1. Visit https://expo.dev/
2. Navigate to your project
3. Go to "Builds" tab
4. Download APK from completed build

### Option 2: CLI
```bash
# List recent builds
eas build:list --platform android --limit 5

# Download specific build
eas build:download [BUILD_ID]
```

### Option 3: QR Code
Scan QR code from build completion message to install directly on device

## Testing Builds

### Install on Android Device
1. Enable "Install from Unknown Sources" in Android settings
2. Transfer APK to device
3. Open APK file to install
4. Grant necessary permissions

### Test Both Apps
Both apps can be installed simultaneously as they have different package names:
- Railways: `com.mpolobe.railways`
- Africoin: `com.mpolobe.africoin`

## Environment Variables

### Required for Builds
- `APP_VARIANT` - Set to `railways` or `africoin`
- `EXPO_TOKEN` - Your Expo authentication token

### Optional
- `BACKEND_URL` - Backend API URL (defaults to production)
- `API_KEY` - API authentication key

## Support

### Documentation
- Full guide: `BUILD_GUIDE.md`
- Troubleshooting: `TROUBLESHOOTING.md`
- Architecture: `MULTI_APP_STRUCTURE.md`

### Expo Resources
- Dashboard: https://expo.dev/
- Docs: https://docs.expo.dev/
- EAS Build: https://docs.expo.dev/build/introduction/

---

**Quick Command Reference:**
```bash
# Setup
nvm use 20
cd SmartphoneApp
npm install --legacy-peer-deps
eas login

# Build Railways
APP_VARIANT=railways eas build --platform android --profile railways

# Build Africoin
APP_VARIANT=africoin eas build --platform android --profile africoin

# Check status
eas build:list --platform android --limit 5
```

**Ready to build!** 🚀
