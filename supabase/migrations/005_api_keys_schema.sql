-- API Keys Schema for Africa Railways Developer Portal
-- Stores generated API keys for operators and developers

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_name TEXT,
    
    -- Key details
    key_type TEXT NOT NULL CHECK (key_type IN ('railways', 'africoin', 'operator')),
    key_prefix TEXT NOT NULL, -- 'rw_', 'ac_', 'op_'
    key_hash TEXT NOT NULL, -- SHA256 hash of the actual key
    key_hint TEXT NOT NULL, -- Last 4 characters for identification
    
    -- Operator association (optional)
    operator_id TEXT,
    operator_name TEXT,
    
    -- Metadata
    name TEXT, -- User-defined name for the key
    description TEXT,
    
    -- Permissions
    permissions JSONB DEFAULT '{"read": true, "write": false, "admin": false}'::jsonb,
    rate_limit INTEGER DEFAULT 1000, -- Requests per hour
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,
    
    -- Expiry
    expires_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

-- Index for fast lookups
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_user_email ON api_keys(user_email);
CREATE INDEX idx_api_keys_operator_id ON api_keys(operator_id);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);

-- API Key Usage Log
CREATE TABLE IF NOT EXISTS api_key_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
    
    -- Request details
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    
    -- Client info
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for usage analytics
CREATE INDEX idx_api_key_usage_key_id ON api_key_usage(api_key_id);
CREATE INDEX idx_api_key_usage_created_at ON api_key_usage(created_at);

-- Function to update usage count
CREATE OR REPLACE FUNCTION update_api_key_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE api_keys 
    SET 
        usage_count = usage_count + 1,
        last_used_at = NOW()
    WHERE id = NEW.api_key_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update usage
CREATE TRIGGER trigger_update_api_key_usage
    AFTER INSERT ON api_key_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_api_key_usage();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER trigger_api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_api_keys_updated_at();

-- Row Level Security
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_usage ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see their own keys
CREATE POLICY "Users can view own api_keys" ON api_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own api_keys" ON api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own api_keys" ON api_keys
    FOR UPDATE USING (auth.uid() = user_id);

-- Service role can do everything (for backend)
CREATE POLICY "Service role full access to api_keys" ON api_keys
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to api_key_usage" ON api_key_usage
    FOR ALL USING (auth.role() = 'service_role');

-- View for API key stats
CREATE OR REPLACE VIEW api_key_stats AS
SELECT 
    ak.id,
    ak.user_email,
    ak.key_type,
    ak.key_hint,
    ak.operator_name,
    ak.is_active,
    ak.usage_count,
    ak.last_used_at,
    ak.created_at,
    ak.expires_at,
    COUNT(aku.id) as requests_today
FROM api_keys ak
LEFT JOIN api_key_usage aku ON ak.id = aku.api_key_id 
    AND aku.created_at > NOW() - INTERVAL '24 hours'
GROUP BY ak.id;

-- Grant access to authenticated users
GRANT SELECT ON api_key_stats TO authenticated;

COMMENT ON TABLE api_keys IS 'Stores API keys for Africa Railways developer portal';
COMMENT ON TABLE api_key_usage IS 'Logs API key usage for analytics and rate limiting';
