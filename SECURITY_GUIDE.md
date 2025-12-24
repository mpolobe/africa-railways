# 🔐 Security Guide - API Keys & Secrets

## ⚠️ CRITICAL: Protecting Your Credentials

### 🚨 HIGHLY SENSITIVE INFORMATION

The following credentials are **CRITICAL** and must NEVER be committed to git:

```
❌ NEVER SHARE OR COMMIT:

1. Gas Policy ID: 2e114558-d9e8-4a3c-8290-ff9e6023f486
2. IPFS API Key: 787a512e.0a43e609db2a4913a861b6f0de5dd6e7
3. Alchemy API Key: 4-gxorN-H4MhqZWrskRQ-
4. Private Key: 0xe4cbd7171db39d6d336b6555e0e1eec1c2da2cbc5ddc4a90c4acf61904552c56
5. Relayer Address: 0x4C97260183BaD57AbF37f0119695f0607f2c3921
```

### ⚠️ Why This Matters

**If these keys are leaked:**
- ❌ Others could use your IPFS storage quota
- ❌ Others could drain your gas policy budget  
- ❌ Others could access your relayer wallet
- ❌ Financial losses could occur
- ❌ System could be compromised

### Immediate Steps if Exposed:

1. **Revoke the exposed key immediately**
2. **Generate a new key**
3. **Update all services using the old key**
4. **Never commit keys to git**
5. **Audit git history for exposed keys**

---

## 🔑 Managing API Keys Securely

### For Local Development

**Create `.env` file (NEVER commit this):**

```bash
# Create .env file
cp .env.example .env

# Edit with your actual keys
nano .env
```

**Add to `.gitignore`:**
```bash
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore
echo "config.json" >> .gitignore  # If it contains sensitive data
```

### ⚠️ Important: config.json Security

**For setup/documentation, config.json contains actual keys.**

**For production:**

1. **Option A: Use environment variables in config.json**
   ```json
   {
     "storage": {
       "ipfs_api_key": "${IPFS_API_KEY}"
     }
   }
   ```

2. **Option B: Load config from environment**
   ```go
   config.Storage.IPFSAPIKey = os.Getenv("IPFS_API_KEY")
   ```

3. **Option C: Use separate config files**
   ```bash
   config.example.json  # Commit this (no real keys)
   config.json          # Gitignore this (real keys)
   ```

**Verify config.json is gitignored:**
```bash
git check-ignore config.json
# Should output: config.json
```

### For GitHub Actions

**Add secrets to GitHub:**

1. Go to: https://github.com/mpolobe/africa-railways/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret:
   - `RAILWAYS_API_KEY`
   - `AFRICOIN_API_KEY`
   - `EXPO_TOKEN`
   - etc.

### For Vercel Deployment

**Add environment variables:**

1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. Add each variable

### For EAS Builds

**Add secrets to EAS:**

```bash
# Set secret for EAS
eas secret:create --scope project --name RAILWAYS_API_KEY --value "your_key_here"
eas secret:create --scope project --name AFRICOIN_API_KEY --value "your_key_here"
```

---

## 📋 Environment Variables Checklist

### Required for Railways App

```bash
RAILWAYS_API_KEY=xxx           # Railways API authentication
RAILWAYS_API_URL=https://...   # Backend URL
DATABASE_URL=postgresql://...   # Database connection
```

### Required for Africoin App

```bash
AFRICOIN_API_KEY=xxx           # Africoin API authentication
AFRICOIN_API_URL=https://...   # Backend URL
BLOCKCHAIN_RPC=https://...     # Blockchain RPC endpoint
```

### Required for Both

```bash
EXPO_TOKEN=xxx                 # For EAS builds
SUI_RPC_URL=https://...       # Sui blockchain
```

---

## 🔒 Best Practices

### DO ✅

- ✅ Use environment variables for all secrets
- ✅ Add `.env` to `.gitignore`
- ✅ Use different keys for dev/staging/production
- ✅ Rotate keys regularly
- ✅ Use secret management services
- ✅ Limit key permissions to minimum needed
- ✅ Monitor key usage

### DON'T ❌

- ❌ Commit secrets to git
- ❌ Share keys in chat/email
- ❌ Hardcode keys in source code
- ❌ Use same key across environments
- ❌ Share keys publicly
- ❌ Store keys in plain text files
- ❌ Include keys in screenshots

---

## 🛠️ Using Environment Variables

### In Backend (Go)

```go
import "os"

apiKey := os.Getenv("RAILWAYS_API_KEY")
if apiKey == "" {
    log.Fatal("RAILWAYS_API_KEY not set")
}
```

### In Mobile App (React Native)

```javascript
import Constants from 'expo-constants';

const apiKey = Constants.expoConfig?.extra?.RAILWAYS_API_KEY;
```

**Update app.config.js:**
```javascript
export default {
  expo: {
    extra: {
      RAILWAYS_API_KEY: process.env.RAILWAYS_API_KEY,
      AFRICOIN_API_KEY: process.env.AFRICOIN_API_KEY
    }
  }
};
```

### In GitHub Actions

```yaml
- name: Build
  env:
    RAILWAYS_API_KEY: ${{ secrets.RAILWAYS_API_KEY }}
  run: |
    npm run build
```

---

## 🔄 Key Rotation Process

### 1. Generate New Key

```bash
# Generate new API key from your service provider
# Example: Railways API dashboard
```

### 2. Update All Locations

- [ ] Local `.env` file
- [ ] GitHub Secrets
- [ ] Vercel Environment Variables
- [ ] EAS Secrets
- [ ] Team members' environments

### 3. Test New Key

```bash
# Test with new key
curl -H "Authorization: Bearer NEW_KEY" https://api.example.com/test
```

### 4. Revoke Old Key

```bash
# Revoke old key in service dashboard
```

### 5. Monitor

```bash
# Check logs for any failures
# Ensure all services using new key
```

---

## 🚨 If Key is Compromised

### Immediate Actions:

1. **Revoke the key immediately**
   - Go to service dashboard
   - Revoke/delete the exposed key

2. **Generate new key**
   - Create replacement key
   - Document the new key securely

3. **Update all services**
   - Update GitHub secrets
   - Update Vercel env vars
   - Update EAS secrets
   - Update local `.env`

4. **Audit usage**
   - Check logs for unauthorized access
   - Review recent API calls
   - Check for suspicious activity

5. **Notify team**
   - Inform team members
   - Update documentation
   - Review security practices

---

## 📝 Secure Storage Options

### For Development

- **1Password** - Team password manager
- **LastPass** - Password manager
- **Bitwarden** - Open source password manager

### For Production

- **AWS Secrets Manager** - AWS secret storage
- **Google Secret Manager** - GCP secret storage
- **HashiCorp Vault** - Enterprise secret management
- **Vercel Environment Variables** - For Vercel deployments
- **GitHub Secrets** - For GitHub Actions

---

## 🔍 Checking for Exposed Secrets

### Scan Repository

```bash
# Install git-secrets
brew install git-secrets

# Scan repository
git secrets --scan

# Scan history
git secrets --scan-history
```

### Use GitHub Secret Scanning

GitHub automatically scans for exposed secrets and will alert you.

---

## 📚 Additional Resources

- **OWASP Secrets Management Cheat Sheet**: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
- **GitHub Secret Scanning**: https://docs.github.com/en/code-security/secret-scanning
- **EAS Secrets**: https://docs.expo.dev/build-reference/variables/

---

## ✅ Security Checklist

- [ ] All secrets in environment variables
- [ ] `.env` in `.gitignore`
- [ ] No secrets in git history
- [ ] Different keys for each environment
- [ ] Keys stored in secure manager
- [ ] Team trained on security practices
- [ ] Regular key rotation schedule
- [ ] Monitoring for unauthorized access

---

## 🎯 Quick Fix for Exposed Key

**If you just exposed a key:**

```bash
# 1. Revoke the key immediately
# Go to your service dashboard and revoke it

# 2. Generate new key
# Create a new key in the service dashboard

# 3. Update GitHub secret
gh secret set RAILWAYS_API_KEY -b"NEW_KEY_HERE"

# 4. Update Vercel
vercel env add RAILWAYS_API_KEY production

# 5. Update EAS
eas secret:create --scope project --name RAILWAYS_API_KEY --value "NEW_KEY_HERE"

# 6. Update local .env
echo "RAILWAYS_API_KEY=NEW_KEY_HERE" >> .env

# 7. Test everything works
make test
```

---

**Remember: Security is not optional. Protect your keys!** 🔐
