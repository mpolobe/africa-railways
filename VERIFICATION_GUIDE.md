# ✅ Configuration Verification Guide

## 🎯 Current Configuration

### Railways App (APP_VARIANT=railways)
```json
{
  "expo": {
    "name": "Africa Railways Hub",
    "slug": "africa-railways",
    "extra": {
      "eas": {
        "projectId": "africa-railways"
      }
    }
  }
}
```

### Africoin App (APP_VARIANT=africoin)
```json
{
  "expo": {
    "name": "Africoin Wallet",
    "slug": "africoin-app",
    "extra": {
      "eas": {
        "projectId": "africoin-app"
      }
    }
  }
}
```

---

## 🔍 Step 1: Verify Project Slugs in Expo Dashboard

### Check Railways Project

1. **Go to Expo Dashboard:**
   ```
   https://expo.dev/
   ```

2. **Navigate to Projects:**
   - Click on your account
   - Find "africa-railways" or "Africa Railways Hub"

3. **Check the URL:**
   ```
   https://expo.dev/accounts/[your-username]/projects/[slug]
                                                        ^^^^^^
                                                        This is your slug!
   ```

4. **Verify:**
   - If URL shows: `.../projects/africa-railways` ✅ Correct!
   - If URL shows: `.../projects/africa-railways-app` ❌ Need to update config

### Check Africoin Project

1. **Find Africoin project** in dashboard

2. **Check the URL:**
   ```
   https://expo.dev/accounts/[your-username]/projects/africoin-app
   ```

3. **Verify:**
   - If URL shows: `.../projects/africoin-app` ✅ Correct!

---

## 🔍 Step 2: Verify Using EAS CLI (If Available)

### Check Project List

```bash
cd SmartphoneApp
eas project:list
```

**Expected output:**
```
┌─────────────────────┬──────────────────────────────┐
│ Slug                │ Name                         │
├─────────────────────┼──────────────────────────────┤
│ africa-railways     │ Africa Railways Hub          │
│ africoin-app        │ Africoin Wallet              │
└─────────────────────┴──────────────────────────────┘
```

### Check Specific Project Info

```bash
# For Railways
eas project:info

# Should show:
# Slug: africa-railways
# Name: Africa Railways Hub
```

---

## 🔍 Step 3: Verify Configuration Files

### Check app.config.js

```bash
cd SmartphoneApp
cat app.config.js | grep -A 2 "slug:"
cat app.config.js | grep -A 2 "projectId:"
```

**Expected output:**
```javascript
slug: IS_RAILWAYS ? "africa-railways" : "africoin-app",

projectId: IS_RAILWAYS ? "africa-railways" : "africoin-app"
```

**Verify:** slug and projectId use the same values ✅

### Check eas.json

```bash
cat eas.json | grep -A 5 "railways"
cat eas.json | grep -A 5 "africoin"
```

**Expected output:**
```json
"railways": {
  "extends": "production",
  "android": {
    "buildType": "apk"
  },
  "env": {
    "APP_VARIANT": "railways",
    ...
  }
}
```

---

## 🧪 Step 4: Test Locally (Optional)

### Test Railways Configuration

```bash
cd SmartphoneApp
APP_VARIANT=railways npx expo start
```

**Check for:**
- ✅ No configuration errors
- ✅ App starts successfully
- ✅ Correct app name in terminal

### Test Africoin Configuration

```bash
APP_VARIANT=africoin npx expo start
```

**Check for:**
- ✅ No configuration errors
- ✅ App starts successfully
- ✅ Correct app name in terminal

---

## 🚀 Step 5: Test Build Process

### Build Railways App

```bash
cd SmartphoneApp
eas build --platform android --profile railways --non-interactive
```

**Watch for:**
```
✅ Project config validated
✅ Slug: africa-railways
✅ ProjectId: africa-railways
✅ Build started successfully
```

### Build Africoin App

```bash
eas build --platform android --profile africoin --non-interactive
```

**Watch for:**
```
✅ Project config validated
✅ Slug: africoin-app
✅ ProjectId: africoin-app
✅ Build started successfully
```

---

## ❌ Common Issues and Fixes

### Issue 1: Slug Mismatch Error

**Error:**
```
Slug for project identified by "extra.eas.projectId" (X) 
does not match the "slug" field (Y)
```

**Fix:**
1. Check Expo dashboard for actual slug
2. Update app.config.js to match:
   ```javascript
   slug: "actual-slug-from-dashboard"
   projectId: "actual-slug-from-dashboard"
   ```

### Issue 2: Project Not Found

**Error:**
```
Project not found
```

**Fix:**
1. Verify you're logged into correct Expo account:
   ```bash
   eas whoami
   ```
2. Check project exists in dashboard
3. Verify projectId matches slug

### Issue 3: Multiple Projects with Same Slug

**Error:**
```
Multiple projects found with slug
```

**Fix:**
1. Use unique slugs for each project
2. Ensure Railways and Africoin have different slugs

---

## 📊 Verification Checklist

### Configuration Files
- [ ] app.config.js exists in SmartphoneApp/
- [ ] app.json removed or backed up
- [ ] slug and projectId match in app.config.js
- [ ] eas.json has railways and africoin profiles
- [ ] APP_VARIANT set in each profile

### Expo Dashboard
- [ ] Railways project exists
- [ ] Railways slug matches config
- [ ] Africoin project exists
- [ ] Africoin slug matches config

### Local Testing
- [ ] Railways config works locally
- [ ] Africoin config works locally
- [ ] No configuration errors

### Build Testing
- [ ] Railways build starts successfully
- [ ] Africoin build starts successfully
- [ ] No slug mismatch errors

---

## 🎯 Expected Slugs

Based on our configuration:

| App | Slug | ProjectId | Match |
|-----|------|-----------|-------|
| Railways | `africa-railways` | `africa-railways` | ✅ |
| Africoin | `africoin-app` | `africoin-app` | ✅ |

---

## 🔧 If Slugs Don't Match Dashboard

### Option 1: Update Config to Match Dashboard

If dashboard shows different slugs, update app.config.js:

```javascript
// Example: If dashboard shows "my-railways-app"
slug: IS_RAILWAYS ? "my-railways-app" : "my-africoin-app",
projectId: IS_RAILWAYS ? "my-railways-app" : "my-africoin-app"
```

### Option 2: Create New Projects with Desired Slugs

If you want to use specific slugs:

```bash
# Create new project
eas project:init

# Follow prompts to set desired slug
```

---

## 📱 Current Build Status

**Build #9:** 🟢 Running  
**View:** https://github.com/mpolobe/africa-railways/actions

**Configuration:**
- Railways: slug=`africa-railways`, projectId=`africa-railways`
- Africoin: slug=`africoin-app`, projectId=`africoin-app`

---

## ✅ Success Indicators

When everything is correct, you'll see:

### In Build Logs
```
✅ Validating project configuration
✅ Slug: africa-railways
✅ Project ID: africa-railways
✅ Configuration valid
✅ Starting build...
```

### In Expo Dashboard
- Build appears under correct project
- No error messages
- Build progresses normally

---

## 🆘 Need Help?

### Check These First

1. **Expo Dashboard URL** - What slug is shown?
2. **app.config.js** - What slug and projectId are set?
3. **Build logs** - What error message appears?

### Get Project Info

```bash
# Login to EAS
eas login

# Check current project
eas project:info

# List all projects
eas project:list
```

---

## 📚 Related Documentation

- [BUILD_9_FINAL_FIX.md](./BUILD_9_FINAL_FIX.md) - Latest fix
- [SLUG_ISSUE_EXPLAINED.md](./SLUG_ISSUE_EXPLAINED.md) - Slug explanation
- [ALL_FIXES_COMPLETE.md](./ALL_FIXES_COMPLETE.md) - All fixes

---

## 🎊 Next Steps

1. **Verify slugs** in Expo dashboard
2. **Confirm configuration** matches dashboard
3. **Wait for build** to complete (~20 min)
4. **Download APKs** from dashboard
5. **Test on device**

---

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║         ✅ VERIFICATION GUIDE COMPLETE ✅                    ║
║                                                              ║
║     Follow the steps above to verify your configuration      ║
║                                                              ║
║     Current build should succeed if slugs match!             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

**The configuration is set correctly based on standard EAS practices.**

**If the build fails, check the Expo dashboard to confirm the actual slugs registered for your projects.**
