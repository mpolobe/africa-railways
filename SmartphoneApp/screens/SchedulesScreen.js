import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useOfflineData } from '../hooks/useOfflineData';
import { CACHE_KEYS } from '../services/offlineStorage';
import MultiCurrencyPrice from '../components/MultiCurrencyPrice';
import { getTicketPrice, detectLocalCurrency, EXCHANGE_RATES, getCurrencySymbol } from '../utils/currencyConverter';
import { getExchangeRates } from '../services/exchangeRateService';

/**
 * Schedules Screen
 * Displays train schedules with offline support
 */
const SchedulesScreen = ({ navigation }) => {
  const [localCurrency, setLocalCurrency] = useState('ZMW');
  const [selectedClass, setSelectedClass] = useState('economy');
  const [isReturnTrip, setIsReturnTrip] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(EXCHANGE_RATES['ZMW'] || 27.5);

  // Detect user's local currency and fetch live rates
  useEffect(() => {
    const initializeCurrency = async () => {
      const currency = await detectLocalCurrency();
      setLocalCurrency(currency);
      
      try {
        const { rates } = await getExchangeRates();
        if (rates[currency]) {
          setExchangeRate(rates[currency]);
        }
      } catch (error) {
        console.warn('Failed to fetch exchange rates:', error);
      }
    };
    
    initializeCurrency();
  }, []);

  // Mock fetch function - replace with actual API call
  const fetchSchedules = async () => {
    // Simulate API call with real TAZARA/ZRL routes
    return [
      {
        id: 1,
        route: 'Kapiri Mposhi → Dar es Salaam',
        departure: '08:00 AM',
        arrival: '06:00 PM',
        status: 'On Time',
        train: 'TAZARA Express 101',
        duration: '10h',
        classes: ['economy', 'business', 'first']
      },
      {
        id: 2,
        route: 'Lusaka → Livingstone',
        departure: '10:30 AM',
        arrival: '04:30 PM',
        status: 'On Time',
        train: 'ZRL Express 202',
        duration: '6h',
        classes: ['economy', 'business']
      },
      {
        id: 3,
        route: 'Lusaka → Kitwe',
        departure: '12:00 PM',
        arrival: '06:00 PM',
        status: 'Delayed',
        train: 'ZRL Express 303',
        duration: '6h',
        classes: ['economy', 'business', 'first']
      },
      {
        id: 4,
        route: 'Nakonde → Dar es Salaam',
        departure: '03:00 PM',
        arrival: '11:00 PM',
        status: 'On Time',
        train: 'TAZARA Express 404',
        duration: '8h',
        classes: ['economy', 'business']
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

        {/* Route Options with Return Trip Toggle */}
        {schedules && schedules.length > 0 && (
          <View style={styles.routeOptionsCard}>
            <View style={styles.routeOptionsHeader}>
              <Text style={styles.routeOptionsTitle}>Trip Options</Text>
              
              {/* Return Trip Toggle */}
              <View style={styles.returnToggleContainer}>
                <Text style={styles.returnToggleLabel}>Return Trip</Text>
                <Switch
                  value={isReturnTrip}
                  onValueChange={setIsReturnTrip}
                  trackColor={{ false: '#334155', true: '#38bdf8' }}
                  thumbColor={isReturnTrip ? '#FFB800' : '#64748B'}
                  ios_backgroundColor="#334155"
                />
              </View>
            </View>
            
            {isReturnTrip && (
              <View style={styles.returnInfoBanner}>
                <Text style={styles.returnInfoText}>
                  ↩️ Return journey included • Prices shown are for round trip
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Class Selector */}
        {schedules && schedules.length > 0 && (
          <View style={styles.classSelector}>
            <Text style={styles.classSelectorLabel}>Ticket Class:</Text>
            <View style={styles.classButtons}>
              {['economy', 'business', 'first'].map((ticketClass) => (
                <TouchableOpacity
                  key={ticketClass}
                  style={[
                    styles.classButton,
                    selectedClass === ticketClass && styles.classButtonActive
                  ]}
                  onPress={() => setSelectedClass(ticketClass)}
                >
                  <Text style={[
                    styles.classButtonText,
                    selectedClass === ticketClass && styles.classButtonTextActive
                  ]}>
                    {ticketClass.charAt(0).toUpperCase() + ticketClass.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Schedules List */}
        {schedules && schedules.map((schedule) => {
          const basePriceUSD = getTicketPrice(schedule.route, selectedClass);
          const priceUSD = isReturnTrip ? basePriceUSD * 2 : basePriceUSD;
          const priceLocal = priceUSD * exchangeRate;
          const hasClass = schedule.classes.includes(selectedClass);

          return (
            <View key={schedule.id} style={styles.scheduleCard}>
              <View style={styles.scheduleHeader}>
                <Text style={styles.trainNumber}>{schedule.train}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(schedule.status) }]}>
                  <Text style={styles.statusText}>{schedule.status}</Text>
                </View>
              </View>

              <View style={styles.routeContainer}>
                <Text style={styles.route}>{schedule.route}</Text>
                {isReturnTrip && (
                  <Text style={styles.returnBadge}>⇄ Return</Text>
                )}
              </View>

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
                <View style={styles.timeBlock}>
                  <Text style={styles.timeLabel}>Duration</Text>
                  <Text style={styles.timeValue}>{schedule.duration}</Text>
                </View>
              </View>

              {/* Price Display - Local Currency Prominent */}
              {priceUSD && hasClass ? (
                <View style={styles.priceContainer}>
                  {/* Primary: Local Currency */}
                  <View style={styles.localPriceRow}>
                    <Text style={styles.localPrice}>
                      {getCurrencySymbol(localCurrency)}{priceLocal.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </Text>
                    <Text style={styles.localCurrencyCode}>{localCurrency}</Text>
                  </View>
                  
                  {/* Secondary: USD and AFC */}
                  <View style={styles.secondaryPriceRow}>
                    <Text style={styles.secondaryPrice}>${priceUSD.toFixed(2)} USD</Text>
                    <Text style={styles.priceSeparator}>•</Text>
                    <Text style={[styles.secondaryPrice, styles.afcPriceText]}>{priceUSD.toFixed(2)} AFC</Text>
                  </View>
                </View>
              ) : !hasClass ? (
                <View style={styles.unavailableContainer}>
                  <Text style={styles.unavailableText}>
                    {selectedClass.charAt(0).toUpperCase() + selectedClass.slice(1)} class not available
                  </Text>
                </View>
              ) : null}

              {/* Book Button */}
              {priceUSD && hasClass && (
                <TouchableOpacity 
                  style={styles.bookButton}
                  onPress={() => navigation.navigate('TicketBooking', { schedule, isReturnTrip })}
                >
                  <Text style={styles.bookButtonText}>
                    {isReturnTrip ? 'Book Return Trip' : 'Book Ticket'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

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
  classSelector: {
    backgroundColor: '#0f172a',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  classSelectorLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  classButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  classButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  classButtonActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  classButtonText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  classButtonTextActive: {
    color: '#020617',
    fontWeight: 'bold',
  },
  priceContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  unavailableContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  unavailableText: {
    color: '#64748B',
    fontSize: 12,
    fontStyle: 'italic',
  },
  bookButton: {
    marginTop: 15,
    backgroundColor: '#FFB800',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#020617',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default SchedulesScreen;
