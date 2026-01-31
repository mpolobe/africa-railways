import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { MapHologram } from '../MapHologram';
import OfflineIndicator from '../components/OfflineIndicator';
import WalletHeader from '../components/WalletHeader';
import NextTrainCountdown from '../components/NextTrainCountdown';
import AlertBanner, { AlertBadge } from '../components/AlertBanner';
import { useAnalytics, useTrackPress } from '../hooks/useAnalytics';
import { getPassSummary } from '../services/passService';

/**
 * Home Screen
 * Main dashboard with wallet balance, real-time train info, and quick actions
 */
const HomeScreen = ({ navigation }) => {
  const { trackAction } = useAnalytics('Home');
  const trackScanPress = useTrackPress('scan_ticket_button');
  const trackSchedulesPress = useTrackPress('schedules_button');
  const trackSettingsPress = useTrackPress('settings_button');
  
  const [refreshing, setRefreshing] = useState(false);
  const [passSummary, setPassSummary] = useState(null);
  const [selectedStation, setSelectedStation] = useState('Dar es Salaam');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const pass = await getPassSummary();
      setPassSummary(pass);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <OfflineIndicator />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#38BDF8"
          />
        }
      >
        {/* Wallet Balance Header */}
        <WalletHeader 
          onPress={() => navigation.navigate('Wallet')}
        />

        {/* Active Pass Badge */}
        {passSummary?.hasActivePass && (
          <TouchableOpacity 
            style={styles.passBadge}
            onPress={() => navigation.navigate('Passes')}
          >
            <Text style={styles.passBadgeIcon}>🎫</Text>
            <View style={styles.passBadgeContent}>
              <Text style={styles.passBadgeName}>{passSummary.passName}</Text>
              <Text style={styles.passBadgeInfo}>
                {passSummary.tripsRemaining === 'unlimited' 
                  ? 'Unlimited trips' 
                  : `${passSummary.tripsRemaining} trips left`} • {passSummary.daysRemaining} days
              </Text>
            </View>
            <Text style={styles.passBadgeArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* Alert Banner */}
        <AlertBanner 
          maxAlerts={2}
          onAlertPress={(alert) => navigation.navigate('Alerts', { alert })}
        />

        {/* Real-time Train Countdown */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Next Train</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Schedules')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <NextTrainCountdown 
            stationName={selectedStation}
            showDetails={true}
          />
        </View>

        {/* Hologram Section */}
        <View style={styles.hologramCard}>
          <Text style={styles.cardTitle}>LIVE ROUTE TRACKER</Text>
          <MapHologram />
          <View style={styles.statusBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.statusText}>EN ROUTE: LAGOS → ABUJA</Text>
          </View>
        </View>

        {/* Quick Actions - Row 1 */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('TicketBooking')}
          >
            <Text style={styles.actionIcon}>🎫</Text>
            <Text style={styles.actionText}>Book Ticket</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('FareCalculator')}
          >
            <Text style={styles.actionIcon}>💰</Text>
            <Text style={styles.actionText}>Fare Calculator</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('MyTickets')}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionText}>My Tickets</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions - Row 2 */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Passes')}
          >
            <Text style={styles.actionIcon}>🎟️</Text>
            <Text style={styles.actionText}>Passes</Text>
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
            onPress={() => navigation.navigate('NFTGallery')}
          >
            <Text style={styles.actionIcon}>🖼️</Text>
            <Text style={styles.actionText}>NFT Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions - Row 3 */}
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
            onPress={() => navigation.navigate('Alerts')}
          >
            <Text style={styles.actionIcon}>🔔</Text>
            <Text style={styles.actionText}>Alerts</Text>
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
          <Text style={styles.infoTitle}>Africa Railways</Text>
          <Text style={styles.infoText}>
            Connecting 54 African nations via 7 high-speed rail corridors. 
            Book tickets, track trains, and travel seamlessly across the continent.
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
    paddingBottom: 20,
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F1F5F9',
  },
  seeAllText: {
    fontSize: 14,
    color: '#38BDF8',
  },
  passBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 12,
  },
  passBadgeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  passBadgeContent: {
    flex: 1,
  },
  passBadgeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  passBadgeInfo: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  passBadgeArrow: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.7)',
  },
  hologramCard: {
    marginHorizontal: 16,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginVertical: 8,
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  actionButton: {
    width: '31%',
    backgroundColor: '#0f172a',
    borderRadius: 15,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionText: {
    color: '#F1F5F9',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoCard: {
    marginHorizontal: 16,
    backgroundColor: '#0f172a',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginTop: 8,
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
