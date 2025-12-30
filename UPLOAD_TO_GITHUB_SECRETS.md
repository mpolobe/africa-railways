# Upload Service Account Key to GitHub Secrets

## ✅ File Ready

- **File**: `google-play-service-account.json`
- **Size**: 2.6 KB
- **Status**: Valid JSON, secured in .gitignore
- **Key ID**: 9b75f76406c0603b7b94e983877c2d6ccc7a52c7

## 📤 Upload to GitHub Secrets

### Method 1: Web Interface (Recommended)

1. **Copy the file content**:
   ```bash
   cat google-play-service-account.json
   ```
   
   Copy the entire output (including the curly braces).

2. **Go to GitHub Secrets**:
   - Navigate to: [https://github.com/mpolobe/africa-railways/settings/secrets/actions](https://github.com/mpolobe/africa-railways/settings/secrets/actions)
   - Or: Repository → Settings → Secrets and variables → Actions

3. **Create New Secret**:
   - Click: **New repository secret**
   - Name: `GOOGLE_PLAY_SERVICE_ACCOUNT`
   - Value: Paste the JSON content you copied
   - Click: **Add secret**

### Method 2: Using GitHub CLI (If Available)

```bash
# Install gh CLI (if not installed)
# See: https://cli.github.com/

# Authenticate
gh auth login

# Create secret
gh secret set GOOGLE_PLAY_SERVICE_ACCOUNT < google-play-service-account.json \
  --repo mpolobe/africa-railways

# Verify
gh secret list --repo mpolobe/africa-railways
```

### Method 3: Base64 Encoded (Alternative)

Some CI/CD systems prefer base64-encoded secrets:

```bash
# Get base64 encoded content
cat google-play-service-account.json | base64 -w 0
```

Copy the output and create secret:
- Name: `GOOGLE_PLAY_SERVICE_ACCOUNT_BASE64`
- Value: Paste the base64 string

## 🔍 Verify Secret Created

After creating the secret, verify it appears in the list:

1. Go to: [https://github.com/mpolobe/africa-railways/settings/secrets/actions](https://github.com/mpolobe/africa-railways/settings/secrets/actions)
2. You should see: `GOOGLE_PLAY_SERVICE_ACCOUNT`
3. Updated: (current timestamp)

## 🔧 Using the Secret in GitHub Actions

The secret is now available in your workflows:

```yaml
# .github/workflows/build-app.yml
jobs:
  build:
    steps:
      - name: Setup Google Play credentials
        run: |
          echo '${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT }}' > google-play-service-account.json
      
      - name: Deploy to Play Store
        env:
          GOOGLE_PLAY_SERVICE_ACCOUNT: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT }}
        run: |
          # Your deployment commands here
```

## 📋 Additional Secrets Needed

For complete Play Store deployment, you may also need:

### 1. Play Store Track
```
Name: PLAY_STORE_TRACK
Value: internal  # or: alpha, beta, production
```

### 2. Package Name
```
Name: ANDROID_PACKAGE_NAME
Value: com.mpolobe.africoin  # or com.mpolobe.railways
```

### 3. Service Account Email (Optional)
```
Name: GOOGLE_SERVICE_ACCOUNT_EMAIL
Value: africoin-wallet-deploy@gen-lang-client-0453426956.iam.gserviceaccount.com
```

## ✅ Checklist

- [ ] File content copied
- [ ] Navigated to GitHub Secrets page
- [ ] Created secret: `GOOGLE_PLAY_SERVICE_ACCOUNT`
- [ ] Verified secret appears in list
- [ ] (Optional) Created additional secrets
- [ ] Ready to test deployment

## 🚀 Next Steps

After uploading to GitHub Secrets:

1. **Test the secret** in a workflow
2. **Upload to Codemagic** (if using)
3. **Upload to EAS** (if using)
4. **Trigger a test build**

## 📚 Related Documentation

- **Codemagic Upload**: See `UPLOAD_TO_CODEMAGIC.md` (to be created)
- **EAS Upload**: See `UPLOAD_TO_EAS.md` (to be created)
- **Build Guide**: See `BUILD_GUIDE.md`

---

**Repository**: mpolobe/africa-railways
**Secret Name**: GOOGLE_PLAY_SERVICE_ACCOUNT
**Service Account**: africoin-wallet-deploy@gen-lang-client-0453426956.iam.gserviceaccount.com
**Created**: 2024-12-30
