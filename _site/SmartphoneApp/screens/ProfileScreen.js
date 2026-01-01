import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import ProBadge from '../components/ProBadge';
import { subscriptionService } from '../services/subscriptionService';

/**
 * Profile Screen with Pro Badge Integration
 * 
 * Shows user's Pro status prominently with gold badge
 * TAZARA traders can see their status at a glance
 */
export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Load user and subscription data
      const currentSub = await subscriptionService.getCurrentSubscription();
      setSubscription(currentSub);
      
      // TODO: Load user data from your auth service
      setUser({
        name: 'John Mwamba',
        phone: '+260 977 123 456',
        email: 'john.mwamba@example.com',
        memberSince: '2025-01-01',
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Load user data error:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header with Pro Badge */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0) || 'U'}
            </Text>
          </View>
          
          {/* Pro Badge Overlay */}
          {subscription?.status === 'active' && (
            <View style={styles.badgeOverlay}>
              <ProBadge planId={subscription.plan_id} size="small" />
            </View>
          )}
        </View>

        <View style={styles.userInfo}>
          <View style={styles.nameContainer}>
            <Text style={styles.userName}>{user?.name}</Text>
            {subscription?.status === 'active' && (
              <ProBadge 
                planId={subscription.plan_id} 
                size="medium" 
                style={styles.nameBadge}
              />
            )}
          </View>
          <Text style={styles.userPhone}>{user?.phone}</Text>
        </View>
      </View>

      {/* Pro Status Card */}
      {subscription?.status === 'active' ? (
        <TouchableOpacity
          style={styles.proStatusCard}
          onPress={() => navigation.navigate('Subscription')}
        >
          <View style={styles.proStatusHeader}>
            <Text style={styles.proStatusIcon}>👑</Text>
            <View style={styles.proStatusInfo}>
              <Text style={styles.proStatusTitle}>Pro Member</Text>
              <Text style={styles.proStatusSubtitle}>
                Active until {new Date(subscription.next_billing_date).toLocaleDateString('en-GB')}
              </Text>
            </View>
            <Text style={styles.proStatusArrow}>›</Text>
          </View>

          <View style={styles.proStatusBenefits}>
            <View style={styles.benefitBadge}>
              <Text style={styles.benefitBadgeText}>0% Fees</Text>
            </View>
            <View style={styles.benefitBadge}>
              <Text style={styles.benefitBadgeText}>Priority Support</Text>
            </View>
            <View style={styles.benefitBadge}>
              <Text style={styles.benefitBadgeText}>Unlimited Bookings</Text>
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.upgradeCard}
          onPress={() => navigation.navigate('Subscription')}
        >
          <Text style={styles.upgradeIcon}>⭐</Text>
          <View style={styles.upgradeInfo}>
            <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
            <Text style={styles.upgradeSubtitle}>
              Get 0% fees and priority support
            </Text>
          </View>
          <Text style={styles.upgradeArrow}>›</Text>
        </TouchableOpacity>
      )}

      {/* Account Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Details</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Phone Number</Text>
          <Text style={styles.detailValue}>{user?.phone}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Email</Text>
          <Text style={styles.detailValue}>{user?.email || 'Not set'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Member Since</Text>
          <Text style={styles.detailValue}>
            {new Date(user?.memberSince).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Bookings')}
        >
          <Text style={styles.actionIcon}>🎫</Text>
          <Text style={styles.actionText}>My Bookings</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Subscription')}
        >
          <Text style={styles.actionIcon}>💳</Text>
          <Text style={styles.actionText}>Subscription</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.actionIcon}>⚙️</Text>
          <Text style={styles.actionText}>Settings</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Support')}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>Support</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
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
    backgroundColor: '#1E40AF',
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  badgeOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  userInfo: {
    alignItems: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  nameBadge: {
    marginLeft: 12,
  },
  userPhone: {
    fontSize: 16,
    color: '#E0E7FF',
  },
  proStatusCard: {
    backgroundColor: '#FEF3C7',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  proStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  proStatusIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  proStatusInfo: {
    flex: 1,
  },
  proStatusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#92400E',
  },
  proStatusSubtitle: {
    fontSize: 14,
    color: '#78350F',
    marginTop: 2,
  },
  proStatusArrow: {
    fontSize: 32,
    color: '#92400E',
  },
  proStatusBenefits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  benefitBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  benefitBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  upgradeCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  upgradeIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  upgradeInfo: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  upgradeSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  upgradeArrow: {
    fontSize: 32,
    color: '#9CA3AF',
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  actionArrow: {
    fontSize: 24,
    color: '#9CA3AF',
  },
});
