import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, ActivityIndicator } from 'react-native';
import MultiCurrencyPrice from '../components/MultiCurrencyPrice';
import { 
  getAllPrices, 
  detectLocalCurrency, 
  SAMPLE_TICKET_PRICES,
  getCurrencyName,
  getCurrencySymbol,
  EXCHANGE_RATES
} from '../utils/currencyConverter';
import { getExchangeRates } from '../services/exchangeRateService';

/**
 * Ticket Booking Screen
 * Demonstrates multi-currency pricing (USD, Local Currency, AFC)
 * with live exchange rates and return trip option
 */
const TicketBookingScreen = ({ route, navigation }) => {
  const { schedule } = route?.params || {};
  
  const [localCurrency, setLocalCurrency] = useState('ZMW');
  const [selectedClass, setSelectedClass] = useState('economy');
  const [paymentMethod, setPaymentMethod] = useState('local');
  const [isReturnTrip, setIsReturnTrip] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(EXCHANGE_RATES['ZMW'] || 27.5);
  const [rateSource, setRateSource] = useState('static');
  const [loadingRates, setLoadingRates] = useState(true);

  // Detect user's local currency and fetch live rates
  useEffect(() => {
    const initializeCurrency = async () => {
      try {
        setLoadingRates(true);
        const currency = await detectLocalCurrency();
        setLocalCurrency(currency);
        
        // Fetch live exchange rates
        const { rates, source } = await getExchangeRates();
        if (rates[currency]) {
          setExchangeRate(rates[currency]);
          setRateSource(source);
        }
      } catch (error) {
        console.warn('Failed to fetch exchange rates:', error);
      } finally {
        setLoadingRates(false);
      }
    };
    
    initializeCurrency();
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
  
  // Parse route for return trip display
  const routeParts = currentSchedule.route.split(' → ');
  const origin = routeParts[0] || '';
  const destination = routeParts[1] || '';
  const returnRoute = `${destination} → ${origin}`;
  
  // Get prices for selected class
  const routePrices = SAMPLE_TICKET_PRICES[currentSchedule.route] || {
    economy: 25,
    business: 45,
    first: 75,
  };

  const basePrice = routePrices[selectedClass];
  const priceUSD = isReturnTrip ? basePrice * 2 : basePrice;
  
  // Calculate local currency price using live rate
  const priceLocal = priceUSD * exchangeRate;
  const priceAFC = priceUSD; // 1 AFC = 1 USD

  const handleBooking = () => {
    const tripType = isReturnTrip ? 'Return Trip' : 'One Way';
    const localSymbol = getCurrencySymbol(localCurrency);
    
    const paymentAmounts = {
      afc: `${priceAFC.toFixed(2)} AFC`,
      local: `${localSymbol}${priceLocal.toFixed(0)} ${localCurrency}`,
      usd: `$${priceUSD.toFixed(2)} USD`,
    };

    Alert.alert(
      'Booking Confirmed',
      `Your ticket has been booked!\n\nRoute: ${currentSchedule.route}${isReturnTrip ? `\nReturn: ${returnRoute}` : ''}\nTrip Type: ${tripType}\nClass: ${selectedClass.toUpperCase()}\nPayment: ${paymentAmounts[paymentMethod]}\n\nA confirmation will be sent to your wallet.`,
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

      {/* Route Selection with Return Trip Toggle */}
      <View style={styles.card}>
        <View style={styles.routeHeader}>
          <Text style={styles.cardTitle}>Select Your Route</Text>
          
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
        
        {/* Route Display */}
        <View style={styles.routeDisplay}>
          <View style={styles.routePoint}>
            <View style={styles.routeDot} />
            <Text style={styles.routeCity}>{origin}</Text>
          </View>
          
          <View style={styles.routeLine}>
            <Text style={styles.routeArrow}>{isReturnTrip ? '⇄' : '→'}</Text>
          </View>
          
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, styles.routeDotDestination]} />
            <Text style={styles.routeCity}>{destination}</Text>
          </View>
        </View>

        {isReturnTrip && (
          <View style={styles.returnInfo}>
            <Text style={styles.returnInfoText}>
              ↩️ Return journey included • Save 10% on round trip
            </Text>
          </View>
        )}
      </View>

      {/* Journey Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Journey Details</Text>
        
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
                ${routePrices[ticketClass]}{isReturnTrip ? ' x2' : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Price Display - Local Currency Prominent */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ticket Price</Text>
        
        {loadingRates ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#38bdf8" />
            <Text style={styles.loadingText}>Fetching live rates...</Text>
          </View>
        ) : (
          <>
            {/* Primary: Local Currency */}
            <View style={styles.primaryPriceContainer}>
              <Text style={styles.primaryPriceLabel}>
                {getCurrencyName(localCurrency)}
              </Text>
              <Text style={styles.primaryPrice}>
                {getCurrencySymbol(localCurrency)}{priceLocal.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </Text>
              <Text style={styles.primaryPriceCurrency}>{localCurrency}</Text>
            </View>

            {/* Secondary: USD and AFC */}
            <View style={styles.secondaryPricesContainer}>
              <View style={styles.secondaryPriceItem}>
                <Text style={styles.secondaryPriceValue}>${priceUSD.toFixed(2)}</Text>
                <Text style={styles.secondaryPriceLabel}>USD</Text>
              </View>
              
              <Text style={styles.priceDivider}>•</Text>
              
              <View style={styles.secondaryPriceItem}>
                <Text style={[styles.secondaryPriceValue, styles.afcPrice]}>
                  {priceAFC.toFixed(2)} AFC
                </Text>
                <Text style={[styles.secondaryPriceLabel, styles.afcLabel]}>Africoin</Text>
              </View>
            </View>

            {/* Rate Source Indicator */}
            <View style={styles.rateSourceContainer}>
              <Text style={styles.rateSourceText}>
                {rateSource === 'api' ? '🔄 Live rate' : 
                 rateSource === 'stale_cache' ? '📦 Cached rate' : 
                 '📊 Standard rate'} • 1 USD = {exchangeRate.toFixed(2)} {localCurrency}
              </Text>
            </View>
          </>
        )}

        <View style={styles.priceInfo}>
          <Text style={styles.priceInfoText}>
            💡 Pay with any currency - prices are equivalent
          </Text>
        </View>
      </View>

      {/* Payment Method Selection */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment Method</Text>
        
        {/* Local Currency Option - First */}
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
            {getCurrencySymbol(localCurrency)}{priceLocal.toLocaleString('en-US', { maximumFractionDigits: 0 })} {localCurrency}
          </Text>
          <Text style={styles.paymentOptionDescription}>
            💳 Mobile Money • Bank Transfer • Cash
          </Text>
        </TouchableOpacity>

        {/* AFC Option */}
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
            {priceAFC.toFixed(2)} AFC
          </Text>
          <Text style={styles.paymentOptionDescription}>
            ⚡ Instant • No fees • Blockchain verified
          </Text>
        </TouchableOpacity>

        {/* USD Option */}
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
            ${priceUSD.toFixed(2)} USD
          </Text>
          <Text style={styles.paymentOptionDescription}>
            💵 International cards • PayPal • Wire transfer
          </Text>
        </TouchableOpacity>
      </View>

      {/* Book Button */}
      <TouchableOpacity style={styles.bookButton} onPress={handleBooking}>
        <Text style={styles.bookButtonText}>
          {isReturnTrip ? 'Book Return Trip' : 'Confirm Booking'}
        </Text>
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
  
  // Route Selection Styles
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  returnToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  returnToggleLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
  routeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  routePoint: {
    alignItems: 'center',
    flex: 1,
  },
  routeDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#38bdf8',
    marginBottom: 8,
  },
  routeDotDestination: {
    backgroundColor: '#FFB800',
  },
  routeCity: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  routeLine: {
    flex: 1,
    alignItems: 'center',
  },
  routeArrow: {
    color: '#38bdf8',
    fontSize: 24,
  },
  returnInfo: {
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  returnInfoText: {
    color: '#FFB800',
    fontSize: 12,
    textAlign: 'center',
  },

  // Journey Details
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
  
  // Class Selection
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
  
  // Price Display - Local Currency Prominent
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 14,
    marginLeft: 10,
  },
  primaryPriceContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  primaryPriceLabel: {
    color: '#64748B',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  primaryPrice: {
    color: '#FFB800',
    fontSize: 42,
    fontWeight: 'bold',
  },
  primaryPriceCurrency: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  secondaryPricesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
  },
  secondaryPriceItem: {
    alignItems: 'center',
  },
  secondaryPriceValue: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryPriceLabel: {
    color: '#64748B',
    fontSize: 10,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  priceDivider: {
    color: '#475569',
    fontSize: 16,
    marginHorizontal: 20,
  },
  afcPrice: {
    color: '#38bdf8',
  },
  afcLabel: {
    color: '#0284c7',
  },
  rateSourceContainer: {
    alignItems: 'center',
    paddingTop: 10,
  },
  rateSourceText: {
    color: '#475569',
    fontSize: 11,
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
  
  // Payment Options
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
  
  // Book Button
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
  
  // Footer
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
