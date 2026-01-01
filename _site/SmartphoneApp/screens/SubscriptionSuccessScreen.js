import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { subscriptionService } from '../services/subscriptionService';

const { width } = Dimensions.get('window');

/**
 * Success Screen for Subscription Activation
 * 
 * TAZARA-Proof Design:
 * - Works even if phone dies after PIN entry
 * - Webhook activates subscription in background
 * - Polls for status when user returns
 * - Shows success immediately when detected
 */
export default function SubscriptionSuccessScreen({ route, navigation }) {
  const { plan, transactionId } = route.params;
  
  const [status, setStatus] = useState('checking'); // checking, active, pending, failed
  const [subscription, setSubscription] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.5));
  const [checkCount, setCheckCount] = useState(0);

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    // Poll for subscription status
    checkSubscriptionStatus();
    
    // Poll every 3 seconds for up to 30 seconds
    const interval = setInterval(() => {
      setCheckCount(prev => prev + 1);
      checkSubscriptionStatus();
    }, 3000);

    // Stop polling after 30 seconds (10 checks)
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (status === 'checking') {
        setStatus('pending');
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      // Check if subscription is active
      const currentSub = await subscriptionService.getCurrentSubscription();
      
      if (currentSub && currentSub.status === 'active') {
        setSubscription(currentSub);
        setStatus('active');
        return;
      }

      // Check transaction status
      if (transactionId) {
        const txStatus = await subscriptionService.checkPaymentStatus(transactionId);
        
        if (txStatus.status === 'completed') {
          setStatus('active');
        } else if (txStatus.status === 'failed') {
          setStatus('failed');
        }
      }
    } catch (error) {
      console.error('Status check error:', error);
      // Don't set failed status on network errors
      // User might have spotty internet (TAZARA traders)
    }
  };

  const handleContinue = () => {
    if (status === 'active') {
      // Go to home screen to start booking
      navigation.navigate('Home');
    } else if (status === 'pending') {
      // Go to subscription management
      navigation.navigate('Subscription');
    } else if (status === 'failed') {
      // Go back to try again
      navigation.goBack();
    }
  };

  const handleCheckAgain = () => {
    setStatus('checking');
    setCheckCount(0);
    checkSubscriptionStatus();
  };

  // Render based on status
  if (status === 'checking') {
    return (
      <View style={styles.container}>
        <Animated.View 
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}
        >
          <View style={styles.iconContainer}>
            <Animated.View style={[styles.pulseCircle, { opacity: fadeAnim }]} />
            <Text style={styles.iconLarge}>⏳</Text>
          </View>
          
          <Text style={styles.title}>Activating Your Subscription</Text>
          <Text style={styles.subtitle}>
            Processing your payment...{'\n'}
            This usually takes a few seconds
          </Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  { width: `${Math.min((checkCount / 10) * 100, 90)}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {checkCount < 5 ? 'Confirming payment...' : 'Almost there...'}
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>💡</Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>TAZARA Trader Tip:</Text>{'\n'}
              Your subscription will activate even if your phone loses connection. 
              The payment is being processed in the background.
            </Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  if (status === 'active') {
    const expiryDate = subscription?.next_billing_date 
      ? new Date(subscription.next_billing_date).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      : 'N/A';

    return (
      <View style={styles.container}>
        <Animated.View 
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}
        >
          {/* Success Icon with Animation */}
          <View style={styles.successIconContainer}>
            <View style={styles.successCircle}>
              <Text style={styles.successIcon}>✅</Text>
            </View>
          </View>
          
          {/* Pro Badge - Gold/Holographic Effect */}
          <View style={styles.proBadgeContainer}>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeIcon}>👑</Text>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          </View>

          <Text style={styles.successTitle}>Welcome to {plan.name}!</Text>
          <Text style={styles.successSubtitle}>
            Your Sentinel subscription is now active until{'\n'}
            <Text style={styles.expiryDate}>{expiryDate}</Text>
          </Text>

          {/* Benefits Card - What They Unlocked */}
          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsTitle}>🎉 What You Just Unlocked</Text>
            
            <View style={styles.benefitsList}>
              {plan.id === 'sentinel_trader' && (
                <>
                  <View style={styles.benefitItem}>
                    <Text style={styles.benefitIcon}>💰</Text>
                    <Text style={styles.benefitText}>
                      <Text style={styles.benefitBold}>0% Convenience Fees</Text>{'\n'}
                      Save ZMW 15 on every booking
                    </Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Text style={styles.benefitIcon}>📦</Text>
                    <Text style={styles.benefitText}>
                      <Text style={styles.benefitBold}>Priority Luggage Tracking</Text>{'\n'}
                      Track your goods in real-time
                    </Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Text style={styles.benefitIcon}>🎫</Text>
                    <Text style={styles.benefitText}>
                      <Text style={styles.benefitBold}>Unlimited Bookings</Text>{'\n'}
                      Book as many trips as you need
                    </Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Text style={styles.benefitIcon}>📱</Text>
                    <Text style={styles.benefitText}>
                      <Text style={styles.benefitBold}>SMS Notifications</Text>{'\n'}
                      Get updates on your bookings
                    </Text>
                  </View>
                </>
              )}
              
              {plan.id === 'sentinel_commuter' && (
                <>
                  <View style={styles.benefitItem}>
                    <Text style={styles.benefitIcon}>⚡</Text>
                    <Text style={styles.benefitText}>
                      <Text style={styles.benefitBold}>Quick Scan QR Bypass</Text>{'\n'}
                      Skip the queue at stations
                    </Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Text style={styles.benefitIcon}>🎫</Text>
                    <Text style={styles.benefitText}>
                      <Text style={styles.benefitBold}>Unlimited Daily Trips</Text>{'\n'}
                      Perfect for daily commuters
                    </Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Text style={styles.benefitIcon}>🚀</Text>
                    <Text style={styles.benefitText}>
                      <Text style={styles.benefitBold}>Priority Boarding</Text>{'\n'}
                      Board first, every time
                    </Text>
                  </View>
                </>
              )}

              {plan.id === 'sentinel_voyager' && (
                <>
                  <View style={styles.benefitItem}>
                    <Text style={styles.benefitIcon}>🛋️</Text>
                    <Text style={styles.benefitText}>
                      <Text style={styles.benefitBold}>First Class Lounge Access</Text>{'\n'}
                      Relax in comfort before your journey
                    </Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Text style={styles.benefitIcon}>🌊</Text>
                    <Text style={styles.benefitText}>
                      <Text style={styles.benefitBold}>Victoria Falls Tour Discounts</Text>{'\n'}
                      Save on tours and activities
                    </Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Text style={styles.benefitIcon}>🛡️</Text>
                    <Text style={styles.benefitText}>
                      <Text style={styles.benefitBold}>Travel Insurance Included</Text>{'\n'}
                      Protected throughout your journey
                    </Text>
                  </View>
                </>
              )}
            </View>

            {subscription?.next_billing_date && (
              <View style={styles.billingInfo}>
                <Text style={styles.billingLabel}>Next billing:</Text>
                <Text style={styles.billingDate}>{expiryDate}</Text>
              </View>
            )}
          </View>

          {/* Pro Tip Box - TAZARA Specific */}
          <View style={styles.proTipBox}>
            <Text style={styles.proTipIcon}>💡</Text>
            <Text style={styles.proTipText}>
              <Text style={styles.proTipBold}>Pro Tip for TAZARA Traders:</Text>{'\n'}
              You can now book TAZARA tickets with zero convenience fees! 
              Your Pro status is recognized at all stations from Kapiri Mposhi to Dar es Salaam.
            </Text>
          </View>

          {/* Receipt Download Button */}
          <TouchableOpacity
            style={styles.receiptButton}
            onPress={() => handleDownloadReceipt()}
          >
            <Text style={styles.receiptIcon}>📄</Text>
            <Text style={styles.receiptButtonText}>Download Receipt (PDF)</Text>
          </TouchableOpacity>

          {/* Primary CTA */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Start Booking Now</Text>
          </TouchableOpacity>

          {/* Secondary Actions */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Subscription')}
          >
            <Text style={styles.secondaryButtonText}>View Subscription Details</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  const handleDownloadReceipt = async () => {
    try {
      // Generate and download receipt
      const receipt = await subscriptionService.generateReceipt(subscription.id);
      // TODO: Implement PDF download/share functionality
      console.log('Receipt generated:', receipt);
      alert('Receipt will be sent to your phone via SMS');
    } catch (error) {
      console.error('Receipt generation error:', error);
      alert('Unable to generate receipt. Please contact support.');
    }
  };

  if (status === 'pending') {
    return (
      <View style={styles.container}>
        <Animated.View 
          style={[
            styles.content,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.iconLarge}>⏰</Text>
          </View>
          
          <Text style={styles.title}>Payment Processing</Text>
          <Text style={styles.subtitle}>
            Your payment is being processed.{'\n'}
            This can take a few minutes.
          </Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>📱</Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>What's happening:</Text>{'\n'}
              • Your payment was received{'\n'}
              • Our system is activating your subscription{'\n'}
              • You'll receive an SMS when it's ready{'\n\n'}
              You can close this app and check back later.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleCheckAgain}
          >
            <Text style={styles.continueButtonText}>Check Status Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.secondaryButtonText}>Go to Home</Text>
          </TouchableOpacity>

          <Text style={styles.helpText}>
            Need help? Contact support: +260 XXX XXX XXX
          </Text>
        </Animated.View>
      </View>
    );
  }

  if (status === 'failed') {
    return (
      <View style={styles.container}>
        <Animated.View 
          style={[
            styles.content,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.iconLarge}>❌</Text>
          </View>
          
          <Text style={styles.title}>Payment Failed</Text>
          <Text style={styles.subtitle}>
            We couldn't process your payment.{'\n'}
            Please try again.
          </Text>

          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Common issues:</Text>
            <Text style={styles.errorText}>
              • Insufficient balance{'\n'}
              • Incorrect PIN entered{'\n'}
              • Network timeout{'\n'}
              • Payment cancelled
            </Text>
          </View>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.continueButtonText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.secondaryButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  pulseCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1E40AF',
    opacity: 0.1,
  },
  iconLarge: {
    fontSize: 80,
  },
  successIconContainer: {
    marginBottom: 30,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#059669',
  },
  successIcon: {
    fontSize: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#059669',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 26,
  },
  expiryDate: {
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  proBadgeContainer: {
    marginBottom: 20,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  proBadgeIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  proBadgeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#92400E',
    letterSpacing: 2,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 30,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1E40AF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  benefitsCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitsList: {
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    fontSize: 20,
    color: '#059669',
    marginRight: 12,
    fontWeight: 'bold',
  },
  benefitText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
    lineHeight: 22,
  },
  benefitBold: {
    fontWeight: 'bold',
    color: '#111827',
  },
  receiptButton: {
    width: '100%',
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  receiptIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  receiptButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  billingInfo: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billingLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  billingDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    flexDirection: 'row',
    borderLeftWidth: 4,
    borderLeftColor: '#1E40AF',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: 'bold',
  },
  proTipBox: {
    width: '100%',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  proTipIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  proTipText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  proTipBold: {
    fontWeight: 'bold',
  },
  errorBox: {
    width: '100%',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#991B1B',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#991B1B',
    lineHeight: 20,
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#1E40AF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 20,
  },
});
