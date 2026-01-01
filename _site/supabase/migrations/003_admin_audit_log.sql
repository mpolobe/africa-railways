-- =====================================================
-- Admin Audit Log System
-- =====================================================
-- Purpose: Track all administrative actions with full accountability
-- Features: Who, What, When, Where, Why tracking
-- =====================================================

-- =====================================================
-- 1. ADMIN AUDIT LOG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Who performed the action
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  admin_name TEXT,
  
  -- What action was performed
  action_type TEXT NOT NULL CHECK (action_type IN (
    'staff_approved',
    'staff_suspended',
    'staff_revoked',
    'staff_role_changed',
    'station_assigned',
    'station_removed',
    'profile_updated',
    'profile_deleted',
    'settings_changed',
    'system_config_changed'
  )),
  action_description TEXT NOT NULL,
  
  -- Target of the action
  target_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  target_user_email TEXT,
  target_user_name TEXT,
  
  -- Action details
  old_value JSONB,
  new_value JSONB,
  changes JSONB,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  request_id TEXT,
  
  -- Metadata
  reason TEXT,
  notes TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  
  -- Timestamps
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Blockchain/Signature (for immutability)
  signature TEXT,
  blockchain_tx_hash TEXT,
  
  -- Indexes for fast queries
  CONSTRAINT admin_audit_log_action_check CHECK (action_type IS NOT NULL)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target ON admin_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_performed_at ON admin_audit_log(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_severity ON admin_audit_log(severity);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_email ON admin_audit_log(admin_email);

-- =====================================================
-- 2. AUTOMATIC AUDIT LOGGING FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION log_admin_action()
RETURNS TRIGGER AS $$
DECLARE
  admin_profile RECORD;
  action_desc TEXT;
  old_val JSONB;
  new_val JSONB;
  action_severity TEXT;
BEGIN
  -- Get admin details from current session
  SELECT id, email, full_name INTO admin_profile
  FROM profiles
  WHERE id = auth.uid();
  
  -- Only log if admin exists
  IF admin_profile.id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Determine action type and description
  IF TG_OP = 'UPDATE' THEN
    -- Staff approval
    IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
      action_desc := 'Approved staff member: ' || NEW.email;
      old_val := jsonb_build_object('status', OLD.status);
      new_val := jsonb_build_object('status', NEW.status);
      action_severity := 'high';
      
      INSERT INTO admin_audit_log (
        admin_id,
        admin_email,
        admin_name,
        action_type,
        action_description,
        target_user_id,
        target_user_email,
        target_user_name,
        old_value,
        new_value,
        severity
      ) VALUES (
        admin_profile.id,
        admin_profile.email,
        admin_profile.full_name,
        'staff_approved',
        action_desc,
        NEW.id,
        NEW.email,
        NEW.full_name,
        old_val,
        new_val,
        action_severity
      );
    
    -- Staff suspension
    ELSIF OLD.status = 'approved' AND NEW.status = 'suspended' THEN
      action_desc := 'Suspended staff member: ' || NEW.email;
      old_val := jsonb_build_object('status', OLD.status);
      new_val := jsonb_build_object('status', NEW.status);
      action_severity := 'critical';
      
      INSERT INTO admin_audit_log (
        admin_id,
        admin_email,
        admin_name,
        action_type,
        action_description,
        target_user_id,
        target_user_email,
        target_user_name,
        old_value,
        new_value,
        severity
      ) VALUES (
        admin_profile.id,
        admin_profile.email,
        admin_profile.full_name,
        'staff_suspended',
        action_desc,
        NEW.id,
        NEW.email,
        NEW.full_name,
        old_val,
        new_val,
        action_severity
      );
    
    -- Role change
    ELSIF OLD.role IS DISTINCT FROM NEW.role THEN
      action_desc := 'Changed role for ' || NEW.email || ' from ' || OLD.role || ' to ' || NEW.role;
      old_val := jsonb_build_object('role', OLD.role);
      new_val := jsonb_build_object('role', NEW.role);
      action_severity := 'high';
      
      INSERT INTO admin_audit_log (
        admin_id,
        admin_email,
        admin_name,
        action_type,
        action_description,
        target_user_id,
        target_user_email,
        target_user_name,
        old_value,
        new_value,
        severity
      ) VALUES (
        admin_profile.id,
        admin_profile.email,
        admin_profile.full_name,
        'staff_role_changed',
        action_desc,
        NEW.id,
        NEW.email,
        NEW.full_name,
        old_val,
        new_val,
        action_severity
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. CREATE AUDIT TRIGGER
-- =====================================================

DROP TRIGGER IF EXISTS on_profile_admin_action ON profiles;

CREATE TRIGGER on_profile_admin_action
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_admin_action();

-- =====================================================
-- 4. STATION ASSIGNMENT AUDIT
-- =====================================================

CREATE OR REPLACE FUNCTION log_station_assignment()
RETURNS TRIGGER AS $$
DECLARE
  admin_profile RECORD;
  action_desc TEXT;
  target_profile RECORD;
BEGIN
  -- Get admin details
  SELECT id, email, full_name INTO admin_profile
  FROM profiles
  WHERE id = auth.uid();
  
  -- Get target user details
  SELECT id, email, full_name INTO target_profile
  FROM profiles
  WHERE id = NEW.staff_id;
  
  IF TG_OP = 'INSERT' THEN
    action_desc := 'Assigned station ' || NEW.station_name || ' (' || NEW.station_code || ') to ' || target_profile.email;
    
    INSERT INTO admin_audit_log (
      admin_id,
      admin_email,
      admin_name,
      action_type,
      action_description,
      target_user_id,
      target_user_email,
      target_user_name,
      new_value,
      severity
    ) VALUES (
      admin_profile.id,
      admin_profile.email,
      admin_profile.full_name,
      'station_assigned',
      action_desc,
      target_profile.id,
      target_profile.email,
      target_profile.full_name,
      jsonb_build_object(
        'station_code', NEW.station_code,
        'station_name', NEW.station_name
      ),
      'medium'
    );
  
  ELSIF TG_OP = 'DELETE' THEN
    action_desc := 'Removed station ' || OLD.station_name || ' (' || OLD.station_code || ') from ' || target_profile.email;
    
    INSERT INTO admin_audit_log (
      admin_id,
      admin_email,
      admin_name,
      action_type,
      action_description,
      target_user_id,
      target_user_email,
      target_user_name,
      old_value,
      severity
    ) VALUES (
      admin_profile.id,
      admin_profile.email,
      admin_profile.full_name,
      'station_removed',
      action_desc,
      target_profile.id,
      target_profile.email,
      target_profile.full_name,
      jsonb_build_object(
        'station_code', OLD.station_code,
        'station_name', OLD.station_name
      ),
      'medium'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for station assignments
DROP TRIGGER IF EXISTS on_station_assignment_audit ON staff_stations;

CREATE TRIGGER on_station_assignment_audit
  AFTER INSERT OR DELETE ON staff_stations
  FOR EACH ROW
  EXECUTE FUNCTION log_station_assignment();

-- =====================================================
-- 5. MANUAL AUDIT LOG FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION create_audit_log(
  p_action_type TEXT,
  p_action_description TEXT,
  p_target_user_id UUID DEFAULT NULL,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_severity TEXT DEFAULT 'medium'
)
RETURNS UUID AS $$
DECLARE
  admin_profile RECORD;
  target_profile RECORD;
  audit_id UUID;
BEGIN
  -- Get admin details
  SELECT id, email, full_name INTO admin_profile
  FROM profiles
  WHERE id = auth.uid();
  
  -- Get target user details if provided
  IF p_target_user_id IS NOT NULL THEN
    SELECT id, email, full_name INTO target_profile
    FROM profiles
    WHERE id = p_target_user_id;
  END IF;
  
  -- Insert audit log
  INSERT INTO admin_audit_log (
    admin_id,
    admin_email,
    admin_name,
    action_type,
    action_description,
    target_user_id,
    target_user_email,
    target_user_name,
    old_value,
    new_value,
    reason,
    notes,
    severity
  ) VALUES (
    admin_profile.id,
    admin_profile.email,
    admin_profile.full_name,
    p_action_type,
    p_action_description,
    target_profile.id,
    target_profile.email,
    target_profile.full_name,
    p_old_value,
    p_new_value,
    p_reason,
    p_notes,
    p_severity
  )
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. AUDIT LOG VIEWS
-- =====================================================

-- Recent admin actions
CREATE OR REPLACE VIEW recent_admin_actions AS
SELECT 
  aal.id,
  aal.admin_email,
  aal.admin_name,
  aal.action_type,
  aal.action_description,
  aal.target_user_email,
  aal.target_user_name,
  aal.severity,
  aal.performed_at,
  aal.reason
FROM admin_audit_log aal
ORDER BY aal.performed_at DESC
LIMIT 100;

-- Admin activity summary
CREATE OR REPLACE VIEW admin_activity_summary AS
SELECT 
  admin_email,
  admin_name,
  COUNT(*) as total_actions,
  COUNT(*) FILTER (WHERE action_type = 'staff_approved') as approvals,
  COUNT(*) FILTER (WHERE action_type = 'staff_suspended') as suspensions,
  COUNT(*) FILTER (WHERE action_type = 'station_assigned') as station_assignments,
  COUNT(*) FILTER (WHERE severity = 'critical') as critical_actions,
  MAX(performed_at) as last_action_at
FROM admin_audit_log
GROUP BY admin_email, admin_name
ORDER BY total_actions DESC;

-- Staff approval history
CREATE OR REPLACE VIEW staff_approval_history AS
SELECT 
  aal.target_user_email as staff_email,
  aal.target_user_name as staff_name,
  aal.admin_email as approved_by,
  aal.admin_name as approved_by_name,
  aal.performed_at as approved_at,
  aal.reason as approval_reason,
  p.status as current_status
FROM admin_audit_log aal
LEFT JOIN profiles p ON p.id = aal.target_user_id
WHERE aal.action_type = 'staff_approved'
ORDER BY aal.performed_at DESC;

-- =====================================================
-- 7. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON admin_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'
    )
  );

-- Only system can insert audit logs (via triggers/functions)
CREATE POLICY "System can insert audit logs"
  ON admin_audit_log FOR INSERT
  WITH CHECK (true);

-- No updates or deletes (immutable audit log)
CREATE POLICY "No updates to audit logs"
  ON admin_audit_log FOR UPDATE
  USING (false);

CREATE POLICY "No deletes from audit logs"
  ON admin_audit_log FOR DELETE
  USING (false);

-- Grant access to views
GRANT SELECT ON recent_admin_actions TO authenticated;
GRANT SELECT ON admin_activity_summary TO authenticated;
GRANT SELECT ON staff_approval_history TO authenticated;

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Get audit log for specific user
CREATE OR REPLACE FUNCTION get_user_audit_history(p_user_id UUID)
RETURNS TABLE (
  action_type TEXT,
  action_description TEXT,
  admin_email TEXT,
  admin_name TEXT,
  performed_at TIMESTAMP WITH TIME ZONE,
  old_value JSONB,
  new_value JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    aal.action_type,
    aal.action_description,
    aal.admin_email,
    aal.admin_name,
    aal.performed_at,
    aal.old_value,
    aal.new_value
  FROM admin_audit_log aal
  WHERE aal.target_user_id = p_user_id
  ORDER BY aal.performed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get admin action count
CREATE OR REPLACE FUNCTION get_admin_action_count(
  p_admin_email TEXT,
  p_days INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
  action_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO action_count
  FROM admin_audit_log
  WHERE admin_email = p_admin_email
  AND performed_at > NOW() - (p_days || ' days')::INTERVAL;
  
  RETURN action_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. GRANTS
-- =====================================================

GRANT SELECT ON admin_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION create_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_audit_history TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_action_count TO authenticated;

-- =====================================================
-- 10. COMMENTS
-- =====================================================

COMMENT ON TABLE admin_audit_log IS 'Immutable audit log of all administrative actions';
COMMENT ON COLUMN admin_audit_log.admin_id IS 'Administrator who performed the action';
COMMENT ON COLUMN admin_audit_log.action_type IS 'Type of action performed';
COMMENT ON COLUMN admin_audit_log.target_user_id IS 'User affected by the action';
COMMENT ON COLUMN admin_audit_log.old_value IS 'Value before the change';
COMMENT ON COLUMN admin_audit_log.new_value IS 'Value after the change';
COMMENT ON COLUMN admin_audit_log.severity IS 'Severity level of the action';
COMMENT ON COLUMN admin_audit_log.signature IS 'Cryptographic signature for immutability';

COMMENT ON FUNCTION log_admin_action() IS 'Automatically logs administrative actions on profiles';
COMMENT ON FUNCTION log_station_assignment() IS 'Automatically logs station assignments/removals';
COMMENT ON FUNCTION create_audit_log IS 'Manually create an audit log entry';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔══════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                              ║';
  RAISE NOTICE '║   ✅ ADMIN AUDIT LOG SYSTEM CONFIGURED                      ║';
  RAISE NOTICE '║                                                              ║';
  RAISE NOTICE '╚══════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Features:';
  RAISE NOTICE '  ✅ Automatic logging of staff approvals';
  RAISE NOTICE '  ✅ Automatic logging of suspensions';
  RAISE NOTICE '  ✅ Automatic logging of role changes';
  RAISE NOTICE '  ✅ Automatic logging of station assignments';
  RAISE NOTICE '  ✅ Immutable audit trail (no updates/deletes)';
  RAISE NOTICE '  ✅ Admin activity summary views';
  RAISE NOTICE '  ✅ Staff approval history tracking';
  RAISE NOTICE '';
  RAISE NOTICE 'Query Examples:';
  RAISE NOTICE '  -- Recent actions';
  RAISE NOTICE '  SELECT * FROM recent_admin_actions;';
  RAISE NOTICE '';
  RAISE NOTICE '  -- Admin activity';
  RAISE NOTICE '  SELECT * FROM admin_activity_summary;';
  RAISE NOTICE '';
  RAISE NOTICE '  -- Staff approval history';
  RAISE NOTICE '  SELECT * FROM staff_approval_history;';
  RAISE NOTICE '';
END $$;
