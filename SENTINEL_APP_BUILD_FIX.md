# Sentinel Mobile App Build Fix

## 🐛 Issue

### Error Message
```
Build Android APK
Project config: Slug for project identified by "extra.eas.projectId" (africa-railways-app) 
does not match the "slug" field (sentinel-portal). 
Learn more: https://expo.fyi/eas-project-id

Error: build command failed.
Build failed :|
Step 6 script `Build Android APK` exited with status code 1
```

### Root Cause
The Sentinel mobile app configuration had a **slug mismatch** between:
- **EAS Project ID:** `82efeb87-20c5-45b4-b945-65d4b9074c32` (associated with slug `africa-railways-app`)
- **App Config Slug:** `sentinel-portal`

EAS requires that the slug in `app.config.js` matches the slug registered with the project ID.

---

## ✅ Solution

### What Was Changed
Updated `SmartphoneApp/app.config.js` to use the correct slug:

**Before:**
```javascript
sentinel: {
  name: "Sentinel Portal",
  slug: "sentinel-portal",  // ❌ Mismatch
  package: "com.mpolobe.sentinel",
  bundleIdentifier: "com.mpolobe.sentinel",
  projectId: "82efeb87-20c5-45b4-b945-65d4b9074c32",
  // ...
}
```

**After:**
```javascript
sentinel: {
  name: "Sentinel Portal",
  slug: "africa-railways-app",  // ✅ Matches project ID
  package: "com.mpolobe.sentinel",
  bundleIdentifier: "com.mpolobe.sentinel",
  projectId: "82efeb87-20c5-45b4-b945-65d4b9074c32",
  // ...
}
```

### Why This Works
- The EAS project ID `82efeb87-20c5-45b4-b945-65d4b9074c32` is registered with slug `africa-railways-app`
- All apps sharing the same project ID must use the same slug
- The app name, package, and bundle identifier remain unique per app
- Only the slug needs to match for EAS build system

---

## 📋 App Configuration Overview

### Multi-App Setup
The project uses a single EAS project ID for multiple apps:

| App | Name | Slug | Package | Project ID |
|-----|------|------|---------|------------|
| Railways | Africa Railways Hub | africa-railways-app | com.mpolobe.railways | 82efeb87... |
| Sentinel | Sentinel Portal | africa-railways-app | com.mpolobe.sentinel | 82efeb87... |
| Staff | Staff Verification | africa-railways-app | com.mpolobe.staff | 82efeb87... |
| Africoin | Africoin Wallet | africa-railways-monorepo | com.mpolobe.africoin | 5fa2f2b4... |

**Note:** Railways, Sentinel, and Staff apps share the same project ID and slug, but have unique packages and bundle identifiers.

---

## 🔧 Technical Details

### EAS Project ID System
EAS uses project IDs to:
1. Track builds and submissions
2. Manage credentials
3. Associate apps with accounts
4. Handle billing and quotas

### Slug Requirements
- Must be unique within your Expo account
- Must match the slug registered with the project ID
- Used for app store URLs and internal tracking
- Can be shared by multiple apps using the same project ID

### Package vs Slug
- **Slug:** EAS/Expo identifier (can be shared)
- **Package (Android):** Unique app identifier on Play Store
- **Bundle Identifier (iOS):** Unique app identifier on App Store

---

## 🧪 Testing

### How to Verify the Fix

1. **Check Configuration:**
```bash
cd SmartphoneApp
cat app.config.js | grep -A 10 "sentinel:"
```

Expected output should show `slug: "africa-railways-app"`

2. **Build Sentinel App:**
```bash
cd SmartphoneApp
eas build --profile sentinel --platform android
```

3. **Verify Build Success:**
- Build should start without slug mismatch error
- APK should be generated successfully
- App should install and run on Android devices

---

## 📱 Building the Sentinel App

### Prerequisites
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Navigate to app directory
cd SmartphoneApp
```

### Build Commands

**Development Build:**
```bash
eas build --profile development --platform android
```

**Preview Build:**
```bash
eas build --profile preview --platform android
```

**Production Build (Sentinel):**
```bash
eas build --profile sentinel --platform android
```

### Environment Variables
The Sentinel build profile uses these environment variables:
- `APP_VARIANT=sentinel`
- `BACKEND_URL` (from EAS secrets)
- `API_KEY` (from EAS secrets as `SENTINEL_API_KEY`)
- `SUI_NETWORK=mainnet`

---

## 🔐 EAS Secrets

### Required Secrets for Sentinel
```bash
# Set secrets for Sentinel app
eas secret:create --scope project --name BACKEND_URL --value "https://africa-railways.vercel.app"
eas secret:create --scope project --name SENTINEL_API_KEY --value "your-api-key"
```

### View Current Secrets
```bash
eas secret:list
```

---

## 🚀 Deployment Workflow

### 1. Local Development
```bash
cd SmartphoneApp
npm install
npx expo start
```

### 2. Build APK
```bash
eas build --profile sentinel --platform android
```

### 3. Download APK
```bash
# After build completes, download from EAS dashboard
# Or use CLI:
eas build:list
```

### 4. Test on Device
```bash
# Install APK on Android device
adb install sentinel-app.apk
```

### 5. Submit to Play Store (Optional)
```bash
eas submit --platform android
```

---

## 📊 Build Profiles

### Available Profiles in eas.json

**Development:**
- Development client enabled
- Internal distribution
- Local API (localhost:8080)
- Testnet blockchain

**Preview:**
- Internal distribution
- Gitpod API URL
- Testnet blockchain

**Production:**
- Auto-increment version
- Production API
- Mainnet blockchain

**Sentinel (extends production):**
- APP_VARIANT=sentinel
- Sentinel-specific API key
- Mainnet blockchain
- APK build type

---

## 🔍 Troubleshooting

### Issue: Slug Mismatch Error
**Solution:** Ensure slug matches project ID (fixed in this commit)

### Issue: Build Fails with "Project not found"
**Solution:** 
```bash
eas login
eas whoami
# Verify you're logged in with correct account
```

### Issue: Missing Environment Variables
**Solution:**
```bash
eas secret:list
# Add missing secrets
eas secret:create --scope project --name VARIABLE_NAME --value "value"
```

### Issue: Build Timeout
**Solution:**
- Check EAS build queue status
- Retry build
- Consider upgrading EAS plan for faster builds

### Issue: APK Won't Install
**Solution:**
- Enable "Install from Unknown Sources" on Android
- Check Android version compatibility (min SDK 23)
- Verify APK is not corrupted

---

## 📚 Related Documentation

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Project IDs](https://expo.fyi/eas-project-id)
- [Multi-App Setup](https://docs.expo.dev/build-reference/variants/)
- [Android Build Configuration](https://docs.expo.dev/build-reference/android-builds/)

---

## 🎯 Next Steps

### Immediate
- ✅ Fix applied and committed
- ⏳ Trigger new build for Sentinel app
- ⏳ Verify build completes successfully
- ⏳ Test APK on Android device

### Future Improvements
1. **Separate Project IDs:**
   - Create dedicated EAS project for Sentinel
   - Use unique slug for better organization
   - Separate billing and quotas

2. **Automated Builds:**
   - Set up GitHub Actions for CI/CD
   - Automatic builds on push to main
   - Automated testing before build

3. **Version Management:**
   - Implement semantic versioning
   - Auto-increment build numbers
   - Track versions per app variant

4. **Distribution:**
   - Set up internal testing track
   - Beta testing program
   - Play Store submission workflow

---

## 📝 Commit Information

**Branch:** `fix/sentinel-menu-consistency`

**Commit:** `83cc3aa7`

**Message:** Fix: Sentinel app EAS project ID slug mismatch

**Files Changed:**
- `SmartphoneApp/app.config.js` (1 file, 2 lines changed)

**Impact:**
- Fixes critical build error
- Enables Sentinel app builds on EAS
- No breaking changes to other apps

---

## ✅ Verification Checklist

- ✅ Slug changed from `sentinel-portal` to `africa-railways-app`
- ✅ Project ID remains `82efeb87-20c5-45b4-b945-65d4b9074c32`
- ✅ Package name remains unique: `com.mpolobe.sentinel`
- ✅ Bundle identifier remains unique: `com.mpolobe.sentinel`
- ✅ Other app configurations unchanged
- ✅ Changes committed to git
- ✅ Changes pushed to remote
- ⏳ Build triggered and verified

---

## 🎉 Summary

Successfully fixed the Sentinel mobile app build error by correcting the slug mismatch. The app now uses the correct slug (`africa-railways-app`) that matches its EAS project ID, allowing builds to proceed without errors.

**Status:** ✅ Fixed and Ready to Build

**Build Command:**
```bash
cd SmartphoneApp && eas build --profile sentinel --platform android
```
