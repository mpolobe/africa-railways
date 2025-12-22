import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  cacheData,
  getCachedData,
  clearCache,
  clearAllCache,
  getCacheInfo,
  CACHE_KEYS
} from '../services/offlineStorage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiRemove: jest.fn(() => Promise.resolve())
}));

describe('Offline Storage Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('cacheData', () => {
    it('should cache data successfully', async () => {
      const testData = { id: 1, name: 'Test' };
      const result = await cacheData('test_key', testData);

      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      AsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));
      const result = await cacheData('test_key', {});

      expect(result).toBe(false);
    });
  });

  describe('getCachedData', () => {
    it('should return cached data if not expired', async () => {
      const testData = { id: 1, name: 'Test' };
      const cacheItem = {
        data: testData,
        timestamp: Date.now()
      };
      
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(cacheItem));
      
      const result = await getCachedData('test_key');
      expect(result).toEqual(testData);
    });

    it('should return null for expired data', async () => {
      const testData = { id: 1, name: 'Test' };
      const cacheItem = {
        data: testData,
        timestamp: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      };
      
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(cacheItem));
      
      const result = await getCachedData('test_key');
      expect(result).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });

    it('should return null if no cached data exists', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);
      
      const result = await getCachedData('test_key');
      expect(result).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should clear specific cache item', async () => {
      const result = await clearCache('test_key');

      expect(result).toBe(true);
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('clearAllCache', () => {
    it('should clear all app cache', async () => {
      AsyncStorage.getAllKeys.mockResolvedValueOnce([
        '@AfricaRailways:key1',
        '@AfricaRailways:key2',
        '@OtherApp:key3'
      ]);

      const result = await clearAllCache();

      expect(result).toBe(true);
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        '@AfricaRailways:key1',
        '@AfricaRailways:key2'
      ]);
    });
  });

  describe('CACHE_KEYS', () => {
    it('should have all required cache keys', () => {
      expect(CACHE_KEYS.TICKET_DATA).toBeDefined();
      expect(CACHE_KEYS.ROUTE_INFO).toBeDefined();
      expect(CACHE_KEYS.STATION_LIST).toBeDefined();
      expect(CACHE_KEYS.USER_PROFILE).toBeDefined();
      expect(CACHE_KEYS.SCHEDULES).toBeDefined();
    });
  });
});
