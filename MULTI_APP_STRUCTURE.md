# 📱 Multi-App Structure Guide

Configuration for 4 separate mobile applications without conflicts.

---

## App Overview

### 1. Africoin Android
- **Package**: `com.mpolobe.africoin.android`
- **EAS Project**: Africoin Android Project
- **Purpose**: Africoin token management (Android)

### 2. Africoin iOS
- **Bundle ID**: `com.mpolobe.africoin.ios`
- **EAS Project**: Africoin iOS Project
- **Purpose**: Africoin token management (iOS)

### 3. Africa Railways Android
- **Package**: `com.mpolobe.africarailways.hub`
- **EAS Project**: `82efeb87-20c5-45b4-b945-65d4b9074c32`
- **Purpose**: Railway operations hub (Android)

### 4. Africa Railways iOS
- **Bundle ID**: `com.mpolobe.africarailways.hub`
- **EAS Project**: `82efeb87-20c5-45b4-b945-65d4b9074c32`
- **Purpose**: Railway operations hub (iOS)

---

## Directory Structure

```
africa-railways/
├── app.json                          # Root config (Africa Railways)
├── eas.json                          # Root EAS config
├── africoin-android/
│   ├── app.json                      # Africoin Android config
│   ├── eas.json                      # Africoin Android EAS config
│   └── src/
├── africoin-ios/
│   ├── app.json                      # Africoin iOS config
│   ├── eas.json                      # Africoin iOS EAS config
│   └── src/
├── SmartphoneApp/                    # Africa Railways (both platforms)
│   ├── app.json
│   ├── eas.json
│   └── src/
└── build-scripts/
    ├── build-africoin-android.sh
    ├── build-africoin-ios.sh
    ├── build-railways-android.sh
    └── build-railways-ios.sh
```

---

## Configuration Files

### Root app.json (Africa Railways - Both Platforms)
```json
{
  "expo": {
    "name": "Africa Railways Sovereign Hub",
    "slug": "africa-railways",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.mpolobe.africarailways.hub"
    },
    "android": {
      "package": "com.mpolobe.africarailways.hub"
    },
    "extra": {
      "eas": {
        "projectId": "82efeb87-20c5-45b4-b945-65d4b9074c32"
      }
    }
  }
}
```

### Africoin Android app.json
```json
{
  "expo": {
    "name": "Africoin Wallet",
    "slug": "africoin-android",
    "version": "1.0.0",
    "android": {
      "package": "com.mpolobe.africoin.android"
    },
    "extra": {
      "eas": {
        "projectId": "AFRICOIN_ANDROID_PROJECT_ID"
      }
    }
  }
}
```

### Africoin iOS app.json
```json
{
  "expo": {
    "name": "Africoin Wallet",
    "slug": "africoin-ios",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.mpolobe.africoin.ios"
    },
    "extra": {
      "eas": {
        "projectId": "AFRICOIN_IOS_PROJECT_ID"
      }
    }
  }
}
```

---

## Build Commands

### Africa Railways

**Android:**
```bash
cd /workspaces/africa-railways
npx eas-cli build --platform android --profile production --non-interactive
```

**iOS:**
```bash
cd /workspaces/africa-railways
npx eas-cli build --platform ios --profile production --non-interactive
```

### Africoin Android

**Build:**
```bash
cd /workspaces/africa-railways/africoin-android
npx eas-cli build --platform android --profile production --non-interactive
```

### Africoin iOS

**Build:**
```bash
cd /workspaces/africa-railways/africoin-ios
npx eas-cli build --platform ios --profile production --non-interactive
```

---

## EAS Project Setup

### Create Separate EAS Projects

**1. Africa Railways (Already Created)**
- Project ID: `82efeb87-20c5-45b4-b945-65d4b9074c32`
- Platforms: Android + iOS

**2. Africoin Android**
```bash
cd africoin-android
npx eas-cli init
# Follow prompts to create new project
```

**3. Africoin iOS**
```bash
cd africoin-ios
npx eas-cli init
# Follow prompts to create new project
```

---

## Preventing Conflicts

### 1. Unique Bundle Identifiers
✅ **Africa Railways Android**: `com.mpolobe.africarailways.hub`  
✅ **Africa Railways iOS**: `com.mpolobe.africarailways.hub`  
✅ **Africoin Android**: `com.mpolobe.africoin.android`  
✅ **Africoin iOS**: `com.mpolobe.africoin.ios`  

### 2. Separate EAS Projects
Each app has its own EAS project ID to prevent build conflicts.

### 3. Different Working Directories
Build from the correct directory for each app.

### 4. Separate Build Profiles
Each app can have its own build profiles in `eas.json`.

---

## Build Scripts

### build-railways-android.sh
```bash
#!/bin/bash
echo "🚂 Building Africa Railways Android..."
cd /workspaces/africa-railways
npx eas-cli build --platform android --profile production --non-interactive
```

### build-railways-ios.sh
```bash
#!/bin/bash
echo "🚂 Building Africa Railways iOS..."
cd /workspaces/africa-railways
npx eas-cli build --platform ios --profile production --non-interactive
```

### build-africoin-android.sh
```bash
#!/bin/bash
echo "🪙 Building Africoin Android..."
cd /workspaces/africa-railways/africoin-android
npx eas-cli build --platform android --profile production --non-interactive
```

### build-africoin-ios.sh
```bash
#!/bin/bash
echo "🪙 Building Africoin iOS..."
cd /workspaces/africa-railways/africoin-ios
npx eas-cli build --platform ios --profile production --non-interactive
```

---

## GitHub Actions Workflows

### .github/workflows/build-railways.yml
```yaml
name: Build Africa Railways Apps
on:
  push:
    branches: ["main"]
    paths:
      - 'SmartphoneApp/**'
      - 'app.json'
      - 'eas.json'
jobs:
  build_android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          token: ${{ secrets.EXPO_TOKEN }}
      - run: npx eas-cli build --platform android --profile production --non-interactive
```

### .github/workflows/build-africoin-android.yml
```yaml
name: Build Africoin Android
on:
  push:
    branches: ["main"]
    paths:
      - 'africoin-android/**'
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          token: ${{ secrets.EXPO_TOKEN_AFRICOIN }}
      - run: |
          cd africoin-android
          npx eas-cli build --platform android --profile production --non-interactive
```

---

## Store Listings

### Google Play Store

**Africa Railways:**
- URL: `https://play.google.com/store/apps/details?id=com.mpolobe.africarailways.hub`

**Africoin:**
- URL: `https://play.google.com/store/apps/details?id=com.mpolobe.africoin.android`

### Apple App Store

**Africa Railways:**
- Bundle ID: `com.mpolobe.africarailways.hub`

**Africoin:**
- Bundle ID: `com.mpolobe.africoin.ios`

---

## Makefile Targets

Add to your Makefile:

```makefile
# Build Africa Railways Android
build-railways-android:
	@echo "🚂 Building Africa Railways Android..."
	npx eas-cli build --platform android --profile production --non-interactive

# Build Africa Railways iOS
build-railways-ios:
	@echo "🚂 Building Africa Railways iOS..."
	npx eas-cli build --platform ios --profile production --non-interactive

# Build Africoin Android
build-africoin-android:
	@echo "🪙 Building Africoin Android..."
	cd africoin-android && npx eas-cli build --platform android --profile production --non-interactive

# Build Africoin iOS
build-africoin-ios:
	@echo "🪙 Building Africoin iOS..."
	cd africoin-ios && npx eas-cli build --platform ios --profile production --non-interactive

# Build all apps
build-all-apps:
	@$(MAKE) build-railways-android
	@$(MAKE) build-railways-ios
	@$(MAKE) build-africoin-android
	@$(MAKE) build-africoin-ios
```

---

## Quick Reference

### Build Commands

```bash
# Africa Railways
make build-railways-android
make build-railways-ios

# Africoin
make build-africoin-android
make build-africoin-ios

# All apps
make build-all-apps
```

### Check Build Status

```bash
# Africa Railways
npx eas-cli build:list --project-id 82efeb87-20c5-45b4-b945-65d4b9074c32

# Africoin Android
cd africoin-android && npx eas-cli build:list

# Africoin iOS
cd africoin-ios && npx eas-cli build:list
```

---

## Troubleshooting

### Wrong App Building

**Problem**: Building the wrong app

**Solution**: 
1. Check current directory: `pwd`
2. Verify app.json: `cat app.json | grep projectId`
3. Build from correct directory

### Bundle Identifier Conflicts

**Problem**: Apps have same bundle ID

**Solution**: Ensure each app has unique identifiers:
- Africa Railways: `com.mpolobe.africarailways.hub`
- Africoin Android: `com.mpolobe.africoin.android`
- Africoin iOS: `com.mpolobe.africoin.ios`

### EAS Project Confusion

**Problem**: Builds going to wrong EAS project

**Solution**: Check `extra.eas.projectId` in each app.json

---

## Best Practices

1. ✅ Always build from the correct directory
2. ✅ Use unique bundle identifiers
3. ✅ Separate EAS projects for each app
4. ✅ Use build scripts to avoid mistakes
5. ✅ Test builds with preview profile first
6. ✅ Document which app is which
7. ✅ Use different Expo tokens if needed

---

**Built for Africa, By Africa** 🌍📱
