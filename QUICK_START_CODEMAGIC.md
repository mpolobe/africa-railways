# Quick Start: Setup Codemagic in 2 Minutes

## Option 1: Automated Setup (Recommended) ⚡

### Step 1: Get Codemagic API Token

1. Go to [https://codemagic.io/user/settings](https://codemagic.io/user/settings)
2. Click **"Integrations"** → **"Codemagic API"**
3. Click **"Generate new token"**
4. Copy the token

### Step 2: Run Setup Script

```bash
# Set your API token
export CODEMAGIC_API_TOKEN='your-token-here'

# Run the automated setup
./setup-codemagic-env.sh
```

**Done!** All environment variables are now in Codemagic.

---

## Option 2: Manual Setup (5 minutes) 📝

### Run Interactive Script

```bash
./setup-codemagic-env.sh
```

The script will:
1. Show you each environment variable
2. Wait for you to add it in Codemagic UI
3. Guide you through all 4 groups

**Follow the on-screen instructions!**

---

## What Gets Set Up

### 4 Environment Groups

✅ **railways_credentials**
- EXPO_TOKEN
- BACKEND_URL
- RAILWAYS_API_KEY

✅ **africoin_credentials**
- EXPO_TOKEN
- BACKEND_URL
- AFRICOIN_API_KEY

✅ **sentinel_credentials**
- EXPO_TOKEN
- BACKEND_URL
- SENTINEL_API_KEY
- SUI_NETWORK

✅ **staff_credentials**
- EXPO_TOKEN
- BACKEND_URL
- STAFF_API_KEY
- ALCHEMY_SDK_KEY (manual)

---

## Test Your Setup

After running the script:

```bash
# Trigger a test build
git tag railways-v1.0.0-test
git push origin railways-v1.0.0-test
```

Check build logs for:
```
✅ EXPO_TOKEN is set (length: 40)
```

---

## Troubleshooting

### API Method Not Working?

**Problem**: Script can't connect to Codemagic API

**Solution**: Use manual method instead:
```bash
./setup-codemagic-env.sh
# Choose 'y' for manual setup
```

### Variables Not Showing in Codemagic?

**Problem**: Added variables but not visible

**Solution**:
1. Refresh Codemagic page
2. Check you're in the right app (africa-railways)
3. Verify group names match exactly

### Build Still Fails?

**Problem**: Build fails with "EXPO_TOKEN not set"

**Solution**:
1. Verify token is in the correct group
2. Check "Secure" checkbox is enabled
3. Ensure group is assigned to workflow
4. Try re-adding the token

---

## Quick Reference

### Your Credentials

```
EXPO_TOKEN: PU6XiaYTwUlDHY224UJecC_nxeLquM0mLCUDbi41
BACKEND_URL: https://africa-railways.vercel.app
RAILWAYS_API_KEY: rw_34a9e08f44dadbfd0f376a76df6d5594763a0e4fa77b6f63
AFRICOIN_API_KEY: ac_606759e20b550edfc538388d6330a46e272f3b9644719ab1
```

### Codemagic Links

- Dashboard: [https://codemagic.io/apps](https://codemagic.io/apps)
- Settings: [https://codemagic.io/app/africa-railways/settings](https://codemagic.io/app/africa-railways/settings)
- API Tokens: [https://codemagic.io/user/settings](https://codemagic.io/user/settings)

---

## Next Steps

After setup:

1. ✅ Verify all 4 groups in Codemagic UI
2. ✅ Trigger a test build
3. ✅ Check build logs
4. ✅ Download APK/IPA artifacts
5. ✅ Start building all 4 apps!

---

**Setup takes 2 minutes with API, 5 minutes manually. Choose your method and go!** 🚀
