# Upload Service Account Key to Codemagic

## ✅ File Ready

- **File**: `google-play-service-account.json`
- **Size**: 2.6 KB
- **Status**: Valid JSON
- **Service Account**: africoin-wallet-deploy@gen-lang-client-0453426956.iam.gserviceaccount.com

## 📤 Upload to Codemagic

### Step 1: Get File Content

```bash
cat google-play-service-account.json
```

Copy the entire JSON output.

### Step 2: Navigate to Codemagic

1. Go to: [https://codemagic.io/apps](https://codemagic.io/apps)
2. Sign in with your account
3. Select your app (Africa Railways or Africoin Wallet)

### Step 3: Add Environment Variable

1. Click on your app
2. Go to: **Environment variables** (in the left sidebar)
3. Click: **Add variable**

### Step 4: Configure Variable

**Option A: As Secure File (Recommended)**

- **Variable name**: `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS`
- **Variable type**: **Secure file**
- **File content**: Paste the JSON content
- **Variable group**: (Optional) Create group like "Play Store Deployment"
- **Secure**: ✅ Checked

**Option B: As Text Variable**

- **Variable name**: `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS`
- **Variable type**: **Text**
- **Value**: Paste the JSON content
- **Secure**: ✅ Checked

### Step 5: Save

Click **Add** or **Save**

## 🔧 Using in codemagic.yaml

### Method 1: Secure File

```yaml
# codemagic.yaml
workflows:
  android-workflow:
    name: Android Build
    environment:
      groups:
        - play_store  # Your variable group name
      vars:
        PACKAGE_NAME: "com.mpolobe.africoin"
    scripts:
      - name: Setup Google Play credentials
        script: |
          echo $GCLOUD_SERVICE_ACCOUNT_CREDENTIALS | base64 --decode > $CM_BUILD_DIR/google-play-service-account.json
      
      - name: Deploy to Play Store
        script: |
          # Your deployment commands
          fastlane supply --json_key $CM_BUILD_DIR/google-play-service-account.json
```

### Method 2: Direct Use

```yaml
# codemagic.yaml
workflows:
  android-workflow:
    name: Android Build
    environment:
      groups:
        - play_store
    scripts:
      - name: Deploy to Play Store
        script: |
          echo "$GCLOUD_SERVICE_ACCOUNT_CREDENTIALS" > google-play-service-account.json
          # Use the file
          fastlane supply --json_key google-play-service-account.json
```

## 📋 Additional Codemagic Variables

For complete Play Store deployment:

### 1. Package Name
```
Name: PACKAGE_NAME
Value: com.mpolobe.africoin
Type: Text
Secure: No
```

### 2. Play Store Track
```
Name: PLAY_STORE_TRACK
Value: internal
Type: Text
Secure: No
```

### 3. Service Account Email (Optional)
```
Name: GOOGLE_SERVICE_ACCOUNT_EMAIL
Value: africoin-wallet-deploy@gen-lang-client-0453426956.iam.gserviceaccount.com
Type: Text
Secure: No
```

## 🔍 Verify Variable Created

After adding the variable:

1. Go to: **Environment variables**
2. You should see: `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS`
3. Type: Secure file or Text
4. Status: ✅ (green checkmark)

## 🚀 Test the Configuration

### Trigger a Build

1. Go to your app in Codemagic
2. Click: **Start new build**
3. Select workflow
4. Click: **Start build**

### Check Build Logs

Look for:
```
✓ Setting up Google Play credentials
✓ Credentials file created
✓ Deploying to Play Store
```

## 🔒 Security Best Practices

### Variable Groups

Create a variable group for Play Store credentials:

1. Go to: **Teams** → **Variable groups**
2. Click: **Add variable group**
3. Name: `play_store_deployment`
4. Add variables:
   - `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS`
   - `PACKAGE_NAME`
   - `PLAY_STORE_TRACK`

### Access Control

- ✅ Mark sensitive variables as **Secure**
- ✅ Use variable groups for organization
- ✅ Limit access to production credentials
- ✅ Rotate keys every 90 days

## 🆘 Troubleshooting

### "Variable not found"

**Solution**: 
1. Check variable name matches exactly
2. Verify variable is in the correct group
3. Ensure group is referenced in workflow

### "Invalid JSON"

**Solution**:
1. Verify JSON is valid: `cat google-play-service-account.json | jq .`
2. Check for extra spaces or newlines
3. Re-copy from source file

### "Permission denied"

**Solution**:
1. Verify service account has Play Store permissions
2. Check service account is enabled in GCP
3. Ensure key hasn't been revoked

### "File not found in build"

**Solution**:
```yaml
scripts:
  - name: Debug credentials
    script: |
      echo "Checking for credentials..."
      ls -la google-play-service-account.json || echo "File not found"
      cat google-play-service-account.json | jq . || echo "Invalid JSON"
```

## 📚 Related Documentation

- **Codemagic Docs**: [https://docs.codemagic.io/yaml-basic-configuration/configuring-environment-variables/](https://docs.codemagic.io/yaml-basic-configuration/configuring-environment-variables/)
- **Play Store Publishing**: [https://docs.codemagic.io/yaml-publishing/google-play/](https://docs.codemagic.io/yaml-publishing/google-play/)
- **Variable Groups**: [https://docs.codemagic.io/yaml-basic-configuration/environment-variable-groups/](https://docs.codemagic.io/yaml-basic-configuration/environment-variable-groups/)

## ✅ Checklist

- [ ] Logged into Codemagic
- [ ] Selected correct app
- [ ] Navigated to Environment variables
- [ ] Created variable: `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS`
- [ ] Marked as Secure
- [ ] Added to variable group (optional)
- [ ] Updated codemagic.yaml to use variable
- [ ] Triggered test build
- [ ] Verified build logs show credentials setup

## 🎯 Next Steps

After uploading to Codemagic:

1. ✅ Update `codemagic.yaml` workflow
2. ✅ Test build with Play Store deployment
3. ✅ Verify app appears in Play Console
4. ✅ Set up automated releases

---

**Platform**: Codemagic
**Variable Name**: GCLOUD_SERVICE_ACCOUNT_CREDENTIALS
**Service Account**: africoin-wallet-deploy@gen-lang-client-0453426956.iam.gserviceaccount.com
**Created**: 2024-12-30
