import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNotifications } from '../hooks/useNotifications';

/**
 * Notification Demo Component
 * Demonstrates push notification functionality
 */
export const NotificationDemo = () => {
  const {
    expoPushToken,
    notification,
    notifyTicketUpdate,
    notifyTrainStatus,
    notifyScheduleChange,
    clearBadge
  } = useNotifications({
    onNotificationReceived: (notification) => {
      console.log('Notification received in component:', notification);
    },
    onNotificationResponse: (response) => {
      console.log('Notification tapped:', response);
      Alert.alert(
        'Notification Tapped',
        JSON.stringify(response.notification.request.content.data, null, 2)
      );
    }
  });

  const handleTestTicketNotification = async () => {
    await notifyTicketUpdate(
      'TICKET_123',
      'validated',
      'Your ticket has been validated successfully!'
    );
    Alert.alert('Success', 'Ticket notification sent!');
  };

  const handleTestTrainNotification = async () => {
    await notifyTrainStatus(
      'EXP-101',
      'delayed',
      'Train is delayed by 15 minutes due to technical issues.'
    );
    Alert.alert('Success', 'Train status notification sent!');
  };

  const handleTestScheduleNotification = async () => {
    await notifyScheduleChange(
      'Lagos → Abuja',
      '09:30 AM',
      'Schedule adjusted due to maintenance.'
    );
    Alert.alert('Success', 'Schedule change notification sent!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Push Notifications Demo</Text>

      {expoPushToken && (
        <View style={styles.tokenContainer}>
          <Text style={styles.tokenLabel}>Push Token:</Text>
          <Text style={styles.tokenText} numberOfLines={1}>
            {expoPushToken}
          </Text>
        </View>
      )}

      {notification && (
        <View style={styles.notificationContainer}>
          <Text style={styles.notificationTitle}>Last Notification:</Text>
          <Text style={styles.notificationText}>
            {notification.request.content.title}
          </Text>
          <Text style={styles.notificationBody}>
            {notification.request.content.body}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={handleTestTicketNotification}
      >
        <Text style={styles.buttonText}>Test Ticket Update</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={handleTestTrainNotification}
      >
        <Text style={styles.buttonText}>Test Train Status</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={handleTestScheduleNotification}
      >
        <Text style={styles.buttonText}>Test Schedule Change</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.clearButton]}
        onPress={clearBadge}
      >
        <Text style={styles.buttonText}>Clear Badge</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    color: '#38bdf8',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  tokenContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tokenLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 5,
  },
  tokenText: {
    color: '#F1F5F9',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  notificationContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  notificationTitle: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  notificationText: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  notificationBody: {
    color: '#94A3B8',
    fontSize: 12,
  },
  button: {
    backgroundColor: '#38bdf8',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#020617',
    fontSize: 14,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#64748B',
  },
});

export default NotificationDemo;
