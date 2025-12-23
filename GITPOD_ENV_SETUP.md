# Gitpod Environment Variables Setup

Complete guide for managing environment variables in Gitpod workspaces.

## Quick Start

### Method 1: Persistent Environment Variables (Recommended)

Set variables that persist across all workspaces:

```bash
# Set EXPO_TOKEN
gp env EXPO_TOKEN="exp1b1a2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"

# Set AWS credentials
gp env AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
gp env AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
gp env AWS_DEFAULT_REGION="us-east-1"

# Verify
gp env
```

**Benefits:**
- ✅ Available in all workspaces
- ✅ Survives workspace deletion
- ✅ Secure (not visible in git)
- ✅ Easy to update

### Method 2: Workspace File

Create a `.gitpod.env` file (not committed to git):

```bash
# Copy example file
cp .gitpod.env.example .gitpod.env

# Edit with your values
nano .gitpod.env

# Load in current session
source .gitpod.env
```

**Benefits:**
- ✅ Easy to manage multiple variables
- ✅ Can be shared with team (via secure channel)
- ✅ Version controlled (example file)
- ✅ Quick to update

### Method 3: Gitpod Dashboard

Set variables via web interface:

1. Go to https://gitpod.io/variables
2. Click "New Variable"
3. Enter name, value, and scope
4. Save

**Benefits:**
- ✅ User-friendly interface
- ✅ Scope control (user/org/repo)
- ✅ Easy to manage
- ✅ Secure

## Detailed Setup

### EXPO_TOKEN

#### Get Your Token
1. Go to https://expo.dev/
2. Click your profile → Settings
3. Navigate to "Access Tokens"
4. Click "Create Token"
5. Name it "Gitpod" or "Development"
6. Copy the token (you won't see it again!)

#### Set in Gitpod
```bash
# Persistent (recommended)
gp env EXPO_TOKEN="your_token_here"

# Or in .gitpod.env file
echo "EXPO_TOKEN=your_token_here" >> .gitpod.env
source .gitpod.env

# Verify
eas whoami
```

### AWS Credentials

#### Get Your Credentials
1. Go to https://console.aws.amazon.com/iam
2. Click "Users" → Your user
3. Click "Security credentials"
4. Click "Create access key"
5. Download or copy the credentials

#### Set in Gitpod
```bash
# Persistent (recommended)
gp env AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
gp env AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
gp env AWS_DEFAULT_REGION="us-east-1"

# Or in .gitpod.env file
cat >> .gitpod.env << EOF
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_DEFAULT_REGION=us-east-1
EOF
source .gitpod.env

# Verify
aws sts get-caller-identity
```

### GitHub Token (Optional)

For automated releases and GitHub API access:

#### Get Your Token
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `workflow`
4. Generate and copy token

#### Set in Gitpod
```bash
gp env GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

## Environment Variable Scopes

### User Scope
Available in all your workspaces:
```bash
gp env EXPO_TOKEN="token" --scope user
```

### Organization Scope
Available to all org members:
```bash
gp env SHARED_API_KEY="key" --scope org/your-org
```

### Repository Scope
Available only for specific repo:
```bash
gp env REPO_SECRET="secret" --scope repo/owner/repo
```

## Managing Variables

### List All Variables
```bash
# Via CLI
gp env

# Via Dashboard
# Visit: https://gitpod.io/variables
```

### Update Variable
```bash
# Set new value (overwrites existing)
gp env EXPO_TOKEN="new_token"
```

### Delete Variable
```bash
# Via CLI
gp env -u EXPO_TOKEN

# Via Dashboard
# Visit: https://gitpod.io/variables → Delete
```

### Export to File
```bash
# Export current environment
env | grep -E "EXPO_|AWS_" > .gitpod.env.backup
```

## Security Best Practices

### ✅ DO

1. **Use `gp env` for sensitive data**
   ```bash
   gp env SECRET_KEY="sensitive_value"
   ```

2. **Add `.gitpod.env` to `.gitignore`**
   ```bash
   echo ".gitpod.env" >> .gitignore
   ```

3. **Use example files for documentation**
   ```bash
   cp .gitpod.env.example .gitpod.env
   # Edit .gitpod.env with real values
   ```

4. **Rotate credentials regularly**
   ```bash
   # Update every 90 days
   gp env EXPO_TOKEN="new_token"
   ```

5. **Use minimal permissions**
   - AWS: Create IAM user with only S3 access
   - GitHub: Use tokens with minimal scopes
   - Expo: Use project-specific tokens

### ❌ DON'T

1. **Never commit secrets to git**
   ```bash
   # BAD - visible in git history
   echo "EXPO_TOKEN=secret" >> .env
   git add .env
   ```

2. **Don't use environment variables in code**
   ```javascript
   // BAD - visible in compiled code
   const token = "exp1b1a2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0";
   
   // GOOD - use environment variable
   const token = process.env.EXPO_TOKEN;
   ```

3. **Don't share credentials in chat/email**
   - Use secure password managers
   - Use `gp env` to set directly

4. **Don't use production credentials in development**
   - Create separate dev/staging credentials
   - Use different AWS accounts

## Troubleshooting

### Variable Not Available

**Problem:** Variable set but not available in workspace

**Solution:**
```bash
# Check if variable is set
gp env | grep EXPO_TOKEN

# If not set, set it
gp env EXPO_TOKEN="your_token"

# Restart workspace or reload
source ~/.bashrc
```

### Variable Not Persisting

**Problem:** Variable disappears after workspace restart

**Solution:**
```bash
# Use gp env instead of export
gp env EXPO_TOKEN="token"  # ✅ Persists
export EXPO_TOKEN="token"  # ❌ Doesn't persist
```

### Wrong Scope

**Problem:** Variable not available in new workspace

**Solution:**
```bash
# Check scope
gp env | grep EXPO_TOKEN

# Set with correct scope
gp env EXPO_TOKEN="token" --scope user
```

### AWS Credentials Not Working

**Problem:** AWS CLI can't find credentials

**Solution:**
```bash
# Check if set
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY

# If not set
gp env AWS_ACCESS_KEY_ID="your_key"
gp env AWS_SECRET_ACCESS_KEY="your_secret"

# Or configure AWS CLI
aws configure
```

## Advanced Usage

### Conditional Variables

Set different values for different environments:

```bash
# In .gitpod.yml
tasks:
  - name: Setup
    command: |
      if [ "$GITPOD_WORKSPACE_CONTEXT_URL" == "https://github.com/owner/repo" ]; then
        export ENV="production"
      else
        export ENV="development"
      fi
```

### Load from Multiple Files

```bash
# Load from multiple env files
source .gitpod.env
source .gitpod.env.local
source .env.aws
```

### Encrypted Variables

Use git-crypt or similar:

```bash
# Install git-crypt
sudo apt-get install git-crypt

# Initialize
git-crypt init

# Add .gitpod.env to encryption
echo ".gitpod.env filter=git-crypt diff=git-crypt" >> .gitattributes

# Commit encrypted file
git add .gitpod.env .gitattributes
git commit -m "Add encrypted env file"
```

### Environment Variable Templates

Create templates for different scenarios:

```bash
# .gitpod.env.development
EXPO_TOKEN=dev_token
AWS_S3_BUCKET=dev-bucket

# .gitpod.env.staging
EXPO_TOKEN=staging_token
AWS_S3_BUCKET=staging-bucket

# .gitpod.env.production
EXPO_TOKEN=prod_token
AWS_S3_BUCKET=prod-bucket

# Load appropriate file
source .gitpod.env.development
```

## Integration with Scripts

### In Shell Scripts

```bash
#!/bin/bash

# Load environment variables
if [ -f .gitpod.env ]; then
    source .gitpod.env
fi

# Use variables
echo "Building with Expo token: ${EXPO_TOKEN:0:10}..."
eas build --platform android
```

### In Node.js

```javascript
// Load from .gitpod.env
require('dotenv').config({ path: '.gitpod.env' });

// Use variables
const expoToken = process.env.EXPO_TOKEN;
const awsBucket = process.env.AWS_S3_BUCKET;
```

### In Python

```python
import os
from dotenv import load_dotenv

# Load from .gitpod.env
load_dotenv('.gitpod.env')

# Use variables
expo_token = os.getenv('EXPO_TOKEN')
aws_bucket = os.getenv('AWS_S3_BUCKET')
```

## Quick Reference

### Common Commands

```bash
# Set variable
gp env KEY="value"

# Set with scope
gp env KEY="value" --scope user

# List all variables
gp env

# Delete variable
gp env -u KEY

# Load from file
source .gitpod.env

# Verify variable
echo $KEY

# Export to file
env > .env.backup
```

### Common Variables

```bash
# Expo
gp env EXPO_TOKEN="your_token"

# AWS
gp env AWS_ACCESS_KEY_ID="your_key"
gp env AWS_SECRET_ACCESS_KEY="your_secret"
gp env AWS_DEFAULT_REGION="us-east-1"

# GitHub
gp env GITHUB_TOKEN="your_token"

# Node
gp env NODE_ENV="development"
```

## Resources

- [Gitpod Environment Variables Docs](https://www.gitpod.io/docs/environment-variables)
- [Expo Access Tokens](https://docs.expo.dev/accounts/programmatic-access/)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

## Support

Need help? Check:
- [Gitpod Community](https://www.gitpod.io/community)
- [GitHub Issues](https://github.com/mpolobe/africa-railways/issues)
- [README-Gitpod.md](./README-Gitpod.md)

---

**Last Updated**: 2024  
**Maintained by**: Africa Railways Team
