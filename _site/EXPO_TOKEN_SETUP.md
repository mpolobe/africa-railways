# EXPO_TOKEN Setup for Codemagic

## Problem

Build fails with:
```
An Expo user account is required to proceed.
Either log in with eas login or set the EXPO_TOKEN environment variable
```

## Solution

You need to add `EXPO_TOKEN` to your Codemagic environment variable groups.

---

## Step 1: Get Your EXPO_TOKEN

### Option A: From Expo Website (Recommended)

1. Go to [https://expo.dev/accounts/[your-username]/settings/access-tokens](https://expo.dev/accounts/[your-username]/settings/access-tokens)
2. Click **"Create Token"**
3. Name it: `codemagic-ci`
4. Copy the token (you'll only see it once!)

### Option B: From CLI

```bash
# Login to Expo
npx eas-cli login

# Get your token
npx eas-cli whoami
# This shows your username

# Create a token
npx eas-cli token:create --name codemagic-ci
# Copy the token that's displayed
```

---

## Step 2: Add EXPO_TOKEN to Codemagic

### For Each App's Credentials Group

1. Go to [https://codemagic.io](https://codemagic.io)
2. Navigate to **Applications** → **africa-railways**
3. Click **Settings** (gear icon)
4. Go to **Environment variables**
5. Add token to each group:

#### railways_credentials
```
Variable name: EXPO_TOKEN
Value: [paste your token]
Secure: ✅ (checked)
```

#### africoin_credentials
```
Variable name: EXPO_TOKEN
Value: [paste your token]
Secure: ✅ (checked)
```

#### sentinel_credentials
```
Variable name: EXPO_TOKEN
Value: [paste your token]
Secure: ✅ (checked)
```

#### staff_credentials
```
Variable name: EXPO_TOKEN
Value: [paste your token]
Secure: ✅ (checked)
```

**Important**: Use the **same token** for all groups.

---

## Step 3: Verify Setup

### Check in Codemagic UI

1. Go to **Environment variables**
2. Verify each group has `EXPO_TOKEN` listed
3. Value should show as `***` (secured)

### Test with a Build

1. Trigger a build (any workflow)
2. Check build logs for:
   ```
   ✅ EXPO_TOKEN is set (length: 40)
   ```
3. If you see this, the token is configured correctly

---

## Complete Environment Variable Checklist

### railways_credentials
- ✅ `EXPO_TOKEN` - Expo access token
- ✅ `BACKEND_URL` - Backend API URL
- ✅ `RAILWAYS_API_KEY` - Railways API key

### africoin_credentials
- ✅ `EXPO_TOKEN` - Expo access token
- ✅ `BACKEND_URL` - Backend API URL
- ✅ `AFRICOIN_API_KEY` - Africoin API key

### sentinel_credentials
- ✅ `EXPO_TOKEN` - Expo access token
- ✅ `BACKEND_URL` - Backend API URL
- ✅ `SENTINEL_API_KEY` - Sentinel API key
- ✅ `SUI_NETWORK` - Sui network (mainnet/testnet)

### staff_credentials
- ✅ `EXPO_TOKEN` - Expo access token
- ✅ `BACKEND_URL` - Backend API URL
- ✅ `STAFF_API_KEY` - Staff API key
- ✅ `ALCHEMY_SDK_KEY` - Alchemy API key

### ios_credentials (shared)
- ✅ `APP_STORE_CONNECT_PRIVATE_KEY` - Base64 encoded P8 key
- ✅ `APP_STORE_CONNECT_KEY_IDENTIFIER` - Key ID
- ✅ `APP_STORE_CONNECT_ISSUER_ID` - Issuer ID

---

## Troubleshooting

### Token Not Working

**Problem**: Build still fails with "Expo user account required"

**Solutions**:
1. Verify token is not expired (tokens don't expire by default)
2. Check token has correct permissions
3. Ensure variable name is exactly `EXPO_TOKEN` (case-sensitive)
4. Verify "Secure" checkbox is enabled
5. Try creating a new token

### Token Shows as Not Set

**Problem**: Build log shows "EXPO_TOKEN is not set"

**Solutions**:
1. Check you added it to the correct group (e.g., `railways_credentials`)
2. Verify the group is assigned to the workflow
3. Check for typos in variable name
4. Save changes in Codemagic UI

### Multiple Expo Accounts

**Problem**: You have multiple Expo accounts

**Solution**:
1. Use the account that owns the Expo projects
2. Check project IDs in `app.config.js`:
   - Railways: `82efeb87-20c5-45b4-b945-65d4b9074c32`
   - Africoin: `5fa2f2b4-5c9f-43bf-b1eb-20d90ae19185`
3. Ensure token is from the account that owns these projects

---

## Security Best Practices

### ✅ DO:
- Mark EXPO_TOKEN as "Secure" in Codemagic
- Use separate tokens for different CI systems
- Rotate tokens periodically (every 6 months)
- Name tokens descriptively (e.g., `codemagic-ci`)

### ❌ DON'T:
- Commit tokens to git
- Share tokens in plain text
- Use personal tokens for CI (create dedicated CI tokens)
- Reuse tokens across multiple services

---

## Quick Setup Script

```bash
#!/bin/bash

echo "🔐 Expo Token Setup for Codemagic"
echo ""
echo "Step 1: Get your EXPO_TOKEN"
echo "Run: npx eas-cli token:create --name codemagic-ci"
echo ""
read -p "Paste your EXPO_TOKEN: " TOKEN
echo ""
echo "Step 2: Add to Codemagic"
echo "Go to: https://codemagic.io/apps"
echo "Navigate to: africa-railways → Settings → Environment variables"
echo ""
echo "Add to these groups:"
echo "  - railways_credentials"
echo "  - africoin_credentials"
echo "  - sentinel_credentials"
echo "  - staff_credentials"
echo ""
echo "Variable name: EXPO_TOKEN"
echo "Value: $TOKEN"
echo "Secure: ✅"
echo ""
echo "✅ Setup complete! Trigger a build to test."
```

---

## Verification Checklist

Before triggering a build, verify:

- [ ] EXPO_TOKEN created in Expo dashboard
- [ ] Token copied and saved securely
- [ ] Token added to `railways_credentials` group
- [ ] Token added to `africoin_credentials` group
- [ ] Token added to `sentinel_credentials` group
- [ ] Token added to `staff_credentials` group
- [ ] All tokens marked as "Secure"
- [ ] Changes saved in Codemagic UI

---

## Next Steps

After setting up EXPO_TOKEN:

1. **Trigger a test build**:
   ```bash
   git tag railways-v1.0.0-test
   git push origin railways-v1.0.0-test
   ```

2. **Check build logs** for:
   ```
   ✅ EXPO_TOKEN is set (length: 40)
   ```

3. **If successful**, you'll see:
   ```
   Starting EAS build...
   Build queued successfully
   ```

4. **Download artifacts** when build completes

---

## Summary

**Required**: `EXPO_TOKEN` must be set in all 4 credential groups
**How to get**: Create token at expo.dev or via `eas-cli token:create`
**Where to add**: Codemagic → Settings → Environment variables
**Security**: Always mark as "Secure"

**After setup, builds will authenticate automatically with Expo!** 🚀
