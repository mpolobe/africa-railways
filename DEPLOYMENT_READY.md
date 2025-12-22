# 🚀 Deployment Ready - Multi-App Infrastructure

## ✅ Infrastructure Complete

Your Africa Railways project is now configured to build **two separate apps** from a single codebase!

## 📦 What Was Implemented

### 1. Dynamic Configuration System
- ✅ `app.config.js` - Dynamic app configuration
- ✅ `eas.json` - Build profiles with environment variables
- ❌ `app.json` - Removed (replaced by app.config.js)

### 2. Two App Variants

#### 🚂 Railways App
```
Name: Africa Railways Hub
Package: com.mpolobe.railways
Project ID: 82efeb87-20c5-45b4-b945-65d4b9074c32
Theme: Blue (#0066CC)
Focus: Railway operations, ticketing, tracking
```

#### 💰 Africoin App
```
Name: Africoin Wallet
Package: com.mpolobe.africoin
Project ID: 5fa2f2b4-5c9f-43bf-b1eb-20d90ae19185
Theme: Gold (#FFB800)
Focus: Cryptocurrency wallet, blockchain
```

### 3. Build Profiles

```json
{
  "railways": {
    "extends": "production",
    "env": { "APP_VARIANT": "railways" }
  },
  "africoin": {
    "extends": "production",
    "env": { "APP_VARIANT": "africoin" }
  }
}
```

## 🚀 Ready to Build

### Build Railways App

```bash
# Android
npx eas-cli@latest build --platform android --profile railways --non-interactive

# iOS
npx eas-cli@latest build --platform ios --profile railways --non-interactive

# Both
npx eas-cli@latest build --platform all --profile railways --non-interactive
```

### Build Africoin App

```bash
# Android
npx eas-cli@latest build --platform android --profile africoin --non-interactive

# iOS
npx eas-cli@latest build --platform ios --profile africoin --non-interactive

# Both
npx eas-cli@latest build --platform all --profile africoin --non-interactive
```

## 📋 Pre-Build Checklist

### Required Assets

Create these files before building:

```
assets/
├── icon.png                    ✅ Railways icon (1024x1024)
├── africoin-icon.png          ⚠️  Africoin icon (1024x1024)
├── splash.png                 ✅ Railways splash (1242x2436)
├── africoin-splash.png        ⚠️  Africoin splash (1242x2436)
├── adaptive-icon.png          ✅ Railways adaptive (1024x1024)
├── africoin-adaptive-icon.png ⚠️  Africoin adaptive (1024x1024)
├── favicon.png                ✅ Railways favicon (48x48)
└── africoin-favicon.png       ⚠️  Africoin favicon (48x48)
```

**Note:** If africoin assets don't exist, they'll fall back to railways assets.

### EAS Setup

1. **Login to Expo:**
   ```bash
   npx eas-cli@latest login
   ```

2. **Verify account:**
   ```bash
   npx eas-cli@latest whoami
   ```

3. **Check projects:**
   - Railways: https://expo.dev/accounts/mpolobe/projects/africa-railways
   - Africoin: https://expo.dev/accounts/mpolobe/projects/africoin-app

### GitHub Actions Setup

1. **Get Expo token:**
   ```bash
   npx eas-cli@latest token:create
   ```

2. **Add to GitHub secrets:**
   - Go to: https://github.com/mpolobe/africa-railways/settings/secrets/actions
   - Name: `EXPO_TOKEN`
   - Value: Your token

3. **Trigger build:**
   - Go to: Actions → EAS Build → Run workflow
   - Select profile: `railways` or `africoin`
   - Click "Run workflow"

## 🎯 Build Options

### Option 1: Local Build (Requires Node.js)

```bash
# In Gitpod or local environment
npx eas-cli@latest build --platform android --profile railways
```

### Option 2: GitHub Actions (Recommended)

1. Go to repository Actions tab
2. Select "EAS Build" workflow
3. Click "Run workflow"
4. Choose platform and profile
5. Wait 15-30 minutes

### Option 3: Automatic on Push

Builds trigger automatically when you push changes to:
- `SmartphoneApp/**`
- `mobile/**`
- `app.config.js`
- `eas.json`
- `package.json`

## 📊 Build Timeline

| Stage | Time | Description |
|-------|------|-------------|
| Queue | 1-5 min | Waiting for build server |
| Setup | 2-3 min | Installing dependencies |
| Build | 10-20 min | Compiling app |
| Upload | 1-2 min | Uploading artifacts |
| **Total** | **15-30 min** | Complete build |

## 🎨 Customization

### Access Variant in Code

```javascript
import Constants from 'expo-constants';

const APP_VARIANT = Constants.expoConfig?.extra?.APP_VARIANT;

if (APP_VARIANT === 'railways') {
  // Railways-specific features
  return <RailwaysApp />;
} else if (APP_VARIANT === 'africoin') {
  // Africoin-specific features
  return <AfricoinApp />;
}
```

### Theme Configuration

```javascript
const theme = {
  railways: {
    primary: '#0066CC',
    secondary: '#FFB800',
    background: '#FFFFFF',
    text: '#000000',
    icon: '🚂'
  },
  africoin: {
    primary: '#FFB800',
    secondary: '#00D4FF',
    background: '#0A0E1A',
    text: '#FFFFFF',
    icon: '💰'
  }
};

const colors = theme[APP_VARIANT];
```

### API Endpoints

```javascript
const API_CONFIG = {
  railways: {
    baseUrl: 'https://api.africarailways.com',
    wsUrl: 'wss://ws.africarailways.com'
  },
  africoin: {
    baseUrl: 'https://api.africoin.com',
    wsUrl: 'wss://ws.africoin.com'
  }
};

const api = API_CONFIG[APP_VARIANT];
```

## 📱 App Store Submission

### Railways App

**Google Play:**
- Package: `com.mpolobe.railways`
- Category: Travel & Transportation
- Title: Africa Railways Hub
- Description: Railway ticketing and tracking for Africa

**Apple App Store:**
- Bundle ID: `com.mpolobe.railways`
- Category: Travel
- Title: Africa Railways Hub
- Description: Railway ticketing and tracking for Africa

### Africoin App

**Google Play:**
- Package: `com.mpolobe.africoin`
- Category: Finance
- Title: Africoin Wallet
- Description: Digital currency wallet for African railways

**Apple App Store:**
- Bundle ID: `com.mpolobe.africoin`
- Category: Finance
- Title: Africoin Wallet
- Description: Digital currency wallet for African railways

## 🧪 Testing

### Test Locally

```bash
# Test railways variant
APP_VARIANT=railways npm start

# Test africoin variant
APP_VARIANT=africoin npm start
```

### Verify Configuration

```bash
# Check railways config
APP_VARIANT=railways npx expo config --type public

# Check africoin config
APP_VARIANT=africoin npx expo config --type public
```

### Test Builds

```bash
# Build preview versions for testing
eas build --platform android --profile preview
```

## 📚 Documentation

Complete guides available:
- **APP_CONFIG_README.md** - Configuration guide
- **BUILD_VARIANTS.md** - Variant build instructions
- **BUILD_GUIDE.md** - General build guide
- **DEPLOYMENT_READY.md** - This file

## 🎊 Summary

Your infrastructure is complete:
- ✅ Dynamic configuration system
- ✅ Two separate app identities
- ✅ Build profiles configured
- ✅ Documentation complete
- ✅ Ready for production builds

## 🚀 Next Steps

1. **Create africoin assets** (if not already done)
2. **Test both variants locally**
3. **Build railways app:**
   ```bash
   eas build --platform android --profile railways
   ```
4. **Build africoin app:**
   ```bash
   eas build --platform android --profile africoin
   ```
5. **Test on devices**
6. **Submit to app stores**

## 📞 Support

- **EAS Documentation:** https://docs.expo.dev/build/introduction/
- **Expo Dashboard:** https://expo.dev/
- **GitHub Issues:** https://github.com/mpolobe/africa-railways/issues

---

**Status:** ✅ Ready for production builds!

**Last Updated:** December 2024

**Infrastructure Version:** 1.0.0
