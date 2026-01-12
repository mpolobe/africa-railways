#!/usr/bin/env node

/**
 * Web Scraper for Africa Railways
 * 
 * Scenario B: Scrapes data when no API is available
 * Supports multiple railway websites and data sources
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

/**
 * Create configured HTTP client
 */
function createClient(baseURL, options = {}) {
  return axios.create({
    baseURL,
    timeout: options.timeout || DEFAULT_TIMEOUT,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; AfricaRailwaysBot/1.0)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      ...options.headers,
    },
  });
}

/**
 * Retry wrapper for HTTP requests
 */
async function fetchWithRetry(client, url, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await client.get(url);
      return response.data;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      console.log(`  Retry ${attempt}/${retries} for ${url}...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
    }
  }
}

/**
 * Scraper configuration for different railway websites
 */
const SCRAPER_CONFIGS = {
  // TAZARA Railway (Tanzania-Zambia)
  tazara: {
    baseURL: 'https://www.tazarasite.com',
    schedules: {
      path: '/schedules',
      container: '.schedule-row, .timetable-row, tr.schedule',
      fields: {
        trainNumber: '.train-no, .train-number, td:nth-child(1)',
        origin: '.origin, .from, td:nth-child(2)',
        destination: '.destination, .to, td:nth-child(3)',
        departureTime: '.departure, .depart, td:nth-child(4)',
        arrivalTime: '.arrival, .arrive, td:nth-child(5)',
        days: '.days, .operating-days, td:nth-child(6)',
        class: '.class, .service-class, td:nth-child(7)',
      },
    },
    stations: {
      path: '/stations',
      container: '.station-card, .station-item, li.station',
      fields: {
        name: '.station-name, .name, h3',
        code: '.station-code, .code',
        city: '.city, .location',
        country: '.country',
        facilities: '.facilities, .amenities',
      },
    },
  },

  // Kenya Railways
  kenya: {
    baseURL: 'https://metrokenya.co.ke',
    schedules: {
      path: '/train-schedule',
      container: '.schedule-item, .train-row',
      fields: {
        trainNumber: '.train-id',
        origin: '.from-station',
        destination: '.to-station',
        departureTime: '.departure-time',
        arrivalTime: '.arrival-time',
        price: '.fare, .price',
      },
    },
  },

  // South African Railways (Shosholoza Meyl)
  southafrica: {
    baseURL: 'https://www.shosholozameyl.co.za',
    schedules: {
      path: '/schedules',
      container: '.route-schedule',
      fields: {
        trainNumber: '.train-name',
        origin: '.origin-city',
        destination: '.destination-city',
        departureTime: '.depart-time',
        arrivalTime: '.arrive-time',
        frequency: '.frequency',
      },
    },
  },

  // Generic fallback
  generic: {
    baseURL: process.env.AFRICA_RAIL_BASE_URL || 'https://example.com',
    schedules: {
      path: '/train-schedules',
      container: '.schedule-row',
      fields: {
        trainNumber: '.train-no',
        origin: '.origin',
        destination: '.destination',
        departureTime: '.departure',
        arrivalTime: '.arrival',
      },
    },
    stations: {
      path: '/stations',
      container: '.station-card',
      fields: {
        name: '.station-name',
        code: '.station-code',
        city: '.city',
      },
    },
  },
};

/**
 * Generic scraper function
 */
async function scrape(config, dataType) {
  const client = createClient(config.baseURL);
  const scrapeConfig = config[dataType];

  if (!scrapeConfig) {
    throw new Error(`No scrape config for ${dataType}`);
  }

  const html = await fetchWithRetry(client, scrapeConfig.path);
  const $ = cheerio.load(html);
  const results = [];

  $(scrapeConfig.container).each((index, element) => {
    const $el = $(element);
    const item = { _index: index };

    Object.entries(scrapeConfig.fields).forEach(([field, selectors]) => {
      // Support multiple selectors (comma-separated)
      const selectorList = selectors.split(',').map(s => s.trim());
      
      for (const selector of selectorList) {
        const value = $el.find(selector).text().trim();
        if (value) {
          item[field] = value;
          break;
        }
      }
    });

    // Only add if we got meaningful data
    if (Object.keys(item).length > 1) {
      results.push(item);
    }
  });

  return results;
}

/**
 * Scrape schedules from configured source
 */
export async function scrapeSchedules(source = 'generic') {
  const config = SCRAPER_CONFIGS[source] || SCRAPER_CONFIGS.generic;
  
  console.log(`Scraping schedules from ${config.baseURL}...`);
  
  try {
    const schedules = await scrape(config, 'schedules');
    console.log(`  Found ${schedules.length} schedules`);
    return schedules;
  } catch (error) {
    console.error(`  Error: ${error.message}`);
    return [];
  }
}

/**
 * Scrape stations from configured source
 */
export async function scrapeStations(source = 'generic') {
  const config = SCRAPER_CONFIGS[source] || SCRAPER_CONFIGS.generic;
  
  if (!config.stations) {
    console.log(`  No station config for ${source}`);
    return [];
  }
  
  console.log(`Scraping stations from ${config.baseURL}...`);
  
  try {
    const stations = await scrape(config, 'stations');
    console.log(`  Found ${stations.length} stations`);
    return stations;
  } catch (error) {
    console.error(`  Error: ${error.message}`);
    return [];
  }
}

/**
 * Scrape from custom URL with custom selectors
 */
export async function scrapeCustom(url, containerSelector, fieldSelectors) {
  const client = createClient(url);
  
  console.log(`Scraping custom URL: ${url}...`);
  
  try {
    const html = await fetchWithRetry(client, '/');
    const $ = cheerio.load(html);
    const results = [];

    $(containerSelector).each((index, element) => {
      const $el = $(element);
      const item = {};

      Object.entries(fieldSelectors).forEach(([field, selector]) => {
        item[field] = $el.find(selector).text().trim();
      });

      if (Object.keys(item).some(k => item[k])) {
        results.push(item);
      }
    });

    console.log(`  Found ${results.length} items`);
    return results;
  } catch (error) {
    console.error(`  Error: ${error.message}`);
    return [];
  }
}

/**
 * Transform scraped schedule to Airtable format
 */
export function transformSchedule(schedule, source = 'website') {
  return {
    'Schedule ID': `SCH-${schedule.trainNumber || schedule._index}-${Date.now()}`,
    'Train': schedule.trainNumber || 'Unknown',
    'Route': `${schedule.origin || 'N/A'} - ${schedule.destination || 'N/A'}`,
    'Departure Station': schedule.origin || '',
    'Arrival Station': schedule.destination || '',
    'Departure Time': schedule.departureTime || '',
    'Arrival Time': schedule.arrivalTime || '',
    'Operating Days': schedule.days || 'Daily',
    'Service Class': schedule.class || 'Standard',
    'Status': 'Active',
    'Source': source,
    'Last Updated': new Date().toISOString(),
  };
}

/**
 * Transform scraped station to Airtable format
 */
export function transformStation(station, source = 'website') {
  return {
    'Station ID': station.code || `STN-${station._index || Date.now()}`,
    'Name': station.name || 'Unknown Station',
    'City': station.city || '',
    'Country': station.country || '',
    'Type': 'Station',
    'Facilities': station.facilities || '',
    'Status': 'Active',
    'Source': source,
    'Last Updated': new Date().toISOString(),
  };
}

/**
 * Scrape all data from all configured sources
 */
export async function scrapeAll() {
  const results = {
    schedules: [],
    stations: [],
    sources: [],
  };

  for (const [source, config] of Object.entries(SCRAPER_CONFIGS)) {
    if (source === 'generic') continue;

    console.log(`\nScraping ${source}...`);
    
    try {
      const schedules = await scrapeSchedules(source);
      results.schedules.push(...schedules.map(s => ({ ...s, source })));
      
      const stations = await scrapeStations(source);
      results.stations.push(...stations.map(s => ({ ...s, source })));
      
      results.sources.push({ name: source, status: 'success' });
    } catch (error) {
      console.error(`  Failed: ${error.message}`);
      results.sources.push({ name: source, status: 'failed', error: error.message });
    }

    // Rate limiting between sources
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const source = process.argv[2] || 'generic';
  const dataType = process.argv[3] || 'schedules';

  console.log('Africa Railways Web Scraper');
  console.log('='.repeat(50));
  console.log(`Source: ${source}`);
  console.log(`Data Type: ${dataType}`);
  console.log('');

  (async () => {
    try {
      let data;
      
      if (source === 'all') {
        data = await scrapeAll();
        console.log('\nResults:');
        console.log(`  Schedules: ${data.schedules.length}`);
        console.log(`  Stations: ${data.stations.length}`);
        console.log(`  Sources: ${data.sources.map(s => `${s.name}(${s.status})`).join(', ')}`);
      } else if (dataType === 'schedules') {
        data = await scrapeSchedules(source);
      } else if (dataType === 'stations') {
        data = await scrapeStations(source);
      }

      if (data && data.length > 0) {
        console.log('\nSample data:');
        console.log(JSON.stringify(data[0], null, 2));
      }

      process.exit(0);
    } catch (error) {
      console.error('Scraping failed:', error.message);
      process.exit(1);
    }
  })();
}

export default {
  scrapeSchedules,
  scrapeStations,
  scrapeCustom,
  scrapeAll,
  transformSchedule,
  transformStation,
  SCRAPER_CONFIGS,
};
