-- Update subscription plans with Sentinel branding
-- Migration: 002_sentinel_plans.sql

-- Clear existing plans
DELETE FROM subscription_plans;

-- Insert Sentinel-branded plans
INSERT INTO subscription_plans (id, name, description, price, currency, billing_cycle, features, active) VALUES
(
  'sentinel_trader',
  'Sentinel Trader',
  'For cross-border traders',
  50.00,
  'ZMW',
  'monthly',
  '{
    "unlimited_bookings": true,
    "zero_convenience_fees": true,
    "priority_luggage_tracking": true,
    "sms_notifications": true,
    "priority_support": true,
    "savings_per_month": 130,
    "target_audience": "Cross-border traders",
    "badge": "MOST POPULAR"
  }'::jsonb,
  true
),
(
  'sentinel_commuter',
  'Sentinel Commuter',
  'For daily riders (Dar/Lusaka)',
  120.00,
  'ZMW',
  'monthly',
  '{
    "unlimited_bookings": true,
    "quick_scan_qr_bypass": true,
    "priority_boarding": true,
    "sms_notifications": true,
    "express_check_in": true,
    "savings_per_month": 250,
    "target_audience": "Daily riders (Dar/Lusaka)",
    "badge": "BEST VALUE"
  }'::jsonb,
  true
),
(
  'sentinel_voyager',
  'Sentinel Voyager',
  'For international tourists',
  250.00,
  'ZMW',
  'one-time',
  '{
    "first_class_lounge_access": true,
    "victoria_falls_tour_discounts": true,
    "travel_insurance": true,
    "priority_booking": true,
    "concierge_service": true,
    "hotel_partnerships": true,
    "savings_per_trip": 100,
    "target_audience": "International tourists",
    "badge": "PREMIUM"
  }'::jsonb,
  true
);

-- Add billing_cycle column if not exists
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'monthly';

-- Add plan_features column for quick access
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS plan_features JSONB;

-- Create index for faster plan lookups
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(active);

-- Create view for active subscriptions with plan details
CREATE OR REPLACE VIEW active_subscriptions_with_plans AS
SELECT 
  s.id,
  s.user_id,
  s.plan_id,
  sp.name as plan_name,
  sp.price as plan_price,
  sp.features as plan_features,
  s.status,
  s.start_date,
  s.next_billing_date,
  s.payment_method,
  s.phone_number,
  s.billing_cycle,
  s.created_at
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.status = 'active';

-- Add usage tracking table
CREATE TABLE IF NOT EXISTS subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  booking_id UUID,
  usage_type VARCHAR(50) NOT NULL, -- 'booking', 'qr_scan', 'lounge_access', etc.
  usage_date TIMESTAMP DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_usage_subscription_id ON subscription_usage(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_user_id ON subscription_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_date ON subscription_usage(usage_date);

-- Add function to calculate monthly savings
CREATE OR REPLACE FUNCTION calculate_monthly_savings(p_subscription_id UUID)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
  v_bookings_count INTEGER;
  v_plan_price DECIMAL(10, 2);
  v_pay_per_use_fee DECIMAL(10, 2) := 15.00;
  v_savings DECIMAL(10, 2);
BEGIN
  -- Get bookings count for current month
  SELECT COUNT(*) INTO v_bookings_count
  FROM subscription_usage
  WHERE subscription_id = p_subscription_id
    AND usage_type = 'booking'
    AND usage_date >= DATE_TRUNC('month', CURRENT_DATE);
  
  -- Get plan price
  SELECT sp.price INTO v_plan_price
  FROM subscriptions s
  JOIN subscription_plans sp ON s.plan_id = sp.id
  WHERE s.id = p_subscription_id;
  
  -- Calculate savings
  v_savings := (v_bookings_count * v_pay_per_use_fee) - v_plan_price;
  
  RETURN GREATEST(v_savings, 0);
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update subscription usage stats
CREATE OR REPLACE FUNCTION update_subscription_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update subscription metadata with usage stats
  UPDATE subscriptions
  SET metadata = COALESCE(metadata, '{}'::jsonb) || 
    jsonb_build_object(
      'bookings_count', (
        SELECT COUNT(*) 
        FROM subscription_usage 
        WHERE subscription_id = NEW.subscription_id 
          AND usage_type = 'booking'
          AND usage_date >= DATE_TRUNC('month', CURRENT_DATE)
      ),
      'last_usage', NOW()
    )
  WHERE id = NEW.subscription_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscription_stats
AFTER INSERT ON subscription_usage
FOR EACH ROW
EXECUTE FUNCTION update_subscription_stats();

-- Add promotional codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed_amount', 'free_trial_extension'
  discount_value DECIMAL(10, 2) NOT NULL,
  applicable_plans TEXT[], -- Array of plan IDs
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,
  active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(active);

-- Insert sample promo codes
INSERT INTO promo_codes (code, discount_type, discount_value, applicable_plans, max_uses, valid_until) VALUES
('TRADER50', 'percentage', 50, ARRAY['sentinel_trader'], 100, NOW() + INTERVAL '30 days'),
('COMMUTER30', 'percentage', 30, ARRAY['sentinel_commuter'], 50, NOW() + INTERVAL '30 days'),
('VOYAGER100', 'fixed_amount', 100, ARRAY['sentinel_voyager'], 200, NOW() + INTERVAL '60 days');

-- Add promo code tracking to transactions
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES promo_codes(id);

-- Migration complete
SELECT 'Sentinel plans migration completed successfully' as status;
