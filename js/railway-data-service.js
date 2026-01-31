/**
 * Railway Data Service - Fetches rail network data from OpenRailwayMap/Overpass API
 */

const RailwayDataService = {
  // Overpass API endpoint for OpenStreetMap railway data
  OVERPASS_API: 'https://overpass-api.de/api/interpreter',

  // Country bounding boxes for major African countries with rail networks
  COUNTRY_BOUNDS: {
    ZA: { name: 'South Africa', bounds: [-35.0, 16.0, -22.0, 33.0], center: [-26.2, 28.0] },
    EG: { name: 'Egypt', bounds: [22.0, 25.0, 32.0, 35.0], center: [26.8, 30.8] },
    MA: { name: 'Morocco', bounds: [27.0, -13.0, 36.0, -1.0], center: [31.8, -7.1] },
    KE: { name: 'Kenya', bounds: [-5.0, 33.5, 5.0, 42.0], center: [-1.3, 36.8] },
    TZ: { name: 'Tanzania', bounds: [-12.0, 29.0, -1.0, 41.0], center: [-6.2, 35.8] },
    ZM: { name: 'Zambia', bounds: [-18.0, 22.0, -8.0, 34.0], center: [-15.4, 28.3] },
    NG: { name: 'Nigeria', bounds: [4.0, 2.5, 14.0, 15.0], center: [9.1, 7.5] },
    ET: { name: 'Ethiopia', bounds: [3.0, 33.0, 15.0, 48.0], center: [9.0, 38.8] },
    GH: { name: 'Ghana', bounds: [4.5, -3.5, 11.5, 1.5], center: [7.9, -1.0] },
    SN: { name: 'Senegal', bounds: [12.0, -17.5, 17.0, -11.0], center: [14.7, -17.5] },
    TN: { name: 'Tunisia', bounds: [30.0, 7.5, 37.5, 12.0], center: [34.0, 9.0] },
    DZ: { name: 'Algeria', bounds: [19.0, -9.0, 37.0, 12.0], center: [28.0, 3.0] },
    // Gautrain specific (South Africa - Gauteng Province)
    GAUTRAIN: { name: 'Gautrain', bounds: [-26.5, 27.8, -25.5, 28.5], center: [-26.0, 28.1] }
  },

  // Sample data for countries without extensive OSM rail data
  SAMPLE_NETWORKS: {
    ZA: {
      name: 'Gautrain',
      lines: [
        {
          id: 'north-south',
          name: 'North-South Line',
          color: '#00A651',
          stations: [
            { id: 'hatfield', name: 'Hatfield', lat: -25.7479, lng: 28.2380 },
            { id: 'pretoria', name: 'Pretoria', lat: -25.7545, lng: 28.1880 },
            { id: 'centurion', name: 'Centurion', lat: -25.8603, lng: 28.1894 },
            { id: 'midrand', name: 'Midrand', lat: -25.9920, lng: 28.1270 },
            { id: 'marlboro', name: 'Marlboro', lat: -26.0870, lng: 28.1050 },
            { id: 'sandton', name: 'Sandton', lat: -26.1076, lng: 28.0567 },
            { id: 'rosebank', name: 'Rosebank', lat: -26.1455, lng: 28.0436 },
            { id: 'park', name: 'Park', lat: -26.1680, lng: 28.0430 }
          ]
        },
        {
          id: 'east-west',
          name: 'East-West Line',
          color: '#FFB800',
          stations: [
            { id: 'sandton', name: 'Sandton', lat: -26.1076, lng: 28.0567 },
            { id: 'marlboro', name: 'Marlboro', lat: -26.0870, lng: 28.1050 },
            { id: 'rhodesfield', name: 'Rhodesfield', lat: -26.1350, lng: 28.2180 },
            { id: 'ortambo', name: 'OR Tambo', lat: -26.1367, lng: 28.2310 }
          ]
        }
      ]
    },
    EG: {
      name: 'Cairo Metro',
      lines: [
        {
          id: 'line1',
          name: 'Line 1 (Helwan-New El-Marg)',
          color: '#E3000B',
          stations: [
            { id: 'helwan', name: 'Helwan', lat: 29.8490, lng: 31.3340 },
            { id: 'maadi', name: 'Maadi', lat: 29.9600, lng: 31.2570 },
            { id: 'sadat', name: 'Sadat', lat: 30.0444, lng: 31.2357 },
            { id: 'nasser', name: 'Nasser', lat: 30.0530, lng: 31.2460 },
            { id: 'shoubra', name: 'Shoubra El-Kheima', lat: 30.1220, lng: 31.2450 }
          ]
        },
        {
          id: 'line2',
          name: 'Line 2 (Shubra-Giza)',
          color: '#F7941D',
          stations: [
            { id: 'shubra', name: 'Shubra El-Kheima', lat: 30.1220, lng: 31.2450 },
            { id: 'attaba', name: 'Attaba', lat: 30.0520, lng: 31.2470 },
            { id: 'opera', name: 'Opera', lat: 30.0420, lng: 31.2250 },
            { id: 'giza', name: 'Giza', lat: 30.0100, lng: 31.2070 }
          ]
        }
      ]
    },
    MA: {
      name: 'Al Boraq (Morocco HSR)',
      lines: [
        {
          id: 'lgv',
          name: 'LGV Tangier-Casablanca',
          color: '#C8102E',
          stations: [
            { id: 'tangier', name: 'Tangier', lat: 35.7595, lng: -5.8340 },
            { id: 'kenitra', name: 'Kenitra', lat: 34.2610, lng: -6.5802 },
            { id: 'rabat', name: 'Rabat Agdal', lat: 33.9911, lng: -6.8498 },
            { id: 'casa', name: 'Casablanca Voyageurs', lat: 33.5892, lng: -7.6031 }
          ]
        }
      ]
    },
    KE: {
      name: 'SGR Kenya',
      lines: [
        {
          id: 'sgr',
          name: 'Mombasa-Nairobi SGR',
          color: '#006600',
          stations: [
            { id: 'mombasa', name: 'Mombasa Terminus', lat: -4.0435, lng: 39.6682 },
            { id: 'mariakani', name: 'Mariakani', lat: -3.8650, lng: 39.4650 },
            { id: 'voi', name: 'Voi', lat: -3.3960, lng: 38.5560 },
            { id: 'mtito', name: 'Mtito Andei', lat: -2.6880, lng: 38.1680 },
            { id: 'emali', name: 'Emali', lat: -2.0830, lng: 37.4670 },
            { id: 'athi', name: 'Athi River', lat: -1.4580, lng: 36.9820 },
            { id: 'nairobi', name: 'Nairobi Terminus', lat: -1.3190, lng: 36.9270 }
          ]
        }
      ]
    },
    TZ: {
      name: 'TAZARA & SGR Tanzania',
      lines: [
        {
          id: 'tazara',
          name: 'TAZARA Railway',
          color: '#1E90FF',
          stations: [
            { id: 'dar', name: 'Dar es Salaam', lat: -6.8235, lng: 39.2695 },
            { id: 'mlimba', name: 'Mlimba', lat: -8.8330, lng: 35.8170 },
            { id: 'mbeya', name: 'Mbeya', lat: -8.9000, lng: 33.4500 },
            { id: 'tunduma', name: 'Tunduma', lat: -9.3000, lng: 32.7670 },
            { id: 'kapiri', name: 'Kapiri Mposhi (Zambia)', lat: -14.4500, lng: 28.6670 }
          ]
        }
      ]
    },
    NG: {
      name: 'Nigeria Rail',
      lines: [
        {
          id: 'lagos-ibadan',
          name: 'Lagos-Ibadan Railway',
          color: '#008751',
          stations: [
            { id: 'lagos', name: 'Lagos (Mobolaji Johnson)', lat: 6.4541, lng: 3.3947 },
            { id: 'agege', name: 'Agege', lat: 6.6180, lng: 3.3220 },
            { id: 'abeokuta', name: 'Abeokuta', lat: 7.1475, lng: 3.3619 },
            { id: 'ibadan', name: 'Ibadan', lat: 7.3775, lng: 3.9470 }
          ]
        }
      ]
    }
  },

  /**
   * Fetch railway network data for a country
   */
  async getNetworkForCountry(countryCode) {
    const code = countryCode.toUpperCase();
    
    // Return sample data if available (more reliable than OSM queries)
    if (this.SAMPLE_NETWORKS[code]) {
      return this.SAMPLE_NETWORKS[code];
    }

    // Try to fetch from Overpass API for countries without sample data
    const bounds = this.COUNTRY_BOUNDS[code];
    if (bounds) {
      try {
        return await this._fetchFromOverpass(bounds);
      } catch (e) {
        console.warn('Overpass API failed, using fallback:', e.message);
      }
    }

    // Return South Africa (Gautrain) as default
    return this.SAMPLE_NETWORKS.ZA;
  },

  /**
   * Fetch railway data from Overpass API
   */
  async _fetchFromOverpass(countryData) {
    const [south, west, north, east] = countryData.bounds;
    
    const query = `
      [out:json][timeout:25];
      (
        way["railway"="rail"]["usage"="main"](${south},${west},${north},${east});
        node["railway"="station"](${south},${west},${north},${east});
      );
      out body;
      >;
      out skel qt;
    `;

    const response = await fetch(this.OVERPASS_API, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (!response.ok) throw new Error('Overpass API request failed');
    
    const data = await response.json();
    return this._parseOverpassData(data, countryData.name);
  },

  /**
   * Parse Overpass API response into our network format
   */
  _parseOverpassData(data, countryName) {
    const stations = [];
    const nodeMap = new Map();

    // Extract nodes (stations and way points)
    data.elements.forEach(el => {
      if (el.type === 'node') {
        nodeMap.set(el.id, { lat: el.lat, lng: el.lon });
        if (el.tags?.railway === 'station' || el.tags?.railway === 'halt') {
          stations.push({
            id: `station-${el.id}`,
            name: el.tags?.name || `Station ${el.id}`,
            lat: el.lat,
            lng: el.lon
          });
        }
      }
    });

    // If we found stations, create a single line connecting them
    if (stations.length > 0) {
      return {
        name: `${countryName} Railways`,
        lines: [{
          id: 'main-line',
          name: 'Main Line',
          color: '#3B82F6',
          stations: stations.slice(0, 20) // Limit to 20 stations for performance
        }]
      };
    }

    // Fallback to South Africa
    return this.SAMPLE_NETWORKS.ZA;
  },

  /**
   * Get list of supported countries
   */
  getSupportedCountries() {
    return Object.entries(this.COUNTRY_BOUNDS).map(([code, data]) => ({
      code,
      name: data.name,
      center: data.center
    }));
  },

  /**
   * Check if a country has rail data
   */
  hasRailData(countryCode) {
    const code = countryCode.toUpperCase();
    return !!this.SAMPLE_NETWORKS[code] || !!this.COUNTRY_BOUNDS[code];
  }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RailwayDataService;
}
if (typeof window !== 'undefined') {
  window.RailwayDataService = RailwayDataService;
}
