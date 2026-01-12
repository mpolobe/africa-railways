#!/usr/bin/env node

/**
 * Scrape African Railway Stations from Google Places API
 * 
 * Uses Google Places API to search for railway stations across African countries
 * and merges with existing station data
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, '../../data/stations.json');

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || 'AIzaSyApUDWhByJ7BTL0KIIKLjjBxnz4CweV4yE';

// Major African cities to search for railway stations
const AFRICAN_CITIES = [
  // Egypt
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
  { name: 'Alexandria', country: 'Egypt', lat: 31.2001, lng: 29.9187 },
  { name: 'Luxor', country: 'Egypt', lat: 25.6872, lng: 32.6396 },
  { name: 'Aswan', country: 'Egypt', lat: 24.0889, lng: 32.8998 },
  { name: 'Giza', country: 'Egypt', lat: 30.0131, lng: 31.2089 },
  
  // Morocco
  { name: 'Casablanca', country: 'Morocco', lat: 33.5731, lng: -7.5898 },
  { name: 'Rabat', country: 'Morocco', lat: 34.0209, lng: -6.8416 },
  { name: 'Marrakech', country: 'Morocco', lat: 31.6295, lng: -7.9811 },
  { name: 'Fes', country: 'Morocco', lat: 34.0181, lng: -5.0078 },
  { name: 'Tangier', country: 'Morocco', lat: 35.7595, lng: -5.8340 },
  { name: 'Meknes', country: 'Morocco', lat: 33.8731, lng: -5.5407 },
  { name: 'Oujda', country: 'Morocco', lat: 34.6867, lng: -1.9114 },
  
  // South Africa
  { name: 'Johannesburg', country: 'South Africa', lat: -26.2041, lng: 28.0473 },
  { name: 'Cape Town', country: 'South Africa', lat: -33.9249, lng: 18.4241 },
  { name: 'Durban', country: 'South Africa', lat: -29.8587, lng: 31.0218 },
  { name: 'Pretoria', country: 'South Africa', lat: -25.7479, lng: 28.2293 },
  { name: 'Port Elizabeth', country: 'South Africa', lat: -33.9608, lng: 25.6022 },
  { name: 'Bloemfontein', country: 'South Africa', lat: -29.0852, lng: 26.1596 },
  { name: 'East London', country: 'South Africa', lat: -33.0153, lng: 27.9116 },
  
  // Kenya
  { name: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219 },
  { name: 'Mombasa', country: 'Kenya', lat: -4.0435, lng: 39.6682 },
  { name: 'Kisumu', country: 'Kenya', lat: -0.1022, lng: 34.7617 },
  { name: 'Nakuru', country: 'Kenya', lat: -0.3031, lng: 36.0800 },
  { name: 'Naivasha', country: 'Kenya', lat: -0.7172, lng: 36.4320 },
  
  // Tanzania
  { name: 'Dar es Salaam', country: 'Tanzania', lat: -6.7924, lng: 39.2083 },
  { name: 'Dodoma', country: 'Tanzania', lat: -6.1630, lng: 35.7516 },
  { name: 'Mwanza', country: 'Tanzania', lat: -2.5164, lng: 32.9175 },
  { name: 'Arusha', country: 'Tanzania', lat: -3.3869, lng: 36.6830 },
  { name: 'Morogoro', country: 'Tanzania', lat: -6.8235, lng: 37.6603 },
  { name: 'Tabora', country: 'Tanzania', lat: -5.0167, lng: 32.8000 },
  { name: 'Kigoma', country: 'Tanzania', lat: -4.8769, lng: 29.6266 },
  
  // Nigeria
  { name: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792 },
  { name: 'Abuja', country: 'Nigeria', lat: 9.0765, lng: 7.3986 },
  { name: 'Kano', country: 'Nigeria', lat: 12.0022, lng: 8.5920 },
  { name: 'Ibadan', country: 'Nigeria', lat: 7.3775, lng: 3.9470 },
  { name: 'Port Harcourt', country: 'Nigeria', lat: 4.8156, lng: 7.0498 },
  { name: 'Kaduna', country: 'Nigeria', lat: 10.5105, lng: 7.4165 },
  
  // Ethiopia
  { name: 'Addis Ababa', country: 'Ethiopia', lat: 9.0320, lng: 38.7469 },
  { name: 'Dire Dawa', country: 'Ethiopia', lat: 9.6009, lng: 41.8501 },
  { name: 'Adama', country: 'Ethiopia', lat: 8.5400, lng: 39.2700 },
  
  // Algeria
  { name: 'Algiers', country: 'Algeria', lat: 36.7538, lng: 3.0588 },
  { name: 'Oran', country: 'Algeria', lat: 35.6969, lng: -0.6331 },
  { name: 'Constantine', country: 'Algeria', lat: 36.3650, lng: 6.6147 },
  { name: 'Annaba', country: 'Algeria', lat: 36.9000, lng: 7.7667 },
  
  // Tunisia
  { name: 'Tunis', country: 'Tunisia', lat: 36.8065, lng: 10.1815 },
  { name: 'Sfax', country: 'Tunisia', lat: 34.7406, lng: 10.7603 },
  { name: 'Sousse', country: 'Tunisia', lat: 35.8288, lng: 10.6405 },
  
  // Ghana
  { name: 'Accra', country: 'Ghana', lat: 5.6037, lng: -0.1870 },
  { name: 'Kumasi', country: 'Ghana', lat: 6.6666, lng: -1.6163 },
  { name: 'Takoradi', country: 'Ghana', lat: 4.8845, lng: -1.7554 },
  
  // Zambia
  { name: 'Lusaka', country: 'Zambia', lat: -15.3875, lng: 28.3228 },
  { name: 'Kitwe', country: 'Zambia', lat: -12.8024, lng: 28.2132 },
  { name: 'Ndola', country: 'Zambia', lat: -12.9587, lng: 28.6366 },
  { name: 'Livingstone', country: 'Zambia', lat: -17.8419, lng: 25.8544 },
  { name: 'Kapiri Mposhi', country: 'Zambia', lat: -13.9833, lng: 28.6833 },
  
  // Zimbabwe
  { name: 'Harare', country: 'Zimbabwe', lat: -17.8252, lng: 31.0335 },
  { name: 'Bulawayo', country: 'Zimbabwe', lat: -20.1325, lng: 28.6265 },
  { name: 'Victoria Falls', country: 'Zimbabwe', lat: -17.9243, lng: 25.8572 },
  
  // Mozambique
  { name: 'Maputo', country: 'Mozambique', lat: -25.9692, lng: 32.5732 },
  { name: 'Beira', country: 'Mozambique', lat: -19.8436, lng: 34.8389 },
  { name: 'Nampula', country: 'Mozambique', lat: -15.1165, lng: 39.2666 },
  
  // Angola
  { name: 'Luanda', country: 'Angola', lat: -8.8390, lng: 13.2894 },
  { name: 'Lobito', country: 'Angola', lat: -12.3644, lng: 13.5361 },
  { name: 'Benguela', country: 'Angola', lat: -12.5763, lng: 13.4055 },
  
  // DR Congo
  { name: 'Kinshasa', country: 'DR Congo', lat: -4.4419, lng: 15.2663 },
  { name: 'Lubumbashi', country: 'DR Congo', lat: -11.6876, lng: 27.5026 },
  { name: 'Matadi', country: 'DR Congo', lat: -5.8167, lng: 13.4500 },
  
  // Sudan
  { name: 'Khartoum', country: 'Sudan', lat: 15.5007, lng: 32.5599 },
  { name: 'Atbara', country: 'Sudan', lat: 17.7000, lng: 33.9833 },
  { name: 'Port Sudan', country: 'Sudan', lat: 19.6158, lng: 37.2164 },
  
  // Uganda
  { name: 'Kampala', country: 'Uganda', lat: 0.3476, lng: 32.5825 },
  { name: 'Jinja', country: 'Uganda', lat: 0.4244, lng: 33.2041 },
  
  // Senegal
  { name: 'Dakar', country: 'Senegal', lat: 14.7167, lng: -17.4677 },
  { name: 'Thies', country: 'Senegal', lat: 14.7886, lng: -16.9260 },
  
  // Ivory Coast
  { name: 'Abidjan', country: 'Ivory Coast', lat: 5.3600, lng: -4.0083 },
  { name: 'Bouake', country: 'Ivory Coast', lat: 7.6833, lng: -5.0331 },
  
  // Cameroon
  { name: 'Douala', country: 'Cameroon', lat: 4.0511, lng: 9.7679 },
  { name: 'Yaounde', country: 'Cameroon', lat: 3.8480, lng: 11.5021 },
  
  // Botswana
  { name: 'Gaborone', country: 'Botswana', lat: -24.6282, lng: 25.9231 },
  { name: 'Francistown', country: 'Botswana', lat: -21.1661, lng: 27.5144 },
  
  // Namibia
  { name: 'Windhoek', country: 'Namibia', lat: -22.5609, lng: 17.0658 },
  { name: 'Walvis Bay', country: 'Namibia', lat: -22.9575, lng: 14.5053 },
  
  // Libya
  { name: 'Tripoli', country: 'Libya', lat: 32.8872, lng: 13.1913 },
  { name: 'Benghazi', country: 'Libya', lat: 32.1194, lng: 20.0868 },
  
  // Eritrea
  { name: 'Asmara', country: 'Eritrea', lat: 15.3229, lng: 38.9251 },
  { name: 'Massawa', country: 'Eritrea', lat: 15.6073, lng: 39.4503 },
  
  // Djibouti
  { name: 'Djibouti City', country: 'Djibouti', lat: 11.5886, lng: 43.1456 },
  
  // Madagascar
  { name: 'Antananarivo', country: 'Madagascar', lat: -18.8792, lng: 47.5079 },
  { name: 'Toamasina', country: 'Madagascar', lat: -18.1443, lng: 49.3958 },
];

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Search for railway stations near a location using Google Places API
 */
async function searchStationsNearCity(city) {
  const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
  
  try {
    const response = await axios.get(url, {
      params: {
        location: `${city.lat},${city.lng}`,
        radius: 50000, // 50km radius
        type: 'train_station',
        key: GOOGLE_API_KEY,
      },
    });
    
    if (response.data.status === 'OK') {
      return response.data.results.map(place => ({
        id: `GOOGLE-${place.place_id}`,
        name: place.name,
        city: city.name,
        country: city.country,
        type: 'Station',
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        address: place.vicinity || '',
        rating: place.rating || null,
        source: 'Google Places',
      }));
    } else if (response.data.status === 'ZERO_RESULTS') {
      return [];
    } else {
      console.log(`  Warning: ${response.data.status} for ${city.name}`);
      return [];
    }
  } catch (error) {
    console.error(`  Error searching ${city.name}:`, error.message);
    return [];
  }
}

/**
 * Search for railway stations using text search
 */
async function textSearchStations(query, country) {
  const url = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
  
  try {
    const response = await axios.get(url, {
      params: {
        query: `${query} railway station ${country}`,
        type: 'train_station',
        key: GOOGLE_API_KEY,
      },
    });
    
    if (response.data.status === 'OK') {
      return response.data.results.map(place => ({
        id: `GOOGLE-${place.place_id}`,
        name: place.name,
        city: query,
        country: country,
        type: 'Station',
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        address: place.formatted_address || '',
        rating: place.rating || null,
        source: 'Google Places',
      }));
    }
    return [];
  } catch (error) {
    console.error(`  Error text searching ${query}:`, error.message);
    return [];
  }
}

/**
 * Merge new stations with existing data
 */
async function mergeWithExisting(newStations) {
  console.log('Merging with existing station data...');
  
  // Load existing data
  let existingData = { countries: [], metadata: {} };
  if (fs.existsSync(OUTPUT_FILE)) {
    existingData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
  }
  
  // Create sets for deduplication
  const existingIds = new Set();
  const existingCoords = new Set();
  
  for (const country of existingData.countries) {
    for (const city of country.cities) {
      for (const station of city.stations) {
        existingIds.add(station.id);
        if (station.coordinates) {
          const coordKey = `${station.coordinates.lat.toFixed(3)},${station.coordinates.lng.toFixed(3)}`;
          existingCoords.add(coordKey);
        }
      }
    }
  }
  
  // Filter duplicates
  const uniqueNewStations = newStations.filter(station => {
    if (existingIds.has(station.id)) return false;
    const coordKey = `${station.latitude.toFixed(3)},${station.longitude.toFixed(3)}`;
    if (existingCoords.has(coordKey)) return false;
    return true;
  });
  
  console.log(`Found ${uniqueNewStations.length} new unique stations from Google`);
  
  // Add new stations
  for (const station of uniqueNewStations) {
    let countryObj = existingData.countries.find(c => c.name === station.country);
    
    if (!countryObj) {
      countryObj = {
        id: station.country.toLowerCase().replace(/\s+/g, '-'),
        name: station.country,
        cities: [],
      };
      existingData.countries.push(countryObj);
    }
    
    let cityObj = countryObj.cities.find(c => c.name === station.city);
    
    if (!cityObj) {
      cityObj = {
        id: `${countryObj.id}-${station.city.toLowerCase().replace(/\s+/g, '-')}`,
        name: station.city,
        stations: [],
      };
      countryObj.cities.push(cityObj);
    }
    
    cityObj.stations.push({
      id: station.id,
      name: station.name,
      type: station.type,
      coordinates: {
        lat: station.latitude,
        lng: station.longitude,
      },
      address: station.address,
      rating: station.rating,
      source: station.source,
    });
  }
  
  // Sort
  existingData.countries.sort((a, b) => a.name.localeCompare(b.name));
  for (const country of existingData.countries) {
    country.cities.sort((a, b) => a.name.localeCompare(b.name));
    for (const city of country.cities) {
      city.stations.sort((a, b) => a.name.localeCompare(b.name));
    }
  }
  
  // Update metadata
  let totalStations = 0;
  let totalCities = 0;
  for (const country of existingData.countries) {
    totalCities += country.cities.length;
    for (const city of country.cities) {
      totalStations += city.stations.length;
    }
  }
  
  existingData.metadata = {
    totalCountries: existingData.countries.length,
    totalCities: totalCities,
    totalStations: totalStations,
    lastUpdated: new Date().toISOString(),
    sources: ['Airtable', 'OpenStreetMap', 'Google Places'],
  };
  
  return existingData;
}

async function main() {
  console.log('');
  console.log('Google Places African Railway Stations Scraper');
  console.log('='.repeat(50));
  console.log('');
  
  const allStations = [];
  let processed = 0;
  
  for (const city of AFRICAN_CITIES) {
    processed++;
    console.log(`[${processed}/${AFRICAN_CITIES.length}] Searching ${city.name}, ${city.country}...`);
    
    const stations = await searchStationsNearCity(city);
    
    if (stations.length > 0) {
      console.log(`  Found ${stations.length} stations`);
      allStations.push(...stations);
    }
    
    // Rate limiting - Google allows 10 QPS but let's be conservative
    await delay(200);
  }
  
  console.log('');
  console.log(`Total stations found: ${allStations.length}`);
  
  if (allStations.length === 0) {
    console.log('No stations found from Google Places');
    return;
  }
  
  // Merge with existing
  const mergedData = await mergeWithExisting(allStations);
  
  // Save
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(mergedData, null, 2));
  
  console.log('');
  console.log('Summary:');
  console.log(`  Countries: ${mergedData.metadata.totalCountries}`);
  console.log(`  Cities: ${mergedData.metadata.totalCities}`);
  console.log(`  Stations: ${mergedData.metadata.totalStations}`);
  console.log(`  Output: ${OUTPUT_FILE}`);
  console.log('');
}

// Run
main().catch(console.error);
