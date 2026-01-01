# 📱 Africa Railways - Build Guide

## Quick Build Commands

### Android Production Build
```bash
npx eas-cli@latest build --platform android --profile production --non-interactive
```

### iOS Production Build
```bash
npx eas-cli@latest build --platform ios --profile production --non-interactive
```

### Both Platforms
```bash
npx eas-cli@latest build --platform all --profile production --non-interactive
```

## Prerequisites

### 1. Expo Account
- Sign up: https://expo.dev/signup
- Login: `npx eas-cli@latest login`

### 2. EAS CLI
```bash
npm install -g eas-cli
# or use npx
npx eas-cli@latest --version
```

### 3. Build Credits
- Free tier: Limited builds/month
- Check: https://expo.dev/accounts/[your-account]/settings/billing

## Build Profiles

### Development
```bash
eas build --platform android --profile development
```
- Development client
- Internal distribution
- Fast iteration

### Preview
```bash
eas build --platform android --profile preview
```
- Internal distribution
- Testing before production
- Share with team

### Production
```bash
eas build --platform android --profile production
```
- Auto-increment version
- Ready for store submission
- Optimized build

## GitHub Actions (Automated)

### Setup

1. **Get Expo Token:**
   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest token:create
   ```

2. **Add to GitHub Secrets:**
   - Go to: Settings → Secrets → Actions
   - Name: `EXPO_TOKEN`
   - Value: Your token

3. **Trigger Build:**
   - Go to: Actions → EAS Build → Run workflow
   - Select platform and profile
   - Click "Run workflow"

### Automatic Builds

Builds trigger automatically on push to `main` when these files change:
- `SmartphoneApp/**`
- `mobile/**`
- `app.json`
- `eas.json`
- `package.json`

## Build Status

### Check Build Progress

**Expo Dashboard:**
```
https://expo.dev/accounts/mpolobe/projects/africa-railways/builds
```

**GitHub Actions:**
```
https://github.com/mpolobe/africa-railways/actions
```

### Build Timeline

| Stage | Time | Description |
|-------|------|-------------|
| Queue | 1-5 min | Waiting for build server |
| Setup | 2-3 min | Installing dependencies |
| Build | 10-20 min | Compiling app |
| Upload | 1-2 min | Uploading artifacts |
| **Total** | **15-30 min** | Complete build |

## Download Build

### From Expo Dashboard
1. Go to builds page
2. Click on completed build
3. Download APK or AAB

### From CLI
```bash
# List builds
eas build:list

# Download specific build
eas build:download --id [BUILD_ID]
```

## Install on Device

### Android APK
1. Download APK from Expo dashboard
2. Transfer to Android device
3. Enable "Install from unknown sources"
4. Install APK

### Android AAB (Google Play)
1. Download AAB from Expo dashboard
2. Upload to Google Play Console
3. Submit for review

### iOS (TestFlight)
1. Build with iOS profile
2. Download IPA
3. Upload to App Store Connect
4. Distribute via TestFlight

## Troubleshooting

### Build Failed

**Check logs:**
```bash
eas build:list
eas build:view [BUILD_ID]
```

**Common issues:**
- Missing credentials
- Invalid app.json
- Dependency conflicts
- Insufficient build credits

### Credentials Issues

**Android:**
```bash
eas credentials
```

**iOS:**
```bash
eas credentials
```

### Version Conflicts

**Update version:**
```json
// app.json
{
  "expo": {
    "version": "1.0.1"
  }
}
```

## Build Configuration

### Current Setup

**App Identity:**
- Name: Africa Railways Sovereign Hub
- Slug: africa-railways
- Version: 1.0.0

**Android:**
- Package: com.mpolobe.africarailways.hub
- Adaptive icon: Yes

**iOS:**
- Bundle ID: com.mpolobe.africarailways.hub
- Tablet support: Yes

**EAS Project:**
- ID: 82efeb87-20c5-45b4-b945-65d4b9074c32

### Build Profiles (eas.json)

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

## Advanced Options

### Custom Build Command
```bash
eas build \
  --platform android \
  --profile production \
  --non-interactive \
  --clear-cache \
  --wait
```

### Build with Specific Version
```bash
eas build \
  --platform android \
  --profile production \
  --app-version 1.0.1 \
  --build-number 42
```

### Local Build (Experimental)
```bash
eas build --platform android --local
```

## Resources

- **EAS Documentation:** https://docs.expo.dev/build/introduction/
- **Expo Dashboard:** https://expo.dev/
- **Build Limits:** https://expo.dev/pricing
- **Support:** https://forums.expo.dev/

## Quick Reference

```bash
# Login
eas login

# Check account
eas whoami

# List builds
eas build:list

# View build details
eas build:view [BUILD_ID]

# Download build
eas build:download

# Cancel build
eas build:cancel

# Configure credentials
eas credentials

# Update project
eas update

# Submit to store
eas submit
```

## Next Steps

1. ✅ Setup Expo account
2. ✅ Add EXPO_TOKEN to GitHub secrets
3. ✅ Trigger build via GitHub Actions
4. ⏳ Wait 15-30 minutes
5. 📱 Download and test APK
6. 🚀 Submit to Google Play Store

---

**Need help?** Check the [Expo documentation](https://docs.expo.dev/) or ask in the [Expo forums](https://forums.expo.dev/).
