-- =====================================================
-- OCC Security Schema Migration
-- =====================================================
-- Purpose: Set up authentication and authorization for OCC portal
-- Created: 2024-12-30
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  phone_number TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'station_master', 'operator', 'staff')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended', 'revoked')),
  sui_address TEXT,
  alchemy_account TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if table already exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'staff' 
      CHECK (role IN ('admin', 'station_master', 'operator', 'staff'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'status') THEN
    ALTER TABLE profiles ADD COLUMN status TEXT DEFAULT 'pending' 
      CHECK (status IN ('pending', 'approved', 'suspended', 'revoked'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'alchemy_account') THEN
    ALTER TABLE profiles ADD COLUMN alchemy_account TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'last_login') THEN
    ALTER TABLE profiles ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- =====================================================
-- 2. MASTER ADMIN SETUP
-- =====================================================

-- Insert or update master admin account
INSERT INTO profiles (
  email, 
  phone_number, 
  full_name,
  role, 
  status,
  created_at,
  updated_at
)
VALUES (
  'admin@africarailways.com',
  '+260000000000',  -- Replace with actual admin phone
  'System Administrator',
  'admin',
  'approved',
  NOW(),
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
  role = 'admin',
  status = 'approved',
  updated_at = NOW();

-- =====================================================
-- 3. STAFF STATIONS (Location-based access)
-- =====================================================

CREATE TABLE IF NOT EXISTS staff_stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  station_code TEXT NOT NULL,
  station_name TEXT NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(staff_id, station_code)
);

CREATE INDEX IF NOT EXISTS idx_staff_stations_staff ON staff_stations(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_stations_code ON staff_stations(station_code);

-- =====================================================
-- 4. TRAIN OPERATIONS (Audit Log)
-- =====================================================

CREATE TABLE IF NOT EXISTS train_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  train_id TEXT NOT NULL,
  station_code TEXT NOT NULL,
  operator_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  action_type TEXT CHECK (action_type IN ('start', 'stop', 'route_change', 'emergency', 'maintenance')),
  details JSONB,
  signature TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_train_ops_train ON train_operations(train_id);
CREATE INDEX IF NOT EXISTS idx_train_ops_station ON train_operations(station_code);
CREATE INDEX IF NOT EXISTS idx_train_ops_operator ON train_operations(operator_id);
CREATE INDEX IF NOT EXISTS idx_train_ops_timestamp ON train_operations(timestamp DESC);

-- =====================================================
-- 5. AUTHENTICATION LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS auth_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  phone_number TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('otp_sent', 'otp_verified', 'login_success', 'login_failed', 'logout')),
  ip_address INET,
  user_agent TEXT,
  location_data JSONB,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_logs_user ON auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_phone ON auth_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_auth_logs_timestamp ON auth_logs(timestamp DESC);

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE train_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Staff can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can approve staff" ON profiles;
DROP POLICY IF EXISTS "Master admin can approve staff" ON profiles;
DROP POLICY IF EXISTS "Staff can view own stations" ON staff_stations;
DROP POLICY IF EXISTS "Admins can manage stations" ON staff_stations;
DROP POLICY IF EXISTS "Station-based train operations" ON train_operations;
DROP POLICY IF EXISTS "Admins can view all operations" ON train_operations;
DROP POLICY IF EXISTS "Staff can view own auth logs" ON auth_logs;
DROP POLICY IF EXISTS "Admins can view all auth logs" ON auth_logs;

-- PROFILES POLICIES
CREATE POLICY "Staff can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'
    )
  );

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'
    )
  );

-- Only master admin can approve staff (critical security policy)
CREATE POLICY "Master admin can approve staff"
  ON profiles FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'admin@africarailways.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@africarailways.com');

-- STAFF STATIONS POLICIES
CREATE POLICY "Staff can view own stations"
  ON staff_stations FOR SELECT
  USING (staff_id = auth.uid());

CREATE POLICY "Admins can manage stations"
  ON staff_stations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'
    )
  );

-- TRAIN OPERATIONS POLICIES
CREATE POLICY "Station-based train operations"
  ON train_operations FOR ALL
  USING (
    -- Staff can only operate trains at their assigned stations
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN staff_stations ss ON p.id = ss.staff_id
      WHERE p.id = auth.uid()
      AND p.status = 'approved'
      AND ss.station_code = train_operations.station_code
    )
    OR
    -- Admins can access all operations
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'
    )
  );

CREATE POLICY "Admins can view all operations"
  ON train_operations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'
    )
  );

-- AUTH LOGS POLICIES
CREATE POLICY "Staff can view own auth logs"
  ON auth_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all auth logs"
  ON auth_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'
    )
  );

-- =====================================================
-- 7. FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to log authentication events
CREATE OR REPLACE FUNCTION log_auth_event(
  p_user_id UUID,
  p_phone_number TEXT,
  p_event_type TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO auth_logs (
    user_id,
    phone_number,
    event_type,
    ip_address,
    user_agent,
    success,
    error_message
  ) VALUES (
    p_user_id,
    p_phone_number,
    p_event_type,
    p_ip_address,
    p_user_agent,
    p_success,
    p_error_message
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has access to station
CREATE OR REPLACE FUNCTION has_station_access(
  p_user_id UUID,
  p_station_code TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles p
    LEFT JOIN staff_stations ss ON p.id = ss.staff_id
    WHERE p.id = p_user_id
    AND p.status = 'approved'
    AND (
      p.role = 'admin'  -- Admins have access to all stations
      OR ss.station_code = p_station_code  -- Staff have access to assigned stations
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. SAMPLE DATA (Development/Testing)
-- =====================================================

-- Insert sample stations (uncomment for development)
-- INSERT INTO staff_stations (staff_id, station_code, station_name)
-- SELECT 
--   (SELECT id FROM profiles WHERE email = 'admin@africarailways.com'),
--   code,
--   name
-- FROM (VALUES
--   ('LUS', 'Lusaka Central'),
--   ('KMP', 'Kapiri Mposhi'),
--   ('NDL', 'Ndola'),
--   ('KIT', 'Kitwe'),
--   ('DAR', 'Dar es Salaam')
-- ) AS stations(code, name)
-- ON CONFLICT (staff_id, station_code) DO NOTHING;

-- =====================================================
-- 9. GRANTS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON staff_stations TO authenticated;
GRANT SELECT, INSERT ON train_operations TO authenticated;
GRANT SELECT, INSERT ON auth_logs TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION log_auth_event TO authenticated;
GRANT EXECUTE ON FUNCTION has_station_access TO authenticated;

-- =====================================================
-- 10. COMMENTS
-- =====================================================

COMMENT ON TABLE profiles IS 'User profiles with role-based access control';
COMMENT ON TABLE staff_stations IS 'Maps staff members to their assigned railway stations';
COMMENT ON TABLE train_operations IS 'Immutable audit log of all train operations';
COMMENT ON TABLE auth_logs IS 'Authentication event logs for security monitoring';

COMMENT ON COLUMN profiles.role IS 'User role: admin, station_master, operator, or staff';
COMMENT ON COLUMN profiles.status IS 'Account status: pending, approved, suspended, or revoked';
COMMENT ON COLUMN profiles.alchemy_account IS 'Alchemy Smart Contract Account address';
COMMENT ON COLUMN train_operations.signature IS 'Cryptographic signature of the operation';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify master admin was created
DO $$
DECLARE
  v_admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_admin_count
  FROM profiles
  WHERE email = 'admin@africarailways.com' AND role = 'admin' AND status = 'approved';
  
  IF v_admin_count = 0 THEN
    RAISE EXCEPTION 'Master admin account was not created successfully';
  ELSE
    RAISE NOTICE 'Master admin account verified: admin@africarailways.com';
  END IF;
END $$;
