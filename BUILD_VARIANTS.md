# 🎨 App Variant Build Profiles

## Overview

Your project now supports building **two separate branded apps** from the same codebase:

1. **Railways App** - Railway-focused features
2. **Africoin App** - Cryptocurrency-focused features

## Build Profiles

### 🚂 Railways Variant

**Build command:**
```bash
npx eas-cli@latest build --platform android --profile railways --non-interactive
```

**Environment:**
- `APP_VARIANT=railways`
- Extends production profile
- Auto-increment version
- Railway branding

**Use case:**
- Railway ticketing
- Train schedules
- Station information
- Track workers

### 💰 Africoin Variant

**Build command:**
```bash
npx eas-cli@latest build --platform android --profile africoin --non-interactive
```

**Environment:**
- `APP_VARIANT=africoin`
- Extends production profile
- Auto-increment version
- Cryptocurrency branding

**Use case:**
- AFRC token management
- Wallet features
- Blockchain transactions
- Payment gateway

## Configuration

### eas.json
```json
{
  "build": {
    "railways": {
      "extends": "production",
      "env": {
        "APP_VARIANT": "railways"
      }
    },
    "africoin": {
      "extends": "production",
      "env": {
        "APP_VARIANT": "africoin"
      }
    }
  }
}
```

## Using APP_VARIANT in Code

### In app.config.js

Create `app.config.js` to dynamically configure based on variant:

```javascript
const APP_VARIANT = process.env.APP_VARIANT || 'railways';

const config = {
  railways: {
    name: 'Africa Railways',
    slug: 'africa-railways',
    icon: './assets/railways-icon.png',
    android: {
      package: 'com.mpolobe.africarailways.hub'
    },
    ios: {
      bundleIdentifier: 'com.mpolobe.africarailways.hub'
    }
  },
  africoin: {
    name: 'Africoin Wallet',
    slug: 'africoin-wallet',
    icon: './assets/africoin-icon.png',
    android: {
      package: 'com.mpolobe.africoin.wallet'
    },
    ios: {
      bundleIdentifier: 'com.mpolobe.africoin.wallet'
    }
  }
};

export default {
  expo: {
    ...config[APP_VARIANT],
    version: '1.0.0',
    // ... other common config
  }
};
```

### In React Native Code

```javascript
import Constants from 'expo-constants';

const APP_VARIANT = Constants.expoConfig?.extra?.APP_VARIANT || 'railways';

// Conditional rendering
if (APP_VARIANT === 'railways') {
  // Show railway features
} else if (APP_VARIANT === 'africoin') {
  // Show crypto features
}

// Different API endpoints
const API_URL = APP_VARIANT === 'railways' 
  ? 'https://api.africarailways.com'
  : 'https://api.africoin.com';
```

### In Styles

```javascript
const theme = {
  railways: {
    primary: '#0066CC',
    secondary: '#FFB800',
    icon: '🚂'
  },
  africoin: {
    primary: '#FFB800',
    secondary: '#00D4FF',
    icon: '💰'
  }
};

const colors = theme[APP_VARIANT];
```

## Build Commands

### Android

```bash
# Railways app
eas build --platform android --profile railways

# Africoin app
eas build --platform android --profile africoin

# Both variants
eas build --platform android --profile railways && \
eas build --platform android --profile africoin
```

### iOS

```bash
# Railways app
eas build --platform ios --profile railways

# Africoin app
eas build --platform ios --profile africoin
```

### All Platforms

```bash
# Railways app (Android + iOS)
eas build --platform all --profile railways

# Africoin app (Android + iOS)
eas build --platform all --profile africoin
```

## GitHub Actions

### Manual Trigger

1. Go to: Actions → EAS Build → Run workflow
2. Select:
   - Platform: android/ios/all
   - Profile: **railways** or **africoin**
3. Click "Run workflow"

### Update Workflow

Modify `.github/workflows/eas-build.yml` to include new profiles:

```yaml
on:
  workflow_dispatch:
    inputs:
      profile:
        description: 'Build profile'
        required: true
        default: 'production'
        type: choice
        options:
          - development
          - preview
          - production
          - railways    # Add this
          - africoin    # Add this
```

## Testing Variants Locally

### Development Build

```bash
# Railways variant
eas build --platform android --profile development
# Set APP_VARIANT=railways in your .env

# Africoin variant
eas build --platform android --profile development
# Set APP_VARIANT=africoin in your .env
```

### Preview Build

```bash
# Test railways variant
eas build --platform android --profile railways --no-wait

# Test africoin variant
eas build --platform android --profile africoin --no-wait
```

## Package Names

### Android

- **Railways:** `com.mpolobe.africarailways.hub`
- **Africoin:** `com.mpolobe.africoin.wallet`

### iOS

- **Railways:** `com.mpolobe.africarailways.hub`
- **Africoin:** `com.mpolobe.africoin.wallet`

## App Store Listings

### Railways App

**Name:** Africa Railways  
**Description:** Railway ticketing and tracking for Africa  
**Category:** Travel & Transportation  
**Keywords:** railway, train, tickets, africa

### Africoin App

**Name:** Africoin Wallet  
**Description:** Digital currency for African railways  
**Category:** Finance  
**Keywords:** cryptocurrency, wallet, blockchain, africoin

## Build Matrix

| Variant | Platform | Profile | Output | Time |
|---------|----------|---------|--------|------|
| Railways | Android | railways | APK/AAB | 15-20 min |
| Railways | iOS | railways | IPA | 20-25 min |
| Africoin | Android | africoin | APK/AAB | 15-20 min |
| Africoin | iOS | africoin | IPA | 20-25 min |

## Environment Variables

### Available in Build

```javascript
process.env.APP_VARIANT  // 'railways' or 'africoin'
```

### Access in App

```javascript
import Constants from 'expo-constants';

const variant = Constants.expoConfig?.extra?.APP_VARIANT;
```

## Best Practices

### 1. Shared Code

Keep common features in shared components:
```
src/
  shared/
    components/
    utils/
    api/
  railways/
    screens/
    components/
  africoin/
    screens/
    components/
```

### 2. Feature Flags

```javascript
const features = {
  railways: {
    ticketing: true,
    tracking: true,
    wallet: false
  },
  africoin: {
    ticketing: false,
    tracking: false,
    wallet: true
  }
};

const enabledFeatures = features[APP_VARIANT];
```

### 3. Assets

Organize variant-specific assets:
```
assets/
  railways/
    icon.png
    splash.png
    logo.png
  africoin/
    icon.png
    splash.png
    logo.png
  shared/
    fonts/
    images/
```

### 4. Configuration

Use environment-specific configs:
```javascript
const config = {
  railways: {
    apiUrl: 'https://api.africarailways.com',
    wsUrl: 'wss://ws.africarailways.com',
    theme: 'blue'
  },
  africoin: {
    apiUrl: 'https://api.africoin.com',
    wsUrl: 'wss://ws.africoin.com',
    theme: 'gold'
  }
};
```

## Troubleshooting

### Wrong Variant Built

Check environment variable:
```bash
echo $APP_VARIANT
```

### Assets Not Loading

Verify asset paths match variant:
```javascript
const icon = APP_VARIANT === 'railways' 
  ? require('./assets/railways/icon.png')
  : require('./assets/africoin/icon.png');
```

### Package Name Conflicts

Ensure unique package names in app.config.js:
```javascript
android: {
  package: `com.mpolobe.${APP_VARIANT}.app`
}
```

## Quick Reference

```bash
# Build railways app
eas build --platform android --profile railways

# Build africoin app
eas build --platform android --profile africoin

# List all builds
eas build:list

# Check variant in code
console.log(process.env.APP_VARIANT);

# Test locally
APP_VARIANT=railways npm start
APP_VARIANT=africoin npm start
```

## Next Steps

1. ✅ Create app.config.js for dynamic configuration
2. ✅ Add variant-specific assets
3. ✅ Implement feature flags
4. ✅ Build both variants
5. ✅ Test on devices
6. ✅ Submit to app stores

---

**Need help?** Check [BUILD_GUIDE.md](BUILD_GUIDE.md) for general build instructions.
