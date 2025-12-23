# GitHub Actions + S3 Deployment Guide

Complete guide for automated Expo builds with S3 deployment using GitHub Actions.

## Overview

This workflow automatically builds your Expo app and deploys it to AWS S3 whenever you:
- Push to `main` branch
- Create a release
- Manually trigger the workflow

## Quick Start

### 1. Setup GitHub Secrets

Add these secrets to your repository:

1. Go to: https://github.com/mpolobe/africa-railways/settings/secrets/actions
2. Click "New repository secret"
3. Add the following secrets:

```
EXPO_TOKEN=your_expo_token_here
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

### 2. Trigger a Build

#### Option A: Manual Trigger
1. Go to Actions tab
2. Select "Expo Build & Deploy to S3"
3. Click "Run workflow"
4. Choose platform (android/ios/all)
5. Choose profile (development/preview/production)
6. Click "Run workflow"

#### Option B: Push to Main
```bash
git add .
git commit -m "Update app"
git push origin main
```

#### Option C: Create a Release
```bash
git tag v1.0.0
git push origin v1.0.0
```

Or create via GitHub UI:
1. Go to Releases
2. Click "Create a new release"
3. Enter tag version (e.g., v1.0.0)
4. Click "Publish release"

## Workflow Features

### Automatic Triggers
- ✅ Push to `main` branch (mobile code changes only)
- ✅ Manual workflow dispatch
- ✅ Release creation

### Build Profiles
- **Development**: For testing with dev tools
- **Preview**: For internal testing (APK format)
- **Production**: For app store submission (AAB format)

### S3 Organization
```
s3://expo-builds-239732581050-20251223/
├── builds/
│   ├── android-v1.0.0-abc123-20241223-120000.apk
│   ├── android-latest.apk (always points to latest)
│   ├── ios-v1.0.0-abc123-20241223-120000.ipa
│   └── ios-latest.ipa (always points to latest)
└── manifests/
    ├── build-20241223-120000.json
    └── latest.json (always points to latest)
```

### Build Manifest
Each build creates a JSON manifest with:
- Version number
- Git commit hash
- Timestamp
- Build profile
- Download URLs
- File sizes
- GitHub run information

Example manifest:
```json
{
  "version": "1.0.0",
  "commit": "abc123",
  "timestamp": "20241223-120000",
  "profile": "production",
  "builds": {
    "android": {
      "key": "builds/android-v1.0.0-abc123-20241223-120000.apk",
      "url": "https://...",
      "size": "45M"
    }
  },
  "github": {
    "run_id": "123456",
    "run_number": "42",
    "actor": "username",
    "ref": "refs/heads/main"
  }
}
```

## Workflow Configuration

### Environment Variables

Edit in `.github/workflows/expo-s3-deploy.yml`:

```yaml
env:
  AWS_S3_BUCKET: expo-builds-239732581050-20251223
  AWS_REGION: eu-north-1
```

### Build Profiles

Edit in `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  }
}
```

### Trigger Paths

The workflow only triggers on changes to:
- `mobile/**`
- `src/**`
- `app.config.js`
- `package.json`

To modify, edit the `paths` section:

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'mobile/**'
      - 'src/**'
      - 'app.config.js'
      - 'package.json'
```

## Usage Examples

### Build Android Only
```bash
# Via GitHub UI
Actions → Expo Build & Deploy to S3 → Run workflow
Platform: android
Profile: production

# Via gh CLI
gh workflow run expo-s3-deploy.yml \
  -f platform=android \
  -f profile=production
```

### Build Both Platforms
```bash
gh workflow run expo-s3-deploy.yml \
  -f platform=all \
  -f profile=preview
```

### Build for Release
```bash
# Create and push tag
git tag v1.0.0
git push origin v1.0.0

# Or create release via GitHub UI
# Workflow will automatically build and attach artifacts
```

## Download URLs

### Pre-signed URLs
- Valid for 30 days
- No authentication required
- Automatically generated for each build

### Latest Build URLs
Always get the latest build:
```bash
# Android latest
aws s3 presign s3://expo-builds-239732581050-20251223/builds/android-latest.apk

# iOS latest
aws s3 presign s3://expo-builds-239732581050-20251223/builds/ios-latest.ipa
```

### Permanent URLs (with AWS credentials)
```
https://expo-builds-239732581050-20251223.s3.eu-north-1.amazonaws.com/builds/android-latest.apk
```

## Build Artifacts

### GitHub Artifacts
- Stored for 30 days
- Downloadable from Actions tab
- Includes build manifest

### S3 Storage
- Permanent storage
- Organized by version and timestamp
- Includes metadata

## Monitoring

### View Build Status
```bash
# List recent workflow runs
gh run list --workflow=expo-s3-deploy.yml

# View specific run
gh run view <run-id>

# Watch live
gh run watch <run-id>
```

### Check S3 Uploads
```bash
# List all builds
aws s3 ls s3://expo-builds-239732581050-20251223/builds/

# Get latest manifest
aws s3 cp s3://expo-builds-239732581050-20251223/manifests/latest.json -

# Download specific build
aws s3 cp s3://expo-builds-239732581050-20251223/builds/android-latest.apk ./
```

## Troubleshooting

### Build Fails: EAS Login
**Problem**: `eas login` fails

**Solution**:
1. Check `EXPO_TOKEN` secret is set correctly
2. Get new token from: https://expo.dev/accounts/[username]/settings/access-tokens
3. Update GitHub secret

### Build Fails: AWS Upload
**Problem**: S3 upload fails with access denied

**Solution**:
1. Check AWS credentials are correct
2. Verify IAM user has S3 permissions
3. Check bucket name is correct
4. Rotate credentials if exposed

### Build Takes Too Long
**Problem**: Build times out after 60 minutes

**Solution**:
1. Use EAS cloud builds (remove `--local` flag)
2. Optimize dependencies
3. Use build caching
4. Split into separate jobs

### Pre-signed URL Expired
**Problem**: Download link no longer works

**Solution**:
```bash
# Generate new pre-signed URL
aws s3 presign \
  s3://expo-builds-239732581050-20251223/builds/android-latest.apk \
  --expires-in 2592000
```

## Advanced Configuration

### Custom Build Names
```yaml
- name: Upload to S3
  run: |
    CUSTOM_NAME="myapp-${VERSION}-${PLATFORM}.apk"
    aws s3 cp ./artifacts/build.apk \
      "s3://${{ env.AWS_S3_BUCKET }}/builds/${CUSTOM_NAME}"
```

### Slack Notifications
```yaml
- name: Notify Slack
  if: success()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "✅ Build complete: ${{ steps.s3_upload.outputs.android_url }}"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Email Notifications
```yaml
- name: Send Email
  if: success()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: Build Complete
    body: Download: ${{ steps.s3_upload.outputs.android_url }}
    to: team@example.com
```

### Multiple S3 Buckets
```yaml
- name: Upload to Multiple Buckets
  run: |
    # Production bucket
    aws s3 cp ./artifacts/build.apk \
      s3://prod-bucket/builds/

    # Staging bucket
    aws s3 cp ./artifacts/build.apk \
      s3://staging-bucket/builds/

    # Backup bucket
    aws s3 cp ./artifacts/build.apk \
      s3://backup-bucket/builds/
```

### Conditional Builds
```yaml
- name: Build Android
  if: |
    github.event.inputs.platform == 'android' ||
    github.event.inputs.platform == 'all' ||
    (github.event_name == 'push' && contains(github.event.head_commit.message, '[android]'))
```

## Security Best Practices

### Secrets Management
- ✅ Use GitHub Secrets for credentials
- ✅ Rotate credentials every 90 days
- ✅ Use minimal IAM permissions
- ✅ Enable MFA on AWS account
- ❌ Never commit secrets to git
- ❌ Never log secrets in workflow

### S3 Security
```bash
# Enable versioning
aws s3api put-bucket-versioning \
  --bucket expo-builds-239732581050-20251223 \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket expo-builds-239732581050-20251223 \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Enable logging
aws s3api put-bucket-logging \
  --bucket expo-builds-239732581050-20251223 \
  --bucket-logging-status '{
    "LoggingEnabled": {
      "TargetBucket": "my-logs-bucket",
      "TargetPrefix": "expo-builds/"
    }
  }'
```

## Cost Optimization

### S3 Lifecycle Policy
```bash
# Auto-delete old builds after 90 days
aws s3api put-bucket-lifecycle-configuration \
  --bucket expo-builds-239732581050-20251223 \
  --lifecycle-configuration '{
    "Rules": [{
      "Id": "DeleteOldBuilds",
      "Status": "Enabled",
      "Prefix": "builds/",
      "Expiration": {
        "Days": 90
      }
    }]
  }'
```

### Intelligent Tiering
```bash
# Move old builds to cheaper storage
aws s3api put-bucket-intelligent-tiering-configuration \
  --bucket expo-builds-239732581050-20251223 \
  --id OldBuilds \
  --intelligent-tiering-configuration '{
    "Id": "OldBuilds",
    "Status": "Enabled",
    "Tierings": [{
      "Days": 30,
      "AccessTier": "ARCHIVE_ACCESS"
    }]
  }'
```

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS CLI Reference](https://docs.aws.amazon.com/cli/latest/reference/s3/)

## Support

Need help?
- [GitHub Issues](https://github.com/mpolobe/africa-railways/issues)
- [Expo Forums](https://forums.expo.dev/)
- [AWS Support](https://aws.amazon.com/support/)

---

**Last Updated**: 2024  
**Maintained by**: Africa Railways Team
