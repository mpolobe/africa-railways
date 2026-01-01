# 📱 Apps Quick Reference Card

Quick guide to building the correct app without conflicts.

---

## 🚂 Africa Railways Apps

### Android
```bash
# Using Makefile
make build-railways-android

# Using script
./build-scripts/build-railways-android.sh

# Direct command
npx eas-cli build --platform android --profile production --non-interactive
```

**Details:**
- **Package**: `com.mpolobe.africarailways.hub`
- **EAS Project**: `82efeb87-20c5-45b4-b945-65d4b9074c32`
- **Config**: `/workspaces/africa-railways/app.json`

### iOS
```bash
# Using Makefile
make build-railways-ios

# Using script
./build-scripts/build-railways-ios.sh

# Direct command
npx eas-cli build --platform ios --profile production --non-interactive
```

**Details:**
- **Bundle ID**: `com.mpolobe.africarailways.hub`
- **EAS Project**: `82efeb87-20c5-45b4-b945-65d4b9074c32`
- **Config**: `/workspaces/africa-railways/app.json`

---

## 🪙 Africoin Apps

### Android
```bash
# To be created
cd africoin-android
npx eas-cli build --platform android --profile production --non-interactive
```

**Details:**
- **Package**: `com.mpolobe.africoin.android`
- **EAS Project**: To be created
- **Config**: `/workspaces/africa-railways/africoin-android/app.json`

### iOS
```bash
# To be created
cd africoin-ios
npx eas-cli build --platform ios --profile production --non-interactive
```

**Details:**
- **Bundle ID**: `com.mpolobe.africoin.ios`
- **EAS Project**: To be created
- **Config**: `/workspaces/africa-railways/africoin-ios/app.json`

---

## Bundle Identifiers

| App | Platform | Identifier |
|-----|----------|------------|
| Africa Railways | Android | `com.mpolobe.africarailways.hub` |
| Africa Railways | iOS | `com.mpolobe.africarailways.hub` |
| Africoin | Android | `com.mpolobe.africoin.android` |
| Africoin | iOS | `com.mpolobe.africoin.ios` |

---

## EAS Project IDs

| App | Project ID |
|-----|------------|
| Africa Railways | `82efeb87-20c5-45b4-b945-65d4b9074c32` |
| Africoin Android | TBD (create with `eas init`) |
| Africoin iOS | TBD (create with `eas init`) |

---

## Store URLs

### Google Play Store

**Africa Railways:**
```
https://play.google.com/store/apps/details?id=com.mpolobe.africarailways.hub
```

**Africoin:**
```
https://play.google.com/store/apps/details?id=com.mpolobe.africoin.android
```

### Apple App Store

**Africa Railways:**
```
https://apps.apple.com/app/africa-railways
```

**Africoin:**
```
https://apps.apple.com/app/africoin
```

---

## Build All Apps

```bash
make build-all-apps
```

This will build:
1. Africa Railways Android
2. Africa Railways iOS

---

## Monitor Builds

```bash
# Check all builds
npx eas-cli build:list

# Check specific project
npx eas-cli build:list --project-id 82efeb87-20c5-45b4-b945-65d4b9074c32

# View build details
npx eas-cli build:view [BUILD_ID]
```

**Expo Dashboard:**
https://expo.dev/accounts/mpolobe/projects/africa-railways/builds

---

## Prevent Conflicts

### ✅ DO:
- Build from correct directory
- Use dedicated build scripts
- Verify bundle identifier before building
- Check EAS project ID in app.json

### ❌ DON'T:
- Use same bundle identifier for different apps
- Build from wrong directory
- Mix up EAS project IDs
- Forget to check which app you're building

---

## Troubleshooting

### Wrong App Built

**Check:**
```bash
# Verify current directory
pwd

# Check app.json
cat app.json | grep -E "name|package|bundleIdentifier|projectId"
```

### Build Goes to Wrong Project

**Fix:**
1. Check `extra.eas.projectId` in app.json
2. Ensure you're in correct directory
3. Use dedicated build scripts

---

## Quick Commands

```bash
# Check which app config
cat app.json | grep name

# Check bundle ID
cat app.json | grep -E "package|bundleIdentifier"

# Check EAS project
cat app.json | grep projectId

# Login to Expo
npx eas-cli login

# Check login status
npx eas-cli whoami
```

---

**Built for Africa, By Africa** 🌍📱
