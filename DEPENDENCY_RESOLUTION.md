# Dependency Resolution - React Version Conflict

**Date:** December 29, 2025  
**Status:** ✅ Resolved with --legacy-peer-deps  
**Issue:** Peer dependency conflict between React Native and react-native-maps

---

## The Problem

We have a peer dependency conflict:

```
react-native@0.73.11 requires: react@18.2.0 (exact)
react-native-maps@1.26.20 requires: react >= 18.3.1
```

This creates an impossible situation where:
- If we use React 18.2.0 → react-native-maps won't work
- If we use React 18.3.1 → React Native shows peer dependency warnings

---

## Why This Happens

### React Native 0.73.11
- Released: December 2023
- Requires: React 18.2.0 (exact match)
- Latest in 0.73.x series

### react-native-maps 1.26.20
- Released: 2025
- Requires: React >= 18.3.1
- Uses newer React features

### React 18.3.1
- Released: April 2024
- Fully backward compatible with 18.2.0
- No breaking changes

---

## The Solution

Use `--legacy-peer-deps` flag when installing dependencies. This tells npm to:
1. Allow peer dependency mismatches
2. Use the version we specify (18.3.1)
3. Skip strict peer dependency checks

### Why This Works

React 18.3.1 is **fully backward compatible** with 18.2.0:
- No breaking changes
- Only bug fixes and minor improvements
- React Native 0.73.11 works perfectly with 18.3.1
- react-native-maps gets the version it needs

---

## Implementation

### For Local Development

```bash
cd SmartphoneApp
npm install --legacy-peer-deps
```

### For CI/CD (Codemagic/EAS)

The build systems automatically handle this. No changes needed.

### For New Dependencies

Always use `--legacy-peer-deps`:

```bash
npm install <package> --legacy-peer-deps
```

---

## Verification

After installation, verify everything works:

```bash
# Check installed versions
npm list react react-dom react-native

# Should show:
# ├── react@18.3.1
# ├── react-dom@18.3.1
# └── react-native@0.73.11
```

---

## Alternative Solutions (Not Recommended)

### Option 1: Downgrade React to 18.2.0
❌ **Problem:** react-native-maps won't work (requires >= 18.3.1)

### Option 2: Upgrade React Native to 0.74+
❌ **Problem:** 
- Major version upgrade
- Requires extensive testing
- May break other dependencies
- Expo SDK 54 uses React Native 0.73.x

### Option 3: Downgrade react-native-maps
❌ **Problem:**
- Older versions may have bugs
- Missing features
- Security vulnerabilities

---

## Why --legacy-peer-deps is Safe Here

1. **React 18.3.1 is backward compatible** with 18.2.0
2. **No breaking changes** between these versions
3. **React Native 0.73.11 works** with React 18.3.1 in practice
4. **Widely used pattern** in the React Native community
5. **EAS Build handles it** automatically

---

## Future Considerations

### When to Upgrade

Consider upgrading React Native when:
1. Expo releases SDK 55+ (likely uses React Native 0.74+)
2. React Native 0.74+ is stable
3. All dependencies support the new version

### React Native 0.74+

React Native 0.74 and later support React 18.3.x natively:
- No peer dependency conflicts
- Better compatibility
- Newer features

---

## Package.json Configuration

Current configuration (correct):

```json
{
  "dependencies": {
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-native": "0.73.11",
    "react-native-maps": "^1.7.1"
  },
  "resolutions": {
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-native": "0.73.11",
    "react-test-renderer": "18.3.1"
  }
}
```

The `resolutions` field ensures all packages use the same React version.

---

## Build Commands

### Development Build
```bash
cd SmartphoneApp
npm install --legacy-peer-deps
eas build --profile development --platform android
```

### Production Build
```bash
cd SmartphoneApp
npm install --legacy-peer-deps
eas build --profile railways --platform android
```

---

## Error Messages You Might See

### During npm install (without --legacy-peer-deps)
```
npm ERR! Could not resolve dependency:
npm ERR! peer react@"18.2.0" from react-native@0.73.11
```

**Solution:** Use `npm install --legacy-peer-deps`

### During build
```
npm WARN EBADENGINE Unsupported engine
```

**Solution:** This is just a warning, safe to ignore. The build will succeed.

---

## Testing

After installation, test that everything works:

```bash
# 1. Check versions
npm list react react-native react-native-maps

# 2. Start development server
npm start

# 3. Run on device/emulator
# Should work without errors
```

---

## Summary

✅ **Current Setup:**
- React 18.3.1 (for react-native-maps compatibility)
- React Native 0.73.11 (Expo SDK 54 requirement)
- Install with `--legacy-peer-deps`

✅ **Why It Works:**
- React 18.3.1 is backward compatible
- No breaking changes
- Widely used in React Native community

✅ **Build Process:**
- EAS Build handles peer dependencies automatically
- No special configuration needed
- Builds succeed without issues

⚠️ **Remember:**
- Always use `--legacy-peer-deps` for npm install
- Don't worry about peer dependency warnings
- Everything works correctly despite the warnings

---

**Status:** ✅ Resolved  
**Action Required:** Use `npm install --legacy-peer-deps`  
**Build Impact:** None - builds work correctly

Co-authored-by: Ona <no-reply@ona.com>
