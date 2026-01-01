# 🔑 API Keys Setup Guide

## 🎉 Your Generated API Keys

```
🚂 RAILWAYS_API_KEY:
rw_34a9e08f44dadbfd0f376a76df6d5594763a0e4fa77b6f63

💰 AFRICOIN_API_KEY:
ac_606759e20b550edfc538388d6330a46e272f3b9644719ab1
```

⚠️ **IMPORTANT:** These keys are sensitive! Keep them secure.

---

## 📋 Setup Checklist

You need to add these keys to **THREE** places:

- [ ] GitHub Secrets (for mobile app builds)
- [ ] Vercel Environment Variables (for backend)
- [ ] EAS Secrets (optional, for additional security)

---

## 1️⃣ Add to GitHub Secrets

### Steps:

1. **Go to GitHub Secrets:**
   ```
   https://github.com/mpolobe/africa-railways/settings/secrets/actions
   ```

2. **Click "New repository secret"**

3. **Add Railways API Key:**
   - Name: `RAILWAYS_API_KEY`
   - Value: `rw_34a9e08f44dadbfd0f376a76df6d5594763a0e4fa77b6f63`
   - Click "Add secret"

4. **Add Africoin API Key:**
   - Click "New repository secret" again
   - Name: `AFRICOIN_API_KEY`
   - Value: `ac_606759e20b550edfc538388d6330a46e272f3b9644719ab1`
   - Click "Add secret"

### Verify:

```bash
# List all secrets (won't show values, just names)
gh secret list --repo mpolobe/africa-railways
```

Expected output:
```
EXPO_TOKEN           Updated 2024-XX-XX
RAILWAYS_API_KEY     Updated 2024-XX-XX
AFRICOIN_API_KEY     Updated 2024-XX-XX
```

---

## 2️⃣ Add to Vercel Environment Variables

### Steps:

1. **Go to Vercel Dashboard:**
   ```
   https://vercel.com/
   ```

2. **Select your project** (africa-railways)

3. **Go to Settings → Environment Variables**

4. **Add Railways API Key:**
   - Key: `RAILWAYS_API_KEY`
   - Value: `rw_34a9e08f44dadbfd0f376a76df6d5594763a0e4fa77b6f63`
   - Environment: Production, Preview, Development (select all)
   - Click "Save"

5. **Add Africoin API Key:**
   - Key: `AFRICOIN_API_KEY`
   - Value: `ac_606759e20b550edfc538388d6330a46e272f3b9644719ab1`
   - Environment: Production, Preview, Development (select all)
   - Click "Save"

6. **Redeploy your backend:**
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"
   - This ensures the new environment variables are loaded

---

## 3️⃣ Add to EAS Secrets (Optional)

If you want to reference these in your EAS builds:

```bash
# Add Railways API key
eas secret:create --scope project --name RAILWAYS_API_KEY --value "rw_34a9e08f44dadbfd0f376a76df6d5594763a0e4fa77b6f63" --force

# Add Africoin API key
eas secret:create --scope project --name AFRICOIN_API_KEY --value "ac_606759e20b550edfc538388d6330a46e272f3b9644719ab1" --force
```

---

## 🔍 How These Keys Work

### Mobile App Flow

```
1. App starts
   └─ Reads API key from app.config.js
   └─ API key was embedded during build

2. App makes API request
   └─ Includes: Authorization: Bearer rw_34a9e08f...
   └─ Includes: X-App-Variant: railways

3. Backend receives request
   └─ Validates API key
   └─ Returns appropriate data
```

### Backend Validation

Your backend should validate these keys:

```go
// backend/main.go
func apiKeyMiddleware(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        apiKey := r.Header.Get("Authorization")
        apiKey = strings.TrimPrefix(apiKey, "Bearer ")
        
        railwaysKey := os.Getenv("RAILWAYS_API_KEY")
        africoinKey := os.Getenv("AFRICOIN_API_KEY")
        
        if apiKey != railwaysKey && apiKey != africoinKey {
            http.Error(w, "Unauthorized", http.StatusUnauthorized)
            return
        }
        
        // Determine which app is calling
        isRailways := apiKey == railwaysKey
        ctx := context.WithValue(r.Context(), "app_variant", 
            map[bool]string{true: "railways", false: "africoin"}[isRailways])
        
        next(w, r.WithContext(ctx))
    }
}
```

---

## 🧪 Testing Your Setup

### Test Backend Validation

```bash
# Test Railways API key
curl -H "Authorization: Bearer rw_34a9e08f44dadbfd0f376a76df6d5594763a0e4fa77b6f63" \
     https://africa-railways.vercel.app/api/health

# Test Africoin API key
curl -H "Authorization: Bearer ac_606759e20b550edfc538388d6330a46e272f3b9644719ab1" \
     https://africa-railways.vercel.app/api/health

# Test invalid key (should fail)
curl -H "Authorization: Bearer invalid_key" \
     https://africa-railways.vercel.app/api/health
```

Expected responses:
- Valid keys: `200 OK` with response data
- Invalid key: `401 Unauthorized`

---

## 🔐 Security Best Practices

### ✅ Do:

1. **Keep keys secret** - Never commit to git
2. **Use different keys** - Railways and Africoin have different keys
3. **Rotate regularly** - Change keys every 90 days
4. **Monitor usage** - Track API requests
5. **Use HTTPS only** - Never send keys over HTTP

### ❌ Don't:

1. **Don't commit to git** - Never in source code
2. **Don't share publicly** - Not in chat, email, or forums
3. **Don't reuse keys** - Each app should have unique keys
4. **Don't hardcode** - Always use environment variables
5. **Don't log keys** - Never log API keys in backend

---

## 🔄 Key Rotation

When you need to rotate keys (every 90 days):

### 1. Generate New Keys

```bash
./generate-api-keys.sh
```

### 2. Update GitHub Secrets

```bash
gh secret set RAILWAYS_API_KEY --body "new-key" --repo mpolobe/africa-railways
gh secret set AFRICOIN_API_KEY --body "new-key" --repo mpolobe/africa-railways
```

### 3. Update Vercel Environment Variables

1. Go to Vercel dashboard
2. Update environment variables
3. Redeploy backend

### 4. Rebuild Mobile Apps

```bash
# Rebuild with new keys
eas build --platform android --profile railways
eas build --platform android --profile africoin
```

### 5. Deprecate Old Keys

- Keep old keys active for 7 days
- Monitor for apps using old keys
- Remove old keys after transition period

---

## 📊 Verification Checklist

After adding keys, verify:

- [ ] GitHub Secrets show all 3 secrets (EXPO_TOKEN, RAILWAYS_API_KEY, AFRICOIN_API_KEY)
- [ ] Vercel shows both API keys in environment variables
- [ ] Backend redeploy completed successfully
- [ ] Test API calls with curl return 200 OK
- [ ] Test with invalid key returns 401 Unauthorized
- [ ] Mobile app builds successfully
- [ ] Mobile app can connect to backend

---

## 🐛 Troubleshooting

### Issue: "Unauthorized" Error

**Cause:** API key mismatch between mobile and backend

**Fix:**
1. Check GitHub Secrets: `gh secret list`
2. Check Vercel environment variables
3. Ensure keys match exactly
4. Rebuild mobile apps
5. Redeploy backend

### Issue: Backend Can't Read Environment Variables

**Cause:** Environment variables not loaded

**Fix:**
1. Verify variables are set in Vercel
2. Redeploy backend
3. Check deployment logs
4. Test with: `console.log(process.env.RAILWAYS_API_KEY)`

### Issue: Mobile App Has No API Key

**Cause:** Key not embedded during build

**Fix:**
1. Verify GitHub Secret is set
2. Check eas.json references secret correctly
3. Rebuild app with: `eas build --clear-cache`

---

## 📝 Quick Reference

### Your API Keys

```bash
# Railways
RAILWAYS_API_KEY=rw_34a9e08f44dadbfd0f376a76df6d5594763a0e4fa77b6f63

# Africoin
AFRICOIN_API_KEY=ac_606759e20b550edfc538388d6330a46e272f3b9644719ab1
```

### Where to Add Them

| Location | Purpose | How to Add |
|----------|---------|------------|
| GitHub Secrets | Mobile app builds | Settings → Secrets → Actions |
| Vercel | Backend validation | Project → Settings → Environment Variables |
| EAS Secrets | Additional security | `eas secret:create` |

### Test Commands

```bash
# Test Railways key
curl -H "Authorization: Bearer rw_34a9e08f44dadbfd0f376a76df6d5594763a0e4fa77b6f63" \
     https://africa-railways.vercel.app/api/health

# Test Africoin key
curl -H "Authorization: Bearer ac_606759e20b550edfc538388d6330a46e272f3b9644719ab1" \
     https://africa-railways.vercel.app/api/health
```

---

## 🎯 Next Steps

After setting up API keys:

1. ✅ Add keys to GitHub Secrets
2. ✅ Add keys to Vercel
3. ✅ Redeploy backend
4. ✅ Test with curl
5. ✅ Rebuild mobile apps
6. ✅ Test mobile apps

Then proceed to: [TEST_BUILD.md](./TEST_BUILD.md)

---

## 🔗 Related Documentation

- [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md) - GitHub Secrets setup
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Complete setup guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - How authentication works

---

**Keep these keys secure!** 🔐

Never commit them to git or share them publicly.
