# Expo + S3 Deployment in Gitpod

This setup allows you to build Expo applications and deploy them to AWS S3 directly from Gitpod.

## Quick Start

1. **Open in Gitpod**: Click the Gitpod button or visit: 
   ```
   https://gitpod.io/#https://github.com/mpolobe/africa-railways
   ```

2. **Setup AWS S3**:
   ```bash
   chmod +x scripts/setup-s3-gitpod.sh
   ./scripts/setup-s3-gitpod.sh
   ```

3. **Login to Expo**:
   ```bash
   eas login
   ```

4. **Build and Deploy**:
   ```bash
   chmod +x scripts/deploy-build.sh
   ./scripts/deploy-build.sh
   ```

## What's Included

### Pre-installed Tools
- ✅ Node.js 18
- ✅ Java 17 (for Android builds)
- ✅ Android SDK
- ✅ EAS CLI
- ✅ Expo CLI
- ✅ AWS CLI v2
- ✅ AWS SAM CLI

### Available Ports
- `19000-19006`: Expo Metro Bundler
- `8081`: React Native Metro
- `3000`: React Development Server
- `8080`: Backend API Server
- `8082`: Frontend Dashboard

## Detailed Setup

### 1. AWS Configuration

#### Prerequisites
You need an AWS account with permissions to:
- Create S3 buckets
- Create IAM users/policies
- Upload files to S3

#### Get AWS Credentials
1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam)
2. Create a new user or use existing
3. Attach policy: `AmazonS3FullAccess` (or custom policy)
4. Create access keys
5. Save the Access Key ID and Secret Access Key

#### Run Setup Script
```bash
./scripts/setup-s3-gitpod.sh
```

The script will:
- ✅ Install/verify AWS CLI
- ✅ Configure AWS credentials
- ✅ Create S3 bucket with unique name
- ✅ Configure bucket policies (public read)
- ✅ Set up CORS
- ✅ Optionally create IAM user for CI/CD
- ✅ Test S3 access
- ✅ Save configuration to `.env.aws`

#### Manual AWS Configuration (Alternative)
```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (e.g., us-east-1)
# Enter output format (json)
```

### 2. Expo Configuration

#### Login to Expo
```bash
eas login
```

Or use environment variable:
```bash
export EXPO_TOKEN=your_expo_token_here
```

Get your token from: https://expo.dev/accounts/[username]/settings/access-tokens

#### Configure EAS Build
```bash
eas build:configure
```

This creates/updates `eas.json` with build configurations.

### 3. Building Apps

#### Option 1: Interactive Build Script
```bash
./scripts/deploy-build.sh
```

This will:
1. Ask which platform to build (Android/iOS/Both/Web)
2. Build the app using EAS
3. Upload to S3
4. Generate download URLs
5. Create deployment summary

#### Option 2: Manual Build Commands

**Android:**
```bash
eas build --platform android --local --output ./builds/android.apk
```

**iOS (requires macOS):**
```bash
eas build --platform ios --local --output ./builds/ios.ipa
```

**Web:**
```bash
expo export:web
```

#### Option 3: Makefile Commands
```bash
make eas-build      # Interactive menu
make eas-android    # Quick Android build
make eas-ios        # Quick iOS build (macOS only)
```

### 4. Deploying to S3

#### Automatic (via deploy-build.sh)
The deploy script automatically uploads builds to S3 after building.

#### Manual Upload
```bash
# Load configuration
source .env.aws

# Upload file
aws s3 cp ./builds/your-app.apk s3://$AWS_S3_BUCKET/builds/ --acl public-read

# Generate download URL (valid 7 days)
aws s3 presign s3://$AWS_S3_BUCKET/builds/your-app.apk --expires-in 604800
```

## Environment Variables

### AWS Configuration (.env.aws)
```bash
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
S3_BASE_URL=https://your-bucket.s3.us-east-1.amazonaws.com
```

### Expo Configuration
```bash
EXPO_TOKEN=your_expo_token
```

## Build Profiles

Edit `eas.json` to customize build profiles:

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

Build with specific profile:
```bash
eas build --platform android --profile preview
```

## Troubleshooting

### AWS CLI Not Found
```bash
# Reinstall AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf aws awscliv2.zip
```

### EAS Not Logged In
```bash
# Login interactively
eas login

# Or use token
export EXPO_TOKEN=your_token
eas whoami  # Verify
```

### Build Fails: Java Not Found
```bash
# Verify Java installation
java -version

# Should show Java 17
# If not, rebuild Gitpod workspace
```

### Build Fails: Android SDK Not Found
```bash
# Check Android SDK
echo $ANDROID_HOME
# Should show: /home/gitpod/android-sdk

# If not set:
export ANDROID_HOME=/home/gitpod/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

### S3 Upload Fails: Access Denied
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Reconfigure if needed
aws configure
```

### Build Takes Too Long
- Use cloud builds instead: Remove `--local` flag
- Builds on EAS servers are often faster
- Local builds in Gitpod can be slow due to resource limits

## GitHub Actions Integration

### Setup Secrets
Add these secrets to your GitHub repository:

1. Go to Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `EXPO_TOKEN`: Your Expo access token
   - `AWS_ACCESS_KEY_ID`: From setup script output
   - `AWS_SECRET_ACCESS_KEY`: From setup script output
   - `AWS_REGION`: Your AWS region (e.g., us-east-1)
   - `AWS_S3_BUCKET`: Your S3 bucket name

### Workflow Files
The repository includes workflows for:
- `.github/workflows/eas-build-local.yml`: EAS cloud builds
- `.github/workflows/self-hosted-build.yml`: Self-hosted runner builds

Builds will automatically deploy to S3 when configured.

## Cost Considerations

### Gitpod
- **Free Tier**: 50 hours/month
- **Paid Plans**: $9-39/month for more hours
- See: https://www.gitpod.io/pricing

### AWS S3
- **Storage**: ~$0.023/GB/month
- **Data Transfer**: First 100GB free/month
- **Requests**: Minimal cost for typical usage
- **Estimate**: ~$1-5/month for typical app builds

### EAS Builds
- **Free Tier**: 30 builds/month
- **Production**: $29/month (unlimited)
- **Priority**: $99/month (faster builds)
- See: https://expo.dev/pricing

### Total Estimated Cost
- **Development**: $0-10/month (using free tiers)
- **Production**: $30-50/month (paid plans)

## Best Practices

### Security
- ✅ Never commit AWS credentials to git
- ✅ Use IAM users with minimal permissions
- ✅ Rotate access keys regularly
- ✅ Use pre-signed URLs for temporary access
- ✅ Enable S3 bucket versioning

### Build Management
- ✅ Use semantic versioning
- ✅ Tag builds with git commit hash
- ✅ Keep build artifacts for 30 days
- ✅ Use lifecycle policies to auto-delete old builds
- ✅ Test builds before sharing with users

### Performance
- ✅ Use cloud builds for faster results
- ✅ Enable build caching
- ✅ Minimize dependencies
- ✅ Use appropriate build profiles
- ✅ Monitor build times

## Advanced Usage

### Custom Build Script
Create your own build script:

```bash
#!/bin/bash
# custom-build.sh

# Load config
source .env.aws

# Build
eas build --platform android --local --output ./builds/custom.apk

# Upload
aws s3 cp ./builds/custom.apk s3://$AWS_S3_BUCKET/custom/

# Generate URL
aws s3 presign s3://$AWS_S3_BUCKET/custom/custom.apk --expires-in 86400
```

### Automated Versioning
```bash
# Get version from package.json
VERSION=$(node -p "require('./package.json').version")

# Build with version in filename
eas build --platform android --local --output ./builds/app-v$VERSION.apk
```

### Slack Notifications
```bash
# After successful build
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"✅ New build available: '$URL'"}' \
  $SLACK_WEBHOOK_URL
```

### QR Code Generation
```bash
# Install qrencode
sudo apt-get install qrencode

# Generate QR code for download URL
qrencode -t UTF8 "$DOWNLOAD_URL"
```

## Useful Commands

### AWS S3
```bash
# List buckets
aws s3 ls

# List files in bucket
aws s3 ls s3://$AWS_S3_BUCKET/builds/

# Download file
aws s3 cp s3://$AWS_S3_BUCKET/builds/app.apk ./

# Delete file
aws s3 rm s3://$AWS_S3_BUCKET/builds/app.apk

# Sync directory
aws s3 sync ./builds/ s3://$AWS_S3_BUCKET/builds/
```

### EAS
```bash
# Check login status
eas whoami

# List builds
eas build:list

# View build details
eas build:view [build-id]

# Download build
eas build:download [build-id]

# Cancel build
eas build:cancel [build-id]
```

### Gitpod
```bash
# Open file in editor
gp open README.md

# Preview URL
gp url 3000

# Open preview
gp preview $(gp url 3000)

# Environment variables
gp env AWS_ACCESS_KEY_ID=xxx
```

## Resources

### Documentation
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [AWS S3 Docs](https://docs.aws.amazon.com/s3/)
- [Gitpod Docs](https://www.gitpod.io/docs)
- [Expo Docs](https://docs.expo.dev/)

### Tools
- [Expo Dashboard](https://expo.dev/)
- [AWS Console](https://console.aws.amazon.com/)
- [Gitpod Dashboard](https://gitpod.io/workspaces)

### Support
- [Expo Forums](https://forums.expo.dev/)
- [AWS Support](https://aws.amazon.com/support/)
- [Gitpod Community](https://www.gitpod.io/community)

## Quick Reference

```bash
# Setup
./scripts/setup-s3-gitpod.sh    # Configure AWS S3
eas login                        # Login to Expo

# Build
./scripts/deploy-build.sh        # Interactive build & deploy
make eas-android                 # Quick Android build
make eas-build                   # Build menu

# Deploy
aws s3 cp file.apk s3://bucket/  # Upload to S3
aws s3 presign s3://bucket/file  # Get download URL

# Status
eas whoami                       # Check Expo login
aws sts get-caller-identity      # Check AWS login
eas build:list                   # List builds
```

## Next Steps

1. ✅ Complete AWS S3 setup
2. ✅ Login to Expo
3. ✅ Run first build
4. ✅ Share download URL with testers
5. ✅ Set up GitHub Actions for CI/CD
6. ✅ Configure custom build profiles
7. ✅ Add automated testing

---

**Need Help?** Check the troubleshooting section or open an issue on GitHub.

**Last Updated**: 2024  
**Maintained by**: Africa Railways Team
