# Security Best Practices for ARAIL

This document outlines security practices implemented in the ARAIL project to protect sensitive data and ensure system integrity.

## Environment Variables

### Critical Security Rule
**NEVER commit sensitive environment variables to version control.**

### Implementation
1. All sensitive configuration is stored in environment variables
2. `.env` files are excluded via `.gitignore`
3. `.env.example` provides template without real values

### Required Environment Variables

```bash
# Redis Session Management
REDIS_URL=redis://username:password@host:port/db
# Use Railway's built-in Redis service or external provider
# Example: redis://default:password@redis.railway.internal:6379

# Africa's Talking API
AFRICAS_TALKING_API_KEY=your_api_key_here
AT_USERNAME=your_username
AT_API_KEY=your_api_key

# Sui Blockchain
SUI_RPC_URL=https://fullnode.mainnet.sui.io:443
SUI_PRIVATE_KEY=your_private_key_here
PACKAGE_ID=0xYOUR_PACKAGE_ID
TREASURY_ID=0xYOUR_TREASURY_ID

# Twilio (Fallback SMS)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
```

### Railway Deployment
When deploying to Railway:
1. Use Railway's built-in variable management
2. Never hardcode sensitive values in code
3. Use Railway's Redis plugin for session storage
4. Set all environment variables in Railway dashboard

## Input Validation

### Phone Numbers
- All phone numbers are validated using E.164 format
- Pattern: `+[country code][subscriber number]`
- Length: 8-16 characters (including +)
- Examples: `+260975190740`, `+254712345678`

```python
from validation import validate_phone_number

is_valid, error = validate_phone_number(phone)
if not is_valid:
    logger.warning(f"Invalid phone: {error}")
    # Handle error
```

### Wallet Addresses
- Sui addresses validated as `0x` + 64 hexadecimal characters
- Case insensitive
- Prevents injection attacks

```python
from validation import validate_sui_address

is_valid, error = validate_sui_address(address)
if not is_valid:
    logger.warning(f"Invalid address: {error}")
    # Handle error
```

### Investment Amounts
- Minimum: 100 SUI
- Maximum: 1,000,000 SUI
- Validates numeric format
- Prevents negative or zero amounts

```python
from validation import validate_sui_amount

is_valid, error = validate_sui_amount(amount)
if not is_valid:
    logger.warning(f"Invalid amount: {error}")
    # Handle error
```

### User Input Sanitization
- All USSD input is sanitized
- Only digits and asterisks allowed
- Length limited to prevent buffer overflow
- Prevents injection attacks

```python
from validation import sanitize_user_input

clean_input = sanitize_user_input(user_input, max_length=50)
```

## Error Handling

### Redis Operations
All Redis operations include try-except blocks with fallback:

```python
try:
    # Redis operation
    redis_client.set(key, value)
except ConnectionError as e:
    logger.error(f"Redis connection error: {e}")
    # Fallback to in-memory storage
except Exception as e:
    logger.error(f"Unexpected error: {e}")
    # Handle gracefully
```

### Blockchain Operations
```python
try:
    success, result = execute_investment(phone, amount)
    if success:
        # Handle success
    else:
        # Handle blockchain error
except Exception as e:
    logger.error(f"Investment error: {e}", exc_info=True)
    # Return user-friendly error
```

### Flask Endpoints
```python
@app.route('/ussd', methods=['POST'])
def ussd_callback():
    try:
        # Process request
        # Validate inputs
        # Execute logic
    except Exception as e:
        logger.error(f"USSD error: {e}")
        response = "END An error occurred.\n\nPlease try again."
        return make_response(response, 200)
```

## Session Management

### Redis-First with Fallback
1. **Primary**: Redis with 30-minute expiration
2. **Fallback**: In-memory storage when Redis unavailable
3. **Security**: Session IDs validated before use

```python
# Retrieve session
session_data = get_session_data(session_id)

# Store session (30 min expiration)
set_session_data(session_id, data)

# Clear session
clear_session(session_id)
```

### Session Data Structure
```python
{
    'phone': '+260975190740',
    'flow': 'investment',
    'sui_amount': 500,
    'last_updated': '2024-01-01T12:00:00'
}
```

## Logging

### Security-Conscious Logging
- Never log sensitive data (API keys, private keys, passwords)
- Log validation failures for security monitoring
- Use structured logging with levels
- Truncate transaction IDs in logs

```python
# Good
logger.info(f"Investment initiated: {phone_number}")
logger.info(f"TX: {tx_digest[:10]}...")  # Truncated

# Bad - DON'T DO THIS
logger.info(f"API Key: {API_KEY}")  # NEVER log secrets
logger.info(f"Private Key: {PRIVATE_KEY}")  # NEVER
```

## API Security

### Request Validation
- IP whitelisting for Africa's Talking callbacks
- Signature verification for webhooks
- Phone number validation
- Input sanitization

### Rate Limiting
Consider implementing rate limiting for:
- USSD endpoints
- Investment operations
- SMS sending

## Deployment Checklist

### Before Deploying to Production

- [ ] All environment variables set in Railway dashboard
- [ ] No `.env` files committed to repository
- [ ] Redis URL configured (Railway plugin or external)
- [ ] SMS API keys configured and tested
- [ ] Blockchain RPC endpoints configured
- [ ] IP whitelist updated for production
- [ ] Logging configured appropriately
- [ ] Health check endpoint responding
- [ ] Error handling tested
- [ ] Input validation active

### Railway-Specific

1. **Redis Setup**
   ```bash
   # Add Railway Redis plugin
   # Copy REDIS_URL from plugin to environment variables
   ```

2. **Environment Variables**
   - Set in Railway dashboard under "Variables"
   - Use Railway's secret management
   - Never use plaintext for sensitive values

3. **Monitoring**
   - Enable Railway logging
   - Monitor error rates
   - Track Redis connection status
   - Monitor blockchain transaction success rates

## Incident Response

### If Credentials Are Compromised

1. **Immediate Actions**
   - Rotate all API keys immediately
   - Update environment variables
   - Check logs for unauthorized access
   - Notify stakeholders

2. **Investigation**
   - Review git history
   - Check deployment logs
   - Analyze access patterns
   - Document findings

3. **Prevention**
   - Review security practices
   - Update documentation
   - Train team members
   - Implement additional monitoring

## Testing Security

### Validation Tests
```bash
python3 test_validation.py
```

### Redis Client Tests
```bash
python3 test_redis_client.py
```

### Manual Security Testing
1. Test with invalid phone numbers
2. Test with malformed wallet addresses
3. Test with extreme SUI amounts
4. Test Redis fallback behavior
5. Test error handling paths

## Additional Resources

- [Railway Environment Variables](https://docs.railway.app/develop/variables)
- [Redis Security](https://redis.io/topics/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Python Security Best Practices](https://python.readthedocs.io/en/stable/library/security_warnings.html)

## Contact

For security issues or questions:
- Email: security@africarailways.com
- Report vulnerabilities privately via GitHub Security tab

---

**Last Updated**: 2024-01-01
**Version**: 1.0.0
