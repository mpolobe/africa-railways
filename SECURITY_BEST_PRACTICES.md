# Security Best Practices

Complete guide for keeping your Africa Railways project secure.

## 🔒 Quick Security Checklist

- [ ] No credentials in code files
- [ ] No credentials in git history
- [ ] .gitignore configured properly
- [ ] EAS secrets configured
- [ ] GitHub Secrets configured
- [ ] AWS credentials rotated regularly
- [ ] MFA enabled on all accounts
- [ ] Security scanner runs regularly

## 🛡️ Security Scanner

### Run Security Scan

```bash
# Run comprehensive security scan
./scripts/check-token-security.sh

# Should output: ✅ No security issues found!
```

### What It Checks

- ✅ Expo tokens
- ✅ AWS credentials
- ✅ GitHub tokens
- ✅ Slack webhooks
- ✅ Private keys
- ✅ Generic secrets
- ✅ JWT tokens
- ✅ Git history
- ✅ Committed .env files
- ✅ .gitignore configuration

### Automated Scanning

Add to your workflow:

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run security scan
        run: ./scripts/check-token-security.sh
```

## 🔐 Credential Management

### ❌ NEVER Do This

```javascript
// ❌ Hardcoded credentials
const AWS_KEY = "AKIAIOSFODNN7EXAMPLE";
const AWS_SECRET = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";

// ❌ In configuration files
{
  "aws": {
    "accessKeyId": "AKIAIOSFODNN7EXAMPLE",
    "secretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
  }
}

// ❌ In eas.json
{
  "build": {
    "production": {
      "env": {
        "AWS_ACCESS_KEY_ID": "AKIAIOSFODNN7EXAMPLE"
      }
    }
  }
}
```

### ✅ DO This Instead

```javascript
// ✅ Use environment variables
const AWS_KEY = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET = process.env.AWS_SECRET_ACCESS_KEY;

// ✅ In eas.json (reference secrets)
{
  "build": {
    "production": {
      "env": {
        "AWS_ACCESS_KEY_ID": "@AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY": "@AWS_SECRET_ACCESS_KEY"
      }
    }
  }
}

// ✅ Set EAS secrets
// eas secret:create --scope project --name AWS_ACCESS_KEY_ID --value "key"
```

## 🔑 EAS Secrets

### Create Secrets

```bash
# Create project-scoped secret
eas secret:create --scope project --name SECRET_NAME --value "secret_value" --type string

# Example: AWS credentials
eas secret:create --scope project --name AWS_ACCESS_KEY_ID --value "AKIAIOSFODNN7EXAMPLE" --type string
eas secret:create --scope project --name AWS_SECRET_ACCESS_KEY --value "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" --type string
```

### List Secrets

```bash
# List all secrets
eas secret:list

# List project secrets
eas secret:list --scope project
```

### Delete Secrets

```bash
# Delete a secret
eas secret:delete --scope project --name SECRET_NAME
```

### Use in eas.json

```json
{
  "build": {
    "production": {
      "env": {
        "API_KEY": "@API_KEY",
        "AWS_ACCESS_KEY_ID": "@AWS_ACCESS_KEY_ID"
      }
    }
  }
}
```

## 🔐 GitHub Secrets

### Add Secrets

1. Go to: https://github.com/[owner]/[repo]/settings/secrets/actions
2. Click "New repository secret"
3. Enter name and value
4. Click "Add secret"

### Required Secrets

```
EXPO_TOKEN
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
AWS_S3_BUCKET
```

### Use in Workflows

```yaml
steps:
  - name: Build
    env:
      EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
      AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    run: eas build --platform android
```

## 🌍 Environment Variables

### Gitpod

```bash
# Set persistent variable
gp env SECRET_NAME="secret_value"

# Set for current session only
export SECRET_NAME="secret_value"

# Load from file
source .gitpod.env
```

### Local Development

```bash
# Create .env file (NOT committed)
cat > .env << EOF
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
EOF

# Load in shell
source .env

# Or use dotenv in Node.js
require('dotenv').config();
```

## 📝 .gitignore Configuration

### Essential Entries

```gitignore
# Environment variables
.env
.env.local
.env.*.local
.gitpod.env
.env.aws

# Credentials
*.pem
*.key
*.p12
*.pfx
*.keystore
credentials.json
service-account.json

# AWS
.aws/
aws-credentials

# Expo
.expo/
.expo-shared/

# Build artifacts
*.apk
*.ipa
*.aab

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
```

## 🔄 Credential Rotation

### When to Rotate

- ✅ Every 90 days (scheduled)
- ✅ When exposed publicly
- ✅ When employee leaves
- ✅ After security incident
- ✅ When changing environments

### How to Rotate

```bash
# Use automated script
./scripts/rotate-credentials.sh

# Or manually
aws iam update-access-key --access-key-id OLD_KEY --status Inactive
aws iam create-access-key --user-name USER_NAME
aws iam delete-access-key --access-key-id OLD_KEY
```

### After Rotation

1. Update EAS secrets
2. Update GitHub Secrets
3. Update Gitpod environment
4. Update local .env files
5. Test all services
6. Document rotation date

## 🔍 Git History Cleanup

### If Credentials Were Committed

```bash
# Remove file from history
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch path/to/file' \
  --prune-empty --tag-name-filter cat -- --all

# Force push (WARNING: Rewrites history)
git push origin --force --all
git push origin --force --tags

# Clean up local repo
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Alternative: BFG Repo-Cleaner

```bash
# Install BFG
brew install bfg  # macOS
# or download from: https://rtyley.github.io/bfg-repo-cleaner/

# Remove credentials
bfg --replace-text passwords.txt
bfg --delete-files credentials.json

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

## 🛠️ Security Tools

### git-secrets

Prevents committing secrets:

```bash
# Install
brew install git-secrets  # macOS
# or: https://github.com/awslabs/git-secrets

# Setup
cd /workspaces/africa-railways
git secrets --install
git secrets --register-aws

# Scan
git secrets --scan
git secrets --scan-history
```

### Pre-commit Hooks

```bash
# Install pre-commit
pip install pre-commit

# Create .pre-commit-config.yaml
cat > .pre-commit-config.yaml << EOF
repos:
  - repo: local
    hooks:
      - id: security-scan
        name: Security Scan
        entry: ./scripts/check-token-security.sh
        language: script
        pass_filenames: false
EOF

# Install hooks
pre-commit install

# Test
pre-commit run --all-files
```

## 🔐 AWS Security

### IAM Best Practices

```bash
# Create user with minimal permissions
aws iam create-user --user-name app-deploy

# Create policy
cat > policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "s3:PutObject",
      "s3:GetObject",
      "s3:ListBucket"
    ],
    "Resource": [
      "arn:aws:s3:::your-bucket",
      "arn:aws:s3:::your-bucket/*"
    ]
  }]
}
EOF

# Attach policy
aws iam put-user-policy --user-name app-deploy --policy-name S3Access --policy-document file://policy.json

# Create access key
aws iam create-access-key --user-name app-deploy
```

### Enable MFA

```bash
# Enable MFA for root account
# Go to: https://console.aws.amazon.com/iam
# Click: Security credentials → Assign MFA device

# Enable MFA for IAM users
aws iam enable-mfa-device \
  --user-name USER_NAME \
  --serial-number arn:aws:iam::ACCOUNT:mfa/USER_NAME \
  --authentication-code-1 CODE1 \
  --authentication-code-2 CODE2
```

### CloudTrail Monitoring

```bash
# Enable CloudTrail
aws cloudtrail create-trail \
  --name security-audit \
  --s3-bucket-name cloudtrail-logs

# Start logging
aws cloudtrail start-logging --name security-audit

# Check for suspicious activity
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=Username,AttributeValue=USER_NAME \
  --max-results 50
```

## 📊 Security Monitoring

### Regular Checks

```bash
# Weekly security scan
./scripts/check-token-security.sh

# Check AWS access
aws sts get-caller-identity

# Check Expo login
eas whoami

# Check GitHub access
gh auth status

# Review CloudTrail logs
aws cloudtrail lookup-events --max-results 20
```

### Automated Monitoring

```yaml
# .github/workflows/security-scan.yml
name: Weekly Security Scan

on:
  schedule:
    - cron: '0 0 * * 0'  # Every Sunday
  workflow_dispatch:

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Security Scan
        run: ./scripts/check-token-security.sh
      - name: Notify on failure
        if: failure()
        run: |
          # Send notification (Slack, email, etc.)
          echo "Security issues found!"
```

## 🆘 Incident Response

### If Credentials Are Exposed

1. **Immediate Actions:**
   ```bash
   # Rotate credentials
   ./scripts/rotate-credentials.sh
   
   # Check for unauthorized access
   aws cloudtrail lookup-events --max-results 100
   ```

2. **Investigation:**
   - Check CloudTrail logs
   - Review S3 bucket access
   - Check for unauthorized changes
   - Review billing for unexpected charges

3. **Remediation:**
   - Update all secrets
   - Remove from git history
   - Update .gitignore
   - Implement monitoring

4. **Documentation:**
   - Document incident
   - Record actions taken
   - Update procedures
   - Train team

### Emergency Contacts

- **AWS Support**: https://console.aws.amazon.com/support
- **AWS Security**: aws-security@amazon.com
- **Expo Support**: https://expo.dev/support

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [AWS Security Best Practices](https://aws.amazon.com/security/best-practices/)
- [GitHub Security](https://docs.github.com/en/code-security)
- [Expo Security](https://docs.expo.dev/guides/security/)

## 🔗 Quick Links

- **Security Scanner**: `./scripts/check-token-security.sh`
- **Credential Rotation**: `./scripts/rotate-credentials.sh`
- **Environment Setup**: `./scripts/setup-env.sh`
- **Incident Response**: `SECURITY_INCIDENT_RESPONSE.md`

---

**Remember:** Security is everyone's responsibility. When in doubt, ask!

**Last Updated**: 2024  
**Maintained by**: Africa Railways Team
