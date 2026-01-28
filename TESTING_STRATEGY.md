# Security Fixes Testing Strategy
## Africa Railways Project

This document provides a comprehensive testing approach to validate that security fixes don't break functionality.

---

## Phase 1: Unit Tests

### 1.1 Input Validation Tests
**File:** `tests/input-validation.test.js`

Test all validation functions:
- `validatePhoneNumber()` - Test E.164 format validation
- `validateOTPCode()` - Test 6-digit code validation
- `validateAmount()` - Test amount range validation
- `validateUUID()` - Test UUID format validation
- `validateMetadata()` - Test metadata structure validation

```javascript
// Example test
test('validatePhoneNumber accepts valid numbers', () => {
  expect(validatePhoneNumber('+256701234567')).toBe(true);
  expect(validatePhoneNumber('+1234567890')).toBe(true);
  expect(validatePhoneNumber('invalid')).toBe(false);
});
```

### 1.2 Rate Limiting Tests
**File:** `tests/rate-limiting.test.js`

```javascript
test('rate limiting blocks after max requests', () => {
  for (let i = 0; i < 10; i++) {
    expect(checkRateLimit('test-ip')).toBe(true);
  }
  expect(checkRateLimit('test-ip')).toBe(false); // 11th request blocked
});
```

### 1.3 CORS Tests
**File:** `tests/cors.test.js`

```javascript
test('CORS only allows whitelisted origins', () => {
  // Test whitelisted origin
  // Test non-whitelisted origin
  // Test missing origin
});
```

---

## Phase 2: Integration Tests

### 2.1 Webhook Security Tests
**File:** `tests/webhook-security.test.js`

```javascript
describe('Webhook Security', () => {
  test('rejects webhook with invalid signature', async () => {
    const response = await request(app)
      .post('/api/webhooks/sentinel-pay')
      .set('verif-hash', 'invalid-hash')
      .send(testPayload);
    
    expect(response.status).toBe(401);
  });

  test('accepts webhook with valid signature', async () => {
    const response = await request(app)
      .post('/api/webhooks/sentinel-pay')
      .set('verif-hash', process.env.PAYMENT_SECRET_HASH)
      .send(testPayload);
    
    expect(response.status).toBe(200);
  });

  test('rejects oversized payloads', async () => {
    const largePayload = { data: 'x'.repeat(11000) };
    const response = await request(app)
      .post('/api/webhooks/sentinel-pay')
      .send(largePayload);
    
    expect(response.status).toBe(413); // Payload Too Large
  });
});
```

### 2.2 API Endpoint Tests
**File:** `tests/api-endpoints.test.js`

```javascript
describe('/api/send-otp', () => {
  test('rate limits OTP requests', async () => {
    for (let i = 0; i < 3; i++) {
      const response = await request(app)
        .post('/api/send-otp')
        .send({ phone: '+256701234567' });
      expect([200, 429]).toContain(response.status);
    }
  });

  test('validates phone number format', async () => {
    const response = await request(app)
      .post('/api/send-otp')
      .send({ phone: 'invalid-phone' });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Invalid phone');
  });

  test('rejects missing phone number', async () => {
    const response = await request(app)
      .post('/api/send-otp')
      .send({});
    
    expect(response.status).toBe(400);
  });
});

describe('/api/verify-otp', () => {
  test('validates OTP code format', async () => {
    const response = await request(app)
      .post('/api/verify-otp')
      .send({ phone: '+256701234567', code: 'abc' });
    
    expect(response.status).toBe(400);
  });

  test('enforces attempt limits', async () => {
    for (let i = 0; i < 4; i++) {
      await request(app)
        .post('/api/verify-otp')
        .send({ phone: '+256701234567', code: '000000' });
    }
    
    // 4th attempt should fail with "too many attempts"
  });
});

describe('/api/stripe/create-payment-intent', () => {
  test('validates amount range', async () => {
    const response = await request(app)
      .post('/api/stripe/create-payment-intent')
      .send({ amount: 10 }); // Below minimum
    
    expect(response.status).toBe(400);
  });

  test('sanitizes metadata', async () => {
    const response = await request(app)
      .post('/api/stripe/create-payment-intent')
      .send({
        amount: 1000,
        metadata: { from: '<script>alert(1)</script>' }
      });
    
    // Should sanitize the XSS attempt
    expect(response.status).toBe(200);
  });
});
```

### 2.3 Telegram Bot Security Tests
**File:** `tests/telegram-bot-security.test.js`

```javascript
describe('Telegram Bot Admin Endpoints', () => {
  test('requires admin key for config changes', async () => {
    const response = await request(botApp)
      .post('/api/config')
      .send({ botToken: 'token123' });
    
    expect(response.status).toBe(403);
  });

  test('accepts requests with valid admin key', async () => {
    const response = await request(botApp)
      .post('/api/config')
      .send({
        botToken: 'valid_token_123',
        adminKey: process.env.ADMIN_KEY
      });
    
    expect(response.status).toBeOneOf([200, 400]); // Valid format check
  });

  test('rate limits config endpoints', async () => {
    for (let i = 0; i < 6; i++) {
      await request(botApp)
        .post('/api/config')
        .send({ botToken: 'token', adminKey: process.env.ADMIN_KEY });
    }
    
    const response = await request(botApp)
      .post('/api/config')
      .send({ botToken: 'token', adminKey: process.env.ADMIN_KEY });
    
    expect(response.status).toBe(429);
  });
});
```

---

## Phase 3: Security Scanning Tests

### 3.1 Dependency Vulnerability Scan
```bash
npm audit --all
npm audit fix --force (if needed)
```

### 3.2 Secret Scanning Pre-check
```bash
# Run pre-commit hook
node .git-hooks/pre-commit-secrets.js
```

### 3.3 Code Scanning
```bash
# ESLint security rules
npx eslint . --ext .js,.jsx

# Check for console.log statements (shouldn't log secrets)
grep -r "console.log.*process\.env" . --include="*.js"
```

---

## Phase 4: End-to-End Tests

### 4.1 OTP Flow Test
```javascript
describe('OTP Authentication Flow', () => {
  test('complete OTP flow works', async () => {
    // 1. Request OTP
    const sendResponse = await request(app)
      .post('/api/send-otp')
      .send({ phone: '+256701234567', method: 'sms' });
    expect(sendResponse.status).toBe(200);

    // 2. Get generated OTP (in test, we'd retrieve from mock)
    const otp = getGeneratedOtp('+256701234567');

    // 3. Verify OTP
    const verifyResponse = await request(app)
      .post('/api/verify-otp')
      .send({ phone: '+256701234567', code: otp });
    expect(verifyResponse.status).toBe(200);
    expect(verifyResponse.body.wallet).toBeDefined();

    // 4. Verify wallet generation is correct
    expect(verifyResponse.body.wallet).toMatch(/^0x[a-f0-9]{40}$/i);
  });
});
```

### 4.2 Payment Flow Test
```javascript
describe('Payment Integration', () => {
  test('payment intent creation flow', async () => {
    const response = await request(app)
      .post('/api/stripe/create-payment-intent')
      .send({
        amount: 2000,
        currency: 'usd',
        metadata: {
          from: 'Lusaka',
          to: 'Ndola',
          passengers: 2
        }
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('sessionId');
    expect(response.body).toHaveProperty('url');
  });
});
```

---

## Phase 5: Performance Tests

### 5.1 Load Testing
```bash
# Test rate limiting under load
npx autocannon http://localhost:3000/api/send-otp -c 50 -d 10

# Expected: Should see 429 responses after rate limit hits
```

### 5.2 Memory Leak Tests
```javascript
describe('Memory Usage', () => {
  test('rate limit store cleans up old entries', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Make many requests from different IPs
    for (let i = 0; i < 100; i++) {
      checkRateLimit(`ip-${i}`);
    }
    
    // Fast forward time (in test)
    advanceTimeBy(5 * 60 * 1000); // 5 minutes
    
    // Trigger cleanup
    triggerRateLimitCleanup();
    
    const finalMemory = process.memoryUsage().heapUsed;
    
    // Memory shouldn't grow indefinitely
    expect(finalMemory - initialMemory).toBeLessThan(1000000); // 1MB
  });
});
```

---

## Phase 6: Manual Testing Checklist

### Server Startup
- [ ] `npm install` completes without errors
- [ ] `node server.js` starts without "Fatal error"
- [ ] Server listens on port 3000
- [ ] Health check endpoint `/health` responds with 200
- [ ] CORS headers are present in responses

### Webhook Testing
- [ ] POST `/api/webhooks/sentinel-pay` with missing signature returns 401
- [ ] POST `/api/webhooks/sentinel-pay` with invalid signature returns 401
- [ ] POST `/api/webhooks/sentinel-pay` with valid signature and payload returns 200
- [ ] Large payloads are rejected (over 10kb)

### API Testing
- [ ] OTP endpoint rate limits after 3 requests/minute
- [ ] Invalid phone numbers are rejected
- [ ] Valid phone numbers pass validation
- [ ] Payment amounts under $0.50 are rejected
- [ ] Payment amounts over $10,000 are rejected
- [ ] Special characters in metadata are sanitized

### Telegram Bot Testing
- [ ] Bot API requires admin key
- [ ] Rate limiting works (5 requests per minute for config)
- [ ] Config file has restrictive permissions (0o600)
- [ ] Broadcast message sent to all channels successfully

---

## Running the Test Suite

### Setup
```bash
# Install test dependencies
npm install --save-dev jest supertest

# Copy .env.example to .env.test
cp .env.example .env.test
```

### Run Tests
```bash
# All tests
npm test

# Specific test file
npm test -- tests/input-validation.test.js

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

### Expected Results
- All unit tests pass ✓
- All integration tests pass ✓
- No security vulnerabilities in dependencies ✓
- No console logging of secrets ✓
- Rate limiting enforces limits ✓
- CORS properly restricts origins ✓

---

## Rollback Procedure

If tests fail and you need to rollback:

```bash
# Restore from git
git checkout HEAD -- server/webhook.js
git checkout HEAD -- telegram-bot/index.js
git checkout HEAD -- server.js

# Or revert the entire security commit
git revert <commit-hash>

# Restart server
npm install
node server.js
```

---

## Continuous Integration

### GitHub Actions Workflow
Add `.github/workflows/security-tests.yml`:

```yaml
name: Security & Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      - run: npm install
      - run: npm test
      - run: npm audit --audit-level=moderate
      - run: npm run lint
```

---

## Success Criteria

✅ All unit tests pass
✅ All integration tests pass
✅ No new security vulnerabilities found
✅ Rate limiting works correctly
✅ Input validation prevents injection attacks
✅ CORS properly restricts cross-origin requests
✅ Admin authentication protects sensitive endpoints
✅ Server starts without errors
✅ Performance is not degraded
✅ Memory doesn't leak over time

---

## Next Steps

1. Run test suite before deploying to production
2. Monitor logs for security errors in production
3. Regular security audits (monthly)
4. Keep dependencies updated
5. Review security fixes quarterly
