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
 * Fetch all stations from Airtable
 */
async function fetchStationsFromAirtable() {
  const Airtable = (await import('airtable')).default;
  
  Airtable.configure({
    apiKey: process.env.AIRTABLE_API_KEY,
  });
  
  const base = Airtable.base(process.env.AIRTABLE_INFRASTRUCTURE_BASE_ID || process.env.AIRTABLE_BASE_ID);
  
  console.log('Fetching stations from Airtable...');
  
  const stations = [];
  
  await base('Stations').select({
    // Adjust field names based on your Airtable schema
    fields: [
      'Station ID',
      'Name',
      'City',
      'Country',
      'Type',
      'Status',
      'Latitude',
      'Longitude',
      'Facilities',
      'Rail Line',
    ],
    filterByFormula: '{Status} = "Active"',
  }).eachPage((records, fetchNextPage) => {
    records.forEach(record => {
      stations.push({
        id: record.get('Station ID') || record.id,
        name: record.get('Name') || 'Unknown Station',
        city: record.get('City') || 'Unknown City',
        country: record.get('Country') || 'Unknown Country',
        type: record.get('Type') || 'Station',
        status: record.get('Status') || 'Active',
        latitude: record.get('Latitude') || null,
        longitude: record.get('Longitude') || null,
        facilities: record.get('Facilities') || '',
        railLine: record.get('Rail Line') || '',
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
