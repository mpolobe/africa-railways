# EAS Build Setup Guide

Complete guide for setting up and running EAS (Expo Application Services) builds for the Africa Railways project.

## Prerequisites

### Required Tools
- Node.js 18+ installed
- npm or yarn package manager
- Expo account (create at https://expo.dev)
- Git installed

### For Android Builds
- Java JDK 17+ (for local builds)
- Android SDK (for local builds)

### For iOS Builds
- macOS machine (required)
- Xcode installed
- Apple Developer account

## Initial Setup

### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

### 2. Login to Expo

#### Option A: Interactive Login (Local Development)
```bash
eas login
```
Enter your Expo email/username and password when prompted.

#### Option B: Token-Based Login (CI/CD)
```bash
# Get your token from https://expo.dev/accounts/[username]/settings/access-tokens
eas login --non-interactive
# Set EXPO_TOKEN environment variable
export EXPO_TOKEN=your_token_here
```

### 3. Configure EAS Build

```bash
cd /workspaces/africa-railways
eas build:configure
```

This will create/update `eas.json` with build configurations.

## Building Locally

### Android Build (Local)

```bash
# Build APK for testing
eas build --platform android --local --profile preview

# Build AAB for Google Play Store
eas build --platform android --local --profile production
```

**Output:** The APK/AAB file will be saved in your project directory.

### iOS Build (Local - macOS only)

```bash
# Build for simulator
eas build --platform ios --local --profile preview

# Build for App Store
eas build --platform ios --local --profile production
```

**Note:** iOS builds require a macOS machine with Xcode installed.

## Building on EAS Servers

### Android Build (Cloud)

```bash
# Development build
eas build --platform android --profile development

# Preview build (APK)
eas build --platform android --profile preview

# Production build (AAB)
eas build --platform android --profile production
```

### iOS Build (Cloud)

```bash
# Development build
eas build --platform ios --profile development

# Preview build
eas build --platform ios --profile preview

# Production build
eas build --platform ios --profile production
```

## GitHub Actions Setup

### 1. Create Expo Access Token

1. Go to https://expo.dev/accounts/[username]/settings/access-tokens
2. Click "Create Token"
3. Name it "GitHub Actions"
4. Copy the token (you won't see it again!)

### 2. Add Token to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `EXPO_TOKEN`
5. Value: Paste your Expo access token
6. Click "Add secret"

### 3. Trigger Build

The workflow will automatically run on:
- Push to `main` branch
- Pull requests to `main` branch
- Manual trigger via GitHub Actions UI

To manually trigger:
1. Go to Actions tab in GitHub
2. Select "Local EAS Build" workflow
3. Click "Run workflow"

## EAS Configuration (eas.json)

Here's a recommended `eas.json` configuration:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      },
      "ios": {
        "buildType": "archive"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Build Profiles Explained

### Development Profile
- For development and testing
- Includes dev tools and debugging
- Larger file size
- Not for distribution

### Preview Profile
- For internal testing
- APK format (Android) for easy sharing
- Smaller than development builds
- Good for QA and beta testing

### Production Profile
- For app store submission
- AAB format (Android) for Google Play
- Archive format (iOS) for App Store
- Optimized and minified

## Troubleshooting

### "EXPO_TOKEN not found"

**Solution:**
```bash
# Set the token in your environment
export EXPO_TOKEN=your_token_here

# Or pass it directly
EXPO_TOKEN=your_token_here eas build --platform android
```

### "Build failed: Java not found"

**Solution:**
```bash
# Install Java JDK 17
# Ubuntu/Debian
sudo apt-get install openjdk-17-jdk

# macOS
brew install openjdk@17
```

### "Insufficient permissions"

**Solution:**
- Ensure you're logged in: `eas whoami`
- Check project ownership in Expo dashboard
- Verify EXPO_TOKEN has correct permissions

### "Build timeout"

**Solution:**
- Use cloud builds instead of local: Remove `--local` flag
- Increase timeout in GitHub Actions (default is 60 minutes)
- Check for large dependencies or assets

### "Android SDK not found"

**Solution:**
```bash
# Install Android SDK
# Ubuntu/Debian
sudo apt-get install android-sdk

# Or use Android Studio to install SDK
```

## Local Build Requirements

### Disk Space
- Android: ~10GB free space
- iOS: ~20GB free space

### Memory
- Minimum: 8GB RAM
- Recommended: 16GB RAM

### Build Time
- Android (local): 10-20 minutes
- iOS (local): 15-30 minutes
- Cloud builds: 5-15 minutes

## Advanced Options

### Custom Build Output Path

```bash
eas build --platform android --local --output=./builds/my-app.apk
```

### Skip Credentials Check

```bash
eas build --platform android --local --skip-credentials-check
```

### Clear Cache

```bash
eas build --platform android --local --clear-cache
```

### Non-Interactive Mode (CI/CD)

```bash
eas build --platform android --local --non-interactive
```

## Multi-App Configuration

For projects with multiple apps (like Railways and Africoin):

```json
{
  "build": {
    "railways-preview": {
      "extends": "preview",
      "env": {
        "APP_VARIANT": "railways"
      }
    },
    "africoin-preview": {
      "extends": "preview",
      "env": {
        "APP_VARIANT": "africoin"
      }
    }
  }
}
```

Build specific variant:
```bash
eas build --platform android --profile railways-preview
```

## Monitoring Builds

### Check Build Status

```bash
# List all builds
eas build:list

# View specific build
eas build:view [build-id]

# View build logs
eas build:logs [build-id]
```

### Download Build

```bash
# Download completed build
eas build:download [build-id]
```

## Best Practices

1. **Use Cloud Builds for Production**: More reliable and consistent
2. **Use Local Builds for Testing**: Faster iteration during development
3. **Version Your Builds**: Update version in app.json before each build
4. **Test Before Production**: Always test preview builds before production
5. **Keep Secrets Secure**: Never commit EXPO_TOKEN to git
6. **Monitor Build Logs**: Check logs for warnings and errors
7. **Clean Builds**: Use `--clear-cache` if experiencing issues

## Cost Considerations

### Free Tier
- 30 builds per month (cloud)
- Unlimited local builds
- 1 concurrent build

### Paid Plans
- More builds per month
- Multiple concurrent builds
- Priority build queue
- See https://expo.dev/pricing

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Build Configuration](https://docs.expo.dev/build/eas-json/)
- [Expo Forums](https://forums.expo.dev/)
- [GitHub Actions for Expo](https://github.com/expo/expo-github-action)

## Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review EAS build logs: `eas build:logs [build-id]`
3. Search Expo forums: https://forums.expo.dev/
4. Check GitHub Actions logs in the Actions tab
5. Contact Expo support: https://expo.dev/support

## Quick Reference

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build Android (local)
eas build --platform android --local

# Build Android (cloud)
eas build --platform android

# Build iOS (local, macOS only)
eas build --platform ios --local

# Build iOS (cloud)
eas build --platform ios

# Check status
eas build:list

# View logs
eas build:logs [build-id]

# Download build
eas build:download [build-id]
```
