import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Offline Storage Service
 * Handles caching of data for offline access
 */

const CACHE_PREFIX = '@AfricaRailways:';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Save data to cache with timestamp
 */
export const cacheData = async (key, data) => {
  try {
    const cacheItem = {
      data,
      timestamp: Date.now()
    };
    await AsyncStorage.setItem(
      `${CACHE_PREFIX}${key}`,
      JSON.stringify(cacheItem)
    );
    return true;
  } catch (error) {
    console.error('Error caching data:', error);
    return false;
  }
};

/**
 * Get data from cache if not expired
 */
export const getCachedData = async (key, maxAge = CACHE_EXPIRY_MS) => {
  try {
    const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    // Return data if not expired
    if (age < maxAge) {
      return data;
    }

    // Remove expired data
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
    return null;
  } catch (error) {
    console.error('Error getting cached data:', error);
    return null;
  }
};

/**
 * Clear specific cache item
 */
export const clearCache = async (key) => {
  try {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
};

/**
 * Clear all app cache
 */
export const clearAllCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const appKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(appKeys);
    return true;
  } catch (error) {
    console.error('Error clearing all cache:', error);
    return false;
  }
};

/**
 * Get cache size info
 */
export const getCacheInfo = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const appKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    
    const items = await AsyncStorage.multiGet(appKeys);
    const totalSize = items.reduce((sum, [, value]) => {
      return sum + (value ? value.length : 0);
    }, 0);

    return {
      itemCount: appKeys.length,
      totalSize: totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2)
    };
  } catch (error) {
    console.error('Error getting cache info:', error);
    return null;
  }
};

/**
 * Cache keys for different data types
 */
export const CACHE_KEYS = {
  TICKET_DATA: 'ticket_data',
  ROUTE_INFO: 'route_info',
  STATION_LIST: 'station_list',
  USER_PROFILE: 'user_profile',
  SCHEDULES: 'schedules'
};
