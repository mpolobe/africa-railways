-- =====================================================
-- Approval Webhook Setup
-- =====================================================
-- Purpose: Automatically notify staff when approved
-- Trigger: profiles.status changes to 'approved'
-- Action: Call handle-staff-approval Edge Function
-- =====================================================

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- =====================================================
-- 1. CREATE WEBHOOK FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_staff_approval_notification()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  service_role_key TEXT;
  payload JSONB;
  request_id BIGINT;
BEGIN
  -- Only proceed if status changed to 'approved'
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'approved' THEN
    
    -- Construct Edge Function URL
    -- Replace [YOUR_PROJECT_REF] with your actual project reference
    function_url := current_setting('app.settings.function_url', true);
    IF function_url IS NULL THEN
      function_url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/handle-staff-approval';
    END IF;
    
    -- Get service role key from settings
    -- Replace [YOUR_SERVICE_ROLE_KEY] with your actual service role key
    service_role_key := current_setting('app.settings.service_role_key', true);
    IF service_role_key IS NULL THEN
      RAISE WARNING 'Service role key not configured. Set with: ALTER DATABASE postgres SET app.settings.service_role_key = ''your_key'';';
      RETURN NEW;
    END IF;
    
    -- Build payload
    payload := jsonb_build_object(
      'staff_email', NEW.email,
      'staff_phone', NEW.phone_number,
      'staff_name', COALESCE(NEW.full_name, 'Staff Member'),
      'status', NEW.status,
      'approved_at', NOW(),
      'approved_by', current_user
    );
    
    -- Make async HTTP request using pg_net
    SELECT net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := payload
    ) INTO request_id;
    
    -- Log the webhook call
    RAISE NOTICE 'Approval notification triggered for % (request_id: %)', NEW.email, request_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. CREATE TRIGGER
-- =====================================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_staff_approval_webhook ON profiles;

-- Create trigger that fires AFTER UPDATE
CREATE TRIGGER on_staff_approval_webhook
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'approved')
  EXECUTE FUNCTION trigger_staff_approval_notification();

-- =====================================================
-- 3. CONFIGURE SETTINGS
-- =====================================================

-- Set Edge Function URL (replace with your project reference)
-- Example: https://abcdefghijklmnop.supabase.co/functions/v1/handle-staff-approval
ALTER DATABASE postgres 
SET app.settings.function_url = 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/handle-staff-approval';

-- Set Service Role Key (replace with your actual key)
-- Find in: Supabase Dashboard > Project Settings > API > service_role key
ALTER DATABASE postgres 
SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';

-- =====================================================
-- 4. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION trigger_staff_approval_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_staff_approval_notification() TO service_role;

-- Grant usage on pg_net schema
GRANT USAGE ON SCHEMA net TO authenticated;
GRANT USAGE ON SCHEMA net TO service_role;

-- =====================================================
-- 5. VERIFICATION QUERIES
-- =====================================================

-- Verify trigger exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_staff_approval_webhook'
  ) THEN
    RAISE NOTICE '✅ Trigger created successfully';
  ELSE
    RAISE WARNING '❌ Trigger not found';
  END IF;
END $$;

-- Verify function exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'trigger_staff_approval_notification'
  ) THEN
    RAISE NOTICE '✅ Function created successfully';
  ELSE
    RAISE WARNING '❌ Function not found';
  END IF;
END $$;

-- Verify pg_net extension
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'pg_net'
  ) THEN
    RAISE NOTICE '✅ pg_net extension enabled';
  ELSE
    RAISE WARNING '❌ pg_net extension not found';
  END IF;
END $$;

-- =====================================================
-- 6. TEST WEBHOOK (Optional)
-- =====================================================

-- Uncomment to test the webhook with a dummy update
-- This will trigger the notification if a test user exists

/*
-- Create test user
INSERT INTO profiles (
  email,
  phone_number,
  full_name,
  role,
  status
) VALUES (
  'test.webhook@africarailways.com',
  '+260971234567',
  'Test Webhook User',
  'staff',
  'pending'
) ON CONFLICT (email) DO NOTHING;

-- Wait a moment
SELECT pg_sleep(1);

-- Approve test user (this should trigger the webhook)
UPDATE profiles 
SET status = 'approved' 
WHERE email = 'test.webhook@africarailways.com';

-- Check pg_net queue
SELECT * FROM net._http_response ORDER BY created DESC LIMIT 5;

-- Cleanup test user
DELETE FROM profiles WHERE email = 'test.webhook@africarailways.com';
*/

-- =====================================================
-- 7. MONITORING QUERIES
-- =====================================================

-- View recent webhook calls
CREATE OR REPLACE VIEW webhook_activity AS
SELECT 
  id,
  created,
  status_code,
  content_type,
  LEFT(body::text, 100) as response_preview
FROM net._http_response
ORDER BY created DESC
LIMIT 50;

-- Grant access to view
GRANT SELECT ON webhook_activity TO authenticated;
GRANT SELECT ON webhook_activity TO service_role;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION trigger_staff_approval_notification() IS 
'Triggers Edge Function to send email and SMS notifications when staff is approved';

COMMENT ON TRIGGER on_staff_approval_webhook ON profiles IS 
'Automatically notifies staff members when their account status changes to approved';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔══════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                              ║';
  RAISE NOTICE '║   ✅ APPROVAL WEBHOOK CONFIGURED                            ║';
  RAISE NOTICE '║                                                              ║';
  RAISE NOTICE '╚══════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Update the following settings:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Set your Edge Function URL:';
  RAISE NOTICE '   ALTER DATABASE postgres SET app.settings.function_url = ''https://YOUR_PROJECT.supabase.co/functions/v1/handle-staff-approval'';';
  RAISE NOTICE '';
  RAISE NOTICE '2. Set your Service Role Key:';
  RAISE NOTICE '   ALTER DATABASE postgres SET app.settings.service_role_key = ''YOUR_SERVICE_ROLE_KEY'';';
  RAISE NOTICE '';
  RAISE NOTICE '3. Deploy Edge Function:';
  RAISE NOTICE '   supabase functions deploy handle-staff-approval';
  RAISE NOTICE '';
  RAISE NOTICE '4. Test the webhook:';
  RAISE NOTICE '   Update a test user status to ''approved''';
  RAISE NOTICE '';
END $$;
