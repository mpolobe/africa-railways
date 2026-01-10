# Build Troubleshooting Guide

## 🐛 Issue: Build Using Wrong Profile

### Symptom
```
Resolved "production" environment for the build.
Environment variables loaded from the "production" build profile
```

### Problem
The build is using the generic "production" profile instead of app-specific profiles (sentinel, railways, africoin, staff).

---

## ✅ Solution Applied

### GitHub Actions Workflow Updated

**File:** `.github/workflows/eas-build.yml`

**Changes:**
1. Changed default profile from "production" to "sentinel"
2. Removed "production" from profile options
3. Added all app-specific profiles (railways, africoin, sentinel, staff)

**Now when triggering from GitHub Actions:**
- Default profile: **sentinel** ✅
- Available options: railways, africoin, sentinel, staff, development, preview
- No longer defaults to generic "production" profile

---

## 🚀 Correct Build Commands

### From CLI
```bash
cd SmartphoneApp
eas build --profile sentinel --platform android
```

### From GitHub Actions
1. Go to Actions tab
2. Select "EAS Build (Manual Only)"
3. Choose profile: **sentinel** (now default)
4. Choose platform: **android**
5. Run workflow

### From Codemagic
```bash
git tag sentinel-v1.0.2
git push origin sentinel-v1.0.2
```

---

## ⚠️ Build Credits: 100% Used

**You cannot start new builds until:**
1. Upgrade EAS plan ($29/month)
2. Use local builds (--local flag)
3. Wait for monthly reset
4. Use Codemagic (separate credits)

---

## 📊 Summary

- ✅ GitHub Actions updated to use app-specific profiles
- ✅ Default changed from "production" to "sentinel"
- ⚠️ Build credits exhausted - need upgrade or alternative
- ✅ All configurations correct and ready

**Status:** Ready to build once credits available or using local/Codemagic
