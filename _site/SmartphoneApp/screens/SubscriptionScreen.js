import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { subscriptionService } from '../services/subscriptionService';

const PLANS = [
  {
    id: 'sentinel_trader',
    name: 'Sentinel Trader',
    price: 50,
    icon: '💼',
    description: 'For cross-border traders',
    features: [
      'Zero convenience fees',
      'Priority luggage tracking',
      'Unlimited bookings',
      'SMS notifications',
      'Save ZMW 130/month',
    ],
    savings: 130,
    targetAudience: 'Cross-border traders',
    badge: 'MOST POPULAR',
  },
  {
    id: 'sentinel_commuter',
    name: 'Sentinel Commuter',
    price: 120,
    icon: '🚌',
    description: 'For daily riders',
    features: [
      'Unlimited bookings',
      'Quick Scan QR bypass',
      'Priority boarding',
      'SMS notifications',
      'Save ZMW 250/month',
    ],
    savings: 250,
    targetAudience: 'Daily riders (Dar/Lusaka)',
    badge: 'BEST VALUE',
  },
  {
    id: 'sentinel_voyager',
    name: 'Sentinel Voyager',
    price: 250,
    icon: '✈️',
    description: 'For international tourists',
    billingCycle: 'one-time',
    features: [
      'First Class lounge access',
      'Victoria Falls tour discounts',
      'Travel insurance included',
      'Priority booking',
      'Concierge service',
    ],
    savings: 100,
    targetAudience: 'International tourists',
    badge: 'PREMIUM',
  },
];

export default function SubscriptionScreen({ navigation }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);

  useEffect(() => {
    loadCurrentSubscription();
  }, []);

  const loadCurrentSubscription = async () => {
    try {
      const subscription = await subscriptionService.getCurrentSubscription();
      setCurrentSubscription(subscription);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    }
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    navigation.navigate('SubscriptionCheckout', { plan });
  };

  const handleManageSubscription = () => {
    navigation.navigate('ManageSubscription', { subscription: currentSubscription });
  };

  if (currentSubscription?.status === 'active') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.activeSubscriptionCard}>
          <Text style={styles.activeTitle}>✅ Active Subscription</Text>
          <Text style={styles.activePlanName}>
            {PLANS.find(p => p.id === currentSubscription.plan_id)?.icon}{' '}
            {PLANS.find(p => p.id === currentSubscription.plan_id)?.name}
          </Text>
          <Text style={styles.activeDetail}>
            Next billing: {new Date(currentSubscription.next_billing_date).toLocaleDateString()}
          </Text>
          <Text style={styles.activeDetail}>
            Amount: ZMW {PLANS.find(p => p.id === currentSubscription.plan_id)?.price}
          </Text>
          
          <TouchableOpacity
            style={styles.manageButton}
            onPress={handleManageSubscription}
          >
            <Text style={styles.manageButtonText}>Manage Subscription</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>This Month</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentSubscription.bookings_count || 0}</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                ZMW {currentSubscription.savings || 0}
              </Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
          </View>
        </View>

        <View style={styles.upgradeSection}>
          <Text style={styles.sectionTitle}>Upgrade Your Plan</Text>
          {PLANS.filter(p => p.id !== currentSubscription.plan_id).map(renderPlanCard)}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Plan</Text>
        <Text style={styles.subtitle}>
          30-day free trial • Cancel anytime
        </Text>
      </View>

      {PLANS.map(renderPlanCard)}

      <View style={styles.payPerUseCard}>
        <Text style={styles.payPerUseTitle}>Pay Per Booking</Text>
        <Text style={styles.payPerUsePrice}>ZMW 15 per booking</Text>
        <Text style={styles.payPerUseDescription}>
          No commitment • Pay only when you book
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🔒 Secure payment with MTN & Airtel Money
        </Text>
      </View>
    </ScrollView>
  );

  function renderPlanCard(plan) {
    const isSelected = selectedPlan?.id === plan.id;
    
    return (
      <TouchableOpacity
        key={plan.id}
        style={[styles.planCard, isSelected && styles.planCardSelected]}
        onPress={() => handleSelectPlan(plan)}
      >
        {plan.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{plan.badge}</Text>
          </View>
        )}
        
        <View style={styles.planHeader}>
          <Text style={styles.planIcon}>{plan.icon}</Text>
          <View style={styles.planHeaderText}>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planDescription}>{plan.description}</Text>
          </View>
          <View style={styles.planPriceContainer}>
            <Text style={styles.planPrice}>ZMW {plan.price}</Text>
            <Text style={styles.planPeriod}>
              /{plan.billingCycle === 'one-time' ? 'pass' : 'month'}
            </Text>
          </View>
        </View>

        <View style={styles.planFeatures}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.planFooter}>
          <Text style={styles.targetAudience}>
            Perfect for: {plan.targetAudience}
          </Text>
          {plan.savings > 0 && (
            <Text style={styles.savingsText}>
              💰 Save up to ZMW {plan.savings}/month
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => handleSelectPlan(plan)}
        >
          <Text style={styles.selectButtonText}>
            {plan.billingCycle === 'one-time' ? 'Buy Pass' : 'Subscribe Now'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E7FF',
  },
  planCard: {
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
  planCardSelected: {
    borderWidth: 2,
    borderColor: '#1E40AF',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  planHeaderText: {
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
  planPriceContainer: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  planPeriod: {
    fontSize: 14,
    color: '#6B7280',
  },
  planFeatures: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    fontSize: 16,
    color: '#059669',
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
  },
  planFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginBottom: 16,
  },
  targetAudience: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  savingsText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginTop: 8,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  selectButton: {
    backgroundColor: '#1E40AF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  payPerUseCard: {
    backgroundColor: '#F3F4F6',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  payPerUseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  payPerUsePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 8,
  },
  payPerUseDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  activeSubscriptionCard: {
    backgroundColor: '#ECFDF5',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#059669',
  },
  activeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 12,
  },
  activePlanName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  activeDetail: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  manageButton: {
    backgroundColor: '#1E40AF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  manageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statsCard: {
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
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  upgradeSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 16,
    marginBottom: 8,
  },
});
