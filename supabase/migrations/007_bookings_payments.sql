-- Bookings and Payments Schema for Africa Railways
-- Integrates with SUI blockchain for NFT tickets and AFRC payments

-- ============================================
-- BOOKINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_ref VARCHAR(20) UNIQUE NOT NULL, -- BKG-XXXXXX
    ticket_id VARCHAR(30) UNIQUE, -- TKT-TAZARA-XXXXXX
    nft_id VARCHAR(50), -- NFT token ID on SUI
    souvenir_id VARCHAR(50), -- Souvenir NFT ID
    
    -- Passenger Info
    passenger_name VARCHAR(100) NOT NULL,
    passenger_phone VARCHAR(20) NOT NULL,
    passenger_email VARCHAR(100),
    user_id UUID REFERENCES auth.users(id),
    
    -- Wallet Info (SUI blockchain)
    wallet_address VARCHAR(66), -- 0x... SUI address
    wallet_created_from_phone BOOLEAN DEFAULT false,
    
    -- Journey Details
    route VARCHAR(100) NOT NULL,
    from_station VARCHAR(100) NOT NULL,
    to_station VARCHAR(100) NOT NULL,
    travel_date DATE NOT NULL,
    departure_time TIME,
    arrival_time TIME,
    
    -- Ticket Details
    class VARCHAR(20) NOT NULL, -- Economy, Business, First
    seat VARCHAR(20),
    car_number VARCHAR(10),
    passengers INTEGER DEFAULT 1,
    is_return_trip BOOLEAN DEFAULT false,
    return_date DATE,
    
    -- Pricing (stored in multiple currencies)
    base_price_usd DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount_usd DECIMAL(10,2) DEFAULT 0,
    taxes_usd DECIMAL(10,2) DEFAULT 0,
    total_price_usd DECIMAL(10,2) NOT NULL,
    
    -- Local currency conversion
    local_currency VARCHAR(3), -- ZMW, TZS, KES, etc.
    total_price_local DECIMAL(15,2),
    exchange_rate DECIMAL(10,4),
    
    -- AFRC Token pricing
    total_price_afrc DECIMAL(15,4),
    afrc_earned DECIMAL(10,4) DEFAULT 0, -- Loyalty rewards earned
    
    -- Payment Info
    payment_method VARCHAR(30), -- AFRC, mobile_money, card, ussd, bank
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed, refunded
    payment_tx_hash VARCHAR(100), -- Blockchain transaction hash
    payment_provider VARCHAR(30), -- MTN, Airtel, Visa, etc.
    payment_provider_ref VARCHAR(50), -- Provider reference
    
    -- Booking Status
    booking_status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, cancelled, used, expired, no_show
    booking_source VARCHAR(20) NOT NULL, -- web, mobile, ussd, agent, pilot
    
    -- Usage tracking
    checked_in_at TIMESTAMPTZ,
    checked_in_by VARCHAR(50), -- Staff ID
    checked_in_location VARCHAR(100),
    used_at TIMESTAMPTZ,
    used_by VARCHAR(50), -- Staff ID who scanned
    used_location VARCHAR(100), -- Station where used
    
    -- Cancellation/Refund
    cancelled_at TIMESTAMPTZ,
    cancelled_by VARCHAR(50),
    cancellation_reason TEXT,
    refund_amount_usd DECIMAL(10,2),
    refund_status VARCHAR(20), -- pending, processed, rejected
    refund_tx_hash VARCHAR(100),
    
    -- Metadata
    qr_code_data TEXT, -- JSON data encoded in QR
    ipfs_hash VARCHAR(60), -- IPFS hash for NFT metadata
    metadata JSONB DEFAULT '{}', -- Additional metadata
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- Booking expiry if not paid
    
    -- Indexes
    CONSTRAINT valid_booking_status CHECK (booking_status IN ('pending', 'confirmed', 'cancelled', 'used', 'expired', 'no_show')),
    CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(passenger_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_wallet ON bookings(wallet_address);
CREATE INDEX IF NOT EXISTS idx_bookings_ticket ON bookings(ticket_id);
CREATE INDEX IF NOT EXISTS idx_bookings_travel_date ON bookings(travel_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at DESC);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_ref VARCHAR(20) UNIQUE NOT NULL, -- PAY-XXXXXX
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    
    -- Amount
    amount DECIMAL(15,4) NOT NULL,
    currency VARCHAR(10) NOT NULL, -- USD, AFRC, ZMW, TZS, etc.
    amount_usd DECIMAL(10,2), -- Converted to USD
    exchange_rate DECIMAL(10,4),
    
    -- Payment Method
    method VARCHAR(30) NOT NULL, -- AFRC, mobile_money, card, ussd, bank_transfer
    provider VARCHAR(30), -- MTN, Airtel, Visa, Mastercard, etc.
    provider_ref VARCHAR(50), -- Provider transaction reference
    
    -- Blockchain (for AFRC payments)
    tx_hash VARCHAR(100),
    block_number BIGINT,
    from_wallet VARCHAR(66),
    to_wallet VARCHAR(66),
    gas_fee DECIMAL(15,9),
    
    -- Mobile Money specific
    phone_number VARCHAR(20),
    mobile_money_name VARCHAR(50), -- Account holder name
    
    -- Card specific
    card_last_four VARCHAR(4),
    card_brand VARCHAR(20),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed, refunded, reversed
    failure_reason TEXT,
    
    -- Timestamps
    initiated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    CONSTRAINT valid_payment_method CHECK (method IN ('AFRC', 'mobile_money', 'card', 'ussd', 'bank_transfer', 'cash')),
    CONSTRAINT valid_payment_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'reversed'))
);

CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(method);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(initiated_at DESC);

-- ============================================
-- NFT SOUVENIRS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS nft_souvenirs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    souvenir_id VARCHAR(50) UNIQUE NOT NULL, -- SOU-TAZARA-XXXXXX
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    ticket_id VARCHAR(30),
    
    -- NFT Details
    nft_token_id VARCHAR(100), -- On-chain token ID
    wallet_address VARCHAR(66),
    
    -- Artwork
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT,
    ipfs_hash VARCHAR(60),
    
    -- Theme based on route
    theme VARCHAR(50), -- Swahili Coast Sunrise, Copperbelt Pride, etc.
    culture VARCHAR(50), -- Cultural reference
    
    -- Route info
    route VARCHAR(100),
    origin_country VARCHAR(50),
    destination_country VARCHAR(50),
    travel_date DATE,
    
    -- Traits (for NFT metadata)
    traits JSONB DEFAULT '[]',
    
    -- Rarity
    rarity VARCHAR(20) DEFAULT 'Unique', -- Common, Rare, Epic, Legendary, Unique
    
    -- Blockchain
    tx_hash VARCHAR(100),
    minted_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_souvenirs_booking ON nft_souvenirs(booking_id);
CREATE INDEX IF NOT EXISTS idx_souvenirs_wallet ON nft_souvenirs(wallet_address);
CREATE INDEX IF NOT EXISTS idx_souvenirs_ticket ON nft_souvenirs(ticket_id);

-- ============================================
-- AFRC TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS afrc_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_ref VARCHAR(30) UNIQUE NOT NULL, -- AFRC-XXXXXX
    
    -- Wallets
    from_wallet VARCHAR(66),
    to_wallet VARCHAR(66),
    
    -- Amount
    amount DECIMAL(15,4) NOT NULL,
    
    -- Type
    tx_type VARCHAR(30) NOT NULL, -- payment, reward, stake, unstake, transfer, mint
    
    -- Related entities
    booking_id UUID REFERENCES bookings(id),
    user_phone VARCHAR(20),
    
    -- Blockchain
    tx_hash VARCHAR(100),
    block_number BIGINT,
    gas_fee DECIMAL(15,9),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, failed
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    
    -- Metadata
    description TEXT,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_afrc_from_wallet ON afrc_transactions(from_wallet);
CREATE INDEX IF NOT EXISTS idx_afrc_to_wallet ON afrc_transactions(to_wallet);
CREATE INDEX IF NOT EXISTS idx_afrc_booking ON afrc_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_afrc_type ON afrc_transactions(tx_type);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_ref()
RETURNS VARCHAR(20) AS $$
DECLARE
    ref VARCHAR(20);
BEGIN
    ref := 'BKG-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    RETURN ref;
END;
$$ LANGUAGE plpgsql;

-- Generate ticket ID
CREATE OR REPLACE FUNCTION generate_ticket_id()
RETURNS VARCHAR(30) AS $$
DECLARE
    ref VARCHAR(30);
BEGIN
    ref := 'TKT-TAZARA-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    RETURN ref;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate refs on insert
CREATE OR REPLACE FUNCTION set_booking_refs()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_ref IS NULL THEN
        NEW.booking_ref := generate_booking_ref();
    END IF;
    IF NEW.ticket_id IS NULL THEN
        NEW.ticket_id := generate_ticket_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_refs_trigger
    BEFORE INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION set_booking_refs();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_booking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_updated_trigger
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_booking_timestamp();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_souvenirs ENABLE ROW LEVEL SECURITY;
ALTER TABLE afrc_transactions ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access to bookings" ON bookings
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to payments" ON payments
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to souvenirs" ON nft_souvenirs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to afrc_transactions" ON afrc_transactions
    FOR ALL USING (auth.role() = 'service_role');

-- Users can view their own bookings
CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own souvenirs" ON nft_souvenirs
    FOR SELECT USING (wallet_address IN (
        SELECT wallet_address FROM bookings WHERE user_id = auth.uid()
    ));

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE bookings IS 'Railway ticket bookings with NFT integration';
COMMENT ON TABLE payments IS 'Payment transactions for bookings';
COMMENT ON TABLE nft_souvenirs IS 'NFT artwork souvenirs generated for each journey';
COMMENT ON TABLE afrc_transactions IS 'AFRC token transactions on SUI blockchain';
