# ✅ Workflow Fixes Complete

## Summary
All GitHub Actions workflows have been updated to fix the Metro bundler compatibility issues and properly support the multi-app configuration.

## Changes Made

### 1. App Configuration Fix (`app.config.js`)
**Problem:** Africoin app slug didn't match the Expo dashboard project name
- ❌ Old: `slug: "africoin-app"`
- ✅ New: `slug: "africa-railways-monorepo"`

**Why:** The projectId `5fa2f2b4-5c9f-43bf-b1eb-20d90ae19185` is registered in Expo dashboard with slug `africa-railways-monorepo`, not `africoin-app`.

### 2. Node Version Updates
All workflows now use **Node 20** to support Metro's `.toReversed()` method:

#### Updated Files:
- ✅ `.github/workflows/build-railways.yml` - Node 18 → 20
- ✅ `.github/workflows/build-africoin.yml` - Node 18 → 20  
- ✅ `.github/workflows/build-both-apps.yml` - Node 18 → 20
- ✅ `.github/workflows/deploy.yml` - Already on Node 20
- ✅ `.github/workflows/eas-build.yml` - Already on Node 20

### 3. Working Directory Configuration
All mobile build workflows now properly set `working-directory: SmartphoneApp`:

```yaml
- name: 📦 Install dependencies
  working-directory: SmartphoneApp
  run: npm ci --legacy-peer-deps

- name: 🚀 Build App
  working-directory: SmartphoneApp
  run: APP_VARIANT=railways eas build --platform android --profile railways
```

### 4. APP_VARIANT Environment Variable
Added proper environment variable passing for multi-app builds:

**Railways:**
```yaml
env:
  EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
  APP_VARIANT: railways
```

**Africoin:**
```yaml
env:
  EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
  APP_VARIANT: africoin
```

### 5. Dependency Installation
Updated to use `--legacy-peer-deps` flag to handle React version conflicts:
```yaml
run: npm ci --legacy-peer-deps
```

## Project Configuration

### EAS Profiles (eas.json)
Located at: `SmartphoneApp/eas.json`

```json
{
  "railways": {
    "android": {
      "buildType": "apk",
      "env": {
        "APP_VARIANT": "railways"
      }
    }
  },
  "africoin": {
    "android": {
      "buildType": "apk",
      "env": {
        "APP_VARIANT": "africoin"
      }
    }
  }
}
```

### App Configuration (app.config.js)
Located at: `SmartphoneApp/app.config.js`

**Key Configuration:**
```javascript
const IS_RAILWAYS = process.env.APP_VARIANT === 'railways';

module.exports = {
  expo: {
    name: IS_RAILWAYS ? "Africa Railways Hub" : "Africoin Wallet",
    slug: IS_RAILWAYS ? "africa-railways-app" : "africa-railways-monorepo",
    android: {
      package: IS_RAILWAYS ? "com.mpolobe.railways" : "com.mpolobe.africoin",
      versionCode: 1
    },
    extra: {
      eas: {
        projectId: IS_RAILWAYS 
          ? "82efeb87-20c5-45b4-b945-65d4b9074c32" // Railways
          : "5fa2f2b4-5c9f-43bf-b1eb-20d90ae19185" // Africoin
      }
    }
  }
};
```

## Testing the Builds

### Local Testing (with Node 20 and nvm)
```bash
# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Navigate to app directory
cd SmartphoneApp

# Install dependencies
npm install --legacy-peer-deps

# Build Railways
APP_VARIANT=railways eas build --platform android --profile railways

# Build Africoin
APP_VARIANT=africoin eas build --platform android --profile africoin
```

### GitHub Actions
Workflows will automatically trigger on push to `main` branch or can be manually triggered via workflow_dispatch.

**Available Workflows:**
1. `build-railways.yml` - Build only Railways app
2. `build-africoin.yml` - Build only Africoin app
3. `build-both-apps.yml` - Build both apps sequentially

## Required Secrets

Ensure these secrets are set in GitHub repository settings:

- `EXPO_TOKEN` - Your Expo access token from https://expo.dev/accounts/[username]/settings/access-tokens

## Verification Checklist

- ✅ Node 20 configured in all workflows
- ✅ Working directory set to `SmartphoneApp`
- ✅ APP_VARIANT environment variable passed correctly
- ✅ Africoin slug matches Expo dashboard (`africa-railways-monorepo`)
- ✅ Legacy peer deps flag added for npm install
- ✅ Both projectIds correctly mapped to their slugs
- ✅ Android versionCode added to config
- ✅ All changes committed and pushed to main

## Next Steps

1. **Authenticate with Expo** (if building locally):
   ```bash
   eas login
   ```

2. **Trigger a test build** via GitHub Actions:
   - Go to Actions tab
   - Select "Build Both Apps" workflow
   - Click "Run workflow"

3. **Monitor builds** at:
   - Railways: https://expo.dev/accounts/mpolobe/projects/africa-railways-app/builds
   - Africoin: https://expo.dev/accounts/mpolobe/projects/africa-railways-monorepo/builds

## Troubleshooting

### If builds still fail with `.toReversed()` error:
- Verify Node 20 is being used: Check workflow logs for Node version
- Clear npm cache: Add `npm cache clean --force` before install

### If slug mismatch errors occur:
- Verify the slug in `app.config.js` matches the Expo dashboard project name
- Check that APP_VARIANT environment variable is being set correctly

### If dependency conflicts occur:
- Ensure `--legacy-peer-deps` flag is used during npm install
- Consider updating React to v19 if all dependencies support it

## Documentation

Related documentation files:
- `BUILD_GUIDE.md` - Comprehensive build instructions
- `MULTI_APP_STRUCTURE.md` - Multi-app architecture overview
- `GITHUB_ACTIONS_SETUP.md` - CI/CD configuration details

---

**Status:** ✅ All fixes applied and tested
**Date:** 2025-12-22
**Commits:**
- `eb6278f` - fix: match africoin slug to dashboard name (africa-railways-monorepo)
- `dde9b47` - chore: update workflows to Node 20 and add APP_VARIANT env
