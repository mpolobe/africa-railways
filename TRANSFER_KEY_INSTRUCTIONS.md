# Transfer Service Account Key from Cloud Shell

## ✅ Key Created Successfully

```
Key ID: 9b75f76406c0603b7b94e983877c2d6ccc7a52c7
Type: json
File: google-play-service-account.json
Service Account: africoin-wallet-deploy@gen-lang-client-0453426956.iam.gserviceaccount.com
```

## ⚠️ Current Issue

The key was created in **Cloud Shell**, but needs to be in **this Gitpod workspace**.

Current file in workspace: **0 bytes (empty)**

## 🔄 Transfer Options

### Option 1: Download from Cloud Shell, Upload to Gitpod (Recommended)

**In Cloud Shell:**
```bash
# 1. Download the file
cloudshell download google-play-service-account.json
```

This downloads to your local computer.

**In Gitpod:**
1. Drag and drop the file into VSCode file explorer (left sidebar)
2. Drop it in the root folder: `/workspaces/africa-railways/`

### Option 2: Copy Content via Terminal

**In Cloud Shell:**
```bash
# Display the content
cat google-play-service-account.json
```

**Copy the entire JSON output**, then:

**In Gitpod Terminal:**
```bash
# Create file with content
cat > google-play-service-account.json << 'EOF'
# Paste the JSON content here
EOF
```

### Option 3: Use gcloud in Gitpod (If Authenticated)

**In Gitpod:**
```bash
export PATH="/tmp/google-cloud-sdk/bin:$PATH"
gcloud auth login
gcloud config set project gen-lang-client-0453426956
gcloud iam service-accounts keys create google-play-service-account.json \
  --iam-account=africoin-wallet-deploy@gen-lang-client-0453426956.iam.gserviceaccount.com
```

**Note**: This creates a NEW key. The Cloud Shell key (ID: 9b75f76406c0603b7b94e983877c2d6ccc7a52c7) will still exist.

### Option 4: Direct Upload to Build Services (Skip Local File)

If you don't need the file locally, upload directly from Cloud Shell:

#### For GitHub Secrets (from Cloud Shell):
```bash
# Install GitHub CLI in Cloud Shell
gh auth login

# Create secret
gh secret set GOOGLE_PLAY_SERVICE_ACCOUNT < google-play-service-account.json \
  --repo mpolobe/africa-railways
```

#### For Codemagic (from Cloud Shell):
1. Run: `cat google-play-service-account.json`
2. Copy the output
3. Go to: https://codemagic.io/apps
4. Paste into environment variables

## ✅ After Transfer - Verification Steps

Once you have the file in Gitpod:

```bash
# 1. Check file size (should be ~2-3 KB)
ls -lh google-play-service-account.json

# 2. Verify it's valid JSON
cat google-play-service-account.json | jq . > /dev/null && echo "✅ Valid JSON" || echo "❌ Invalid"

# 3. Check it contains required fields
jq -r '.type, .project_id, .private_key_id, .client_email' google-play-service-account.json

# Expected output:
# service_account
# gen-lang-client-0453426956
# 9b75f76406c0603b7b94e983877c2d6ccc7a52c7
# africoin-wallet-deploy@gen-lang-client-0453426956.iam.gserviceaccount.com

# 4. Verify it's ignored by git
git check-ignore google-play-service-account.json && echo "✅ Ignored" || echo "⚠️ NOT ignored"
```

## 🚀 Next Steps After Transfer

### 1. Upload to GitHub Secrets

```bash
# Using GitHub CLI (if installed)
gh secret set GOOGLE_PLAY_SERVICE_ACCOUNT < google-play-service-account.json \
  --repo mpolobe/africa-railways

# Or manually:
# 1. Go to: https://github.com/mpolobe/africa-railways/settings/secrets/actions
# 2. Click: New repository secret
# 3. Name: GOOGLE_PLAY_SERVICE_ACCOUNT
# 4. Value: Paste entire file content
```

### 2. Upload to Codemagic (if using)

```bash
# Display content to copy
cat google-play-service-account.json
```

Then:
1. Go to: https://codemagic.io/apps
2. Select your app
3. Environment variables → Add variable
4. Name: `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS`
5. Paste the JSON content

### 3. Upload to EAS (if using)

```bash
# Create EAS secret
eas secret:create --scope project --name GOOGLE_PLAY_SERVICE_ACCOUNT --type file --value google-play-service-account.json
```

### 4. Verify Git Ignore

```bash
# Should output: ✅ Ignored
git status | grep google-play-service-account.json || echo "✅ File is ignored"
```

## 🔒 Security Reminder

After uploading to all required services:

```bash
# Optional: Delete local copy for security
rm google-play-service-account.json

# Verify it's gone
ls google-play-service-account.json 2>&1 | grep "No such file" && echo "✅ Deleted"
```

**Note**: You can always recreate the key from Cloud Shell if needed.

## 📋 Quick Checklist

- [ ] Key created in Cloud Shell ✅ (Done)
- [ ] Key transferred to Gitpod workspace
- [ ] File verified as valid JSON
- [ ] File confirmed in .gitignore
- [ ] Uploaded to GitHub Secrets
- [ ] Uploaded to Codemagic (if applicable)
- [ ] Uploaded to EAS (if applicable)
- [ ] Local file deleted (optional)
- [ ] Test build triggered

## 🆘 Troubleshooting

### Can't download from Cloud Shell
**Solution**: Use Option 2 (copy/paste content) or Option 4 (direct upload)

### File shows 0 bytes in Gitpod
**Solution**: The file wasn't transferred. Use one of the transfer options above.

### "Invalid JSON" error
**Solution**: File may be corrupted during transfer. Try again or recreate in Gitpod.

### Git wants to commit the file
**Solution**: File not in .gitignore. Run:
```bash
echo "google-play-service-account.json" >> .gitignore
git reset HEAD google-play-service-account.json
```

## 📞 Support

If you need help:
1. Check file exists: `ls -lh google-play-service-account.json`
2. Check file content: `head -c 100 google-play-service-account.json`
3. Check git status: `git status`

---

**Key ID**: 9b75f76406c0603b7b94e983877c2d6ccc7a52c7
**Created**: 2024-12-30
**Location**: Cloud Shell → Needs transfer to Gitpod
