# 🔐 Railway Environment Variables - Automated Setup

## Overview

Automatically set all environment variables in Railway using a one-time script.

---

## 🎯 Two Methods Available

### Method 1: Automated Script (Recommended)
Use `railway-env-setup.sh` to set all variables at once from `.env.railway` file.

### Method 2: Manual Setup
Set variables one by one in Railway dashboard.

---

## 🚀 Method 1: Automated Setup (One Command)

### Step 1: Install Railway CLI

```bash
# Via npm
npm i -g @railway/cli

# Or via curl
curl -fsSL https://railway.app/install.sh | sh

# Or via Homebrew (Mac)
brew install railway
```

### Step 2: Login to Railway

```bash
railway login
```

This opens a browser window to authenticate.

### Step 3: Link to Your Project

```bash
cd /workspaces/africa-railways/dashboard
railway link
```

Select your Railway project (or create a new one).

### Step 4: Run the Setup Script

```bash
./railway-env-setup.sh
```

**That's it!** The script will:
- ✅ Read variables from `.env.railway`
- ✅ Set each variable in Railway
- ✅ Verify all variables are set

### Step 5: Verify Variables

```bash
railway variables
```

You should see:
```
RELAYER_PRIVATE_KEY=your_private_key_here
ALCHEMY_API_KEY=your_alchemy_key_here
PORT=8080
```

### Step 6: Deploy

```bash
railway up
```

---

## 📋 What's in .env.railway

The `.env.railway` file contains all your environment variables:

```bash
# Required Variables
RELAYER_PRIVATE_KEY=your_64_character_private_key_here
ALCHEMY_API_KEY=your_alchemy_api_key_here
PORT=8080

# Optional Variables
GAS_POLICY_ID=your_gas_policy_id
IPFS_API_KEY=your_pinata_api_key
```

**⚠️ Security Note:** `.env.railway` is in `.gitignore` and won't be committed to Git.

---

## 🔧 Method 2: Manual Setup (Alternative)

If you prefer to set variables manually:

### Via Railway Dashboard

1. Go to your project in Railway
2. Click "Variables" tab
3. Click "New Variable"
4. Add each variable:

```
Name: RELAYER_PRIVATE_KEY
Value: your_64_character_private_key_here

Name: ALCHEMY_API_KEY
Value: your_alchemy_api_key_here

Name: PORT
Value: 8080
```

### Via Railway CLI

```bash
railway variables set RELAYER_PRIVATE_KEY=your_private_key_here
railway variables set ALCHEMY_API_KEY=your_alchemy_key_here
railway variables set PORT=8080
```

---

## 🔄 Build-Time Environment Setup

The `railway-setup.sh` script runs during build to verify environment variables:

### What it does:

1. ✅ Checks if running on Railway
2. ✅ Verifies required variables are set
3. ✅ Validates private key format
4. ✅ Logs setup status

### When it runs:

- Automatically during Railway build
- Before `go build` command
- Defined in `railway.toml`:

```toml
[build]
buildCommand = "chmod +x railway-setup.sh && ./railway-setup.sh && go build -o occ-dashboard main.go"
```

---

## 📊 Complete Workflow

```
┌─────────────────────────────────────────┐
│  1. Create .env.railway file            │
│     (contains all variables)            │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  2. Run railway-env-setup.sh            │
│     (sets variables in Railway)         │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  3. Push to GitHub                      │
│     (triggers Railway build)            │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  4. Railway Build Process               │
│     - Runs railway-setup.sh             │
│     - Verifies variables                │
│     - Builds Go application             │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  5. Deployment                          │
│     - Starts ./occ-dashboard            │
│     - Auto-detects relayer address      │
│     - Connects to blockchain            │
└─────────────────────────────────────────┘
```

---

## ✅ Verification Steps

### 1. Check Variables are Set

```bash
railway variables
```

### 2. Check Build Logs

```bash
railway logs --deployment
```

Look for:
```
🚂 Railway Environment Setup
✅ Running on Railway environment: production
✅ Found: RELAYER_PRIVATE_KEY
✅ Found: ALCHEMY_API_KEY
✅ Found: PORT
✅ All required environment variables are set
```

### 3. Check Application Logs

```bash
railway logs
```

Look for:
```
🚂 Africa Railways OCC Dashboard Starting...
🔐 Auto-detected Relayer Address: 0xYourAddressHere
✅ OCC Dashboard running on http://localhost:8080
```

### 4. Test Deployment

```bash
curl https://your-app.up.railway.app/api/health
```

---

## 🔐 Security Best Practices

### ✅ DO:

1. **Use .env.railway for local setup**
   - Keep it in `.gitignore`
   - Never commit to Git

2. **Set variables via Railway CLI or Dashboard**
   - Variables are encrypted at rest
   - Only accessible to your project

3. **Use different keys for dev/prod**
   - Development: Test keys
   - Production: Real keys

### ❌ DON'T:

1. **Never commit private keys to Git**
   - Not in `railway.toml`
   - Not in any config file
   - Not in documentation

2. **Never hardcode secrets**
   - Always use environment variables
   - Never in source code

3. **Never share .env.railway file**
   - Keep it local only
   - Don't send via email/chat

---

## 🛠️ Troubleshooting

### Script says "Railway CLI not found"

**Solution:**
```bash
npm i -g @railway/cli
railway login
```

### Script says "Not logged in to Railway"

**Solution:**
```bash
railway login
```

### Variables not showing in Railway

**Solution:**
```bash
# Re-run the setup script
./railway-env-setup.sh

# Or set manually
railway variables set KEY=value
```

### Build fails with "Missing environment variables"

**Solution:**
```bash
# Check variables are set
railway variables

# If missing, run setup again
./railway-env-setup.sh

# Redeploy
railway up
```

---

## 📋 Quick Reference

### Setup Commands

```bash
# Install CLI
npm i -g @railway/cli

# Login
railway login

# Link project
cd dashboard
railway link

# Set variables (automated)
./railway-env-setup.sh

# Verify
railway variables

# Deploy
railway up
```

### Files Created

- ✅ `railway-env-setup.sh` - One-time setup script
- ✅ `railway-setup.sh` - Build-time verification script
- ✅ `.env.railway` - Environment variables template
- ✅ `railway.toml` - Railway configuration

---

## 🎯 Summary

**Automated Setup:**
1. Create `.env.railway` with your variables
2. Run `./railway-env-setup.sh`
3. Deploy with `railway up`

**Manual Setup:**
1. Set variables in Railway dashboard
2. Deploy from GitHub

**Both methods work!** Choose what's easier for you.

---

## 📞 Need Help?

If you encounter issues:
1. Check Railway logs: `railway logs`
2. Verify variables: `railway variables`
3. Re-run setup: `./railway-env-setup.sh`
4. Check documentation: https://docs.railway.app

---

**Ready to deploy?** Run the setup script and you're done! 🚀
