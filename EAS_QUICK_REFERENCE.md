# EAS Build Quick Reference

Quick command reference for building mobile apps with EAS.

## 🚀 Quick Start (3 Steps)

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login
eas login

# 3. Build
make eas-android  # or make eas-build for menu
```

## 📱 Common Commands

### Setup
```bash
eas login                    # Login to Expo account
eas whoami                   # Check current user
eas build:configure          # Configure EAS builds
```

### Building
```bash
# Android
eas build --platform android --local              # Local build
eas build --platform android                      # Cloud build
eas build --platform android --profile preview    # Preview build

# iOS (macOS only)
eas build --platform ios --local                  # Local build
eas build --platform ios                          # Cloud build

# Both platforms
eas build --platform all                          # Cloud build both
```

### Monitoring
```bash
eas build:list               # List recent builds
eas build:list --limit 20    # List 20 builds
eas build:view [build-id]    # View specific build
eas build:logs [build-id]    # View build logs
eas build:download [id]      # Download build
```

## 🛠️ Makefile Shortcuts

```bash
make eas-build               # Interactive menu
make eas-android             # Quick Android build
make eas-ios                 # Quick iOS build
make eas-configure           # Configure settings
make eas-status              # Check build status
make eas-login               # Login to Expo
make eas-whoami              # Check current user
```

## 📋 Build Profiles

### Development
- For testing and debugging
- Includes dev tools
- Larger file size
```bash
eas build --platform android --profile development
```

### Preview
- For internal testing
- APK format (easy sharing)
- Good for QA
```bash
eas build --platform android --profile preview
```

### Production
- For app store submission
- AAB format (Google Play)
- Optimized and minified
```bash
eas build --platform android --profile production
```

## 🔧 Useful Flags

```bash
--local                      # Build on your machine
--non-interactive            # No prompts (CI/CD)
--clear-cache                # Clear build cache
--output ./path/file.apk     # Custom output path
--profile [name]             # Use specific profile
--skip-credentials-check     # Skip credential validation
```

## 🎯 Common Workflows

### First Time Setup
```bash
npm install -g eas-cli
eas login
cd /workspaces/africa-railways
eas build:configure
```

### Quick Test Build
```bash
make eas-android
# or
eas build --platform android --local --profile preview
```

### Production Release
```bash
# Update version in app.json first!
eas build --platform android --profile production
eas build --platform ios --profile production
```

### Check Build Status
```bash
make eas-status
# or
eas build:list
```

### Download Completed Build
```bash
eas build:list                    # Get build ID
eas build:download [build-id]     # Download
```

## 🐛 Troubleshooting

### Not Logged In
```bash
eas login
eas whoami  # Verify
```

### Build Failed
```bash
eas build:logs [build-id]         # Check logs
eas build --clear-cache           # Clear cache and retry
```

### Java Not Found (Android)
```bash
# Ubuntu/Debian
sudo apt-get install openjdk-17-jdk

# macOS
brew install openjdk@17
```

### iOS Requires macOS
```bash
# Use cloud build instead
eas build --platform ios  # Remove --local flag
```

## 📊 GitHub Actions

### Setup Secrets
1. Get token: https://expo.dev/accounts/[username]/settings/access-tokens
2. Add to GitHub: Settings → Secrets → Actions
3. Name: `EXPO_TOKEN`
4. Value: Your token

### Trigger Build
- Push to `main` branch (automatic)
- Create pull request (automatic)
- Manual: Actions tab → "Local EAS Build" → Run workflow

## 🔗 Quick Links

- [EAS Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Dashboard](https://expo.dev/)
- [GitHub Actions](https://github.com/mpolobe/africa-railways/actions)
- [Full Setup Guide](./EAS_BUILD_SETUP.md)

## 💡 Pro Tips

1. **Use cloud builds for production** - More reliable
2. **Use local builds for testing** - Faster iteration
3. **Always test preview builds** - Before production
4. **Update version numbers** - In app.json before each build
5. **Keep EXPO_TOKEN secure** - Never commit to git
6. **Monitor build logs** - Catch issues early
7. **Use build profiles** - Different configs for different needs

## 📞 Support

- Documentation: `./EAS_BUILD_SETUP.md`
- Expo Forums: https://forums.expo.dev/
- GitHub Issues: https://github.com/mpolobe/africa-railways/issues

## ⚡ One-Liners

```bash
# Install, login, and build in one go
npm i -g eas-cli && eas login && eas build --platform android --local

# Quick status check
eas whoami && eas build:list --limit 5

# Download latest build
eas build:download $(eas build:list --json --limit 1 | jq -r '.[0].id')

# Build both platforms
eas build --platform all --profile preview

# Interactive helper
./scripts/eas-build.sh
```

---

**Last Updated:** 2024  
**Version:** 1.0  
**Maintained by:** Africa Railways Team
