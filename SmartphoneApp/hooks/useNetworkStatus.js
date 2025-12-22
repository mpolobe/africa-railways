import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Custom hook to monitor network connectivity
 * Returns current network status and connection type
 */
export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionType, setConnectionType] = useState('unknown');
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
      setConnectionType(state.type);
      setIsInternetReachable(state.isInternetReachable ?? false);
    });

    // Get initial state
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected ?? false);
      setConnectionType(state.type);
      setIsInternetReachable(state.isInternetReachable ?? false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  return {
    isConnected,
    connectionType,
    isInternetReachable,
    isOffline: !isConnected || !isInternetReachable
  };
};
