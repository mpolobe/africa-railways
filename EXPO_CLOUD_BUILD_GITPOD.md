# Expo Cloud Build in GitPod

Build Expo applications directly in your browser with GitPod - no local setup required!

## 🚀 Quick Start

### 1. Open in GitPod

Click the GitPod button or visit:
```
https://gitpod.io/#https://github.com/mpolobe/africa-railways
```

### 2. Login to Expo

```bash
# Set your Expo token
export EXPO_TOKEN="your_expo_token_here"

# Or login interactively
eas login
```

### 3. Build Your App

```bash
# Run the interactive build script
./scripts/build-expo.sh
```

That's it! Your app will be built and ready to download.

## 📱 What You Get

- ✅ **Android APK** - Ready to install on any Android device
- ✅ **iOS IPA** - Simulator build (works in GitPod)
- ✅ **Web Bundle** - Static website export
- ✅ **Automatic S3 Upload** - Optional cloud storage
- ✅ **QR Codes** - Easy mobile downloads
- ✅ **Download URLs** - Pre-signed links (7 days)

## 🛠️ Available Scripts

### Build Script
```bash
./scripts/build-expo.sh
```
Interactive script that:
- Checks environment
- Logs into Expo
- Lets you choose platform (Android/iOS/Web/All)
- Lets you choose profile (Development/Preview/Production)
- Builds the app
- Generates QR codes
- Optionally uploads to S3

### S3 Setup Script
```bash
./scripts/setup-s3-simple.sh
```
Quick S3 bucket setup:
- Creates new S3 bucket
- Configures public access
- Sets up bucket policy
- Saves configuration

### Upload Script
```bash
./scripts/upload-s3.sh
```
Uploads builds to S3:
- Finds recent builds
- Uploads to S3
- Generates download URLs
- Creates "latest" aliases

## 📋 Step-by-Step Guide

### First Time Setup

**Step 1: Get Expo Token**
1. Go to: https://expo.dev/accounts/[username]/settings/access-tokens
2. Click "Create Token"
3. Copy the token

**Step 2: Set Token in GitPod**
```bash
# Persistent (recommended)
gp env EXPO_TOKEN="your_token_here"

# Or for current session
export EXPO_TOKEN="your_token_here"
```

**Step 3: (Optional) Setup AWS S3**
```bash
# Set AWS credentials
export AWS_ACCESS_KEY_ID="your_key"
export AWS_SECRET_ACCESS_KEY="your_secret"
export AWS_REGION="us-east-1"

# Create S3 bucket
./scripts/setup-s3-simple.sh
```

### Building Your App

**Option 1: Interactive Build (Recommended)**
```bash
./scripts/build-expo.sh
```

Follow the prompts:
1. Choose platform (1-4)
2. Choose profile (1-3)
3. Confirm build
4. Wait for build to complete
5. Optionally upload to S3

**Option 2: Direct EAS Commands**
```bash
cd SmartphoneApp

# Android
eas build --platform android --profile preview --local

# iOS (simulator)
eas build --platform ios --profile preview --local --simulator

# Web
npx expo export --platform web
```

## 🎯 Build Profiles

### Development
- Fast refresh enabled
- Debug tools included
- Larger file size
- Quick iteration

```bash
# Select option 1 when prompted
```

### Preview
- Internal testing
- APK format (Android)
- Smaller than development
- Good for QA

```bash
# Select option 2 when prompted
```

### Production
- App store ready
- AAB format (Android)
- Optimized and minified
- Release builds

```bash
# Select option 3 when prompted
```

## 📦 Build Output

Builds are saved to:
```
expo-builds/
├── android-20241223-120000.apk
├── ios-20241223-120000.ipa
├── web-20241223-120000.zip
├── android-url.txt
├── ios-url.txt
├── s3-urls.txt
└── build-info-20241223-120000.json
```

## 🌐 S3 Upload

### Automatic Upload

After building, the script will ask:
```
Upload to S3? [y/N]:
```

Type `y` to upload automatically.

### Manual Upload

```bash
./scripts/upload-s3.sh
```

### What Gets Uploaded

- Original build files
- "Latest" aliases (e.g., `android-latest.apk`)
- Metadata (timestamp, platform)
- Pre-signed URLs (7-day validity)

### Download URLs

After upload, you'll get:
```
📱 Download URLs:
  • android: https://bucket.s3.amazonaws.com/builds/android-20241223.apk?...
  • ios: https://bucket.s3.amazonaws.com/builds/ios-20241223.ipa?...
```

## 📱 Testing Your Build

### Android

**Method 1: Direct Download**
1. Copy the download URL
2. Open on Android device
3. Download and install

**Method 2: QR Code**
1. Script generates QR code
2. Scan with Android device
3. Download and install

**Method 3: ADB Install**
```bash
# If device is connected
adb install expo-builds/android-*.apk
```

### iOS

**Method 1: Simulator**
```bash
# Install in iOS simulator
xcrun simctl install booted expo-builds/ios-*.ipa
```

**Method 2: TestFlight**
1. Upload to App Store Connect
2. Distribute via TestFlight
3. Testers install via TestFlight app

### Web

```bash
# Extract and serve
cd expo-builds
unzip web-*.zip -d web-build
python3 -m http.server 8000

# Open: http://localhost:8000
```

## 🔧 Troubleshooting

### "Not logged into Expo"

**Solution:**
```bash
export EXPO_TOKEN="your_token"
eas whoami  # Verify
```

### "Build failed: permissions"

**Solution:**
```bash
# Initialize new EAS project
cd SmartphoneApp
eas init
```

### "AWS credentials not found"

**Solution:**
```bash
export AWS_ACCESS_KEY_ID="your_key"
export AWS_SECRET_ACCESS_KEY="your_secret"
aws sts get-caller-identity  # Verify
```

### "No build files found"

**Solution:**
```bash
# Check build directory
ls -la expo-builds/

# Run build again
./scripts/build-expo.sh
```

### Build takes too long

**Tips:**
- Use cloud builds (remove `--local` flag)
- Use preview profile instead of production
- Build one platform at a time
- Check GitPod resource limits

## ⚡ Performance Tips

### Faster Builds

1. **Use Cloud Builds**
   ```bash
   # Remove --local flag
   eas build --platform android --profile preview
   ```

2. **Build One Platform**
   - Choose option 1 (Android only)
   - Faster than building all platforms

3. **Use Preview Profile**
   - Faster than production
   - Good for testing

### Save Resources

1. **Close Unused Terminals**
2. **Stop Dev Server** when building
3. **Clear Old Builds**
   ```bash
   rm -rf expo-builds/*
   ```

## 📊 Build Times

| Platform | Profile | Local | Cloud |
|----------|---------|-------|-------|
| Android | Preview | 15-20 min | 10-15 min |
| Android | Production | 20-25 min | 15-20 min |
| iOS | Preview | 20-25 min | 15-20 min |
| Web | Any | 2-3 min | N/A |

*Times may vary based on GitPod resources and project size*

## 💰 Cost Considerations

### GitPod
- **Free**: 50 hours/month
- **Paid**: $9-39/month

### EAS Builds
- **Free**: 30 builds/month
- **Production**: $29/month (unlimited)

### AWS S3
- **Storage**: ~$0.023/GB/month
- **Transfer**: First 100GB free
- **Typical**: $1-5/month

### Total
- **Free Tier**: $0-5/month
- **Production**: $30-50/month

## 🔗 Useful Links

- **GitPod Workspace**: https://gitpod.io/#https://github.com/mpolobe/africa-railways
- **Expo Dashboard**: https://expo.dev/
- **EAS Documentation**: https://docs.expo.dev/build/introduction/
- **S3 Console**: https://s3.console.aws.amazon.com/

## 📚 Additional Documentation

- `EAS_BUILD_SETUP.md` - Complete EAS build guide
- `BUILD_STATUS.md` - Current build status
- `DOWNLOAD_PAGE_SETUP.md` - Download page setup
- `README-Gitpod.md` - GitPod guide

## 🆘 Need Help?

### Common Issues

1. **Permissions Error**
   - Run: `eas init` to create new project
   - Or contact project owner for access

2. **Build Fails**
   - Check logs in terminal
   - Verify dependencies: `npm install`
   - Try cloud build instead of local

3. **S3 Upload Fails**
   - Verify AWS credentials
   - Check bucket exists
   - Verify bucket policy

### Get Support

- Check documentation in repository
- Review build logs
- Open an issue on GitHub
- Check Expo forums

## 🎉 Success!

Once your build completes, you'll have:

✅ Mobile app ready to install  
✅ Download URLs (if uploaded to S3)  
✅ QR codes for easy sharing  
✅ Build metadata and logs  

Share the download URLs with your team and start testing!

---

**Quick Commands:**
```bash
# Build
./scripts/build-expo.sh

# Upload
./scripts/upload-s3.sh

# Setup S3
./scripts/setup-s3-simple.sh
```

**Last Updated**: 2024  
**Maintained by**: Africa Railways Team
