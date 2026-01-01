// src/config/api.js
import Constants from 'expo-constants';

// Get configuration from app.config.js extra
const config = Constants.expoConfig?.extra || {};

// Determine which app variant we are
const IS_RAILWAYS = config.APP_VARIANT === 'railways';

// API Configuration
export const API_CONFIG = {
  // Backend URL (same for both apps)
  baseUrl: config.backendUrl || 'https://africa-railways.vercel.app',
  
  // API Key (different for each app)
  apiKey: config.apiKey,
  
  // App variant
  appVariant: IS_RAILWAYS ? 'railways' : 'africoin',
  isRailways: IS_RAILWAYS,
  isAfricoin: !IS_RAILWAYS,
  
  // Timeout settings
  timeout: 30000, // 30 seconds
  
  // Retry settings
  maxRetries: 3,
  retryDelay: 1000, // 1 second
};

// Helper function to get headers for API requests
export const getApiHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_CONFIG.apiKey}`,
  'X-App-Variant': API_CONFIG.appVariant,
  'X-App-Version': Constants.expoConfig?.version || '1.0.0',
});

// Helper function to build full URL
export const buildUrl = (endpoint) => {
  const base = API_CONFIG.baseUrl.replace(/\/$/, ''); // Remove trailing slash
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
};

// Helper function for API requests with retry logic
export const apiRequest = async (endpoint, options = {}) => {
  const url = buildUrl(endpoint);
  const headers = {
    ...getApiHeaders(),
    ...options.headers,
  };

  let lastError;
  for (let attempt = 0; attempt <= API_CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        timeout: API_CONFIG.timeout,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error.message.includes('HTTP 4')) {
        throw error;
      }

      // Wait before retrying
      if (attempt < API_CONFIG.maxRetries) {
        await new Promise(resolve => 
          setTimeout(resolve, API_CONFIG.retryDelay * (attempt + 1))
        );
      }
    }
  }

  throw lastError;
};

// Validate configuration on import
if (!API_CONFIG.apiKey) {
  console.warn('⚠️ API key not configured. API requests will fail.');
}

if (!API_CONFIG.baseUrl) {
  console.warn('⚠️ Backend URL not configured. Using default.');
}

console.log('✅ API Configuration loaded:', {
  appVariant: API_CONFIG.appVariant,
  baseUrl: API_CONFIG.baseUrl,
  hasApiKey: !!API_CONFIG.apiKey,
});

export default API_CONFIG;
