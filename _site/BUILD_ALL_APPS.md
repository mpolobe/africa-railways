# Building All 4 Apps - Quick Guide

## Overview

The repository now supports building **4 distinct mobile applications** from a single codebase:

1. **Africa Railways Hub** - Passenger ticketing app
2. **Africoin Wallet** - Cryptocurrency wallet
3. **Sentinel Portal** - Track worker safety monitoring
4. **Staff Verification** - Railway staff ticket verification

---

## App Configurations

| App | Package | Bundle ID | Expo Project ID | Users |
|-----|---------|-----------|-----------------|-------|
| **Railways** | com.mpolobe.railways | com.mpolobe.railways | 82efeb87-20c5-45b4-b945-65d4b9074c32 | Passengers |
| **Africoin** | com.mpolobe.africoin | com.mpolobe.africoin | 5fa2f2b4-5c9f-43bf-b1eb-20d90ae19185 | Wallet users |
| **Sentinel** | com.mpolobe.sentinel | com.mpolobe.sentinel | 82efeb87-20c5-45b4-b945-65d4b9074c32 | 2,000+ track workers |
| **Staff** | com.mpolobe.staff | com.mpolobe.staff | 82efeb87-20c5-45b4-b945-65d4b9074c32 | Railway staff |

---

## Local Build Commands

### Individual App Builds

```bash
# Railways App
npm run build:railways:android
npm run build:railways:ios

# Africoin App
npm run build:africoin:android
npm run build:africoin:ios

# Sentinel App
npm run build:sentinel:android
npm run build:sentinel:ios

# Staff Verification App
npm run build:staff:android
npm run build:staff:ios
```

### Batch Builds

```bash
# Build all Android apps
npm run build:all:android

# Build all iOS apps
npm run build:all:ios
```

### Direct EAS Commands

```bash
cd SmartphoneApp

# Railways
APP_VARIANT=railways eas build --platform android --profile railways

# Africoin
APP_VARIANT=africoin eas build --platform android --profile africoin

# Sentinel
APP_VARIANT=sentinel eas build --platform android --profile sentinel

# Staff
APP_VARIANT=staff eas build --platform android --profile staff
```

---

## Codemagic Workflows

### Available Workflows

#### Railways App
- `react-native-railways-android` - Android build
- `react-native-railways-ios` - iOS build

#### Africoin App
- `react-native-africoin-android` - Android build
- `react-native-africoin-ios` - iOS build

#### Sentinel App
- `react-native-sentinel-android` - Android build
- `react-native-sentinel-ios` - iOS build

#### Staff Verification App
- `react-native-staff-android` - Android build
- `react-native-staff-ios` - iOS build

### Trigger Builds

#### Automatic Triggers

**Push to main or develop:**
```bash
git push origin main
# Triggers all 4 apps (Android + iOS) = 8 builds
```

**Tag-based builds:**
```bash
# Railways
git tag railways-v1.0.0 && git push --tags

# Africoin
git tag africoin-v1.0.0 && git push --tags

# Sentinel
git tag sentinel-v1.0.0 && git push --tags

# Staff
git tag staff-v1.0.0 && git push --tags
```

#### Manual Triggers

Via Codemagic UI:
1. Go to [codemagic.io/apps](https://codemagic.io/apps)
2. Select `africa-railways` project
3. Choose workflow (e.g., `react-native-sentinel-android`)
4. Click "Start new build"
5. Select branch and configuration
6. Click "Start build"

---

## Environment Variables Required

### Codemagic Environment Groups

#### 1. `railways_credentials`
```bash
EXPO_TOKEN=<expo-access-token>
BACKEND_URL=https://africa-railways.vercel.app
RAILWAYS_API_KEY=<api-key>
```

#### 2. `africoin_credentials`
```bash
EXPO_TOKEN=<expo-access-token>
BACKEND_URL=https://africa-railways.vercel.app
AFRICOIN_API_KEY=<api-key>
```

#### 3. `sentinel_credentials`
```bash
EXPO_TOKEN=<expo-access-token>
BACKEND_URL=https://africa-railways.vercel.app
SENTINEL_API_KEY=<api-key>
SUI_NETWORK=mainnet
```

#### 4. `staff_credentials`
```bash
EXPO_TOKEN=<expo-access-token>
BACKEND_URL=https://africa-railways.vercel.app
STAFF_API_KEY=<api-key>
ALCHEMY_SDK_KEY=<alchemy-api-key>
```

#### 5. `ios_credentials` (shared)
```bash
APP_STORE_CONNECT_PRIVATE_KEY=<p8-key-base64>
APP_STORE_CONNECT_KEY_IDENTIFIER=<key-id>
APP_STORE_CONNECT_ISSUER_ID=<issuer-id>
```

---

## Build Artifacts

After successful builds, artifacts are available:

### Android
```
SmartphoneApp/build/
├── railways-1.0.0.apk
├── africoin-1.0.0.apk
├── sentinel-1.0.0.apk
└── staff-1.0.0.apk
```

### iOS
```
SmartphoneApp/build/
├── railways-1.0.0.ipa
├── africoin-1.0.0.ipa
├── sentinel-1.0.0.ipa
└── staff-1.0.0.ipa
```

---

## Testing Configurations

### Verify App Config

```bash
cd SmartphoneApp

# Test Railways config
APP_VARIANT=railways node -e "const c = require('./app.config.js'); console.log(c.expo.name, c.expo.android.package)"

# Test Africoin config
APP_VARIANT=africoin node -e "const c = require('./app.config.js'); console.log(c.expo.name, c.expo.android.package)"

# Test Sentinel config
APP_VARIANT=sentinel node -e "const c = require('./app.config.js'); console.log(c.expo.name, c.expo.android.package)"

# Test Staff config
APP_VARIANT=staff node -e "const c = require('./app.config.js'); console.log(c.expo.name, c.expo.android.package)"
```

Expected output:
```
Africa Railways Hub com.mpolobe.railways
Africoin Wallet com.mpolobe.africoin
Sentinel Portal com.mpolobe.sentinel
Staff Verification com.mpolobe.staff
```

---

## Distribution

### Internal Testing

1. **Download APKs** from Codemagic artifacts
2. **Install on test devices**:
   ```bash
   adb install railways-1.0.0.apk
   adb install africoin-1.0.0.apk
   adb install sentinel-1.0.0.apk
   adb install staff-1.0.0.apk
   ```

### Production Distribution

#### Google Play Store
- Upload AAB files to Play Console
- Create separate listings for each app
- Submit for review

#### Apple App Store
- Upload IPA files via Transporter
- Create separate App Store listings
- Submit for review

#### Direct Distribution (Sentinel & Staff)
- Host APKs on internal server
- Generate QR codes for easy download
- Distribute to track workers and staff

---

## Build Status Monitoring

### Codemagic Dashboard
Monitor all builds at: [https://codemagic.io/apps](https://codemagic.io/apps)

### Email Notifications
Configured to send build status to: `mpolobe@example.com`

### Build Logs
Access detailed logs for each workflow in Codemagic UI.

---

## Troubleshooting

### Build Fails with "Invalid APP_VARIANT"
**Solution**: Ensure `APP_VARIANT` environment variable is set correctly in Codemagic workflow.

### EAS Authentication Error
**Solution**: Verify `EXPO_TOKEN` is set in the appropriate credentials group.

### Package Name Conflict
**Solution**: Each app has a unique package name. Verify in `app.config.js`.

### Missing Dependencies
**Solution**: Run `npm install --legacy-peer-deps` in SmartphoneApp directory.

---

## Next Steps

### 1. Configure Codemagic
- [ ] Add environment variable groups
- [ ] Upload code signing certificates
- [ ] Enable workflows

### 2. Test Builds
- [ ] Trigger test build for each app
- [ ] Verify artifacts are generated
- [ ] Install and test on devices

### 3. Production Deployment
- [ ] Tag releases for each app
- [ ] Monitor build status
- [ ] Download and distribute artifacts

---

## Summary

✅ **Configuration Complete**
- 4 app variants configured
- 8 Codemagic workflows (4 apps × 2 platforms)
- EAS build profiles for all apps
- npm scripts for easy building

⏳ **Ready to Build**
- Push to main/develop to trigger all builds
- Use tags for individual app releases
- Manual triggers available in Codemagic UI

📦 **Artifacts**
- Android APKs for all 4 apps
- iOS IPAs for all 4 apps
- Automatic email notifications

---

## Quick Reference

```bash
# Build all apps locally
npm run build:all:android
npm run build:all:ios

# Trigger specific app build
git tag sentinel-v1.0.0 && git push --tags

# Test configuration
cd SmartphoneApp && APP_VARIANT=sentinel node -e "console.log(require('./app.config.js').expo.name)"

# Monitor builds
open https://codemagic.io/apps
```

---

**All 4 apps are now ready to build! 🚀**
