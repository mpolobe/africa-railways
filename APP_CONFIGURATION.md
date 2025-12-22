# 📱 App Configuration Summary

Updated configuration for Africa Railways Sovereign Hub mobile app.

---

## App Details

### Basic Information
- **Name**: Africa Railways Sovereign Hub
- **Slug**: africa-railways
- **Version**: 1.0.0
- **Orientation**: Portrait
- **UI Style**: Light

### EAS Project
- **Project ID**: `82efeb87-20c5-45b4-b945-65d4b9074c32`

---

## Platform Identifiers

### iOS
- **Bundle Identifier**: `com.mpolobe.africarailways.hub`
- **Tablet Support**: Enabled
- **Encryption**: Not using non-exempt encryption

### Android
- **Package Name**: `com.mpolobe.africarailways.hub`
- **Adaptive Icon**: `./assets/adaptive-icon.png`
- **Background Color**: #ffffff

---

## Assets

### Required Files
```
assets/
├── icon.png              # App icon (1024x1024)
├── splash.png            # Splash screen
└── adaptive-icon.png     # Android adaptive icon (1024x1024)
```

### Splash Screen
- **Image**: `./assets/splash.png`
- **Resize Mode**: contain
- **Background**: #ffffff (white)

---

## Store Links

### Apple App Store
```
https://apps.apple.com/app/africa-railways
```

### Google Play Store
```
https://play.google.com/store/apps/details?id=com.mpolobe.africarailways.hub
```

---

## Build Commands

### Android Production Build
```bash
npx eas-cli build --platform android --profile production --non-interactive
```

### iOS Production Build
```bash
npx eas-cli build --platform ios --profile production --non-interactive
```

### Both Platforms
```bash
npx eas-cli build --platform all --profile production --non-interactive
```

---

## Version Management

### Current Version
- **App Version**: 1.0.0
- **Android versionCode**: Auto-incremented by EAS
- **iOS buildNumber**: Auto-incremented by EAS

### Update Version
Edit `app.json`:
```json
{
  "expo": {
    "version": "1.0.1"
  }
}
```

---

## Configuration Changes

### What Changed
1. ✅ Updated EAS project ID
2. ✅ Changed bundle identifiers from `africarailwaysmonorepo` to `africarailways.hub`
3. ✅ Added complete app metadata
4. ✅ Configured splash screen and icons
5. ✅ Enabled iOS tablet support
6. ✅ Updated store links

### Migration Notes
- **Old iOS Bundle**: `com.mpolobe.africarailwaysmonorepo`
- **New iOS Bundle**: `com.mpolobe.africarailways.hub`
- **Old Android Package**: `com.mpolobe.africarailwaysmonorepo`
- **New Android Package**: `com.mpolobe.africarailways.hub`

⚠️ **Important**: New bundle identifiers mean this is a new app in the stores. Previous installations won't auto-update.

---

## Next Steps

### 1. Create Assets
Create the required image assets:
- `assets/icon.png` (1024x1024)
- `assets/splash.png` (recommended: 1284x2778)
- `assets/adaptive-icon.png` (1024x1024)

### 2. Build App
```bash
# Login to Expo
npx eas-cli login

# Build for Android
npx eas-cli build --platform android --profile production --non-interactive

# Build for iOS
npx eas-cli build --platform ios --profile production --non-interactive
```

### 3. Submit to Stores
```bash
# Submit to Google Play
npx eas-cli submit --platform android --latest

# Submit to App Store
npx eas-cli submit --platform ios --latest
```

---

## Verification

### Check Configuration
```bash
# Validate app.json
npx expo-cli doctor

# Check EAS configuration
npx eas-cli build:configure
```

### Test Build
```bash
# Preview build (for testing)
npx eas-cli build --platform android --profile preview
```

---

## Troubleshooting

### Bundle Identifier Conflicts
If you get errors about bundle identifiers:
1. Check Apple Developer Portal
2. Verify Google Play Console
3. Ensure identifiers match exactly

### Asset Missing Errors
If build fails due to missing assets:
1. Create placeholder images
2. Or remove asset references from app.json
3. Add proper assets later

### Project ID Mismatch
If EAS complains about project ID:
```bash
# Re-configure EAS
npx eas-cli build:configure
```

---

## Resources

- **EAS Build Docs**: https://docs.expo.dev/build/introduction/
- **App Store Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Google Play Guidelines**: https://play.google.com/console/about/guides/

---

**Built for Africa, By Africa** 🌍📱
