import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import MultiCurrencyPrice from '../components/MultiCurrencyPrice';
import { 
  getAllPrices, 
  detectLocalCurrency, 
  SAMPLE_TICKET_PRICES,
  getCurrencyName 
} from '../utils/currencyConverter';

/**
 * Ticket Booking Screen
 * Demonstrates multi-currency pricing (USD, Local Currency, AFC)
 */
const TicketBookingScreen = ({ route, navigation }) => {
  const { schedule } = route?.params || {};
  
  const [localCurrency, setLocalCurrency] = useState('ZMW');
  const [selectedClass, setSelectedClass] = useState('economy');
  const [paymentMethod, setPaymentMethod] = useState('afc');

  // Detect user's local currency
  useEffect(() => {
    detectLocalCurrency().then(setLocalCurrency);
  }, []);

  // Default schedule if none provided
  const defaultSchedule = {
    route: 'Kapiri Mposhi → Dar es Salaam',
    train: 'TAZARA Express 101',
    departure: '08:00 AM',
    arrival: '06:00 PM',
    date: new Date().toLocaleDateString(),
    duration: '10h',
  };

  const currentSchedule = schedule || defaultSchedule;
  
  // Get prices for selected class
  const routePrices = SAMPLE_TICKET_PRICES[currentSchedule.route] || {
    economy: 25,
    business: 45,
    first: 75,
  };

  const priceUSD = routePrices[selectedClass];
  const prices = getAllPrices(priceUSD, localCurrency);

  const handleBooking = () => {
    const paymentAmounts = {
      afc: `${prices.afc.toFixed(2)} AFC`,
      local: `${prices.local.toFixed(0)} ${localCurrency}`,
      usd: `$${prices.usd.toFixed(2)} USD`,
    };

    Alert.alert(
      'Booking Confirmed',
      `Your ticket has been booked!\n\nRoute: ${currentSchedule.route}\nClass: ${selectedClass.toUpperCase()}\nPayment: ${paymentAmounts[paymentMethod]}\n\nA confirmation will be sent to your wallet.`,
      [
        { text: 'View Ticket', onPress: () => navigation.navigate('Home') },
        { text: 'OK' }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Book Your Ticket</Text>
        <Text style={styles.headerSubtitle}>Multi-Currency Payment Options</Text>
      </View>

      {/* Route Information */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Journey Details</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Route</Text>
          <Text style={styles.infoValue}>{currentSchedule.route}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Train</Text>
          <Text style={styles.infoValue}>{currentSchedule.train}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date</Text>
          <Text style={styles.infoValue}>{currentSchedule.date}</Text>
        </View>

        <View style={styles.timeRow}>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Departure</Text>
            <Text style={styles.timeValue}>{currentSchedule.departure}</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Arrival</Text>
            <Text style={styles.timeValue}>{currentSchedule.arrival}</Text>
          </View>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Duration</Text>
            <Text style={styles.timeValue}>{currentSchedule.duration}</Text>
          </View>
        </View>
      </View>

      {/* Class Selection */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Select Class</Text>
        
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
              <Text style={[
                styles.classPrice,
                selectedClass === ticketClass && styles.classPriceActive
              ]}>
                ${routePrices[ticketClass]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Price Display */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ticket Price</Text>
        
        <View style={styles.priceDisplay}>
          <MultiCurrencyPrice
            priceUSD={priceUSD}
            localCurrency={localCurrency}
            size="large"
            showLabels={true}
          />
        </View>

        <View style={styles.priceInfo}>
          <Text style={styles.priceInfoText}>
            💡 Pay with any currency - prices are equivalent
          </Text>
        </View>
      </View>

      {/* Payment Method Selection */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment Method</Text>
        
        <TouchableOpacity
          style={[
            styles.paymentOption,
            paymentMethod === 'afc' && styles.paymentOptionActive
          ]}
          onPress={() => setPaymentMethod('afc')}
        >
          <View style={styles.paymentOptionHeader}>
            <Text style={[
              styles.paymentOptionTitle,
              paymentMethod === 'afc' && styles.paymentOptionTitleActive
            ]}>
              Africoin (AFC)
            </Text>
            <View style={[
              styles.radio,
              paymentMethod === 'afc' && styles.radioActive
            ]} />
          </View>
          <Text style={styles.paymentOptionPrice}>
            {prices.afc.toFixed(2)} AFC
          </Text>
          <Text style={styles.paymentOptionDescription}>
            ⚡ Instant • No fees • Blockchain verified
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.paymentOption,
            paymentMethod === 'local' && styles.paymentOptionActive
          ]}
          onPress={() => setPaymentMethod('local')}
        >
          <View style={styles.paymentOptionHeader}>
            <Text style={[
              styles.paymentOptionTitle,
              paymentMethod === 'local' && styles.paymentOptionTitleActive
            ]}>
              {getCurrencyName(localCurrency)}
            </Text>
            <View style={[
              styles.radio,
              paymentMethod === 'local' && styles.radioActive
            ]} />
          </View>
          <Text style={styles.paymentOptionPrice}>
            {prices.local.toFixed(0)} {localCurrency}
          </Text>
          <Text style={styles.paymentOptionDescription}>
            💳 Mobile Money • Bank Transfer • Cash
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.paymentOption,
            paymentMethod === 'usd' && styles.paymentOptionActive
          ]}
          onPress={() => setPaymentMethod('usd')}
        >
          <View style={styles.paymentOptionHeader}>
            <Text style={[
              styles.paymentOptionTitle,
              paymentMethod === 'usd' && styles.paymentOptionTitleActive
            ]}>
              US Dollar
            </Text>
            <View style={[
              styles.radio,
              paymentMethod === 'usd' && styles.radioActive
            ]} />
          </View>
          <Text style={styles.paymentOptionPrice}>
            ${prices.usd.toFixed(2)} USD
          </Text>
          <Text style={styles.paymentOptionDescription}>
            💵 International cards • PayPal • Wire transfer
          </Text>
        </TouchableOpacity>
      </View>

      {/* Book Button */}
      <TouchableOpacity style={styles.bookButton} onPress={handleBooking}>
        <Text style={styles.bookButtonText}>Confirm Booking</Text>
      </TouchableOpacity>

      {/* Info Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🔒 Secure payment • 💯 Full refund if cancelled 24h before departure
        </Text>
      </View>
    </ScrollView>
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
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    color: '#F1F5F9',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerSubtitle: {
    color: '#64748B',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardTitle: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    color: '#64748B',
    fontSize: 14,
  },
  infoValue: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  timeBlock: {
    flex: 1,
  },
  timeLabel: {
    color: '#64748B',
    fontSize: 11,
    marginBottom: 5,
  },
  timeValue: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: 'bold',
  },
  arrow: {
    color: '#38bdf8',
    fontSize: 20,
    marginHorizontal: 5,
  },
  classButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  classButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center',
  },
  classButtonActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  classButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  classButtonTextActive: {
    color: '#020617',
    fontWeight: 'bold',
  },
  classPrice: {
    color: '#64748B',
    fontSize: 12,
  },
  classPriceActive: {
    color: '#020617',
    fontWeight: 'bold',
  },
  priceDisplay: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  priceInfo: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
  },
  priceInfoText: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
  },
  paymentOption: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#334155',
    marginBottom: 10,
  },
  paymentOptionActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: '#38bdf8',
  },
  paymentOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentOptionTitle: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentOptionTitleActive: {
    color: '#38bdf8',
  },
  paymentOptionPrice: {
    color: '#FFB800',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  paymentOptionDescription: {
    color: '#64748B',
    fontSize: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#334155',
  },
  radioActive: {
    borderColor: '#38bdf8',
    backgroundColor: '#38bdf8',
  },
  bookButton: {
    backgroundColor: '#FFB800',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  bookButtonText: {
    color: '#020617',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    padding: 15,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    marginBottom: 20,
  },
  footerText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default TicketBookingScreen;
