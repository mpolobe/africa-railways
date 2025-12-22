import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useOfflineData } from '../hooks/useOfflineData';
import { CACHE_KEYS } from '../services/offlineStorage';

/**
 * Schedules Screen
 * Displays train schedules with offline support
 */
const SchedulesScreen = () => {
  // Mock fetch function - replace with actual API call
  const fetchSchedules = async () => {
    // Simulate API call
    return [
      {
        id: 1,
        route: 'Lagos → Abuja',
        departure: '08:00 AM',
        arrival: '02:00 PM',
        status: 'On Time',
        train: 'Express 101'
      },
      {
        id: 2,
        route: 'Abuja → Kano',
        departure: '10:30 AM',
        arrival: '04:30 PM',
        status: 'On Time',
        train: 'Express 202'
      },
      {
        id: 3,
        route: 'Lagos → Port Harcourt',
        departure: '12:00 PM',
        arrival: '06:00 PM',
        status: 'Delayed',
        train: 'Express 303'
      },
      {
        id: 4,
        route: 'Kano → Lagos',
        departure: '03:00 PM',
        arrival: '11:00 PM',
        status: 'On Time',
        train: 'Express 404'
      },
    ];
  };

  const { data: schedules, loading, error, refetch, isFromCache, isOffline } = useOfflineData(
    CACHE_KEYS.SCHEDULES,
    fetchSchedules
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'On Time':
        return '#10b981';
      case 'Delayed':
        return '#f59e0b';
      case 'Cancelled':
        return '#ef4444';
      default:
        return '#64748B';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header Info */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Train Schedules</Text>
          {isFromCache && (
            <Text style={styles.cacheIndicator}>📦 Showing cached data</Text>
          )}
          {isOffline && (
            <Text style={styles.offlineIndicator}>📡 Offline Mode</Text>
          )}
        </View>

        {/* Loading State */}
        {loading && !schedules && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading schedules...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !schedules && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load schedules</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refetch}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Schedules List */}
        {schedules && schedules.map((schedule) => (
          <View key={schedule.id} style={styles.scheduleCard}>
            <View style={styles.scheduleHeader}>
              <Text style={styles.trainNumber}>{schedule.train}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(schedule.status) }]}>
                <Text style={styles.statusText}>{schedule.status}</Text>
              </View>
            </View>

            <Text style={styles.route}>{schedule.route}</Text>

            <View style={styles.timeContainer}>
              <View style={styles.timeBlock}>
                <Text style={styles.timeLabel}>Departure</Text>
                <Text style={styles.timeValue}>{schedule.departure}</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
              <View style={styles.timeBlock}>
                <Text style={styles.timeLabel}>Arrival</Text>
                <Text style={styles.timeValue}>{schedule.arrival}</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Refresh Button */}
        {schedules && !isOffline && (
          <TouchableOpacity style={styles.refreshButton} onPress={refetch}>
            <Text style={styles.refreshButtonText}>🔄 Refresh Schedules</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    padding: 20,
  },
  headerCard: {
    backgroundColor: '#0f172a',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  headerTitle: {
    color: '#38bdf8',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cacheIndicator: {
    color: '#f59e0b',
    fontSize: 12,
    marginTop: 5,
  },
  offlineIndicator: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 5,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748B',
    fontSize: 16,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#38bdf8',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#020617',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scheduleCard: {
    backgroundColor: '#0f172a',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  trainNumber: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  route: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeBlock: {
    flex: 1,
  },
  timeLabel: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 5,
  },
  timeValue: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: 'bold',
  },
  arrow: {
    color: '#38bdf8',
    fontSize: 24,
    marginHorizontal: 10,
  },
  refreshButton: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  refreshButtonText: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SchedulesScreen;
