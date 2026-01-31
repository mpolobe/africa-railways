/**
 * Geolocation Service - Detects user country via IP or browser geolocation
 */

const GeolocationService = {
  // Cache for country detection
  _cachedCountry: null,

  /**
   * Get user's country code using IP-based geolocation
   * Falls back to browser geolocation if IP detection fails
   */
  async detectCountry() {
    if (this._cachedCountry) {
      return this._cachedCountry;
    }

    try {
      // Try IP-based geolocation first (faster, no permission needed)
      const ipResult = await this._detectViaIP();
      if (ipResult) {
        this._cachedCountry = ipResult;
        return ipResult;
      }
    } catch (e) {
      console.warn('IP geolocation failed:', e.message);
    }

    try {
      // Fall back to browser geolocation
      const browserResult = await this._detectViaBrowser();
      if (browserResult) {
        this._cachedCountry = browserResult;
        return browserResult;
      }
    } catch (e) {
      console.warn('Browser geolocation failed:', e.message);
    }

    // Default to South Africa if all methods fail
    return { countryCode: 'ZA', countryName: 'South Africa', lat: -26.2041, lng: 28.0473 };
  },

  /**
   * Detect country via IP address using free API
   */
  async _detectViaIP() {
    const response = await fetch('https://ipapi.co/json/', { timeout: 5000 });
    if (!response.ok) throw new Error('IP API request failed');
    
    const data = await response.json();
    return {
      countryCode: data.country_code,
      countryName: data.country_name,
      lat: data.latitude,
      lng: data.longitude,
      city: data.city,
      region: data.region
    };
  },

  /**
   * Detect location via browser Geolocation API
   * Requires user permission
   */
  async _detectViaBrowser() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          // Reverse geocode to get country
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await response.json();
            resolve({
              countryCode: data.address?.country_code?.toUpperCase() || 'ZA',
              countryName: data.address?.country || 'Unknown',
              lat: latitude,
              lng: longitude
            });
          } catch (e) {
            reject(e);
          }
        },
        (error) => reject(error),
        { timeout: 10000, enableHighAccuracy: false }
      );
    });
  },

  /**
   * Manually set country (for testing or user selection)
   */
  setCountry(countryCode, countryName, lat, lng) {
    this._cachedCountry = { countryCode, countryName, lat, lng };
    return this._cachedCountry;
  },

  /**
   * Clear cached country
   */
  clearCache() {
    this._cachedCountry = null;
  }
};

// Export for module systems, also attach to window for browser use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GeolocationService;
}
if (typeof window !== 'undefined') {
  window.GeolocationService = GeolocationService;
}
