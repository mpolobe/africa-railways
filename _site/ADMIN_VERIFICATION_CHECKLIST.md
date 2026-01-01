# 📋 Administrator Verification Checklist

## Pre-Approval Setup

Before admin@africarailways.com begins approving staff members, verify the following:

### ✅ 1. Phone Number Format

**Requirement**: All staff phone numbers must include country code in E.164 format.

**Verification**:
```sql
-- Check phone number formats in Supabase SQL Editor
SELECT 
  id,
  email,
  phone_number,
  CASE 
    WHEN phone_number LIKE '+%' THEN '✅ Valid'
    ELSE '❌ Missing country code'
  END as format_status
FROM profiles
WHERE status = 'pending';
```

**Valid Formats**:
- ✅ `+260971234567` (Zambia)
- ✅ `+255712345678` (Tanzania)
- ✅ `+254712345678` (Kenya)
- ❌ `0971234567` (Missing country code)
- ❌ `971234567` (Missing + and country code)

**Fix Invalid Numbers**:
```sql
-- Update Zambian numbers (example)
UPDATE profiles 
SET phone_number = '+260' || LTRIM(phone_number, '0')
WHERE phone_number NOT LIKE '+%' 
AND LENGTH(phone_number) = 10;
```

### ✅ 2. Africa's Talking Account Balance

**Requirement**: Sufficient SMS credits for TAZARA/ZRL pilot region.

**Verification Steps**:
1. Login to: [https://account.africastalking.com/](https://account.africastalking.com/)
2. Navigate to: **Billing** → **Balance**
3. Check SMS credits for:
   - **Zambia** (TAZARA corridor)
   - **Tanzania** (ZRL corridor)

**Recommended Balance**:
- Minimum: 100 SMS credits
- Recommended: 500+ SMS credits for pilot phase
- Cost: ~$0.01-0.03 per SMS (varies by country)

**Top-Up**:
```bash
# If balance is low:
# 1. Go to: https://account.africastalking.com/billing/topup
# 2. Add credits via Mobile Money or Card
# 3. Verify balance updated
```

**Test SMS**:
```bash
# Test Africa's Talking from terminal
curl -X POST "https://api.africastalking.com/version1/messaging" \
  -H "apiKey: YOUR_API_KEY" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=YOUR_USERNAME&to=+260XXXXXXXXX&message=Test from OCC System"
```

### ✅ 3. Resend Email Configuration

**Requirement**: Resend account configured with verified domain.

**Verification Steps**:
1. Login to: [https://resend.com/](https://resend.com/)
2. Navigate to: **Domains**
3. Verify: `africarailways.com` shows ✅ Verified

**If Not Verified**:
1. Add domain: `africarailways.com`
2. Add DNS records:
   - SPF: `v=spf1 include:_spf.resend.com ~all`
   - DKIM: (provided by Resend)
3. Wait for verification (usually 5-10 minutes)

**Test Email**:
```bash
# Test Resend from terminal
curl -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer YOUR_RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "OCC System <admin@africarailways.com>",
    "to": ["your-test-email@example.com"],
    "subject": "Test from OCC",
    "html": "<strong>Test email</strong>"
  }'
```

### ✅ 4. Database Webhook Setup

**Requirement**: Webhook triggers Edge Function on profile status changes.

**Setup in Supabase Dashboard**:

1. **Navigate to**: Database → Webhooks
2. **Click**: Create a new webhook
3. **Configure**:
   - **Name**: `staff-approval-notification`
   - **Table**: `profiles`
   - **Events**: `UPDATE`
   - **Type**: `HTTP Request`
   - **Method**: `POST`
   - **URL**: `https://YOUR_PROJECT.supabase.co/functions/v1/handle-staff-approval`
   - **Headers**:
     ```json
     {
       "Content-Type": "application/json",
       "Authorization": "Bearer YOUR_ANON_KEY"
     }
     ```
   - **Conditions**: 
     ```sql
     OLD.status IS DISTINCT FROM NEW.status 
     AND NEW.status = 'approved'
     ```

**Alternative: Database Trigger** (Recommended)

```sql
-- Create trigger function
CREATE OR REPLACE FUNCTION notify_staff_approval()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT := 'https://YOUR_PROJECT.supabase.co/functions/v1/handle-staff-approval';
BEGIN
  -- Only trigger on status change to 'approved'
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'approved' THEN
    PERFORM net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.anon_key', true)
      ),
      body := jsonb_build_object(
        'staff_email', NEW.email,
        'staff_phone', NEW.phone_number,
        'staff_name', NEW.full_name,
        'status', NEW.status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_staff_approval ON profiles;
CREATE TRIGGER on_staff_approval
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_staff_approval();
```

### ✅ 5. Edge Function Deployment

**Requirement**: Both Edge Functions deployed and accessible.

**Deploy Functions**:
```bash
# From project root
cd /workspaces/africa-railways

# Deploy notify-staff-approval (webhook-based)
supabase functions deploy notify-staff-approval --no-verify-jwt

# Deploy handle-staff-approval (direct call)
supabase functions deploy handle-staff-approval --no-verify-jwt
```

**Verify Deployment**:
```bash
# List deployed functions
supabase functions list

# Expected output:
# notify-staff-approval    https://xxx.supabase.co/functions/v1/notify-staff-approval
# handle-staff-approval    https://xxx.supabase.co/functions/v1/handle-staff-approval
```

**Test Function**:
```bash
# Test handle-staff-approval
curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/handle-staff-approval" \
  -H "Content-Type: application/json" \
  -d '{
    "staff_email": "test@example.com",
    "staff_phone": "+260971234567",
    "staff_name": "Test User",
    "status": "approved"
  }'
```

### ✅ 6. Environment Secrets

**Requirement**: All secrets configured in Supabase.

**Set Secrets**:
```bash
# Run the secrets script
./scripts/set_notification_secrets.sh
```

**Verify Secrets**:
```bash
# List secrets (values are hidden)
supabase secrets list

# Expected output:
# RESEND_API_KEY
# AT_USERNAME
# AT_API_KEY
# AT_SENDER_ID
# OCC_PORTAL_URL
```

### ✅ 7. Master Admin Account

**Requirement**: admin@africarailways.com account exists and can login.

**Verify**:
```sql
-- Check admin account in Supabase SQL Editor
SELECT 
  email,
  role,
  status,
  created_at
FROM profiles
WHERE email = 'admin@africarailways.com';

-- Expected:
-- email: admin@africarailways.com
-- role: admin
-- status: approved
```

**Test Login**:
1. Go to: https://www.africarailways.com/occ
2. Login with: admin@africarailways.com
3. Verify: Can access Admin Approval Dashboard

## 🧪 End-to-End Test

### Test Scenario: Approve a Staff Member

1. **Create Test Staff**:
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

2. **Login as Admin**:
   - Go to: https://www.africarailways.com/occ
   - Login with admin credentials

3. **Approve Staff**:
   - Navigate to: Admin Approval Dashboard
   - Find: test.staff@africarailways.com
   - Click: ✅ Approve

4. **Verify Notifications**:
   - Check email: test.staff@africarailways.com
   - Check SMS: +260971234567
   - Both should receive approval notifications

5. **Check Logs**:
```bash
# View Edge Function logs
supabase functions logs handle-staff-approval --tail

# Expected output:
# ✅ Email sent: { id: 'xxx' }
# 📱 SMS Status: { SMSMessageData: { Recipients: [{ status: 'Success' }] } }
```

6. **Cleanup**:
```sql
-- Delete test staff
DELETE FROM profiles 
WHERE email = 'test.staff@africarailways.com';
```

## 📊 Monitoring Dashboard

### Key Metrics to Monitor

1. **Approval Rate**:
```sql
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM profiles
GROUP BY status;
```

2. **Notification Success Rate**:
```sql
SELECT 
  event_type,
  success,
  COUNT(*) as count
FROM auth_logs
WHERE event_type LIKE '%notification%'
GROUP BY event_type, success
ORDER BY event_type, success;
```

3. **Recent Approvals**:
```sql
SELECT 
  email,
  phone_number,
  full_name,
  role,
  updated_at
FROM profiles
WHERE status = 'approved'
ORDER BY updated_at DESC
LIMIT 10;
```

## 🚨 Troubleshooting

### Issue: SMS Not Delivered

**Check**:
1. Phone number format (must include +country_code)
2. Africa's Talking balance
3. Edge Function logs for errors
4. SMS delivery report in Africa's Talking dashboard

**Fix**:
```bash
# View detailed logs
supabase functions logs handle-staff-approval --tail

# Check for errors like:
# ❌ Invalid phone number format
# ❌ Insufficient balance
# ❌ API authentication failed
```

### Issue: Email Not Delivered

**Check**:
1. Resend domain verification
2. Email address validity
3. Spam folder
4. Resend dashboard for delivery status

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

### Issue: Webhook Not Triggering

**Check**:
1. Webhook configuration in Supabase Dashboard
2. Database trigger exists
3. Edge Function URL is correct
4. Authorization headers set

**Fix**:
```sql
-- Verify trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_staff_approval';

-- If missing, recreate trigger (see step 4 above)
```

## ✅ Final Checklist

Before going live:

- [ ] Phone numbers verified (E.164 format)
- [ ] Africa's Talking balance sufficient (100+ credits)
- [ ] Resend domain verified
- [ ] Database webhook/trigger configured
- [ ] Edge Functions deployed
- [ ] Environment secrets set
- [ ] Master admin account tested
- [ ] End-to-end test passed
- [ ] Monitoring dashboard accessible
- [ ] Troubleshooting guide reviewed

## 📞 Support Contacts

- **Africa's Talking**: support@africastalking.com
- **Resend**: support@resend.com
- **Supabase**: support@supabase.com
- **Technical Issues**: Check Edge Function logs first

---

**Last Updated**: 2024-12-30
**Status**: Ready for Production
**Verified By**: OCC Security Team
