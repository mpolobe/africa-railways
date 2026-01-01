# 🎨 Multi-App Implementation Guide

## Overview

This guide walks you through implementing **separate directories** for Railways and Africoin apps, as an alternative to the dynamic configuration approach.

## Two Approaches

### Approach A: Dynamic Configuration (Current) ✅
- **Single codebase** with `app.config.js`
- Switches based on `APP_VARIANT` environment variable
- **Pros:** Less code duplication, easier maintenance
- **Cons:** More complex configuration

### Approach B: Separate Directories (This Guide)
- **Two separate app directories**
- Each has its own configuration
- **Pros:** Simpler, more isolated
- **Cons:** Code duplication, harder to maintain shared features

## Implementation Steps

### Step 1: Run Migration Script

```bash
# Make script executable
chmod +x migrate-to-multi-app.sh

# Run migration
./migrate-to-multi-app.sh
```

This creates:
```
railways-app/
  ├── App.js
  ├── package.json
  ├── README.md
  └── .gitignore

africoin-app/
  ├── App.js
  ├── package.json
  ├── README.md
  └── .gitignore
```

### Step 2: Update Root Configuration

#### Option 1: Keep Dynamic Config (Recommended)

Update `app.config.js` to point to new directories:

```javascript
const IS_RAILWAYS = process.env.APP_VARIANT === 'railways';
const APP_DIR = IS_RAILWAYS ? './railways-app' : './africoin-app';

export default {
  expo: {
    name: IS_RAILWAYS ? "Africa Railways Hub" : "Africoin Wallet",
    slug: IS_RAILWAYS ? "africa-railways" : "africoin-app",
    // ... rest of config
  }
};
```

#### Option 2: Separate Configs

Create `railways-app/app.config.js`:
```javascript
export default {
  expo: {
    name: "Africa Railways Hub",
    slug: "africa-railways",
    android: {
      package: "com.mpolobe.railways"
    },
    extra: {
      eas: {
        projectId: "82efeb87-20c5-45b4-b945-65d4b9074c32"
      }
    }
  }
};
```

Create `africoin-app/app.config.js`:
```javascript
export default {
  expo: {
    name: "Africoin Wallet",
    slug: "africoin-app",
    android: {
      package: "com.mpolobe.africoin"
    },
    extra: {
      eas: {
        projectId: "5fa2f2b4-5c9f-43bf-b1eb-20d90ae19185"
      }
    }
  }
};
```

### Step 3: Update EAS Configuration

Update `eas.json` to support both approaches:

```json
{
  "cli": {
    "version": ">= 10.0.0",
    "appVersionSource": "remote"
  },
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
    },
    "railways-isolated": {
      "extends": "production",
      "cwd": "railways-app"
    },
    "africoin-isolated": {
      "extends": "production",
      "cwd": "africoin-app"
    }
  }
}
```

### Step 4: Test Each App

#### Test Railways App

```bash
cd railways-app
npm install
npm start
```

Expected output:
```
🚂 Africa Railways Hub
Railway Operations & Ticketing
Status: Active
```

#### Test Africoin App

```bash
cd africoin-app
npm install
npm start
```

Expected output:
```
💰 Africoin Wallet
Digital Currency for Africa
Status: Active
```

### Step 5: Build Apps

#### Using Dynamic Config (Recommended)

```bash
# Build from root directory
eas build --platform android --profile railways
eas build --platform android --profile africoin
```

#### Using Isolated Directories

```bash
# Build railways app
cd railways-app
eas build --platform android --profile production

# Build africoin app
cd africoin-app
eas build --platform android --profile production
```

## Directory Structure Comparison

### Before (Single Directory)
```
mobile/
  ├── App.js
  ├── package.json
  └── src/
      └── ...
```

### After (Separate Directories)
```
railways-app/
  ├── App.js
  ├── package.json
  ├── app.config.js
  └── src/
      └── ...

africoin-app/
  ├── App.js
  ├── package.json
  ├── app.config.js
  └── src/
      └── ...

mobile/ (backup)
  └── ...
```

## Shared Code Strategy

### Option 1: Shared Package

Create a shared package:

```
shared/
  ├── package.json
  ├── components/
  ├── utils/
  └── api/

railways-app/
  └── package.json (depends on ../shared)

africoin-app/
  └── package.json (depends on ../shared)
```

### Option 2: Symlinks

```bash
# Create shared directory
mkdir shared

# Link from each app
cd railways-app
ln -s ../shared shared

cd ../africoin-app
ln -s ../shared shared
```

### Option 3: Copy on Build

Use a build script to copy shared code:

```bash
#!/bin/bash
# build-railways.sh

# Copy shared code
cp -r ../shared ./shared

# Build
eas build --platform android --profile production

# Clean up
rm -rf ./shared
```

## Package.json Configuration

### Railways App

```json
{
  "name": "africa-railways-app",
  "version": "1.0.0",
  "description": "Railway operations and ticketing",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build:android": "eas build --platform android --profile production",
    "build:ios": "eas build --platform ios --profile production"
  },
  "dependencies": {
    "expo": "~51.0.0",
    "react": "18.2.0",
    "react-native": "0.74.5"
  }
}
```

### Africoin App

```json
{
  "name": "africoin-wallet-app",
  "version": "1.0.0",
  "description": "Digital currency wallet",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build:android": "eas build --platform android --profile production",
    "build:ios": "eas build --platform ios --profile production"
  },
  "dependencies": {
    "expo": "~51.0.0",
    "react": "18.2.0",
    "react-native": "0.74.5"
  }
}
```

## Testing Checklist

### Railways App
- [ ] App starts without errors
- [ ] Blue theme displays correctly
- [ ] Railway features work
- [ ] Package name is `com.mpolobe.railways`
- [ ] Build completes successfully

### Africoin App
- [ ] App starts without errors
- [ ] Gold theme displays correctly
- [ ] Wallet features work
- [ ] Package name is `com.mpolobe.africoin`
- [ ] Build completes successfully

## Pros and Cons

### Separate Directories

**Pros:**
- ✅ Complete isolation
- ✅ Simpler configuration
- ✅ Independent versioning
- ✅ Easier to understand
- ✅ No environment variable confusion

**Cons:**
- ❌ Code duplication
- ❌ Harder to maintain shared features
- ❌ More files to manage
- ❌ Larger repository size
- ❌ Need to update both apps for shared changes

### Dynamic Configuration (Current)

**Pros:**
- ✅ Single codebase
- ✅ Shared code automatically
- ✅ Easier maintenance
- ✅ Smaller repository
- ✅ DRY principle

**Cons:**
- ❌ More complex configuration
- ❌ Environment variable dependency
- ❌ Harder to debug
- ❌ Need to test both variants

## Recommendation

**For your project, I recommend keeping the dynamic configuration approach** because:

1. **Less duplication** - Railway and Africoin apps share a lot of code
2. **Easier maintenance** - Update once, affects both apps
3. **Already implemented** - Your `app.config.js` is working
4. **Better for CI/CD** - Single build pipeline

**Use separate directories only if:**
- Apps are completely different
- No shared code between them
- Different teams maintain each app
- You need complete isolation

## Migration Back to Dynamic Config

If you try separate directories and want to go back:

```bash
# Keep the dynamic config approach
rm -rf railways-app africoin-app

# Use existing app.config.js
# Build with profiles:
eas build --platform android --profile railways
eas build --platform android --profile africoin
```

## Next Steps

1. **Decide on approach:**
   - Keep dynamic config (recommended)
   - Or migrate to separate directories

2. **If keeping dynamic config:**
   - No changes needed
   - Build with: `eas build --profile railways`

3. **If migrating to separate directories:**
   - Run `./migrate-to-multi-app.sh`
   - Test both apps
   - Update build commands

4. **Build and test:**
   - Build both variants
   - Test on devices
   - Submit to app stores

---

**Current Status:** Dynamic configuration is implemented and working ✅

**Recommendation:** Keep current approach unless you have specific reasons to separate
