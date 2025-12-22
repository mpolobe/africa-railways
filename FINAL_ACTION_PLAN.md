# 🎯 Final Action Plan - Verify and Build

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║         ✅ CONFIGURATION COMPLETE - VERIFY NOW! ✅          ║
║                                                              ║
║     Follow these steps to ensure success                     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 🔍 Step 1: Verify Your Expo Dashboard

### Check Actual Project Slugs

1. **Go to Expo Dashboard:**
   ```
   https://expo.dev/
   ```

2. **Find Your Projects:**
   - Look for "Africa Railways" or similar
   - Look for "Africoin" or similar

3. **Check the URLs:**
   ```
   https://expo.dev/accounts/[username]/projects/[SLUG]
                                                  ^^^^^^
                                                  This is your actual slug!
   ```

4. **Write Down the Slugs:**
   - Railways project slug: `________________`
   - Africoin project slug: `________________`

---

## 📝 Step 2: Update Configuration to Match

### If Dashboard Shows Different Slugs

Update **both** files to match what you see in the dashboard:

#### Update SmartphoneApp/eas.json

```json
{
  "build": {
    "railways": {
      "slug": "[exact-slug-from-dashboard]",  // ← Use exact slug
      "env": { "APP_VARIANT": "railways" }
    },
    "africoin": {
      "slug": "[exact-slug-from-dashboard]",  // ← Use exact slug
      "env": { "APP_VARIANT": "africoin" }
    }
  }
}
```

#### Update SmartphoneApp/app.config.js

```javascript
const IS_RAILWAYS = process.env.APP_VARIANT === 'railways';

module.exports = {
  expo: {
    slug: IS_RAILWAYS ? "[railways-slug]" : "[africoin-slug]",
    extra: {
      eas: {
        projectId: IS_RAILWAYS ? "[railways-slug]" : "[africoin-slug]"
      }
    }
  }
};
```

**Important:** slug and projectId must be **identical**!

---

## 💾 Step 3: Save and Commit Changes

### If You Made Changes

```bash
cd /workspaces/africa-railways
git add SmartphoneApp/eas.json SmartphoneApp/app.config.js
git commit -m "fix: update slugs to match Expo dashboard"
git push origin main
```

### If No Changes Needed

The current configuration should work:
- Railways: `africa-railways`
- Africoin: `africoin-app`

---

## 🚀 Step 4: Run the Build

### Option 1: Automatic Build (Recommended)

The build is already running from the last push:
```
https://github.com/mpolobe/africa-railways/actions
```

Wait for it to complete (~20 minutes).

### Option 2: Manual Build (If Needed)

If you need to trigger a new build:

```bash
cd SmartphoneApp

# Build Railways app
eas build --platform android --profile railways --non-interactive

# Build Africoin app
eas build --platform android --profile africoin --non-interactive
```

### Option 3: Clear Cache and Rebuild

If previous builds are causing issues:

```bash
cd SmartphoneApp

# Clear cache and build
eas build --platform android --profile railways --clear-cache --non-interactive
eas build --platform android --profile africoin --clear-cache --non-interactive
```

---

## ✅ Step 5: Verify Build Success

### Watch for Success Indicators

In the build logs, you should see:

```
✅ Validating project configuration
✅ Slug: africa-railways (or africoin-app)
✅ Project ID: africa-railways (or africoin-app)
✅ Slug matches project ID
✅ Configuration valid
✅ Starting build...
✅ Build started successfully
✅ Build ID: [id]
✅ Build URL: https://expo.dev/...
```

### No More Errors

You should **NOT** see:
```
❌ Slug for project identified by "extra.eas.projectId" (X) 
   does not match the "slug" field (Y)
```

---

## 📱 Step 6: Download and Test APKs

### After Build Completes (~20 minutes)

1. **Go to Expo Dashboard:**
   ```
   https://expo.dev/
   ```

2. **Navigate to Builds:**
   - Click on your project
   - Click "Builds" tab
   - Find the completed builds

3. **Download APKs:**
   - Click "Download" for Railways app
   - Click "Download" for Africoin app

4. **Install on Device:**
   ```bash
   adb install africa-railways.apk
   adb install africoin-app.apk
   ```

5. **Test Both Apps:**
   - Launch each app
   - Verify correct name and branding
   - Test backend connectivity
   - Verify API keys work

---

## 🎯 Current Configuration

### What We Have Set

**Railways App:**
```
eas.json:
  slug: "africa-railways"

app.config.js:
  slug: "africa-railways"
  projectId: "africa-railways"
```

**Africoin App:**
```
eas.json:
  slug: "africoin-app"

app.config.js:
  slug: "africoin-app"
  projectId: "africoin-app"
```

### Verification Checklist

- [ ] Checked Expo dashboard for actual slugs
- [ ] Slugs in config match dashboard
- [ ] slug === projectId in app.config.js
- [ ] eas.json has explicit slug
- [ ] Changes saved and committed
- [ ] Build triggered
- [ ] Build completed successfully
- [ ] APKs downloaded
- [ ] Apps tested on device

---

## 🔍 Troubleshooting

### If Build Still Fails with Slug Mismatch

1. **Check the error message carefully:**
   ```
   Slug for project identified by "extra.eas.projectId" (X) 
   does not match the "slug" field (Y)
   ```
   - X = what projectId points to
   - Y = what slug is set to

2. **Go to Expo Dashboard:**
   - Find the actual project
   - Note the exact slug from the URL

3. **Update both files to match:**
   - Set slug in eas.json to match dashboard
   - Set slug and projectId in app.config.js to match dashboard

4. **Commit and rebuild:**
   ```bash
   git add .
   git commit -m "fix: match slugs to Expo dashboard"
   git push origin main
   ```

---

## 📊 Build Status

**Current Build:** #12  
**Status:** 🟢 Running  
**View:** https://github.com/mpolobe/africa-railways/actions

**Configuration:**
- Both slug and projectId present ✅
- Both values match ✅
- Explicit slug in eas.json ✅

---

## 🎓 Key Points to Remember

### 1. Slug Must Match Dashboard

The slug in your configuration **must exactly match** the slug shown in your Expo dashboard URL.

### 2. Slug === ProjectId

In your app.config.js:
```javascript
slug: "my-app",
extra: {
  eas: {
    projectId: "my-app"  // Must be identical!
  }
}
```

### 3. Check Dashboard First

Always verify the actual slug in the Expo dashboard before updating configuration.

### 4. Both Files Must Align

- `eas.json` → explicit slug
- `app.config.js` → dynamic slug and projectId
- Both must use the same values

---

## 🎊 Success Criteria

You'll know everything is working when:

1. ✅ Build completes without slug mismatch errors
2. ✅ Both APKs are generated
3. ✅ APKs install on device
4. ✅ Apps launch successfully
5. ✅ Apps connect to backend
6. ✅ API keys authenticate properly

---

## 📚 Quick Reference

### Check Expo Dashboard
```
https://expo.dev/
→ Your Projects
→ Check URL for slug
```

### Update Configuration
```bash
cd SmartphoneApp
# Edit eas.json and app.config.js
# Make sure slug and projectId match
```

### Commit Changes
```bash
git add .
git commit -m "fix: update slugs"
git push origin main
```

### Monitor Build
```
https://github.com/mpolobe/africa-railways/actions
```

### Download APKs
```
https://expo.dev/
→ Builds
→ Download
```

---

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║              🎯 ACTION PLAN COMPLETE! 🎯                    ║
║                                                              ║
║     1. Verify slugs in Expo dashboard                        ║
║     2. Update config if needed                               ║
║     3. Wait for build to complete                            ║
║     4. Download and test APKs                                ║
║                                                              ║
║     Current build should succeed if slugs match!             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 🎉 You're Almost There!

**Build #12 is running with:**
- ✅ Slug and projectId matching
- ✅ Explicit configuration in eas.json
- ✅ Dynamic configuration in app.config.js
- ✅ All previous fixes applied

**If the slugs in your config match your Expo dashboard, this build will succeed!** 🚀

**Check back in ~20 minutes to download your APKs!** 🎊

---

## 📞 Final Checklist

Before considering this complete:

- [ ] Verified actual slugs in Expo dashboard
- [ ] Configuration matches dashboard
- [ ] Build completed successfully
- [ ] No slug mismatch errors
- [ ] APKs downloaded
- [ ] Apps installed on device
- [ ] Apps tested and working
- [ ] Backend connectivity verified

**Once all checked, you're done!** 🏆
