import { useState, useEffect } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { cacheData, getCachedData } from '../services/offlineStorage';

/**
 * Custom hook for offline-first data fetching
 * Automatically caches data and serves from cache when offline
 * 
 * @param {string} cacheKey - Unique key for caching this data
 * @param {Function} fetchFunction - Async function to fetch data
 * @param {Object} options - Configuration options
 * @returns {Object} - { data, loading, error, refetch, isFromCache }
 */
export const useOfflineData = (cacheKey, fetchFunction, options = {}) => {
  const {
    cacheExpiry = 24 * 60 * 60 * 1000, // 24 hours default
    fetchOnMount = true,
    dependencies = []
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);
  
  const { isOffline } = useNetworkStatus();

  const fetchData = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      // If offline or not forcing refresh, try cache first
      if (isOffline || !forceRefresh) {
        const cachedData = await getCachedData(cacheKey, cacheExpiry);
        if (cachedData) {
          setData(cachedData);
          setIsFromCache(true);
          setLoading(false);
          
          // If online, still fetch fresh data in background
          if (!isOffline && !forceRefresh) {
            fetchFreshData();
          }
          return;
        }
      }

      // If no cache or online, fetch fresh data
      if (!isOffline) {
        await fetchFreshData();
      } else {
        // Offline and no cache available
        setError(new Error('No internet connection and no cached data available'));
        setLoading(false);
      }
    } catch (err) {
      console.error('Error in useOfflineData:', err);
      setError(err);
      setLoading(false);
    }
  };

  const fetchFreshData = async () => {
    try {
      const freshData = await fetchFunction();
      setData(freshData);
      setIsFromCache(false);
      
      // Cache the fresh data
      await cacheData(cacheKey, freshData);
      setLoading(false);
    } catch (err) {
      // If fetch fails, try to use cached data as fallback
      const cachedData = await getCachedData(cacheKey, Infinity); // Accept any age
      if (cachedData) {
        setData(cachedData);
        setIsFromCache(true);
        setError(new Error('Using cached data due to network error'));
      } else {
        setError(err);
      }
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchData(true);
  };

  useEffect(() => {
    if (fetchOnMount) {
      fetchData();
    }
  }, [cacheKey, isOffline, ...dependencies]);

  return {
    data,
    loading,
    error,
    refetch,
    isFromCache,
    isOffline
  };
};
