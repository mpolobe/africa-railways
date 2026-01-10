# Correct Build Commands Guide

## ⚠️ Important: Use App-Specific Profiles

### ❌ WRONG - Don't Use Generic "production" Profile
```bash
# This will fail - doesn't specify which app to build
eas build --profile production --platform android
```

**Why it fails:**
- Doesn't set APP_VARIANT environment variable
- Uses generic production profile
- Doesn't load app-specific configurations
- May use wrong Node version

---

## ✅ CORRECT - Use App-Specific Profiles

### Build Railways App
```bash
cd SmartphoneApp
eas build --profile railways --platform android
```

**What this does:**
- Sets `APP_VARIANT=railways`
- Uses Node 20.18.0
- Loads Railways-specific config
- Builds com.mpolobe.railways package

### Build Africoin App
```bash
cd SmartphoneApp
eas build --profile africoin --platform android
```

**What this does:**
- Sets `APP_VARIANT=africoin`
- Uses Node 20.18.0
- Loads Africoin-specific config
- Builds com.mpolobe.africoin package

### Build Sentinel App
```bash
cd SmartphoneApp
eas build --profile sentinel --platform android
```

**What this does:**
- Sets `APP_VARIANT=sentinel`
- Uses Node 20.18.0
- Loads Sentinel-specific config
- Builds com.mpolobe.sentinel package

### Build Staff App
```bash
cd SmartphoneApp
eas build --profile staff --platform android
```

**What this does:**
- Sets `APP_VARIANT=staff`
- Uses Node 20.18.0
- Loads Staff-specific config
- Builds com.mpolobe.staff package

---

## 🔧 Build Profile Configuration

### Profile Hierarchy

```
development (base)
  ├─ node: 20.18.0
  └─ developmentClient: true

preview (base)
  ├─ node: 20.18.0
  └─ distribution: internal

production (base)
  ├─ node: 20.18.0
  ├─ autoIncrement: true
  └─ android.buildType: apk

railways (extends production)
  ├─ node: 20.18.0 (explicit)
  └─ APP_VARIANT: railways

africoin (extends production)
  ├─ node: 20.18.0 (explicit)
  └─ APP_VARIANT: africoin

sentinel (extends production)
  ├─ node: 20.18.0 (explicit)
  └─ APP_VARIANT: sentinel

staff (extends production)
  ├─ node: 20.18.0 (explicit)
  └─ APP_VARIANT: staff
```

---

## 📋 Complete Build Commands

### Android Builds

**Development Build:**
```bash
cd SmartphoneApp
APP_VARIANT=sentinel eas build --profile development --platform android
```

**Preview Build:**
```bash
cd SmartphoneApp
eas build --profile sentinel --platform android --non-interactive
```

**Production Build:**
```bash
cd SmartphoneApp
eas build --profile sentinel --platform android
```

### iOS Builds

**Sentinel iOS:**
```bash
cd SmartphoneApp
eas build --profile sentinel --platform ios
```

**All Platforms:**
```bash
cd SmartphoneApp
eas build --profile sentinel --platform all
```

---

## 🚀 Codemagic Builds

### Trigger via Git Tag

**Sentinel:**
```bash
git tag sentinel-v1.0.0
git push origin sentinel-v1.0.0
```

**Railways:**
```bash
git tag railways-v1.0.0
git push origin railways-v1.0.0
```

**Africoin:**
```bash
git tag africoin-v1.0.0
git push origin africoin-v1.0.0
```

**Staff:**
```bash
git tag staff-v1.0.0
git push origin staff-v1.0.0
```

### Trigger via Branch Push

Push to main or develop branch:
```bash
git push origin main
```

Codemagic will automatically detect and build based on workflow configuration.

---

## 🔍 Verify Build Configuration

### Check Which Profile Will Be Used

```bash
cd SmartphoneApp
eas build:configure
```

### View Build Configuration

```bash
cd SmartphoneApp
cat eas.json | jq '.build.sentinel'
```

### Test Configuration Locally

```bash
cd SmartphoneApp
APP_VARIANT=sentinel npx expo config --type public
```

---

## ⚠️ Common Mistakes

### Mistake 1: Using Wrong Profile
```bash
# ❌ WRONG
eas build --profile production --platform android

# ✅ CORRECT
eas build --profile sentinel --platform android
```

### Mistake 2: Missing APP_VARIANT
```bash
# ❌ WRONG - APP_VARIANT not set
eas build --platform android

# ✅ CORRECT - Profile sets APP_VARIANT
eas build --profile sentinel --platform android
```

### Mistake 3: Wrong Directory
```bash
# ❌ WRONG - Not in SmartphoneApp directory
cd /workspaces/africa-railways
eas build --profile sentinel --platform android

# ✅ CORRECT - In SmartphoneApp directory
cd /workspaces/africa-railways/SmartphoneApp
eas build --profile sentinel --platform android
```

### Mistake 4: Not Specifying Platform
```bash
# ❌ WRONG - Platform not specified
eas build --profile sentinel

# ✅ CORRECT - Platform specified
eas build --profile sentinel --platform android
```

---

## 🎯 Build Options

### Non-Interactive Mode
```bash
eas build --profile sentinel --platform android --non-interactive
```

### Clear Cache
```bash
eas build --profile sentinel --platform android --clear-cache
```

### Local Build (No EAS Credits)
```bash
eas build --profile sentinel --platform android --local
```

### Wait for Build
```bash
eas build --profile sentinel --platform android --wait
```

### No Wait (Submit and Exit)
```bash
eas build --profile sentinel --platform android --no-wait
```

---

## 📊 Build Status Commands

### List All Builds
```bash
eas build:list
```

### View Specific Build
```bash
eas build:view [BUILD_ID]
```

### View Build Logs
```bash
eas build:view [BUILD_ID] --logs
```

### Cancel Build
```bash
eas build:cancel [BUILD_ID]
```

### Download Build
```bash
eas build:download --id [BUILD_ID]
```

---

## 🔐 Environment Variables

### Required for Each App

**Railways:**
- `BACKEND_URL`
- `RAILWAYS_API_KEY`

**Africoin:**
- `BACKEND_URL`
- `AFRICOIN_API_KEY`

**Sentinel:**
- `BACKEND_URL`
- `SENTINEL_API_KEY`

**Staff:**
- `BACKEND_URL`
- `STAFF_API_KEY`
- `ALCHEMY_SDK_KEY`

### Set EAS Secrets
```bash
eas secret:create --scope project --name BACKEND_URL --value "https://africa-railways.vercel.app"
eas secret:create --scope project --name SENTINEL_API_KEY --value "your-key"
```

### List Secrets
```bash
eas secret:list
```

---

## 🐛 Troubleshooting

### Error: "configs.toReversed is not a function"

**Cause:** Using old Node version

**Solution:** Ensure profile has `"node": "20.18.0"`

**Verify:**
```bash
grep -A 5 '"sentinel"' SmartphoneApp/eas.json | grep node
# Should show: "node": "20.18.0"
```

### Error: "Slug mismatch"

**Cause:** Slug doesn't match project ID

**Solution:** Use correct slug in app.config.js

**Verify:**
```bash
cd SmartphoneApp
APP_VARIANT=sentinel node -e "console.log(require('./app.config.js').expo.slug)"
# Should show: africa-railways-app
```

### Error: "100% build credits used"

**Cause:** Monthly build limit reached

**Solutions:**
1. Upgrade EAS plan
2. Wait for monthly reset
3. Use local builds: `--local` flag
4. Use Codemagic instead

### Error: "APP_VARIANT not set"

**Cause:** Using wrong build profile

**Solution:** Use app-specific profile (sentinel, railways, etc.)

---

## 📚 Quick Reference

### Build All Apps (One by One)

```bash
cd SmartphoneApp

# Build Railways
eas build --profile railways --platform android --non-interactive

# Build Africoin
eas build --profile africoin --platform android --non-interactive

# Build Sentinel
eas build --profile sentinel --platform android --non-interactive

# Build Staff
eas build --profile staff --platform android --non-interactive
```

### Build Script

Create `build-all.sh`:
```bash
#!/bin/bash
cd SmartphoneApp

echo "Building all apps..."

eas build --profile railways --platform android --non-interactive --no-wait &
PID1=$!

eas build --profile africoin --platform android --non-interactive --no-wait &
PID2=$!

eas build --profile sentinel --platform android --non-interactive --no-wait &
PID3=$!

eas build --profile staff --platform android --non-interactive --no-wait &
PID4=$!

wait $PID1 $PID2 $PID3 $PID4

echo "All builds submitted!"
```

Make executable:
```bash
chmod +x build-all.sh
./build-all.sh
```

---

## ✅ Pre-Build Checklist

Before running build:

- [ ] In SmartphoneApp directory
- [ ] Using app-specific profile (not "production")
- [ ] Platform specified (--platform android)
- [ ] Node 20.18.0 in profile
- [ ] APP_VARIANT set by profile
- [ ] EAS secrets configured
- [ ] Build credits available (or using --local)
- [ ] Latest code committed and pushed

---

## 🎉 Summary

**Always use app-specific profiles:**
- ✅ `--profile railways`
- ✅ `--profile africoin`
- ✅ `--profile sentinel`
- ✅ `--profile staff`

**Never use generic profiles for app builds:**
- ❌ `--profile production`
- ❌ `--profile development` (without APP_VARIANT)
- ❌ `--profile preview` (without APP_VARIANT)

**Correct command format:**
```bash
cd SmartphoneApp
eas build --profile [APP_NAME] --platform android
```

---

**Last Updated:** January 10, 2025
**Status:** All profiles configured with Node 20.18.0
**Ready:** Use app-specific profiles for builds
