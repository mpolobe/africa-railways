-- Notification System Schema for Africa Railways
-- This adds notification tiers, preferences, and logging to the existing Supabase database

-- Add wallet columns for multi-chain support (AFC on SUI, SENT/AFRC on Polygon)
ALTER TABLE users ADD COLUMN IF NOT EXISTS afc_address TEXT; -- SUI blockchain - auto-generated
ALTER TABLE users ADD COLUMN IF NOT EXISTS afrc_address TEXT; -- Polygon blockchain - user editable
ALTER TABLE users ADD COLUMN IF NOT EXISTS sent_address TEXT; -- Polygon blockchain - user editable

-- Add notification columns to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_tier TEXT DEFAULT 'free' CHECK (notification_tier IN ('free', 'standard', 'premium', 'business'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"in_app": true, "email": false, "sms": false, "push": false, "whatsapp": false}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'active', 'canceled', 'past_due'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

-- Notification subscription plans
CREATE TABLE IF NOT EXISTS notification_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- 'free', 'standard', 'premium', 'business'
    display_name TEXT NOT NULL,
    price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
    stripe_price_id_monthly TEXT,
    stripe_price_id_yearly TEXT,
    features JSONB NOT NULL DEFAULT '[]',
    alert_delay_minutes INTEGER DEFAULT 30, -- How far in advance alerts are sent
    channels_allowed TEXT[] DEFAULT ARRAY['in_app'],
    max_custom_alerts INTEGER DEFAULT 0,
    priority_support BOOLEAN DEFAULT FALSE,
    api_access BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plans
INSERT INTO notification_plans (name, display_name, price_monthly, price_yearly, features, alert_delay_minutes, channels_allowed, max_custom_alerts, priority_support, api_access) VALUES
('free', 'Free', 0, 0, 
 '["Basic delay notifications", "In-app alerts only", "30 min advance notice"]',
 30, ARRAY['in_app'], 0, FALSE, FALSE),
('standard', 'Standard', 2.00, 20.00,
 '["Real-time alerts", "Email notifications", "15 min advance notice", "5 custom station alerts"]',
 15, ARRAY['in_app', 'email', 'push'], 5, FALSE, FALSE),
('premium', 'Premium', 5.00, 50.00,
 '["Instant alerts", "SMS & WhatsApp", "Unlimited custom alerts", "Priority boarding alerts", "Price drop notifications"]',
 0, ARRAY['in_app', 'email', 'push', 'sms', 'whatsapp'], -1, TRUE, FALSE),
('business', 'Business', 15.00, 150.00,
 '["Everything in Premium", "API access", "Bulk notifications", "Freight tracking", "Dedicated support", "Analytics dashboard"]',
 0, ARRAY['in_app', 'email', 'push', 'sms', 'whatsapp'], -1, TRUE, TRUE)
ON CONFLICT (name) DO NOTHING;

-- User station alerts (for custom tracking)
CREATE TABLE IF NOT EXISTS user_station_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    station_code TEXT NOT NULL,
    station_name TEXT NOT NULL,
    alert_types TEXT[] DEFAULT ARRAY['delay', 'arrival', 'departure'],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, station_code)
);

-- Notification logs (for analytics and billing)
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notification_type TEXT NOT NULL, -- 'delay', 'arrival', 'departure', 'price_alert', 'booking', 'custom'
    channel TEXT NOT NULL, -- 'in_app', 'email', 'sms', 'push', 'whatsapp'
    station_code TEXT,
    train_id TEXT,
    route_name TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    cost DECIMAL(10,4) DEFAULT 0, -- Track SMS/WhatsApp costs
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Station notifications (broadcast alerts)
CREATE TABLE IF NOT EXISTS station_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_code TEXT NOT NULL,
    station_name TEXT NOT NULL,
    notification_type TEXT NOT NULL, -- 'delay', 'cancellation', 'platform_change', 'announcement'
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    train_id TEXT,
    route_name TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    affected_departure_time TIMESTAMPTZ,
    delay_minutes INTEGER,
    new_platform TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription history
CREATE TABLE IF NOT EXISTS subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    action TEXT NOT NULL, -- 'subscribed', 'upgraded', 'downgraded', 'canceled', 'renewed'
    stripe_subscription_id TEXT,
    stripe_invoice_id TEXT,
    amount_paid DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    billing_period TEXT, -- 'monthly', 'yearly'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_user_station_alerts_user_id ON user_station_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_station_alerts_station ON user_station_alerts(station_code);
CREATE INDEX IF NOT EXISTS idx_station_notifications_station ON station_notifications(station_code);
CREATE INDEX IF NOT EXISTS idx_station_notifications_active ON station_notifications(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_notification_tier ON users(notification_tier);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE user_station_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own station alerts" ON user_station_alerts
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage their own station alerts" ON user_station_alerts
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own notification logs" ON notification_logs
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own subscription history" ON subscription_history
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Public read access for station notifications and plans
CREATE POLICY "Anyone can view station notifications" ON station_notifications
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Anyone can view notification plans" ON notification_plans
    FOR SELECT USING (TRUE);

-- Function to check if user can use a notification channel
CREATE OR REPLACE FUNCTION can_use_channel(user_tier TEXT, channel TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM notification_plans 
        WHERE name = user_tier 
        AND channel = ANY(channels_allowed)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get user's remaining custom alert slots
CREATE OR REPLACE FUNCTION get_remaining_alert_slots(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    max_alerts INTEGER;
    current_alerts INTEGER;
BEGIN
    SELECT np.max_custom_alerts INTO max_alerts
    FROM users u
    JOIN notification_plans np ON u.notification_tier = np.name
    WHERE u.id = p_user_id;
    
    IF max_alerts = -1 THEN
        RETURN -1; -- Unlimited
    END IF;
    
    SELECT COUNT(*) INTO current_alerts
    FROM user_station_alerts
    WHERE user_id = p_user_id AND is_active = TRUE;
    
    RETURN GREATEST(0, max_alerts - current_alerts);
END;
$$ LANGUAGE plpgsql;
