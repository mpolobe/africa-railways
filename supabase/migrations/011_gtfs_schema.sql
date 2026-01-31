-- GTFS Schema for Africa Railways
-- Supports Sentinel sensor contributions and Community Mobile contributions
-- Generates GTFS-compliant feeds from collected data

-- ============================================
-- GTFS AGENCY (maps to agency.txt)
-- ============================================
CREATE TABLE IF NOT EXISTS gtfs_agency (
    agency_id VARCHAR(50) PRIMARY KEY,
    agency_name VARCHAR(200) NOT NULL,
    agency_url VARCHAR(500),
    agency_timezone VARCHAR(50) NOT NULL,
    agency_lang VARCHAR(5) DEFAULT 'en',
    agency_phone VARCHAR(50),
    agency_fare_url VARCHAR(500),
    agency_email VARCHAR(100),
    -- Source tracking
    source VARCHAR(50) DEFAULT 'operator', -- operator, sentinel, community
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GTFS STOPS (maps to stops.txt)
-- ============================================
CREATE TABLE IF NOT EXISTS gtfs_stops (
    stop_id VARCHAR(100) PRIMARY KEY,
    stop_code VARCHAR(50),
    stop_name VARCHAR(200) NOT NULL,
    stop_desc TEXT,
    stop_lat DECIMAL(10, 7) NOT NULL,
    stop_lon DECIMAL(10, 7) NOT NULL,
    zone_id VARCHAR(50),
    stop_url VARCHAR(500),
    location_type INTEGER DEFAULT 0, -- 0=stop, 1=station, 2=entrance
    parent_station VARCHAR(100) REFERENCES gtfs_stops(stop_id),
    stop_timezone VARCHAR(50),
    wheelchair_boarding INTEGER DEFAULT 0,
    level_id VARCHAR(50),
    platform_code VARCHAR(50),
    -- Africa Railways extensions
    country VARCHAR(50),
    city VARCHAR(100),
    operator_id VARCHAR(50),
    -- Source tracking
    source VARCHAR(50) DEFAULT 'operator', -- operator, sentinel, community
    sentinel_id VARCHAR(100),
    gps_accuracy_m DECIMAL(10, 2),
    verified_at TIMESTAMPTZ,
    verification_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gtfs_stops_location ON gtfs_stops USING gist (
    ll_to_earth(stop_lat, stop_lon)
);
CREATE INDEX IF NOT EXISTS idx_gtfs_stops_operator ON gtfs_stops(operator_id);
CREATE INDEX IF NOT EXISTS idx_gtfs_stops_country ON gtfs_stops(country);

-- ============================================
-- GTFS ROUTES (maps to routes.txt)
-- ============================================
CREATE TABLE IF NOT EXISTS gtfs_routes (
    route_id VARCHAR(100) PRIMARY KEY,
    agency_id VARCHAR(50) REFERENCES gtfs_agency(agency_id),
    route_short_name VARCHAR(50),
    route_long_name VARCHAR(200) NOT NULL,
    route_desc TEXT,
    route_type INTEGER NOT NULL DEFAULT 2, -- 2=rail
    route_url VARCHAR(500),
    route_color VARCHAR(6),
    route_text_color VARCHAR(6),
    route_sort_order INTEGER,
    continuous_pickup INTEGER DEFAULT 1,
    continuous_drop_off INTEGER DEFAULT 1,
    -- Source tracking
    source VARCHAR(50) DEFAULT 'operator',
    sentinel_id VARCHAR(100),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gtfs_routes_agency ON gtfs_routes(agency_id);

-- ============================================
-- GTFS CALENDAR (maps to calendar.txt)
-- ============================================
CREATE TABLE IF NOT EXISTS gtfs_calendar (
    service_id VARCHAR(100) PRIMARY KEY,
    monday BOOLEAN NOT NULL DEFAULT false,
    tuesday BOOLEAN NOT NULL DEFAULT false,
    wednesday BOOLEAN NOT NULL DEFAULT false,
    thursday BOOLEAN NOT NULL DEFAULT false,
    friday BOOLEAN NOT NULL DEFAULT false,
    saturday BOOLEAN NOT NULL DEFAULT false,
    sunday BOOLEAN NOT NULL DEFAULT false,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    -- Source tracking
    source VARCHAR(50) DEFAULT 'operator',
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GTFS CALENDAR DATES (maps to calendar_dates.txt)
-- ============================================
CREATE TABLE IF NOT EXISTS gtfs_calendar_dates (
    service_id VARCHAR(100) REFERENCES gtfs_calendar(service_id),
    date DATE NOT NULL,
    exception_type INTEGER NOT NULL, -- 1=added, 2=removed
    -- Source tracking
    source VARCHAR(50) DEFAULT 'operator',
    reported_by VARCHAR(100), -- sentinel_id or user_id
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (service_id, date)
);

-- ============================================
-- GTFS TRIPS (maps to trips.txt)
-- ============================================
CREATE TABLE IF NOT EXISTS gtfs_trips (
    trip_id VARCHAR(100) PRIMARY KEY,
    route_id VARCHAR(100) REFERENCES gtfs_routes(route_id),
    service_id VARCHAR(100) REFERENCES gtfs_calendar(service_id),
    trip_headsign VARCHAR(200),
    trip_short_name VARCHAR(50),
    direction_id INTEGER, -- 0=outbound, 1=inbound
    block_id VARCHAR(100),
    shape_id VARCHAR(100),
    wheelchair_accessible INTEGER DEFAULT 0,
    bikes_allowed INTEGER DEFAULT 0,
    -- Source tracking
    source VARCHAR(50) DEFAULT 'operator',
    sentinel_detected BOOLEAN DEFAULT false,
    community_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gtfs_trips_route ON gtfs_trips(route_id);
CREATE INDEX IF NOT EXISTS idx_gtfs_trips_service ON gtfs_trips(service_id);

-- ============================================
-- GTFS STOP TIMES (maps to stop_times.txt)
-- ============================================
CREATE TABLE IF NOT EXISTS gtfs_stop_times (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id VARCHAR(100) REFERENCES gtfs_trips(trip_id),
    arrival_time TIME,
    departure_time TIME,
    stop_id VARCHAR(100) REFERENCES gtfs_stops(stop_id),
    stop_sequence INTEGER NOT NULL,
    stop_headsign VARCHAR(200),
    pickup_type INTEGER DEFAULT 0,
    drop_off_type INTEGER DEFAULT 0,
    continuous_pickup INTEGER DEFAULT 1,
    continuous_drop_off INTEGER DEFAULT 1,
    shape_dist_traveled DECIMAL(10, 2),
    timepoint INTEGER DEFAULT 1,
    -- Source tracking
    source VARCHAR(50) DEFAULT 'operator',
    sentinel_id VARCHAR(100),
    crowdsourced_count INTEGER DEFAULT 0,
    avg_arrival_variance_sec INTEGER,
    avg_departure_variance_sec INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(trip_id, stop_sequence)
);

CREATE INDEX IF NOT EXISTS idx_gtfs_stop_times_trip ON gtfs_stop_times(trip_id);
CREATE INDEX IF NOT EXISTS idx_gtfs_stop_times_stop ON gtfs_stop_times(stop_id);

-- ============================================
-- GTFS SHAPES (maps to shapes.txt)
-- ============================================
CREATE TABLE IF NOT EXISTS gtfs_shapes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shape_id VARCHAR(100) NOT NULL,
    shape_pt_lat DECIMAL(10, 7) NOT NULL,
    shape_pt_lon DECIMAL(10, 7) NOT NULL,
    shape_pt_sequence INTEGER NOT NULL,
    shape_dist_traveled DECIMAL(10, 2),
    -- Source tracking
    source VARCHAR(50) DEFAULT 'sentinel', -- GPS tracks from sentinels
    sentinel_id VARCHAR(100),
    recorded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(shape_id, shape_pt_sequence)
);

CREATE INDEX IF NOT EXISTS idx_gtfs_shapes_shape ON gtfs_shapes(shape_id);

-- ============================================
-- GTFS FARE ATTRIBUTES (maps to fare_attributes.txt)
-- ============================================
CREATE TABLE IF NOT EXISTS gtfs_fare_attributes (
    fare_id VARCHAR(100) PRIMARY KEY,
    price DECIMAL(10, 2) NOT NULL,
    currency_type VARCHAR(3) NOT NULL,
    payment_method INTEGER NOT NULL DEFAULT 0, -- 0=on board, 1=before
    transfers INTEGER, -- 0=no, 1=once, 2=twice, null=unlimited
    agency_id VARCHAR(50) REFERENCES gtfs_agency(agency_id),
    transfer_duration INTEGER,
    -- Source tracking
    source VARCHAR(50) DEFAULT 'operator',
    community_reported BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GTFS FARE RULES (maps to fare_rules.txt)
-- ============================================
CREATE TABLE IF NOT EXISTS gtfs_fare_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fare_id VARCHAR(100) REFERENCES gtfs_fare_attributes(fare_id),
    route_id VARCHAR(100) REFERENCES gtfs_routes(route_id),
    origin_id VARCHAR(50),
    destination_id VARCHAR(50),
    contains_id VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SENSOR GPS LOGS (Sentinel contribution)
-- ============================================
CREATE TABLE IF NOT EXISTS sensor_gps_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    train_id VARCHAR(100) NOT NULL,
    sentinel_id VARCHAR(100),
    timestamp TIMESTAMPTZ NOT NULL,
    lat DECIMAL(10, 7) NOT NULL,
    lon DECIMAL(10, 7) NOT NULL,
    altitude_m DECIMAL(10, 2),
    speed_kmh DECIMAL(10, 2),
    heading DECIMAL(5, 2),
    accuracy_m DECIMAL(10, 2),
    -- Trip association
    trip_id VARCHAR(100),
    route_id VARCHAR(100),
    -- Processing status
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sensor_gps_train ON sensor_gps_logs(train_id);
CREATE INDEX IF NOT EXISTS idx_sensor_gps_timestamp ON sensor_gps_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_sensor_gps_trip ON sensor_gps_logs(trip_id);
CREATE INDEX IF NOT EXISTS idx_sensor_gps_unprocessed ON sensor_gps_logs(processed) WHERE processed = false;

-- ============================================
-- COMMUNITY CONTRIBUTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS community_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100),
    contribution_type VARCHAR(50) NOT NULL, -- stop_location, arrival_time, departure_time, route_verification, service_exception
    entity_type VARCHAR(50) NOT NULL, -- stop, trip, route, calendar
    entity_id VARCHAR(100) NOT NULL,
    -- Contribution data
    data JSONB NOT NULL,
    -- Location context
    lat DECIMAL(10, 7),
    lon DECIMAL(10, 7),
    -- Verification
    status VARCHAR(20) DEFAULT 'pending', -- pending, verified, rejected
    verified_by VARCHAR(100),
    verified_at TIMESTAMPTZ,
    verification_notes TEXT,
    -- Reward tracking
    reward_afrc DECIMAL(15, 4),
    reward_paid BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_type ON community_contributions(contribution_type);
CREATE INDEX IF NOT EXISTS idx_community_entity ON community_contributions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_community_status ON community_contributions(status);

-- ============================================
-- TRIP DETECTION (from sensor data)
-- ============================================
CREATE TABLE IF NOT EXISTS detected_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    train_id VARCHAR(100) NOT NULL,
    route_id VARCHAR(100),
    -- Trip timing
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    -- Start/end locations
    start_lat DECIMAL(10, 7),
    start_lon DECIMAL(10, 7),
    start_stop_id VARCHAR(100),
    end_lat DECIMAL(10, 7),
    end_lon DECIMAL(10, 7),
    end_stop_id VARCHAR(100),
    -- Trip stats
    distance_km DECIMAL(10, 2),
    duration_minutes INTEGER,
    avg_speed_kmh DECIMAL(10, 2),
    gps_point_count INTEGER,
    -- Processing
    status VARCHAR(20) DEFAULT 'active', -- active, completed, cancelled
    gtfs_trip_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_detected_trips_train ON detected_trips(train_id);
CREATE INDEX IF NOT EXISTS idx_detected_trips_status ON detected_trips(status);

-- ============================================
-- STOP ARRIVAL/DEPARTURE EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS stop_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    detected_trip_id UUID REFERENCES detected_trips(id),
    stop_id VARCHAR(100) REFERENCES gtfs_stops(stop_id),
    event_type VARCHAR(20) NOT NULL, -- arrival, departure
    event_time TIMESTAMPTZ NOT NULL,
    -- Source
    source VARCHAR(50) NOT NULL, -- sensor, community
    sentinel_id VARCHAR(100),
    user_id VARCHAR(100),
    -- Location
    lat DECIMAL(10, 7),
    lon DECIMAL(10, 7),
    accuracy_m DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stop_events_trip ON stop_events(detected_trip_id);
CREATE INDEX IF NOT EXISTS idx_stop_events_stop ON stop_events(stop_id);
CREATE INDEX IF NOT EXISTS idx_stop_events_time ON stop_events(event_time);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE gtfs_agency ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtfs_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtfs_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtfs_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtfs_calendar_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtfs_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtfs_stop_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtfs_shapes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtfs_fare_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtfs_fare_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_gps_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE detected_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE stop_events ENABLE ROW LEVEL SECURITY;

-- Public read access for GTFS data
CREATE POLICY "Public read GTFS agency" ON gtfs_agency FOR SELECT USING (true);
CREATE POLICY "Public read GTFS stops" ON gtfs_stops FOR SELECT USING (true);
CREATE POLICY "Public read GTFS routes" ON gtfs_routes FOR SELECT USING (true);
CREATE POLICY "Public read GTFS calendar" ON gtfs_calendar FOR SELECT USING (true);
CREATE POLICY "Public read GTFS calendar dates" ON gtfs_calendar_dates FOR SELECT USING (true);
CREATE POLICY "Public read GTFS trips" ON gtfs_trips FOR SELECT USING (true);
CREATE POLICY "Public read GTFS stop times" ON gtfs_stop_times FOR SELECT USING (true);
CREATE POLICY "Public read GTFS shapes" ON gtfs_shapes FOR SELECT USING (true);
CREATE POLICY "Public read GTFS fares" ON gtfs_fare_attributes FOR SELECT USING (true);
CREATE POLICY "Public read GTFS fare rules" ON gtfs_fare_rules FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role GTFS agency" ON gtfs_agency FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role GTFS stops" ON gtfs_stops FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role GTFS routes" ON gtfs_routes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role GTFS calendar" ON gtfs_calendar FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role GTFS calendar dates" ON gtfs_calendar_dates FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role GTFS trips" ON gtfs_trips FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role GTFS stop times" ON gtfs_stop_times FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role GTFS shapes" ON gtfs_shapes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role GTFS fares" ON gtfs_fare_attributes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role GTFS fare rules" ON gtfs_fare_rules FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role sensor logs" ON sensor_gps_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role community" ON community_contributions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role detected trips" ON detected_trips FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role stop events" ON stop_events FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- SEED GTFS DATA FROM EXISTING OPERATORS
-- ============================================
INSERT INTO gtfs_agency (agency_id, agency_name, agency_url, agency_timezone, agency_phone, agency_email, source)
SELECT 
    id,
    full_name,
    website,
    CASE 
        WHEN 'Tanzania' = ANY(countries) THEN 'Africa/Dar_es_Salaam'
        WHEN 'Zambia' = ANY(countries) THEN 'Africa/Lusaka'
        WHEN 'Kenya' = ANY(countries) THEN 'Africa/Nairobi'
        WHEN 'South Africa' = ANY(countries) THEN 'Africa/Johannesburg'
        ELSE 'Africa/Nairobi'
    END,
    phone,
    email,
    'operator'
FROM train_operators
ON CONFLICT (agency_id) DO NOTHING;

-- Seed stops from existing stations
INSERT INTO gtfs_stops (stop_id, stop_code, stop_name, stop_lat, stop_lon, stop_timezone, country, city, operator_id, source, location_type)
SELECT 
    code,
    code,
    name,
    COALESCE(latitude, 0),
    COALESCE(longitude, 0),
    timezone,
    country,
    city,
    operator_id,
    'operator',
    1 -- station
FROM train_stations
WHERE latitude IS NOT NULL AND longitude IS NOT NULL
ON CONFLICT (stop_id) DO NOTHING;

-- Seed routes from existing routes
INSERT INTO gtfs_routes (route_id, agency_id, route_short_name, route_long_name, route_type, route_color, source)
SELECT 
    id,
    operator_id,
    SUBSTRING(name, 1, 50),
    name,
    2, -- rail
    REPLACE(COALESCE((SELECT color FROM train_operators WHERE id = train_routes.operator_id), '#1E40AF'), '#', ''),
    'operator'
FROM train_routes
ON CONFLICT (route_id) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE gtfs_agency IS 'GTFS agency.txt - Transit agencies';
COMMENT ON TABLE gtfs_stops IS 'GTFS stops.txt - Stations and stops with GPS coordinates';
COMMENT ON TABLE gtfs_routes IS 'GTFS routes.txt - Train routes';
COMMENT ON TABLE gtfs_calendar IS 'GTFS calendar.txt - Service schedules';
COMMENT ON TABLE gtfs_trips IS 'GTFS trips.txt - Individual trips';
COMMENT ON TABLE gtfs_stop_times IS 'GTFS stop_times.txt - Arrival/departure times';
COMMENT ON TABLE gtfs_shapes IS 'GTFS shapes.txt - Route geometry from GPS tracks';
COMMENT ON TABLE sensor_gps_logs IS 'Raw GPS data from Sentinel sensors on trains';
COMMENT ON TABLE community_contributions IS 'User-submitted data for GTFS verification';
COMMENT ON TABLE detected_trips IS 'Trips detected from sensor GPS data';
COMMENT ON TABLE stop_events IS 'Arrival/departure events at stops';
