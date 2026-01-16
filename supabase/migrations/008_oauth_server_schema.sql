-- =====================================================
-- Migration 008: OAuth 2.1 Server Schema
-- =====================================================
-- Enables third-party railway operators to authenticate
-- and access Africa Railways API via OAuth 2.1
-- =====================================================

-- =====================================================
-- 1. OAuth Clients Table
-- =====================================================
CREATE TABLE IF NOT EXISTS oauth_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT UNIQUE NOT NULL,
  client_secret TEXT NOT NULL,
  client_type TEXT NOT NULL DEFAULT 'confidential' CHECK (client_type IN ('public', 'confidential')),
  operator_name TEXT NOT NULL,
  operator_country TEXT,
  operator_type TEXT CHECK (operator_type IN ('national_railway', 'private_operator', 'logistics', 'booking_platform')),
  operator_logo_url TEXT,
  redirect_uris TEXT[] NOT NULL,
  allowed_scopes TEXT[] DEFAULT ARRAY['openid', 'email', 'profile', 'read:tickets', 'read:routes'],
  is_active BOOLEAN DEFAULT true,
  token_expiry_seconds INTEGER DEFAULT 3600,
  refresh_token_expiry_days INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_clients_client_id ON oauth_clients(client_id);

-- =====================================================
-- 2. OAuth Scopes Table
-- =====================================================
CREATE TABLE IF NOT EXISTS oauth_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_name TEXT UNIQUE NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL,
  permission_level TEXT NOT NULL CHECK (permission_level IN ('read', 'write', 'admin')),
  is_sensitive BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert standard OAuth/OIDC scopes
INSERT INTO oauth_scopes (scope_name, description, resource_type, permission_level, is_sensitive)
VALUES
  ('openid', 'Verify user identity', 'identity', 'read', false),
  ('email', 'Access email address', 'identity', 'read', false),
  ('profile', 'Access name and profile info', 'identity', 'read', false),
  ('phone', 'Access phone number', 'identity', 'read', true)
ON CONFLICT (scope_name) DO NOTHING;

-- Insert Africa Railways specific scopes
INSERT INTO oauth_scopes (scope_name, description, resource_type, permission_level, is_sensitive)
VALUES
  ('read:tickets', 'Read ticket information and QR codes', 'tickets', 'read', false),
  ('write:tickets', 'Create and validate tickets', 'tickets', 'write', true),
  ('read:bookings', 'Read booking information', 'bookings', 'read', false),
  ('write:bookings', 'Create and modify bookings', 'bookings', 'write', true),
  ('read:routes', 'Read route and schedule information', 'routes', 'read', false),
  ('write:routes', 'Update route information', 'routes', 'write', true),
  ('read:payments', 'Read payment and transaction data', 'payments', 'read', true),
  ('write:payments', 'Process payments and refunds', 'payments', 'write', true),
  ('read:africoin', 'Read Africoin wallet balances', 'africoin', 'read', false),
  ('write:africoin', 'Transfer Africoin tokens', 'africoin', 'write', true),
  ('read:analytics', 'Access analytics and reports', 'analytics', 'read', false),
  ('admin:operator', 'Full operator administration', 'operator', 'admin', true)
ON CONFLICT (scope_name) DO NOTHING;

-- =====================================================
-- 3. OAuth Authorization Codes Table
-- =====================================================
CREATE TABLE IF NOT EXISTS oauth_authorization_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  client_id TEXT NOT NULL REFERENCES oauth_clients(client_id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  redirect_uri TEXT NOT NULL,
  scopes TEXT[] NOT NULL,
  code_challenge TEXT,
  code_challenge_method TEXT CHECK (code_challenge_method IN ('S256', 'plain')),
  state TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_auth_codes_code ON oauth_authorization_codes(code);

-- =====================================================
-- 4. OAuth Access Tokens Table
-- =====================================================
CREATE TABLE IF NOT EXISTS oauth_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT UNIQUE NOT NULL,
  client_id TEXT NOT NULL REFERENCES oauth_clients(client_id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  scopes TEXT[] NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_hash ON oauth_access_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user ON oauth_access_tokens(user_id);

-- =====================================================
-- 5. OAuth Refresh Tokens Table
-- =====================================================
CREATE TABLE IF NOT EXISTS oauth_refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT UNIQUE NOT NULL,
  access_token_id UUID REFERENCES oauth_access_tokens(id),
  client_id TEXT NOT NULL REFERENCES oauth_clients(client_id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  scopes TEXT[] NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_refresh_tokens_hash ON oauth_refresh_tokens(token_hash);

-- =====================================================
-- 6. OAuth Consent Records Table
-- =====================================================
CREATE TABLE IF NOT EXISTS oauth_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  client_id TEXT NOT NULL REFERENCES oauth_clients(client_id),
  scopes TEXT[] NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  UNIQUE(user_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_consents_user_client ON oauth_consents(user_id, client_id);

-- =====================================================
-- 7. OAuth Audit Log Table
-- =====================================================
CREATE TABLE IF NOT EXISTS oauth_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  client_id TEXT,
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_audit_created ON oauth_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_oauth_audit_client ON oauth_audit_log(client_id);
CREATE INDEX IF NOT EXISTS idx_oauth_audit_event ON oauth_audit_log(event_type);

-- =====================================================
-- 8. Row Level Security Policies
-- =====================================================

ALTER TABLE oauth_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_authorization_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_audit_log ENABLE ROW LEVEL SECURITY;

-- Scopes are public read
CREATE POLICY "Scopes are publicly readable" ON oauth_scopes
  FOR SELECT USING (true);

-- Users can view their own consents
CREATE POLICY "Users can view own consents" ON oauth_consents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can revoke own consents" ON oauth_consents
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can view their own tokens
CREATE POLICY "Users can view own tokens" ON oauth_access_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role full access clients" ON oauth_clients
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access codes" ON oauth_authorization_codes
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access tokens" ON oauth_access_tokens
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access refresh" ON oauth_refresh_tokens
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access audit" ON oauth_audit_log
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- 9. Sample Railway Operator Clients
-- =====================================================

-- Kenya Railways Corporation
INSERT INTO oauth_clients (
  client_id, client_secret, client_type, operator_name, operator_country, 
  operator_type, redirect_uris, allowed_scopes
) VALUES (
  'kenya_railways_prod',
  'kr_secret_' || encode(gen_random_bytes(32), 'hex'),
  'confidential',
  'Kenya Railways Corporation',
  'Kenya',
  'national_railway',
  ARRAY['https://krc.co.ke/oauth/callback', 'https://api.krc.co.ke/auth/callback', 'http://localhost:3000/oauth/callback'],
  ARRAY['openid', 'email', 'profile', 'read:tickets', 'write:tickets', 'read:bookings', 'write:bookings', 'read:routes', 'read:africoin']
) ON CONFLICT (client_id) DO NOTHING;

-- Egyptian National Railways
INSERT INTO oauth_clients (
  client_id, client_secret, client_type, operator_name, operator_country,
  operator_type, redirect_uris, allowed_scopes
) VALUES (
  'egyptian_railways_prod',
  'er_secret_' || encode(gen_random_bytes(32), 'hex'),
  'confidential',
  'Egyptian National Railways',
  'Egypt',
  'national_railway',
  ARRAY['https://enr.gov.eg/oauth/callback', 'http://localhost:3000/oauth/callback'],
  ARRAY['openid', 'email', 'read:tickets', 'write:bookings', 'read:routes', 'read:payments']
) ON CONFLICT (client_id) DO NOTHING;

-- TAZARA (Tanzania-Zambia Railway)
INSERT INTO oauth_clients (
  client_id, client_secret, client_type, operator_name, operator_country,
  operator_type, redirect_uris, allowed_scopes
) VALUES (
  'tazara_prod',
  'tz_secret_' || encode(gen_random_bytes(32), 'hex'),
  'confidential',
  'TAZARA - Tanzania Zambia Railway Authority',
  'Tanzania/Zambia',
  'national_railway',
  ARRAY['https://tazara.co.tz/oauth/callback', 'https://tazara.co.zm/oauth/callback', 'http://localhost:3000/oauth/callback'],
  ARRAY['openid', 'email', 'profile', 'read:tickets', 'write:tickets', 'read:bookings', 'write:bookings', 'read:routes', 'read:africoin', 'write:africoin']
) ON CONFLICT (client_id) DO NOTHING;

-- Transnet Freight Rail (South Africa)
INSERT INTO oauth_clients (
  client_id, client_secret, client_type, operator_name, operator_country,
  operator_type, redirect_uris, allowed_scopes
) VALUES (
  'transnet_prod',
  'tn_secret_' || encode(gen_random_bytes(32), 'hex'),
  'confidential',
  'Transnet Freight Rail',
  'South Africa',
  'national_railway',
  ARRAY['https://transnet.co.za/oauth/callback', 'http://localhost:3000/oauth/callback'],
  ARRAY['openid', 'email', 'read:tickets', 'write:bookings', 'read:routes', 'read:analytics']
) ON CONFLICT (client_id) DO NOTHING;

-- Bolt Africa (Booking Platform)
INSERT INTO oauth_clients (
  client_id, client_secret, client_type, operator_name, operator_country,
  operator_type, redirect_uris, allowed_scopes
) VALUES (
  'bolt_africa_prod',
  'ba_secret_' || encode(gen_random_bytes(32), 'hex'),
  'confidential',
  'Bolt Africa Transport',
  'Pan-African',
  'booking_platform',
  ARRAY['https://bolt.eu/africa/oauth/callback', 'http://localhost:3000/oauth/callback'],
  ARRAY['openid', 'email', 'profile', 'read:tickets', 'write:bookings', 'read:routes', 'write:payments', 'read:africoin', 'write:africoin']
) ON CONFLICT (client_id) DO NOTHING;

-- =====================================================
-- 10. Helper Functions
-- =====================================================

-- Validate client credentials
CREATE OR REPLACE FUNCTION validate_oauth_client(
  p_client_id TEXT,
  p_client_secret TEXT DEFAULT NULL,
  p_redirect_uri TEXT DEFAULT NULL
)
RETURNS TABLE (
  is_valid BOOLEAN,
  client_name TEXT,
  allowed_scopes TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN c.client_type = 'public' THEN true
      WHEN c.client_secret = p_client_secret THEN true
      ELSE false
    END AS is_valid,
    c.operator_name AS client_name,
    c.allowed_scopes
  FROM oauth_clients c
  WHERE c.client_id = p_client_id
    AND c.is_active = true
    AND (p_redirect_uri IS NULL OR p_redirect_uri = ANY(c.redirect_uris));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check user consent
CREATE OR REPLACE FUNCTION check_user_consent(
  p_user_id UUID,
  p_client_id TEXT,
  p_scopes TEXT[]
)
RETURNS BOOLEAN AS $$
DECLARE
  consented_scopes TEXT[];
BEGIN
  SELECT scopes INTO consented_scopes
  FROM oauth_consents
  WHERE user_id = p_user_id 
    AND client_id = p_client_id
    AND revoked_at IS NULL;
  
  IF consented_scopes IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN p_scopes <@ consented_scopes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log OAuth events
CREATE OR REPLACE FUNCTION log_oauth_event(
  p_event_type TEXT,
  p_client_id TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO oauth_audit_log (event_type, client_id, user_id, details, success, error_message)
  VALUES (p_event_type, p_client_id, p_user_id, p_details, p_success, p_error_message);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup expired tokens (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_tokens()
RETURNS void AS $$
BEGIN
  -- Delete expired authorization codes
  DELETE FROM oauth_authorization_codes 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
  
  -- Delete expired access tokens
  DELETE FROM oauth_access_tokens 
  WHERE expires_at < NOW() - INTERVAL '7 days';
  
  -- Delete expired refresh tokens
  DELETE FROM oauth_refresh_tokens 
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Done! OAuth Server schema is ready.
-- =====================================================
