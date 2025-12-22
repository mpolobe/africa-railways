# 🧪 Test Your GitHub Actions Setup

## Quick Test Guide

Now that you've added EXPO_TOKEN to GitHub Secrets, let's test it!

---

## 🎯 Option 1: Manual Trigger (Recommended for First Test)

### Steps:

1. **Go to Actions Tab**
   ```
   https://github.com/mpolobe/africa-railways/actions
   ```

2. **Select a Workflow**
   - Click on **"Build Both Apps"** (builds both)
   - OR click on **"Build Railways App"** (just Railways)
   - OR click on **"Build Africoin App"** (just Africoin)

3. **Run Workflow**
   - Click the **"Run workflow"** dropdown button
   - Keep default branch: `main`
   - Click **"Run workflow"** button

4. **Watch Progress**
   - Click on the workflow run that just started
   - Watch each step complete
   - Should take ~5 minutes for GitHub Actions
   - Then ~10-15 minutes for actual EAS build

---

## 🎯 Option 2: Push to Main Branch

### Steps:

```bash
# 1. Make a small change
echo "" >> README.md
echo "## Build Status" >> README.md
echo "![Build Status](https://github.com/mpolobe/africa-railways/actions/workflows/build-both-apps.yml/badge.svg)" >> README.md

# 2. Commit and push
git add README.md
git commit -m "test: trigger automated build"
git push origin main

# 3. Watch the build
# Go to: https://github.com/mpolobe/africa-railways/actions
```

---

## ✅ Expected Results

### GitHub Actions (5 minutes)

You should see these steps complete:

```
✅ 🏗️ Checkout repository
✅ 🏗️ Setup Node.js
✅ 🏗️ Setup EAS
✅ 📦 Install dependencies
✅ 🔍 Verify configuration
✅ 🚀 Build Railways App
✅ 📊 Build Summary
```

Then for Africoin:

```
✅ 🏗️ Checkout repository
✅ 🏗️ Setup Node.js
✅ 🏗️ Setup EAS
✅ 📦 Install dependencies
✅ 🔍 Verify configuration
✅ 🚀 Build Africoin App
✅ 📊 Build Summary
```

### EAS Build (10-15 minutes)

After GitHub Actions completes:

1. Go to: https://expo.dev/
2. Navigate to your projects
3. Click **Builds** tab
4. You should see:
   - New build for Railways (in progress or queued)
   - New build for Africoin (in progress or queued)

---

## 📊 What to Look For

### In GitHub Actions Logs

#### ✅ Success Indicators:

```
🏗️ Setup EAS
✔ Logged in as [your-username]

🚀 Build Railways App
🚂 Building Africa Railways Hub...
✔ Build started successfully
Build ID: [build-id]
Build URL: https://expo.dev/...

📊 Build Summary
✅ Build triggered successfully
```

#### ❌ Failure Indicators:

```
❌ Error: EXPO_TOKEN not found
❌ Error: Authentication failed
❌ Error: Invalid credentials
```

### In Expo Dashboard

#### ✅ Success Indicators:

- Build status: "In Queue" or "In Progress"
- Platform: Android
- Profile: railways / africoin
- Estimated time: ~10-15 minutes

#### ❌ Failure Indicators:

- Build status: "Failed"
- Error message in build logs
- Red error icon

---

## 🐛 Troubleshooting

### Issue: "EXPO_TOKEN not found"

**Cause:** Secret not set or misspelled

**Fix:**
1. Go to: https://github.com/mpolobe/africa-railways/settings/secrets/actions
2. Verify secret name is exactly: `EXPO_TOKEN` (case-sensitive)
3. If missing, add it with value: `PU6XiaYTwUlDHY224UJecC_nxeLquM0mLCUDbi41`

### Issue: "Authentication failed"

**Cause:** Invalid or expired token

**Fix:**
```bash
# Generate new token
expo login
expo whoami --token

# Update GitHub secret with new token
```

### Issue: "Build failed to start"

**Cause:** EAS configuration issue

**Fix:**
```bash
# Check eas.json
cat eas.json

# Verify profiles exist
# Should have "railways" and "africoin" profiles
```

### Issue: "Workflow doesn't trigger"

**Cause:** Workflow file not in correct location

**Fix:**
```bash
# Check workflow files exist
ls -la .github/workflows/

# Should see:
# build-both-apps.yml
# build-railways.yml
# build-africoin.yml
```

---

## 📸 Screenshots of Success

### GitHub Actions Success

```
✅ Build Both Apps
   ✅ build-railways (5m 23s)
   ✅ build-africoin (5m 18s)
   ✅ notify (12s)
```

### Expo Dashboard Success

```
Railways App
Status: ✅ Finished
Platform: Android
Duration: 12m 34s
Download: [APK Button]

Africoin App
Status: ✅ Finished
Platform: Android
Duration: 11m 56s
Download: [APK Button]
```

---

## 🎉 Success Checklist

After your first successful build:

- [ ] GitHub Actions workflow completed (green checkmark)
- [ ] No errors in workflow logs
- [ ] EAS builds appear in Expo dashboard
- [ ] Both apps show "Finished" status
- [ ] APK files are downloadable
- [ ] APKs install on Android device
- [ ] Apps launch successfully

---

## 📱 Testing the APKs

### Download APKs

1. Go to: https://expo.dev/
2. Navigate to project
3. Click **Builds** tab
4. Click **Download** button for each app

### Install on Device

#### Option 1: Direct Install
1. Transfer APK to Android device
2. Open file manager
3. Tap APK file
4. Allow installation from unknown sources
5. Install

#### Option 2: ADB Install
```bash
# Install Railways app
adb install railways-app.apk

# Install Africoin app
adb install africoin-app.apk
```

### Verify Apps Work

1. **Launch Railways App**
   - Check app name: "Africa Railways Hub"
   - Check icon and splash screen
   - Verify it connects to backend
   - Test core functionality

2. **Launch Africoin App**
   - Check app name: "Africoin Wallet"
   - Check icon and splash screen
   - Verify it connects to backend
   - Test core functionality

---

## 🔄 Next Build

After successful first build, subsequent builds are automatic:

```bash
# Just push to main
git add .
git commit -m "feat: new feature"
git push origin main

# Build starts automatically!
```

---

## 📊 Build Monitoring

### Real-time Monitoring

```bash
# Watch GitHub Actions
gh run watch --repo mpolobe/africa-railways

# List recent runs
gh run list --repo mpolobe/africa-railways --limit 5
```

### Build Notifications

Enable notifications:
1. Go to: https://github.com/settings/notifications
2. Enable "Actions" notifications
3. Choose email or web notifications

---

## 🎯 Performance Benchmarks

### Expected Times

| Phase | Duration |
|-------|----------|
| GitHub Actions Setup | 1-2 min |
| Install Dependencies | 2-3 min |
| Trigger EAS Build | 30 sec |
| **Total GitHub Actions** | **~5 min** |
| EAS Cloud Build | 10-15 min |
| **Total End-to-End** | **~15-20 min** |

### Optimization Tips

1. **Use `npm ci` instead of `npm install`** (faster, already done)
2. **Cache node_modules** (already configured)
3. **Build apps in parallel** (optional, uses more resources)
4. **Use `--no-wait` flag** (already done, doesn't wait for EAS)

---

## 📈 Success Metrics

After your test build, you should have:

- ✅ 2 APK files (Railways + Africoin)
- ✅ Both apps installable on Android
- ✅ Both apps launch successfully
- ✅ Automated builds working
- ✅ CI/CD pipeline operational

---

## 🚀 You're Ready!

If your test build succeeded, you're all set for automated builds!

### What You've Achieved:

1. ✅ GitHub Actions configured
2. ✅ EXPO_TOKEN working
3. ✅ EAS builds triggering automatically
4. ✅ Both apps building successfully
5. ✅ CI/CD pipeline operational

### Next Steps:

1. Continue developing features
2. Push to main branch
3. Builds happen automatically
4. Download and test APKs
5. Submit to Play Store when ready

---

**Happy Building!** 🎊
