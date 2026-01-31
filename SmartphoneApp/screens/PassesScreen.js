import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  PASS_CATALOG,
  PASS_TYPES,
  getActivePasses,
  purchasePass,
  getPassSummary,
} from '../services/passService';
import { getWalletBalance, hasSufficientBalance } from '../services/walletService';

/**
 * Passes Screen
 * Browse and purchase weekly/monthly travel passes
 */
const PassesScreen = ({ navigation }) => {
  const [activePasses, setActivePasses] = useState([]);
  const [walletBalance, setWalletBalance] = useState(null);
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [passes, balance] = await Promise.all([
        getActivePasses(),
        getWalletBalance(),
      ]);
      setActivePasses(passes);
      setWalletBalance(balance);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pass) => {
    const hasBalance = await hasSufficientBalance(pass.price);
    
    if (!hasBalance) {
      Alert.alert(
        'Insufficient Balance',
        `You need $${pass.price.toFixed(2)} to purchase this pass. Your current balance is ${walletBalance?.formatted || '$0.00'}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Top Up', onPress: () => navigation.navigate('Wallet') },
        ]
      );
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `Purchase ${pass.name} for $${pass.price.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            setPurchasing(pass.id);
            try {
              await purchasePass(pass.id, 'wallet');
              Alert.alert('Success', `${pass.name} activated!`);
              loadData();
            } catch (error) {
              Alert.alert('Error', error.message);
            } finally {
              setPurchasing(null);
            }
          },
        },
      ]
    );
  };

  const filterTypes = [
    { id: 'all', name: 'All' },
    { id: PASS_TYPES.WEEKLY, name: 'Weekly' },
    { id: PASS_TYPES.MONTHLY, name: 'Monthly' },
  ];

  const filteredPasses = selectedType === 'all'
    ? PASS_CATALOG
    : PASS_CATALOG.filter(p => p.type === selectedType);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Travel Passes</Text>
          <Text style={styles.subtitle}>Save more with weekly & monthly passes</Text>
        </View>

        {/* Wallet Balance */}
        <TouchableOpacity
          style={styles.walletCard}
          onPress={() => navigation.navigate('Wallet')}
        >
          <Text style={styles.walletLabel}>Wallet Balance</Text>
          <Text style={styles.walletBalance}>{walletBalance?.formatted || '$0.00'}</Text>
          <Text style={styles.walletAction}>Tap to top up →</Text>
        </TouchableOpacity>

        {/* Active Passes */}
        {activePasses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Active Passes</Text>
            {activePasses.map((pass) => (
              <View key={pass.id} style={styles.activePassCard}>
                <View style={styles.activePassHeader}>
                  <Text style={styles.activePassName}>{pass.name}</Text>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>ACTIVE</Text>
                  </View>
                </View>
                <View style={styles.activePassStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {pass.tripsRemaining === 'unlimited' ? '∞' : pass.tripsRemaining}
                    </Text>
                    <Text style={styles.statLabel}>Trips Left</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {Math.ceil((new Date(pass.expiresAt) - new Date()) / (24 * 60 * 60 * 1000))}
                    </Text>
                    <Text style={styles.statLabel}>Days Left</Text>
                  </View>
                </View>
                <Text style={styles.expiryText}>
                  Expires: {new Date(pass.expiresAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {filterTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.filterTab,
                selectedType === type.id && styles.filterTabActive,
              ]}
              onPress={() => setSelectedType(type.id)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedType === type.id && styles.filterTabTextActive,
                ]}
              >
                {type.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pass Catalog */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Passes</Text>
          
          {filteredPasses.map((pass) => (
            <View key={pass.id} style={styles.passCard}>
              {/* Badges */}
              {pass.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </View>
              )}
              {pass.bestValue && (
                <View style={[styles.popularBadge, styles.bestValueBadge]}>
                  <Text style={styles.popularBadgeText}>BEST VALUE</Text>
                </View>
              )}
              {pass.studentOnly && (
                <View style={[styles.popularBadge, styles.studentBadge]}>
                  <Text style={styles.popularBadgeText}>STUDENTS ONLY</Text>
                </View>
              )}

              {/* Pass Header */}
              <View style={styles.passHeader}>
                <View>
                  <Text style={styles.passName}>{pass.name}</Text>
                  <Text style={styles.passDuration}>
                    {pass.duration} days • {pass.type}
                  </Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.passPrice}>${pass.price}</Text>
                  <Text style={styles.pricePeriod}>
                    /{pass.type === PASS_TYPES.WEEKLY ? 'week' : 'month'}
                  </Text>
                </View>
              </View>

              {/* Features */}
              <View style={styles.featuresContainer}>
                {pass.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Text style={styles.featureIcon}>✓</Text>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {/* Savings */}
              <View style={styles.savingsContainer}>
                <Text style={styles.savingsText}>💰 {pass.savings}</Text>
              </View>

              {/* Classes & Routes */}
              <View style={styles.tagsContainer}>
                {pass.classes.map((cls) => (
                  <View key={cls} style={styles.tag}>
                    <Text style={styles.tagText}>{cls}</Text>
                  </View>
                ))}
                <View style={[styles.tag, styles.routeTag]}>
                  <Text style={styles.tagText}>{pass.routes} routes</Text>
                </View>
              </View>

              {/* Purchase Button */}
              <TouchableOpacity
                style={[
                  styles.purchaseButton,
                  purchasing === pass.id && styles.purchaseButtonDisabled,
                ]}
                onPress={() => handlePurchase(pass)}
                disabled={purchasing === pass.id}
              >
                {purchasing === pass.id ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.purchaseButtonText}>
                    Purchase for ${pass.price}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Info Section */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How Passes Work</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>1️⃣</Text>
            <Text style={styles.infoText}>
              Choose a pass that fits your travel needs
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>2️⃣</Text>
            <Text style={styles.infoText}>
              Purchase using your wallet balance
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>3️⃣</Text>
            <Text style={styles.infoText}>
              Book trips without paying per ticket
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>4️⃣</Text>
            <Text style={styles.infoText}>
              Enjoy priority boarding and perks
            </Text>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  walletCard: {
    backgroundColor: '#1E40AF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  walletLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  walletBalance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginVertical: 4,
  },
  walletAction: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F1F5F9',
    marginBottom: 12,
  },
  activePassCard: {
    backgroundColor: '#059669',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  activePassHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activePassName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  activeBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  activePassStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statItem: {
    marginRight: 32,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  expiryText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: '#3B82F6',
  },
  filterTabText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  passCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#F59E0B',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bestValueBadge: {
    backgroundColor: '#10B981',
  },
  studentBadge: {
    backgroundColor: '#8B5CF6',
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  passHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  passName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F1F5F9',
  },
  passDuration: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  passPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  pricePeriod: {
    fontSize: 12,
    color: '#64748B',
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    fontSize: 14,
    color: '#10B981',
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  savingsContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  savingsText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#1E293B',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  routeTag: {
    backgroundColor: '#3B82F6',
  },
  tagText: {
    fontSize: 12,
    color: '#F1F5F9',
    textTransform: 'capitalize',
  },
  purchaseButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  purchaseButtonDisabled: {
    opacity: 0.7,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  infoCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F1F5F9',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#94A3B8',
    flex: 1,
  },
});

export default PassesScreen;
