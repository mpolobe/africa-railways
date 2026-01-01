# How to Fix the Missing EXPO_TOKEN Secret

## Problem
The GitHub Actions workflow "Build Both Apps" is failing because the `EXPO_TOKEN` secret is not configured in the repository settings.

**Error Message:**
```
❌ ERROR: EXPO_TOKEN secret is not set
Please add EXPO_TOKEN to repository secrets at:
https://github.com/mpolobe/africa-railways/settings/secrets/actions
```

## Why This Token Is Needed
The `EXPO_TOKEN` is required for:
- Authenticating with Expo Application Services (EAS)
- Building mobile applications in the cloud
- Publishing builds to the Expo dashboard
- Accessing your Expo account's build resources

Without this token, the CI/CD pipeline cannot:
- Build the Railways mobile app
- Build the Africoin wallet app
- Trigger automated builds on code changes

---

## Solution: Add EXPO_TOKEN to GitHub Secrets

### Step 1: Obtain Your Expo Access Token

**Option A: Using Expo CLI (Recommended)**

1. **Install Expo CLI globally** (if not already installed):
   ```bash
   npm install -g expo-cli
   ```

2. **Login to your Expo account:**
   ```bash
   npx expo login
   ```
   
   Enter your credentials when prompted:
   - Username: `mpolobe` (or your Expo username)
   - Password: [Your Expo password]

3. **Generate an access token:**
   ```bash
   npx expo whoami
   ```
   
   This will show your logged-in username.

4. **Create a personal access token:**
   ```bash
   npx eas login
   ```
   
   Then visit: https://expo.dev/accounts/mpolobe/settings/access-tokens
   
   Click "Create Token" and copy the generated token.

**Option B: Using Expo Dashboard (Web)**

1. Go to https://expo.dev/login
2. Log in with your credentials
3. Navigate to: https://expo.dev/accounts/[your-username]/settings/access-tokens
4. Click "Create Token"
5. Give it a name (e.g., "GitHub Actions - africa-railways")
6. Copy the generated token (you won't be able to see it again!)

---

### Step 2: Add the Token to GitHub Secrets

1. **Navigate to your repository settings:**
   ```
   https://github.com/mpolobe/africa-railways/settings/secrets/actions
   ```

2. **Click "New repository secret"**

3. **Configure the secret:**
   - **Name:** `EXPO_TOKEN`
   - **Value:** [Paste the token you copied in Step 1]

4. **Click "Add secret"**

---

### Step 3: Verify the Setup

#### Option A: Trigger Manual Workflow Run

1. Go to: https://github.com/mpolobe/africa-railways/actions
2. Click on "Build Both Apps" workflow
3. Click "Run workflow" dropdown
4. Select the `main` branch
5. Choose which apps to build:
   - ✅ Build Railways app
   - ✅ Build Africoin app
6. Click "Run workflow"

#### Option B: Push a Test Commit

Currently, automatic builds on push are disabled. To enable them:

1. Edit `.github/workflows/build-both-apps.yml`
2. Uncomment the `push` trigger section (lines 6-14)
3. Commit and push the change
4. The workflow will run automatically

---

## Verification Checklist

After adding the secret, verify:

- [ ] Secret appears in GitHub repository settings
- [ ] Secret name is exactly `EXPO_TOKEN` (case-sensitive)
- [ ] Workflow runs without "EXPO_TOKEN not set" error
- [ ] EAS setup step succeeds
- [ ] Build jobs can authenticate with Expo

---

## Troubleshooting

### Issue: "Invalid token" error

**Solution:**
1. Ensure you copied the entire token (no spaces)
2. Token may have expired - generate a new one
3. Check that the token has the correct permissions

### Issue: "Authentication failed" error

**Solution:**
1. Verify your Expo account is active
2. Check that the token belongs to the correct account (`mpolobe`)
3. Ensure the token hasn't been revoked

### Issue: "Project not found" error

**Solution:**
1. Verify the project exists in your Expo account
2. Check the `projectId` in `SmartphoneApp/app.config.js`
3. Ensure your Expo account has access to the project

---

## Security Best Practices

1. **Never commit tokens to the repository**
   - Always use GitHub Secrets
   - Never hardcode in workflow files
   - Don't share tokens in issues or pull requests

2. **Token rotation**
   - Rotate tokens periodically (e.g., every 90 days)
   - Revoke old tokens after rotation
   - Update GitHub secret with new token

3. **Access control**
   - Limit token permissions to what's needed
   - Use separate tokens for different environments
   - Monitor token usage in Expo dashboard

4. **Token storage**
   - Store backup securely (password manager)
   - Document token creation date
   - Keep track of token expiration

---

## Expected Behavior After Fix

Once the `EXPO_TOKEN` is added, you should see:

```
✅ All required secrets are present
🏗️ Checking out repository...
🏗️ Setting up Node.js...
🏗️ Setting up EAS...
📦 Installing dependencies...
🔍 Verifying configuration...
🚀 Building Railways App...
```

Build summaries will appear with links to:
- Railways build: https://expo.dev/accounts/mpolobe/projects/africa-railways/builds
- Africoin build: https://expo.dev/accounts/mpolobe/projects/africoin-wallet/builds

---

## Additional Resources

- [Expo Access Tokens Documentation](https://docs.expo.dev/accounts/programmatic-access/)
- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)

---

## Support

If you continue to experience issues after following this guide:

1. Check the workflow run logs for specific error messages
2. Verify your Expo account status at https://expo.dev/
3. Review the [BUILD_TROUBLESHOOTING.md](./BUILD_TROUBLESHOOTING.md) guide
4. Contact Expo support if the issue persists

---

**Last Updated:** January 2026  
**Applies To:** Build Both Apps workflow  
**Priority:** Critical - Blocks all mobile builds
