/**
 * Currency Conversion Utilities
 * Handles conversion between USD, Local Currencies, and AFC
 */

// Exchange rates (USD to local currency)
// Updated periodically - consider fetching from API in production
export const EXCHANGE_RATES = {
  // Southern Africa
  ZMW: 27.50,  // Zambian Kwacha
  ZAR: 18.75,  // South African Rand
  BWP: 13.50,  // Botswana Pula
  NAD: 18.75,  // Namibian Dollar
  SZL: 18.75,  // Swazi Lilangeni
  LSL: 18.75,  // Lesotho Loti
  
  // East Africa
  TZS: 2580.00, // Tanzanian Shilling
  KES: 129.00,  // Kenyan Shilling
  UGX: 3750.00, // Ugandan Shilling
  RWF: 1320.00, // Rwandan Franc
  BIF: 2900.00, // Burundian Franc
  
  // West Africa
  NGN: 1550.00, // Nigerian Naira
  GHS: 15.50,   // Ghanaian Cedi
  XOF: 605.00,  // West African CFA Franc
  
  // North Africa
  EGP: 49.00,   // Egyptian Pound
  MAD: 10.00,   // Moroccan Dirham
  TND: 3.15,    // Tunisian Dinar
  
  // Central Africa
  XAF: 605.00,  // Central African CFA Franc
  
  // Horn of Africa
  ETB: 125.00,  // Ethiopian Birr
  SOS: 570.00,  // Somali Shilling
  
  // Base currencies
  USD: 1.00,    // US Dollar
  EUR: 0.92,    // Euro
  GBP: 0.79,    // British Pound
};

// AFC (Africoin) exchange rate
// 1 AFC = 1 USD (pegged stablecoin)
export const AFC_TO_USD = 1.0;

/**
 * Get currency symbol for display
 */
export const getCurrencySymbol = (currencyCode) => {
  const symbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    ZMW: 'ZK',
    ZAR: 'R',
    TZS: 'TSh',
    KES: 'KSh',
    UGX: 'USh',
    NGN: '₦',
    GHS: 'GH₵',
    EGP: 'E£',
    ETB: 'Br',
    RWF: 'FRw',
    BWP: 'P',
    MAD: 'DH',
    XOF: 'CFA',
    XAF: 'FCFA',
  };
  return symbols[currencyCode] || currencyCode;
};

/**
 * Get currency name
 */
export const getCurrencyName = (currencyCode) => {
  const names = {
    USD: 'US Dollar',
    ZMW: 'Zambian Kwacha',
    ZAR: 'South African Rand',
    TZS: 'Tanzanian Shilling',
    KES: 'Kenyan Shilling',
    UGX: 'Ugandan Shilling',
    NGN: 'Nigerian Naira',
    GHS: 'Ghanaian Cedi',
    EGP: 'Egyptian Pound',
    ETB: 'Ethiopian Birr',
    RWF: 'Rwandan Franc',
    AFC: 'Africoin',
  };
  return names[currencyCode] || currencyCode;
};

/**
 * Convert USD to local currency
 */
export const convertUSDToLocal = (amountUSD, localCurrency) => {
  const rate = EXCHANGE_RATES[localCurrency] || 1;
  return amountUSD * rate;
};

/**
 * Convert local currency to USD
 */
export const convertLocalToUSD = (amountLocal, localCurrency) => {
  const rate = EXCHANGE_RATES[localCurrency] || 1;
  return amountLocal / rate;
};

/**
 * Convert USD to AFC
 */
export const convertUSDToAFC = (amountUSD) => {
  return amountUSD / AFC_TO_USD;
};

/**
 * Convert AFC to USD
 */
export const convertAFCToUSD = (amountAFC) => {
  return amountAFC * AFC_TO_USD;
};

/**
 * Convert AFC to local currency
 */
export const convertAFCToLocal = (amountAFC, localCurrency) => {
  const usd = convertAFCToUSD(amountAFC);
  return convertUSDToLocal(usd, localCurrency);
};

/**
 * Convert local currency to AFC
 */
export const convertLocalToAFC = (amountLocal, localCurrency) => {
  const usd = convertLocalToUSD(amountLocal, localCurrency);
  return convertUSDToAFC(usd);
};

/**
 * Format currency amount with proper decimals
 */
export const formatCurrency = (amount, currencyCode, options = {}) => {
  const {
    showSymbol = true,
    showCode = false,
    decimals = null,
  } = options;

  // Determine decimal places based on currency
  let decimalPlaces = decimals;
  if (decimalPlaces === null) {
    // Large value currencies (like TZS, UGX) don't need decimals
    if (['TZS', 'UGX', 'RWF', 'BIF', 'NGN', 'SOS'].includes(currencyCode)) {
      decimalPlaces = 0;
    } else {
      decimalPlaces = 2;
    }
  }

  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });

  const symbol = showSymbol ? getCurrencySymbol(currencyCode) : '';
  const code = showCode ? ` ${currencyCode}` : '';

  return `${symbol}${formattedAmount}${code}`.trim();
};

/**
 * Get all prices for a given USD amount
 */
export const getAllPrices = (priceUSD, localCurrency = 'ZMW') => {
  return {
    usd: priceUSD,
    local: convertUSDToLocal(priceUSD, localCurrency),
    afc: convertUSDToAFC(priceUSD),
    localCurrency,
  };
};

/**
 * Detect user's local currency based on location
 * Returns currency code or default to ZMW
 */
export const detectLocalCurrency = async () => {
  // In production, use device location or user preferences
  // For now, return default
  return 'ZMW';
};

/**
 * Get exchange rate for a currency pair
 */
export const getExchangeRate = (fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return 1;
  
  // Convert through USD
  const fromRate = EXCHANGE_RATES[fromCurrency] || 1;
  const toRate = EXCHANGE_RATES[toCurrency] || 1;
  
  return toRate / fromRate;
};

/**
 * Sample ticket prices for different routes
 */
export const SAMPLE_TICKET_PRICES = {
  // TAZARA routes (Zambia-Tanzania)
  'Kapiri Mposhi → Dar es Salaam': {
    economy: 25,
    business: 45,
    first: 75,
  },
  'Lusaka → Dar es Salaam': {
    economy: 30,
    business: 55,
    first: 85,
  },
  'Nakonde → Dar es Salaam': {
    economy: 20,
    business: 35,
    first: 60,
  },
  
  // ZRL routes (Zambia)
  'Lusaka → Livingstone': {
    economy: 15,
    business: 25,
    first: 40,
  },
  'Lusaka → Kitwe': {
    economy: 12,
    business: 20,
    first: 35,
  },
  'Kitwe → Chingola': {
    economy: 5,
    business: 8,
    first: 15,
  },
  
  // Kenya Railways
  'Nairobi → Mombasa': {
    economy: 10,
    business: 18,
    first: 30,
  },
  
  // Tanzania Railways
  'Dar es Salaam → Mwanza': {
    economy: 22,
    business: 40,
    first: 65,
  },
};

/**
 * Get ticket price for a route and class
 */
export const getTicketPrice = (route, ticketClass = 'economy') => {
  const routePrices = SAMPLE_TICKET_PRICES[route];
  if (!routePrices) return null;
  
  return routePrices[ticketClass.toLowerCase()] || routePrices.economy;
};

export default {
  EXCHANGE_RATES,
  AFC_TO_USD,
  getCurrencySymbol,
  getCurrencyName,
  convertUSDToLocal,
  convertLocalToUSD,
  convertUSDToAFC,
  convertAFCToUSD,
  convertAFCToLocal,
  convertLocalToAFC,
  formatCurrency,
  getAllPrices,
  detectLocalCurrency,
  getExchangeRate,
  getTicketPrice,
  SAMPLE_TICKET_PRICES,
};
