# Google Play Store Service Account Setup Status

## ✅ Completed Steps

### 1. Service Account Verification
- **Status**: ✅ Confirmed
- **Email**: `africoin-wallet-deploy@gen-lang-client-0453426956.iam.gserviceaccount.com`
- **Project**: `gen-lang-client-0453426956`
- **Display Name**: Africoin Wallet Deploy
- **OAuth2 Client ID**: `1117080309392259004737`

### 2. Repository Check
- **Status**: ✅ Completed
- **Repository**: `mpolobe/scroll-waitlist-exchange-1`
- **Result**: No existing service account keys found
- **Action**: Will create new key in this repository

### 3. GCP CLI Setup
- **Status**: ✅ Installed
- **Location**: `/tmp/google-cloud-sdk/bin/gcloud`
- **Version**: Latest
- **Project Configured**: `gen-lang-client-0453426956`

### 4. Security Configuration
- **Status**: ✅ Updated
- **File**: `.gitignore`
- **Patterns Added**:
  - `google-play-service-account.json`
  - `google-play-*.json`
- **Existing Patterns**: `*-key.json`, `service-account*.json`

### 5. Documentation Created
- **Status**: ✅ Complete
- **Files**:
  - `init_gcp_wallet.sh` - Automated setup script
  - `CREATE_PLAY_STORE_KEY.md` - Step-by-step guide
  - `GCP_PLAY_STORE_SETUP_STATUS.md` - This file

## ⚠️ Pending Action Required

### Authentication Needed

You must authenticate with GCP to create the service account key:

```bash
export PATH="/tmp/google-cloud-sdk/bin:$PATH"
gcloud auth login
```

**Why**: Service account key creation requires your GCP credentials. This cannot be automated for security reasons.

## 🚀 Next Steps

### Step 1: Authenticate (Required)

```bash
# Set PATH
export PATH="/tmp/google-cloud-sdk/bin:$PATH"

# Login to GCP
gcloud auth login

# Verify authentication
gcloud auth list
```

### Step 2: Create Service Account Key

**Option A: Use the automated script**
```bash
./init_gcp_wallet.sh
```

**Option B: Manual creation**
```bash
gcloud config set project gen-lang-client-0453426956
gcloud iam service-accounts keys create google-play-service-account.json \
  --iam-account=africoin-wallet-deploy@gen-lang-client-0453426956.iam.gserviceaccount.com
```

### Step 3: Verify Key Created

```bash
# Check file exists
ls -lh google-play-service-account.json

# Verify it's valid JSON
cat google-play-service-account.json | jq . > /dev/null && echo "✅ Valid JSON" || echo "❌ Invalid JSON"

# Verify it's ignored by git
git check-ignore google-play-service-account.json && echo "✅ Ignored" || echo "⚠️ NOT ignored"
```

### Step 4: Upload to Build Services

Choose the service(s) you're using:

#### Codemagic
1. Go to: https://codemagic.io/apps
2. Select app → Environment variables
3. Add: `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS`
4. Paste contents of `google-play-service-account.json`

#### GitHub Actions
1. Go to: https://github.com/mpolobe/africa-railways/settings/secrets/actions
2. New repository secret
3. Name: `GOOGLE_PLAY_SERVICE_ACCOUNT`
4. Value: Paste contents of `google-play-service-account.json`

#### EAS Build
```bash
eas secret:create --scope project --name GOOGLE_PLAY_SERVICE_ACCOUNT --type file --value google-play-service-account.json
```

## 📋 Checklist

- [x] Service account verified to exist
- [x] GCP CLI installed and configured
- [x] .gitignore updated with key patterns
- [x] Documentation created
- [x] Setup script created
- [ ] **GCP authentication completed** ⬅️ YOU ARE HERE
- [ ] Service account key created
- [ ] Key verified as valid JSON
- [ ] Key uploaded to Codemagic (if using)
- [ ] Key uploaded to GitHub Secrets (if using)
- [ ] Key uploaded to EAS (if using)
- [ ] Test build with Play Store deployment

## 🔒 Security Notes

### What's Protected
- ✅ Key file patterns in `.gitignore`
- ✅ Automated script includes safety checks
- ✅ Documentation emphasizes security
- ✅ No credentials stored in repository

### What You Must Do
- ⚠️ Never commit `google-play-service-account.json` to git
- ⚠️ Store key securely after upload to build services
- ⚠️ Rotate keys periodically (every 90 days recommended)
- ⚠️ Delete local key file after upload (optional)

## 📚 Reference Documentation

- **Setup Guide**: `CREATE_PLAY_STORE_KEY.md`
- **Automated Script**: `init_gcp_wallet.sh`
- **GCP Setup**: `GCP_SETUP.md`
- **Build Guide**: `BUILD_GUIDE.md`

## 🆘 Troubleshooting

### "You do not currently have an active account selected"
**Solution**: Run `gcloud auth login` first

### "Permission denied" when creating key
**Solution**: Verify you have `iam.serviceAccountKeys.create` permission

### Key file not in .gitignore
**Solution**: Already added. Run `git check-ignore google-play-service-account.json` to verify

### Can't find gcloud command
**Solution**: Run `export PATH="/tmp/google-cloud-sdk/bin:$PATH"`

## 📊 Project Information

| Item | Value |
|------|-------|
| **GCP Project** | gen-lang-client-0453426956 |
| **Service Account** | africoin-wallet-deploy |
| **Full Email** | africoin-wallet-deploy@gen-lang-client-0453426956.iam.gserviceaccount.com |
| **Purpose** | Google Play Store deployment |
| **Apps** | Africoin Wallet, Africa Railways Hub |
| **Key File** | google-play-service-account.json |
| **Repository** | mpolobe/africa-railways |

## ✅ Summary

**What's Done:**
- Service account confirmed to exist in GCP
- GCP CLI installed and configured
- Security measures in place (.gitignore)
- Documentation and scripts created

**What's Needed:**
- You must authenticate with GCP (`gcloud auth login`)
- Create the service account key
- Upload key to your build service(s)

**Time Required:**
- Authentication: 2 minutes
- Key creation: 30 seconds
- Upload to build service: 2-5 minutes
- **Total: ~5-10 minutes**

---

**Status**: Ready for authentication
**Last Updated**: 2024-12-30
**Next Action**: Run `gcloud auth login`
