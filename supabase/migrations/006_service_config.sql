-- Service Configuration table for external API keys
-- Stores API keys for services like OpenAI, Twilio, etc.

CREATE TABLE IF NOT EXISTS service_config (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(50) UNIQUE NOT NULL,
    api_key TEXT NOT NULL,
    api_secret TEXT, -- For services that need both key and secret
    description TEXT,
    config JSONB DEFAULT '{}'::jsonb, -- Additional configuration
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_service_config_name ON service_config(service_name);

-- Function to update timestamp on modification
CREATE OR REPLACE FUNCTION update_service_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating timestamp
DROP TRIGGER IF EXISTS service_config_updated ON service_config;
CREATE TRIGGER service_config_updated
    BEFORE UPDATE ON service_config
    FOR EACH ROW
    EXECUTE FUNCTION update_service_config_timestamp();

-- Row Level Security - only service role can access
ALTER TABLE service_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to service_config" ON service_config
    FOR ALL USING (auth.role() = 'service_role');

-- Insert default service configurations (keys to be updated)
INSERT INTO service_config (service_name, api_key, description) VALUES
    ('openai', 'placeholder', 'OpenAI ChatGPT API key for Sentinel AI Assistant'),
    ('twilio', 'placeholder', 'Twilio API key for SMS notifications'),
    ('africastalking', 'placeholder', 'Africa''s Talking API key for USSD/SMS')
ON CONFLICT (service_name) DO NOTHING;

COMMENT ON TABLE service_config IS 'Stores external service API keys and configuration';
