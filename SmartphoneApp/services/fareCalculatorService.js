/**
 * Fare Calculator Service
 * Station-to-station fare calculation with distance-based pricing
 */

import { STATIONS } from '../data/stations';

// Base fare rates per km (in USD)
const FARE_RATES = {
  economy: 0.05,
  business: 0.10,
  first: 0.18,
};

// Minimum fares (USD)
const MIN_FARES = {
  economy: 2.00,
  business: 5.00,
  first: 10.00,
};

// Peak hour multiplier (6-9 AM, 5-8 PM)
const PEAK_MULTIPLIER = 1.25;

// Weekend discount
const WEEKEND_DISCOUNT = 0.90;

// Student discount
const STUDENT_DISCOUNT = 0.70;

// Senior discount
const SENIOR_DISCOUNT = 0.80;

/**
 * Calculate distance between two coordinates using Haversine formula
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Check if time is during peak hours
 */
const isPeakHour = (date = new Date()) => {
  const hour = date.getHours();
  return (hour >= 6 && hour <= 9) || (hour >= 17 && hour <= 20);
};

/**
 * Check if date is weekend
 */
const isWeekend = (date = new Date()) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

/**
 * Get station by ID or name
 */
export const getStation = (stationIdOrName) => {
  return STATIONS.find(s => 
    s.id === stationIdOrName || 
    s.name.toLowerCase() === stationIdOrName.toLowerCase() ||
    s.city.toLowerCase() === stationIdOrName.toLowerCase()
  );
};

/**
 * Calculate fare between two stations
 * @param {string} fromStationId - Origin station ID or name
 * @param {string} toStationId - Destination station ID or name
 * @param {Object} options - Calculation options
 * @returns {Object} Fare breakdown
 */
export const calculateFare = (fromStationId, toStationId, options = {}) => {
  const {
    ticketClass = 'economy',
    travelDate = new Date(),
    passengers = 1,
    isStudent = false,
    isSenior = false,
    isReturn = false,
  } = options;

  const fromStation = getStation(fromStationId);
  const toStation = getStation(toStationId);

  if (!fromStation || !toStation) {
    throw new Error('Invalid station');
  }

  if (fromStation.id === toStation.id) {
    throw new Error('Origin and destination cannot be the same');
  }

  // Calculate distance
  const distance = calculateDistance(
    fromStation.lat, fromStation.lng,
    toStation.lat, toStation.lng
  );

  // Base fare calculation
  const baseRate = FARE_RATES[ticketClass] || FARE_RATES.economy;
  let baseFare = Math.max(distance * baseRate, MIN_FARES[ticketClass] || MIN_FARES.economy);

  // Round to 2 decimal places
  baseFare = Math.round(baseFare * 100) / 100;

  // Apply modifiers
  let finalFare = baseFare;
  const modifiers = [];

  // Peak hour pricing
  const travelDateTime = new Date(travelDate);
  if (isPeakHour(travelDateTime)) {
    finalFare *= PEAK_MULTIPLIER;
    modifiers.push({ name: 'Peak Hour', multiplier: PEAK_MULTIPLIER, amount: baseFare * (PEAK_MULTIPLIER - 1) });
  }

  // Weekend discount
  if (isWeekend(travelDateTime)) {
    finalFare *= WEEKEND_DISCOUNT;
    modifiers.push({ name: 'Weekend Discount', multiplier: WEEKEND_DISCOUNT, amount: -baseFare * (1 - WEEKEND_DISCOUNT) });
  }

  // Student discount
  if (isStudent) {
    finalFare *= STUDENT_DISCOUNT;
    modifiers.push({ name: 'Student Discount', multiplier: STUDENT_DISCOUNT, amount: -baseFare * (1 - STUDENT_DISCOUNT) });
  }

  // Senior discount
  if (isSenior) {
    finalFare *= SENIOR_DISCOUNT;
    modifiers.push({ name: 'Senior Discount', multiplier: SENIOR_DISCOUNT, amount: -baseFare * (1 - SENIOR_DISCOUNT) });
  }

  // Round final fare
  finalFare = Math.round(finalFare * 100) / 100;

  // Calculate totals
  const singleFare = finalFare;
  const returnFare = isReturn ? singleFare * 1.8 : 0; // 10% discount on return
  const totalPerPassenger = isReturn ? returnFare : singleFare;
  const totalFare = totalPerPassenger * passengers;

  // Estimated travel time (average 80 km/h for rail)
  const estimatedHours = distance / 80;
  const hours = Math.floor(estimatedHours);
  const minutes = Math.round((estimatedHours - hours) * 60);

  return {
    from: {
      id: fromStation.id,
      name: fromStation.name,
      city: fromStation.city,
      country: fromStation.country,
    },
    to: {
      id: toStation.id,
      name: toStation.name,
      city: toStation.city,
      country: toStation.country,
    },
    distance: Math.round(distance),
    distanceUnit: 'km',
    estimatedDuration: {
      hours,
      minutes,
      formatted: `${hours}h ${minutes}m`,
    },
    ticketClass,
    pricing: {
      baseFare,
      modifiers,
      singleFare,
      returnFare: isReturn ? returnFare : null,
      isReturn,
      passengers,
      totalFare,
      currency: 'USD',
    },
    isPeakHour: isPeakHour(travelDateTime),
    isWeekend: isWeekend(travelDateTime),
    travelDate: travelDateTime.toISOString(),
  };
};

/**
 * Get all available routes from a station
 */
export const getRoutesFromStation = (stationId) => {
  const fromStation = getStation(stationId);
  if (!fromStation) return [];

  return STATIONS
    .filter(s => s.id !== fromStation.id)
    .map(toStation => {
      const distance = calculateDistance(
        fromStation.lat, fromStation.lng,
        toStation.lat, toStation.lng
      );
      return {
        to: toStation,
        distance: Math.round(distance),
        estimatedFare: {
          economy: Math.max(distance * FARE_RATES.economy, MIN_FARES.economy),
          business: Math.max(distance * FARE_RATES.business, MIN_FARES.business),
          first: Math.max(distance * FARE_RATES.first, MIN_FARES.first),
        },
      };
    })
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Get fare summary for display
 */
export const getFareSummary = (fareResult) => {
  const { from, to, distance, estimatedDuration, pricing } = fareResult;
  return {
    route: `${from.city} → ${to.city}`,
    distance: `${distance} km`,
    duration: estimatedDuration.formatted,
    fare: `$${pricing.totalFare.toFixed(2)}`,
    class: pricing.ticketClass,
    passengers: pricing.passengers,
  };
};

export default {
  calculateFare,
  getStation,
  getRoutesFromStation,
  getFareSummary,
  FARE_RATES,
  isPeakHour,
  isWeekend,
};
