# 🎯 EAS Build Cheat Sheet

## 🚀 Most Common Commands

```bash
# Build Railways App
eas build --platform android --profile railways

# Build Africoin App
eas build --platform android --profile africoin

# List all builds
eas build:list

# View specific build
eas build:view [build-id]
```

---

## 🔑 EAS Secrets Quick Reference

```bash
# List all secrets
eas secret:list

# Create/Update secret
eas secret:create --scope project --name SECRET_NAME --value "value" --force

# Delete secret
eas secret:delete --name SECRET_NAME

# Required secrets for this project:
# - BACKEND_URL
# - RAILWAYS_API_KEY
# - AFRICOIN_API_KEY
```

---

## 📱 App Profiles

| Profile | App Name | Bundle ID | API Key |
|---------|----------|-----------|---------|
| `railways` | Africa Railways Hub | com.mpolobe.railways | RAILWAYS_API_KEY |
| `africoin` | Africoin Wallet | com.mpolobe.africoin | AFRICOIN_API_KEY |

---

## 🏗️ Build Options

```bash
# Production build (default)
eas build --platform android --profile railways

# Local build (faster, for testing)
eas build --platform android --profile railways --local

# Clear cache before building
eas build --platform android --profile railways --clear-cache

# Non-interactive build (for CI/CD)
eas build --platform android --profile railways --non-interactive

# Build for iOS
eas build --platform ios --profile railways
```

---

## 🔍 Debugging Commands

```bash
# Check project configuration
eas project:info

# View build logs
eas build:view [build-id]

# List recent builds
eas build:list --limit 10

# Cancel a build
eas build:cancel [build-id]

# View credentials
eas credentials

# Check EAS CLI version
eas --version

# Update EAS CLI
npm install -g eas-cli@latest
```

---

## 📦 Submission Commands

```bash
# Submit to Google Play Store
eas submit --platform android --profile railways

# Submit specific build
eas submit --platform android --id [build-id]

# List submissions
eas submit:list

# View submission status
eas submit:view [submission-id]
```

---

## 🔧 Configuration Files

### eas.json Structure

```json
{
  "build": {
    "railways": {
      "extends": "production",
      "env": {
        "APP_VARIANT": "railways",
        "BACKEND_URL": "$BACKEND_URL",
        "API_KEY": "$RAILWAYS_API_KEY"
      }
    }
  }
}
```

### app.config.js Key Parts

```javascript
const IS_RAILWAYS = process.env.APP_VARIANT === 'railways';

export default {
  expo: {
    name: IS_RAILWAYS ? "Africa Railways Hub" : "Africoin Wallet",
    extra: {
      backendUrl: process.env.BACKEND_URL,
      apiKey: process.env.API_KEY
    }
  }
};
```

---

## 🌐 Backend URLs

```bash
# Production
https://africa-railways.vercel.app

# Health check
curl https://africa-railways.vercel.app/health

# API endpoints
/api/reports
/api/auth/login
/api/user/profile
```

---

## 🔐 Security Checklist

- [ ] Never commit API keys to git
- [ ] Use EAS secrets for all sensitive data
- [ ] Different API keys for each app
- [ ] Rotate keys every 90 days
- [ ] Use HTTPS only
- [ ] Validate API keys on backend

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "API key not configured" | `eas secret:list` → Set if missing |
| "Cannot connect to backend" | Check backend is running, verify URL |
| "Unauthorized" (401) | Check API keys match mobile & backend |
| "Build failed" | `eas build --clear-cache` |
| "Wrong app variant" | Check build profile (railways vs africoin) |

---

## 📊 Build Status Meanings

| Status | Meaning |
|--------|---------|
| `pending` | Build queued, waiting to start |
| `in-progress` | Build is currently running |
| `finished` | Build completed successfully ✅ |
| `errored` | Build failed ❌ |
| `canceled` | Build was canceled |

---

## 🎨 App Variants Comparison

| Feature | Railways | Africoin |
|---------|----------|----------|
| **Name** | Africa Railways Hub | Africoin Wallet |
| **Slug** | africa-railways | africoin-app |
| **Bundle ID** | com.mpolobe.railways | com.mpolobe.africoin |
| **Project ID** | 82efeb87-20c5-45b4-b945-65d4b9074c32 | 5fa2f2b4-5c9f-43bf-b1eb-20d90ae19185 |
| **Primary Color** | #0066CC (Blue) | #FFB800 (Gold) |
| **Backend** | https://africa-railways.vercel.app | https://africa-railways.vercel.app |
| **API Key** | RAILWAYS_API_KEY | AFRICOIN_API_KEY |

---

## 🔄 Typical Workflow

```bash
# 1. Make code changes
vim src/components/MyComponent.js

# 2. Test locally
npm start

# 3. Build for testing
eas build --platform android --profile railways --local

# 4. Test on device
# Install APK on device

# 5. Build for production
eas build --platform android --profile railways

# 6. Submit to store
eas submit --platform android --profile railways
```

---

## 📱 Testing Commands

```bash
# Start development server
npm start

# Start with specific variant
APP_VARIANT=railways npm start
APP_VARIANT=africoin npm start

# Run on Android emulator
npm run android

# Run on iOS simulator
npm run ios

# Run tests
npm test

# Run linter
npm run lint
```

---

## 🔗 Useful Links

| Resource | URL |
|----------|-----|
| Expo Docs | https://docs.expo.dev/ |
| EAS Build | https://docs.expo.dev/build/introduction/ |
| EAS Submit | https://docs.expo.dev/submit/introduction/ |
| Vercel Docs | https://vercel.com/docs |
| Project Repo | https://github.com/mpolobe/africa-railways |

---

## 💡 Pro Tips

1. **Use `--local` for faster iteration** during development
2. **Always test on physical device** before production build
3. **Use `--clear-cache`** if build behaves unexpectedly
4. **Check `eas build:list`** to monitor build queue
5. **Set up CI/CD** for automated builds on git push
6. **Keep EAS CLI updated** for latest features
7. **Use build profiles** to manage different configurations
8. **Monitor Vercel logs** for backend issues

---

## 🎯 One-Liner Commands

```bash
# Complete setup from scratch
git clone https://github.com/mpolobe/africa-railways.git && cd africa-railways && npm install && ./setup-eas-secrets.sh

# Build both apps
eas build --platform android --profile railways && eas build --platform android --profile africoin

# Update all secrets at once
eas secret:create --scope project --name BACKEND_URL --value "https://africa-railways.vercel.app" --force && \
eas secret:create --scope project --name RAILWAYS_API_KEY --value "your-key" --force && \
eas secret:create --scope project --name AFRICOIN_API_KEY --value "your-key" --force

# Check everything
eas secret:list && eas project:info && eas build:list --limit 5
```

---

## 📋 Pre-Build Checklist

Before running `eas build`:

- [ ] Code changes committed to git
- [ ] Version number incremented (if needed)
- [ ] EAS secrets verified (`eas secret:list`)
- [ ] Backend is running and accessible
- [ ] Tested locally (`npm start`)
- [ ] Correct build profile selected
- [ ] Build cache cleared (if needed)

---

## 🚨 Emergency Commands

```bash
# Cancel all pending builds
eas build:list --status=pending | grep -oP 'Build ID: \K\w+' | xargs -I {} eas build:cancel {}

# Rotate API keys immediately
./emergency-key-rotation.sh

# Reset all secrets
eas secret:delete --name BACKEND_URL && \
eas secret:delete --name RAILWAYS_API_KEY && \
eas secret:delete --name AFRICOIN_API_KEY && \
./setup-eas-secrets.sh

# Force rebuild with clean slate
eas build --platform android --profile railways --clear-cache --non-interactive
```

---

## 📞 Getting Help

```bash
# EAS CLI help
eas --help
eas build --help
eas secret --help

# Check EAS status
curl https://status.expo.dev/

# View project on Expo dashboard
open https://expo.dev/accounts/[your-account]/projects
```

---

**Print this page and keep it handy!** 📄

For more details, see:
- [QUICK_START.md](./QUICK_START.md) - Quick start guide
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Complete setup
- [SUMMARY.md](./SUMMARY.md) - Configuration summary
