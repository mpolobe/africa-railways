import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { subscriptionService } from '../services/subscriptionService';

const PAYMENT_METHODS = [
  {
    id: 'mtn_momo',
    name: 'MTN Mobile Money',
    icon: '📱',
    description: 'Most popular',
    color: '#FFCC00',
  },
  {
    id: 'airtel_money',
    name: 'Airtel Money',
    icon: '📱',
    description: 'Fast & secure',
    color: '#ED1C24',
  },
  {
    id: 'card',
    name: 'Visa/Mastercard',
    icon: '💳',
    description: 'International cards',
    color: '#1E40AF',
  },
];

export default function SubscriptionCheckoutScreen({ route, navigation }) {
  const { plan } = route.params;
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('mtn_momo');
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  const handlePhoneNumberChange = (text) => {
    const formatted = subscriptionService.formatPhoneNumber(text);
    setPhoneNumber(formatted);
    
    // Auto-detect network
    const network = subscriptionService.detectNetwork(formatted);
    if (network === 'mtn') {
      setSelectedPaymentMethod('mtn_momo');
    } else if (network === 'airtel') {
      setSelectedPaymentMethod('airtel_money');
    }
  };

  const handlePayment = async () => {
    // Validate phone number
    if (!subscriptionService.validatePhoneNumber(phoneNumber)) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid Zambian phone number');
      return;
    }

    setLoading(true);
    setPaymentStatus('initiating');

    try {
      const response = await subscriptionService.initiateSubscription(
        plan.id,
        selectedPaymentMethod,
        phoneNumber
      );

      setPaymentStatus('pending');
      
      Alert.alert(
        'Payment Initiated',
        'Check your phone for the payment prompt. Enter your PIN to complete the payment.',
        [
          {
            text: 'OK',
            onPress: () => pollPaymentStatus(response.transaction_id),
          },
        ]
      );
    } catch (error) {
      setLoading(false);
      setPaymentStatus('failed');
      Alert.alert('Payment Failed', error.message || 'Please try again');
    }
  };

  const pollPaymentStatus = async (transactionId) => {
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds

    const interval = setInterval(async () => {
      attempts++;

      try {
        const status = await subscriptionService.checkPaymentStatus(transactionId);

        if (status.status === 'completed') {
          clearInterval(interval);
          setLoading(false);
          setPaymentStatus('success');
          
          Alert.alert(
            '✅ Payment Successful',
            `Your ${plan.name} subscription is now active!`,
            [
              {
                text: 'View Subscription',
                onPress: () => navigation.navigate('Subscription'),
              },
            ]
          );
        } else if (status.status === 'failed') {
          clearInterval(interval);
          setLoading(false);
          setPaymentStatus('failed');
          Alert.alert('Payment Failed', 'Please try again or contact support');
        }
      } catch (error) {
        console.error('Status check error:', error);
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setLoading(false);
        setPaymentStatus('timeout');
        Alert.alert(
          'Payment Timeout',
          'Payment is taking longer than expected. Please check your subscription status.',
          [
            {
              text: 'Check Status',
              onPress: () => navigation.navigate('Subscription'),
            },
          ]
        );
      }
    }, 2000); // Check every 2 seconds
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Complete Payment</Text>
      </View>

      {/* Plan Summary */}
      <View style={styles.planSummary}>
        <View style={styles.planSummaryHeader}>
          <Text style={styles.planIcon}>{plan.icon}</Text>
          <View style={styles.planSummaryText}>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planDescription}>{plan.description}</Text>
          </View>
        </View>
        
        <View style={styles.priceBreakdown}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Plan Price</Text>
            <Text style={styles.priceValue}>ZMW {plan.price}</Text>
          </View>
          {plan.billingCycle !== 'one-time' && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Free Trial</Text>
              <Text style={styles.priceValueGreen}>30 days</Text>
            </View>
          )}
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Due Today</Text>
            <Text style={styles.totalValue}>ZMW 0.00</Text>
          </View>
          {plan.billingCycle !== 'one-time' && (
            <Text style={styles.billingNote}>
              You'll be charged ZMW {plan.price} on {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>

      {/* Payment Method Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Payment Method</Text>
        {PAYMENT_METHODS.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.paymentMethod,
              selectedPaymentMethod === method.id && styles.paymentMethodSelected,
            ]}
            onPress={() => setSelectedPaymentMethod(method.id)}
          >
            <Text style={styles.paymentIcon}>{method.icon}</Text>
            <View style={styles.paymentMethodText}>
              <Text style={styles.paymentMethodName}>{method.name}</Text>
              <Text style={styles.paymentMethodDescription}>{method.description}</Text>
            </View>
            <View style={styles.radioButton}>
              {selectedPaymentMethod === method.id && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Phone Number Input */}
      {selectedPaymentMethod !== 'card' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mobile Money Number</Text>
          <TextInput
            style={styles.input}
            placeholder="+260 97 123 4567"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={handlePhoneNumberChange}
            maxLength={13}
          />
          <Text style={styles.inputHint}>
            Enter your {selectedPaymentMethod === 'mtn_momo' ? 'MTN' : 'Airtel'} Mobile Money number
          </Text>
        </View>
      )}

      {/* Payment Status */}
      {paymentStatus && (
        <View style={styles.statusCard}>
          {paymentStatus === 'initiating' && (
            <>
              <ActivityIndicator size="large" color="#1E40AF" />
              <Text style={styles.statusText}>Initiating payment...</Text>
            </>
          )}
          {paymentStatus === 'pending' && (
            <>
              <ActivityIndicator size="large" color="#F59E0B" />
              <Text style={styles.statusText}>Waiting for approval...</Text>
              <Text style={styles.statusSubtext}>
                Check your phone and enter your PIN
              </Text>
            </>
          )}
          {paymentStatus === 'success' && (
            <>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.statusText}>Payment Successful!</Text>
            </>
          )}
          {paymentStatus === 'failed' && (
            <>
              <Text style={styles.errorIcon}>❌</Text>
              <Text style={styles.statusText}>Payment Failed</Text>
            </>
          )}
        </View>
      )}

      {/* Pay Button */}
      <TouchableOpacity
        style={[styles.payButton, loading && styles.payButtonDisabled]}
        onPress={handlePayment}
        disabled={loading || !phoneNumber}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.payButtonText}>
            {plan.billingCycle === 'one-time' ? 'Buy Pass' : 'Start Free Trial'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Terms */}
      <View style={styles.terms}>
        <Text style={styles.termsText}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
          {plan.billingCycle !== 'one-time' && ' You can cancel anytime.'}
        </Text>
      </View>

      {/* Security Badge */}
      <View style={styles.securityBadge}>
        <Text style={styles.securityText}>🔒 Secure payment powered by Flutterwave</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#1E40AF',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  planSummary: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  planIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  planSummaryText: {
    flex: 1,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  planDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  priceBreakdown: {
    marginTop: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  priceValueGreen: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  billingNote: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 12,
  },
  paymentMethodSelected: {
    borderColor: '#1E40AF',
    backgroundColor: '#EFF6FF',
  },
  paymentIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  paymentMethodText: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  paymentMethodDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1E40AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1E40AF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 12,
  },
  statusSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  successIcon: {
    fontSize: 48,
  },
  errorIcon: {
    fontSize: 48,
  },
  payButton: {
    backgroundColor: '#1E40AF',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  terms: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  termsText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  securityBadge: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  securityText: {
    fontSize: 12,
    color: '#6B7280',
  },
});
