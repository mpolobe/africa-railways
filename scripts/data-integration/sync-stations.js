#!/usr/bin/env node

/**
 * Sync Stations from Airtable Rail Asset Tracker
 * 
 * Fetches station data and generates a hierarchical JSON file
 * organized by Country → City → Stations for cascading dropdowns
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../../data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'stations.json');

/**
 * Determine country from coordinates (rough approximation)
 */
function getCountryFromCoords(lat, lng) {
  // Rough bounding boxes for African countries
  const countries = [
    { name: 'South Africa', latMin: -35, latMax: -22, lngMin: 16, lngMax: 33 },
    { name: 'Kenya', latMin: -5, latMax: 5, lngMin: 33, lngMax: 42 },
    { name: 'Tanzania', latMin: -12, latMax: -1, lngMin: 29, lngMax: 41 },
    { name: 'Egypt', latMin: 22, latMax: 32, lngMin: 24, lngMax: 37 },
    { name: 'Morocco', latMin: 27, latMax: 36, lngMin: -13, lngMax: -1 },
    { name: 'Nigeria', latMin: 4, latMax: 14, lngMin: 2, lngMax: 15 },
    { name: 'Ethiopia', latMin: 3, latMax: 15, lngMin: 33, lngMax: 48 },
    { name: 'Ghana', latMin: 4, latMax: 12, lngMin: -4, lngMax: 2 },
    { name: 'Algeria', latMin: 18, latMax: 38, lngMin: -9, lngMax: 12 },
    { name: 'Tunisia', latMin: 30, latMax: 38, lngMin: 7, lngMax: 12 },
    { name: 'Sudan', latMin: 8, latMax: 23, lngMin: 21, lngMax: 39 },
    { name: 'DR Congo', latMin: -14, latMax: 6, lngMin: 12, lngMax: 32 },
    { name: 'Zambia', latMin: -18, latMax: -8, lngMin: 21, lngMax: 34 },
    { name: 'Zimbabwe', latMin: -23, latMax: -15, lngMin: 25, lngMax: 34 },
    { name: 'Mozambique', latMin: -27, latMax: -10, lngMin: 30, lngMax: 41 },
    { name: 'Angola', latMin: -18, latMax: -4, lngMin: 11, lngMax: 24 },
    { name: 'Botswana', latMin: -27, latMax: -17, lngMin: 19, lngMax: 30 },
    { name: 'Namibia', latMin: -29, latMax: -17, lngMin: 11, lngMax: 26 },
    { name: 'Uganda', latMin: -2, latMax: 5, lngMin: 29, lngMax: 35 },
    { name: 'Senegal', latMin: 12, latMax: 17, lngMin: -18, lngMax: -11 },
    { name: 'Ivory Coast', latMin: 4, latMax: 11, lngMin: -9, lngMax: -2 },
    { name: 'Cameroon', latMin: 1, latMax: 14, lngMin: 8, lngMax: 17 },
    { name: 'Libya', latMin: 19, latMax: 34, lngMin: 9, lngMax: 26 },
    { name: 'Mali', latMin: 10, latMax: 25, lngMin: -12, lngMax: 5 },
  ];
  
  for (const country of countries) {
    if (lat >= country.latMin && lat <= country.latMax &&
        lng >= country.lngMin && lng <= country.lngMax) {
      return country.name;
    }
  }
  return 'Other African Region';
}

/**
 * Get city name from station name (extract location hints)
 */
function getCityFromName(name, lat, lng) {
  // Common city patterns in station names
  const cityPatterns = [
    /^(.+?)\s+(Station|Terminal|Terminus|Depot|Junction|Yard|Central)$/i,
    /^(.+?)\s*[-–]\s*(.+)$/,
  ];
  
  for (const pattern of cityPatterns) {
    const match = name.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  // Use station name as city if no pattern matches
  return name.split(/[-–,]/)[0].trim() || 'Unknown City';
}

/**
 * Fetch all stations from Airtable
 */
async function fetchStationsFromAirtable() {
  const Airtable = (await import('airtable')).default;
  
  Airtable.configure({
    apiKey: process.env.AIRTABLE_API_KEY,
  });
  
  const base = Airtable.base(process.env.AIRTABLE_BASE_ID);
  
  console.log('Fetching stations from Airtable Rail_Stations table...');
  
  const stations = [];
  
  await base('Rail_Stations').select({
    fields: [
      'Station_ID',
      'Name',
      'Lat',
      'Long',
      'Country',
      'Corridor',
      'Status',
    ],
    filterByFormula: '{Status} = "Active"',
  }).eachPage((records, fetchNextPage) => {
    records.forEach(record => {
      const name = record.get('Name') || 'Unknown Station';
      const lat = record.get('Lat');
      const lng = record.get('Long');
      const airtableCountry = record.get('Country');
      
      // Determine country from coordinates if not properly set
      let country = airtableCountry;
      if (!country || country === 'Africa Region') {
        country = lat && lng ? getCountryFromCoords(lat, lng) : 'Unknown Country';
      }
      
      // Extract city from station name
      const city = getCityFromName(name, lat, lng);
      
      stations.push({
        id: record.get('Station_ID') || record.id,
        name: name,
        city: city,
        country: country,
        type: record.get('Corridor') ? 'Corridor Station' : 'Station',
        status: record.get('Status') || 'Active',
        latitude: lat || null,
        longitude: lng || null,
        corridor: record.get('Corridor') || '',
      });
    });
    fetchNextPage();
  });
  
  console.log(`Fetched ${stations.length} stations from Airtable`);
  return stations;
}

/**
 * Organize stations into hierarchical structure
 * Country → City → Stations
 */
function organizeStations(stations) {
  const hierarchy = {};
  
  stations.forEach(station => {
    const country = station.country;
    const city = station.city;
    
    if (!hierarchy[country]) {
      hierarchy[country] = {
        name: country,
        cities: {},
      };
    }
    
    if (!hierarchy[country].cities[city]) {
      hierarchy[country].cities[city] = {
        name: city,
        stations: [],
      };
    }
    
    hierarchy[country].cities[city].stations.push({
      id: station.id,
      name: station.name,
      type: station.type,
      facilities: station.facilities,
      coordinates: station.latitude && station.longitude 
        ? { lat: station.latitude, lng: station.longitude }
        : null,
    });
  });
  
  // Convert to arrays and sort
  const result = {
    countries: Object.keys(hierarchy)
      .sort()
      .map(countryKey => ({
        id: countryKey.toLowerCase().replace(/\s+/g, '-'),
        name: hierarchy[countryKey].name,
        cities: Object.keys(hierarchy[countryKey].cities)
          .sort()
          .map(cityKey => ({
            id: `${countryKey.toLowerCase().replace(/\s+/g, '-')}-${cityKey.toLowerCase().replace(/\s+/g, '-')}`,
            name: hierarchy[countryKey].cities[cityKey].name,
            stations: hierarchy[countryKey].cities[cityKey].stations.sort((a, b) => 
              a.name.localeCompare(b.name)
            ),
          })),
      })),
    metadata: {
      totalCountries: Object.keys(hierarchy).length,
      totalCities: Object.values(hierarchy).reduce(
        (sum, country) => sum + Object.keys(country.cities).length, 0
      ),
      totalStations: stations.length,
      lastUpdated: new Date().toISOString(),
    },
  };
  
  return result;
}

/**
 * Generate sample data for testing (when Airtable is not configured)
 */
function generateSampleData() {
  console.log('Generating sample station data...');
  
  const sampleStations = [
    // Tanzania
    { id: 'TZ-DSM-001', name: 'Dar es Salaam Central', city: 'Dar es Salaam', country: 'Tanzania', type: 'Terminal' },
    { id: 'TZ-DSM-002', name: 'Dar es Salaam Ubungo', city: 'Dar es Salaam', country: 'Tanzania', type: 'Station' },
    { id: 'TZ-MOR-001', name: 'Morogoro Station', city: 'Morogoro', country: 'Tanzania', type: 'Station' },
    { id: 'TZ-DOD-001', name: 'Dodoma Central', city: 'Dodoma', country: 'Tanzania', type: 'Station' },
    { id: 'TZ-MWZ-001', name: 'Mwanza Terminus', city: 'Mwanza', country: 'Tanzania', type: 'Terminal' },
    { id: 'TZ-KIG-001', name: 'Kigoma Station', city: 'Kigoma', country: 'Tanzania', type: 'Terminal' },
    { id: 'TZ-TAB-001', name: 'Tabora Junction', city: 'Tabora', country: 'Tanzania', type: 'Junction' },
    
    // Zambia
    { id: 'ZM-KPM-001', name: 'Kapiri Mposhi Terminal', city: 'Kapiri Mposhi', country: 'Zambia', type: 'Terminal' },
    { id: 'ZM-LSK-001', name: 'Lusaka Central', city: 'Lusaka', country: 'Zambia', type: 'Station' },
    { id: 'ZM-LSK-002', name: 'Lusaka Industrial', city: 'Lusaka', country: 'Zambia', type: 'Freight' },
    { id: 'ZM-NDL-001', name: 'Ndola Station', city: 'Ndola', country: 'Zambia', type: 'Station' },
    { id: 'ZM-KTW-001', name: 'Kitwe Central', city: 'Kitwe', country: 'Zambia', type: 'Station' },
    { id: 'ZM-LVS-001', name: 'Livingstone Station', city: 'Livingstone', country: 'Zambia', type: 'Station' },
    
    // Kenya
    { id: 'KE-NBI-001', name: 'Nairobi Terminus', city: 'Nairobi', country: 'Kenya', type: 'Terminal' },
    { id: 'KE-NBI-002', name: 'Nairobi Central', city: 'Nairobi', country: 'Kenya', type: 'Station' },
    { id: 'KE-NBI-003', name: 'Nairobi South', city: 'Nairobi', country: 'Kenya', type: 'Station' },
    { id: 'KE-MBA-001', name: 'Mombasa Terminus', city: 'Mombasa', country: 'Kenya', type: 'Terminal' },
    { id: 'KE-MBA-002', name: 'Mombasa Port', city: 'Mombasa', country: 'Kenya', type: 'Freight' },
    { id: 'KE-KSM-001', name: 'Kisumu Station', city: 'Kisumu', country: 'Kenya', type: 'Station' },
    { id: 'KE-NKR-001', name: 'Nakuru Station', city: 'Nakuru', country: 'Kenya', type: 'Station' },
    
    // South Africa
    { id: 'ZA-JHB-001', name: 'Johannesburg Park Station', city: 'Johannesburg', country: 'South Africa', type: 'Terminal' },
    { id: 'ZA-JHB-002', name: 'Johannesburg Braamfontein', city: 'Johannesburg', country: 'South Africa', type: 'Station' },
    { id: 'ZA-CPT-001', name: 'Cape Town Central', city: 'Cape Town', country: 'South Africa', type: 'Terminal' },
    { id: 'ZA-CPT-002', name: 'Cape Town Bellville', city: 'Cape Town', country: 'South Africa', type: 'Station' },
    { id: 'ZA-DBN-001', name: 'Durban Central', city: 'Durban', country: 'South Africa', type: 'Terminal' },
    { id: 'ZA-PTA-001', name: 'Pretoria Station', city: 'Pretoria', country: 'South Africa', type: 'Station' },
    
    // Egypt
    { id: 'EG-CAI-001', name: 'Cairo Ramses', city: 'Cairo', country: 'Egypt', type: 'Terminal' },
    { id: 'EG-CAI-002', name: 'Cairo Giza', city: 'Cairo', country: 'Egypt', type: 'Station' },
    { id: 'EG-ALX-001', name: 'Alexandria Misr', city: 'Alexandria', country: 'Egypt', type: 'Terminal' },
    { id: 'EG-LXR-001', name: 'Luxor Station', city: 'Luxor', country: 'Egypt', type: 'Station' },
    { id: 'EG-ASW-001', name: 'Aswan Station', city: 'Aswan', country: 'Egypt', type: 'Terminal' },
    
    // Morocco
    { id: 'MA-CAS-001', name: 'Casablanca Voyageurs', city: 'Casablanca', country: 'Morocco', type: 'Terminal' },
    { id: 'MA-CAS-002', name: 'Casablanca Port', city: 'Casablanca', country: 'Morocco', type: 'Station' },
    { id: 'MA-RAB-001', name: 'Rabat Ville', city: 'Rabat', country: 'Morocco', type: 'Station' },
    { id: 'MA-TNG-001', name: 'Tangier Ville', city: 'Tangier', country: 'Morocco', type: 'Terminal' },
    { id: 'MA-MRK-001', name: 'Marrakech Station', city: 'Marrakech', country: 'Morocco', type: 'Station' },
    
    // Nigeria
    { id: 'NG-LAG-001', name: 'Lagos Terminus', city: 'Lagos', country: 'Nigeria', type: 'Terminal' },
    { id: 'NG-LAG-002', name: 'Lagos Apapa', city: 'Lagos', country: 'Nigeria', type: 'Freight' },
    { id: 'NG-ABJ-001', name: 'Abuja Central', city: 'Abuja', country: 'Nigeria', type: 'Station' },
    { id: 'NG-KAN-001', name: 'Kano Station', city: 'Kano', country: 'Nigeria', type: 'Station' },
    { id: 'NG-IBD-001', name: 'Ibadan Station', city: 'Ibadan', country: 'Nigeria', type: 'Station' },
    
    // Ethiopia
    { id: 'ET-ADD-001', name: 'Addis Ababa Furi', city: 'Addis Ababa', country: 'Ethiopia', type: 'Terminal' },
    { id: 'ET-ADD-002', name: 'Addis Ababa Lebu', city: 'Addis Ababa', country: 'Ethiopia', type: 'Station' },
    { id: 'ET-DJI-001', name: 'Dire Dawa Station', city: 'Dire Dawa', country: 'Ethiopia', type: 'Station' },
    
    // Ghana
    { id: 'GH-ACC-001', name: 'Accra Central', city: 'Accra', country: 'Ghana', type: 'Terminal' },
    { id: 'GH-KUM-001', name: 'Kumasi Station', city: 'Kumasi', country: 'Ghana', type: 'Station' },
    { id: 'GH-TKD-001', name: 'Takoradi Station', city: 'Takoradi', country: 'Ghana', type: 'Station' },
    
    // Uganda
    { id: 'UG-KLA-001', name: 'Kampala Central', city: 'Kampala', country: 'Uganda', type: 'Terminal' },
    { id: 'UG-JIN-001', name: 'Jinja Station', city: 'Jinja', country: 'Uganda', type: 'Station' },
    
    // Senegal
    { id: 'SN-DKR-001', name: 'Dakar Station', city: 'Dakar', country: 'Senegal', type: 'Terminal' },
    { id: 'SN-THS-001', name: 'Thies Station', city: 'Thies', country: 'Senegal', type: 'Station' },
    
    // Angola
    { id: 'AO-LUA-001', name: 'Luanda Bungo', city: 'Luanda', country: 'Angola', type: 'Terminal' },
    { id: 'AO-LBT-001', name: 'Lobito Station', city: 'Lobito', country: 'Angola', type: 'Station' },
    
    // DRC
    { id: 'CD-KIN-001', name: 'Kinshasa Central', city: 'Kinshasa', country: 'DR Congo', type: 'Terminal' },
    { id: 'CD-LUB-001', name: 'Lubumbashi Station', city: 'Lubumbashi', country: 'DR Congo', type: 'Station' },
    
    // Sudan
    { id: 'SD-KRT-001', name: 'Khartoum Central', city: 'Khartoum', country: 'Sudan', type: 'Terminal' },
    { id: 'SD-ATB-001', name: 'Atbara Station', city: 'Atbara', country: 'Sudan', type: 'Station' },
    
    // Algeria
    { id: 'DZ-ALG-001', name: 'Algiers Central', city: 'Algiers', country: 'Algeria', type: 'Terminal' },
    { id: 'DZ-ORN-001', name: 'Oran Station', city: 'Oran', country: 'Algeria', type: 'Station' },
    { id: 'DZ-CST-001', name: 'Constantine Station', city: 'Constantine', country: 'Algeria', type: 'Station' },
    
    // Tunisia
    { id: 'TN-TUN-001', name: 'Tunis Central', city: 'Tunis', country: 'Tunisia', type: 'Terminal' },
    { id: 'TN-SFX-001', name: 'Sfax Station', city: 'Sfax', country: 'Tunisia', type: 'Station' },
    
    // Ivory Coast
    { id: 'CI-ABJ-001', name: 'Abidjan Terminus', city: 'Abidjan', country: 'Ivory Coast', type: 'Terminal' },
    { id: 'CI-BKE-001', name: 'Bouake Station', city: 'Bouake', country: 'Ivory Coast', type: 'Station' },
    
    // Cameroon
    { id: 'CM-DLA-001', name: 'Douala Station', city: 'Douala', country: 'Cameroon', type: 'Terminal' },
    { id: 'CM-YDE-001', name: 'Yaounde Station', city: 'Yaounde', country: 'Cameroon', type: 'Station' },
    
    // Mozambique
    { id: 'MZ-MPT-001', name: 'Maputo Central', city: 'Maputo', country: 'Mozambique', type: 'Terminal' },
    { id: 'MZ-BRA-001', name: 'Beira Station', city: 'Beira', country: 'Mozambique', type: 'Station' },
    
    // Zimbabwe
    { id: 'ZW-HRE-001', name: 'Harare Central', city: 'Harare', country: 'Zimbabwe', type: 'Terminal' },
    { id: 'ZW-BYO-001', name: 'Bulawayo Station', city: 'Bulawayo', country: 'Zimbabwe', type: 'Station' },
    
    // Botswana
    { id: 'BW-GBE-001', name: 'Gaborone Station', city: 'Gaborone', country: 'Botswana', type: 'Terminal' },
    { id: 'BW-FRT-001', name: 'Francistown Station', city: 'Francistown', country: 'Botswana', type: 'Station' },
    
    // Namibia
    { id: 'NA-WDH-001', name: 'Windhoek Station', city: 'Windhoek', country: 'Namibia', type: 'Terminal' },
    { id: 'NA-WAL-001', name: 'Walvis Bay Station', city: 'Walvis Bay', country: 'Namibia', type: 'Station' },
  ];
  
  return sampleStations;
}

/**
 * Main sync function
 */
async function syncStations() {
  console.log('');
  console.log('Africa Railways Station Sync');
  console.log('='.repeat(50));
  console.log('');
  
  let stations;
  
  // Try to fetch from Airtable, fall back to sample data
  if (process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID) {
    try {
      stations = await fetchStationsFromAirtable();
    } catch (error) {
      console.log(`Airtable fetch failed: ${error.message}`);
      console.log('Using sample data instead...');
      stations = generateSampleData();
    }
  } else {
    console.log('Airtable not configured, using sample data...');
    stations = generateSampleData();
  }
  
  // Organize into hierarchy
  console.log('Organizing stations by Country → City...');
  const organized = organizeStations(stations);
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Write to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(organized, null, 2));
  
  console.log('');
  console.log('Summary:');
  console.log(`  Countries: ${organized.metadata.totalCountries}`);
  console.log(`  Cities: ${organized.metadata.totalCities}`);
  console.log(`  Stations: ${organized.metadata.totalStations}`);
  console.log(`  Output: ${OUTPUT_FILE}`);
  console.log('');
  
  return organized;
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  syncStations()
    .then(() => {
      console.log('Station sync completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Station sync failed:', error.message);
      process.exit(1);
    });
}

export { syncStations, fetchStationsFromAirtable, organizeStations, generateSampleData };
export default syncStations;
