import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';

const API_URL = process.env.BACKEND_URL || 'https://api.africarailways.com';

/**
 * Sentinel Alert Screen
 * Allows sentinels to submit alerts to the dashboard
 */
export default function SentinelAlertScreen({ navigation, route }) {
  const sentinelId = route?.params?.sentinelId || 'sentinel-001';
  const sentinelName = route?.params?.sentinelName || 'Sentinel User';

  const [alertType, setAlertType] = useState('safety');
  const [priority, setPriority] = useState('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [route, setRoute] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        getCurrentLocation();
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const location = await Location.getCurrentPositionAsync({});
      setCoordinates({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      // Reverse geocode to get location name
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      if (geocode.length > 0) {
        const place = geocode[0];
        setLocation(`${place.city || place.district || place.region || 'Unknown'}, ${place.country || ''}`);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  const submitAlert = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an alert title');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }

    setLoading(true);

    try {
      const alertData = {
        sentinel_id: sentinelId,
        sentinel_name: sentinelName,
        type: alertType,
        priority: priority,
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        route: route.trim() || 'N/A',
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
      };

      const response = await fetch(`${API_URL}/api/sentinel/alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert(
          'Success',
          'Alert submitted successfully! The admin has been notified.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Clear form
                setTitle('');
                setDescription('');
                setRoute('');
                setAlertType('safety');
                setPriority('medium');
                
                // Navigate back or to alerts list
                if (navigation.canGoBack()) {
                  navigation.goBack();
                }
              },
            },
          ]
        );
      } else {
        throw new Error(data.message || 'Failed to submit alert');
      }
    } catch (error) {
      console.error('Error submitting alert:', error);
      Alert.alert('Error', 'Failed to submit alert. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status) => {
    try {
      await fetch(`${API_URL}/api/sentinel/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sentinel_id: sentinelId,
          sentinel_name: sentinelName,
          status: status,
          location: location,
          route: route || 'N/A',
          on_duty: status === 'online',
        }),
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Submit Alert</Text>
        <Text style={styles.headerSubtitle}>Report issues to the control center</Text>
      </View>

      {/* Alert Type */}
      <View style={styles.section}>
        <Text style={styles.label}>Alert Type</Text>
        <View style={styles.buttonGroup}>
          {['safety', 'maintenance', 'passenger', 'emergency'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                alertType === type && styles.typeButtonActive,
              ]}
              onPress={() => setAlertType(type)}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  alertType === type && styles.typeButtonTextActive,
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Priority */}
      <View style={styles.section}>
        <Text style={styles.label}>Priority Level</Text>
        <View style={styles.buttonGroup}>
          {['low', 'medium', 'high', 'critical'].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.priorityButton,
                priority === level && styles.priorityButtonActive,
                level === 'critical' && styles.criticalButton,
              ]}
              onPress={() => setPriority(level)}
            >
              <Text
                style={[
                  styles.priorityButtonText,
                  priority === level && styles.priorityButtonTextActive,
                ]}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Title */}
      <View style={styles.section}>
        <Text style={styles.label}>Alert Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Brief description of the issue"
          placeholderTextColor="#666"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Detailed description of the alert"
          placeholderTextColor="#666"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={500}
        />
      </View>

      {/* Location */}
      <View style={styles.section}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Location *</Text>
          <TouchableOpacity
            onPress={getCurrentLocation}
            disabled={locationLoading}
            style={styles.locationButton}
          >
            {locationLoading ? (
              <ActivityIndicator size="small" color="#FFB800" />
            ) : (
              <Text style={styles.locationButtonText}>📍 Get Current</Text>
            )}
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Station or location name"
          placeholderTextColor="#666"
          value={location}
          onChangeText={setLocation}
        />
        {coordinates && (
          <Text style={styles.coordinates}>
            Coordinates: {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
          </Text>
        )}
      </View>

      {/* Route */}
      <View style={styles.section}>
        <Text style={styles.label}>Route (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Lusaka-Livingstone"
          placeholderTextColor="#666"
          value={route}
          onChangeText={setRoute}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={submitAlert}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Alert</Text>
        )}
      </TouchableOpacity>

      {/* Quick Status Updates */}
      <View style={styles.section}>
        <Text style={styles.label}>Quick Status Update</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.statusButton}
            onPress={() => updateStatus('online')}
          >
            <Text style={styles.statusButtonText}>✅ Online</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statusButton}
            onPress={() => updateStatus('away')}
          >
            <Text style={styles.statusButtonText}>⏸️ Away</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statusButton}
            onPress={() => updateStatus('offline')}
          >
            <Text style={styles.statusButtonText}>🔴 Offline</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18191a',
  },
  header: {
    padding: 20,
    backgroundColor: '#242526',
    borderBottomWidth: 1,
    borderBottomColor: '#3e4042',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFB800',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#b0b3b8',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3e4042',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e4e6eb',
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#3a3b3c',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3a3b3c',
  },
  typeButtonActive: {
    backgroundColor: '#1877f2',
    borderColor: '#1877f2',
  },
  typeButtonText: {
    color: '#b0b3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  priorityButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#3a3b3c',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3a3b3c',
  },
  priorityButtonActive: {
    backgroundColor: '#FFA500',
    borderColor: '#FFA500',
  },
  criticalButton: {
    backgroundColor: '#f02849',
    borderColor: '#f02849',
  },
  priorityButtonText: {
    color: '#b0b3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  priorityButtonTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#3a3b3c',
    borderRadius: 8,
    padding: 12,
    color: '#e4e6eb',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#3e4042',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  locationButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#3a3b3c',
    borderRadius: 6,
  },
  locationButtonText: {
    color: '#FFB800',
    fontSize: 13,
    fontWeight: '600',
  },
  coordinates: {
    fontSize: 12,
    color: '#b0b3b8',
    marginTop: 8,
  },
  submitButton: {
    margin: 20,
    padding: 16,
    backgroundColor: '#1877f2',
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#3a3b3c',
    borderRadius: 8,
  },
  statusButtonText: {
    color: '#e4e6eb',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    height: 40,
  },
});
