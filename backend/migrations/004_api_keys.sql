-- API Keys configuration table
-- Stores external API keys securely in the database

CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(50) UNIQUE NOT NULL,
    api_key TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_service ON api_keys(service_name);

-- Insert OpenAI key placeholder (to be updated with actual key)
INSERT INTO api_keys (service_name, api_key, description) 
VALUES ('openai', 'placeholder', 'OpenAI ChatGPT API key for Sentinel AI Assistant')
ON CONFLICT (service_name) DO NOTHING;

-- Function to update timestamp on modification
CREATE OR REPLACE FUNCTION update_api_keys_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating timestamp
DROP TRIGGER IF EXISTS api_keys_updated ON api_keys;
CREATE TRIGGER api_keys_updated
    BEFORE UPDATE ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_api_keys_timestamp();
