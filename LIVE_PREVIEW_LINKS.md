# 🚀 Live Preview Links - Africa Railways

## ✅ Dev Server Running!

Your Expo development server is now running and accessible.

### 🌐 Web Preview (Active Now)

**Direct Link:**
```
https://19006--019b4884-c34a-7df3-a253-856248a3e14e.eu-central-1-01.gitpod.dev
```

**What you can do:**
- ✅ Preview the app in your browser
- ✅ Test all features instantly
- ✅ Hot reload on code changes
- ✅ Debug with browser DevTools

### 📱 Mobile Preview (Expo Go)

**For Android/iOS devices:**

1. **Download Expo Go:**
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent
   - iOS: https://apps.apple.com/app/expo-go/id982107779

2. **Connect to dev server:**
   - Open Expo Go app
   - Scan QR code (check terminal output)
   - Or enter URL manually in Expo Go

**Metro Bundler URL:**
```
exp://19000--019b4884-c34a-7df3-a253-856248a3e14e.eu-central-1-01.gitpod.dev
```

### 🔧 Development Ports

All ports are accessible via Gitpod:

| Port | Service | URL |
|------|---------|-----|
| 19000 | Expo Dev Server | `https://19000--[workspace].gitpod.dev` |
| 19006 | Web Preview | `https://19006--[workspace].gitpod.dev` ✅ |
| 8081 | Metro Bundler | `https://8081--[workspace].gitpod.dev` |
| 8080 | Backend API | `https://8080--[workspace].gitpod.dev` |
| 8082 | Dashboard | `https://8082--[workspace].gitpod.dev` |

## 🏗️ Build Status

### GitHub Actions Build

To trigger a production build:

**Option 1: Via GitHub UI**
1. Go to: https://github.com/mpolobe/africa-railways/actions
2. Click "Expo Build & Deploy to S3"
3. Click "Run workflow"
4. Select:
   - Platform: `android` (or `ios` or `all`)
   - Profile: `preview` (or `production`)
5. Click "Run workflow"

**Option 2: Via Command Line**
```bash
# Trigger Android preview build
gh workflow run expo-s3-deploy.yml \
  -f platform=android \
  -f profile=preview

# Trigger production build for both platforms
gh workflow run expo-s3-deploy.yml \
  -f platform=all \
  -f profile=production
```

**Option 3: Push to Main**
```bash
git add .
git commit -m "Trigger build"
git push origin main
```

### Build Output Locations

Once build completes, download from:

1. **GitHub Actions Artifacts:**
   - https://github.com/mpolobe/africa-railways/actions
   - Click on workflow run
   - Download from "Artifacts" section

2. **S3 Bucket:**
   - Console: https://s3.console.aws.amazon.com/s3/buckets/expo-builds-239732581050-20251223
   - Latest Android: `s3://expo-builds-239732581050-20251223/builds/android-latest.apk`
   - Latest iOS: `s3://expo-builds-239732581050-20251223/builds/ios-latest.ipa`

3. **Pre-signed URLs:**
   ```bash
   # Generate download URL (valid 7 days)
   aws s3 presign \
     s3://expo-builds-239732581050-20251223/builds/android-latest.apk \
     --expires-in 604800
   ```

## 📊 Current Status

### ✅ Running Services

- [x] Expo Dev Server (Web)
- [x] Metro Bundler
- [ ] Backend API (start with `make dev`)
- [ ] Dashboard (start with `make dev`)

### 🔄 Pending Builds

Check build status:
```bash
# List recent workflow runs
gh run list --workflow=expo-s3-deploy.yml --limit 5

# Watch live build
gh run watch
```

## 🎯 Quick Actions

### Start Additional Services

```bash
# Start backend and dashboard
make dev

# Or start individually
make backend  # Backend API on port 8080
```

### Stop Services

```bash
# Stop all
pkill -f expo
pkill -f metro

# Or use make
make stop
```

### View Logs

```bash
# Expo logs
npx expo start --web

# Backend logs
make logs
```

## 📱 Testing on Physical Devices

### Android

**Method 1: Expo Go (Development)**
1. Install Expo Go from Play Store
2. Scan QR code from terminal
3. App loads instantly

**Method 2: APK (Production)**
1. Wait for GitHub Actions build to complete
2. Download APK from S3 or GitHub Artifacts
3. Transfer to device
4. Enable "Install from Unknown Sources"
5. Install APK

### iOS

**Method 1: Expo Go (Development)**
1. Install Expo Go from App Store
2. Scan QR code with Camera app
3. Opens in Expo Go

**Method 2: TestFlight (Production)**
1. Build with production profile
2. Upload to App Store Connect
3. Distribute via TestFlight
4. Testers install via TestFlight app

## 🔗 Important Links

### Development
- **Gitpod Workspace**: https://gitpod.io/#https://github.com/mpolobe/africa-railways
- **Web Preview**: https://19006--019b4884-c34a-7df3-a253-856248a3e14e.eu-central-1-01.gitpod.dev ✅
- **Repository**: https://github.com/mpolobe/africa-railways

### Production
- **GitHub Actions**: https://github.com/mpolobe/africa-railways/actions
- **S3 Bucket**: https://s3.console.aws.amazon.com/s3/buckets/expo-builds-239732581050-20251223
- **Releases**: https://github.com/mpolobe/africa-railways/releases

### Documentation
- **Build Guide**: `EAS_BUILD_SETUP.md`
- **Gitpod Guide**: `README-Gitpod.md`
- **CI/CD Guide**: `GITHUB_ACTIONS_S3_GUIDE.md`
- **Quick Reference**: `EAS_QUICK_REFERENCE.md`

## 💡 Tips

### Hot Reload
- Save any file in `SmartphoneApp/` directory
- Changes appear instantly in web preview
- Mobile app reloads automatically

### Debug Mode
- Press `d` in terminal to open developer menu
- Press `r` to reload
- Press `m` to toggle menu

### Performance
- Use web preview for quick testing
- Use Expo Go for mobile-specific features
- Use production builds for final testing

## 🆘 Troubleshooting

### Web Preview Not Loading
```bash
# Restart dev server
cd SmartphoneApp
npx expo start --web --clear
```

### Port Already in Use
```bash
# Kill existing processes
pkill -f expo
pkill -f metro

# Restart
npm start
```

### Build Fails
```bash
# Check GitHub Actions logs
gh run view --log

# Or visit:
# https://github.com/mpolobe/africa-railways/actions
```

## 📞 Need Help?

- Check documentation in repository root
- View GitHub Actions logs
- Check Expo documentation: https://docs.expo.dev
- Open an issue: https://github.com/mpolobe/africa-railways/issues

---

**Last Updated**: $(date)  
**Workspace**: Gitpod  
**Status**: ✅ Dev Server Running
