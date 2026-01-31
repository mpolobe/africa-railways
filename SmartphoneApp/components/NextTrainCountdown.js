/**
 * NextTrainCountdown Component
 * Shows "Next train in X minutes" for a station
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { getNextTrainCountdown, subscribeToStationUpdates, TRAIN_STATUS } from '../services/realTimeTrainService';

const NextTrainCountdown = ({ stationName = 'Dar es Salaam', showDetails = true }) => {
  const [countdown, setCountdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    loadCountdown();
    
    // Subscribe to updates
    const unsubscribe = subscribeToStationUpdates(stationName, (data) => {
      setCountdown(data);
    });

    // Pulse animation for live indicator
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => {
      unsubscribe();
      pulse.stop();
    };
  }, [stationName]);

  const loadCountdown = async () => {
    try {
      const data = getNextTrainCountdown(stationName);
      setCountdown(data);
    } catch (error) {
      console.error('Failed to load countdown:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!countdown?.hasNextTrain) {
    return (
      <View style={styles.container}>
        <Text style={styles.noTrainText}>No upcoming trains</Text>
        <Text style={styles.stationText}>at {stationName}</Text>
      </View>
    );
  }

  const getStatusColor = () => {
    if (countdown.isDelayed) return '#F59E0B';
    if (countdown.minutesUntilArrival <= 5) return '#10B981';
    return '#3B82F6';
  };

  return (
    <View style={styles.container}>
      {/* Live indicator */}
      <View style={styles.liveIndicator}>
        <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>

      {/* Main countdown */}
      <View style={styles.countdownContainer}>
        <Text style={styles.nextTrainLabel}>Next train in</Text>
        <Text style={[styles.countdownTime, { color: getStatusColor() }]}>
          {countdown.timeMessage}
        </Text>
      </View>

      {/* Train details */}
      {showDetails && (
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.trainNumber}>{countdown.trainNumber}</Text>
            <Text style={styles.trainName}>{countdown.trainName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.destinationLabel}>To:</Text>
            <Text style={styles.destination}>{countdown.destination}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.platformLabel}>Platform:</Text>
            <Text style={styles.platform}>{countdown.platform}</Text>
          </View>
        </View>
      )}

      {/* Delay warning */}
      {countdown.isDelayed && (
        <View style={styles.delayBanner}>
          <Text style={styles.delayIcon}>⚠️</Text>
          <Text style={styles.delayText}>
            Delayed by {countdown.delayMinutes} minutes
          </Text>
        </View>
      )}

      {/* Station name */}
      <Text style={styles.stationText}>at {stationName}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#10B981',
    letterSpacing: 1,
  },
  countdownContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  nextTrainLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 4,
  },
  countdownTime: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  detailsContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  trainNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#38BDF8',
    marginRight: 8,
  },
  trainName: {
    fontSize: 14,
    color: '#F1F5F9',
  },
  destinationLabel: {
    fontSize: 12,
    color: '#64748B',
    marginRight: 4,
  },
  destination: {
    fontSize: 14,
    color: '#F1F5F9',
    fontWeight: '600',
  },
  platformLabel: {
    fontSize: 12,
    color: '#64748B',
    marginRight: 4,
  },
  platform: {
    fontSize: 14,
    color: '#F1F5F9',
    fontWeight: '600',
  },
  delayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  delayIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  delayText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  stationText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  noTrainText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 4,
  },
});

export default NextTrainCountdown;
