import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { getCacheInfo, clearAllCache } from '../services/offlineStorage';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

/**
 * Settings Screen
 * App settings and cache management
 */
const SettingsScreen = () => {
  const [cacheInfo, setCacheInfo] = useState(null);
  const { isConnected, connectionType, isOffline } = useNetworkStatus();

  useEffect(() => {
    loadCacheInfo();
  }, []);

  const loadCacheInfo = async () => {
    const info = await getCacheInfo();
    setCacheInfo(info);
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear all cached data? This will remove offline access to schedules and other data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const success = await clearAllCache();
            if (success) {
              Alert.alert('Success', 'Cache cleared successfully');
              loadCacheInfo();
            } else {
              Alert.alert('Error', 'Failed to clear cache');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Network Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Network Status</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Connection:</Text>
            <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10b981' : '#ef4444' }]} />
            <Text style={styles.value}>{isConnected ? 'Online' : 'Offline'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Type:</Text>
            <Text style={styles.value}>{connectionType}</Text>
          </View>
        </View>
      </View>

      {/* Cache Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cache Storage</Text>
        <View style={styles.card}>
          {cacheInfo ? (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Cached Items:</Text>
                <Text style={styles.value}>{cacheInfo.itemCount}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Storage Used:</Text>
                <Text style={styles.value}>{cacheInfo.totalSizeKB} KB</Text>
              </View>
            </>
          ) : (
            <Text style={styles.loadingText}>Loading cache info...</Text>
          )}
          
          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={handleClearCache}
          >
            <Text style={styles.dangerButtonText}>Clear All Cache</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* App Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Version:</Text>
            <Text style={styles.value}>1.0.0</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Build:</Text>
            <Text style={styles.value}>Production</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Platform:</Text>
            <Text style={styles.value}>Sui Blockchain</Text>
          </View>
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <Text style={styles.aboutText}>
            Africa Railways - Digital Sovereign Transit
          </Text>
          <Text style={styles.aboutSubtext}>
            Connecting 54 Nations via High-Speed Rail & Sui Blockchain Technology
          </Text>
        </View>
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
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  label: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  value: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 'auto',
    marginRight: 8,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  dangerButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  aboutText: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  aboutSubtext: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SettingsScreen;
