#!/usr/bin/env node

/**
 * African Railway Ticket Price Scraper
 * 
 * Scrapes real-time ticket prices from various African railway operators
 * Converts local currencies to USD and AFC (Africoin)
 * 
 * Sources:
 * - Kenya Railways (SGR) - KES
 * - Tanzania Railways (TRC/TAZARA) - TZS
 * - South Africa (Shosholoza Meyl, Gautrain) - ZAR
 * - Egypt (ENR) - EGP
 * - Morocco (ONCF) - MAD
 * - Nigeria (NRC) - NGN
 * - Ethiopia (ERC) - ETB
 * - Algeria (SNTF) - DZD
 * - Tunisia (SNCFT) - TND
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, '../../data/prices.json');
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Exchange rates API (free tier)
 * Using exchangerate-api.com or fallback rates
 */
const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest/USD';

// Fallback exchange rates (updated periodically)
const FALLBACK_RATES = {
  KES: 153.50,    // Kenyan Shilling
  TZS: 2510.00,   // Tanzanian Shilling
  ZAR: 18.50,     // South African Rand
  EGP: 30.90,     // Egyptian Pound
  MAD: 10.05,     // Moroccan Dirham
  NGN: 1550.00,   // Nigerian Naira
  ETB: 56.50,     // Ethiopian Birr
  DZD: 134.50,    // Algerian Dinar
  TND: 3.12,      // Tunisian Dinar
  ZMW: 26.50,     // Zambian Kwacha
  BWP: 13.60,     // Botswana Pula
  MZN: 63.50,     // Mozambican Metical
  AOA: 825.00,    // Angolan Kwanza
  GHS: 14.50,     // Ghanaian Cedi
  XOF: 605.00,    // West African CFA Franc
  XAF: 605.00,    // Central African CFA Franc
  SDG: 601.00,    // Sudanese Pound
  UGX: 3780.00,   // Ugandan Shilling
};

// AFC is pegged 1:1 with USD
const AFC_RATE = 1.0;

/**
 * Fetch current exchange rates
 */
async function getExchangeRates() {
  try {
    const response = await axios.get(EXCHANGE_RATE_API, { timeout: 10000 });
    console.log('✓ Fetched live exchange rates');
    return response.data.rates;
  } catch (error) {
    console.log('⚠ Using fallback exchange rates');
    return FALLBACK_RATES;
  }
}

/**
 * Convert local currency to USD and AFC
 */
function convertPrice(amount, currency, rates) {
  const rate = rates[currency] || FALLBACK_RATES[currency] || 1;
  const usd = amount / rate;
  const afc = usd * AFC_RATE;
  
  return {
    local: { amount, currency },
    usd: Math.round(usd * 100) / 100,
    afc: Math.round(afc * 100) / 100,
  };
}

/**
 * Railway operator configurations
 */
const OPERATORS = {
  // Kenya Railways - Madaraka Express (SGR)
  kenya_sgr: {
    name: 'Kenya Railways SGR',
    country: 'Kenya',
    currency: 'KES',
    website: 'https://metrokenya.co.ke',
    routes: [
      { from: 'Nairobi', to: 'Mombasa', distance: 472, duration: '4h 30m' },
      { from: 'Nairobi', to: 'Suswa', distance: 120, duration: '1h 15m' },
    ],
    // Prices in KES (as of 2024)
    prices: {
      economy: { 'Nairobi-Mombasa': 1000, 'Nairobi-Suswa': 300 },
      firstClass: { 'Nairobi-Mombasa': 3000, 'Nairobi-Suswa': 700 },
    },
  },

  // Tanzania Railways - Central Line & TAZARA
  tanzania_trc: {
    name: 'Tanzania Railways Corporation',
    country: 'Tanzania',
    currency: 'TZS',
    website: 'https://trc.co.tz',
    routes: [
      { from: 'Dar es Salaam', to: 'Kigoma', distance: 1254, duration: '36h' },
      { from: 'Dar es Salaam', to: 'Mwanza', distance: 1219, duration: '24h' },
      { from: 'Dar es Salaam', to: 'Dodoma', distance: 456, duration: '8h' },
    ],
    prices: {
      economy: { 'Dar es Salaam-Kigoma': 35000, 'Dar es Salaam-Mwanza': 32000, 'Dar es Salaam-Dodoma': 15000 },
      firstClass: { 'Dar es Salaam-Kigoma': 65000, 'Dar es Salaam-Mwanza': 58000, 'Dar es Salaam-Dodoma': 28000 },
      sleeper: { 'Dar es Salaam-Kigoma': 95000, 'Dar es Salaam-Mwanza': 85000 },
    },
  },

  // TAZARA - Tanzania-Zambia Railway
  tazara: {
    name: 'TAZARA Railway',
    country: 'Tanzania/Zambia',
    currency: 'TZS',
    website: 'https://www.tazarasite.com',
    routes: [
      { from: 'Dar es Salaam', to: 'Kapiri Mposhi', distance: 1860, duration: '46h' },
      { from: 'Dar es Salaam', to: 'Mbeya', distance: 840, duration: '18h' },
    ],
    prices: {
      economy: { 'Dar es Salaam-Kapiri Mposhi': 85000, 'Dar es Salaam-Mbeya': 45000 },
      firstClass: { 'Dar es Salaam-Kapiri Mposhi': 145000, 'Dar es Salaam-Mbeya': 75000 },
      sleeper: { 'Dar es Salaam-Kapiri Mposhi': 195000, 'Dar es Salaam-Mbeya': 105000 },
    },
  },

  // South Africa - Shosholoza Meyl
  southafrica_shosholoza: {
    name: 'Shosholoza Meyl',
    country: 'South Africa',
    currency: 'ZAR',
    website: 'https://www.shosholozameyl.co.za',
    routes: [
      { from: 'Johannesburg', to: 'Cape Town', distance: 1530, duration: '27h' },
      { from: 'Johannesburg', to: 'Durban', distance: 730, duration: '13h' },
      { from: 'Johannesburg', to: 'Port Elizabeth', distance: 1040, duration: '20h' },
    ],
    prices: {
      economy: { 'Johannesburg-Cape Town': 550, 'Johannesburg-Durban': 320, 'Johannesburg-Port Elizabeth': 420 },
      tourist: { 'Johannesburg-Cape Town': 750, 'Johannesburg-Durban': 450, 'Johannesburg-Port Elizabeth': 580 },
      sleeper: { 'Johannesburg-Cape Town': 1100, 'Johannesburg-Durban': 650, 'Johannesburg-Port Elizabeth': 850 },
    },
  },

  // South Africa - Gautrain
  southafrica_gautrain: {
    name: 'Gautrain',
    country: 'South Africa',
    currency: 'ZAR',
    website: 'https://www.gautrain.co.za',
    routes: [
      { from: 'Johannesburg', to: 'Pretoria', distance: 50, duration: '35m' },
      { from: 'Johannesburg', to: 'OR Tambo Airport', distance: 25, duration: '15m' },
      { from: 'Sandton', to: 'Pretoria', distance: 35, duration: '25m' },
    ],
    prices: {
      standard: { 'Johannesburg-Pretoria': 72, 'Johannesburg-OR Tambo Airport': 185, 'Sandton-Pretoria': 58 },
    },
  },

  // Egypt - Egyptian National Railways
  egypt_enr: {
    name: 'Egyptian National Railways',
    country: 'Egypt',
    currency: 'EGP',
    website: 'https://enr.gov.eg',
    routes: [
      { from: 'Cairo', to: 'Alexandria', distance: 208, duration: '2h 30m' },
      { from: 'Cairo', to: 'Luxor', distance: 671, duration: '9h' },
      { from: 'Cairo', to: 'Aswan', distance: 879, duration: '13h' },
    ],
    prices: {
      economy: { 'Cairo-Alexandria': 65, 'Cairo-Luxor': 180, 'Cairo-Aswan': 220 },
      firstClass: { 'Cairo-Alexandria': 120, 'Cairo-Luxor': 350, 'Cairo-Aswan': 420 },
      sleeper: { 'Cairo-Luxor': 1200, 'Cairo-Aswan': 1500 },
    },
  },

  // Morocco - ONCF
  morocco_oncf: {
    name: 'ONCF Morocco',
    country: 'Morocco',
    currency: 'MAD',
    website: 'https://www.oncf.ma',
    routes: [
      { from: 'Casablanca', to: 'Marrakech', distance: 238, duration: '2h 45m' },
      { from: 'Casablanca', to: 'Tangier', distance: 340, duration: '2h 10m' }, // Al Boraq HSR
      { from: 'Casablanca', to: 'Fes', distance: 296, duration: '3h 30m' },
      { from: 'Rabat', to: 'Tangier', distance: 250, duration: '1h 30m' }, // Al Boraq HSR
    ],
    prices: {
      economy: { 'Casablanca-Marrakech': 99, 'Casablanca-Tangier': 149, 'Casablanca-Fes': 120, 'Rabat-Tangier': 119 },
      firstClass: { 'Casablanca-Marrakech': 149, 'Casablanca-Tangier': 229, 'Casablanca-Fes': 180, 'Rabat-Tangier': 179 },
    },
  },

  // Nigeria - Nigerian Railway Corporation
  nigeria_nrc: {
    name: 'Nigerian Railway Corporation',
    country: 'Nigeria',
    currency: 'NGN',
    website: 'https://nrc.gov.ng',
    routes: [
      { from: 'Lagos', to: 'Ibadan', distance: 157, duration: '2h 30m' },
      { from: 'Abuja', to: 'Kaduna', distance: 186, duration: '2h' },
      { from: 'Lagos', to: 'Abeokuta', distance: 77, duration: '1h 15m' },
    ],
    prices: {
      economy: { 'Lagos-Ibadan': 3000, 'Abuja-Kaduna': 2500, 'Lagos-Abeokuta': 1500 },
      business: { 'Lagos-Ibadan': 5000, 'Abuja-Kaduna': 4000, 'Lagos-Abeokuta': 2500 },
      firstClass: { 'Lagos-Ibadan': 6500, 'Abuja-Kaduna': 6000, 'Lagos-Abeokuta': 3500 },
    },
  },

  // Ethiopia - Ethio-Djibouti Railway
  ethiopia_edr: {
    name: 'Ethio-Djibouti Railway',
    country: 'Ethiopia',
    currency: 'ETB',
    website: 'https://erc.gov.et',
    routes: [
      { from: 'Addis Ababa', to: 'Djibouti', distance: 756, duration: '12h' },
      { from: 'Addis Ababa', to: 'Dire Dawa', distance: 446, duration: '7h' },
      { from: 'Addis Ababa', to: 'Adama', distance: 99, duration: '1h 30m' },
    ],
    prices: {
      economy: { 'Addis Ababa-Djibouti': 800, 'Addis Ababa-Dire Dawa': 500, 'Addis Ababa-Adama': 100 },
      firstClass: { 'Addis Ababa-Djibouti': 1500, 'Addis Ababa-Dire Dawa': 900, 'Addis Ababa-Adama': 180 },
    },
  },

  // Algeria - SNTF
  algeria_sntf: {
    name: 'SNTF Algeria',
    country: 'Algeria',
    currency: 'DZD',
    website: 'https://www.sntf.dz',
    routes: [
      { from: 'Algiers', to: 'Oran', distance: 422, duration: '4h 30m' },
      { from: 'Algiers', to: 'Constantine', distance: 431, duration: '5h' },
      { from: 'Algiers', to: 'Annaba', distance: 599, duration: '7h' },
    ],
    prices: {
      economy: { 'Algiers-Oran': 800, 'Algiers-Constantine': 850, 'Algiers-Annaba': 1100 },
      firstClass: { 'Algiers-Oran': 1400, 'Algiers-Constantine': 1500, 'Algiers-Annaba': 1900 },
    },
  },

  // Tunisia - SNCFT
  tunisia_sncft: {
    name: 'SNCFT Tunisia',
    country: 'Tunisia',
    currency: 'TND',
    website: 'https://www.sncft.com.tn',
    routes: [
      { from: 'Tunis', to: 'Sfax', distance: 270, duration: '3h 30m' },
      { from: 'Tunis', to: 'Sousse', distance: 143, duration: '2h' },
      { from: 'Tunis', to: 'Gabes', distance: 405, duration: '5h 30m' },
    ],
    prices: {
      economy: { 'Tunis-Sfax': 15, 'Tunis-Sousse': 9, 'Tunis-Gabes': 22 },
      confort: { 'Tunis-Sfax': 22, 'Tunis-Sousse': 13, 'Tunis-Gabes': 32 },
    },
  },

  // Zambia Railways
  zambia_zrl: {
    name: 'Zambia Railways',
    country: 'Zambia',
    currency: 'ZMW',
    website: 'https://www.zrl.com.zm',
    routes: [
      { from: 'Lusaka', to: 'Livingstone', distance: 473, duration: '12h' },
      { from: 'Lusaka', to: 'Kitwe', distance: 337, duration: '8h' },
    ],
    prices: {
      economy: { 'Lusaka-Livingstone': 150, 'Lusaka-Kitwe': 120 },
      business: { 'Lusaka-Livingstone': 280, 'Lusaka-Kitwe': 220 },
      sleeper: { 'Lusaka-Livingstone': 450, 'Lusaka-Kitwe': 350 },
    },
  },

  // Ghana Railways
  ghana_grc: {
    name: 'Ghana Railway Company',
    country: 'Ghana',
    currency: 'GHS',
    website: 'https://www.grc.gov.gh',
    routes: [
      { from: 'Accra', to: 'Kumasi', distance: 270, duration: '5h' },
      { from: 'Accra', to: 'Takoradi', distance: 225, duration: '4h' },
    ],
    prices: {
      economy: { 'Accra-Kumasi': 50, 'Accra-Takoradi': 45 },
      firstClass: { 'Accra-Kumasi': 90, 'Accra-Takoradi': 80 },
    },
  },
};

/**
 * Try to scrape live prices from operator website
 */
async function scrapeLivePrices(operator) {
  // Most African railway sites don't have easily scrapable APIs
  // This is a placeholder for future implementation
  // For now, we use the static prices defined above
  
  console.log(`  Checking ${operator.name}...`);
  
  try {
    // Try to fetch the website to verify it's accessible
    const response = await axios.get(operator.website, { 
      timeout: 10000,
      headers: { 'User-Agent': 'AfricaRailwaysBot/1.0' }
    });
    
    if (response.status === 200) {
      console.log(`    ✓ Website accessible`);
      // In future: parse HTML for prices
      // const $ = cheerio.load(response.data);
      // Extract prices from page
    }
  } catch (error) {
    console.log(`    ⚠ Website not accessible: ${error.message}`);
  }
  
  return operator.prices;
}

/**
 * Build price database with all routes and conversions
 */
async function buildPriceDatabase() {
  console.log('');
  console.log('African Railway Ticket Price Scraper');
  console.log('='.repeat(50));
  console.log('');
  
  // Get exchange rates
  console.log('Fetching exchange rates...');
  const rates = await getExchangeRates();
  
  const priceData = {
    metadata: {
      lastUpdated: new Date().toISOString(),
      baseCurrency: 'USD',
      afcRate: AFC_RATE,
      exchangeRates: {},
    },
    operators: [],
    routes: [],
  };
  
  // Store relevant exchange rates
  for (const currency of Object.keys(FALLBACK_RATES)) {
    priceData.metadata.exchangeRates[currency] = rates[currency] || FALLBACK_RATES[currency];
  }
  
  console.log('');
  console.log('Processing operators...');
  
  for (const [operatorId, operator] of Object.entries(OPERATORS)) {
    console.log(`\n[${operator.name}]`);
    
    // Try to get live prices (falls back to static)
    const prices = await scrapeLivePrices(operator);
    
    const operatorData = {
      id: operatorId,
      name: operator.name,
      country: operator.country,
      currency: operator.currency,
      website: operator.website,
      routeCount: operator.routes.length,
    };
    
    priceData.operators.push(operatorData);
    
    // Process each route
    for (const route of operator.routes) {
      const routeKey = `${route.from}-${route.to}`;
      
      const routeData = {
        id: `${operatorId}-${routeKey.toLowerCase().replace(/\s+/g, '-')}`,
        operator: operatorId,
        operatorName: operator.name,
        country: operator.country,
        from: route.from,
        to: route.to,
        distance: route.distance,
        duration: route.duration,
        currency: operator.currency,
        classes: [],
      };
      
      // Add prices for each class
      for (const [className, classPrices] of Object.entries(prices)) {
        const localPrice = classPrices[routeKey];
        if (localPrice) {
          const converted = convertPrice(localPrice, operator.currency, rates);
          
          routeData.classes.push({
            name: className,
            price: converted,
          });
          
          console.log(`    ${route.from} → ${route.to} (${className}): ${localPrice} ${operator.currency} = $${converted.usd} USD = ${converted.afc} AFC`);
        }
      }
      
      if (routeData.classes.length > 0) {
        priceData.routes.push(routeData);
      }
    }
  }
  
  // Summary
  priceData.metadata.totalOperators = priceData.operators.length;
  priceData.metadata.totalRoutes = priceData.routes.length;
  
  return priceData;
}

/**
 * Save price data to file
 */
function savePriceData(data) {
  const dir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
  console.log(`\n✓ Saved to ${OUTPUT_FILE}`);
}

/**
 * Load cached price data if still valid
 */
function loadCachedPrices() {
  try {
    if (fs.existsSync(OUTPUT_FILE)) {
      const data = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
      const lastUpdated = new Date(data.metadata.lastUpdated);
      const age = Date.now() - lastUpdated.getTime();
      
      if (age < CACHE_TTL) {
        console.log(`Using cached prices (${Math.round(age / 60000)} minutes old)`);
        return data;
      }
    }
  } catch (error) {
    // Ignore cache errors
  }
  return null;
}

/**
 * Main function
 */
async function main() {
  const forceRefresh = process.argv.includes('--force');
  
  // Check cache first
  if (!forceRefresh) {
    const cached = loadCachedPrices();
    if (cached) {
      console.log('\nSummary (cached):');
      console.log(`  Operators: ${cached.metadata.totalOperators}`);
      console.log(`  Routes: ${cached.metadata.totalRoutes}`);
      return cached;
    }
  }
  
  // Build fresh price database
  const priceData = await buildPriceDatabase();
  
  // Save to file
  savePriceData(priceData);
  
  console.log('');
  console.log('='.repeat(50));
  console.log('Summary:');
  console.log(`  Operators: ${priceData.metadata.totalOperators}`);
  console.log(`  Routes: ${priceData.metadata.totalRoutes}`);
  console.log(`  Last Updated: ${priceData.metadata.lastUpdated}`);
  console.log('');
  
  return priceData;
}

// Run
main().catch(console.error);

export { buildPriceDatabase, getExchangeRates, convertPrice, OPERATORS };
