/**
 * TripAdvisor Content API Service
 * 
 * Provides hotel search near railway stations with proximity logic.
 * Prioritizes hotels with station pickup or within walking distance.
 * 
 * API Docs: https://tripadvisor-content-api.readme.io/reference
 */

import { TRIPADVISOR_API_KEY } from '@env';

const API_BASE = 'https://api.content.tripadvisor.com/api/v1';
const API_KEY = TRIPADVISOR_API_KEY || process.env.TRIPADVISOR_API_KEY;

// Railway station coordinates for proximity search
const STATION_COORDINATES = {
  'Dar es Salaam': { lat: -6.8235, lng: 39.2695, city: 'Dar es Salaam', country: 'Tanzania' },
  'Kapiri Mposhi': { lat: -14.4667, lng: 28.6667, city: 'Kapiri Mposhi', country: 'Zambia' },
  'Lusaka': { lat: -15.4167, lng: 28.2833, city: 'Lusaka', country: 'Zambia' },
  'Livingstone': { lat: -17.8419, lng: 25.8544, city: 'Livingstone', country: 'Zambia' },
  'Mbeya': { lat: -8.9000, lng: 33.4500, city: 'Mbeya', country: 'Tanzania' },
  'Nairobi': { lat: -1.2921, lng: 36.8219, city: 'Nairobi', country: 'Kenya' },
  'Mombasa': { lat: -4.0435, lng: 39.6682, city: 'Mombasa', country: 'Kenya' },
  'Lobito': { lat: -12.3644, lng: 13.5361, city: 'Lobito', country: 'Angola' },
  'Lubumbashi': { lat: -11.6647, lng: 27.4794, city: 'Lubumbashi', country: 'DRC' },
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Get walking time estimate based on distance
 */
const getWalkingTime = (distanceKm) => {
  const walkingSpeedKmH = 5; // Average walking speed
  const minutes = Math.round((distanceKm / walkingSpeedKmH) * 60);
  return minutes;
};

/**
 * Search for hotels near a railway station
 */
export const searchHotelsNearStation = async (stationName, options = {}) => {
  const {
    radius = 5000, // 5km default radius
    limit = 10,
    currency = 'USD',
  } = options;

  const station = STATION_COORDINATES[stationName];
  if (!station) {
    console.warn(`Station "${stationName}" not found in coordinates database`);
    return { hotels: [], error: 'Station not found' };
  }

  try {
    // TripAdvisor Nearby Location Search
    const url = `${API_BASE}/location/nearby_search?latLong=${station.lat},${station.lng}&category=hotels&radius=${radius}&radiusUnit=m&language=en&key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`TripAdvisor API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Process and enrich hotel data
    const hotels = (data.data || []).slice(0, limit).map(hotel => {
      const hotelLat = hotel.latitude || station.lat;
      const hotelLng = hotel.longitude || station.lng;
      const distanceKm = calculateDistance(station.lat, station.lng, hotelLat, hotelLng);
      const walkingMinutes = getWalkingTime(distanceKm);
      
      return {
        id: hotel.location_id,
        name: hotel.name,
        address: hotel.address_obj?.address_string || '',
        rating: hotel.rating || 0,
        reviewCount: hotel.num_reviews || 0,
        priceLevel: hotel.price_level || '',
        distanceKm: Math.round(distanceKm * 10) / 10,
        walkingMinutes,
        isWalkingDistance: distanceKm <= 2, // Within 2km
        hasStationPickup: checkStationPickup(hotel), // Check amenities
        tripAdvisorUrl: hotel.web_url || '',
        photo: hotel.photo?.images?.medium?.url || null,
      };
    });

    // Sort: prioritize station pickup, then walking distance, then rating
    hotels.sort((a, b) => {
      if (a.hasStationPickup !== b.hasStationPickup) return b.hasStationPickup - a.hasStationPickup;
      if (a.isWalkingDistance !== b.isWalkingDistance) return b.isWalkingDistance - a.isWalkingDistance;
      return b.rating - a.rating;
    });

    return {
      hotels,
      station: {
        name: stationName,
        city: station.city,
        country: station.country,
      },
      searchRadius: radius,
    };
  } catch (error) {
    console.error('TripAdvisor search error:', error);
    return { hotels: [], error: error.message };
  }
};

/**
 * Check if hotel has station pickup service (based on amenities/description)
 */
const checkStationPickup = (hotel) => {
  const amenities = hotel.amenities || [];
  const description = (hotel.description || '').toLowerCase();
  
  const pickupKeywords = ['station pickup', 'railway pickup', 'train station', 'shuttle', 'transfer'];
  
  return pickupKeywords.some(keyword => 
    description.includes(keyword) || 
    amenities.some(a => a.toLowerCase().includes(keyword))
  );
};

/**
 * Get hotel details including photos and reviews
 */
export const getHotelDetails = async (locationId) => {
  try {
    const url = `${API_BASE}/location/${locationId}/details?language=en&currency=USD&key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`TripAdvisor API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Hotel details error:', error);
    return null;
  }
};

/**
 * Get hotel photos
 */
export const getHotelPhotos = async (locationId, limit = 5) => {
  try {
    const url = `${API_BASE}/location/${locationId}/photos?language=en&limit=${limit}&key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`TripAdvisor API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Hotel photos error:', error);
    return [];
  }
};

/**
 * Get hotel reviews
 */
export const getHotelReviews = async (locationId, limit = 5) => {
  try {
    const url = `${API_BASE}/location/${locationId}/reviews?language=en&limit=${limit}&key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`TripAdvisor API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Hotel reviews error:', error);
    return [];
  }
};

/**
 * Mock data for development/offline mode
 */
export const getMockHotels = (stationName) => {
  const station = STATION_COORDINATES[stationName] || STATION_COORDINATES['Dar es Salaam'];
  
  return {
    hotels: [
      {
        id: 'mock-1',
        name: 'Railway View Hotel',
        address: `Near ${stationName} Station`,
        rating: 4.5,
        reviewCount: 234,
        priceLevel: '$$',
        distanceKm: 0.3,
        walkingMinutes: 4,
        isWalkingDistance: true,
        hasStationPickup: true,
        pricePerNight: 45,
        photo: null,
      },
      {
        id: 'mock-2',
        name: 'Transit Lodge',
        address: `${station.city} Central`,
        rating: 4.2,
        reviewCount: 156,
        priceLevel: '$',
        distanceKm: 0.8,
        walkingMinutes: 10,
        isWalkingDistance: true,
        hasStationPickup: true,
        pricePerNight: 28,
        photo: null,
      },
      {
        id: 'mock-3',
        name: 'City Center Inn',
        address: `Downtown ${station.city}`,
        rating: 4.0,
        reviewCount: 89,
        priceLevel: '$$',
        distanceKm: 1.5,
        walkingMinutes: 18,
        isWalkingDistance: true,
        hasStationPickup: false,
        pricePerNight: 55,
        photo: null,
      },
      {
        id: 'mock-4',
        name: 'Grand Plaza Hotel',
        address: `${station.city} Business District`,
        rating: 4.7,
        reviewCount: 412,
        priceLevel: '$$$',
        distanceKm: 3.2,
        walkingMinutes: 38,
        isWalkingDistance: false,
        hasStationPickup: true,
        pricePerNight: 120,
        photo: null,
      },
    ],
    station: {
      name: stationName,
      city: station.city,
      country: station.country,
    },
    searchRadius: 5000,
  };
};

export default {
  searchHotelsNearStation,
  getHotelDetails,
  getHotelPhotos,
  getHotelReviews,
  getMockHotels,
  STATION_COORDINATES,
};
