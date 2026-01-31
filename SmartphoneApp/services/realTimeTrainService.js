/**
 * Real-Time Train Tracking Service
 * Simulates live train positions and ETAs
 * In production, this would connect to operator APIs or GPS tracking
 */

import { ROUTES, generateDailySchedules } from '../data/trainSchedules';

// Simulated active trains (in production, this comes from GPS/operator feeds)
let activeTrains = [];

// Status types
export const TRAIN_STATUS = {
  ON_TIME: 'on-time',
  DELAYED: 'delayed',
  CANCELLED: 'cancelled',
  ARRIVED: 'arrived',
  BOARDING: 'boarding',
  DEPARTED: 'departed',
};

// Delay reasons
const DELAY_REASONS = [
  'Signal maintenance',
  'Track inspection',
  'Weather conditions',
  'Passenger boarding',
  'Connecting service',
  'Crew change',
  'Technical check',
];

/**
 * Initialize active trains for simulation
 */
const initializeActiveTrains = () => {
  const now = new Date();
  const schedules = generateDailySchedules(now);
  
  activeTrains = schedules.map(schedule => {
    const departureTime = new Date(schedule.departureTime);
    const arrivalTime = new Date(schedule.arrivalTime);
    const totalDuration = arrivalTime - departureTime;
    
    // Calculate current progress if train has departed
    let progress = 0;
    let currentStatus = TRAIN_STATUS.ON_TIME;
    let delayMinutes = 0;
    let currentStop = 0;
    
    if (now > departureTime && now < arrivalTime) {
      progress = (now - departureTime) / totalDuration;
      currentStatus = TRAIN_STATUS.DEPARTED;
      
      // Simulate occasional delays (20% chance)
      if (Math.random() < 0.2) {
        delayMinutes = Math.floor(Math.random() * 30) + 5;
        currentStatus = TRAIN_STATUS.DELAYED;
      }
      
      // Calculate current stop
      const stops = schedule.route.stops;
      for (let i = 0; i < stops.length; i++) {
        const stopProgress = stops[i].arrivalOffset / schedule.route.duration.hours;
        if (progress >= stopProgress) {
          currentStop = i;
        }
      }
    } else if (now >= arrivalTime) {
      progress = 1;
      currentStatus = TRAIN_STATUS.ARRIVED;
      currentStop = schedule.route.stops.length - 1;
    } else if (now > new Date(departureTime.getTime() - 30 * 60000)) {
      // Within 30 minutes of departure
      currentStatus = TRAIN_STATUS.BOARDING;
    }
    
    // Calculate current position (interpolate between stops)
    const route = schedule.route;
    const fromCoords = { lat: -6.8235, lng: 39.2695 }; // Default Dar es Salaam
    const toCoords = { lat: -14.4524, lng: 28.4526 }; // Default Kapiri Mposhi
    
    const currentLat = fromCoords.lat + (toCoords.lat - fromCoords.lat) * progress;
    const currentLng = fromCoords.lng + (toCoords.lng - fromCoords.lng) * progress;
    
    return {
      ...schedule,
      progress,
      currentStatus,
      delayMinutes,
      delayReason: delayMinutes > 0 ? DELAY_REASONS[Math.floor(Math.random() * DELAY_REASONS.length)] : null,
      currentStop,
      currentStopName: route.stops[currentStop]?.name || route.from.station,
      nextStopName: route.stops[currentStop + 1]?.name || route.to.station,
      currentPosition: {
        lat: currentLat,
        lng: currentLng,
      },
      speed: progress > 0 && progress < 1 ? Math.floor(Math.random() * 40) + 60 : 0, // km/h
      lastUpdated: now.toISOString(),
    };
  });
  
  return activeTrains;
};

/**
 * Get all active trains
 */
export const getActiveTrains = () => {
  if (activeTrains.length === 0) {
    initializeActiveTrains();
  }
  return activeTrains;
};

/**
 * Get train by ID
 */
export const getTrainById = (trainId) => {
  const trains = getActiveTrains();
  return trains.find(t => t.id === trainId);
};

/**
 * Get trains for a specific route
 */
export const getTrainsForRoute = (routeId) => {
  const trains = getActiveTrains();
  return trains.filter(t => t.routeId === routeId);
};

/**
 * Get next train arrival at a station
 */
export const getNextArrival = (stationName) => {
  const trains = getActiveTrains();
  const now = new Date();
  
  const arrivals = trains
    .filter(train => {
      // Check if this train stops at the station
      return train.route.stops.some(stop => 
        stop.name.toLowerCase().includes(stationName.toLowerCase())
      );
    })
    .map(train => {
      const stop = train.route.stops.find(s => 
        s.name.toLowerCase().includes(stationName.toLowerCase())
      );
      if (!stop) return null;
      
      const departureTime = new Date(train.departureTime);
      const arrivalAtStop = new Date(departureTime.getTime() + stop.arrivalOffset * 60 * 60 * 1000);
      
      // Add delay if applicable
      if (train.delayMinutes > 0) {
        arrivalAtStop.setMinutes(arrivalAtStop.getMinutes() + train.delayMinutes);
      }
      
      const minutesUntilArrival = Math.floor((arrivalAtStop - now) / 60000);
      
      return {
        train,
        arrivalTime: arrivalAtStop.toISOString(),
        minutesUntilArrival,
        isDelayed: train.delayMinutes > 0,
        delayMinutes: train.delayMinutes,
      };
    })
    .filter(a => a && a.minutesUntilArrival > 0)
    .sort((a, b) => a.minutesUntilArrival - b.minutesUntilArrival);
  
  return arrivals[0] || null;
};

/**
 * Get "Next train in X minutes" for a station
 */
export const getNextTrainCountdown = (stationName) => {
  const nextArrival = getNextArrival(stationName);
  
  if (!nextArrival) {
    return {
      hasNextTrain: false,
      message: 'No upcoming trains',
    };
  }
  
  const { train, minutesUntilArrival, isDelayed, delayMinutes } = nextArrival;
  
  let timeMessage;
  if (minutesUntilArrival < 1) {
    timeMessage = 'Arriving now';
  } else if (minutesUntilArrival === 1) {
    timeMessage = '1 minute';
  } else if (minutesUntilArrival < 60) {
    timeMessage = `${minutesUntilArrival} minutes`;
  } else {
    const hours = Math.floor(minutesUntilArrival / 60);
    const mins = minutesUntilArrival % 60;
    timeMessage = `${hours}h ${mins}m`;
  }
  
  return {
    hasNextTrain: true,
    trainNumber: train.trainNumber,
    trainName: train.route.name,
    destination: train.route.to.city,
    minutesUntilArrival,
    timeMessage,
    isDelayed,
    delayMinutes,
    platform: train.platform,
    status: train.currentStatus,
  };
};

/**
 * Subscribe to real-time updates (simulated)
 * In production, this would use WebSocket or Server-Sent Events
 */
export const subscribeToTrainUpdates = (trainId, callback) => {
  const intervalId = setInterval(() => {
    // Refresh train data
    initializeActiveTrains();
    const train = getTrainById(trainId);
    if (train) {
      callback(train);
    }
  }, 30000); // Update every 30 seconds
  
  // Return unsubscribe function
  return () => clearInterval(intervalId);
};

/**
 * Subscribe to station updates
 */
export const subscribeToStationUpdates = (stationName, callback) => {
  const intervalId = setInterval(() => {
    initializeActiveTrains();
    const countdown = getNextTrainCountdown(stationName);
    callback(countdown);
  }, 30000);
  
  return () => clearInterval(intervalId);
};

/**
 * Get live departures board for a station
 */
export const getDeparturesBoard = (stationName, limit = 10) => {
  const trains = getActiveTrains();
  const now = new Date();
  
  const departures = trains
    .filter(train => {
      const fromCity = train.route.from.city.toLowerCase();
      const stationLower = stationName.toLowerCase();
      return fromCity.includes(stationLower) || stationLower.includes(fromCity);
    })
    .filter(train => {
      const departureTime = new Date(train.departureTime);
      return departureTime > now || train.currentStatus === TRAIN_STATUS.BOARDING;
    })
    .map(train => {
      const departureTime = new Date(train.departureTime);
      const minutesUntilDeparture = Math.floor((departureTime - now) / 60000);
      
      return {
        trainNumber: train.trainNumber,
        trainName: train.route.name,
        destination: train.route.to.city,
        scheduledDeparture: train.departureTime,
        expectedDeparture: train.delayMinutes > 0 
          ? new Date(departureTime.getTime() + train.delayMinutes * 60000).toISOString()
          : train.departureTime,
        platform: train.platform,
        status: train.currentStatus,
        isDelayed: train.delayMinutes > 0,
        delayMinutes: train.delayMinutes,
        delayReason: train.delayReason,
        minutesUntilDeparture: Math.max(0, minutesUntilDeparture + (train.delayMinutes || 0)),
      };
    })
    .sort((a, b) => a.minutesUntilDeparture - b.minutesUntilDeparture)
    .slice(0, limit);
  
  return departures;
};

/**
 * Get arrivals board for a station
 */
export const getArrivalsBoard = (stationName, limit = 10) => {
  const trains = getActiveTrains();
  const now = new Date();
  
  const arrivals = trains
    .filter(train => {
      const toCity = train.route.to.city.toLowerCase();
      const stationLower = stationName.toLowerCase();
      return toCity.includes(stationLower) || stationLower.includes(toCity);
    })
    .filter(train => {
      const arrivalTime = new Date(train.arrivalTime);
      return arrivalTime > now;
    })
    .map(train => {
      const arrivalTime = new Date(train.arrivalTime);
      const minutesUntilArrival = Math.floor((arrivalTime - now) / 60000);
      
      return {
        trainNumber: train.trainNumber,
        trainName: train.route.name,
        origin: train.route.from.city,
        scheduledArrival: train.arrivalTime,
        expectedArrival: train.delayMinutes > 0 
          ? new Date(arrivalTime.getTime() + train.delayMinutes * 60000).toISOString()
          : train.arrivalTime,
        platform: train.platform,
        status: train.currentStatus,
        isDelayed: train.delayMinutes > 0,
        delayMinutes: train.delayMinutes,
        delayReason: train.delayReason,
        minutesUntilArrival: Math.max(0, minutesUntilArrival + (train.delayMinutes || 0)),
      };
    })
    .sort((a, b) => a.minutesUntilArrival - b.minutesUntilArrival)
    .slice(0, limit);
  
  return arrivals;
};

// Initialize on module load
initializeActiveTrains();

export default {
  TRAIN_STATUS,
  getActiveTrains,
  getTrainById,
  getTrainsForRoute,
  getNextArrival,
  getNextTrainCountdown,
  subscribeToTrainUpdates,
  subscribeToStationUpdates,
  getDeparturesBoard,
  getArrivalsBoard,
};
