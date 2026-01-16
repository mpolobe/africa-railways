# Africa Railways OAuth 2.1 Server Setup

This guide explains how to set up and use the OAuth 2.1 Server for third-party railway operator integrations.

## Overview

Africa Railways uses Supabase OAuth 2.1 Server to allow third-party applications to:
- Authenticate users with "Sign in with Africa Railways"
- Access railway bookings and tickets
- View and transfer Africoin tokens
- Integrate with the pan-African railway network

## Quick Start

### 1. Enable OAuth Server in Supabase

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/oauth-server
2. Toggle **Enable OAuth Server** to ON
3. Set **Authorization Path**: `/oauth/consent`

### 2. Run Database Migration

```bash
# Run the OAuth schema migration
psql $DATABASE_URL -f supabase/migrations/008_oauth_server_schema.sql
```

Or in Supabase SQL Editor, run the contents of `008_oauth_server_schema.sql`.

### 3. Configure Site URL

In Supabase Dashboard > Authentication > URL Configuration:
- Set Site URL to your production domain

## OAuth Endpoints

| Endpoint | URL |
|----------|-----|
| Authorization | `https://YOUR_PROJECT.supabase.co/auth/v1/oauth/authorize` |
| Token | `https://YOUR_PROJECT.supabase.co/auth/v1/oauth/token` |
| UserInfo | `https://YOUR_PROJECT.supabase.co/auth/v1/userinfo` |
| Revoke | `https://YOUR_PROJECT.supabase.co/auth/v1/oauth/revoke` |
| JWKS | `https://YOUR_PROJECT.supabase.co/auth/v1/.well-known/jwks.json` |

## Available Scopes

| Scope | Description | Sensitivity |
|-------|-------------|-------------|
| `openid` | Verify user identity | Low |
| `email` | Access email address | Low |
| `profile` | Access name and profile | Low |
| `phone` | Access phone number | Medium |
| `read:tickets` | Read ticket information | Low |
| `write:tickets` | Create/validate tickets | High |
| `read:bookings` | Read booking data | Low |
| `write:bookings` | Create/modify bookings | High |
| `read:routes` | Access route schedules | Low |
| `read:payments` | View transactions | High |
| `write:payments` | Process payments | High |
| `read:africoin` | Check wallet balances | Low |
| `write:africoin` | Transfer tokens | High |
| `read:analytics` | Access reports | Low |
| `admin:operator` | Full admin access | Critical |

## Pre-configured Railway Operators

The migration includes sample clients for:

| Client ID | Operator | Country |
|-----------|----------|---------|
| `kenya_railways_prod` | Kenya Railways Corporation | Kenya |
| `egyptian_railways_prod` | Egyptian National Railways | Egypt |
| `tazara_prod` | TAZARA | Tanzania/Zambia |
| `transnet_prod` | Transnet Freight Rail | South Africa |
| `bolt_africa_prod` | Bolt Africa Transport | Pan-African |

## Integration Guide

### For Third-Party Developers

#### Step 1: Get Client Credentials

Contact Africa Railways to register your application and receive:
- Client ID
- Client Secret (for confidential clients)

#### Step 2: Implement OAuth Flow

```javascript
const AfricaRailwaysClient = require('./AfricaRailwaysOAuthClient');

const client = new AfricaRailwaysClient({
  clientId: 'your_client_id',
  clientSecret: 'your_client_secret',
  redirectUri: 'https://your-app.com/oauth/callback',
  baseUrl: 'https://api.africa-railways.com'
});

// 1. Redirect user to authorization
const authUrl = client.getAuthorizationUrl(
  ['openid', 'email', 'read:tickets', 'write:bookings'],
  'random-state-for-csrf'
);
// Redirect: window.location.href = authUrl;

// 2. Handle callback and exchange code
const tokens = await client.getAccessToken(authorizationCode);

// 3. Make API calls
const ticket = await client.getTicket('ticket-123');
const booking = await client.createBooking({
  route_id: 'route-456',
  passenger_name: 'John Doe',
  travel_date: '2026-02-15'
});
```

### API Examples

#### Get Ticket Information
```bash
curl https://api.africa-railways.com/api/tickets/TICKET_ID \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

#### Validate Ticket
```bash
curl -X POST https://api.africa-railways.com/api/tickets/TICKET_ID/validate \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

#### Create Booking
```bash
curl -X POST https://api.africa-railways.com/api/bookings \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "route_id": "route-456",
    "passenger_name": "John Doe",
    "travel_date": "2026-02-15"
  }'
```

#### Check Africoin Balance
```bash
curl https://api.africa-railways.com/api/africoin/balance/WALLET_ADDRESS \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Security Best Practices

1. **Always use HTTPS** in production
2. **Validate state parameter** to prevent CSRF attacks
3. **Store tokens securely** - use httpOnly cookies or secure storage
4. **Request minimal scopes** - only ask for what you need
5. **Implement token refresh** - handle expiration gracefully
6. **Validate JWTs** - verify tokens using the JWKS endpoint

## Managing OAuth Clients

### Add New Client

```sql
INSERT INTO oauth_clients (
  client_id, client_secret, client_type, operator_name, 
  operator_country, operator_type, redirect_uris, allowed_scopes
) VALUES (
  'new_operator_prod',
  encode(gen_random_bytes(32), 'hex'),
  'confidential',
  'New Railway Operator',
  'Country',
  'national_railway',
  ARRAY['https://operator.com/oauth/callback'],
  ARRAY['openid', 'email', 'read:tickets', 'write:bookings']
);
```

### Rotate Client Secret

```sql
UPDATE oauth_clients 
SET client_secret = encode(gen_random_bytes(32), 'hex'),
    updated_at = NOW()
WHERE client_id = 'operator_client_id'
RETURNING client_id, client_secret;
```

### Revoke All Tokens for Client

```sql
UPDATE oauth_access_tokens 
SET revoked_at = NOW() 
WHERE client_id = 'operator_client_id';

UPDATE oauth_refresh_tokens 
SET revoked_at = NOW() 
WHERE client_id = 'operator_client_id';
```

### View OAuth Activity

```sql
-- Recent authorization events
SELECT * FROM oauth_audit_log 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Active tokens by client
SELECT client_id, COUNT(*) as active_tokens
FROM oauth_access_tokens
WHERE revoked_at IS NULL AND expires_at > NOW()
GROUP BY client_id;

-- User consents
SELECT u.email, c.operator_name, oc.scopes, oc.granted_at
FROM oauth_consents oc
JOIN oauth_clients c ON c.client_id = oc.client_id
JOIN auth.users u ON u.id = oc.user_id
WHERE oc.revoked_at IS NULL;
```

## Troubleshooting

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `invalid_client` | Client not found or inactive | Verify client_id and check is_active |
| `invalid_grant` | Expired or used auth code | Request new authorization |
| `invalid_scope` | Scope not allowed for client | Check allowed_scopes in oauth_clients |
| `invalid_redirect_uri` | URI not registered | Add URI to redirect_uris array |

### Debug Mode

Enable detailed logging:

```sql
-- View recent errors
SELECT * FROM oauth_audit_log 
WHERE success = false 
ORDER BY created_at DESC 
LIMIT 20;
```

## Support

- Documentation: https://docs.africa-railways.com/oauth
- API Reference: https://api.africa-railways.com/docs
- Support: oauth-support@africa-railways.com
