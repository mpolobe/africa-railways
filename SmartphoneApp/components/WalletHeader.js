/**
 * WalletHeader Component
 * Displays wallet balance in the app header
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getWalletSummary, initializeDemoWallet } from '../services/walletService';

const WalletHeader = ({ onPress, compact = false }) => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      await initializeDemoWallet();
      const summary = await getWalletSummary();
      setWallet(summary);
    } catch (error) {
      console.error('Failed to load wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <Text style={styles.loadingText}>...</Text>
      </View>
    );
  }

  if (compact) {
    return (
      <TouchableOpacity style={styles.containerCompact} onPress={onPress}>
        <Text style={styles.balanceCompact}>{wallet?.formattedBalance || '$0.00'}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>💳</Text>
      </View>
      <View style={styles.balanceContainer}>
        <Text style={styles.label}>Wallet Balance</Text>
        <Text style={styles.balance}>{wallet?.formattedBalance || '$0.00'}</Text>
        {wallet?.localBalance && (
          <Text style={styles.localBalance}>{wallet.localBalance}</Text>
        )}
      </View>
      {wallet?.lowBalance && (
        <View style={styles.lowBalanceBadge}>
          <Text style={styles.lowBalanceText}>Low</Text>
        </View>
      )}
      <View style={styles.arrow}>
        <Text style={styles.arrowText}>›</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  containerCompact: {
    backgroundColor: '#1E40AF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  balanceContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  balance: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  balanceCompact: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  localBalance: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  lowBalanceBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  lowBalanceText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  arrow: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.7)',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});

export default WalletHeader;
