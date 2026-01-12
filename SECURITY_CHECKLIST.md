# Security Checklist - API Keys & Tokens

## 🚨 CRITICAL: You've Exposed Sensitive Credentials

This document tracks exposed credentials that need immediate revocation.

## Exposed Credentials (REVOKE IMMEDIATELY)

### 1. OpenAI API Key ❌
**Status:** EXPOSED - REVOKE NOW  
**Key:** `sk-proj-XXXXX...` (starts with sk-proj-YVu2KIPHB)  
**Exposed:** 2 times in chat messages  
**Action Required:**
1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Find and revoke the exposed key
3. Generate new key
4. Add to `.env` file only

### 2. Airtable API Token ❌
**Status:** EXPOSED - REVOKE NOW  
**Token:** `pata6xaTGje4BXgLo.XXXXX...`  
**Exposed:** 1 time in chat message  
**Action Required:**
1. Go to [https://airtable.com/account](https://airtable.com/account)
2. Find and revoke the exposed token
3. Generate new token
4. Add to `.env` file only

## ⚡ Immediate Actions

### Step 1: Revoke All Exposed Credentials (5 minutes)

```bash
# 1. Revoke OpenAI key
# Visit: https://platform.openai.com/api-keys
# Click "Revoke" on the exposed key

# 2. Revoke Airtable token
# Visit: https://airtable.com/account
# Click "Revoke" on the exposed token
```

### Step 2: Generate New Credentials (5 minutes)

```bash
# 1. Generate new OpenAI key
# Visit: https://platform.openai.com/api-keys
# Click "Create new secret key"
# Name: "Africa Railways - Production"
# Copy immediately

# 2. Generate new Airtable token
# Visit: https://airtable.com/create/tokens
# Name: "Africa Railways - Production"
# Scopes: data.records:read, data.records:write
# Copy immediately
```

### Step 3: Store Securely (2 minutes)

```bash
# Navigate to project
cd /workspaces/africa-railways

# Add to .env file (NEVER commit this)
cat >> .env << 'EOF'

# OpenAI API Key
OPENAI_API_KEY=sk-proj-YOUR_NEW_KEY_HERE

# Airtable API Token
AIRTABLE_API_KEY=patYOUR_NEW_TOKEN_HERE

EOF

# Verify .env is gitignored
grep "^\.env$" .gitignore
```

### Step 4: Verify Security (2 minutes)

```bash
# Check .env is NOT tracked by git
git status | grep .env
# Should show nothing or "nothing to commit"

# Check .env is in .gitignore
cat .gitignore | grep "^\.env$"
# Should show: .env

# Verify no secrets in git history
git log --all --full-history --source --pretty=format:"%H" -- .env
# Should show nothing (file never committed)
```

## 🛡️ Security Best Practices

### ✅ DO:
- Store API keys in `.env` file
- Add `.env` to `.gitignore`
- Use environment variables in code
- Rotate keys regularly (every 90 days)
- Set usage limits and alerts
- Use different keys for dev/staging/prod
- Monitor API usage daily

### ❌ DON'T:
- Commit API keys to git
- Share keys in chat/messages
- Hardcode keys in source code
- Post keys in documentation
- Use same key across environments
- Share keys via email/Slack
- Store keys in plain text files

## 🔐 Secure Configuration

### .env File Structure

```bash
# ============================================
# SENSITIVE CREDENTIALS - NEVER COMMIT
# ============================================

# OpenAI
OPENAI_API_KEY=sk-proj-your-key-here
OPENAI_ORG_ID=org-your-org-here

# Airtable
AIRTABLE_API_KEY=pat-your-token-here
AIRTABLE_INFRASTRUCTURE_BASE_ID=app-your-base-id
AIRTABLE_OPERATIONS_BASE_ID=app-your-base-id
AIRTABLE_SENTINEL_BASE_ID=app-your-base-id
AIRTABLE_FINANCIAL_BASE_ID=app-your-base-id

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Backend APIs
RAILWAYS_API_URL=https://africa-railways.vercel.app
RAILWAYS_API_KEY=your-api-key

# SMS Providers
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
AT_API_KEY=your-key
AT_USERNAME=your-username
```

### Loading Environment Variables

```javascript
// In Node.js scripts
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY not found in environment');
}
```

```bash
# In shell scripts
export $(cat .env | xargs)
echo "Using API key: ${OPENAI_API_KEY:0:10}..."
```

## 📊 Monitoring & Alerts

### Set Up Usage Limits

**OpenAI:**
1. Go to [Billing → Usage Limits](https://platform.openai.com/account/limits)
2. Set monthly budget: $50
3. Enable alerts at 75% and 90%

**Airtable:**
1. Go to [Account → Billing](https://airtable.com/account/billing)
2. Monitor API usage
3. Set up workspace limits

### Monitor Usage Daily

```bash
# Check OpenAI usage
# Visit: https://platform.openai.com/usage

# Check Airtable usage
# Visit: https://airtable.com/account/usage
```

## 🔄 Key Rotation Schedule

| Service | Frequency | Last Rotated | Next Rotation |
|---------|-----------|--------------|---------------|
| OpenAI | 90 days | - | - |
| Airtable | 90 days | - | - |
| Supabase | 90 days | - | - |
| Twilio | 90 days | - | - |

## 📝 Incident Response

If a key is exposed:

1. **Immediate (0-5 min):**
   - Revoke the exposed key
   - Generate new key
   - Update `.env` file

2. **Short-term (5-30 min):**
   - Check for unauthorized usage
   - Review billing/usage logs
   - Update all environments

3. **Follow-up (1-24 hours):**
   - Document the incident
   - Review how it happened
   - Implement preventive measures
   - Notify team if needed

## ✅ Security Verification Checklist

- [ ] All exposed keys revoked
- [ ] New keys generated
- [ ] Keys stored in `.env` file
- [ ] `.env` is in `.gitignore`
- [ ] No keys in git history
- [ ] Usage limits configured
- [ ] Billing alerts enabled
- [ ] Team trained on security practices
- [ ] Key rotation schedule set
- [ ] Monitoring dashboard set up

## 🆘 Support

If you need help:
- **OpenAI:** https://help.openai.com
- **Airtable:** https://support.airtable.com
- **Supabase:** https://supabase.com/support

## 📚 Resources

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [12 Factor App - Config](https://12factor.net/config)

---

**Last Updated:** 2026-01-12  
**Status:** 🚨 CRITICAL - Action Required  
**Priority:** P0 - Immediate
