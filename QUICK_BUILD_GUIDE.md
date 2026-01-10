# Quick Build Guide - All Apps

## 🚀 Build Commands Reference

### Prerequisites
```bash
npm install -g eas-cli
eas login
cd SmartphoneApp
```

---

## 📱 Mobile Apps (SmartphoneApp/)

### 1. Africa Railways Hub
```bash
eas build --profile railways --platform android
```
- **Slug:** africa-railways-app
- **Package:** com.mpolobe.railways
- **Purpose:** Passenger ticket booking and journey management

### 2. Sentinel Portal
```bash
eas build --profile sentinel --platform android
```
- **Slug:** africa-railways-app (shared with Railways)
- **Package:** com.mpolobe.sentinel
- **Purpose:** Track worker safety monitoring and reporting
- **Fixed:** Slug mismatch error resolved ✅

### 3. Staff Verification
```bash
eas build --profile staff --platform android
```
- **Slug:** africa-railways-app (shared with Railways)
- **Package:** com.mpolobe.staff
- **Purpose:** Railway staff ticket verification tool

### 4. Africoin Wallet
```bash
eas build --profile africoin --platform android
```
- **Slug:** africa-railways-monorepo
- **Package:** com.mpolobe.africoin
- **Purpose:** Pan-African digital currency wallet

---

## 🌐 Web Apps

### OCC Portal (apps/occ-portal/)
```bash
cd apps/occ-portal
npm install
npm run build
```
- **Purpose:** Operations Control Center dashboard
- **Deploy:** Vercel, Railway, or static hosting

### Sentinel Dashboard (sentinel-dashboard.html)
```bash
# No build required - static HTML
# Deploy to any web server or CDN
```
- **Purpose:** Web-based sentinel monitoring dashboard
- **Features:** Real-time tracking, analytics, alerts
- **Recent Updates:** 
  - ✅ Consistent navigation menus
  - ✅ Working profile button
  - ✅ Glowing logo animation

---

## 🔧 Build Profiles

### Development
```bash
eas build --profile development --platform android
```
- Development client enabled
- Internal distribution
- Local API (localhost:8080)

### Preview
```bash
eas build --profile preview --platform android
```
- Internal distribution
- Gitpod API URL
- Testnet blockchain

### Production
```bash
eas build --profile production --platform android
```
- Auto-increment version
- Production API
- Mainnet blockchain

---

## 📦 Build All Apps Script

Create `build-all-apps.sh`:
```bash
#!/bin/bash
cd SmartphoneApp

echo "Building Railways App..."
eas build --profile railways --platform android --non-interactive

echo "Building Sentinel App..."
eas build --profile sentinel --platform android --non-interactive

echo "Building Staff App..."
eas build --profile staff --platform android --non-interactive

echo "Building Africoin App..."
eas build --profile africoin --platform android --non-interactive

echo "All builds submitted!"
```

Make executable and run:
```bash
chmod +x build-all-apps.sh
./build-all-apps.sh
```

---

## 🔐 Required Secrets

### Set EAS Secrets
```bash
# Backend URL (shared)
eas secret:create --scope project --name BACKEND_URL --value "https://africa-railways.vercel.app"

# API Keys (per app)
eas secret:create --scope project --name RAILWAYS_API_KEY --value "your-railways-key"
eas secret:create --scope project --name SENTINEL_API_KEY --value "your-sentinel-key"
eas secret:create --scope project --name STAFF_API_KEY --value "your-staff-key"
eas secret:create --scope project --name AFRICOIN_API_KEY --value "your-africoin-key"

# Blockchain keys
eas secret:create --scope project --name ALCHEMY_SDK_KEY --value "your-alchemy-key"
```

### View Secrets
```bash
eas secret:list
```

---

## 📊 Project Structure

```
africa-railways/
├── SmartphoneApp/           # Mobile apps (React Native/Expo)
│   ├── app.config.js        # Multi-app configuration
│   ├── eas.json             # Build profiles
│   └── assets/              # App icons and splash screens
├── apps/
│   └── occ-portal/          # OCC web dashboard
├── sentinel-dashboard.html  # Sentinel web dashboard
└── sentinel-pages/          # Sentinel dashboard pages
```

---

## 🎯 Common Issues & Solutions

### Issue: Slug Mismatch Error
```
Error: Slug for project identified by "extra.eas.projectId" does not match the "slug" field
```
**Solution:** Ensure slug in app.config.js matches the project ID registration
- ✅ Fixed for Sentinel app (commit 83cc3aa7)

### Issue: Build Queue Timeout
**Solution:** 
- Check EAS dashboard for queue status
- Retry build after queue clears
- Consider EAS priority builds

### Issue: Missing Environment Variables
**Solution:**
```bash
eas secret:list  # Check existing secrets
eas secret:create --scope project --name VAR_NAME --value "value"
```

### Issue: APK Won't Install
**Solution:**
- Enable "Install from Unknown Sources"
- Check minimum Android version (SDK 23+)
- Verify APK signature

---

## 📱 Testing Builds

### Download APK
```bash
# List recent builds
eas build:list

# Download specific build
eas build:download --id BUILD_ID
```

### Install on Device
```bash
# Via ADB
adb install app.apk

# Or scan QR code from EAS dashboard
```

### Test Checklist
- [ ] App installs successfully
- [ ] App launches without crashes
- [ ] Login/authentication works
- [ ] Core features functional
- [ ] Camera permissions work
- [ ] Network requests succeed
- [ ] UI renders correctly

---

## 🚀 Deployment

### Internal Testing
```bash
# Build with internal distribution
eas build --profile preview --platform android
```

### Play Store Submission
```bash
# Build production APK/AAB
eas build --profile production --platform android

# Submit to Play Store
eas submit --platform android
```

### App Store Submission (iOS)
```bash
# Build for iOS
eas build --profile production --platform ios

# Submit to App Store
eas submit --platform ios
```

---

## 📈 Build Status

### Check Build Status
```bash
# List all builds
eas build:list

# View specific build
eas build:view BUILD_ID

# Cancel build
eas build:cancel BUILD_ID
```

### Build Logs
```bash
# View build logs
eas build:view BUILD_ID --logs
```

---

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: EAS Build
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g eas-cli
      - run: eas build --profile production --platform android --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

---

## 📚 Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [App Variants Guide](https://docs.expo.dev/build-reference/variants/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)
- [Troubleshooting Builds](https://docs.expo.dev/build-reference/troubleshooting/)

---

## ✅ Quick Checklist

Before building:
- [ ] Logged into EAS (`eas login`)
- [ ] Secrets configured (`eas secret:list`)
- [ ] App config correct (`cat app.config.js`)
- [ ] EAS.json profiles defined
- [ ] Assets present (icons, splash screens)

After building:
- [ ] Build completed successfully
- [ ] APK downloaded
- [ ] Tested on device
- [ ] No crashes or errors
- [ ] Ready for distribution

---

**Last Updated:** January 10, 2025
**Status:** All build configurations verified ✅
