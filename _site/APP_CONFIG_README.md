# 🎨 App Configuration Guide

## Overview

The project uses **dynamic configuration** via `app.config.js` to build two separate apps from the same codebase.

## Configuration Files

### app.config.js (Active)
- **Dynamic configuration** based on `APP_VARIANT` environment variable
- Switches between Railways and Africoin apps
- Used during EAS builds

### app.json (Fallback)
- Static configuration
- Used when `app.config.js` is not present
- Kept for reference

## App Variants

### 🚂 Railways App

**Environment:**
```bash
APP_VARIANT=railways
```

**Configuration:**
```javascript
{
  name: "Africa Railways Hub",
  slug: "africa-railways",
  projectId: "82efeb87-20c5-45b4-b945-65d4b9074c32",
  android: {
    package: "com.mpolobe.railways"
  },
  ios: {
    bundleIdentifier: "com.mpolobe.railways"
  }
}
```

**Branding:**
- Primary Color: `#0066CC` (Blue)
- Icon: Railway themed
- Focus: Railway operations

### 💰 Africoin App

**Environment:**
```bash
APP_VARIANT=africoin
```

**Configuration:**
```javascript
{
  name: "Africoin Wallet",
  slug: "africoin-app",
  projectId: "5fa2f2b4-5c9f-43bf-b1eb-20d90ae19185",
  android: {
    package: "com.mpolobe.africoin"
  },
  ios: {
    bundleIdentifier: "com.mpolobe.africoin"
  }
}
```

**Branding:**
- Primary Color: `#FFB800` (Gold)
- Icon: Cryptocurrency themed
- Focus: Digital wallet

## How It Works

### Build Time

When you run:
```bash
eas build --platform android --profile railways
```

The build process:
1. Sets `APP_VARIANT=railways` (from eas.json)
2. Loads `app.config.js`
3. Evaluates `IS_RAILWAYS = true`
4. Uses Railways configuration
5. Builds with package `com.mpolobe.railways`

### Runtime

Access the variant in your app:
```javascript
import Constants from 'expo-constants';

const APP_VARIANT = Constants.expoConfig?.extra?.APP_VARIANT;

if (APP_VARIANT === 'railways') {
  // Railways features
} else if (APP_VARIANT === 'africoin') {
  // Africoin features
}
```

## Asset Organization

### Required Assets

Create variant-specific assets:

```
assets/
├── icon.png                    # Railways icon
├── africoin-icon.png          # Africoin icon
├── splash.png                 # Railways splash
├── africoin-splash.png        # Africoin splash
├── adaptive-icon.png          # Railways adaptive icon
├── africoin-adaptive-icon.png # Africoin adaptive icon
├── favicon.png                # Railways favicon
└── africoin-favicon.png       # Africoin favicon
```

### Asset Switching

The config automatically switches assets:
```javascript
icon: IS_RAILWAYS ? "./assets/icon.png" : "./assets/africoin-icon.png"
```

## Configuration Properties

### Switched Properties

These change based on variant:

| Property | Railways | Africoin |
|----------|----------|----------|
| **name** | Africa Railways Hub | Africoin Wallet |
| **slug** | africa-railways | africoin-app |
| **projectId** | 82efeb87... | 5fa2f2b4... |
| **package** | com.mpolobe.railways | com.mpolobe.africoin |
| **bundleIdentifier** | com.mpolobe.railways | com.mpolobe.africoin |
| **backgroundColor** | #0066CC | #FFB800 |

### Shared Properties

These remain the same:
- version: "1.0.0"
- orientation: "portrait"
- userInterfaceStyle: "light"
- supportsTablet: true

## Testing Locally

### Test Railways Variant

```bash
# Set environment variable
export APP_VARIANT=railways

# Start development server
npm start

# Or in one command
APP_VARIANT=railways npm start
```

### Test Africoin Variant

```bash
# Set environment variable
export APP_VARIANT=africoin

# Start development server
npm start

# Or in one command
APP_VARIANT=africoin npm start
```

### Verify Configuration

```bash
# Check which config is loaded
npx expo config --type public

# With specific variant
APP_VARIANT=railways npx expo config --type public
APP_VARIANT=africoin npx expo config --type public
```

## Building Apps

### Build Railways

```bash
# Android
eas build --platform android --profile railways

# iOS
eas build --platform ios --profile railways

# Both
eas build --platform all --profile railways
```

### Build Africoin

```bash
# Android
eas build --platform android --profile africoin

# iOS
eas build --platform ios --profile africoin

# Both
eas build --platform all --profile africoin
```

## EAS Project IDs

### Railways Project
- **ID:** `82efeb87-20c5-45b4-b945-65d4b9074c32`
- **Dashboard:** https://expo.dev/accounts/mpolobe/projects/africa-railways

### Africoin Project
- **ID:** `5fa2f2b4-5c9f-43bf-b1eb-20d90ae19185`
- **Dashboard:** https://expo.dev/accounts/mpolobe/projects/africoin-app

## Package Names

### Android

**Railways:**
```
com.mpolobe.railways
```

**Africoin:**
```
com.mpolobe.africoin
```

### iOS

**Railways:**
```
com.mpolobe.railways
```

**Africoin:**
```
com.mpolobe.africoin
```

## Troubleshooting

### Wrong App Name Showing

Check environment variable:
```bash
echo $APP_VARIANT
```

Should be either `railways` or `africoin`.

### Assets Not Found

Ensure all variant-specific assets exist:
```bash
ls -la assets/
# Should show both railways and africoin assets
```

### Package Name Conflicts

Each variant has unique package name:
- Railways: `com.mpolobe.railways`
- Africoin: `com.mpolobe.africoin`

Can be installed side-by-side on same device.

### Build Using Wrong Config

Verify `app.config.js` exists and is valid:
```bash
node -e "console.log(require('./app.config.js'))"
```

## Code Examples

### Access Variant in App

```javascript
import Constants from 'expo-constants';

const APP_VARIANT = Constants.expoConfig?.extra?.APP_VARIANT;

export const isRailways = APP_VARIANT === 'railways';
export const isAfricoin = APP_VARIANT === 'africoin';
```

### Conditional Rendering

```javascript
import { isRailways, isAfricoin } from './config';

function App() {
  return (
    <View>
      {isRailways && <RailwaysFeatures />}
      {isAfricoin && <AfricoinFeatures />}
    </View>
  );
}
```

### Theme Switching

```javascript
const theme = {
  railways: {
    primary: '#0066CC',
    secondary: '#FFB800',
    background: '#FFFFFF',
    text: '#000000'
  },
  africoin: {
    primary: '#FFB800',
    secondary: '#00D4FF',
    background: '#0A0E1A',
    text: '#FFFFFF'
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

## Best Practices

### 1. Keep Shared Code DRY

```javascript
// shared/config.js
export const getConfig = (variant) => ({
  railways: { /* ... */ },
  africoin: { /* ... */ }
})[variant];
```

### 2. Use Feature Flags

```javascript
const features = {
  railways: {
    ticketing: true,
    wallet: false
  },
  africoin: {
    ticketing: false,
    wallet: true
  }
};
```

### 3. Organize Assets

```
assets/
  railways/
  africoin/
  shared/
```

### 4. Test Both Variants

Always test both before release:
```bash
APP_VARIANT=railways npm test
APP_VARIANT=africoin npm test
```

## Migration from app.json

If you had `app.json`, it's now superseded by `app.config.js`:

1. ✅ `app.config.js` is loaded first
2. ✅ Dynamic configuration based on environment
3. ✅ `app.json` kept as fallback/reference

## Quick Reference

```bash
# Build railways app
eas build --platform android --profile railways

# Build africoin app
eas build --platform android --profile africoin

# Test locally
APP_VARIANT=railways npm start
APP_VARIANT=africoin npm start

# Check config
npx expo config --type public

# Verify variant in code
console.log(Constants.expoConfig?.extra?.APP_VARIANT);
```

## Next Steps

1. ✅ Create variant-specific assets
2. ✅ Test both variants locally
3. ✅ Build both apps
4. ✅ Submit to app stores
5. ✅ Maintain separate listings

---

**Need help?** Check [BUILD_VARIANTS.md](BUILD_VARIANTS.md) for more details.
