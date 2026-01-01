# 📱 Mobile App Build Guide

Build the Sovereign Hub mobile app for iOS and Android using EAS (Expo Application Services).

---

## Quick Start

```bash
# Build all platforms (production)
npm run eas:build

# Or use the script directly
./build-mobile.sh
```

---

## Prerequisites

### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

### 2. Login to Expo

```bash
eas login
```

Use your Expo account credentials.

### 3. Configure Project

Your project is already configured with:
- **Project ID**: `5fa2f2b4-5c9f-43bf-b1eb-20d90ae19185`
- **Android Package**: `com.mpolobe.africarailwaysmonorepo`
- **iOS Bundle ID**: `com.mpolobe.africarailwaysmonorepo`

---

## Build Commands

### Using NPM Scripts

```bash
# Build all platforms (production)
npm run eas:build

# Build Android only
npm run build:android

# Build iOS only
npm run build:ios

# Build preview version
npm run build:preview
```

### Using Build Script

```bash
# Build all platforms (production)
./build-mobile.sh

# Build specific platform
./build-mobile.sh android production
./build-mobile.sh ios preview
./build-mobile.sh all development
```

### Direct EAS Commands

```bash
# Production build (all platforms)
eas build --platform all --profile production --non-interactive

# Android only
eas build --platform android --profile production --non-interactive

# iOS only
eas build --platform ios --profile production --non-interactive

# Preview build
eas build --platform all --profile preview --non-interactive

# Development build
eas build --platform all --profile development --non-interactive
```

---

## Build Profiles

Configured in `eas.json`:

### Development
- **Purpose**: Testing with development client
- **Distribution**: Internal
- **Features**: Hot reload, debugging

### Preview
- **Purpose**: Internal testing
- **Distribution**: Internal
- **Features**: Production-like build for testing

### Production
- **Purpose**: App store release
- **Distribution**: Store
- **Features**: Auto-increment version, optimized

---

## GitHub Actions Automation

The workflow automatically triggers builds when:
- You push to `main` branch
- Changes are made to mobile app files
- Manual workflow dispatch

### Trigger Manual Build

1. Go to **Actions** tab in GitHub
2. Select **EAS Build** workflow
3. Click **Run workflow**
4. Choose platform and profile
5. Click **Run workflow**

---

## Monitor Builds

### Check Build Status

```bash
# List all builds
eas build:list

# View specific build
eas build:view [BUILD_ID]

# Check build logs
eas build:logs [BUILD_ID]
```

### Expo Dashboard

Visit: https://expo.dev/accounts/mpolobe/projects/africa-railways/builds

---

## Download Builds

### Android (APK/AAB)

```bash
# Download latest Android build
eas build:download --platform android --latest
```

### iOS (IPA)

```bash
# Download latest iOS build
eas build:download --platform ios --latest
```

---

## Submit to Stores

### Google Play Store

```bash
eas submit --platform android --latest
```

### Apple App Store

```bash
eas submit --platform ios --latest
```

---

## Troubleshooting

### Build Failed

**Check logs:**
```bash
eas build:logs [BUILD_ID]
```

**Common issues:**
- Missing credentials
- Invalid bundle identifier
- Dependency conflicts

### Not Logged In

```bash
eas login
```

### Credentials Issues

```bash
# Configure credentials
eas credentials

# Reset credentials
eas credentials:reset
```

### Build Timeout

Increase timeout in `eas.json`:
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

## Local Development

### Start Development Server

```bash
npm run mobile:start
```

### Install Dependencies

```bash
npm run mobile:install
```

### Run on Device

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

---

## Build Configuration

### Update Version

Edit `app.json`:
```json
{
  "expo": {
    "version": "1.0.0",
    "android": {
      "versionCode": 1
    },
    "ios": {
      "buildNumber": "1"
    }
  }
}
```

### Update Bundle Identifiers

Edit `app.json`:
```json
{
  "expo": {
    "android": {
      "package": "com.mpolobe.africarailwaysmonorepo"
    },
    "ios": {
      "bundleIdentifier": "com.mpolobe.africarailwaysmonorepo"
    }
  }
}
```

---

## Environment Variables

Set secrets in GitHub:
- `EXPO_TOKEN`: Your Expo access token

Get token:
```bash
eas whoami
eas token:create
```

---

## Best Practices

1. **Test locally first**: Use development builds
2. **Use preview builds**: Test before production
3. **Version control**: Commit before building
4. **Monitor builds**: Check Expo dashboard
5. **Test on devices**: Use TestFlight/Internal Testing

---

## Support

- **Expo Docs**: https://docs.expo.dev/
- **EAS Build**: https://docs.expo.dev/build/introduction/
- **EAS Submit**: https://docs.expo.dev/submit/introduction/

---

**Built for Africa, By Africa** 🌍📱
