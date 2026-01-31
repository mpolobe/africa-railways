-- Train Schedules Schema for Africa Railways
-- Real schedules from TAZARA, ZRL, Kenya SGR, Gautrain

-- ============================================
-- OPERATORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS train_operators (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    full_name VARCHAR(200),
    countries TEXT[] NOT NULL,
    website VARCHAR(200),
    phone VARCHAR(50),
    email VARCHAR(100),
    color VARCHAR(10),
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS train_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    country VARCHAR(50) NOT NULL,
    operator_id VARCHAR(50) REFERENCES train_operators(id),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    timezone VARCHAR(50),
    address TEXT,
    facilities TEXT[],
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stations_operator ON train_stations(operator_id);
CREATE INDEX IF NOT EXISTS idx_stations_country ON train_stations(country);
CREATE INDEX IF NOT EXISTS idx_stations_code ON train_stations(code);

-- ============================================
-- ROUTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS train_routes (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    operator_id VARCHAR(50) REFERENCES train_operators(id),
    route_type VARCHAR(30) NOT NULL, -- express, ordinary, commuter, airport
    
    -- Origin and destination
    from_station_code VARCHAR(10) REFERENCES train_stations(code),
    to_station_code VARCHAR(10) REFERENCES train_stations(code),
    from_city VARCHAR(100),
    to_city VARCHAR(100),
    from_country VARCHAR(50),
    to_country VARCHAR(50),
    
    -- Route details
    distance_km INTEGER,
    duration_hours DECIMAL(5, 2),
    frequency VARCHAR(100), -- 'weekly', 'daily', 'every 12 minutes'
    
    -- Classes and amenities
    classes TEXT[] NOT NULL,
    amenities TEXT[],
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_cross_border BOOLEAN DEFAULT false,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routes_operator ON train_routes(operator_id);
CREATE INDEX IF NOT EXISTS idx_routes_from ON train_routes(from_station_code);
CREATE INDEX IF NOT EXISTS idx_routes_to ON train_routes(to_station_code);

-- ============================================
-- SCHEDULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS train_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id VARCHAR(100) REFERENCES train_routes(id),
    schedule_name VARCHAR(100),
    direction VARCHAR(20) NOT NULL, -- northbound, southbound, outbound, inbound
    
    -- Departure info
    departure_day VARCHAR(20), -- Monday, Tuesday, etc. (for weekly services)
    departure_time TIME NOT NULL,
    departure_timezone VARCHAR(10),
    
    -- Arrival info
    arrival_day VARCHAR(20),
    arrival_time TIME,
    
    -- For daily services with multiple departures
    is_daily BOOLEAN DEFAULT false,
    departure_type VARCHAR(30), -- morning, afternoon, evening, overnight
    
    -- Operating days (for services that don't run every day)
    operating_days INTEGER[], -- 0=Sunday, 1=Monday, etc.
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    effective_from DATE,
    effective_until DATE,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedules_route ON train_schedules(route_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day ON train_schedules(departure_day);

-- ============================================
-- SCHEDULE STOPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS schedule_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES train_schedules(id) ON DELETE CASCADE,
    station_code VARCHAR(10) REFERENCES train_stations(code),
    station_name VARCHAR(100) NOT NULL,
    
    -- Timing
    arrival_time TIME,
    departure_time TIME,
    day_offset INTEGER DEFAULT 0, -- 0 = same day, 1 = next day, etc.
    
    -- Distance
    km_from_origin INTEGER,
    
    -- Stop order
    stop_order INTEGER NOT NULL,
    
    -- Stop type
    is_origin BOOLEAN DEFAULT false,
    is_destination BOOLEAN DEFAULT false,
    is_major_stop BOOLEAN DEFAULT false,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stops_schedule ON schedule_stops(schedule_id);
CREATE INDEX IF NOT EXISTS idx_stops_station ON schedule_stops(station_code);
CREATE INDEX IF NOT EXISTS idx_stops_order ON schedule_stops(schedule_id, stop_order);

-- ============================================
-- FARES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS train_fares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id VARCHAR(100) REFERENCES train_routes(id),
    
    -- Segment (optional - for segment-based pricing)
    from_station_code VARCHAR(10),
    to_station_code VARCHAR(10),
    
    -- Class
    ticket_class VARCHAR(30) NOT NULL, -- sleeper, first, second, economy, standard
    
    -- Pricing
    price_local DECIMAL(15, 2) NOT NULL,
    currency_local VARCHAR(3) NOT NULL,
    price_usd DECIMAL(10, 2),
    price_afrc DECIMAL(15, 4),
    
    -- Validity
    effective_from DATE,
    effective_until DATE,
    is_active BOOLEAN DEFAULT true,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fares_route ON train_fares(route_id);
CREATE INDEX IF NOT EXISTS idx_fares_class ON train_fares(ticket_class);

-- ============================================
-- INSERT OPERATORS
-- ============================================
INSERT INTO train_operators (id, name, full_name, countries, website, phone, email, color) VALUES
('tazara', 'TAZARA', 'Tanzania-Zambia Railway Authority', ARRAY['Tanzania', 'Zambia'], 'https://www.tazarasite.com', '+255 739 998 855', 'info@tazarasite.com', '#1E40AF'),
('zrl', 'ZRL', 'Zambia Railways Limited', ARRAY['Zambia'], 'https://www.zrl.com.zm', '+260 765 237 196', NULL, '#006B3F'),
('sgr_kenya', 'Madaraka Express', 'Kenya Standard Gauge Railway', ARRAY['Kenya'], 'https://metickets.krc.co.ke', '+254 709 388 887', NULL, '#DC2626'),
('gautrain', 'Gautrain', 'Gautrain Rapid Rail Link', ARRAY['South Africa'], 'https://www.gautrain.co.za', NULL, NULL, '#059669')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    countries = EXCLUDED.countries,
    website = EXCLUDED.website,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    color = EXCLUDED.color,
    updated_at = NOW();

-- ============================================
-- INSERT STATIONS
-- ============================================
INSERT INTO train_stations (code, name, city, country, operator_id, timezone) VALUES
-- TAZARA Stations (Tanzania)
('DSM', 'Dar es Salaam Station', 'Dar es Salaam', 'Tanzania', 'tazara', 'EAT'),
('KLS', 'Kilosa Station', 'Kilosa', 'Tanzania', 'tazara', 'EAT'),
('KDT', 'Kidatu Station', 'Kidatu', 'Tanzania', 'tazara', 'EAT'),
('IFK', 'Ifakara Station', 'Ifakara', 'Tanzania', 'tazara', 'EAT'),
('MLB', 'Mlimba Station', 'Mlimba', 'Tanzania', 'tazara', 'EAT'),
('MKB', 'Makambako Station', 'Makambako', 'Tanzania', 'tazara', 'EAT'),
('MBY', 'Mbeya Station', 'Mbeya', 'Tanzania', 'tazara', 'EAT'),
('TDM', 'Tunduma Station', 'Tunduma', 'Tanzania', 'tazara', 'EAT'),
-- TAZARA Stations (Zambia)
('NKD', 'Nakonde Station', 'Nakonde', 'Zambia', 'tazara', 'CAT'),
('KSM', 'Kasama Station', 'Kasama', 'Zambia', 'tazara', 'CAT'),
('MPK', 'Mpika Station', 'Mpika', 'Zambia', 'tazara', 'CAT'),
('SRJ', 'Serenje Station', 'Serenje', 'Zambia', 'tazara', 'CAT'),
('KPM', 'Kapiri Mposhi Station', 'Kapiri Mposhi', 'Zambia', 'tazara', 'CAT'),
-- ZRL Stations
('LVS', 'Livingstone Station', 'Livingstone', 'Zambia', 'zrl', 'CAT'),
('CHM', 'Choma Station', 'Choma', 'Zambia', 'zrl', 'CAT'),
('MZB', 'Mazabuka Station', 'Mazabuka', 'Zambia', 'zrl', 'CAT'),
('KFE', 'Kafue Station', 'Kafue', 'Zambia', 'zrl', 'CAT'),
('LSK', 'Lusaka Central Station', 'Lusaka', 'Zambia', 'zrl', 'CAT'),
('KBW', 'Kabwe Station', 'Kabwe', 'Zambia', 'zrl', 'CAT'),
('NDL', 'Ndola Station', 'Ndola', 'Zambia', 'zrl', 'CAT'),
('KTW', 'Kitwe Station', 'Kitwe', 'Zambia', 'zrl', 'CAT'),
-- Kenya SGR Stations
('NRB', 'Nairobi Terminus', 'Nairobi', 'Kenya', 'sgr_kenya', 'EAT'),
('ATH', 'Athi River Station', 'Athi River', 'Kenya', 'sgr_kenya', 'EAT'),
('EML', 'Emali Station', 'Emali', 'Kenya', 'sgr_kenya', 'EAT'),
('KBZ', 'Kibwezi Station', 'Kibwezi', 'Kenya', 'sgr_kenya', 'EAT'),
('MTA', 'Mtito Andei Station', 'Mtito Andei', 'Kenya', 'sgr_kenya', 'EAT'),
('VOI', 'Voi Station', 'Voi', 'Kenya', 'sgr_kenya', 'EAT'),
('MSY', 'Misenyi Station', 'Misenyi', 'Kenya', 'sgr_kenya', 'EAT'),
('MRK', 'Mariakani Station', 'Mariakani', 'Kenya', 'sgr_kenya', 'EAT'),
('MBA', 'Mombasa Terminus', 'Mombasa', 'Kenya', 'sgr_kenya', 'EAT'),
-- Gautrain Stations
('HAT', 'Hatfield Station', 'Pretoria', 'South Africa', 'gautrain', 'SAST'),
('PTA', 'Pretoria Station', 'Pretoria', 'South Africa', 'gautrain', 'SAST'),
('CEN', 'Centurion Station', 'Centurion', 'South Africa', 'gautrain', 'SAST'),
('MID', 'Midrand Station', 'Midrand', 'South Africa', 'gautrain', 'SAST'),
('MAR', 'Marlboro Station', 'Johannesburg', 'South Africa', 'gautrain', 'SAST'),
('SAN', 'Sandton Station', 'Johannesburg', 'South Africa', 'gautrain', 'SAST'),
('ROS', 'Rosebank Station', 'Johannesburg', 'South Africa', 'gautrain', 'SAST'),
('PRK', 'Park Station', 'Johannesburg', 'South Africa', 'gautrain', 'SAST'),
('ORT', 'OR Tambo Airport Station', 'Johannesburg', 'South Africa', 'gautrain', 'SAST'),
('RHD', 'Rhodesfield Station', 'Johannesburg', 'South Africa', 'gautrain', 'SAST')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    city = EXCLUDED.city,
    country = EXCLUDED.country,
    operator_id = EXCLUDED.operator_id,
    timezone = EXCLUDED.timezone,
    updated_at = NOW();

-- ============================================
-- INSERT ROUTES
-- ============================================
INSERT INTO train_routes (id, name, operator_id, route_type, from_station_code, to_station_code, from_city, to_city, from_country, to_country, distance_km, duration_hours, frequency, classes, amenities, is_cross_border) VALUES
('tazara-mukuba-express', 'Mukuba Express', 'tazara', 'express', 'DSM', 'KPM', 'Dar es Salaam', 'Kapiri Mposhi', 'Tanzania', 'Zambia', 1860, 46, 'Tue & Fri weekly', ARRAY['sleeper', 'first', 'second', 'economy'], ARRAY['sleeper', 'dining', 'scenic'], true),
('tazara-ordinary', 'TAZARA Ordinary', 'tazara', 'ordinary', 'DSM', 'KPM', 'Dar es Salaam', 'Kapiri Mposhi', 'Tanzania', 'Zambia', 1860, 52, 'Tue & Fri weekly', ARRAY['first', 'second', 'economy'], ARRAY['dining'], true),
('zrl-main-line', 'ZRL Express', 'zrl', 'express', 'LVS', 'KTW', 'Livingstone', 'Kitwe', 'Zambia', 'Zambia', 850, 34, 'Mon & Fri weekly', ARRAY['sleeper', 'first', 'economy'], ARRAY['sleeper', 'dining'], false),
('sgr-nairobi-mombasa', 'Madaraka Express', 'sgr_kenya', 'express', 'NRB', 'MBA', 'Nairobi', 'Mombasa', 'Kenya', 'Kenya', 472, 4.5, 'Daily at 15:00 & 22:00', ARRAY['first', 'economy'], ARRAY['dining', 'wifi', 'aircon'], false),
('gautrain-north-south', 'Gautrain North-South', 'gautrain', 'commuter', 'PRK', 'HAT', 'Johannesburg', 'Pretoria', 'South Africa', 'South Africa', 60, 0.7, 'Every 12-20 min', ARRAY['standard'], ARRAY['wifi', 'aircon'], false),
('gautrain-airport', 'Gautrain Airport Link', 'gautrain', 'airport', 'ORT', 'SAN', 'Johannesburg', 'Johannesburg', 'South Africa', 'South Africa', 25, 0.25, 'Every 12 min', ARRAY['standard'], ARRAY['wifi', 'aircon', 'luggage'], false)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    operator_id = EXCLUDED.operator_id,
    route_type = EXCLUDED.route_type,
    distance_km = EXCLUDED.distance_km,
    duration_hours = EXCLUDED.duration_hours,
    frequency = EXCLUDED.frequency,
    classes = EXCLUDED.classes,
    amenities = EXCLUDED.amenities,
    is_cross_border = EXCLUDED.is_cross_border,
    updated_at = NOW();

-- ============================================
-- INSERT FARES
-- ============================================
INSERT INTO train_fares (route_id, ticket_class, price_local, currency_local, price_usd) VALUES
-- TAZARA Fares
('tazara-mukuba-express', 'sleeper', 195000, 'TZS', 78),
('tazara-mukuba-express', 'first', 145000, 'TZS', 58),
('tazara-mukuba-express', 'second', 115000, 'TZS', 46),
('tazara-mukuba-express', 'economy', 85000, 'TZS', 34),
-- ZRL Fares
('zrl-main-line', 'sleeper', 450, 'ZMW', 17),
('zrl-main-line', 'first', 280, 'ZMW', 11),
('zrl-main-line', 'economy', 150, 'ZMW', 6),
-- Kenya SGR Fares
('sgr-nairobi-mombasa', 'first', 3000, 'KES', 23),
('sgr-nairobi-mombasa', 'economy', 1000, 'KES', 8),
-- Gautrain Fares
('gautrain-north-south', 'standard', 72, 'ZAR', 4),
('gautrain-airport', 'standard', 185, 'ZAR', 10)
ON CONFLICT DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE train_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE train_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE train_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE train_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE train_fares ENABLE ROW LEVEL SECURITY;

-- Public read access for schedules
CREATE POLICY "Public read access to operators" ON train_operators FOR SELECT USING (true);
CREATE POLICY "Public read access to stations" ON train_stations FOR SELECT USING (true);
CREATE POLICY "Public read access to routes" ON train_routes FOR SELECT USING (true);
CREATE POLICY "Public read access to schedules" ON train_schedules FOR SELECT USING (true);
CREATE POLICY "Public read access to stops" ON schedule_stops FOR SELECT USING (true);
CREATE POLICY "Public read access to fares" ON train_fares FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role full access to operators" ON train_operators FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to stations" ON train_stations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to routes" ON train_routes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to schedules" ON train_schedules FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to stops" ON schedule_stops FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to fares" ON train_fares FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE train_operators IS 'African railway operators (TAZARA, ZRL, Kenya SGR, Gautrain, etc.)';
COMMENT ON TABLE train_stations IS 'Railway stations across Africa';
COMMENT ON TABLE train_routes IS 'Train routes connecting stations';
COMMENT ON TABLE train_schedules IS 'Train departure schedules';
COMMENT ON TABLE schedule_stops IS 'Stops along each scheduled service';
COMMENT ON TABLE train_fares IS 'Ticket prices by route and class';
