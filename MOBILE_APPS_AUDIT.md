# Mobile Apps Configuration Audit

## 🔍 Current Configuration Analysis

### App 1: Railways Hub ✅
```javascript
{
  name: "Africa Railways Hub",
  slug: "africa-railways-app",
  package: "com.mpolobe.railways",
  bundleIdentifier: "com.mpolobe.railways",
  projectId: "82efeb87-20c5-45b4-b945-65d4b9074c32"
}
```
**Status:** ✅ **CORRECT**
- Slug matches project ID registration
- No issues expected

### App 2: Africoin Wallet ✅
```javascript
{
  name: "Africoin Wallet",
  slug: "africa-railways-monorepo",
  package: "com.mpolobe.africoin",
  bundleIdentifier: "com.mpolobe.africoin",
  projectId: "5fa2f2b4-5c9f-43bf-b1eb-20d90ae19185"
}
```
**Status:** ✅ **CORRECT**
- Has its own project ID
- Slug should match this project ID
- No issues expected

### App 3: Sentinel Portal ✅
```javascript
{
  name: "Sentinel Portal",
  slug: "africa-railways-app", // Fixed!
  package: "com.mpolobe.sentinel",
  bundleIdentifier: "com.mpolobe.sentinel",
  projectId: "82efeb87-20c5-45b4-b945-65d4b9074c32"
}
```
**Status:** ✅ **FIXED**
- Slug now matches project ID
- Shares project ID with Railways
- Build will succeed

### App 4: Staff Verification ❌
```javascript
{
  name: "Staff Verification",
  slug: "staff-verification", // ❌ WRONG!
  package: "com.mpolobe.staff",
  bundleIdentifier: "com.mpolobe.staff",
  projectId: "82efeb87-20c5-45b4-b945-65d4b9074c32"
}
```
**Status:** ❌ **INCORRECT - WILL FAIL**
- Slug: `staff-verification`
- Project ID: `82efeb87-20c5-45b4-b945-65d4b9074c32` (same as Railways)
- **Mismatch!** Project ID expects slug: `africa-railways-app`
- **Will cause same build error as Sentinel had**

---

## 🐛 Issues Found

### Critical Issue: Staff App Slug Mismatch
**Problem:**
- Staff app uses project ID `82efeb87-20c5-45b4-b945-65d4b9074c32`
- This project ID is registered with slug `africa-railways-app`
- Staff app has slug `staff-verification`
- **Result:** Build will fail with slug mismatch error

**Error Expected:**
```
Project config: Slug for project identified by "extra.eas.projectId" 
(africa-railways-app) does not match the "slug" field (staff-verification).
Error: build command failed.
```

---

## ✅ Recommended Fixes

### Option 1: Use Shared Slug (Recommended)
All apps sharing the same project ID should use the same slug:

```javascript
staff: {
  name: "Staff Verification",
  slug: "africa-railways-app", // ✅ Match project ID
  package: "com.mpolobe.staff",
  bundleIdentifier: "com.mpolobe.staff",
  projectId: "82efeb87-20c5-45b4-b945-65d4b9074c32"
}
```

**Pros:**
- Simple fix
- Consistent with Railways and Sentinel
- No new project ID needed
- Apps differentiated by package name

**Cons:**
- All apps share same slug
- Less clear separation in Expo dashboard

### Option 2: Create New Project ID for Staff
Create a dedicated EAS project for Staff app:

```javascript
staff: {
  name: "Staff Verification",
  slug: "staff-verification", // Keep unique slug
  package: "com.mpolobe.staff",
  bundleIdentifier: "com.mpolobe.staff",
  projectId: "[NEW_PROJECT_ID]" // Create new project
}
```

**Pros:**
- Clear separation between apps
- Independent billing/quotas
- Unique slug per app

**Cons:**
- Requires creating new EAS project
- More complex setup
- Additional project to manage

---

## 📊 Project ID Mapping

| App | Slug | Project ID | Shared With |
|-----|------|------------|-------------|
| Railways | africa-railways-app | 82efeb87... | Sentinel, Staff |
| Sentinel | africa-railways-app | 82efeb87... | Railways, Staff |
| Staff | ❌ staff-verification | 82efeb87... | Railways, Sentinel |
| Africoin | africa-railways-monorepo | 5fa2f2b4... | None |

**Issue:** Staff has different slug but same project ID!

---

## 🔧 Recommended Fix (Option 1)

### Change Staff Slug to Match Project ID

**File:** `SmartphoneApp/app.config.js`

**Change:**
```javascript
staff: {
  name: "Staff Verification",
  slug: "africa-railways-app", // Changed from "staff-verification"
  package: "com.mpolobe.staff",
  bundleIdentifier: "com.mpolobe.staff",
  projectId: "82efeb87-20c5-45b4-b945-65d4b9074c32",
  cameraPermission: "Allow Staff Verification to scan passenger tickets.",
  backgroundColor: "#0066CC",
  description: "Railway staff ticket verification tool"
}
```

**Why This Works:**
- Multiple apps can share the same slug and project ID
- Apps are differentiated by:
  - Package name (Android)
  - Bundle identifier (iOS)
  - App name
  - APP_VARIANT environment variable

---

## 🧪 Testing Plan

### 1. Check Current Assets
```bash
cd SmartphoneApp
ls -la assets/ | grep -E "(icon|splash|adaptive)"
```

**Required Assets per App:**
- `icon-railways.png`
- `icon-africoin.png`
- `icon-sentinel.png`
- `icon-staff.png`
- `splash-railways.png`
- `splash-africoin.png`
- `splash-sentinel.png`
- `splash-staff.png`
- `adaptive-icon-railways.png`
- `adaptive-icon-africoin.png`
- `adaptive-icon-sentinel.png`
- `adaptive-icon-staff.png`

### 2. Verify Dependencies
```bash
cd SmartphoneApp
npm install --legacy-peer-deps
```

### 3. Test Configuration Validation
```bash
# Test each app variant
APP_VARIANT=railways npx expo config --type public
APP_VARIANT=africoin npx expo config --type public
APP_VARIANT=sentinel npx expo config --type public
APP_VARIANT=staff npx expo config --type public
```

### 4. Test Local Builds (if possible)
```bash
# Railways
APP_VARIANT=railways eas build --profile development --platform android --local

# Africoin
APP_VARIANT=africoin eas build --profile development --platform android --local

# Sentinel
APP_VARIANT=sentinel eas build --profile development --platform android --local

# Staff
APP_VARIANT=staff eas build --profile development --platform android --local
```

---

## 📋 Build Profiles Check

### EAS Build Profiles (eas.json)

**Expected Profiles:**
- ✅ `railways` - Railways app
- ✅ `africoin` - Africoin app
- ✅ `sentinel` - Sentinel app
- ✅ `staff` - Staff app

**Verification:**
```bash
cd SmartphoneApp
cat eas.json | grep -A 10 '"railways":'
cat eas.json | grep -A 10 '"africoin":'
cat eas.json | grep -A 10 '"sentinel":'
cat eas.json | grep -A 10 '"staff":'
```

---

## 🎯 Action Items

### Immediate (Critical)
1. ✅ Fix Staff app slug mismatch
2. ⏳ Verify all assets exist
3. ⏳ Test configuration validation
4. ⏳ Test local builds

### Short Term
1. ⏳ Document asset requirements
2. ⏳ Create asset generation script
3. ⏳ Add configuration validation tests
4. ⏳ Update build documentation

### Long Term
1. ⏳ Consider separate project IDs for each app
2. ⏳ Implement automated testing
3. ⏳ Set up CI/CD for all apps
4. ⏳ Create app-specific documentation

---

## 🔍 Verification Commands

### Check Slugs
```bash
cd SmartphoneApp
grep -A 2 "slug:" app.config.js
```

### Check Project IDs
```bash
cd SmartphoneApp
grep -A 2 "projectId:" app.config.js
```

### Check Packages
```bash
cd SmartphoneApp
grep -A 2 "package:" app.config.js
```

### Validate Configuration
```bash
cd SmartphoneApp
for variant in railways africoin sentinel staff; do
  echo "=== Testing $variant ==="
  APP_VARIANT=$variant node -e "console.log(require('./app.config.js').expo.slug)"
  APP_VARIANT=$variant node -e "console.log(require('./app.config.js').expo.extra.eas.projectId)"
done
```

---

## 📊 Summary

### Current Status
- ✅ Railways: Correct configuration
- ✅ Africoin: Correct configuration
- ✅ Sentinel: Fixed (merged to main)
- ❌ Staff: **Needs fix** - slug mismatch

### Required Actions
1. **Fix Staff app slug** - Change from `staff-verification` to `africa-railways-app`
2. **Verify assets** - Ensure all icon/splash files exist
3. **Test builds** - Validate all apps can build
4. **Update documentation** - Document the fix

### Risk Assessment
- **High:** Staff app will fail to build (same error as Sentinel)
- **Medium:** Missing assets will cause build failures
- **Low:** Configuration validation issues

---

## 🚀 Next Steps

1. Apply Staff app slug fix
2. Verify all assets exist
3. Test configuration for all apps
4. Attempt local builds
5. Document results
6. Commit and push fixes

**Priority:** HIGH - Staff app will fail to build without fix
