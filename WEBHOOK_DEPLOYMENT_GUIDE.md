# 🔗 Webhook Deployment Guide

## Overview

This guide walks through setting up the database webhook that automatically notifies staff members when their account is approved by admin@africarailways.com.

## Architecture

```
┌─────────────────┐
│  Admin Approves │
│  Staff Member   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Database       │
│  UPDATE trigger │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Webhook        │
│  Function       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Edge Function  │────▶│  Resend API     │
│  handle-staff-  │     │  (Email)        │
│  approval       │     └─────────────────┘
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Africa's       │
│  Talking API    │
│  (SMS)          │
└─────────────────┘
```

## Prerequisites

### Required Environment Variables

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
export RESEND_API_KEY="re_your_resend_key"
export AFRICAS_TALKING_USERNAME="your_at_username"
export AFRICAS_TALKING_API_KEY="your_at_api_key"
```

### Required Tools

- Supabase CLI: `npm install -g supabase`
- PostgreSQL client (psql): For manual SQL execution
- curl: For testing webhooks
- jq: For JSON parsing (optional)

## Step-by-Step Deployment

### Step 1: Verify Setup

Run the verification script to check all prerequisites:

```bash
./scripts/verify_webhook_setup.sh
```

Expected output:
```
✅ SUPABASE_URL
✅ SUPABASE_SERVICE_ROLE_KEY
✅ RESEND_API_KEY
✅ AFRICAS_TALKING_USERNAME
✅ AFRICAS_TALKING_API_KEY
✅ Supabase CLI installed
✅ Migration 001 exists
✅ Migration 002 exists
✅ Edge Function exists
```

### Step 2: Apply Database Migrations

Apply the webhook migration to create the trigger:

```bash
# Using Supabase CLI
supabase db push

# Or manually
psql $SUPABASE_URL < supabase/migrations/002_approval_webhook.sql
```

This creates:
- `trigger_staff_approval_notification()` function
- `on_staff_approval_webhook` trigger on profiles table
- `webhook_activity` view for monitoring

### Step 3: Configure Webhook Settings

Set the Edge Function URL and service role key:

```bash
./scripts/configure_webhook.sh
```

This configures:
- `app.settings.function_url` - Your Edge Function endpoint
- `app.settings.service_role_key` - Authorization for webhook calls

**Manual Configuration** (if script fails):

```sql
-- In Supabase SQL Editor
ALTER DATABASE postgres 
SET app.settings.function_url = 'https://YOUR_PROJECT.supabase.co/functions/v1/handle-staff-approval';

ALTER DATABASE postgres 
SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
```

### Step 4: Set Edge Function Secrets

Configure secrets for the Edge Function:

```bash
./scripts/set_notification_secrets.sh
```

This sets:
- `RESEND_API_KEY` - For email delivery
- `AT_USERNAME` - Africa's Talking username
- `AT_API_KEY` - Africa's Talking API key
- `AT_SENDER_ID` - SMS sender ID (default: SENTINEL)

**Manual Configuration**:

```bash
supabase secrets set \
  RESEND_API_KEY="your_key" \
  AT_USERNAME="your_username" \
  AT_API_KEY="your_api_key" \
  AT_SENDER_ID="SENTINEL"
```

### Step 5: Deploy Edge Function

Deploy the notification handler:

```bash
supabase functions deploy handle-staff-approval --no-verify-jwt
```

Expected output:
```
Deploying handle-staff-approval (project ref: your-project)
✓ Deployed handle-staff-approval
```

Verify deployment:
```bash
supabase functions list
```

### Step 6: Test the Webhook

Test with a mock payload:

```bash
# Test locally (if running supabase start)
./scripts/test_webhook_payload.sh

# Test production
./scripts/test_webhook_payload.sh --prod
```

Expected response:
```json
{
  "success": true,
  "email_sent": true,
  "sms_sent": true,
  "message": "Approval notifications sent successfully"
}
```

### Step 7: End-to-End Test

Test the complete flow:

1. **Create test staff member**:
```sql
INSERT INTO profiles (
  email,
  phone_number,
  full_name,
  role,
  status
) VALUES (
  'test.staff@africarailways.com',
  '+260971234567',  -- Use your test number
  'Test Staff Member',
  'staff',
  'pending'
);
```

2. **Approve the staff member**:
```sql
UPDATE profiles 
SET status = 'approved' 
WHERE email = 'test.staff@africarailways.com';
```

3. **Verify notifications**:
   - Check email: test.staff@africarailways.com
   - Check SMS: +260971234567
   - View logs: `supabase functions logs handle-staff-approval --tail`

4. **Cleanup**:
```sql
DELETE FROM profiles 
WHERE email = 'test.staff@africarailways.com';
```

## Monitoring

### View Webhook Activity

```sql
-- Recent webhook calls
SELECT * FROM webhook_activity 
ORDER BY created DESC 
LIMIT 10;

-- Webhook success rate
SELECT 
  CASE 
    WHEN status_code = 200 THEN 'Success'
    ELSE 'Failed'
  END as status,
  COUNT(*) as count
FROM net._http_response
WHERE created > NOW() - INTERVAL '24 hours'
GROUP BY status_code;
```

### View Edge Function Logs

```bash
# Tail logs in real-time
supabase functions logs handle-staff-approval --tail

# View recent logs
supabase functions logs handle-staff-approval --limit 50
```

### View Approval Events

```sql
-- Recent approvals
SELECT 
  email,
  phone_number,
  full_name,
  status,
  updated_at
FROM profiles
WHERE status = 'approved'
ORDER BY updated_at DESC
LIMIT 20;

-- Approval notifications sent
SELECT 
  user_id,
  phone_number,
  event_type,
  success,
  timestamp
FROM auth_logs
WHERE event_type = 'approval_notification_sent'
ORDER BY timestamp DESC
LIMIT 20;
```

## Troubleshooting

### Issue: Webhook Not Triggering

**Symptoms**: Staff approved but no notifications sent

**Check**:
```sql
-- Verify trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_staff_approval_webhook';

-- Verify function exists
SELECT proname FROM pg_proc 
WHERE proname = 'trigger_staff_approval_notification';

-- Check pg_net extension
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

**Fix**:
```bash
# Reapply migration
supabase db push
```

### Issue: Edge Function Returns 500

**Symptoms**: Webhook triggers but function fails

**Check**:
```bash
# View detailed logs
supabase functions logs handle-staff-approval --tail

# Common errors:
# - Missing secrets (RESEND_API_KEY, AT_USERNAME, AT_API_KEY)
# - Invalid phone number format
# - Insufficient API credits
```

**Fix**:
```bash
# Verify secrets are set
supabase secrets list

# Reset secrets if needed
./scripts/set_notification_secrets.sh
```

### Issue: Email Not Delivered

**Symptoms**: SMS works but email fails

**Check**:
1. Resend dashboard: https://resend.com/emails
2. Domain verification status
3. Email address validity
4. Spam folder

**Fix**:
```bash
# Test Resend directly
curl -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "OCC System <admin@africarailways.com>",
    "to": ["test@example.com"],
    "subject": "Test",
    "html": "<p>Test</p>"
  }'
```

### Issue: SMS Not Delivered

**Symptoms**: Email works but SMS fails

**Check**:
1. Africa's Talking dashboard: https://account.africastalking.com/
2. SMS balance
3. Phone number format (must be E.164: +260...)
4. Delivery reports

**Fix**:
```bash
# Test Africa's Talking directly
curl -X POST "https://api.africastalking.com/version1/messaging" \
  -H "apiKey: $AFRICAS_TALKING_API_KEY" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$AFRICAS_TALKING_USERNAME&to=+260971234567&message=Test"
```

### Issue: Webhook Calls Failing

**Symptoms**: Database trigger fires but HTTP request fails

**Check**:
```sql
-- View failed webhook calls
SELECT 
  id,
  created,
  status_code,
  body
FROM net._http_response
WHERE status_code != 200
ORDER BY created DESC
LIMIT 10;
```

**Fix**:
1. Verify Edge Function URL is correct
2. Check service role key is valid
3. Ensure Edge Function is deployed
4. Review Edge Function logs for errors

## Security Considerations

### Webhook Security

1. **Authorization**: Webhook uses service role key for authentication
2. **HTTPS Only**: All webhook calls use HTTPS
3. **Trigger Conditions**: Only fires on status change to 'approved'
4. **Async Execution**: Database doesn't wait for notification delivery

### API Key Security

1. **Never commit** API keys to git
2. **Use Supabase secrets** for Edge Function credentials
3. **Rotate keys** every 90 days
4. **Monitor usage** in provider dashboards

### Phone Number Validation

```sql
-- Ensure all phone numbers are E.164 format
UPDATE profiles 
SET phone_number = '+260' || LTRIM(phone_number, '0')
WHERE phone_number NOT LIKE '+%' 
AND LENGTH(phone_number) = 10;
```

## Performance Optimization

### Webhook Efficiency

The webhook is optimized to:
- Only trigger on status changes (not all updates)
- Use async HTTP requests (non-blocking)
- Batch notifications if needed
- Fail gracefully without blocking database operations

### Monitoring Webhook Performance

```sql
-- Average response time
SELECT 
  AVG(EXTRACT(EPOCH FROM (completed_at - created))) as avg_seconds
FROM net._http_response
WHERE created > NOW() - INTERVAL '24 hours';

-- Success rate
SELECT 
  ROUND(
    COUNT(*) FILTER (WHERE status_code = 200) * 100.0 / COUNT(*),
    2
  ) as success_rate_percent
FROM net._http_response
WHERE created > NOW() - INTERVAL '24 hours';
```

## Quick Reference

### Deployment Commands

```bash
# Complete deployment
./scripts/deploy_occ_complete.sh

# Individual steps
./scripts/verify_webhook_setup.sh        # Verify prerequisites
./scripts/configure_webhook.sh           # Configure settings
./scripts/set_notification_secrets.sh    # Set secrets
supabase functions deploy handle-staff-approval  # Deploy function
./scripts/test_webhook_payload.sh        # Test webhook
```

### Monitoring Commands

```bash
# View logs
supabase functions logs handle-staff-approval --tail

# View webhook activity
psql $SUPABASE_URL -c "SELECT * FROM webhook_activity LIMIT 10;"

# Check secrets
supabase secrets list
```

### Testing Commands

```bash
# Test locally
./scripts/test_webhook_payload.sh

# Test production
./scripts/test_webhook_payload.sh --prod

# Test end-to-end
# (Approve a test user in Supabase Dashboard)
```

## Support

- **Supabase Webhooks**: https://supabase.com/docs/guides/database/webhooks
- **pg_net Extension**: https://supabase.com/docs/guides/database/extensions/pg_net
- **Edge Functions**: https://supabase.com/docs/guides/functions
- **Resend**: https://resend.com/docs
- **Africa's Talking**: https://developers.africastalking.com/

---

**Last Updated**: 2024-12-30
**Status**: Production Ready
**Tested**: ✅ End-to-End
