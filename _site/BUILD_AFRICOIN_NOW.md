# 💰 Build Africoin App NOW

## Your Build Command

```bash
npx eas-cli@latest build --platform android --profile africoin
```

## ⚠️ Current Environment Issue

This Codespace doesn't have Node.js installed, so `npx` won't work here.

---

## 🚀 Three Ways to Build RIGHT NOW

### Option 1: GitHub Actions (Fastest - 2 minutes) ⭐

**This is the EASIEST way to run your exact build:**

#### Quick Steps:

1. **Open GitHub Actions:**
   ```
   https://github.com/mpolobe/africa-railways/actions
   ```

2. **Click "EAS Build"** (left sidebar)

3. **Click "Run workflow"** (blue button on right)

4. **Select:**
   - Branch: `main`
   - Platform: `android`
   - Profile: `africoin` ⭐

5. **Click "Run workflow"** (green button)

6. **Wait 20-30 minutes**

7. **Download APK:**
   ```
   https://expo.dev/accounts/mpolobe/projects/africoin-app/builds
   ```

#### Prerequisites:

You need `EXPO_TOKEN` in GitHub secrets (one-time setup):

1. Get token: https://expo.dev/accounts/[your-account]/settings/access-tokens
2. Add to: https://github.com/mpolobe/africa-railways/settings/secrets/actions
3. Name: `EXPO_TOKEN`
4. Paste token and save

---

### Option 2: Gitpod (Has Node.js) 🌐

**Click this link:**
```
https://gitpod.io/#https://github.com/mpolobe/africa-railways
```

**Then run your exact command:**
```bash
npx eas-cli@latest build --platform android --profile africoin
```

**Or use the non-interactive version:**
```bash
npx eas-cli@latest build --platform android --profile africoin --non-interactive
```

---

### Option 3: Use the Automation Script 🤖

If you have GitHub CLI installed:

```bash
./trigger-build.sh
# Select: android + africoin
```

---

## 📊 What Your Build Will Create

**Africoin App:**
```
Name: Africoin Wallet
Package: com.mpolobe.africoin
Project ID: 5fa2f2b4-5c9f-43bf-b1eb-20d90ae19185
Backend: https://africoin-wallet.vercel.app
Theme: Gold (#FFB800)
Output: APK + AAB files
Build Time: 20-30 minutes
```

---

## 🎯 Recommended: GitHub Actions

**Why?**
- ✅ Works from any device (including iPad)
- ✅ No local setup needed
- ✅ Can close browser while building
- ✅ Build history tracked
- ✅ Same result as your command

**How?**

**Step 1:** Add EXPO_TOKEN (one-time)
- Go to: https://expo.dev/accounts/[your-account]/settings/access-tokens
- Create token
- Add to: https://github.com/mpolobe/africa-railways/settings/secrets/actions

**Step 2:** Trigger Build
- Go to: https://github.com/mpolobe/africa-railways/actions
- Click "EAS Build"
- Click "Run workflow"
- Select: android + **africoin** ⭐
- Click "Run workflow"

**Step 3:** Monitor
- GitHub: https://github.com/mpolobe/africa-railways/actions
- Expo: https://expo.dev/accounts/mpolobe/projects/africoin-app/builds

**Step 4:** Download
- Wait 20-30 minutes
- Download APK from Expo dashboard
- Install on Android device

---

## 🔍 Build Status

### Monitor Progress

**GitHub Actions:**
```
https://github.com/mpolobe/africa-railways/actions
```

**Expo Dashboard:**
```
https://expo.dev/accounts/mpolobe/projects/africoin-app/builds
```

### Expected Timeline

```
┌─────────────────────────────────────────┐
│ 1. Queue (1-5 min)                      │
│    Waiting for build server             │
├─────────────────────────────────────────┤
│ 2. Setup (2-3 min)                      │
│    Installing dependencies              │
├─────────────────────────────────────────┤
│ 3. Build (10-20 min)                    │
│    Compiling Africoin app               │
│    • Name: Africoin Wallet              │
│    • Package: com.mpolobe.africoin      │
│    • Theme: Gold                        │
├─────────────────────────────────────────┤
│ 4. Upload (1-2 min)                     │
│    Uploading APK/AAB                    │
└─────────────────────────────────────────┘

Total Time: 20-30 minutes
```

---

## 📱 After Build Completes

### Download APK

1. Go to: https://expo.dev/accounts/mpolobe/projects/africoin-app/builds
2. Click on your build
3. Download APK

### Install on Device

1. Transfer APK to Android device
2. Enable "Install from unknown sources"
3. Open APK file
4. Install
5. Test your Africoin app!

---

## 🧪 Test Your App

Once installed, your app will:
- ✅ Show "Africoin Wallet" name
- ✅ Use gold theme (#FFB800)
- ✅ Connect to: https://africoin-wallet.vercel.app
- ✅ Package: com.mpolobe.africoin

---

## 🚂 Build Railways App Too

You can build both apps:

**Railways:**
```bash
npx eas-cli@latest build --platform android --profile railways
```

**Africoin:**
```bash
npx eas-cli@latest build --platform android --profile africoin
```

**Or via GitHub Actions:**
- Trigger two separate builds
- One for each profile

---

## 🎨 Side-by-Side Installation

Both apps can be installed on the same device:
- 🚂 Railways: `com.mpolobe.railways`
- 💰 Africoin: `com.mpolobe.africoin`

Different package names = no conflicts!

---

## 🆘 Troubleshooting

### "npx: command not found"
**Solution:** Use GitHub Actions or Gitpod

### "EXPO_TOKEN not found"
**Solution:** Add token to GitHub secrets

### "Build failed"
**Solution:** Check logs in GitHub Actions or Expo dashboard

### "Wrong project ID"
**Solution:** Verify app.config.js has correct project ID for Africoin

### "Can't access Expo account"
**Solution:** Create account at https://expo.dev/signup

---

## 📋 Quick Checklist

- [ ] Configuration pushed to GitHub ✅ (Done!)
- [ ] EXPO_TOKEN added to GitHub secrets
- [ ] Build triggered via GitHub Actions
- [ ] Monitor build progress
- [ ] Download APK when complete
- [ ] Install and test on device

---

## 🚀 START BUILDING NOW

**Fastest way (2 minutes setup):**

1. **Get token:** https://expo.dev/accounts/[your-account]/settings/access-tokens
2. **Add to GitHub:** https://github.com/mpolobe/africa-railways/settings/secrets/actions
3. **Trigger build:** https://github.com/mpolobe/africa-railways/actions
4. **Select:** android + **africoin**
5. **Wait 30 min**
6. **Download APK:** https://expo.dev/accounts/mpolobe/projects/africoin-app/builds

---

## 🎊 Summary

**Your command:**
```bash
npx eas-cli@latest build --platform android --profile africoin
```

**Will work in:**
- ✅ Gitpod: https://gitpod.io/#https://github.com/mpolobe/africa-railways
- ✅ Local machine with Node.js
- ✅ Any environment with npm/npx

**Easiest alternative (same result):**
- ✅ GitHub Actions: https://github.com/mpolobe/africa-railways/actions

**Your Africoin app will be ready in ~30 minutes!** 💰📱

---

## 🔄 Build Both Apps

**Option 1: Sequential (Recommended)**
1. Build Railways first
2. Wait for completion
3. Build Africoin second
4. Download both APKs

**Option 2: Parallel**
- Trigger both builds at once
- Both will queue and build
- Download both when complete

---

## 📊 App Comparison

| Feature | Railways | Africoin |
|---------|----------|----------|
| **Name** | Africa Railways Hub | Africoin Wallet |
| **Package** | com.mpolobe.railways | com.mpolobe.africoin |
| **Theme** | Blue (#0066CC) | Gold (#FFB800) |
| **Backend** | africa-railways.vercel.app | africoin-wallet.vercel.app |
| **Focus** | Railway operations | Crypto wallet |
| **Icon** | 🚂 | 💰 |

---

## 🎯 After Both Apps Built

You'll have:
- ✅ Two separate APK files
- ✅ Two different apps
- ✅ Different package names
- ✅ Different backends
- ✅ Can install both on same device

---

**Click here to start:** https://github.com/mpolobe/africa-railways/actions

**Select profile: africoin** 💰
