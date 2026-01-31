-- Simplified GTFS Schema for Africa Railways
-- Supports Sentinel sensor contributions and Community Mobile contributions
-- Africoin rewards for data contributions

-- ============================================
-- STATIONS (maps to stops.txt)
-- ============================================
CREATE TABLE IF NOT EXISTS stations (
    station_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    country TEXT,
    code VARCHAR(10),
    operator_id VARCHAR(50),
    timezone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stations_country ON stations(country);
CREATE INDEX IF NOT EXISTS idx_stations_operator ON stations(operator_id);
CREATE INDEX IF NOT EXISTS idx_stations_code ON stations(code);

-- ============================================
-- ROUTES (maps to routes.txt)
-- ============================================
CREATE TABLE IF NOT EXISTS routes (
    route_id SERIAL PRIMARY KEY,
    name TEXT,
    operator TEXT,
    route_type INTEGER DEFAULT 2, -- 2=rail
    origin_station_id INTEGER REFERENCES stations(station_id),
    destination_station_id INTEGER REFERENCES stations(station_id),
    distance_km DECIMAL(10, 2),
    duration_hours DECIMAL(5, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routes_operator ON routes(operator);

-- ============================================
-- TRIPS (maps to trips.txt)
-- ============================================
CREATE TABLE IF NOT EXISTS trips (
    trip_id SERIAL PRIMARY KEY,
    route_id INT REFERENCES routes(route_id),
    train_id TEXT,
    service_id TEXT,
    direction_id INT, -- 0=outbound, 1=inbound
    status TEXT DEFAULT 'scheduled', -- scheduled, active, completed, cancelled
    headsign TEXT,
    departure_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trips_route ON trips(route_id);
CREATE INDEX IF NOT EXISTS idx_trips_train ON trips(train_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(departure_date);

-- ============================================
-- STOP TIMES (maps to stop_times.txt)
-- Aggregated from sensors + community app
-- ============================================
CREATE TABLE IF NOT EXISTS stop_times (
    stop_time_id SERIAL PRIMARY KEY,
    trip_id INT REFERENCES trips(trip_id),
    station_id INT REFERENCES stations(station_id),
    arrival_time TIMESTAMP,
    departure_time TIMESTAMP,
    stop_sequence INTEGER,
    source TEXT CHECK(source IN ('sensor', 'community', 'operator')),
    sentinel_id TEXT,
    user_id TEXT,
    accuracy_seconds INTEGER, -- variance from scheduled time
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stop_times_trip ON stop_times(trip_id);
CREATE INDEX IF NOT EXISTS idx_stop_times_station ON stop_times(station_id);
CREATE INDEX IF NOT EXISTS idx_stop_times_source ON stop_times(source);

-- ============================================
-- SENSOR GPS LOGS (raw telemetry from Sentinels)
-- ============================================
CREATE TABLE IF NOT EXISTS sensor_logs (
    log_id SERIAL PRIMARY KEY,
    train_id TEXT NOT NULL,
    sentinel_id TEXT,
    timestamp TIMESTAMPTZ NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    speed_kmh DECIMAL(10, 2),
    heading DECIMAL(5, 2),
    accuracy_m DECIMAL(10, 2),
    trip_id INT REFERENCES trips(trip_id),
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sensor_logs_train ON sensor_logs(train_id);
CREATE INDEX IF NOT EXISTS idx_sensor_logs_timestamp ON sensor_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_sensor_logs_trip ON sensor_logs(trip_id);
CREATE INDEX IF NOT EXISTS idx_sensor_logs_unprocessed ON sensor_logs(processed) WHERE processed = FALSE;

-- ============================================
-- CONTRIBUTIONS (Africoin rewards log)
-- ============================================
CREATE TABLE IF NOT EXISTS contributions (
    contribution_id SERIAL PRIMARY KEY,
    user_id TEXT,
    sentinel_id TEXT,
    trip_id INT REFERENCES trips(trip_id),
    station_id INT REFERENCES stations(station_id),
    contribution_type TEXT NOT NULL, -- gps_log, arrival_time, departure_time, stop_verification, route_verification
    points_awarded INT DEFAULT 0,
    afrc_reward DECIMAL(15, 4) DEFAULT 0,
    validated BOOLEAN DEFAULT FALSE,
    validated_by TEXT,
    validated_at TIMESTAMPTZ,
    data JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contributions_user ON contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_sentinel ON contributions(sentinel_id);
CREATE INDEX IF NOT EXISTS idx_contributions_type ON contributions(contribution_type);
CREATE INDEX IF NOT EXISTS idx_contributions_validated ON contributions(validated);

-- ============================================
-- CALENDAR (service schedules)
-- ============================================
CREATE TABLE IF NOT EXISTS calendar (
    service_id TEXT PRIMARY KEY,
    monday BOOLEAN DEFAULT FALSE,
    tuesday BOOLEAN DEFAULT FALSE,
    wednesday BOOLEAN DEFAULT FALSE,
    thursday BOOLEAN DEFAULT FALSE,
    friday BOOLEAN DEFAULT FALSE,
    saturday BOOLEAN DEFAULT FALSE,
    sunday BOOLEAN DEFAULT FALSE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    operator TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CALENDAR EXCEPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS calendar_dates (
    id SERIAL PRIMARY KEY,
    service_id TEXT REFERENCES calendar(service_id),
    date DATE NOT NULL,
    exception_type INTEGER NOT NULL, -- 1=added, 2=removed
    reason TEXT,
    reported_by TEXT, -- sentinel_id or user_id
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(service_id, date)
);

-- ============================================
-- FARES
-- ============================================
CREATE TABLE IF NOT EXISTS fares (
    fare_id SERIAL PRIMARY KEY,
    route_id INT REFERENCES routes(route_id),
    ticket_class TEXT NOT NULL, -- first, second, economy, sleeper
    price DECIMAL(15, 2) NOT NULL,
    currency TEXT NOT NULL,
    price_afrc DECIMAL(15, 4),
    effective_from DATE,
    effective_until DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fares_route ON fares(route_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE stop_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE fares ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read stations" ON stations FOR SELECT USING (true);
CREATE POLICY "Public read routes" ON routes FOR SELECT USING (true);
CREATE POLICY "Public read trips" ON trips FOR SELECT USING (true);
CREATE POLICY "Public read stop_times" ON stop_times FOR SELECT USING (true);
CREATE POLICY "Public read calendar" ON calendar FOR SELECT USING (true);
CREATE POLICY "Public read calendar_dates" ON calendar_dates FOR SELECT USING (true);
CREATE POLICY "Public read fares" ON fares FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role stations" ON stations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role routes" ON routes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role trips" ON trips FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role stop_times" ON stop_times FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role sensor_logs" ON sensor_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role contributions" ON contributions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role calendar" ON calendar FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role calendar_dates" ON calendar_dates FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role fares" ON fares FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- SEED DATA: TAZARA Stations
-- ============================================
INSERT INTO stations (name, latitude, longitude, country, code, operator_id, timezone) VALUES
('Dar es Salaam', -6.8235, 39.2695, 'Tanzania', 'DSM', 'tazara', 'Africa/Dar_es_Salaam'),
('Kilosa', -6.8333, 36.9833, 'Tanzania', 'KLS', 'tazara', 'Africa/Dar_es_Salaam'),
('Ifakara', -8.1333, 36.6833, 'Tanzania', 'IFK', 'tazara', 'Africa/Dar_es_Salaam'),
('Makambako', -8.8500, 34.8500, 'Tanzania', 'MKB', 'tazara', 'Africa/Dar_es_Salaam'),
('Mbeya', -8.9000, 33.4500, 'Tanzania', 'MBE', 'tazara', 'Africa/Dar_es_Salaam'),
('Tunduma', -9.3000, 32.7667, 'Tanzania', 'TDM', 'tazara', 'Africa/Dar_es_Salaam'),
('Nakonde', -9.3500, 32.7500, 'Zambia', 'NKD', 'tazara', 'Africa/Lusaka'),
('Kasama', -10.2167, 31.1833, 'Zambia', 'KSM', 'tazara', 'Africa/Lusaka'),
('Mpika', -11.8333, 31.4500, 'Zambia', 'MPK', 'tazara', 'Africa/Lusaka'),
('Serenje', -13.2333, 30.2333, 'Zambia', 'SRJ', 'tazara', 'Africa/Lusaka'),
('Kapiri Mposhi', -14.4500, 28.6667, 'Zambia', 'KPM', 'tazara', 'Africa/Lusaka')
ON CONFLICT DO NOTHING;

-- ZRL Stations
INSERT INTO stations (name, latitude, longitude, country, code, operator_id, timezone) VALUES
('Livingstone', -17.8419, 25.8544, 'Zambia', 'LVS', 'zrl', 'Africa/Lusaka'),
('Choma', -16.8333, 26.8333, 'Zambia', 'CHM', 'zrl', 'Africa/Lusaka'),
('Lusaka', -15.4167, 28.2833, 'Zambia', 'LSK', 'zrl', 'Africa/Lusaka'),
('Kabwe', -14.4500, 28.4500, 'Zambia', 'KBW', 'zrl', 'Africa/Lusaka'),
('Ndola', -12.9667, 28.6333, 'Zambia', 'NDL', 'zrl', 'Africa/Lusaka'),
('Kitwe', -12.8167, 28.2167, 'Zambia', 'KTW', 'zrl', 'Africa/Lusaka')
ON CONFLICT DO NOTHING;

-- Kenya SGR Stations
INSERT INTO stations (name, latitude, longitude, country, code, operator_id, timezone) VALUES
('Nairobi Terminus', -1.3189, 36.9275, 'Kenya', 'NRB', 'sgr_kenya', 'Africa/Nairobi'),
('Athi River', -1.4500, 36.9833, 'Kenya', 'ATH', 'sgr_kenya', 'Africa/Nairobi'),
('Emali', -2.0833, 37.5167, 'Kenya', 'EML', 'sgr_kenya', 'Africa/Nairobi'),
('Mtito Andei', -2.9833, 38.1667, 'Kenya', 'MTA', 'sgr_kenya', 'Africa/Nairobi'),
('Voi', -3.3833, 38.5667, 'Kenya', 'VOI', 'sgr_kenya', 'Africa/Nairobi'),
('Mombasa Terminus', -4.0435, 39.6682, 'Kenya', 'MBA', 'sgr_kenya', 'Africa/Nairobi')
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: Routes
-- ============================================
INSERT INTO routes (name, operator, route_type, distance_km, duration_hours) VALUES
('TAZARA Mukuba Express', 'tazara', 2, 1860, 46),
('TAZARA Ordinary', 'tazara', 2, 1860, 52),
('ZRL Kitwe-Livingstone Express', 'zrl', 2, 850, 34),
('Madaraka Express', 'sgr_kenya', 2, 472, 4.5)
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: Calendar (service schedules)
-- ============================================
INSERT INTO calendar (service_id, tuesday, friday, start_date, end_date, operator) VALUES
('tazara-tue-fri', TRUE, TRUE, '2026-01-01', '2026-12-31', 'tazara')
ON CONFLICT DO NOTHING;

INSERT INTO calendar (service_id, monday, friday, start_date, end_date, operator) VALUES
('zrl-mon-fri', TRUE, TRUE, '2026-01-01', '2026-12-31', 'zrl')
ON CONFLICT DO NOTHING;

INSERT INTO calendar (service_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday, start_date, end_date, operator) VALUES
('sgr-daily', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, '2026-01-01', '2026-12-31', 'sgr_kenya')
ON CONFLICT DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE stations IS 'Railway stations - maps to GTFS stops.txt';
COMMENT ON TABLE routes IS 'Train routes - maps to GTFS routes.txt';
COMMENT ON TABLE trips IS 'Individual trips - maps to GTFS trips.txt';
COMMENT ON TABLE stop_times IS 'Arrival/departure times from sensors and community';
COMMENT ON TABLE sensor_logs IS 'Raw GPS telemetry from Sentinel devices';
COMMENT ON TABLE contributions IS 'Africoin rewards for data contributions';
COMMENT ON TABLE calendar IS 'Service schedules - maps to GTFS calendar.txt';
COMMENT ON TABLE fares IS 'Ticket prices by route and class';
