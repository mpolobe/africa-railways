#!/usr/bin/env python3
"""
Canonical GTFS Feed Generator for African Continental Rail Network
Generates standardized GTFS feeds for all 54 African countries
"""

import csv
import json
from datetime import datetime, timedelta
from pathlib import Path
import zipfile

# Country mapping for all 54 African countries
COUNTRY_MAPPING = {
    'alg': 'Algeria', 'ang': 'Angola', 'ben': 'Benin', 'bot': 'Botswana',
    'bur': 'Burkina Faso', 'buj': 'Burundi', 'cam': 'Cameroon', 'cpv': 'Cape Verde',
    'car': 'Central African Republic', 'cha': 'Chad', 'com': 'Comoros', 'cog': 'Congo',
    'cod': 'DR Congo', 'civ': "Côte d'Ivoire", 'dji': 'Djibouti', 'egy': 'Egypt',
    'equ': 'Equatorial Guinea', 'eri': 'Eritrea', 'swz': 'Eswatini', 'eth': 'Ethiopia',
    'gab': 'Gabon', 'gam': 'Gambia', 'gha': 'Ghana', 'gui': 'Guinea',
    'gnb': 'Guinea-Bissau', 'ken': 'Kenya', 'les': 'Lesotho', 'lib': 'Liberia',
    'lby': 'Libya', 'mad': 'Madagascar', 'mwi': 'Malawi', 'mli': 'Mali',
    'mau': 'Mauritania', 'mus': 'Mauritius', 'mor': 'Morocco', 'moz': 'Mozambique',
    'nam': 'Namibia', 'ner': 'Niger', 'nga': 'Nigeria', 'rwa': 'Rwanda',
    'stp': 'São Tomé and Príncipe', 'sen': 'Senegal', 'sey': 'Seychelles', 'sle': 'Sierra Leone',
    'som': 'Somalia', 'zaf': 'South Africa', 'ssd': 'South Sudan', 'sud': 'Sudan',
    'tan': 'Tanzania', 'tog': 'Togo', 'tun': 'Tunisia', 'uga': 'Uganda',
    'zmb': 'Zambia', 'zwe': 'Zimbabwe'
}

CITY_TO_COUNTRY = {
    'alg': 'alg', 'lua': 'ang', 'por': 'ben', 'gab': 'bot', 'oua': 'bur',
    'buj': 'buj', 'yao': 'cam', 'pra': 'cpv', 'ban': 'car', 'nja': 'cha',
    'mor': 'com', 'bra': 'cog', 'kin': 'cod', 'yam': 'civ', 'dji': 'dji',
    'cai': 'egy', 'mal': 'equ', 'asm': 'eri', 'mba': 'swz', 'add': 'eth',
    'lib': 'gab', 'bnj': 'gam', 'acc': 'gha', 'con': 'gui', 'bis': 'gnb',
    'nai': 'ken', 'mas': 'les', 'mon': 'lib', 'tri': 'lby', 'ant': 'mad',
    'lil': 'mwi', 'bam': 'mli', 'nou': 'mau', 'plu': 'mus', 'rab': 'mor',
    'map': 'moz', 'win': 'nam', 'nia': 'ner', 'abu': 'nga', 'kig': 'rwa',
    'sao': 'stp', 'dak': 'sen', 'vic': 'sey', 'fre': 'sle', 'mog': 'som',
    'cpt': 'zaf', 'jub': 'ssd', 'kha': 'sud', 'dar': 'tan', 'lom': 'tog',
    'tun': 'tun', 'kam': 'uga', 'lus': 'zmb', 'har': 'zwe'
}

TIMEZONE_MAP = {
    'sen': 'Africa/Dakar', 'gam': 'Africa/Banjul', 'mau': 'Africa/Nouakchott',
    'mli': 'Africa/Bamako', 'bur': 'Africa/Ouagadougou', 'gui': 'Africa/Conakry',
    'gnb': 'Africa/Bissau', 'sle': 'Africa/Freetown', 'lib': 'Africa/Monrovia',
    'civ': 'Africa/Abidjan', 'gha': 'Africa/Accra', 'tog': 'Africa/Lome',
    'ben': 'Africa/Porto-Novo', 'ner': 'Africa/Niamey',
    'nga': 'Africa/Lagos', 'cam': 'Africa/Douala', 'car': 'Africa/Bangui',
    'cha': 'Africa/Ndjamena', 'cog': 'Africa/Brazzaville', 'cod': 'Africa/Kinshasa',
    'gab': 'Africa/Libreville', 'equ': 'Africa/Malabo', 'ang': 'Africa/Luanda',
    'stp': 'Africa/Sao_Tome',
    'ken': 'Africa/Nairobi', 'uga': 'Africa/Kampala', 'tan': 'Africa/Dar_es_Salaam',
    'rwa': 'Africa/Kigali', 'buj': 'Africa/Bujumbura', 'eth': 'Africa/Addis_Ababa',
    'som': 'Africa/Mogadishu', 'dji': 'Africa/Djibouti', 'eri': 'Africa/Asmara',
    'ssd': 'Africa/Juba', 'mad': 'Indian/Antananarivo', 'com': 'Indian/Comoro',
    'sey': 'Indian/Mahe', 'mus': 'Indian/Mauritius',
    'egy': 'Africa/Cairo', 'sud': 'Africa/Khartoum', 'lby': 'Africa/Tripoli',
    'tun': 'Africa/Tunis', 'alg': 'Africa/Algiers', 'mor': 'Africa/Casablanca',
    'zaf': 'Africa/Johannesburg', 'nam': 'Africa/Windhoek', 'bot': 'Africa/Gaborone',
    'zwe': 'Africa/Harare', 'zmb': 'Africa/Lusaka', 'mwi': 'Africa/Blantyre',
    'moz': 'Africa/Maputo', 'swz': 'Africa/Mbabane', 'les': 'Africa/Maseru',
    'cpv': 'Atlantic/Cape_Verde'
}


class AfricanRailGTFSGenerator:
    def __init__(self, output_dir='gtfs_feeds'):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.stops = []
        self.routes = []
        self.trips = []
        self.stop_times = []
        self.capitals = {}
        self.connections = []

    def load_data(self, capitals_file=None, connections_file=None):
        """Load capital and connection data from files or use defaults"""
        if capitals_file and Path(capitals_file).exists():
            with open(capitals_file, 'r') as f:
                self.capitals = json.load(f)
        else:
            self._load_default_capitals()
        
        if connections_file and Path(connections_file).exists():
            with open(connections_file, 'r') as f:
                self.connections = json.load(f)
        else:
            self._load_default_connections()

    def _load_default_capitals(self):
        """Load default African capital data"""
        self.capitals = {
            'dar': {'name': 'Dar es Salaam', 'lat': -6.8235, 'lon': 39.2695, 'color': '#1E40AF'},
            'lus': {'name': 'Lusaka', 'lat': -15.4167, 'lon': 28.2833, 'color': '#006B3F'},
            'nai': {'name': 'Nairobi', 'lat': -1.2921, 'lon': 36.8219, 'color': '#DC2626'},
            'cpt': {'name': 'Cape Town', 'lat': -33.9249, 'lon': 18.4241, 'color': '#059669'},
            'add': {'name': 'Addis Ababa', 'lat': 9.0320, 'lon': 38.7469, 'color': '#7C3AED'},
            'cai': {'name': 'Cairo', 'lat': 30.0444, 'lon': 31.2357, 'color': '#B91C1C'},
            'acc': {'name': 'Accra', 'lat': 5.6037, 'lon': -0.1870, 'color': '#047857'},
            'abu': {'name': 'Abuja', 'lat': 9.0765, 'lon': 7.3986, 'color': '#065F46'},
            'kin': {'name': 'Kinshasa', 'lat': -4.4419, 'lon': 15.2663, 'color': '#1D4ED8'},
            'har': {'name': 'Harare', 'lat': -17.8292, 'lon': 31.0522, 'color': '#15803D'},
            'kam': {'name': 'Kampala', 'lat': 0.3476, 'lon': 32.5825, 'color': '#CA8A04'},
            'kig': {'name': 'Kigali', 'lat': -1.9403, 'lon': 29.8739, 'color': '#0891B2'},
            'map': {'name': 'Maputo', 'lat': -25.9692, 'lon': 32.5732, 'color': '#DC2626'},
            'win': {'name': 'Windhoek', 'lat': -22.5609, 'lon': 17.0658, 'color': '#0369A1'},
            'gab': {'name': 'Gaborone', 'lat': -24.6282, 'lon': 25.9231, 'color': '#0284C7'},
            'dak': {'name': 'Dakar', 'lat': 14.7167, 'lon': -17.4677, 'color': '#059669'},
            'alg': {'name': 'Algiers', 'lat': 36.7538, 'lon': 3.0588, 'color': '#047857'},
            'rab': {'name': 'Rabat', 'lat': 34.0209, 'lon': -6.8416, 'color': '#B91C1C'},
            'tun': {'name': 'Tunis', 'lat': 36.8065, 'lon': 10.1815, 'color': '#DC2626'},
            'dji': {'name': 'Djibouti', 'lat': 11.5721, 'lon': 43.1456, 'color': '#0891B2'},
        }

    def _load_default_connections(self):
        """Load default rail connections"""
        self.connections = [
            {'from': 'dar', 'to': 'lus', 'distance_km': 1860, 'speed_kmh': 80, 'route_type': 'backbone', 'phase': 1},
            {'from': 'lus', 'to': 'har', 'distance_km': 490, 'speed_kmh': 80, 'route_type': 'regional', 'phase': 1},
            {'from': 'nai', 'to': 'kam', 'distance_km': 660, 'speed_kmh': 120, 'route_type': 'backbone', 'phase': 1},
            {'from': 'nai', 'to': 'add', 'distance_km': 1500, 'speed_kmh': 120, 'route_type': 'backbone', 'phase': 2},
            {'from': 'add', 'to': 'dji', 'distance_km': 756, 'speed_kmh': 120, 'route_type': 'backbone', 'phase': 1},
            {'from': 'cpt', 'to': 'win', 'distance_km': 1500, 'speed_kmh': 100, 'route_type': 'backbone', 'phase': 2},
            {'from': 'cpt', 'to': 'gab', 'distance_km': 1000, 'speed_kmh': 100, 'route_type': 'regional', 'phase': 1},
            {'from': 'har', 'to': 'map', 'distance_km': 1200, 'speed_kmh': 80, 'route_type': 'regional', 'phase': 2},
            {'from': 'acc', 'to': 'abu', 'distance_km': 800, 'speed_kmh': 100, 'route_type': 'backbone', 'phase': 2},
            {'from': 'dak', 'to': 'rab', 'distance_km': 2200, 'speed_kmh': 160, 'route_type': 'backbone', 'phase': 3},
            {'from': 'rab', 'to': 'alg', 'distance_km': 520, 'speed_kmh': 160, 'route_type': 'backbone', 'phase': 2},
            {'from': 'alg', 'to': 'tun', 'distance_km': 600, 'speed_kmh': 160, 'route_type': 'backbone', 'phase': 2},
            {'from': 'tun', 'to': 'cai', 'distance_km': 2500, 'speed_kmh': 200, 'route_type': 'backbone', 'phase': 3},
            {'from': 'kam', 'to': 'kig', 'distance_km': 530, 'speed_kmh': 120, 'route_type': 'regional', 'phase': 2},
            {'from': 'kin', 'to': 'lus', 'distance_km': 2000, 'speed_kmh': 80, 'route_type': 'backbone', 'phase': 3},
        ]

    def generate_agency_txt(self):
        """Generate agency.txt"""
        agencies = [{
            'agency_id': 'AR_CONTINENTAL',
            'agency_name': 'African Continental Rail Authority',
            'agency_url': 'https://africanrail.org',
            'agency_timezone': 'Africa/Johannesburg',
            'agency_lang': 'en',
            'agency_phone': '+27-11-000-0000',
            'agency_email': 'info@africanrail.org'
        }]
        for code, name in COUNTRY_MAPPING.items():
            agencies.append({
                'agency_id': f'AR_{code.upper()}',
                'agency_name': f'African Rail - {name}',
                'agency_url': f'https://africanrail.org/{code}',
                'agency_timezone': TIMEZONE_MAP.get(code, 'Africa/Johannesburg'),
                'agency_lang': 'en',
                'agency_phone': '',
                'agency_email': f'info@africanrail-{code}.org'
            })
        return agencies

    def generate_stops_txt(self):
        """Generate stops.txt"""
        stops = []
        for stop_id, data in self.capitals.items():
            country_code = CITY_TO_COUNTRY.get(stop_id, 'unk')
            country_name = COUNTRY_MAPPING.get(country_code, 'Unknown')
            stops.append({
                'stop_id': stop_id,
                'stop_code': stop_id.upper(),
                'stop_name': f'{data["name"]} Central Station',
                'stop_desc': f'Main railway station in {data["name"]}, {country_name}',
                'stop_lat': data['lat'],
                'stop_lon': data['lon'],
                'zone_id': country_code,
                'stop_url': f'https://africanrail.org/stations/{stop_id}',
                'location_type': '1',
                'parent_station': '',
                'wheelchair_boarding': '1',
                'platform_code': 'A1'
            })
        self.stops = stops
        return stops

    def generate_routes_txt(self):
        """Generate routes.txt"""
        routes = []
        route_set = set()
        for conn in self.connections:
            route_key = tuple(sorted([conn['from'], conn['to']]))
            if route_key not in route_set:
                route_set.add(route_key)
                from_city = self.capitals.get(conn['from'], {}).get('name', conn['from'])
                to_city = self.capitals.get(conn['to'], {}).get('name', conn['to'])
                route_id = f"{conn['from']}_{conn['to']}"
                route_type_name = 'High-Speed Rail' if conn['route_type'] == 'backbone' else 'Regional Express'
                color = self.capitals.get(conn['from'], {}).get('color', '#1E40AF').replace('#', '')
                routes.append({
                    'route_id': route_id,
                    'agency_id': 'AR_CONTINENTAL',
                    'route_short_name': f'{conn["from"].upper()}-{conn["to"].upper()}',
                    'route_long_name': f'{from_city} - {to_city} {route_type_name}',
                    'route_desc': f'Phase {conn["phase"]} - {conn["distance_km"]}km at {conn["speed_kmh"]}km/h',
                    'route_type': '2',
                    'route_url': f'https://africanrail.org/routes/{route_id}',
                    'route_color': color,
                    'route_text_color': 'FFFFFF',
                    'route_sort_order': conn['phase']
                })
        self.routes = routes
        return routes

    def generate_calendar_txt(self):
        """Generate calendar.txt"""
        return [{
            'service_id': 'WEEKDAY',
            'monday': '1', 'tuesday': '1', 'wednesday': '1', 'thursday': '1',
            'friday': '1', 'saturday': '1', 'sunday': '1',
            'start_date': '20260101',
            'end_date': '20301231'
        }]

    def generate_trips_txt(self):
        """Generate trips.txt"""
        trips = []
        trip_id = 1
        for conn in self.connections:
            route_id = f"{conn['from']}_{conn['to']}"
            for hour in range(5, 21, 3):
                trips.append({
                    'route_id': route_id, 'service_id': 'WEEKDAY',
                    'trip_id': f'T{trip_id:05d}',
                    'trip_headsign': self.capitals.get(conn['to'], {}).get('name', conn['to']),
                    'direction_id': '0', 'block_id': f'B{conn["phase"]}',
                    'shape_id': route_id, 'wheelchair_accessible': '1', 'bikes_allowed': '1'
                })
                trip_id += 1
                trips.append({
                    'route_id': route_id, 'service_id': 'WEEKDAY',
                    'trip_id': f'T{trip_id:05d}',
                    'trip_headsign': self.capitals.get(conn['from'], {}).get('name', conn['from']),
                    'direction_id': '1', 'block_id': f'B{conn["phase"]}',
                    'shape_id': route_id, 'wheelchair_accessible': '1', 'bikes_allowed': '1'
                })
                trip_id += 1
        self.trips = trips
        return trips

    def generate_stop_times_txt(self):
        """Generate stop_times.txt"""
        stop_times = []
        for trip in self.trips:
            route_id = trip['route_id']
            conn = next((c for c in self.connections if f"{c['from']}_{c['to']}" == route_id), None)
            if not conn:
                continue
            travel_min = int((conn['distance_km'] / conn['speed_kmh']) * 60)
            trip_num = int(trip['trip_id'][1:])
            dep_hour = 5 + ((trip_num % 6) * 3)
            dep_time = f"{dep_hour:02d}:00:00"
            arr_hour = dep_hour + (travel_min // 60)
            arr_min = travel_min % 60
            arr_time = f"{arr_hour:02d}:{arr_min:02d}:00"
            stops = [conn['from'], conn['to']] if trip['direction_id'] == '0' else [conn['to'], conn['from']]
            times = [dep_time, arr_time]
            for i, (stop_id, time) in enumerate(zip(stops, times)):
                stop_times.append({
                    'trip_id': trip['trip_id'], 'arrival_time': time, 'departure_time': time,
                    'stop_id': stop_id, 'stop_sequence': i + 1,
                    'stop_headsign': self.capitals.get(stops[-1], {}).get('name', ''),
                    'pickup_type': '0', 'drop_off_type': '0',
                    'shape_dist_traveled': str(conn['distance_km'] * i), 'timepoint': '1'
                })
        self.stop_times = stop_times
        return stop_times

    def generate_fare_attributes_txt(self):
        """Generate fare_attributes.txt"""
        return [
            {'fare_id': 'SHORT', 'price': '5.00', 'currency_type': 'USD', 'payment_method': '1', 'transfers': '2', 'transfer_duration': '7200', 'agency_id': 'AR_CONTINENTAL'},
            {'fare_id': 'MEDIUM', 'price': '15.00', 'currency_type': 'USD', 'payment_method': '1', 'transfers': '2', 'transfer_duration': '7200', 'agency_id': 'AR_CONTINENTAL'},
            {'fare_id': 'LONG', 'price': '30.00', 'currency_type': 'USD', 'payment_method': '1', 'transfers': '2', 'transfer_duration': '7200', 'agency_id': 'AR_CONTINENTAL'},
            {'fare_id': 'VLONG', 'price': '50.00', 'currency_type': 'USD', 'payment_method': '1', 'transfers': '2', 'transfer_duration': '7200', 'agency_id': 'AR_CONTINENTAL'},
            {'fare_id': 'CONTINENTAL', 'price': '75.00', 'currency_type': 'USD', 'payment_method': '1', 'transfers': '2', 'transfer_duration': '7200', 'agency_id': 'AR_CONTINENTAL'},
        ]

    def generate_feed_info_txt(self):
        """Generate feed_info.txt"""
        today = datetime.now().strftime('%Y%m%d')
        return [{
            'feed_publisher_name': 'African Continental Rail Authority',
            'feed_publisher_url': 'https://africanrail.org',
            'feed_lang': 'en',
            'feed_start_date': today,
            'feed_end_date': (datetime.now() + timedelta(days=1825)).strftime('%Y%m%d'),
            'feed_version': f'{today}_v1.0',
            'feed_contact_email': 'gtfs@africanrail.org',
            'feed_contact_url': 'https://africanrail.org/gtfs'
        }]

    def write_gtfs_file(self, filename, data, fieldnames):
        """Write a GTFS CSV file"""
        filepath = self.output_dir / filename
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
        print(f"✓ Generated {filename} ({len(data)} records)")

    def generate_all(self):
        """Generate all GTFS files"""
        print("Generating Canonical GTFS Feed for African Continental Rail Network")
        print("=" * 70)
        self.load_data()

        self.write_gtfs_file('agency.txt', self.generate_agency_txt(),
            ['agency_id', 'agency_name', 'agency_url', 'agency_timezone', 'agency_lang', 'agency_phone', 'agency_email'])
        self.write_gtfs_file('stops.txt', self.generate_stops_txt(),
            ['stop_id', 'stop_code', 'stop_name', 'stop_desc', 'stop_lat', 'stop_lon', 'zone_id', 'stop_url', 'location_type', 'parent_station', 'wheelchair_boarding', 'platform_code'])
        self.write_gtfs_file('routes.txt', self.generate_routes_txt(),
            ['route_id', 'agency_id', 'route_short_name', 'route_long_name', 'route_desc', 'route_type', 'route_url', 'route_color', 'route_text_color', 'route_sort_order'])
        self.write_gtfs_file('calendar.txt', self.generate_calendar_txt(),
            ['service_id', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'start_date', 'end_date'])
        self.write_gtfs_file('trips.txt', self.generate_trips_txt(),
            ['route_id', 'service_id', 'trip_id', 'trip_headsign', 'direction_id', 'block_id', 'shape_id', 'wheelchair_accessible', 'bikes_allowed'])
        self.write_gtfs_file('stop_times.txt', self.generate_stop_times_txt(),
            ['trip_id', 'arrival_time', 'departure_time', 'stop_id', 'stop_sequence', 'stop_headsign', 'pickup_type', 'drop_off_type', 'shape_dist_traveled', 'timepoint'])
        self.write_gtfs_file('fare_attributes.txt', self.generate_fare_attributes_txt(),
            ['fare_id', 'price', 'currency_type', 'payment_method', 'transfers', 'transfer_duration', 'agency_id'])
        self.write_gtfs_file('feed_info.txt', self.generate_feed_info_txt(),
            ['feed_publisher_name', 'feed_publisher_url', 'feed_lang', 'feed_start_date', 'feed_end_date', 'feed_version', 'feed_contact_email', 'feed_contact_url'])

        print("=" * 70)
        print(f"✅ GTFS Feed Generation Complete!")
        print(f"Files saved to: {self.output_dir}/")
        return self.create_zip()

    def create_zip(self):
        """Create ZIP archive"""
        zip_path = self.output_dir / 'african_rail_gtfs.zip'
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for txt_file in self.output_dir.glob('*.txt'):
                zipf.write(txt_file, txt_file.name)
        print(f"📦 ZIP created: {zip_path}")
        return zip_path


if __name__ == '__main__':
    generator = AfricanRailGTFSGenerator(output_dir='gtfs_feeds')
    generator.generate_all()
