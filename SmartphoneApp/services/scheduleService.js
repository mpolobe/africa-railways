/**
 * Schedule Service
 * Fetches train schedules from Supabase with offline fallback
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../lib/supabase';
import { 
  TRAIN_OPERATORS, 
  TAZARA_SCHEDULES, 
  ZRL_SCHEDULES, 
  SGR_KENYA_SCHEDULES,
  GAUTRAIN_SCHEDULES,
  ROUTES 
} from '../data/trainSchedules';

const CACHE_KEYS = {
  OPERATORS: 'cache_operators',
  STATIONS: 'cache_stations',
  ROUTES: 'cache_routes',
  SCHEDULES: 'cache_schedules',
  FARES: 'cache_fares',
  LAST_SYNC: 'cache_last_sync',
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Check if online
 */
const isOnline = async () => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable;
  } catch {
    return false;
  }
};

/**
 * Get cached data
 */
const getCached = async (key) => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

/**
 * Set cached data
 */
const setCache = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to cache data:', error);
  }
};

/**
 * Check if cache is stale
 */
const isCacheStale = async () => {
  const lastSync = await getCached(CACHE_KEYS.LAST_SYNC);
  if (!lastSync) return true;
  return Date.now() - lastSync > CACHE_DURATION;
};

/**
 * Get operators from Supabase or cache
 */
export const getOperators = async () => {
  const online = await isOnline();
  const stale = await isCacheStale();

  if (online && stale) {
    try {
      const { data, error } = await supabase
        .from('train_operators')
        .select('*')
        .eq('is_active', true);

      if (!error && data?.length > 0) {
        await setCache(CACHE_KEYS.OPERATORS, data);
        return data;
      }
    } catch (error) {
      console.warn('Failed to fetch operators from Supabase:', error);
    }
  }

  // Try cache
  const cached = await getCached(CACHE_KEYS.OPERATORS);
  if (cached) return cached;

  // Fallback to local data
  return Object.values(TRAIN_OPERATORS);
};

/**
 * Get stations from Supabase or cache
 */
export const getStations = async (operatorId = null) => {
  const online = await isOnline();
  const stale = await isCacheStale();

  if (online && stale) {
    try {
      let query = supabase
        .from('train_stations')
        .select('*')
        .eq('is_active', true);

      if (operatorId) {
        query = query.eq('operator_id', operatorId);
      }

      const { data, error } = await query;

      if (!error && data?.length > 0) {
        await setCache(CACHE_KEYS.STATIONS, data);
        return data;
      }
    } catch (error) {
      console.warn('Failed to fetch stations from Supabase:', error);
    }
  }

  // Try cache
  const cached = await getCached(CACHE_KEYS.STATIONS);
  if (cached) {
    return operatorId 
      ? cached.filter(s => s.operator_id === operatorId)
      : cached;
  }

  // No local fallback for stations - return empty
  return [];
};

/**
 * Get routes from Supabase or cache
 */
export const getRoutes = async (operatorId = null) => {
  const online = await isOnline();
  const stale = await isCacheStale();

  if (online && stale) {
    try {
      let query = supabase
        .from('train_routes')
        .select(`
          *,
          operator:train_operators(id, name, color),
          fares:train_fares(ticket_class, price_local, currency_local, price_usd)
        `)
        .eq('is_active', true);

      if (operatorId) {
        query = query.eq('operator_id', operatorId);
      }

      const { data, error } = await query;

      if (!error && data?.length > 0) {
        await setCache(CACHE_KEYS.ROUTES, data);
        await setCache(CACHE_KEYS.LAST_SYNC, Date.now());
        return data;
      }
    } catch (error) {
      console.warn('Failed to fetch routes from Supabase:', error);
    }
  }

  // Try cache
  const cached = await getCached(CACHE_KEYS.ROUTES);
  if (cached) {
    return operatorId 
      ? cached.filter(r => r.operator_id === operatorId)
      : cached;
  }

  // Fallback to local data
  return operatorId 
    ? ROUTES.filter(r => r.operator.toLowerCase() === operatorId)
    : ROUTES;
};

/**
 * Get fares for a route
 */
export const getFares = async (routeId) => {
  const online = await isOnline();

  if (online) {
    try {
      const { data, error } = await supabase
        .from('train_fares')
        .select('*')
        .eq('route_id', routeId)
        .eq('is_active', true);

      if (!error && data?.length > 0) {
        return data;
      }
    } catch (error) {
      console.warn('Failed to fetch fares from Supabase:', error);
    }
  }

  // Fallback to local data
  const route = ROUTES.find(r => r.id === routeId);
  if (route?.schedule?.fares) {
    return Object.entries(route.schedule.fares).map(([ticketClass, prices]) => ({
      ticket_class: ticketClass,
      ...prices,
    }));
  }

  return [];
};

/**
 * Get schedule details for a route
 */
export const getScheduleDetails = async (routeId, direction = 'southbound') => {
  const route = ROUTES.find(r => r.id === routeId);
  if (!route) return null;

  const schedule = route.schedule?.[direction] || route.schedule;
  if (!schedule) return null;

  return {
    routeId,
    routeName: route.name,
    operator: route.operator,
    direction,
    departureDay: schedule.departureDay,
    departureTime: schedule.departureTime,
    arrivalDay: schedule.arrivalDay,
    stops: schedule.stops || [],
    classes: route.classes,
    amenities: route.amenities,
    fares: schedule.fares || route.schedule?.fares,
  };
};

/**
 * Search routes by origin and destination
 */
export const searchRoutes = async (from, to) => {
  const routes = await getRoutes();
  
  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();

  return routes.filter(route => {
    const fromCity = (route.from_city || route.from?.city || '').toLowerCase();
    const toCity = (route.to_city || route.to?.city || '').toLowerCase();
    
    return (
      (fromCity.includes(fromLower) && toCity.includes(toLower)) ||
      (toCity.includes(fromLower) && fromCity.includes(toLower))
    );
  });
};

/**
 * Get next departures for a station
 */
export const getNextDepartures = async (stationCode, limit = 5) => {
  const routes = await getRoutes();
  const now = new Date();
  const dayOfWeek = now.getDay();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = dayNames[dayOfWeek];

  const departures = [];

  for (const route of routes) {
    const schedule = route.schedule;
    if (!schedule) continue;

    // Check both directions
    for (const direction of ['northbound', 'southbound']) {
      const dirSchedule = schedule[direction] || schedule;
      if (!dirSchedule?.stops) continue;

      const stop = dirSchedule.stops.find(s => 
        s.code === stationCode || 
        s.station?.toLowerCase().includes(stationCode.toLowerCase())
      );

      if (stop && stop.departure) {
        const depDay = dirSchedule.departureDay;
        let daysUntil = dayNames.indexOf(depDay) - dayOfWeek;
        if (daysUntil < 0) daysUntil += 7;

        departures.push({
          route: route.name,
          routeId: route.id,
          direction,
          destination: direction === 'northbound' 
            ? (route.from_city || route.from?.city)
            : (route.to_city || route.to?.city),
          departureTime: stop.departure,
          departureDay: depDay,
          daysUntil: daysUntil + (stop.dayOffset || 0),
          operator: route.operator_id || route.operator,
        });
      }
    }
  }

  return departures
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, limit);
};

/**
 * Sync all schedule data from Supabase
 */
export const syncSchedules = async () => {
  const online = await isOnline();
  if (!online) {
    return { success: false, error: 'Offline' };
  }

  try {
    const [operators, stations, routes] = await Promise.all([
      supabase.from('train_operators').select('*').eq('is_active', true),
      supabase.from('train_stations').select('*').eq('is_active', true),
      supabase.from('train_routes').select('*, fares:train_fares(*)').eq('is_active', true),
    ]);

    if (operators.data) await setCache(CACHE_KEYS.OPERATORS, operators.data);
    if (stations.data) await setCache(CACHE_KEYS.STATIONS, stations.data);
    if (routes.data) await setCache(CACHE_KEYS.ROUTES, routes.data);
    
    await setCache(CACHE_KEYS.LAST_SYNC, Date.now());

    return { 
      success: true, 
      counts: {
        operators: operators.data?.length || 0,
        stations: stations.data?.length || 0,
        routes: routes.data?.length || 0,
      }
    };
  } catch (error) {
    console.error('Failed to sync schedules:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clear schedule cache
 */
export const clearCache = async () => {
  await Promise.all([
    AsyncStorage.removeItem(CACHE_KEYS.OPERATORS),
    AsyncStorage.removeItem(CACHE_KEYS.STATIONS),
    AsyncStorage.removeItem(CACHE_KEYS.ROUTES),
    AsyncStorage.removeItem(CACHE_KEYS.SCHEDULES),
    AsyncStorage.removeItem(CACHE_KEYS.FARES),
    AsyncStorage.removeItem(CACHE_KEYS.LAST_SYNC),
  ]);
};

export default {
  getOperators,
  getStations,
  getRoutes,
  getFares,
  getScheduleDetails,
  searchRoutes,
  getNextDepartures,
  syncSchedules,
  clearCache,
};
