import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MapHologram } from '../MapHologram';
import OfflineIndicator from '../components/OfflineIndicator';
import { useAnalytics, useTrackPress } from '../hooks/useAnalytics';

/**
 * Home Screen
 * Main dashboard showing route tracker and quick actions
 */
const HomeScreen = ({ navigation }) => {
  const { trackAction } = useAnalytics('Home');
  const trackScanPress = useTrackPress('scan_ticket_button');
  const trackSchedulesPress = useTrackPress('schedules_button');
  const trackSettingsPress = useTrackPress('settings_button');
  return (
    <View style={styles.container}>
      <OfflineIndicator />
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Subtitle */}
        <Text style={styles.subtitle}>Digital Sovereign Transit</Text>

        {/* Hologram Section */}
        <View style={styles.hologramCard}>
          <Text style={styles.cardTitle}>LIVE ROUTE TRACKER</Text>
          <MapHologram />
          <View style={styles.statusBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.statusText}>EN ROUTE: LAGOS ➔ ABUJA</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              trackScanPress();
              navigation.navigate('ScanTicket');
            }}
          >
            <Text style={styles.actionIcon}>📱</Text>
            <Text style={styles.actionText}>Scan Ticket</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              trackSchedulesPress();
              navigation.navigate('Schedules');
            }}
          >
            <Text style={styles.actionIcon}>🚂</Text>
            <Text style={styles.actionText}>Schedules</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              trackSettingsPress();
              navigation.navigate('Settings');
            }}
          >
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Staff Terminal</Text>
          <Text style={styles.infoText}>
            Validate passenger Move NFTs and monitor real-time transit operations.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scrollContainer: {
    padding: 20,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 30,
  },
  hologramCard: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20,
  },
  cardTitle: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 8,
  },
  statusText: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  actionButton: {
    width: '30%',
    backgroundColor: '#0f172a',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 10,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  infoTitle: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default HomeScreen;
