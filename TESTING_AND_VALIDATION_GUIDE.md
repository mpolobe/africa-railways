# Testing & Validation Guide
## Ensuring Security Fixes Don't Break Functionality

This guide walks you through validating that all security fixes work correctly and don't break existing functionality.

---

## Quick Start (5 minutes)

### 1. Run the Quick Validation Script
```bash
# This performs 8 core security checks
npm run security:validate
```

**What it checks:**
- ✓ Server syntax is valid
- ✓ Security middleware is present
- ✓ CORS is properly restricted
- ✓ Rate limiting is implemented
- ✓ Input validation functions exist
- ✓ Environment documentation is complete
- ✓ Admin authentication is in place
- ✓ Webhook signatures are verified

### 2. Check for Dependency Vulnerabilities
```bash
npm run security:audit
```

### 3. Verify Server Starts
```bash
# Terminal 1: Start the server
node server.js

# Terminal 2: Check health endpoint
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "sentinel-webhook-server",
  "timestamp": "2026-01-28T12:00:00.000Z",
  "environment": "development"
}
```

---

## Phase-by-Phase Testing

### Phase 1: Syntax & Structure Validation (10 minutes)

```bash
# 1. Check for syntax errors
node --check server.js
node --check server/webhook.js
node --check telegram-bot/index.js

# 2. Check imports work
node -e "import('./server.js').catch(e => console.error(e))"

# 3. Validate JSON config files
node -e "console.log(JSON.parse(require('fs').readFileSync('.env.example', 'utf8')))"
```

### Phase 2: Endpoint Testing (15 minutes)

Start the server:
```bash
node server.js
```

In another terminal, test each endpoint:

#### Test OTP Endpoint
```bash
# 1. Send OTP (should succeed or be rate-limited)
curl -X POST http://localhost:3000/api/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+256701234567"}'

# Expected: {"success": true, "message": "...", "demo": true}

# 2. Verify OTP (should ask for code)
curl -X POST http://localhost:3000/api/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+256701234567", "code": "123456"}'

# Expected: {"success": false, "error": "Invalid OTP"}
```

#### Test Rate Limiting
```bash
# Make 4 rapid requests to same endpoint
for i in {1..4}; do
  curl -X POST http://localhost:3000/api/send-otp \
    -H "Content-Type: application/json" \
    -d '{"phone": "+256701234567"}' \
    2>/dev/null | grep -o "too many\|success" || echo "Error"
done

# Expected: 3 successes, then 1 "too many requests"
```

#### Test Input Validation
```bash
# Invalid phone number should be rejected
curl -X POST http://localhost:3000/api/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "invalid"}'

# Expected: 400 error with "Invalid phone number"

# Missing phone should be rejected
curl -X POST http://localhost:3000/api/send-otp \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: 400 error with "Invalid phone number"
```

#### Test CORS (if you have a frontend)
```bash
# From your frontend domain
curl -X OPTIONS http://localhost:3000/api/send-otp \
  -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Check response headers:
# Access-Control-Allow-Origin: should be set (or not if origin not whitelisted)
# Access-Control-Allow-Methods: GET, POST, OPTIONS
```

#### Test Webhook Security
```bash
# Without signature (should fail)
curl -X POST http://localhost:3000/api/webhooks/sentinel-pay \
  -H "Content-Type: application/json" \
  -d '{"data": {"status": "successful", "amount": 1000}}'

# Expected: 401 Unauthorized

# With valid signature (if configured)
curl -X POST http://localhost:3000/api/webhooks/sentinel-pay \
  -H "Content-Type: application/json" \
  -H "verif-hash: YOUR_SECRET_HASH" \
  -d '{"data": {"status": "successful", "amount": 1000}}'

# Expected: 200 OK or validation error
```

### Phase 3: Telegram Bot Testing (10 minutes)

```bash
# Start bot server
node telegram-bot/index.js

# Test without admin key (should be rejected)
curl -X POST http://localhost:3001/api/config \
  -H "Content-Type: application/json" \
  -d '{"botToken": "token123"}'

# Expected: 403 Forbidden

# Test with admin key
curl -X POST http://localhost:3001/api/config \
  -H "Content-Type: application/json" \
  -d '{"botToken": "token123", "adminKey": "YOUR_ADMIN_KEY"}'

# Expected: 200 OK or error about invalid token format
```

### Phase 4: Security Headers Verification (5 minutes)

```bash
# Check security headers are present
curl -I http://localhost:3000/health

# Expected headers:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# Strict-Transport-Security: ...
# Content-Security-Policy: ...
```

### Phase 5: Webhook Payload Size Limits (5 minutes)

```bash
# Create a 15MB payload
python3 << 'EOF'
import json
large_payload = {"data": "x" * (15 * 1024 * 1024)}
print(json.dumps(large_payload))
EOF > large.json

# Try to send it (should be rejected - 413 Payload Too Large)
curl -X POST http://localhost:3000/api/webhooks/sentinel-pay \
  -H "Content-Type: application/json" \
  -d @large.json

# Expected: 413 or 400 error
```

---

## Automated Testing with npm Scripts

### Available Commands

```bash
# Quick validation (checks structure)
npm run security:validate

# Check for vulnerable dependencies
npm run security:audit

# Fix fixable vulnerabilities
npm run security:fix

# Run both validation and audit
npm run test:security
```

### Expected Output

#### security:validate Output
```
🔒 Security Fixes Validation

==================================================

✓ Test 1: Checking server.js syntax...
✓ PASSED: Route syntax is correct

✓ Test 2: Checking security middleware...
  ✓ Main Server: Security middleware present
  ✓ Webhook Server: Security middleware present
  ✓ Telegram Bot: Security middleware present

✓ Test 3: Checking CORS configuration...
✓ PASSED: CORS is properly restricted (2/2 servers)

✓ Test 4: Checking rate limiting...
  ✓ Main server has rate limiting
  ✓ Webhook server has request size limits
✓ PASSED: Rate limiting implemented on 2 servers

✓ Test 5: Checking input validation...
  ✓ Found validatePhoneNumber
  ✓ Found validateOTPCode
  ✓ Found validateAmount
✓ PASSED: All validators implemented (3/3)

✓ Test 6: Checking environment documentation...
✓ PASSED: .env.example has security guidelines

✓ Test 7: Checking admin authentication...
✓ PASSED: Admin key authentication implemented

✓ Test 8: Checking webhook signature verification...
✓ PASSED: Webhook signature verification implemented

==================================================

📊 Validation Results:
   ✓ Passed: 8
   ❌ Failed: 0
   Total:   8

✅ All security fixes validated successfully!
```

#### security:audit Output
```
added 0 packages, and audited 45 packages in 2s

found 0 vulnerabilities
```

---

## Troubleshooting

### Issue: "Fatal error during initialization"

**Cause:** Syntax error in server files

**Fix:**
```bash
# Check syntax of each file
node --check server.js
node --check server/webhook.js
node --check telegram-bot/index.js

# Look for specific errors, e.g. "SyntaxError: Unexpected token"
```

### Issue: "Cannot find module 'helmet'"

**Cause:** Dependencies not installed

**Fix:**
```bash
npm install
```

### Issue: "CORS error when testing from frontend"

**Cause:** Your frontend domain isn't whitelisted

**Fix:**
```bash
# Set ALLOWED_ORIGINS in .env
echo "ALLOWED_ORIGINS=http://localhost:3001,https://yourdomain.com" >> .env
```

### Issue: "Rate limiting rejects all requests"

**Cause:** Rate limit threshold is too low or clock is skewed

**Fix:**
```bash
# Check rate limit values in code (should be 10+ requests per minute)
grep -n "checkRateLimit" server.js

# Verify system clock is correct
date
```

### Issue: "Webhook signature validation fails"

**Cause:** PAYMENT_SECRET_HASH not set or doesn't match sender

**Fix:**
```bash
# Verify secret hash is set
echo $PAYMENT_SECRET_HASH

# Should match the hash from Flutterwave/payment provider
# Get it from: https://dashboard.flutterwave.com/settings/webhooks
```

---

## Production Checklist

Before deploying to production, verify:

### Security
- [ ] `npm run security:audit` shows 0 vulnerabilities
- [ ] All environment variables are set in production environment
- [ ] PAYMENT_SECRET_HASH matches production webhook configuration
- [ ] ADMIN_KEY is a strong, random value
- [ ] Database URLs use TLS/SSL connections
- [ ] Sensitive data isn't logged (check logs for process.env leaks)

### Functionality
- [ ] `npm run security:validate` passes all 8 tests
- [ ] Server starts without errors: `node server.js`
- [ ] Health endpoint responds: `curl /health`
- [ ] All API endpoints return appropriate responses
- [ ] Webhooks verify signatures correctly
- [ ] Rate limiting blocks excess requests
- [ ] Input validation rejects invalid data

### Deployment
- [ ] Code is merged to main branch
- [ ] All tests pass in CI/CD pipeline
- [ ] Database migrations are applied
- [ ] Environment variables are configured
- [ ] Secrets are stored in secure secret manager (Vercel Secrets, GitHub Secrets, etc.)
- [ ] Monitoring is set up (Sentry, datadog, etc.)
- [ ] Rollback plan is documented

### Monitoring
- [ ] Error logs show no authentication failures
- [ ] Webhook processing completes successfully
- [ ] API response times are acceptable
- [ ] Database connections are healthy
- [ ] Memory usage is stable
- [ ] No rate limit false positives

---

## Rollback Procedure

If issues arise in production:

```bash
# 1. Stop the application
pm2 stop app

# 2. Revert security changes
git checkout HEAD~1 -- server.js server/webhook.js telegram-bot/index.js

# 3. Reinstall dependencies (in case package.json changed)
npm install

# 4. Restart
pm2 start app

# 5. Verify it's working
curl http://localhost:3000/health

# 6. Post-mortem: Figure out what broke
# Examine the specific code changes and add logging
```

---

## Success Metrics

✅ **All Tests Passing**
- `npm run security:validate` = 8/8 passed
- `npm run security:audit` = 0 vulnerabilities
- Manual endpoint tests all return expected results

✅ **No Regressions**
- Existing functionality works as before
- API response times haven't degraded significantly
- Memory usage is stable over time

✅ **Security Improvements**
- CORS is restricted to whitelisted origins
- Rate limiting prevents abuse
- Input validation prevents injection attacks
- Webhooks verify signatures
- Admin operations require authentication

---

## Next Steps

1. **Run validation** → `npm run security:validate`
2. **Check dependencies** → `npm run security:audit`
3. **Start server** → `node server.js`
4. **Test endpoints** → Use curl commands above
5. **Deploy** → Push to production with monitoring enabled
6. **Monitor** → Watch for errors in first 24 hours

For questions or issues, refer to `/SECURITY_FIXES_REPORT.md` and `/SECRETS_MANAGEMENT_GUIDE.md`.
