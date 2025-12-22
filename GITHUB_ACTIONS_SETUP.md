# 🤖 GitHub Actions CI/CD Setup

## 📋 Overview

This guide shows you how to set up automated builds for both Railways and Africoin apps using GitHub Actions.

---

## 🔐 Step 1: Set Up GitHub Secrets

### Required Secrets

You need to add these secrets to your GitHub repository:

| Secret Name | Value | Purpose |
|-------------|-------|---------|
| `EXPO_TOKEN` | `PU6XiaYTwUlDHY224UJecC_nxeLquM0mLCUDbi41` | Authenticate with Expo |
| `BACKEND_URL` | `https://africa-railways.vercel.app` | Backend API URL |
| `RAILWAYS_API_KEY` | Your Railways API key | Railways app authentication |
| `AFRICOIN_API_KEY` | Your Africoin API key | Africoin app authentication |

### How to Add Secrets

#### Option A: Using GitHub Web Interface (Recommended)

1. Go to: https://github.com/mpolobe/africa-railways
2. Click **Settings** (top menu)
3. Click **Secrets and variables** → **Actions** (left sidebar)
4. Click **New repository secret**
5. Add each secret:

```
Name: EXPO_TOKEN
Value: PU6XiaYTwUlDHY224UJecC_nxeLquM0mLCUDbi41
```

```
Name: BACKEND_URL
Value: https://africa-railways.vercel.app
```

```
Name: RAILWAYS_API_KEY
Value: [your-railways-api-key]
```

```
Name: AFRICOIN_API_KEY
Value: [your-africoin-api-key]
```

#### Option B: Using GitHub CLI

If you have GitHub CLI installed:

```bash
# Set EXPO_TOKEN
gh secret set EXPO_TOKEN \
  --body "PU6XiaYTwUlDHY224UJecC_nxeLquM0mLCUDbi41" \
  --repo mpolobe/africa-railways

# Set BACKEND_URL
gh secret set BACKEND_URL \
  --body "https://africa-railways.vercel.app" \
  --repo mpolobe/africa-railways

# Set RAILWAYS_API_KEY
gh secret set RAILWAYS_API_KEY \
  --body "your-railways-api-key" \
  --repo mpolobe/africa-railways

# Set AFRICOIN_API_KEY
gh secret set AFRICOIN_API_KEY \
  --body "your-africoin-api-key" \
  --repo mpolobe/africa-railways
```

---

## 🔧 Step 2: Verify Workflow Files

The following workflow files have been created:

### `.github/workflows/build-railways.yml`
- Builds Railways app on push to main/develop
- Builds on pull requests
- Can be triggered manually

### `.github/workflows/build-africoin.yml`
- Builds Africoin app on push to main/develop
- Builds on pull requests
- Can be triggered manually

---

## 🚀 Step 3: Trigger Builds

### Automatic Triggers

Builds will automatically run when:
- You push to `main` or `develop` branches
- Someone creates a pull request to `main`

### Manual Trigger

1. Go to: https://github.com/mpolobe/africa-railways/actions
2. Click on **Build Railways App** or **Build Africoin App**
3. Click **Run workflow** button
4. Select branch
5. Click **Run workflow**

---

## 📊 Workflow Details

### Build Railways App Workflow

```yaml
name: Build Railways App

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:  # Manual trigger

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js 18
      - Setup EAS CLI
      - Install dependencies
      - Build Railways app
      - Post build URL
```

### Build Africoin App Workflow

```yaml
name: Build Africoin App

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:  # Manual trigger

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js 18
      - Setup EAS CLI
      - Install dependencies
      - Build Africoin app
      - Post build URL
```

---

## 🔍 Monitoring Builds

### View Build Status

1. Go to: https://github.com/mpolobe/africa-railways/actions
2. Click on a workflow run to see details
3. Click on a job to see logs

### Build Badges

Add these to your README.md:

```markdown
![Build Railways](https://github.com/mpolobe/africa-railways/actions/workflows/build-railways.yml/badge.svg)
![Build Africoin](https://github.com/mpolobe/africa-railways/actions/workflows/build-africoin.yml/badge.svg)
```

---

## 📱 Downloading Builds

### From GitHub Actions

1. Go to: https://github.com/mpolobe/africa-railways/actions
2. Click on a completed workflow run
3. Look for the build URL in the logs
4. Click the URL to download the APK

### From Expo Dashboard

1. Go to: https://expo.dev/
2. Navigate to your project
3. Click on **Builds**
4. Download the APK

---

## 🔧 Advanced Configuration

### Build on Specific Branches Only

Edit `.github/workflows/build-railways.yml`:

```yaml
on:
  push:
    branches: 
      - main
      - develop
      - release/*  # Add release branches
```

### Build on Tag Push

```yaml
on:
  push:
    tags:
      - 'v*'  # Trigger on version tags (v1.0.0, v2.0.0, etc.)
```

### Scheduled Builds

```yaml
on:
  schedule:
    - cron: '0 0 * * 0'  # Every Sunday at midnight
```

### Build Both Apps in One Workflow

Create `.github/workflows/build-all.yml`:

```yaml
name: Build All Apps

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-railways:
    name: Build Railways
    runs-on: ubuntu-latest
    steps:
      # ... railways build steps

  build-africoin:
    name: Build Africoin
    runs-on: ubuntu-latest
    needs: build-railways  # Wait for railways to finish
    steps:
      # ... africoin build steps
```

---

## 🔐 Security Best Practices

### ✅ Do:
- Store all sensitive data in GitHub Secrets
- Use `secrets.EXPO_TOKEN` in workflows
- Limit workflow permissions
- Review workflow runs regularly
- Rotate tokens every 90 days

### ❌ Don't:
- Commit secrets to repository
- Echo secrets in logs
- Share secrets in PR comments
- Use secrets in public repositories without encryption

---

## 🐛 Troubleshooting

### Build Fails: "EXPO_TOKEN not found"

**Problem:** GitHub Actions can't find EXPO_TOKEN

**Solution:**
1. Go to repository Settings → Secrets
2. Verify EXPO_TOKEN is set
3. Check spelling matches exactly: `EXPO_TOKEN`
4. Re-run workflow

### Build Fails: "Authentication failed"

**Problem:** EXPO_TOKEN is invalid or expired

**Solution:**
1. Generate new token: `expo login` → `expo whoami --token`
2. Update GitHub secret with new token
3. Re-run workflow

### Build Fails: "EAS CLI not found"

**Problem:** EAS CLI not installed in workflow

**Solution:**
Check workflow has:
```yaml
- name: Setup EAS
  uses: expo/expo-github-action@v8
  with:
    eas-version: latest
    token: ${{ secrets.EXPO_TOKEN }}
```

### Build Succeeds but No APK

**Problem:** Build completes but can't find download link

**Solution:**
1. Check EAS dashboard: https://expo.dev/
2. Look for build in project builds list
3. Download from there

### Workflow Doesn't Trigger

**Problem:** Push to branch but workflow doesn't run

**Solution:**
1. Check branch name matches workflow trigger
2. Verify workflow file is in `.github/workflows/`
3. Check workflow file has correct YAML syntax
4. Look for errors in Actions tab

---

## 📊 Workflow Status Notifications

### Slack Notifications

Add to workflow:

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Build ${{ job.status }}'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Email Notifications

GitHub automatically sends email notifications for:
- Failed workflows (if you're watching the repo)
- Workflow runs you triggered

Configure in: https://github.com/settings/notifications

### Discord Notifications

```yaml
- name: Notify Discord
  if: always()
  uses: sarisia/actions-status-discord@v1
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    status: ${{ job.status }}
    title: "Build ${{ job.status }}"
```

---

## 🚀 Deployment Automation

### Auto-Submit to Play Store

Add to workflow after build:

```yaml
- name: Submit to Play Store
  if: github.ref == 'refs/heads/main'
  run: eas submit --platform android --profile railways --non-interactive
  env:
    EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

### Create GitHub Release

```yaml
- name: Create Release
  if: startsWith(github.ref, 'refs/tags/')
  uses: actions/create-release@v1
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    tag_name: ${{ github.ref }}
    release_name: Release ${{ github.ref }}
    body: |
      Download APKs:
      - Railways: [Download](build-url-here)
      - Africoin: [Download](build-url-here)
```

---

## 📈 Build Metrics

### Track Build Times

Add to workflow:

```yaml
- name: Start timer
  run: echo "START_TIME=$(date +%s)" >> $GITHUB_ENV

- name: Build app
  run: eas build --platform android --profile railways --non-interactive

- name: Calculate duration
  run: |
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    echo "Build took $DURATION seconds"
```

### Save Build Artifacts

```yaml
- name: Upload build artifact
  uses: actions/upload-artifact@v3
  with:
    name: railways-apk
    path: build/*.apk
    retention-days: 30
```

---

## 🔄 Workflow Examples

### Complete Production Workflow

```yaml
name: Production Build & Deploy

on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      
      - uses: expo/expo-github-action@v8
        with:
          token: ${{ secrets.EXPO_TOKEN }}
      
      - run: npm ci
      
      - name: Build Railways
        run: eas build --platform android --profile railways --non-interactive
      
      - name: Build Africoin
        run: eas build --platform android --profile africoin --non-interactive
      
      - name: Submit to Play Store
        run: |
          eas submit --platform android --profile railways --non-interactive
          eas submit --platform android --profile africoin --non-interactive
      
      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
```

---

## ✅ Setup Checklist

Before enabling GitHub Actions:

- [ ] All secrets added to GitHub repository
- [ ] EXPO_TOKEN is valid and not expired
- [ ] Workflow files are in `.github/workflows/`
- [ ] Workflow files have correct YAML syntax
- [ ] Branch names match workflow triggers
- [ ] EAS projects are configured correctly
- [ ] Test workflow with manual trigger first

---

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Expo GitHub Action](https://github.com/expo/expo-github-action)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

## 🆘 Getting Help

### Check Workflow Logs

1. Go to: https://github.com/mpolobe/africa-railways/actions
2. Click on failed workflow
3. Click on failed job
4. Read error messages

### Common Log Locations

- **Setup errors:** Check "Setup EAS" step
- **Build errors:** Check "Build App" step
- **Authentication errors:** Check EXPO_TOKEN secret

### Debug Mode

Enable debug logging:

1. Go to repository Settings → Secrets
2. Add secret: `ACTIONS_STEP_DEBUG` = `true`
3. Re-run workflow
4. Check logs for detailed output

---

**Your EXPO_TOKEN is ready to use!** 🎉

Next steps:
1. Add secrets to GitHub repository
2. Push code to trigger first build
3. Monitor build in Actions tab
