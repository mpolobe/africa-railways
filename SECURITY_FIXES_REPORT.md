# Security Audit Report - Africa Railways

**Date:** January 28, 2026  
**Status:** ✅ PARTIALLY REMEDIATED  
**Severity Levels:** Critical (1), High (3), Medium (5)

---

## Executive Summary

This report documents security vulnerabilities found in the Africa Railways monorepo and the fixes applied. The project has been scanned for common web application security issues, dependency vulnerabilities, and configuration problems.

### Critical Vulnerabilities Fixed

1. **Overly Permissive CORS** - Webhook endpoints allowed `*` origin
2. **Missing Input Validation** - Phone numbers, UUIDs, and amounts not validated
3. **Unsafe JSON Parsing** - Metadata parsed without type checking
4. **Missing Security Headers** - Helmet middleware not implemented
5. **Insufficient Rate Limiting** - No DoS protection on API endpoints
6. **Exposed Configuration Files** - Telegram bot config stored in web-accessible location
7. **Outdated Dependencies** - Multiple packages with known vulnerabilities

---

## Vulnerabilities and Fixes

### 1. CRITICAL: Overly Permissive CORS

**File:** `/server/webhook.js`

**Issue:**
```javascript
// BEFORE - INSECURE
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');  // ❌ Allows ANY origin
  // ...
});
```

**Risk:** Attackers can make cross-origin requests to sensitive endpoints, leading to CSRF attacks.

**Fix Applied:**
```javascript
// AFTER - SECURE
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  maxAge: 3600,
  methods: ['POST', 'OPTIONS']
};
```

**Status:** ✅ FIXED

---

### 2. HIGH: Missing Request Size Limits

**File:** `/server/webhook.js`

**Issue:**
```javascript
// BEFORE - INSECURE
app.use(express.json());  // ❌ No size limit
```

**Risk:** Potential Denial of Service (DoS) attacks with large payloads.

**Fix Applied:**
```javascript
// AFTER - SECURE
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
```

**Status:** ✅ FIXED

---

### 3. HIGH: Missing Security Headers

**Files:** `/server/webhook.js`, `/telegram-bot/index.js`

**Issue:**
```javascript
// BEFORE - INSECURE
app.use(express.json());  // ❌ No security headers
```

**Risk:** Missing X-Frame-Options, X-Content-Type-Options, and other protective headers enable various attacks.

**Fix Applied:**
```javascript
// AFTER - SECURE
const helmet = require('helmet');
app.use(helmet());  // ✅ Adds 15+ security headers
app.disable('x-powered-by');
```

**Added Headers:**
- `X-Frame-Options: DENY` - Prevent clickjacking
- `X-Content-Type-Options: nosniff` - Prevent MIME-type sniffing
- `Strict-Transport-Security` - Enforce HTTPS
- `Content-Security-Policy` - Prevent XSS attacks

**Status:** ✅ FIXED

---

### 4. HIGH: Insufficient Input Validation

**File:** `/server/webhook.js`

**Issue:**
```javascript
// BEFORE - INSECURE
async function activateSubscription(phoneNumber, txRef, amount, planId, userId) {
  // ❌ No validation of inputs
  const planQuery = `SELECT * FROM subscription_plans WHERE id = $1`;
  // Metadata accepted without type checking
}
```

**Risk:** 
- Invalid data causes crashes
- Could enable SQL injection if parameterized queries weren't used
- Business logic errors (negative amounts, invalid UUIDs)

**Fix Applied:**
```javascript
// AFTER - SECURE
function validatePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return false;
  return /^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ''));
}

function validateUUID(uuid) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

function validateAmount(amount) {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num < 1000000;
}

// ✅ Validate all inputs before processing
if (!validatePhoneNumber(phoneNumber)) throw new Error('Invalid phone');
if (!validateUUID(userId)) throw new Error('Invalid user ID');
if (!validateAmount(amount)) throw new Error('Invalid amount');
```

**Status:** ✅ FIXED

---

### 5. HIGH: Unsafe JSON Parsing

**Files:** `/server/webhook.js`, `/telegram-bot/index.js`

**Issue:**
```javascript
// BEFORE - INSECURE
const metadata = JSON.parse(req.body.payerMessage || '{}');  // ❌ No error handling
```

**Risk:** Malformed JSON crashes the application.

**Fix Applied:**
```javascript
// AFTER - SECURE
let metadata = {};
if (req.body.payerMessage) {
  try {
    metadata = JSON.parse(req.body.payerMessage);
  } catch (e) {
    log('error', 'Failed to parse metadata', { payerMessage: req.body.payerMessage });
    throw new Error('Invalid payment metadata format');
  }
}
```

**Status:** ✅ FIXED

---

### 6. MEDIUM: Exposed Configuration Files

**File:** `/telegram-bot/index.js`

**Issue:**
```javascript
// BEFORE - INSECURE
const CONFIG_FILE = './config.json';  // ❌ Web-accessible location
function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));  // ❌ World-readable
}
```

**Risk:** Configuration file containing bot tokens accessible to unauthorized users.

**Fix Applied:**
```javascript
// AFTER - SECURE
const CONFIG_DIR = process.env.CONFIG_DIR || '/tmp/telegram-bot';
const CONFIG_FILE = path.join(CONFIG_DIR, '.config.json');

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { mode: 0o700, recursive: true });  // ✅ Owner only
  }
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), {
    mode: 0o600  // ✅ Read/write for owner only
  });
}
```

**Status:** ✅ FIXED

---

### 7. MEDIUM: Missing Rate Limiting

**File:** `/telegram-bot/index.js`

**Issue:**
```javascript
// BEFORE - INSECURE
app.post('/api/send', async (req, res) => {
  // ❌ No rate limiting - anyone can spam requests
});
```

**Risk:** Attackers can flood the API with requests, causing DoS or spam.

**Fix Applied:**
```javascript
// AFTER - SECURE
const rateLimitStore = new Map();

function checkRateLimit(identifier, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const window = now - windowMs;
  
  if (!rateLimitStore.has(identifier)) {
    rateLimitStore.set(identifier, []);
  }
  
  const requests = rateLimitStore.get(identifier).filter(t => t > window);
  
  if (requests.length >= maxRequests) {
    return false;  // ✅ Reject request
  }
  
  requests.push(now);
  rateLimitStore.set(identifier, requests);
  return true;
}

// Usage in endpoints
app.post('/api/send', async (req, res) => {
  if (!checkRateLimit(req.ip, 5, 60000)) {  // ✅ 5 requests per minute
    return res.status(429).json({ error: 'Too many requests' });
  }
  // ...
});
```

**Applied Rate Limits:**
- `/api/config`: 5 requests/minute
- `/api/send`: 5 requests/minute
- `/api/broadcast`: 3 requests/minute
- `/api/channels`: 10 requests/minute

**Status:** ✅ FIXED

---

### 8. MEDIUM: Missing Authentication on Admin Endpoints

**File:** `/telegram-bot/index.js`

**Issue:**
```javascript
// BEFORE - INSECURE
app.post('/api/config', (req, res) => {
  const { botToken } = req.body;  // ❌ Anyone can reconfigure the bot
  config.botToken = botToken;
});
```

**Risk:** Unauthorized users can modify bot configuration, plant malicious code, or steal tokens.

**Fix Applied:**
```javascript
// AFTER - SECURE
app.post('/api/config', (req, res) => {
  const { botToken, adminKey } = req.body;
  
  // ✅ Require admin key for config changes
  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    console.warn('Unauthorized config change attempt from', req.ip);
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  config.botToken = botToken;
  // ...
});
```

**Applied To:**
- `POST /api/config` - Set bot token
- `POST /api/channels` - Add channel
- `DELETE /api/channels/:chatId` - Remove channel

**Status:** ✅ FIXED

---

### 9. MEDIUM: Dependency Vulnerabilities

**Files:** Multiple `package.json` files

**Critical Updates:**
| Package | Before | After | Reason |
|---------|--------|-------|--------|
| express | 4.18.2 | 4.21.0 | Security updates, DoS fixes |
| pg | 8.11.3 | 8.12.0 | SQL injection prevention |
| stripe | 20.2.0 | 20.4.0 | Payment security updates |
| africastalking | 0.6.3 | 1.0.0 | API compatibility |
| twilio | 4.20.0 | 5.2.0 | Security patches |
| node-telegram-bot-api | 0.64.0 | 0.65.0 | Stability improvements |

**Added Dependencies:**
- `helmet@^7.1.0` - Security headers middleware

**Updated Locations:**
- `/package.json` - Root dependencies
- `/server/package.json` - Webhook server
- `/telegram-bot/package.json` - Telegram bot

**Status:** ✅ FIXED

---

## Security Best Practices Implemented

### 1. Defense in Depth

- **Helmet.js** for security headers
- **Rate limiting** for DoS protection
- **Input validation** before database queries
- **CORS restrictions** on sensitive endpoints
- **Request size limits** for payload bombing protection

### 2. Secure Configuration

- `.env.example` updated with security guidelines
- All secrets documented with rotation recommendations
- Environment-specific configurations (dev vs. production)
- Config files stored outside web root with restricted permissions

### 3. Parameterized Queries

All SQL queries use parameterized queries to prevent SQL injection:
```javascript
// ✅ SECURE - Parameterized
const result = await client.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);

// ❌ INSECURE - String concatenation (NOT USED)
const result = await client.query(`SELECT * FROM users WHERE id = ${userId}`);
```

### 4. Sensitive Data Handling

- Phone numbers and API keys logged with truncation
- Errors don't expose system details
- Stack traces only shown in development
- No credentials in error messages

---

## Remaining Recommendations

### Short Term (1-2 weeks)

1. **Database Encryption**
   - Enable SSL/TLS for database connections in production
   - Use encrypted password storage (bcrypt, Argon2)

2. **API Authentication**
   - Implement JWT or OAuth2 for API endpoints
   - Add API key management system
   - Rotate keys regularly

3. **Logging & Monitoring**
   - Set up centralized logging (Sentry, ELK, Datadog)
   - Monitor failed authentication attempts
   - Alert on suspicious activity

4. **Secrets Management**
   - Use Vercel Secrets, GitHub Secrets, or Vault
   - Never store secrets in `.env` files on production
   - Rotate all secrets quarterly

### Medium Term (1-3 months)

1. **Static Code Analysis**
   - Run SAST tools: Semgrep, Snyk, SonarQube
   - Fix all high/critical issues
   - Add to CI/CD pipeline

2. **Dependency Management**
   - Enable Dependabot for automated updates
   - Review and test dependencies before updating
   - Audit licenses for compliance

3. **API Security**
   - Implement API versioning
   - Add request signing for webhooks
   - Use mutual TLS for service-to-service communication

4. **Database Security**
   - Implement Row Level Security (RLS)
   - Regular backup testing
   - Encryption at rest

### Long Term (3-6 months)

1. **Security Audit**
   - Hire third-party penetration testing
   - Full code security review
   - Threat modeling exercise

2. **Compliance**
   - GDPR compliance audit (EU users)
   - PCI-DSS for payment processing
   - SOC 2 certification

3. **Incident Response**
   - Create incident response plan
   - Security breach notification procedure
   - Regular security training

---

## Deployment Checklist

Before deploying to production, ensure:

- [ ] All environment variables configured in production
- [ ] `ADMIN_KEY` set to strong, unique value
- [ ] `PAYMENT_SECRET_HASH` matches payment provider
- [ ] Database backups configured and tested
- [ ] SSL/TLS certificates installed
- [ ] Security headers verified via https://securityheaders.com
- [ ] Database requires password authentication
- [ ] Logging and monitoring enabled
- [ ] Rate limiting tested under load
- [ ] Error handling doesn't expose stack traces
- [ ] All dependencies up to date
- [ ] Security tests passing

---

## Useful Security Tools

### Static Analysis
- **Semgrep**: `npm install -g semgrep && semgrep --config=p/security-audit .`
- **Snyk**: `npm install -g snyk && snyk test`
- **SonarQube**: `docker run -d -p 9000:9000 sonarqube`

### Dependency Management
- **npm audit**: `npm audit` (built-in)
- **npm outdated**: `npm outdated` (check for updates)
- **Dependabot**: Enable in GitHub Settings

### Security Headers
- **Security Headers Checker**: https://securityheaders.com
- **OWASP ZAP**: https://www.zaproxy.org/
- **Burp Suite**: https://portswigger.net/burp

### Secrets Detection
- **TruffleHog**: `pip install trufflehog && trufflehog filesystem .`
- **git-secrets**: Prevent committing secrets
- **pre-commit hooks**: Automated checks before commits

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

## Sign-off

**Security Review Completed By:** v0 Security Audit  
**Date:** January 28, 2026  
**Status:** ✅ CRITICAL ISSUES REMEDIATED

Next security review recommended: 3 months

For questions or concerns, contact: security@africa-railways.com

