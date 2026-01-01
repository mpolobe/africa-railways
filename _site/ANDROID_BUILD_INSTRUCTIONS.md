# 🤖 Android Production Build Instructions

Complete guide to building and deploying the Android app.

---

## Prerequisites

### 1. Expo Account
You need to be logged in to Expo:

```bash
npx eas-cli login
```

Or set environment variable:
```bash
export EXPO_TOKEN="your_expo_token_here"
```

Get your token:
```bash
eas whoami
eas token:create
```

---

## Quick Build

### Option 1: Using NPM Script
```bash
npm run build:android
```

### Option 2: Using Build Script
```bash
./build-mobile.sh android production
```

### Option 3: Direct EAS Command
```bash
npx eas-cli build --platform android --profile production --non-interactive
```

---

## Step-by-Step Process

### 1. Clean Ghost References
```bash
# Remove any lingering sui references
git rm -r --cached sui 2>/dev/null || true

# Verify clean
git status
```

### 2. Commit All Changes
```bash
git add .
git commit -m "feat: complete reporting tool & fix android deployment"
git push origin main
```

### 3. Login to Expo
```bash
npx eas-cli login
```

Enter your Expo credentials when prompted.

### 4. Trigger Android Build
```bash
npx eas-cli build --platform android --profile production --non-interactive
```

---

## Build Configuration

### EAS Build Profile (eas.json)
```json
{
  "build": {
    "production": {
      "autoIncrement": true
    }
  }
}
```

### App Configuration (app.json)
```json
{
  "expo": {
    "android": {
      "package": "com.mpolobe.africarailwaysmonorepo"
    }
  }
}
```

---

## Monitor Build Progress

### Check Build Status
```bash
# List all builds
npx eas-cli build:list

# View specific build
npx eas-cli build:view [BUILD_ID]

# Check logs
npx eas-cli build:logs [BUILD_ID]
```

### Expo Dashboard
Visit: https://expo.dev/accounts/mpolobe/projects/africa-railways/builds

---

## Download Build

### After Build Completes

**Option 1: Download from Dashboard**
1. Go to https://expo.dev/accounts/mpolobe/projects/africa-railways/builds
2. Find your build
3. Click "Download" button

**Option 2: CLI Download**
```bash
# Download latest Android build
npx eas-cli build:download --platform android --latest

# Download specific build
npx eas-cli build:download --id [BUILD_ID]
```

---

## Submit to Google Play

### Automatic Submission
```bash
npx eas-cli submit --platform android --latest
```

### Manual Submission
1. Download the AAB file
2. Go to [Google Play Console](https://play.google.com/console)
3. Select your app
4. Go to "Production" → "Create new release"
5. Upload the AAB file
6. Fill in release notes
7. Review and rollout

---

## Troubleshooting

### Build Failed

**Check logs:**
```bash
npx eas-cli build:logs [BUILD_ID]
```

**Common issues:**
- Missing credentials
- Invalid bundle identifier
- Dependency conflicts
- Build timeout

### Not Logged In

**Solution:**
```bash
npx eas-cli login
```

Or set token:
```bash
export EXPO_TOKEN="your_token"
```

### Credentials Issues

**Reset credentials:**
```bash
npx eas-cli credentials:reset
```

**Configure credentials:**
```bash
npx eas-cli credentials
```

### Build Timeout

**Increase timeout in eas.json:**
```json
{
  "build": {
    "production": {
      "timeout": 60
    }
  }
}
```

---

## CI/CD Automation

### GitHub Actions (Already Configured)

The workflow automatically triggers on:
- Push to main branch
- Changes to mobile app files

**Manual trigger:**
1. Go to GitHub Actions tab
2. Select "EAS Build" workflow
3. Click "Run workflow"
4. Choose platform: android
5. Choose profile: production

### EAS Workflows (Already Configured)

Located in `.eas/workflows/create-production-builds.yml`

Automatically builds on push to main.

---

## Build Artifacts

### What You Get

**Production Build:**
- **AAB** (Android App Bundle) - For Google Play Store
- **APK** (Optional) - For direct distribution

**File Locations:**
- Downloaded to current directory
- Or available in Expo dashboard

---

## Version Management

### Auto-Increment (Enabled)

EAS automatically increments:
- `versionCode` in Android
- Build number

### Manual Version Update

Edit `app.json`:
```json
{
  "expo": {
    "version": "1.0.0",
    "android": {
      "versionCode": 1
    }
  }
}
```

---

## Testing Before Release

### Internal Testing

1. Build with preview profile:
```bash
npx eas-cli build --platform android --profile preview
```

2. Download and install on test devices

3. Test all features

4. If good, build production

### Google Play Internal Testing

1. Submit to internal testing track
2. Add testers
3. Get feedback
4. Fix issues
5. Promote to production

---

## Post-Build Checklist

- [ ] Build completed successfully
- [ ] Downloaded AAB file
- [ ] Tested on physical device
- [ ] Verified all features work
- [ ] Checked app size
- [ ] Reviewed permissions
- [ ] Updated release notes
- [ ] Ready for store submission

---

## Quick Reference

### Essential Commands

```bash
# Login
npx eas-cli login

# Build Android
npx eas-cli build --platform android --profile production --non-interactive

# Check status
npx eas-cli build:list

# Download
npx eas-cli build:download --platform android --latest

# Submit
npx eas-cli submit --platform android --latest
```

### Important URLs

- **Expo Dashboard**: https://expo.dev/accounts/mpolobe/projects/africa-railways
- **Builds**: https://expo.dev/accounts/mpolobe/projects/africa-railways/builds
- **Google Play Console**: https://play.google.com/console
- **EAS Docs**: https://docs.expo.dev/build/introduction/

---

## Support

**Issues?**
- Check logs: `npx eas-cli build:logs [BUILD_ID]`
- Review docs: https://docs.expo.dev/build/introduction/
- Contact: admin@africarailways.com

---

**Built for Africa, By Africa** 🌍📱
