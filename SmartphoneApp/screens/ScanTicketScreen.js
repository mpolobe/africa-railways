import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

const PACKAGE_ID = "0x0";
const SUI_NETWORK = getFullnodeUrl('localnet');
const client = new SuiClient({ url: SUI_NETWORK });

/**
 * Scan Ticket Screen
 * Allows staff to scan and validate passenger tickets
 */
const ScanTicketScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);

  if (!permission) {
    return <View style={styles.container} />;
  }

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

  const handleBarCodeScanned = async ({ data }) => {
    setScanning(false);
    try {
      const ticketObject = await client.getObject({
        id: data,
        options: { showContent: true }
      });
      
      navigation.navigate('TicketDetails', {
        ticketData: ticketObject.data.content.fields
      });
    } catch (error) {
      alert("Invalid Ticket: Not found on Sui Blockchain");
      setScanning(true);
    }
  };

  return (
    <View style={styles.container}>
      {scanning ? (
        <>
          <CameraView 
            style={styles.scanner} 
            onBarcodeScanned={handleBarCodeScanned}
          />
          <View style={styles.overlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.instructionText}>
              Position QR code within the frame
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.processingContainer}>
          <Text style={styles.processingText}>Processing ticket...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#F1F5F9',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  scanner: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#38bdf8',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  instructionText: {
    color: '#F1F5F9',
    fontSize: 16,
    marginTop: 20,
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  button: {
    backgroundColor: '#38bdf8',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  cancelButton: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: '#ef4444',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: '#020617',
    fontSize: 16,
    fontWeight: 'bold',
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ScanTicketScreen;
