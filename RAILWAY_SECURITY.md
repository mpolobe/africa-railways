# Railway Key Management & Security Best Practices

This document outlines security best practices for managing sensitive credentials and API keys in Railway.app deployments.

## Overview

Railway.app provides a secure environment for managing secrets and sensitive configuration. This project follows security best practices to protect:

- Blockchain private keys
- API keys (Africa's Talking, Twilio, etc.)
- Database credentials
- Service endpoints

## Railway Environment Variables

All sensitive data MUST be stored as Railway environment variables, never committed to the repository.

### Required Environment Variables

#### Sui Blockchain Configuration
```bash
# CRITICAL: Never commit these values to git
SUI_PRIVATE_KEY=<your-wallet-private-key>
PACKAGE_ID=0x<your-deployed-package-id>
TREASURY_ID=0x<your-treasury-object-id>
SUI_RPC_URL=https://fullnode.mainnet.sui.io:443
```

#### SMS/USSD Services (Africa's Talking)
```bash
AT_USERNAME=<your-africas-talking-username>
AT_API_KEY=<your-africas-talking-api-key>
AT_SENDER_ID=ARAIL
AFRICAS_TALKING_API_KEY=<your-api-key-for-webhooks>
```

#### Optional Services
```bash
# Twilio (if using for SMS backup)
TWILIO_ACCOUNT_SID=<your-twilio-sid>
TWILIO_AUTH_TOKEN=<your-twilio-token>
TWILIO_PHONE_NUMBER=<your-twilio-phone>

# Database (if using external DB)
DATABASE_URL=<your-database-connection-string>
```

## How to Set Environment Variables in Railway

### Via Railway Dashboard
1. Go to your project in Railway dashboard
2. Select your service (e.g., "backend" or "app")
3. Click on "Variables" tab
4. Click "+ New Variable"
5. Enter variable name and value
6. Click "Add"
7. Deploy to apply changes

### Via Railway CLI
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Set a variable
railway variables set SUI_PRIVATE_KEY=<your-key>

# View variables (values are hidden)
railway variables list
```

## Security Best Practices

### 1. Never Commit Secrets to Git

**Bad ❌**
```python
# DO NOT DO THIS
SUI_PRIVATE_KEY = "0xabcdef123456..."
AT_API_KEY = "my-secret-key"
```

**Good ✅**
```python
# Use environment variables
SUI_PRIVATE_KEY = os.environ.get('SUI_PRIVATE_KEY', '')
AT_API_KEY = os.environ.get('AT_API_KEY', '')

# Validate they are set
if not SUI_PRIVATE_KEY:
    logger.error("SUI_PRIVATE_KEY not set in environment")
    raise ValueError("Missing required environment variable: SUI_PRIVATE_KEY")
```

### 2. Use .env Files for Local Development Only

Create a `.env` file for local testing (already in `.gitignore`):

```bash
# .env (NEVER commit this file)
SUI_PRIVATE_KEY=0xYOUR_KEY_HERE
AT_USERNAME=sandbox
AT_API_KEY=your-test-key
```

Load it in development:
```python
from dotenv import load_dotenv
load_dotenv()  # Loads .env file in development

# Now use os.environ.get() as usual
```

### 3. Rotate Keys Regularly

- Set calendar reminders to rotate API keys every 90 days
- When rotating:
  1. Generate new key in service dashboard
  2. Update Railway environment variable
  3. Deploy to apply changes
  4. Revoke old key after confirming new key works
  5. Document rotation in internal notes

### 4. Use Different Keys for Different Environments

Maintain separate credentials for:
- **Development**: Sandbox/test keys
- **Staging**: Limited production-like keys
- **Production**: Full production keys

Railway makes this easy with environment-specific variable sets.

### 5. Limit Key Permissions

When creating API keys:
- Use the minimum required permissions
- Enable IP whitelisting when possible
- Set spending limits on services like Africa's Talking
- Enable 2FA on all service accounts

### 6. Monitor Key Usage

Regularly check:
- API usage logs in service dashboards
- Railway deployment logs for authentication errors
- Unusual spending patterns
- Failed authentication attempts

## Incident Response

### If a Key is Compromised

1. **Immediate Actions** (within 5 minutes)
   - Revoke the compromised key in the service dashboard
   - Generate a new key
   - Update Railway environment variable
   - Force redeploy all services

2. **Investigation** (within 1 hour)
   - Check service logs for unauthorized usage
   - Review git history to confirm key wasn't committed
   - Check Railway access logs
   - Identify how the compromise occurred

3. **Prevention** (within 24 hours)
   - Implement additional security measures
   - Update team security training
   - Review and update this documentation
   - Consider implementing key rotation automation

4. **Notification** (as required)
   - Notify affected users if data was accessed
   - Report to service providers if required
   - Document incident in security log

## Validation and Monitoring

This project implements several validation and error handling mechanisms:

### Phone Number Validation
```python
from validation_utils import validate_phone_number

is_valid, error = validate_phone_number("+260975190740")
if not is_valid:
    logger.error(f"Invalid phone: {error}")
    return False
```

### Wallet Address Validation
```python
from validation_utils import validate_wallet_address

is_valid, error = validate_wallet_address("0x123...")
if not is_valid:
    logger.error(f"Invalid address: {error}")
    return False
```

### Connection Timeout Handling
```python
import socket

try:
    socket.setdefaulttimeout(30)
    # Perform network operation
    result = execute_investment(phone, amount)
except socket.timeout:
    logger.error("Connection timeout")
    return False, "Network timeout"
finally:
    socket.setdefaulttimeout(None)
```

## Railway-Specific Security Features

### Automatic HTTPS
- Railway provides automatic HTTPS for all deployments
- Certificates are managed and renewed automatically
- No manual SSL configuration needed

### Private Networking
- Services within Railway can communicate via private network
- Database connections use internal hostnames
- Reduces attack surface by not exposing internal services

### Audit Logs
- Railway maintains audit logs of all configuration changes
- Review logs regularly in Railway dashboard
- Export logs for compliance if needed

### Access Control
- Use Railway teams for organization deployments
- Assign minimum required permissions to team members
- Enable 2FA for all team member accounts
- Regularly audit team access

## Compliance and Best Practices

### PCI DSS Considerations
If handling payment data:
- Never store credit card numbers
- Use tokenization for payment processing
- Maintain audit trails
- Regular security assessments

### GDPR Compliance
- Store only necessary user data
- Implement data deletion workflows
- Maintain data processing records
- Ensure secure data transfer

### Regular Security Audits
- Monthly: Review active API keys and permissions
- Quarterly: Security audit of codebase
- Annually: Third-party penetration testing

## Resources

- [Railway Security Documentation](https://docs.railway.app/develop/variables)
- [Africa's Talking Security Best Practices](https://developers.africastalking.com/docs/security)
- [Sui Network Security](https://docs.sui.io/learn/security)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)

## Contact

For security concerns or to report vulnerabilities:
- Email: security@africarailways.com
- Use encrypted communication when reporting sensitive issues
- Response time: Within 24 hours

---

**Last Updated**: 2026-01-01
**Next Review**: 2026-04-01
**Owner**: Security Team
