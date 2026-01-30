-- Users Table for Africa Railways
-- Stores user profiles with wallet addresses and preferences

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Contact Info
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(100),
    full_name VARCHAR(100),
    
    -- Location
    country VARCHAR(50),
    preferred_currency VARCHAR(3) DEFAULT 'USD',
    
    -- Wallet Addresses
    wallet_address VARCHAR(66), -- SUI wallet address
    afc_address VARCHAR(66), -- AFC token address (same as SUI)
    sent_address VARCHAR(42), -- SENT token address (Polygon)
    afrc_address VARCHAR(42), -- AFRC token address (Polygon)
    
    -- Auth Provider
    auth_provider VARCHAR(20), -- phone, google, facebook, apple, github
    
    -- Verification
    phone_verified BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    
    -- Preferences
    notification_preferences JSONB DEFAULT '{"sms": true, "email": true, "push": true}',
    
    -- Stats
    total_bookings INTEGER DEFAULT 0,
    total_spent_usd DECIMAL(10,2) DEFAULT 0,
    afrc_earned DECIMAL(15,4) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_user_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_updated_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_user_timestamp();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access to users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- Users can view and update their own record
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = auth_id);

-- Allow insert for new users (authenticated or anon for phone login)
CREATE POLICY "Allow user creation" ON users
    FOR INSERT WITH CHECK (true);

-- ============================================
-- UPSERT FUNCTION
-- ============================================

-- Function to upsert user on login
CREATE OR REPLACE FUNCTION upsert_user(
    p_phone VARCHAR DEFAULT NULL,
    p_email VARCHAR DEFAULT NULL,
    p_full_name VARCHAR DEFAULT NULL,
    p_country VARCHAR DEFAULT NULL,
    p_wallet_address VARCHAR DEFAULT NULL,
    p_auth_provider VARCHAR DEFAULT 'phone',
    p_auth_id UUID DEFAULT NULL
)
RETURNS users AS $$
DECLARE
    v_user users;
BEGIN
    -- Try to find existing user by phone or email
    SELECT * INTO v_user FROM users 
    WHERE (p_phone IS NOT NULL AND phone = p_phone)
       OR (p_email IS NOT NULL AND email = p_email)
       OR (p_auth_id IS NOT NULL AND auth_id = p_auth_id)
    LIMIT 1;
    
    IF v_user.id IS NOT NULL THEN
        -- Update existing user
        UPDATE users SET
            email = COALESCE(p_email, email),
            full_name = COALESCE(p_full_name, full_name),
            country = COALESCE(p_country, country),
            wallet_address = COALESCE(p_wallet_address, wallet_address),
            afc_address = COALESCE(p_wallet_address, afc_address),
            auth_id = COALESCE(p_auth_id, auth_id),
            last_login_at = NOW(),
            updated_at = NOW()
        WHERE id = v_user.id
        RETURNING * INTO v_user;
    ELSE
        -- Insert new user
        INSERT INTO users (
            phone, email, full_name, country, 
            wallet_address, afc_address, auth_provider, auth_id,
            last_login_at
        ) VALUES (
            p_phone, p_email, p_full_name, p_country,
            p_wallet_address, p_wallet_address, p_auth_provider, p_auth_id,
            NOW()
        )
        RETURNING * INTO v_user;
    END IF;
    
    RETURN v_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE users IS 'User profiles with wallet addresses and preferences';
COMMENT ON FUNCTION upsert_user IS 'Create or update user on login';
