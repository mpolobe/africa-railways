# 🚀 Build Your Railways App NOW

## ✅ Configuration Status

Your configuration is **complete and pushed to GitHub**:
- ✅ `app.config.js` - Dynamic configuration
- ✅ `eas.json` - Build profiles
- ✅ All documentation
- ✅ GitHub Actions workflow

## 🎯 Build Command You Want to Run

```bash
npx eas-cli@latest build --platform android --profile railways --non-interactive
```

## ⚠️ Current Environment Issue

This Codespace/environment doesn't have Node.js installed, so `npx` won't work here.

## 🔧 Three Solutions

### Solution 1: GitHub Actions (Fastest - 2 minutes setup) ⭐

**This is the EASIEST way to run your exact build:**

#### Step 1: Get EXPO_TOKEN (if you don't have it)

Open this in a new tab:
```
https://expo.dev/accounts/[your-account]/settings/access-tokens
```

Or if you have access to a terminal with Node.js:
```bash
npx eas-cli@latest login
npx eas-cli@latest token:create
```

#### Step 2: Add Token to GitHub

1. Go to: https://github.com/mpolobe/africa-railways/settings/secrets/actions
2. Click "New repository secret"
3. Name: `EXPO_TOKEN`
4. Value: (paste your token)
5. Click "Add secret"

#### Step 3: Trigger Build

**Option A: Web Interface (Easiest)**
1. Go to: https://github.com/mpolobe/africa-railways/actions
2. Click "EAS Build" in the left sidebar
3. Click "Run workflow" button (right side)
4. Select:
   - Branch: `main`
   - Platform: `android`
   - Profile: `railways`
5. Click "Run workflow" (green button)

**Option B: Use the Script**
```bash
./trigger-build.sh
```

**Option C: GitHub CLI (if installed)**
```bash
gh workflow run eas-build.yml \
  -f platform=android \
  -f profile=railways
```

### Solution 2: Open in Gitpod (Has Node.js) 🌐

**Click this link to open in Gitpod:**
```
https://gitpod.io/#https://github.com/mpolobe/africa-railways
```

**Then run your command:**
```bash
npx eas-cli@latest build --platform android --profile railways --non-interactive
```

### Solution 3: Local Machine 💻

If you have Node.js installed locally:

```bash
# Clone repo
git clone https://github.com/mpolobe/africa-railways.git
cd africa-railways

# Login to Expo
npx eas-cli@latest login

# Run your build
npx eas-cli@latest build --platform android --profile railways --non-interactive
```

## 📊 What Happens During Build

```
┌─────────────────────────────────────────┐
│ 1. Queue (1-5 min)                      │
│    Waiting for build server             │
├─────────────────────────────────────────┤
│ 2. Setup (2-3 min)                      │
│    Installing dependencies              │
├─────────────────────────────────────────┤
│ 3. Build (10-20 min)                    │
│    Compiling Railways app               │
│    • Name: Africa Railways Hub          │
│    • Package: com.mpolobe.railways      │
│    • Theme: Blue                        │
├─────────────────────────────────────────┤
│ 4. Upload (1-2 min)                     │
│    Uploading APK/AAB                    │
└─────────────────────────────────────────┘

Total Time: 15-30 minutes
```

## 🎯 Recommended: Use GitHub Actions

**Why?**
- ✅ Works from any device (including iPad)
- ✅ No local setup needed
- ✅ Can close browser while building
- ✅ Build history tracked
- ✅ Already configured

**How?**
1. Add EXPO_TOKEN to GitHub secrets (one-time)
2. Go to Actions tab
3. Click "Run workflow"
4. Select android + railways
5. Done!

## 📱 After Build Completes

### Download Your APK

1. **Go to Expo Dashboard:**
   ```
   https://expo.dev/accounts/mpolobe/projects/africa-railways/builds
   ```

2. **Click on your build**

3. **Download APK**

### Install on Android Device

1. Transfer APK to your Android device
2. Enable "Install from unknown sources" in Settings
3. Open APK file
4. Install
5. Test your Railways app!

## 🔍 Monitor Build Progress

### GitHub Actions
```
https://github.com/mpolobe/africa-railways/actions
```

### Expo Dashboard
```
https://expo.dev/accounts/mpolobe/projects/africa-railways/builds
```

## 🎨 Build Both Apps

After Railways builds successfully, build Africoin:

**GitHub Actions:**
- Same process, select profile: `africoin`

**Command line:**
```bash
npx eas-cli@latest build --platform android --profile africoin --non-interactive
```

## 📋 Quick Checklist

- [ ] Configuration pushed to GitHub ✅ (Already done!)
- [ ] EXPO_TOKEN added to GitHub secrets
- [ ] Build triggered via GitHub Actions
- [ ] Monitor build progress
- [ ] Download APK when complete
- [ ] Install and test on device

## 🆘 Troubleshooting

### "npx: command not found"
**Solution:** Use GitHub Actions or Gitpod (both have Node.js)

### "EXPO_TOKEN not found"
**Solution:** Add token to GitHub secrets (see Step 2 above)

### "Build failed"
**Solution:** Check logs in GitHub Actions or Expo dashboard

### "Can't access Expo account"
**Solution:** Create account at https://expo.dev/signup

## 🎊 Summary

**Your exact command:**
```bash
npx eas-cli@latest build --platform android --profile railways --non-interactive
```

**Will work in:**
- ✅ Gitpod: https://gitpod.io/#https://github.com/mpolobe/africa-railways
- ✅ Local machine with Node.js
- ✅ Any environment with npm/npx

**Easiest alternative (same result):**
- ✅ GitHub Actions: https://github.com/mpolobe/africa-railways/actions

---

## 🚀 Start Building NOW

**Fastest way (2 minutes):**

1. **Get token:** https://expo.dev/accounts/[your-account]/settings/access-tokens
2. **Add to GitHub:** https://github.com/mpolobe/africa-railways/settings/secrets/actions
3. **Trigger build:** https://github.com/mpolobe/africa-railways/actions
4. **Wait 20-30 min**
5. **Download APK:** https://expo.dev/accounts/mpolobe/projects/africa-railways/builds

**Your Railways app will be ready in ~30 minutes!** 🚂📱
