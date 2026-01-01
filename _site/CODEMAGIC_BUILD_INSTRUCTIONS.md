# How to Start Builds for Each App in Codemagic

## Method 1: Manual Build Trigger (Recommended for Testing)

### Step-by-Step Instructions

#### 1. Access Codemagic Dashboard
1. Go to [https://codemagic.io](https://codemagic.io)
2. Sign in with your GitHub account
3. Navigate to **Applications** in the left sidebar

#### 2. Select Your Repository
1. Find and click on **africa-railways** project
2. You'll see a list of all available workflows

#### 3. Start a Build for Specific App

**For Railways App (Android):**
1. Click on **react-native-railways-android** workflow
2. Click the **"Start new build"** button (top right)
3. Configure build:
   - **Branch**: Select `main` or `develop`
   - **Workflow**: Confirm `react-native-railways-android`
   - **Environment variables**: Will use `railways_credentials` group
4. Click **"Start build"**

**For Railways App (iOS):**
1. Click on **react-native-railways-ios** workflow
2. Click **"Start new build"**
3. Select branch and confirm
4. Click **"Start build"**

**For Africoin App (Android):**
1. Click on **react-native-africoin-android** workflow
2. Click **"Start new build"**
3. Select branch
4. Click **"Start build"**

**For Africoin App (iOS):**
1. Click on **react-native-africoin-ios** workflow
2. Click **"Start new build"**
3. Select branch
4. Click **"Start build"**

**For Sentinel App (Android):**
1. Click on **react-native-sentinel-android** workflow
2. Click **"Start new build"**
3. Select branch
4. Click **"Start build"**

**For Sentinel App (iOS):**
1. Click on **react-native-sentinel-ios** workflow
2. Click **"Start new build"**
3. Select branch
4. Click **"Start build"**

**For Staff Verification App (Android):**
1. Click on **react-native-staff-android** workflow
2. Click **"Start new build"**
3. Select branch
4. Click **"Start build"**

**For Staff Verification App (iOS):**
1. Click on **react-native-staff-ios** workflow
2. Click **"Start new build"**
3. Select branch
4. Click **"Start build"**

---

## Method 2: Git Tag Triggers (Recommended for Releases)

### Build Specific App with Tags

**Railways App:**
```bash
git tag railways-v1.0.0
git push origin railways-v1.0.0
```
This triggers:
- `react-native-railways-android`
- `react-native-railways-ios`

**Africoin App:**
```bash
git tag africoin-v1.0.0
git push origin africoin-v1.0.0
```
This triggers:
- `react-native-africoin-android`
- `react-native-africoin-ios`

**Sentinel App:**
```bash
git tag sentinel-v1.0.0
git push origin sentinel-v1.0.0
```
This triggers:
- `react-native-sentinel-android`
- `react-native-sentinel-ios`

**Staff Verification App:**
```bash
git tag staff-v1.0.0
git push origin staff-v1.0.0
```
This triggers:
- `react-native-staff-android`
- `react-native-staff-ios`

### Tag Naming Convention

Use semantic versioning with app prefix:
```bash
# Format: {app}-v{major}.{minor}.{patch}

# Examples:
railways-v1.0.0
railways-v1.0.1
railways-v1.1.0

africoin-v1.0.0
sentinel-v1.0.0
staff-v1.0.0
```

---

## Method 3: Push to Branch (Builds All Apps)

### Automatic Trigger on Push

When you push to `main` or `develop`, **ALL workflows are triggered**:

```bash
git push origin main
```

This will start **8 builds simultaneously**:
1. react-native-railways-android
2. react-native-railways-ios
3. react-native-africoin-android
4. react-native-africoin-ios
5. react-native-sentinel-android
6. react-native-sentinel-ios
7. react-native-staff-android
8. react-native-staff-ios

**⚠️ Warning**: This uses significant build minutes. Use for:
- Final releases
- Major updates affecting all apps
- Testing CI/CD pipeline

**For individual app testing, use Method 1 (Manual) or Method 2 (Tags).**

---

## Method 4: Codemagic API (Advanced)

### Build Specific App via API

**Prerequisites:**
1. Get API token from Codemagic:
   - Go to **User settings** → **Integrations** → **Codemagic API**
   - Generate new token
   - Copy and save securely

**API Request:**

```bash
# Set your token
export CODEMAGIC_TOKEN="your-api-token-here"

# Get your app ID (first time only)
curl -H "x-auth-token: $CODEMAGIC_TOKEN" \
  https://api.codemagic.io/apps

# Trigger Railways Android build
curl -X POST \
  -H "x-auth-token: $CODEMAGIC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "your-app-id",
    "workflowId": "react-native-railways-android",
    "branch": "main"
  }' \
  https://api.codemagic.io/builds

# Trigger Sentinel Android build
curl -X POST \
  -H "x-auth-token: $CODEMAGIC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "your-app-id",
    "workflowId": "react-native-sentinel-android",
    "branch": "main"
  }' \
  https://api.codemagic.io/builds
```

**Create Build Scripts:**

```bash
# build-railways.sh
#!/bin/bash
curl -X POST \
  -H "x-auth-token: $CODEMAGIC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "'"$CODEMAGIC_APP_ID"'",
    "workflowId": "react-native-railways-android",
    "branch": "main"
  }' \
  https://api.codemagic.io/builds

# build-sentinel.sh
#!/bin/bash
curl -X POST \
  -H "x-auth-token: $CODEMAGIC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "'"$CODEMAGIC_APP_ID"'",
    "workflowId": "react-native-sentinel-android",
    "branch": "main"
  }' \
  https://api.codemagic.io/builds
```

---

## Workflow Selection Guide

### When to Use Each Method

| Method | Use Case | Build Time | Cost |
|--------|----------|------------|------|
| **Manual (UI)** | Testing individual apps | ~15-20 min | 1 build credit |
| **Git Tags** | Production releases | ~15-20 min | 2 build credits (Android + iOS) |
| **Push to Branch** | Major updates | ~2-3 hours | 8 build credits |
| **API** | Automation/CI integration | ~15-20 min | 1 build credit |

### Recommended Workflow

**Development Phase:**
- Use **Manual builds** via Codemagic UI
- Build only the app you're working on
- Test on Android first (faster builds)

**Testing Phase:**
- Use **Git tags** for specific apps
- Build both Android and iOS
- Test on real devices

**Production Release:**
- Use **Git tags** with version numbers
- Build all platforms for the app
- Submit to app stores

**Continuous Integration:**
- Use **Push to branch** for `main` only
- Ensures all apps stay buildable
- Run weekly or on major changes

---

## Build Monitoring

### Check Build Status

**In Codemagic UI:**
1. Go to **Applications** → **africa-railways**
2. Click **"Builds"** tab
3. See all running and completed builds
4. Click on any build to see:
   - Build logs
   - Test results
   - Artifacts (APK/IPA files)
   - Build duration

**Build States:**
- 🟡 **Queued** - Waiting to start
- 🔵 **Building** - In progress
- 🟢 **Success** - Build completed
- 🔴 **Failed** - Build failed
- ⚪ **Canceled** - Manually stopped

### Download Build Artifacts

**After successful build:**
1. Click on the completed build
2. Scroll to **"Artifacts"** section
3. Download:
   - `.apk` files (Android)
   - `.aab` files (Android App Bundle)
   - `.ipa` files (iOS)

**Artifact locations:**
```
SmartphoneApp/build/
├── railways-1.0.0.apk
├── africoin-1.0.0.apk
├── sentinel-1.0.0.apk
└── staff-1.0.0.apk
```

---

## Build Configuration Per App

### Environment Variables Used

Each workflow uses specific environment variable groups:

**Railways:**
- Group: `railways_credentials`
- Variables: `EXPO_TOKEN`, `BACKEND_URL`, `RAILWAYS_API_KEY`

**Africoin:**
- Group: `africoin_credentials`
- Variables: `EXPO_TOKEN`, `BACKEND_URL`, `AFRICOIN_API_KEY`

**Sentinel:**
- Group: `sentinel_credentials`
- Variables: `EXPO_TOKEN`, `BACKEND_URL`, `SENTINEL_API_KEY`, `SUI_NETWORK`

**Staff:**
- Group: `staff_credentials`
- Variables: `EXPO_TOKEN`, `BACKEND_URL`, `STAFF_API_KEY`, `ALCHEMY_SDK_KEY`

**iOS (All Apps):**
- Group: `ios_credentials`
- Variables: `APP_STORE_CONNECT_PRIVATE_KEY`, `APP_STORE_CONNECT_KEY_IDENTIFIER`, `APP_STORE_CONNECT_ISSUER_ID`

### Verify Environment Variables

Before building, ensure variables are set:

1. Go to **Applications** → **africa-railways**
2. Click **"Settings"** (gear icon)
3. Navigate to **"Environment variables"**
4. Check that all groups exist:
   - ✅ railways_credentials
   - ✅ africoin_credentials
   - ✅ sentinel_credentials
   - ✅ staff_credentials
   - ✅ ios_credentials

---

## Troubleshooting

### Build Not Starting

**Problem**: Clicked "Start build" but nothing happens

**Solutions:**
1. Check if you have available build minutes
2. Verify repository is connected to Codemagic
3. Ensure workflow is enabled (not disabled)
4. Check if there are queued builds (max concurrent builds limit)

### Build Fails Immediately

**Problem**: Build fails in first few seconds

**Solutions:**
1. Check environment variables are set correctly
2. Verify `EXPO_TOKEN` is valid (not expired)
3. Check branch exists and has latest code
4. Review build logs for specific error

### Wrong App Being Built

**Problem**: Building Railways but getting Africoin

**Solutions:**
1. Verify correct workflow selected
2. Check `APP_VARIANT` environment variable
3. Ensure workflow configuration is correct in `codemagic.yaml`

### Build Takes Too Long

**Problem**: Build running for over 30 minutes

**Solutions:**
1. Check if EAS build is stuck (use `--no-wait` flag)
2. Verify dependencies are cached
3. Check network connectivity to Expo servers
4. Cancel and restart build

---

## Quick Reference Commands

### Start Builds via Git Tags

```bash
# Build Railways only
git tag railways-v1.0.0 && git push origin railways-v1.0.0

# Build Africoin only
git tag africoin-v1.0.0 && git push origin africoin-v1.0.0

# Build Sentinel only
git tag sentinel-v1.0.0 && git push origin sentinel-v1.0.0

# Build Staff only
git tag staff-v1.0.0 && git push origin staff-v1.0.0

# Build all apps (use with caution)
git push origin main
```

### Check Build Status

```bash
# List recent builds (requires Codemagic CLI)
codemagic builds list --app-id <your-app-id>

# Get specific build status
codemagic builds get --build-id <build-id>
```

---

## Best Practices

### 1. Test Locally First
```bash
cd SmartphoneApp
APP_VARIANT=sentinel npm run test
```

### 2. Use Preview Builds for Testing
```bash
git tag sentinel-v1.0.0-preview
git push origin sentinel-v1.0.0-preview
```

### 3. Build Android First
- Faster build times (~15 min vs ~25 min for iOS)
- Easier to test on emulators
- Cheaper build credits

### 4. Monitor Build Minutes
- Check usage in Codemagic dashboard
- Each build uses ~15-20 minutes
- Plan builds to stay within limits

### 5. Use Caching
- Enabled by default in workflows
- Speeds up subsequent builds
- Reduces build time by 30-50%

---

## Summary

### Recommended Approach for Each App

**Railways App** (Passengers):
- Build frequency: Weekly or on feature updates
- Method: Git tags for releases, manual for testing
- Priority: High (customer-facing)

**Africoin App** (Wallet):
- Build frequency: Bi-weekly or on security updates
- Method: Git tags for releases
- Priority: High (financial app)

**Sentinel App** (Track Workers):
- Build frequency: Monthly or on critical updates
- Method: Manual builds for testing, tags for releases
- Priority: Medium (internal tool)

**Staff Verification App** (Railway Staff):
- Build frequency: Monthly or on feature updates
- Method: Manual builds for testing, tags for releases
- Priority: Medium (internal tool)

---

**Ready to build? Start with a manual build in Codemagic UI for testing!** 🚀
