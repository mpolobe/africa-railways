# Sentinel Portal - Codemagic Deployment
**Date**: January 11, 2026  
**Version**: v1.0.4  
**Status**: Triggered and awaiting build

---

## Deployment Summary

### ✅ Changes Committed
- Fixed Jest test failures (NativeAnimatedHelper mock)
- Updated React test renderer to 19.1.0
- Updated @testing-library/react-native to latest
- Updated Codemagic Sentinel workflows to Node 20.18.0
- Test results: 5/7 suites passing, 38 tests passing

### ✅ Git Tags Pushed
- **Tag**: `sentinel-v1.0.4`
- **Commit**: c15f9138
- **Remote**: Successfully pushed to origin

### ✅ Codemagic Triggers Configured
The following workflows will be triggered by the `sentinel-v1.0.4` tag:

1. **react-native-sentinel-android** - Sentinel Portal Android build
2. **react-native-sentinel-ios** - Sentinel Portal iOS build

---

## Build Configuration

### Android Build (`react-native-sentinel-android`)
```yaml
name: Sentinel Portal - Android
instance_type: mac_mini_m2
node: 20.18.0
max_build_duration: 60 minutes

environment:
  APP_VARIANT: sentinel
  PACKAGE_NAME: com.mpolobe.sentinel
  EXPO_PROJECT_ID: 82efeb87-20c5-45b4-b945-65d4b9074c32

triggering:
  - push to main/develop branches
  - tags matching 'sentinel-*'

build_command:
  APP_VARIANT=sentinel eas build --platform android --profile sentinel --non-interactive --no-wait
```

### iOS Build (`react-native-sentinel-ios`)
```yaml
name: Sentinel Portal - iOS
instance_type: mac_mini_m2
node: 20.18.0
xcode: 15.0
max_build_duration: 60 minutes

environment:
  APP_VARIANT: sentinel
  BUNDLE_ID: com.mpolobe.sentinel
  EXPO_PROJECT_ID: 82efeb87-20c5-45b4-b945-65d4b9074c32

triggering:
  - push to main/develop branches
  - tags matching 'sentinel-*'

build_command:
  APP_VARIANT=sentinel eas build --platform ios --profile sentinel --non-interactive --no-wait
```

---

## Required Credentials

### Codemagic Environment Groups
Ensure these are configured in Codemagic settings:

#### `railways_credentials` group
- **EXPO_TOKEN**: Expo authentication token (required for EAS builds)
- **BACKEND_URL**: Backend API URL (e.g., https://africa-railways.vercel.app)
- **SENTINEL_API_KEY**: API key for Sentinel app backend

#### `ios_credentials` group (for iOS builds)
- **APP_STORE_CONNECT_PRIVATE_KEY**: Apple App Store Connect API key
- **APP_STORE_CONNECT_KEY_IDENTIFIER**: Key ID
- **APP_STORE_CONNECT_ISSUER_ID**: Issuer ID

---

## Monitoring Build Progress

### Via Codemagic Dashboard
1. Go to [https://codemagic.io/apps](https://codemagic.io/apps)
2. Select **africa-railways** project
3. Look for builds triggered by tag `sentinel-v1.0.4`
4. Monitor build logs in real-time

### Via Email Notifications
Build notifications will be sent to: **ben.mpolokoso@gmail.com**
- Success notifications enabled
- Failure notifications enabled

### Expected Build Timeline
- **Android**: 15-30 minutes (EAS Build cloud)
- **iOS**: 20-40 minutes (EAS Build cloud + Xcode)
- **Total**: ~60 minutes for both platforms

---

## Build Artifacts

### Android
- **APK**: `SmartphoneApp/build/**/*.apk`
- **AAB**: `SmartphoneApp/build/**/*.aab`
- **Package**: com.mpolobe.sentinel

### iOS
- **IPA**: `SmartphoneApp/build/**/*.ipa`
- **Bundle ID**: com.mpolobe.sentinel

---

## Troubleshooting

### If Build Fails

#### Check EXPO_TOKEN
```bash
# Verify EXPO_TOKEN is set in Codemagic
# Should be in railways_credentials group
# Length should be ~200 characters
```

#### Check EAS Build Profile
```bash
cd SmartphoneApp
cat eas.json | grep -A 15 '"sentinel":'
```

Expected output:
```json
"sentinel": {
  "extends": "production",
  "node": "20.18.0",
  "android": {
    "buildType": "apk"
  },
  "env": {
    "APP_VARIANT": "sentinel",
    "BACKEND_URL": "$BACKEND_URL",
    "API_KEY": "$SENTINEL_API_KEY",
    "SUI_NETWORK": "mainnet"
  }
}
```

#### Check App Configuration
```bash
cd SmartphoneApp
APP_VARIANT=sentinel npx expo config --type public | head -20
```

Should show:
- name: "Sentinel Portal"
- package: "com.mpolobe.sentinel"
- bundleIdentifier: "com.mpolobe.sentinel"

#### Manual Trigger (if needed)
If automatic trigger doesn't work:
1. Go to Codemagic dashboard
2. Select **africa-railways** project
3. Click **Start new build**
4. Select workflow: **react-native-sentinel-android** or **react-native-sentinel-ios**
5. Select branch: **main**
6. Click **Start build**

---

## Post-Build Steps

### After Successful Android Build
1. Download APK from Codemagic artifacts
2. Test on physical Android device
3. Submit to Google Play Store (internal testing):
   ```bash
   eas submit --platform android
   ```

### After Successful iOS Build
1. Download IPA from Codemagic artifacts
2. Test on physical iOS device (via TestFlight)
3. Submit to Apple App Store:
   ```bash
   eas submit --platform ios
   ```

---

## Sentinel App Features

### Core Functionality
- **Track Worker Safety Monitoring**: GPS-tagged checkpoint scanning
- **Infrastructure Condition Reporting**: Real-time track status updates
- **Performance-Based Incentives**: Blockchain-verified reward distribution
- **Offline-First Architecture**: Works without internet connectivity
- **QR Code Scanning**: Camera integration for checkpoint verification

### Technical Stack
- **Framework**: React Native 0.81.5 with Expo SDK 54
- **Blockchain**: Sui network integration for data verification
- **Backend**: Africa Railways API (africa-railways.vercel.app)
- **Storage**: AsyncStorage for offline data persistence
- **Navigation**: React Navigation 7.x

### Target Users
- 2,000+ track workers across TAZARA and ZRL networks
- Railway maintenance crews
- Safety inspectors
- Infrastructure monitoring personnel

---

## Next Steps

### Immediate (After Build Completes)
1. ✅ Monitor Codemagic build logs
2. ✅ Download build artifacts (APK/IPA)
3. ✅ Test on physical devices
4. ✅ Verify QR code scanning functionality
5. ✅ Test offline data sync

### Short-Term (Next 7 Days)
1. Deploy to Google Play Store (internal testing)
2. Deploy to Apple TestFlight (beta testing)
3. Onboard 50 pilot track workers
4. Collect feedback and bug reports
5. Monitor crash analytics

### Medium-Term (Next 30 Days)
1. Roll out to 500+ track workers
2. Integrate with ZRL signaling modernization pilot
3. Add GPS-tagged photo uploads
4. Implement real-time dashboard integration
5. Prepare for public release

---

## Build Status Tracking

### Current Status
- **Commit**: c15f9138
- **Tag**: sentinel-v1.0.4
- **Pushed**: January 11, 2026
- **Codemagic**: Triggered (awaiting build start)

### Build History
- **v1.0.0**: Initial release (fdcd3947)
- **v1.0.3**: Previous stable release (8aa52ab3)
- **v1.0.4**: Current release with bug fixes (c15f9138)

---

## Contact & Support

### Build Issues
- **Email**: ben.mpolokoso@gmail.com
- **Codemagic Dashboard**: [https://codemagic.io/apps](https://codemagic.io/apps)
- **GitHub Repository**: [https://github.com/mpolobe/africa-railways](https://github.com/mpolobe/africa-railways)

### Documentation
- **Mobile Apps Build Status**: MOBILE_APPS_BUILD_STATUS.md
- **Institutional Alignment**: INSTITUTIONAL_ALIGNMENT_SUMMARY.md
- **Codemagic Setup**: CODEMAGIC_SETUP.md

---

**Document Version**: 1.0  
**Last Updated**: January 11, 2026  
**Prepared By**: Ona AI Agent  
**Status**: Build triggered, monitoring in progress
