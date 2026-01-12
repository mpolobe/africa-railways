#!/usr/bin/env node

/**
 * Scrape African Railway Stations from OpenStreetMap
 * 
 * Uses Overpass API to fetch railway stations within Africa's bounding box
 * and merges with existing Airtable data
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, '../../data/stations.json');

// African bounding box (approximate)
const AFRICA_BOUNDS = {
  south: -35,
  west: -18,
  north: 38,
  east: 52
};

// Country detection from coordinates
const AFRICAN_COUNTRIES = [
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
  { name: 'Mauritania', latMin: 14, latMax: 28, lngMin: -17, lngMax: -5 },
  { name: 'Niger', latMin: 11, latMax: 24, lngMin: 0, lngMax: 16 },
  { name: 'Burkina Faso', latMin: 9, latMax: 15, lngMin: -6, lngMax: 3 },
  { name: 'Benin', latMin: 6, latMax: 13, lngMin: 0, lngMax: 4 },
  { name: 'Togo', latMin: 6, latMax: 11, lngMin: -1, lngMax: 2 },
  { name: 'Gabon', latMin: -4, latMax: 3, lngMin: 8, lngMax: 15 },
  { name: 'Republic of Congo', latMin: -5, latMax: 4, lngMin: 11, lngMax: 19 },
  { name: 'Eritrea', latMin: 12, latMax: 18, lngMin: 36, lngMax: 44 },
  { name: 'Djibouti', latMin: 10, latMax: 13, lngMin: 41, lngMax: 44 },
  { name: 'Somalia', latMin: -2, latMax: 12, lngMin: 40, lngMax: 52 },
  { name: 'Madagascar', latMin: -26, latMax: -12, lngMin: 43, lngMax: 51 },
  { name: 'Malawi', latMin: -17, latMax: -9, lngMin: 32, lngMax: 36 },
  { name: 'Rwanda', latMin: -3, latMax: -1, lngMin: 28, lngMax: 31 },
  { name: 'Burundi', latMin: -5, latMax: -2, lngMin: 28, lngMax: 31 },
  { name: 'Lesotho', latMin: -31, latMax: -28, lngMin: 27, lngMax: 30 },
  { name: 'Eswatini', latMin: -28, latMax: -25, lngMin: 30, lngMax: 33 },
  { name: 'Guinea', latMin: 7, latMax: 13, lngMin: -15, lngMax: -7 },
  { name: 'Sierra Leone', latMin: 6, latMax: 10, lngMin: -14, lngMax: -10 },
  { name: 'Liberia', latMin: 4, latMax: 9, lngMin: -12, lngMax: -7 },
  { name: 'Central African Republic', latMin: 2, latMax: 11, lngMin: 14, lngMax: 28 },
  { name: 'Chad', latMin: 7, latMax: 24, lngMin: 13, lngMax: 24 },
  { name: 'South Sudan', latMin: 3, latMax: 13, lngMin: 24, lngMax: 36 },
];

function getCountryFromCoords(lat, lng) {
  for (const country of AFRICAN_COUNTRIES) {
    if (lat >= country.latMin && lat <= country.latMax &&
        lng >= country.lngMin && lng <= country.lngMax) {
      return country.name;
    }
  }
  return null; // Not in Africa
}

function getCityFromTags(tags, name) {
  // Try to get city from tags
  if (tags['addr:city']) return tags['addr:city'];
  if (tags['is_in:city']) return tags['is_in:city'];
  
  // Extract from name
  const patterns = [
    /^(.+?)\s+(Station|Terminal|Terminus|Gare|Estação|محطة|Gara)$/i,
    /^(.+?)\s*[-–]\s*(.+)$/,
    /^(Gare de|Station)\s+(.+)$/i,
  ];
  
  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      return match[1] || match[2];
    }
  }
  
  return name.split(/[-–,]/)[0].trim();
}

async function fetchOSMStations() {
  console.log('Fetching railway stations from OpenStreetMap...');
  
  // Overpass query for railway stations in Africa
  const query = `
    [out:json][timeout:120];
    (
      node["railway"="station"](${AFRICA_BOUNDS.south},${AFRICA_BOUNDS.west},${AFRICA_BOUNDS.north},${AFRICA_BOUNDS.east});
      node["railway"="halt"](${AFRICA_BOUNDS.south},${AFRICA_BOUNDS.west},${AFRICA_BOUNDS.north},${AFRICA_BOUNDS.east});
    );
    out body;
  `;
  
  try {
    const response = await axios.post(
      'https://overpass-api.de/api/interpreter',
      `data=${encodeURIComponent(query)}`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 180000, // 3 minutes
      }
    );
    
    const elements = response.data.elements || [];
    console.log(`Fetched ${elements.length} railway nodes from OSM`);
    
    // Filter to only African stations
    const africanStations = [];
    
    for (const element of elements) {
      const lat = element.lat;
      const lng = element.lon;
      const tags = element.tags || {};
      const name = tags.name || tags['name:en'] || tags['name:fr'] || tags['name:ar'] || 'Unnamed Station';
      
      // Skip subway/metro stations
      if (tags.station === 'subway' || tags.subway === 'yes') continue;
      
      // Get country from coordinates
      const country = getCountryFromCoords(lat, lng);
      if (!country) continue; // Not in Africa
      
      const city = getCityFromTags(tags, name);
      
      africanStations.push({
        id: `OSM-${element.id}`,
        name: name,
        city: city,
        country: country,
        type: tags.railway === 'halt' ? 'Halt' : (tags.usage === 'main' ? 'Station' : 'Station'),
        latitude: lat,
        longitude: lng,
        operator: tags.operator || '',
        source: 'OpenStreetMap',
      });
    }
    
    console.log(`Filtered to ${africanStations.length} African stations`);
    return africanStations;
  } catch (error) {
    console.error('Error fetching from OSM:', error.message);
    return [];
  }
}

async function mergeWithExisting(newStations) {
  console.log('Merging with existing station data...');
  
  // Load existing data
  let existingData = { countries: [], metadata: {} };
  if (fs.existsSync(OUTPUT_FILE)) {
    existingData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
  }
  
  // Create a set of existing station IDs and coordinates for deduplication
  const existingIds = new Set();
  const existingCoords = new Set();
  
  for (const country of existingData.countries) {
    for (const city of country.cities) {
      for (const station of city.stations) {
        existingIds.add(station.id);
        if (station.coordinates) {
          // Round to 3 decimal places for fuzzy matching (~100m precision)
          const coordKey = `${station.coordinates.lat.toFixed(3)},${station.coordinates.lng.toFixed(3)}`;
          existingCoords.add(coordKey);
        }
      }
    }
  }
  
  // Filter out duplicates
  const uniqueNewStations = newStations.filter(station => {
    if (existingIds.has(station.id)) return false;
    
    const coordKey = `${station.latitude.toFixed(3)},${station.longitude.toFixed(3)}`;
    if (existingCoords.has(coordKey)) return false;
    
    return true;
  });
  
  console.log(`Found ${uniqueNewStations.length} new unique stations`);
  
  // Add new stations to the hierarchy
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
      operator: station.operator,
      source: station.source,
    });
  }
  
  // Sort everything
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
    sources: ['Airtable', 'OpenStreetMap'],
  };
  
  return existingData;
}

async function main() {
  console.log('');
  console.log('OpenStreetMap African Railway Stations Scraper');
  console.log('='.repeat(50));
  console.log('');
  
  // Fetch from OSM
  const osmStations = await fetchOSMStations();
  
  if (osmStations.length === 0) {
    console.log('No stations fetched from OSM');
    return;
  }
  
  // Merge with existing
  const mergedData = await mergeWithExisting(osmStations);
  
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
