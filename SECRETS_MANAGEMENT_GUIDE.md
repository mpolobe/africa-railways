# Environment Variables & Secrets Management Guide

## Overview

This guide documents how to securely manage environment variables and secrets in the Africa Railways project.

## Golden Rules

1. **NEVER commit secrets to Git** - Use `.env` files locally
2. **ALWAYS use `.env.example`** - Document expected variables without values
3. **ROTATE keys quarterly** - Even if not compromised
4. **USE environment managers** - Vercel Secrets, GitHub Secrets, HashiCorp Vault
5. **LOG without secrets** - Truncate sensitive data in logs

---

## Local Development Setup

### Step 1: Copy Example File

```bash
cp .env.example .env
```

### Step 2: Fill in Actual Values

Edit `.env` with your actual credentials:

```bash
# .env (LOCAL - NEVER COMMIT)
DATABASE_URL=postgresql://user:actual_password@localhost:5432/africa_railways
STRIPE_SECRET_KEY=sk_live_actual_key_here
TELEGRAM_BOT_TOKEN=actual_token_here
ADMIN_KEY=your_secret_admin_key
```

### Step 3: Verify .gitignore

Ensure `.env` files are ignored:

```bash
# Check if .env is already ignored
grep -E "^\.env" .gitignore

# Expected output:
# .env
# .env.*
```

### Step 4: Install Pre-commit Hook (Optional but Recommended)

```bash
# Copy hook
cp .git-hooks/pre-commit-secrets.js .git/hooks/pre-commit

# Make executable
chmod +x .git/hooks/pre-commit

# Test it
git add .env  # This should be blocked
```

---

## Production Deployment

### Step 1: Use Vercel Secrets

For deployments on Vercel:

```bash
# Add secrets via CLI
vercel env add DATABASE_URL
vercel env add STRIPE_SECRET_KEY
vercel env add TELEGRAM_BOT_TOKEN
vercel env add ADMIN_KEY

# Or via dashboard: Settings → Environment Variables
```

### Step 2: Use GitHub Secrets

For GitHub Actions CI/CD:

```bash
# Navigate to: Repository → Settings → Secrets and variables → Actions

# Add each secret:
- DATABASE_URL
- STRIPE_SECRET_KEY
- TELEGRAM_BOT_TOKEN
- ADMIN_KEY
```

### Step 3: Use in Workflows

```yaml
# .github/workflows/deploy.yml
name: Deploy
on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
    steps:
      - uses: actions/checkout@v3
      - name: Deploy
        run: npm run deploy
```

### Step 4: Docker Secrets

For Docker deployments:

```dockerfile
# Dockerfile
FROM node:20

# ❌ WRONG - exposes secret in image
# ENV STRIPE_SECRET_KEY=sk_live_xxx

# ✅ CORRECT - pass at runtime
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

CMD ["npm", "start"]
```

```bash
# Run with secrets
docker run \
  -e DATABASE_URL=$DATABASE_URL \
  -e STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY \
  -e TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN \
  -e ADMIN_KEY=$ADMIN_KEY \
  africa-railways:latest
```

---

## Environment Variable Types

### Database Credentials

```bash
# Format: postgresql://user:password@host:port/database
DATABASE_URL=postgresql://postgres:strong_password_here@db.example.com:5432/africa_railways

# Best Practice: Use managed database (Supabase, AWS RDS, etc.)
# These handle security updates automatically
```

**Rotation:** Every 6 months or on team changes

### API Keys (Third Party)

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...        # Never share
STRIPE_PUBLISHABLE_KEY=pk_live_...   # OK to expose in frontend

# OpenAI
OPENAI_API_KEY=sk-...

# Airtable
AIRTABLE_TOKEN=pat...

# Firebase
FIREBASE_API_KEY=...
```

**Rotation:** Quarterly or if compromised

### Internal Secrets

```bash
# Session signing
SESSION_SECRET=<64-char-random-string>

# Admin access
ADMIN_KEY=<32-char-random-string>

# Webhook verification
PAYMENT_SECRET_HASH=<32-char-random-string>
```

**Rotation:** Quarterly

**Generate using:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Feature Flags

```bash
# These are NOT secrets - safe to expose
NODE_ENV=production
LOG_LEVEL=info
FEATURE_BETA_ENABLED=true
```

---

## Secret Management Best Practices

### 1. Principle of Least Privilege

```bash
# ❌ DON'T - Use master credentials
DATABASE_URL=postgresql://master_admin:password@...

# ✅ DO - Create service account
DATABASE_URL=postgresql://app_service:limited_password@...
# This account only has SELECT, INSERT, UPDATE on needed tables
```

### 2. Secret Rotation

Create a rotation schedule:

```
January:  - Rotate STRIPE_SECRET_KEY
          - Rotate OPENAI_API_KEY
February: - Rotate DATABASE_URL password
          - Rotate JWT_SECRET
March:    - Rotate ADMIN_KEY
          - Rotate SESSION_SECRET
...etc
```

### 3. Logging

```javascript
// ❌ WRONG - Exposes secret in logs
console.log('API Key:', process.env.STRIPE_SECRET_KEY);

// ✅ CORRECT - Truncate sensitive data
const apiKey = process.env.STRIPE_SECRET_KEY;
const truncated = apiKey.slice(0, 4) + '***' + apiKey.slice(-4);
console.log('API Key:', truncated);

// ✅ BETTER - Don't log at all
console.log('Stripe initialized successfully');
```

### 4. Distribution

```bash
# ✅ For new team members:
1. Share via 1Password or LastPass
2. Rotate after they leave
3. Never share via email/Slack

# ✅ For deployments:
1. Use platform-native secret managers
2. Never hardcode in code
3. Audit who can access
```

---

## Detecting Secrets in Code

### Using TruffleHog

```bash
# Install
pip install truffleHog

# Scan repository
trufflehog filesystem . --json

# Scan git history
trufflehog git https://github.com/user/repo --json
```

### Using git-secrets

```bash
# Install
brew install git-secrets

# Configure
git secrets --install
git secrets --register-aws
git secrets --add 'stripe_secret_key'
git secrets --add 'ADMIN_KEY'

# Scan
git secrets --scan
```

### Using pre-commit framework

```bash
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
```

---

## If a Secret is Compromised

### Immediate Actions (Within 15 minutes)

1. **Revoke the secret** immediately
2. **Generate a new one** with highest priority
3. **Update all deployments** to use new secret
4. **Check logs** for unauthorized access
5. **Notify team** of incident

### Short-term (Within 24 hours)

```bash
# Example: Stripe key compromised
1. Go to Stripe Dashboard → Restricted API Keys
2. Revoke old key
3. Create new key
4. Update STRIPE_SECRET_KEY in:
   - Vercel Secrets
   - GitHub Secrets
   - Local .env files
5. Redeploy all applications
6. Monitor for suspicious charges
```

### Follow-up (Within 1 week)

1. Post-incident review
2. Audit who had access to the key
3. Update security policies
4. Implement detection improvements

---

## Environment Variable Checklist

- [ ] `.env` file created locally
- [ ] `.env` added to `.gitignore`
- [ ] `.env.example` has NO actual values
- [ ] All required variables documented in `.env.example`
- [ ] Pre-commit hook installed (optional)
- [ ] Vercel Secrets configured for production
- [ ] GitHub Secrets configured for CI/CD
- [ ] Team trained on secret management
- [ ] Secret rotation schedule created
- [ ] Compromise detection process documented
- [ ] Access audit completed
- [ ] Credentials manager (1Password/LastPass) setup

---

## Quick Reference Commands

```bash
# Generate random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Verify .env is ignored
git check-ignore .env

# Show all environment variables
env | sort

# Test if secret is committed
git log -p -S "sk_live_" | head -20

# Find largest file in repo (might be secrets)
find . -type f -size +1M | head -10
```

---

## Support

For questions:
1. Check `.env.example` for variable descriptions
2. Review this guide
3. Contact: security@africa-railways.com

For security incidents:
1. Do NOT commit the secret
2. Immediately contact security team
3. Follow the compromise procedure above

---

**Last Updated:** January 28, 2026  
**Version:** 1.0  
**Next Review:** April 28, 2026
