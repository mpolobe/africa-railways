# 🚀 Manual Build Guide

## Quick Commands

### Build Africoin App
```bash
cd SmartphoneApp
eas build --platform android --profile africoin --non-interactive
```

### Build Railways App
```bash
cd SmartphoneApp
eas build --platform android --profile railways --non-interactive
```

### Build Both Apps
```bash
cd SmartphoneApp

# Build Railways
eas build --platform android --profile railways --non-interactive

# Build Africoin
eas build --platform android --profile africoin --non-interactive
```

---

## 🔧 Build Options

### Standard Build
```bash
eas build --platform android --profile africoin --non-interactive
```

### Clear Cache (If Issues)
```bash
eas build --platform android --profile africoin --non-interactive --clear-cache
```

### Local Build (Faster for Testing)
```bash
eas build --platform android --profile africoin --local
```

### Wait for Completion
```bash
# Remove --no-wait to watch the build
eas build --platform android --profile africoin --non-interactive
```

---

## 📊 Monitor Build

### Check Build Status
```bash
eas build:list --limit 5
```

### View Specific Build
```bash
eas build:view [build-id]
```

### Watch Build Logs
```bash
eas build:view [build-id] --logs
```

---

## ✅ Expected Output

When you run the build command, you should see:

```
✔ Logged in as [your-username]
✔ Project: africoin-app
✔ Platform: Android
✔ Profile: africoin

Validating project configuration...
✔ Slug: africoin-app
✔ Project ID: africoin-app
✔ Configuration valid

Starting build...
✔ Build started successfully
Build ID: [build-id]
Build URL: https://expo.dev/accounts/[username]/projects/africoin-app/builds/[build-id]

Build will take approximately 10-15 minutes.
```

---

## ❌ If You See Errors

### Slug Mismatch Error
```
Error: Slug for project identified by "extra.eas.projectId" (X) 
does not match the "slug" field (Y)
```

**Fix:**
1. Check Expo dashboard for actual slug
2. Update `SmartphoneApp/eas.json` and `SmartphoneApp/app.config.js`
3. Ensure slug === projectId
4. Try again

### Authentication Error
```
Error: Not logged in
```

**Fix:**
```bash
eas login
# Enter your Expo credentials
```

### Project Not Found
```
Error: Project not found
```

**Fix:**
1. Verify project exists in Expo dashboard
2. Check you're in the correct directory (`SmartphoneApp/`)
3. Verify slug matches dashboard

---

## 📱 After Build Completes

### Download APK

1. **From Command Output:**
   - Click the build URL shown in the output
   - Or go to: https://expo.dev/

2. **From Expo Dashboard:**
   - Navigate to your project
   - Click "Builds" tab
   - Find your build
   - Click "Download"

### Install on Device

```bash
# Via ADB
adb install africoin-app.apk

# Or transfer to device and install manually
```

---

## 🎯 Current Configuration

### Africoin Profile (eas.json)
```json
{
  "africoin": {
    "slug": "africoin-app",
    "android": {
      "buildType": "apk"
    },
    "env": {
      "APP_VARIANT": "africoin",
      "BACKEND_URL": "$BACKEND_URL",
      "API_KEY": "$AFRICOIN_API_KEY"
    }
  }
}
```

### App Config (app.config.js)
```javascript
// When APP_VARIANT=africoin
{
  name: "Africoin Wallet",
  slug: "africoin-app",
  android: {
    package: "com.mpolobe.africoin"
  },
  extra: {
    eas: {
      projectId: "africoin-app"
    }
  }
}
```

---

## ✅ Pre-Build Checklist

Before running the build:

- [ ] In correct directory (`SmartphoneApp/`)
- [ ] Logged into EAS (`eas whoami`)
- [ ] Configuration files saved
- [ ] Slug matches Expo dashboard
- [ ] GitHub Secrets configured (for CI/CD)

---

## 🔄 Build Workflow

```
1. Run: eas build --platform android --profile africoin --non-interactive
2. EAS validates configuration
3. EAS uploads your code
4. EAS builds on cloud servers (~10-15 min)
5. APK becomes available for download
6. Download from Expo dashboard
7. Install and test on device
```

---

## 📊 Build Time Estimates

| Build Type | Duration |
|------------|----------|
| First build | 15-20 min |
| Subsequent builds | 10-15 min |
| With cache | 8-12 min |
| Local build | 5-10 min |

---

## 🎓 Pro Tips

### 1. Build Both Apps Together
```bash
# Build both in sequence
eas build --platform android --profile railways --non-interactive && \
eas build --platform android --profile africoin --non-interactive
```

### 2. Use Aliases
```bash
# Add to ~/.bashrc or ~/.zshrc
alias build-railways="cd ~/SmartphoneApp && eas build --platform android --profile railways --non-interactive"
alias build-africoin="cd ~/SmartphoneApp && eas build --platform android --profile africoin --non-interactive"
```

### 3. Check Before Building
```bash
# Verify configuration
cat eas.json | grep -A 10 "africoin"
cat app.config.js | grep "slug"
```

---

## 🆘 Troubleshooting

### Command Not Found
```bash
# Install EAS CLI
npm install -g eas-cli

# Or use npx
npx eas-cli build --platform android --profile africoin --non-interactive
```

### Wrong Directory
```bash
# Make sure you're in SmartphoneApp/
cd /workspaces/africa-railways/SmartphoneApp
pwd  # Should show: .../SmartphoneApp
```

### Build Fails Immediately
```bash
# Clear cache and try again
eas build --platform android --profile africoin --clear-cache --non-interactive
```

---

## 📚 Related Commands

### Project Management
```bash
eas project:info          # Show project details
eas project:list          # List all projects
```

### Build Management
```bash
eas build:list            # List recent builds
eas build:view [id]       # View build details
eas build:cancel [id]     # Cancel a build
```

### Credentials
```bash
eas credentials           # Manage credentials
eas whoami               # Check login status
```

---

## 🎯 Success Indicators

You'll know the build succeeded when:

1. ✅ Command completes without errors
2. ✅ Build ID is generated
3. ✅ Build URL is provided
4. ✅ Build appears in Expo dashboard
5. ✅ Build status shows "Finished"
6. ✅ APK is available for download

---

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║              🚀 READY TO BUILD! 🚀                          ║
║                                                              ║
║     Run the command and watch your app build!                ║
║                                                              ║
║     eas build --platform android --profile africoin          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

**Good luck with your build!** 🎉

If you encounter any issues, check the error message and refer to the troubleshooting section above.
