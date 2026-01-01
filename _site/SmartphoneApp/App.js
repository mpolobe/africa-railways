import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MapHologram } from './MapHologram'; // Our Pixel-Map component
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

// This line is updated automatically by your deploy-railway.sh script
const PACKAGE_ID = "0x0"; 
const SUI_NETWORK = getFullnodeUrl('localnet');
const client = new SuiClient({ url: SUI_NETWORK });

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [ticketData, setTicketData] = useState(null);

  // 1. Camera Permissions check
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera access is required to scan tickets.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 2. Logic to validate the Sui Ticket QR Code
  const handleBarCodeScanned = async ({ data }) => {
    setScanning(false);
    try {
      // Data scanned is the Sui Object ID of the ticket
      const ticketObject = await client.getObject({
        id: data,
        options: { showContent: true }
      });
      
      setTicketData(ticketObject.data.content.fields);
    } catch (error) {
      alert("Invalid Ticket: Not found on Sui Blockchain");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* Header Section */}
        <Text style={styles.title}>AFRICA RAILWAYS</Text>
        <Text style={styles.subtitle}>Digital Sovereign Transit</Text>

        {/* Hologram Section (Third Screen Logic) */}
        <View style={styles.hologramCard}>
          <Text style={styles.cardTitle}>LIVE ROUTE TRACKER</Text>
          <MapHologram />
          <View style={styles.statusBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.statusText}>EN ROUTE: LAGOS ➔ ABUJA</Text>
          </View>
        </View>

        {/* Ticket Details or Scanner */}
        {scanning ? (
          <View style={styles.scannerWrapper}>
            <CameraView 
              style={styles.scanner} 
              onBarcodeScanned={handleBarCodeScanned}
            />
            <TouchableOpacity style={styles.button} onPress={() => setScanning(false)}>
              <Text style={styles.buttonText}>Cancel Scan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionCard}>
            {ticketData ? (
              <View style={styles.ticketResult}>
                <Text style={styles.ticketText}>✅ TICKET VALIDATED</Text>
                <Text style={styles.ticketDetail}>Passenger: {ticketData.recipient}</Text>
                <Text style={styles.ticketDetail}>Class: {ticketData.class}</Text>
                <TouchableOpacity style={styles.button} onPress={() => setTicketData(null)}>
                  <Text style={styles.buttonText}>Scan Next</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.cardDescription}>Staff Terminal: Validate passenger Move NFTs.</Text>
                <TouchableOpacity style={styles.button} onPress={() => setScanning(true)}>
                  <Text style={styles.buttonText}>SCAN QR TICKET</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Deep Dark Blue
  },
  scrollContainer: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F1F5F9',
    letterSpacing: 2,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 30,
  },
  hologramCard: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20,
  },
  cardTitle: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 8,
  },
  statusText: {
    color: '#f8fafc',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionCard: {
    width: '100%',
    backgroundColor: '#1e293b',
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
  },
  cardDescription: {
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scannerWrapper: {
    width: '100%',
    height: 400,
    borderRadius: 20,
    overflow: 'hidden',
  },
  scanner: {
    flex: 1,
  },
  ticketResult: {
    alignItems: 'center',
  },
  ticketText: {
    color: '#10b981',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  ticketDetail: {
    color: '#f8fafc',
    fontSize: 14,
    marginBottom: 5,
  }
});
