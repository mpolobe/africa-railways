# Codemagic Sentinel Credentials Fix

## 🐛 Issue

### Error Message
```
Codemagic.yaml references to unknown variable group(s): sentinel_credentials
```

## 🔍 Analysis

The error message mentions `sentinel_credentials`, but this variable group **does not exist** in the `codemagic.yaml` file. After thorough investigation:

1. ✅ The `codemagic.yaml` file is correctly configured
2. ✅ Sentinel workflows use `railways_credentials` (correct)
3. ✅ Sentinel shares the same EAS project ID with Railways
4. ❌ The error is likely from Codemagic UI configuration

## ✅ Current Configuration (Correct)

### Sentinel Android Workflow
```yaml
react-native-sentinel-android:
  name: Sentinel Portal - Android
  environment:
    groups:
      - railways_credentials  # ✅ Correct - uses Railways credentials
    vars:
      APP_VARIANT: sentinel
      PACKAGE_NAME: com.mpolobe.sentinel
      EXPO_PROJECT_ID: 82efeb87-20c5-45b4-b945-65d4b9074c32
```

### Sentinel iOS Workflow
```yaml
react-native-sentinel-ios:
  name: Sentinel Portal - iOS
  environment:
    groups:
      - railways_credentials  # ✅ Correct
      - ios_credentials       # ✅ Correct
    vars:
      APP_VARIANT: sentinel
      BUNDLE_ID: com.mpolobe.sentinel
      EXPO_PROJECT_ID: 82efeb87-20c5-45b4-b945-65d4b9074c32
```

## 🔧 Solution

### Option 1: Use Existing Credentials (Recommended)
Since Sentinel shares the same EAS project ID with Railways, it should use the same credentials:

**No changes needed to codemagic.yaml** - it's already correct!

The error is likely from:
1. Old Codemagic UI configuration
2. Cached configuration
3. A different branch or file

### Option 2: Create Sentinel Credentials Group (Alternative)
If you want separate credentials for Sentinel:

1. **In Codemagic UI:**
   - Go to Team settings → Environment variables
   - Create new variable group: `sentinel_credentials`
   - Add the same variables as `railways_credentials`:
     - `EXPO_TOKEN`
     - `BACKEND_URL`
     - `SENTINEL_API_KEY` (or `API_KEY`)

2. **Update codemagic.yaml:**
```yaml
react-native-sentinel-android:
  environment:
    groups:
      - sentinel_credentials  # New group
```

## 📋 Required Variables

### railways_credentials Group
These variables must be set in Codemagic UI:

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_TOKEN` | Expo authentication token | ✅ Yes |
| `BACKEND_URL` | Backend API URL | ✅ Yes |
| `RAILWAYS_API_KEY` | Railways API key | ✅ Yes |
| `SENTINEL_API_KEY` | Sentinel API key | ⚠️ If separate |
| `STAFF_API_KEY` | Staff API key | ⚠️ If separate |

### How to Get EXPO_TOKEN
```bash
# Login to Expo
eas login

# Generate token
eas whoami
# Or create a token in Expo dashboard:
# https://expo.dev/accounts/[account]/settings/access-tokens
```

## 🔍 Verification Steps

### 1. Check Codemagic UI
```
1. Go to Codemagic dashboard
2. Select your app
3. Go to Environment variables
4. Verify variable groups exist:
   - railways_credentials ✅
   - ios_credentials ✅
   - africoin_credentials ✅
   - web_credentials ✅
   - android_credentials ✅
```

### 2. Check codemagic.yaml
```bash
# Search for sentinel_credentials (should return nothing)
grep -n "sentinel_credentials" codemagic.yaml

# Verify Sentinel uses railways_credentials
grep -A 5 "react-native-sentinel" codemagic.yaml | grep "groups:"
```

### 3. Test Build
```bash
# Trigger Sentinel build
git tag sentinel-v1.0.0
git push origin sentinel-v1.0.0

# Or push to main/develop branch
git push origin main
```

## 📊 App Credentials Mapping

| App | Variable Group | EAS Project ID | Shared With |
|-----|---------------|----------------|-------------|
| Railways | railways_credentials | 82efeb87... | Sentinel, Staff |
| Sentinel | railways_credentials | 82efeb87... | Railways, Staff |
| Staff | railways_credentials | 82efeb87... | Railways, Sentinel |
| Africoin | africoin_credentials | 5fa2f2b4... | None |

**Note:** Railways, Sentinel, and Staff share the same EAS project ID and credentials.

## 🚀 Quick Fix Steps

### If Error Persists:

1. **Clear Codemagic Cache:**
   ```
   - Go to Codemagic dashboard
   - Select the app
   - Go to Settings → Build settings
   - Clear build cache
   ```

2. **Re-trigger Build:**
   ```bash
   git commit --allow-empty -m "Trigger build"
   git push origin main
   ```

3. **Check Variable Group Names:**
   - Ensure exact spelling: `railways_credentials` (not `railway_credentials`)
   - Check for typos in Codemagic UI
   - Verify group is assigned to the app

4. **Verify EXPO_TOKEN:**
   ```bash
   # In Codemagic UI, check that EXPO_TOKEN is set
   # It should be a long string starting with "ey..."
   ```

## 📝 Codemagic UI Setup

### Create Variable Groups

1. **Go to Team Settings:**
   ```
   Codemagic Dashboard → Team → Environment variables
   ```

2. **Create railways_credentials Group:**
   ```
   Group name: railways_credentials
   Variables:
   - EXPO_TOKEN: [your-expo-token]
   - BACKEND_URL: https://africa-railways.vercel.app
   - RAILWAYS_API_KEY: [your-api-key]
   - SENTINEL_API_KEY: [your-api-key]
   - STAFF_API_KEY: [your-api-key]
   ```

3. **Assign to Apps:**
   ```
   - Select each app (Railways, Sentinel, Staff)
   - Go to Environment variables
   - Add railways_credentials group
   ```

## 🔐 Security Best Practices

1. **Never commit tokens to git**
2. **Use Codemagic's encrypted variables**
3. **Rotate tokens regularly**
4. **Use separate tokens for production**
5. **Limit token permissions**

## 📚 Related Documentation

- [Codemagic Environment Variables](https://docs.codemagic.io/yaml-basic-configuration/configuring-environment-variables/)
- [EAS Build Credentials](https://docs.expo.dev/build/introduction/)
- [Expo Access Tokens](https://docs.expo.dev/accounts/programmatic-access/)

## ✅ Verification Checklist

- [ ] `codemagic.yaml` uses `railways_credentials` for Sentinel
- [ ] No references to `sentinel_credentials` in codemagic.yaml
- [ ] `railways_credentials` group exists in Codemagic UI
- [ ] `EXPO_TOKEN` is set in `railways_credentials`
- [ ] `BACKEND_URL` is set in `railways_credentials`
- [ ] API keys are set for each app variant
- [ ] Build cache cleared
- [ ] Test build triggered successfully

## 🎯 Expected Behavior

After fix:
```
✅ Sentinel Android build starts
✅ Credentials loaded from railways_credentials
✅ EXPO_TOKEN verified
✅ EAS build triggered
✅ APK generated successfully
```

## 🐛 Troubleshooting

### Error: "EXPO_TOKEN is not set"
**Solution:** Add EXPO_TOKEN to railways_credentials group in Codemagic UI

### Error: "Project not found"
**Solution:** Verify EXPO_PROJECT_ID matches in app.config.js and codemagic.yaml

### Error: "Invalid credentials"
**Solution:** Regenerate EXPO_TOKEN and update in Codemagic

### Error: "Build timeout"
**Solution:** Check Codemagic build queue, retry build

## 📞 Support

If error persists:
1. Check Codemagic build logs
2. Verify all variable groups exist
3. Contact Codemagic support
4. Check Expo dashboard for project status

---

## 🎉 Summary

The `codemagic.yaml` file is **correctly configured**. Sentinel workflows use `railways_credentials` as they should. The error is likely from:
- Old Codemagic UI configuration
- Missing variable group in Codemagic UI
- Cached configuration

**Action Required:** Verify `railways_credentials` group exists in Codemagic UI with all required variables.

**Status:** ✅ Configuration file is correct
**Next Step:** Check Codemagic UI variable groups
