# Create Google Play Store Service Account Key

## Service Account Confirmed ✅

```
Email: africoin-wallet-deploy@gen-lang-client-0453426956.iam.gserviceaccount.com
Project: gen-lang-client-0453426956
Display Name: Africoin Wallet Deploy
```

## Steps to Create Key

### 1. Authenticate with GCP

```bash
export PATH="/tmp/google-cloud-sdk/bin:$PATH"
gcloud auth login
```

This will open a browser window for authentication.

### 2. Set the Project

```bash
gcloud config set project gen-lang-client-0453426956
```

### 3. Create the Service Account Key

```bash
cd /workspaces/africa-railways
gcloud iam service-accounts keys create google-play-service-account.json \
  --iam-account=africoin-wallet-deploy@gen-lang-client-0453426956.iam.gserviceaccount.com
```

Expected output:
```
created key [KEY_ID] of type [json] as [google-play-service-account.json] for [africoin-wallet-deploy@gen-lang-client-0453426956.iam.gserviceaccount.com]
```

### 4. Verify Key Created

```bash
ls -lh google-play-service-account.json
```

Should show a JSON file around 2-3KB in size.

### 5. Verify .gitignore

```bash
grep -q "google-play-service-account.json" .gitignore && echo "✅ In .gitignore" || echo "❌ NOT in .gitignore"
```

If not in .gitignore, add it:
```bash
echo "google-play-service-account.json" >> .gitignore
```

## Upload to Build Services

### For Codemagic

1. Go to: https://codemagic.io/apps
2. Select your app
3. Navigate to: **Environment variables**
4. Add new variable:
   - **Name**: `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS`
   - **Type**: Secure file or text
   - **Value**: Paste entire contents of `google-play-service-account.json`

### For GitHub Actions

1. Go to: https://github.com/mpolobe/africa-railways/settings/secrets/actions
2. Click: **New repository secret**
3. Add secret:
   - **Name**: `GOOGLE_PLAY_SERVICE_ACCOUNT`
   - **Value**: Paste entire contents of `google-play-service-account.json`

### For EAS Build

```bash
# Read the file and create secret
eas secret:create --scope project --name GOOGLE_PLAY_SERVICE_ACCOUNT --type file --value google-play-service-account.json
```

Or manually:
```bash
cat google-play-service-account.json | eas secret:create --scope project --name GOOGLE_PLAY_SERVICE_ACCOUNT --type string
```

## Security Checklist

- [ ] Key file created: `google-play-service-account.json`
- [ ] File is in `.gitignore`
- [ ] File NOT committed to git
- [ ] Key uploaded to Codemagic (if using)
- [ ] Key uploaded to GitHub Secrets (if using)
- [ ] Key uploaded to EAS (if using)
- [ ] Local key file backed up securely (optional)

## Verify Not Committed

```bash
# Check git status
git status

# Verify file is ignored
git check-ignore google-play-service-account.json && echo "✅ File is ignored" || echo "⚠️ File will be committed!"
```

## Troubleshooting

### "You do not currently have an active account selected"

**Solution**: Run `gcloud auth login` first

### "Permission denied"

**Solution**: Ensure you have `iam.serviceAccountKeys.create` permission on the project

### "Service account does not exist"

**Solution**: The service account exists (confirmed above). Check project ID is correct.

### Key file too large or too small

**Expected size**: 2-3 KB
**If different**: File may be corrupted or incomplete

## Next Steps

After creating the key:

1. ✅ Verify key file exists and is valid JSON
2. ✅ Confirm it's in .gitignore
3. ✅ Upload to your build service(s)
4. ✅ Test a build with Play Store deployment
5. ✅ Delete local key file after upload (optional, for security)

## Quick Command Summary

```bash
# All in one (after authentication)
export PATH="/tmp/google-cloud-sdk/bin:$PATH"
gcloud auth login
gcloud config set project gen-lang-client-0453426956
cd /workspaces/africa-railways
gcloud iam service-accounts keys create google-play-service-account.json \
  --iam-account=africoin-wallet-deploy@gen-lang-client-0453426956.iam.gserviceaccount.com
echo "google-play-service-account.json" >> .gitignore
git check-ignore google-play-service-account.json
```

---

**Project**: Africa Railways
**Service Account**: africoin-wallet-deploy@gen-lang-client-0453426956.iam.gserviceaccount.com
**Purpose**: Google Play Store deployment for Africoin Wallet
**Created**: 2024-12-30
