import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

/**
 * OfflineIndicator Component
 * Shows a banner when the device is offline
 */
export const OfflineIndicator = () => {
  const { isOffline } = useNetworkStatus();
  const [slideAnim] = React.useState(new Animated.Value(-100));

  React.useEffect(() => {
    if (isOffline) {
      // Slide down
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8
      }).start();
    } else {
      // Slide up
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  }, [isOffline]);

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>📡</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Offline Mode</Text>
          <Text style={styles.subtitle}>Showing cached data</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f59e0b',
    zIndex: 1000,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 40, // Account for status bar
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#ffffff',
    fontSize: 12,
    opacity: 0.9,
  },
});

export default OfflineIndicator;
