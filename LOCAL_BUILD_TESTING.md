# Local Build Testing Guide - Save Codemagic Credits

**Purpose**: Test builds locally before triggering Codemagic to avoid wasting credits  
**Last Updated**: February 11, 2026

---

## ⚠️ Why Test Locally First?

**Codemagic Costs**:
- Pay-as-you-go: $0.038/minute for Mac mini M2
- Average build time: 15-30 minutes
- Cost per build: $0.57 - $1.14
- Failed builds still cost money!

**Solution**: Test locally first, only use Codemagic for final production builds.

---

## 🚀 Quick Start: Local Build Testing

### For Sentinel Mobile App (SmartphoneApp)

```bash
# Navigate to app directory
cd SmartphoneApp

# Install dependencies
npm install --legacy-peer-deps

# Test the build configuration
npx expo prebuild --clean

# For Android local build (requires Android SDK)
eas build --platform android --profile sentinel --local

# For iOS local build (requires macOS + Xcode)
eas build --platform ios --profile sentinel --local
```

### For Africoin Exchange (scroll-waitlist-exchange-1)

The Africoin build is failing due to missing Supabase credentials. Here's how to fix:

```bash
# Navigate to exchange directory
cd /path/to/scroll-waitlist-exchange-1

# Create .env.local file with Supabase credentials
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
EOF

# Install dependencies
npm install

# Test database seeding locally
npm run seed:db

# Test build locally
npm run build

# If successful, commit and push
git add .
git commit -m "fix: Add Supabase credentials for database seeding"
git push origin main
```

---

## 📋 Pre-Flight Checklist (Before Codemagic Build)

### ✅ Sentinel Mobile App

- [ ] `npm install --legacy-peer-deps` runs without errors
- [ ] `npx expo doctor` shows no critical issues
- [ ] `eas build --platform android --profile sentinel --local` succeeds (if you have Android SDK)
- [ ] All environment variables are set in Codemagic dashboard
- [ ] `app.config.js` has correct APP_VARIANT for the build
- [ ] `eas.json` profile matches the intended build

### ✅ Africoin Exchange

- [ ] `.env.local` has all required Supabase credentials
- [ ] `npm install` runs without errors
- [ ] `npm run seed:db` succeeds locally
- [ ] `npm run build` completes successfully
- [ ] No TypeScript errors (`npm run type-check` if available)
- [ ] Environment variables are set in Codemagic

---

## 🔧 Common Build Failures & Local Fixes

### 1. Missing Environment Variables

**Error**: `❌ Missing Supabase credentials`

**Local Test**:
```bash
# Check if .env.local exists
ls -la .env.local

# Verify variables are set
cat .env.local

# Test with variables
npm run seed:db
```

**Fix**:
1. Create `.env.local` with required variables
2. Add to `.gitignore` (never commit secrets!)
3. Set same variables in Codemagic dashboard
4. Test locally before pushing

### 2. Dependency Conflicts

**Error**: `npm ERR! ERESOLVE unable to resolve dependency tree`

**Local Test**:
```bash
# Clear cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall with legacy peer deps
npm install --legacy-peer-deps

# If still fails, check for conflicting versions
npm ls [package-name]
```

**Fix**:
1. Use `--legacy-peer-deps` flag
2. Update conflicting packages
3. Test locally before pushing

### 3. Build Configuration Errors

**Error**: `Project config: Slug mismatch` or similar

**Local Test**:
```bash
# For Expo apps
npx expo config --type public

# Check app.config.js output
node -e "process.env.APP_VARIANT='sentinel'; console.log(require('./app.config.js'))"

# Validate eas.json
cat eas.json | jq .
```

**Fix**:
1. Verify `app.config.js` logic
2. Check `eas.json` profile configuration
3. Ensure environment variables match

### 4. TypeScript/ESLint Errors

**Error**: Build fails due to type errors

**Local Test**:
```bash
# Run TypeScript check
npx tsc --noEmit

# Run linter
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

**Fix**:
1. Fix all TypeScript errors locally
2. Run linter and fix issues
3. Test build locally
4. Commit fixes before pushing

---

## 💰 Cost Optimization Strategy

### Tier 1: Free Local Testing (Always Do This First)

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Run linter
npm run lint

# 3. Run type check (if TypeScript)
npx tsc --noEmit

# 4. Test build configuration
npx expo config --type public  # For Expo apps
npm run build                   # For Next.js apps

# 5. Run tests (if available)
npm test
```

**Cost**: $0  
**Time**: 5-10 minutes  
**Catches**: 80% of build failures

### Tier 2: Local EAS Build (If You Have SDK)

```bash
# Requires Android SDK or Xcode installed
eas build --platform android --profile sentinel --local
```

**Cost**: $0  
**Time**: 30-60 minutes  
**Catches**: 95% of build failures

**Requirements**:
- Android SDK (for Android builds)
- Xcode (for iOS builds, macOS only)
- 16GB+ RAM
- 50GB+ free disk space

### Tier 3: Codemagic Build (Production Only)

Only trigger Codemagic after:
- ✅ All local tests pass
- ✅ Dependencies install cleanly
- ✅ No linter/type errors
- ✅ Build configuration validated
- ✅ Environment variables confirmed

**Cost**: $0.57 - $1.14 per build  
**Time**: 15-30 minutes  
**Success Rate**: 99% (if local tests passed)

---

## 🎯 Recommended Workflow

### For Feature Development

```bash
# 1. Make changes locally
git checkout -b feature/my-feature

# 2. Test locally
npm install --legacy-peer-deps
npm run lint
npm run build  # or npx expo prebuild

# 3. If all pass, commit
git add .
git commit -m "feat: Add my feature"

# 4. Push to feature branch (doesn't trigger Codemagic)
git push origin feature/my-feature

# 5. Create PR and review
# 6. Only merge to main when ready for production build
```

### For Production Builds

```bash
# 1. Ensure all local tests pass
npm install --legacy-peer-deps
npm run lint
npm run build

# 2. Commit to main
git add .
git commit -m "build: Ready for production"
git push origin main

# 3. Codemagic auto-triggers (or manual trigger)
# 4. Monitor build in Codemagic dashboard
# 5. If fails, fix locally and repeat
```

---

## 📊 Build Cost Tracking

### Current Codemagic Usage

| App | Builds This Month | Avg Time | Cost |
|-----|------------------|----------|------|
| Sentinel (railways) | 3 | 20 min | $2.28 |
| Sentinel (africoin) | 2 | 18 min | $1.37 |
| Sentinel (sentinel) | 1 | 22 min | $0.84 |
| Sentinel (staff) | 1 | 19 min | $0.72 |
| Africoin Exchange | 1 (failed) | 5 min | $0.19 |
| **Total** | **8** | **84 min** | **$5.40** |

### Cost Savings with Local Testing

**Without Local Testing**:
- 8 builds × 50% failure rate = 4 failed builds
- 4 failed × $0.75 average = $3.00 wasted
- Total: $8.40

**With Local Testing**:
- 8 builds × 5% failure rate = 0.4 failed builds
- 0.4 failed × $0.75 average = $0.30 wasted
- Total: $5.70

**Savings**: $2.70 per month (32% reduction)

---

## 🔐 Environment Variables Checklist

### Sentinel Mobile App (SmartphoneApp)

Required in Codemagic:
- [ ] `EXPO_TOKEN` - EAS authentication
- [ ] `APP_VARIANT` - railways/africoin/sentinel/staff
- [ ] `BACKEND_URL` - API endpoint
- [ ] `API_KEY` - Backend authentication
- [ ] `ALCHEMY_SDK_KEY` - Blockchain RPC (for staff app)
- [ ] `SUI_NETWORK` - mainnet/testnet/localnet

### Africoin Exchange (scroll-waitlist-exchange-1)

Required in Codemagic:
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key for seeding
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anonymous key for client
- [ ] `DATABASE_URL` - PostgreSQL connection string (if direct access)

**How to Set in Codemagic**:
1. Go to Codemagic dashboard
2. Select app
3. Go to Environment variables
4. Add to appropriate group (e.g., `railways_credentials`)
5. Mark as "Secure" for sensitive values

---

## 🐛 Debugging Failed Builds

### Step 1: Check Codemagic Logs

```bash
# Look for the exact error message
# Common patterns:
# - "Missing environment variable"
# - "ERESOLVE unable to resolve"
# - "Command failed with exit code 1"
```

### Step 2: Reproduce Locally

```bash
# Set same environment variables
export APP_VARIANT=sentinel
export BACKEND_URL=https://africa-railways.vercel.app

# Run same commands as Codemagic
npm install --legacy-peer-deps
npm run build  # or eas build --local
```

### Step 3: Fix and Test

```bash
# Fix the issue
# Test locally
# Commit fix
git add .
git commit -m "fix: Resolve build issue"
git push origin main
```

### Step 4: Monitor Next Build

- Watch Codemagic dashboard
- Check logs in real-time
- Verify success before closing

---

## 📝 Quick Reference Commands

### Sentinel Mobile App

```bash
# Install
cd SmartphoneApp && npm install --legacy-peer-deps

# Lint
npm run lint

# Test config
npx expo config --type public

# Local build (Android)
eas build --platform android --profile sentinel --local

# Local build (iOS)
eas build --platform ios --profile sentinel --local
```

### Africoin Exchange

```bash
# Install
cd scroll-waitlist-exchange-1 && npm install

# Create env file
cp .env.example .env.local
# Edit .env.local with your credentials

# Test seeding
npm run seed:db

# Test build
npm run build

# Run locally
npm run dev
```

---

## ✅ Final Checklist Before Pushing

- [ ] All dependencies install without errors
- [ ] Linter passes with no errors
- [ ] TypeScript check passes (if applicable)
- [ ] Local build succeeds
- [ ] Environment variables documented
- [ ] `.env.local` in `.gitignore`
- [ ] Commit message is clear
- [ ] Ready for production build

---

## 💡 Pro Tips

1. **Use Feature Branches**: Don't push directly to main during development
2. **Test Incrementally**: Test after each significant change
3. **Cache Dependencies**: Use `npm ci` instead of `npm install` in CI
4. **Monitor Costs**: Check Codemagic billing dashboard weekly
5. **Batch Builds**: Group multiple changes into one build
6. **Use Tags**: Trigger builds with git tags instead of every push
7. **Local First**: Always test locally before remote builds

---

## 📞 Support

**Codemagic Issues**:
- Dashboard: [codemagic.io](https://codemagic.io)
- Docs: [docs.codemagic.io](https://docs.codemagic.io)
- Support: support@codemagic.io

**EAS Issues**:
- Dashboard: [expo.dev](https://expo.dev)
- Docs: [docs.expo.dev](https://docs.expo.dev)
- Support: support@expo.dev

**Africa Railways**:
- GitHub: [github.com/mpolobe/africa-railways](https://github.com/mpolobe/africa-railways)
- Email: contact@africarailways.com

---

**Last Updated**: February 11, 2026  
**Version**: 1.0

© 2026 Africa Railways. All rights reserved.
