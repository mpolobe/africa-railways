import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import ProBadge from '../components/ProBadge';
import { subscriptionService } from '../services/subscriptionService';
import { phoneVerificationService } from '../services/phoneVerificationService';

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
  
  // Phone verification state
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    // Countdown timer for resend OTP
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const loadUserData = async () => {
    try {
      // Load user and subscription data
      const currentSub = await subscriptionService.getCurrentSubscription();
      setSubscription(currentSub);
      
      // Load phone verification status
      const phoneData = await phoneVerificationService.getPhoneNumber();
      
      // TODO: Load user data from your auth service
      setUser({
        name: 'John Mwamba',
        phone: phoneData.phoneNumber || null,
        email: 'john.mwamba@example.com',
        memberSince: '2025-01-01',
      });
      setPhoneVerified(phoneData.isVerified);
      
      setLoading(false);
    } catch (error) {
      console.error('Load user data error:', error);
      setLoading(false);
    }
  };

  const handleEditPhone = () => {
    setNewPhoneNumber(user?.phone || '');
    setPhoneModalVisible(true);
  };

  const handleSendOTP = async () => {
    if (!newPhoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    setVerifying(true);
    const result = await phoneVerificationService.sendOTP(newPhoneNumber);
    setVerifying(false);

    if (result.success) {
      setOtpSent(true);
      setPhoneModalVisible(false);
      setOtpModalVisible(true);
      setResendTimer(60); // 60 seconds before resend allowed
      
      // Show dev OTP in development mode
      if (result.devOTP) {
        Alert.alert('Development Mode', `Your OTP is: ${result.devOTP}`);
      }
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter a 6-digit OTP');
      return;
    }

    setVerifying(true);
    const result = await phoneVerificationService.verifyOTP(newPhoneNumber, otpCode);
    setVerifying(false);

    if (result.success) {
      setUser(prev => ({ ...prev, phone: result.phoneNumber }));
      setPhoneVerified(true);
      setOtpModalVisible(false);
      setOtpCode('');
      setNewPhoneNumber('');
      Alert.alert('Success', 'Phone number verified successfully!');
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    
    setVerifying(true);
    const result = await phoneVerificationService.resendOTP(newPhoneNumber);
    setVerifying(false);

    if (result.success) {
      setResendTimer(60);
      if (result.devOTP) {
        Alert.alert('Development Mode', `Your new OTP is: ${result.devOTP}`);
      }
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleCancelPhoneEdit = () => {
    setPhoneModalVisible(false);
    setNewPhoneNumber('');
  };

  const handleCancelOTP = () => {
    setOtpModalVisible(false);
    setOtpCode('');
    setOtpSent(false);
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
        
        <TouchableOpacity style={styles.detailRow} onPress={handleEditPhone}>
          <Text style={styles.detailLabel}>Phone Number</Text>
          <View style={styles.phoneValueContainer}>
            {user?.phone ? (
              <>
                <Text style={styles.detailValue}>{user.phone}</Text>
                {phoneVerified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.notSetText}>Not set</Text>
            )}
            <Text style={styles.editIcon}>›</Text>
          </View>
        </TouchableOpacity>

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

      {/* Phone Number Edit Modal */}
      <Modal
        visible={phoneModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelPhoneEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Phone Number</Text>
            <Text style={styles.modalSubtitle}>
              Enter your phone number to receive a verification code
            </Text>
            
            <TextInput
              style={styles.phoneInput}
              placeholder="+260 97X XXX XXX"
              placeholderTextColor="#9CA3AF"
              value={newPhoneNumber}
              onChangeText={setNewPhoneNumber}
              keyboardType="phone-pad"
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelPhoneEdit}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.sendOtpButton, verifying && styles.buttonDisabled]}
                onPress={handleSendOTP}
                disabled={verifying}
              >
                {verifying ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.sendOtpButtonText}>Send OTP</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* OTP Verification Modal */}
      <Modal
        visible={otpModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelOTP}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Verify Phone Number</Text>
            <Text style={styles.modalSubtitle}>
              Enter the 6-digit code sent to {newPhoneNumber}
            </Text>
            
            <TextInput
              style={styles.otpInput}
              placeholder="000000"
              placeholderTextColor="#9CA3AF"
              value={otpCode}
              onChangeText={setOtpCode}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            
            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResendOTP}
              disabled={resendTimer > 0}
            >
              <Text style={[styles.resendText, resendTimer > 0 && styles.resendTextDisabled]}>
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelOTP}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.verifyButton, verifying && styles.buttonDisabled]}
                onPress={handleVerifyOTP}
                disabled={verifying}
              >
                {verifying ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.verifyButtonText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    alignItems: 'center',
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
  phoneValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notSetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  verifiedBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editIcon: {
    fontSize: 20,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  phoneInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20,
  },
  otpInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 16,
  },
  resendButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resendText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: '#9CA3AF',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  sendOtpButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  sendOtpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  verifyButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
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
