import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { calculateFare, getStation } from '../services/fareCalculatorService';
import { STATIONS } from '../data/stations';

/**
 * Fare Calculator Screen
 * Station-to-station fare calculation with options
 */
const FareCalculatorScreen = ({ navigation }) => {
  const [fromStation, setFromStation] = useState('');
  const [toStation, setToStation] = useState('');
  const [ticketClass, setTicketClass] = useState('economy');
  const [passengers, setPassengers] = useState(1);
  const [isReturn, setIsReturn] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [isSenior, setIsSenior] = useState(false);
  const [travelDate, setTravelDate] = useState(new Date());
  const [fareResult, setFareResult] = useState(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const ticketClasses = [
    { id: 'economy', name: 'Economy', icon: '🪑' },
    { id: 'business', name: 'Business', icon: '💼' },
    { id: 'first', name: 'First Class', icon: '👑' },
  ];

  const calculateFareHandler = () => {
    if (!fromStation || !toStation) {
      Alert.alert('Error', 'Please select both origin and destination stations');
      return;
    }

    try {
      const result = calculateFare(fromStation, toStation, {
        ticketClass,
        passengers,
        isReturn,
        isStudent,
        isSenior,
        travelDate,
      });
      setFareResult(result);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const swapStations = () => {
    const temp = fromStation;
    setFromStation(toStation);
    setToStation(temp);
    setFareResult(null);
  };

  const filteredStations = STATIONS.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStationPicker = (isFrom) => {
    const show = isFrom ? showFromPicker : showToPicker;
    if (!show) return null;

    return (
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>
              Select {isFrom ? 'Origin' : 'Destination'}
            </Text>
            <TouchableOpacity
              onPress={() => isFrom ? setShowFromPicker(false) : setShowToPicker(false)}
            >
              <Text style={styles.pickerClose}>×</Text>
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.searchInput}
            placeholder="Search stations..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          
          <ScrollView style={styles.stationList}>
            {filteredStations.map((station) => (
              <TouchableOpacity
                key={station.id}
                style={styles.stationItem}
                onPress={() => {
                  if (isFrom) {
                    setFromStation(station.city);
                    setShowFromPicker(false);
                  } else {
                    setToStation(station.city);
                    setShowToPicker(false);
                  }
                  setSearchQuery('');
                  setFareResult(null);
                }}
              >
                <Text style={styles.stationName}>{station.name}</Text>
                <Text style={styles.stationLocation}>
                  {station.city}, {station.country}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Fare Calculator</Text>
          <Text style={styles.subtitle}>Calculate your journey cost</Text>
        </View>

        {/* Station Selection */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Route</Text>
          
          <TouchableOpacity
            style={styles.stationSelector}
            onPress={() => setShowFromPicker(true)}
          >
            <Text style={styles.stationLabel}>From</Text>
            <Text style={[styles.stationValue, !fromStation && styles.placeholder]}>
              {fromStation || 'Select origin station'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.swapButton} onPress={swapStations}>
            <Text style={styles.swapIcon}>⇅</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.stationSelector}
            onPress={() => setShowToPicker(true)}
          >
            <Text style={styles.stationLabel}>To</Text>
            <Text style={[styles.stationValue, !toStation && styles.placeholder]}>
              {toStation || 'Select destination station'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Class Selection */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ticket Class</Text>
          <View style={styles.classContainer}>
            {ticketClasses.map((cls) => (
              <TouchableOpacity
                key={cls.id}
                style={[
                  styles.classButton,
                  ticketClass === cls.id && styles.classButtonActive,
                ]}
                onPress={() => {
                  setTicketClass(cls.id);
                  setFareResult(null);
                }}
              >
                <Text style={styles.classIcon}>{cls.icon}</Text>
                <Text
                  style={[
                    styles.className,
                    ticketClass === cls.id && styles.classNameActive,
                  ]}
                >
                  {cls.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Passengers */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Passengers</Text>
          <View style={styles.passengerContainer}>
            <TouchableOpacity
              style={styles.passengerButton}
              onPress={() => {
                if (passengers > 1) {
                  setPassengers(passengers - 1);
                  setFareResult(null);
                }
              }}
            >
              <Text style={styles.passengerButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.passengerCount}>{passengers}</Text>
            <TouchableOpacity
              style={styles.passengerButton}
              onPress={() => {
                if (passengers < 10) {
                  setPassengers(passengers + 1);
                  setFareResult(null);
                }
              }}
            >
              <Text style={styles.passengerButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Options */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Options</Text>
          
          <View style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <Text style={styles.optionLabel}>Return Trip</Text>
              <Text style={styles.optionDescription}>10% discount on return</Text>
            </View>
            <Switch
              value={isReturn}
              onValueChange={(value) => {
                setIsReturn(value);
                setFareResult(null);
              }}
              trackColor={{ false: '#1E293B', true: '#3B82F6' }}
              thumbColor={isReturn ? '#FFFFFF' : '#64748B'}
            />
          </View>

          <View style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <Text style={styles.optionLabel}>Student Discount</Text>
              <Text style={styles.optionDescription}>30% off with valid ID</Text>
            </View>
            <Switch
              value={isStudent}
              onValueChange={(value) => {
                setIsStudent(value);
                if (value) setIsSenior(false);
                setFareResult(null);
              }}
              trackColor={{ false: '#1E293B', true: '#3B82F6' }}
              thumbColor={isStudent ? '#FFFFFF' : '#64748B'}
            />
          </View>

          <View style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <Text style={styles.optionLabel}>Senior Discount</Text>
              <Text style={styles.optionDescription}>20% off for 60+</Text>
            </View>
            <Switch
              value={isSenior}
              onValueChange={(value) => {
                setIsSenior(value);
                if (value) setIsStudent(false);
                setFareResult(null);
              }}
              trackColor={{ false: '#1E293B', true: '#3B82F6' }}
              thumbColor={isSenior ? '#FFFFFF' : '#64748B'}
            />
          </View>
        </View>

        {/* Calculate Button */}
        <TouchableOpacity
          style={styles.calculateButton}
          onPress={calculateFareHandler}
        >
          <Text style={styles.calculateButtonText}>Calculate Fare</Text>
        </TouchableOpacity>

        {/* Results */}
        {fareResult && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Fare Breakdown</Text>
            
            <View style={styles.routeInfo}>
              <Text style={styles.routeText}>
                {fareResult.from.city} → {fareResult.to.city}
              </Text>
              <Text style={styles.routeDetails}>
                {fareResult.distance} km • {fareResult.estimatedDuration.formatted}
              </Text>
            </View>

            <View style={styles.fareBreakdown}>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Base Fare ({ticketClass})</Text>
                <Text style={styles.fareValue}>
                  ${fareResult.pricing.baseFare.toFixed(2)}
                </Text>
              </View>

              {fareResult.pricing.modifiers.map((mod, index) => (
                <View key={index} style={styles.fareRow}>
                  <Text style={styles.fareLabel}>{mod.name}</Text>
                  <Text
                    style={[
                      styles.fareValue,
                      mod.amount < 0 && styles.fareDiscount,
                    ]}
                  >
                    {mod.amount >= 0 ? '+' : ''}${mod.amount.toFixed(2)}
                  </Text>
                </View>
              ))}

              {isReturn && (
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Return Trip (10% off)</Text>
                  <Text style={styles.fareValue}>
                    ${fareResult.pricing.returnFare.toFixed(2)}
                  </Text>
                </View>
              )}

              {passengers > 1 && (
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>× {passengers} passengers</Text>
                  <Text style={styles.fareValue}></Text>
                </View>
              )}

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  ${fareResult.pricing.totalFare.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Pricing notes */}
            <View style={styles.notesContainer}>
              {fareResult.isPeakHour && (
                <Text style={styles.noteText}>⚡ Peak hour pricing applied</Text>
              )}
              {fareResult.isWeekend && (
                <Text style={styles.noteText}>🎉 Weekend discount applied</Text>
              )}
            </View>

            {/* Book Now Button */}
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => navigation.navigate('TicketBooking', {
                from: fareResult.from.city,
                to: fareResult.to.city,
                ticketClass,
                passengers,
                isReturn,
                fare: fareResult.pricing.totalFare,
              })}
            >
              <Text style={styles.bookButtonText}>Book This Journey</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Station Pickers */}
      {renderStationPicker(true)}
      {renderStationPicker(false)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F1F5F9',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 12,
  },
  stationSelector: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  stationLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  stationValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  placeholder: {
    color: '#64748B',
  },
  swapButton: {
    alignSelf: 'center',
    backgroundColor: '#3B82F6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  swapIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  classContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  classButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  classButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  classIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  className: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  classNameActive: {
    color: '#3B82F6',
  },
  passengerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerButton: {
    backgroundColor: '#1E293B',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passengerButtonText: {
    fontSize: 24,
    color: '#F1F5F9',
    fontWeight: 'bold',
  },
  passengerCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F1F5F9',
    marginHorizontal: 32,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    color: '#F1F5F9',
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  calculateButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  calculateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  resultCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F1F5F9',
    marginBottom: 16,
  },
  routeInfo: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  routeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#38BDF8',
  },
  routeDetails: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  fareBreakdown: {
    marginBottom: 16,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  fareLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  fareValue: {
    fontSize: 14,
    color: '#F1F5F9',
    fontWeight: '500',
  },
  fareDiscount: {
    color: '#10B981',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F1F5F9',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  notesContainer: {
    marginBottom: 16,
  },
  noteText: {
    fontSize: 12,
    color: '#F59E0B',
    marginBottom: 4,
  },
  bookButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // Picker styles
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  pickerContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F1F5F9',
  },
  pickerClose: {
    fontSize: 28,
    color: '#94A3B8',
  },
  searchInput: {
    backgroundColor: '#1E293B',
    margin: 16,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#F1F5F9',
  },
  stationList: {
    maxHeight: 400,
  },
  stationItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  stationLocation: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
});

export default FareCalculatorScreen;
