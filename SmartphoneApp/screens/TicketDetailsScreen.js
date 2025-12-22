import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

/**
 * Ticket Details Screen
 * Displays validated ticket information
 */
const TicketDetailsScreen = ({ route, navigation }) => {
  const { ticketData } = route.params || {};

  if (!ticketData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No ticket data available</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.statusCard}>
        <Text style={styles.statusIcon}>✅</Text>
        <Text style={styles.statusTitle}>TICKET VALIDATED</Text>
        <Text style={styles.statusSubtitle}>Blockchain Verified</Text>
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.cardTitle}>Passenger Information</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Recipient:</Text>
          <Text style={styles.detailValue}>{ticketData.recipient || 'N/A'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Class:</Text>
          <Text style={styles.detailValue}>{ticketData.class || 'N/A'}</Text>
        </View>

        {ticketData.route && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Route:</Text>
            <Text style={styles.detailValue}>{ticketData.route}</Text>
          </View>
        )}

        {ticketData.seat && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Seat:</Text>
            <Text style={styles.detailValue}>{ticketData.seat}</Text>
          </View>
        )}

        {ticketData.date && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{ticketData.date}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('ScanTicket')}
      >
        <Text style={styles.buttonText}>Scan Next Ticket</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton]}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.secondaryButtonText}>Back to Home</Text>
      </TouchableOpacity>
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
  statusCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10b981',
    marginBottom: 20,
  },
  statusIcon: {
    fontSize: 64,
    marginBottom: 10,
  },
  statusTitle: {
    color: '#10b981',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statusSubtitle: {
    color: '#64748B',
    fontSize: 14,
  },
  detailsCard: {
    backgroundColor: '#0f172a',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20,
  },
  cardTitle: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  detailLabel: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  detailValue: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: 'bold',
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  secondaryButtonText: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default TicketDetailsScreen;
