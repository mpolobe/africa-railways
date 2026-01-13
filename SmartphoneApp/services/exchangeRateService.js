/**
 * Exchange Rate Service
 * Fetches live exchange rates from ExchangeRate-API (free tier)
 * Includes caching to minimize API calls and handle offline scenarios
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache configuration
const CACHE_KEY = 'exchange_rates_cache';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour cache

// Fallback rates when API is unavailable (same as static rates)
const FALLBACK_RATES = {
  ZMW: 27.50,
  ZAR: 18.75,
  BWP: 13.50,
  NAD: 18.75,
  SZL: 18.75,
  LSL: 18.75,
  TZS: 2580.00,
  KES: 129.00,
  UGX: 3750.00,
  RWF: 1320.00,
  BIF: 2900.00,
  NGN: 1550.00,
  GHS: 15.50,
  XOF: 605.00,
  EGP: 49.00,
  MAD: 10.00,
  TND: 3.15,
  XAF: 605.00,
  ETB: 125.00,
  SOS: 570.00,
  USD: 1.00,
  EUR: 0.92,
  GBP: 0.79,
};

// Supported currencies for the app
const SUPPORTED_CURRENCIES = Object.keys(FALLBACK_RATES);

/**
 * Exchange rate cache structure
 * @typedef {Object} RateCache
 * @property {Object} rates - Exchange rates (USD to currency)
 * @property {number} timestamp - Cache timestamp
 * @property {string} source - Data source ('api' or 'fallback')
 */

/**
 * Get cached exchange rates from AsyncStorage
 * @returns {Promise<RateCache|null>}
 */
const getCachedRates = async () => {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn('Failed to read exchange rate cache:', error.message);
  }
  return null;
};

/**
 * Save exchange rates to cache
 * @param {Object} rates - Exchange rates
 * @param {string} source - Data source
 */
const setCachedRates = async (rates, source = 'api') => {
  try {
    const cacheData = {
      rates,
      timestamp: Date.now(),
      source,
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache exchange rates:', error.message);
  }
};

/**
 * Check if cache is still valid
 * @param {RateCache} cache
 * @returns {boolean}
 */
const isCacheValid = (cache) => {
  if (!cache || !cache.timestamp) return false;
  return Date.now() - cache.timestamp < CACHE_DURATION_MS;
};

/**
 * Fetch live exchange rates from ExchangeRate-API
 * Uses the free tier which provides daily updates
 * @returns {Promise<Object>} Exchange rates (USD to currency)
 */
const fetchLiveRates = async () => {
  // ExchangeRate-API free tier endpoint (no API key required for basic usage)
  const API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';
  
  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.rates) {
      throw new Error('Invalid API response format');
    }

    // Filter to only supported currencies and merge with fallbacks
    const rates = {};
    for (const currency of SUPPORTED_CURRENCIES) {
      if (data.rates[currency] !== undefined) {
        rates[currency] = data.rates[currency];
      } else {
        // Use fallback for currencies not in API response
        rates[currency] = FALLBACK_RATES[currency];
      }
    }

    return rates;
  } catch (error) {
    console.warn('Failed to fetch live exchange rates:', error.message);
    throw error;
  }
};

/**
 * Get current exchange rates with caching
 * Returns cached rates if valid, otherwise fetches fresh rates
 * Falls back to static rates if API is unavailable
 * 
 * @param {boolean} forceRefresh - Force API call even if cache is valid
 * @returns {Promise<{rates: Object, source: string, lastUpdated: Date}>}
 */
export const getExchangeRates = async (forceRefresh = false) => {
  // Check cache first
  if (!forceRefresh) {
    const cached = await getCachedRates();
    if (cached && isCacheValid(cached)) {
      return {
        rates: cached.rates,
        source: cached.source,
        lastUpdated: new Date(cached.timestamp),
        fromCache: true,
      };
    }
  }

  // Try to fetch live rates
  try {
    const liveRates = await fetchLiveRates();
    await setCachedRates(liveRates, 'api');
    
    return {
      rates: liveRates,
      source: 'api',
      lastUpdated: new Date(),
      fromCache: false,
    };
  } catch (error) {
    // Check if we have stale cache to use
    const staleCache = await getCachedRates();
    if (staleCache) {
      return {
        rates: staleCache.rates,
        source: 'stale_cache',
        lastUpdated: new Date(staleCache.timestamp),
        fromCache: true,
        error: error.message,
      };
    }

    // Use fallback rates
    await setCachedRates(FALLBACK_RATES, 'fallback');
    return {
      rates: FALLBACK_RATES,
      source: 'fallback',
      lastUpdated: new Date(),
      fromCache: false,
      error: error.message,
    };
  }
};

/**
 * Get exchange rate for a specific currency
 * @param {string} currencyCode - Currency code (e.g., 'ZMW')
 * @returns {Promise<number>} Exchange rate from USD
 */
export const getRate = async (currencyCode) => {
  const { rates } = await getExchangeRates();
  return rates[currencyCode] || FALLBACK_RATES[currencyCode] || 1;
};

/**
 * Convert amount between currencies using live rates
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {Promise<number>} Converted amount
 */
export const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return amount;
  
  const { rates } = await getExchangeRates();
  
  // Convert through USD
  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;
  
  // Convert to USD first, then to target currency
  const usdAmount = amount / fromRate;
  return usdAmount * toRate;
};

/**
 * Clear the exchange rate cache
 * Useful for testing or forcing fresh data
 */
export const clearCache = async () => {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.warn('Failed to clear exchange rate cache:', error.message);
  }
};

/**
 * Get cache status for debugging
 * @returns {Promise<{isValid: boolean, age: number|null, source: string|null}>}
 */
export const getCacheStatus = async () => {
  const cached = await getCachedRates();
  if (!cached) {
    return { isValid: false, age: null, source: null };
  }
  
  const age = Date.now() - cached.timestamp;
  return {
    isValid: isCacheValid(cached),
    age,
    ageMinutes: Math.round(age / 60000),
    source: cached.source,
    lastUpdated: new Date(cached.timestamp),
  };
};

/**
 * Get list of supported currencies
 * @returns {string[]}
 */
export const getSupportedCurrencies = () => SUPPORTED_CURRENCIES;

/**
 * Get fallback rates (for offline/testing)
 * @returns {Object}
 */
export const getFallbackRates = () => ({ ...FALLBACK_RATES });

export default {
  getExchangeRates,
  getRate,
  convertCurrency,
  clearCache,
  getCacheStatus,
  getSupportedCurrencies,
  getFallbackRates,
};
