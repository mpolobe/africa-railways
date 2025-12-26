import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alchemy, Network } from 'alchemy-sdk';

// Use the credentials from environment variables
const settings = {
  apiKey: process.env.ALCHEMY_SDK_KEY || process.env.EXPO_PUBLIC_ALCHEMY_SDK_KEY,
  network: Network.MATIC_AMOY,      // Polygon Amoy Testnet
};

const alchemy = new Alchemy(settings);

const CONFIG = {
  contractAddress: "0x0000000000000000000000000000000000000000", // Replace with deployed contract
  chainId: 80002,
  network: "polygon-amoy"
};

/**
 * Scan Ticket Screen
 * Allows staff to scan and validate passenger NFT tickets on Polygon
 */
const ScanTicketScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [ticketResult, setTicketResult] = useState(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);

  useEffect(() => {
    loadScanHistory();
    checkNetworkStatus();
  }, []);

  const loadScanHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('scan_history');
      if (history) {
        setScanHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Failed to load scan history:', error);
    }
  };

  const saveScanHistory = async (scan) => {
    try {
      const newHistory = [scan, ...scanHistory].slice(0, 10); // Keep last 10
      await AsyncStorage.setItem('scan_history', JSON.stringify(newHistory));
      setScanHistory(newHistory);
    } catch (error) {
      console.error('Failed to save scan history:', error);
    }
  };

  const checkNetworkStatus = async () => {
    try {
      const response = await fetch(CONFIG.alchemyURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_chainId",
          params: []
        }),
        timeout: 5000
      });
      setOfflineMode(!response.ok);
    } catch (error) {
      setOfflineMode(true);
    }
  };

  const verifyTicket = async (walletAddress) => {
    try {
      // 1. Fetch all NFTs owned by the scanned address
      const nfts = await alchemy.nft.getNftsForOwner(walletAddress, {
        contractAddresses: [CONFIG.contractAddress] // Filter by your Ticket Contract
      });

      // 2. Check if they have at least one valid ticket
      if (nfts.ownedNfts.length > 0) {
        console.log("✅ Ticket Verified!");
        return { valid: true, ticket: nfts.ownedNfts[0] };
      } else {
        console.log("❌ No Ticket Found");
        return { valid: false };
      }
    } catch (error) {
      console.error("Verification Error:", error);
      return { valid: false, error: error.message };
    }
  };

  const checkTicketUsage = async (ticketId) => {
    try {
      // Check if ticket was already used (from local cache or API)
      const usedTickets = await AsyncStorage.getItem('used_tickets');
      const usedList = usedTickets ? JSON.parse(usedTickets) : [];
      
      return usedList.find(t => t.ticketId === ticketId);
    } catch (error) {
      console.error('Failed to check ticket usage:', error);
      return null;
    }
  };

  const markTicketAsUsed = async (ticketId, ticketData) => {
    try {
      const usedTickets = await AsyncStorage.getItem('used_tickets');
      const usedList = usedTickets ? JSON.parse(usedTickets) : [];
      
      const usageRecord = {
        ticketId,
        ticketData,
        usedAt: new Date().toISOString(),
        staffId: 'STAFF001', // Get from auth
        location: 'Platform 3', // Get from GPS
        synced: false
      };
      
      usedList.push(usageRecord);
      await AsyncStorage.setItem('used_tickets', JSON.stringify(usedList));
      
      // Try to sync with backend
      if (!offlineMode) {
        await syncUsageToBackend(usageRecord);
      }
      
      return usageRecord;
    } catch (error) {
      console.error('Failed to mark ticket as used:', error);
      throw error;
    }
  };

  const syncUsageToBackend = async (usageRecord) => {
    try {
      await fetch('https://africarailways.com/api/tickets/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usageRecord)
      });
    } catch (error) {
      console.error('Failed to sync to backend:', error);
    }
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (!scanning || processing) return;
    
    setScanning(false);
    setProcessing(true);
    
    try {
      // QR code format: "walletAddress" or "TKT1024|walletAddress"
      let walletAddress = data;
      let ticketId = null;
      
      if (data.includes('|')) {
        [ticketId, walletAddress] = data.split('|');
      }
      
      // Check if already used
      if (ticketId) {
        const usageRecord = await checkTicketUsage(ticketId);
        if (usageRecord) {
          setTicketResult({
            status: 'used',
            ticketId: ticketId,
            message: 'Ticket Already Used',
            usedAt: usageRecord.usedAt,
            usedBy: usageRecord.staffId,
            location: usageRecord.location
          });
          await saveScanHistory({
            ticketId: ticketId,
            status: 'used',
            timestamp: new Date().toISOString()
          });
          setProcessing(false);
          return;
        }
      }

      if (offlineMode) {
        // Offline mode - check cache
        const cachedTickets = await AsyncStorage.getItem('cached_tickets');
        const cache = cachedTickets ? JSON.parse(cachedTickets) : {};
        
        if (cache[walletAddress]) {
          setTicketResult({
            status: 'valid',
            ticketId: ticketId || 'Cached',
            walletAddress: walletAddress,
            message: 'Valid Ticket (Cached)',
            offline: true,
            ...cache[walletAddress]
          });
        } else {
          setTicketResult({
            status: 'unknown',
            ticketId: ticketId || 'Unknown',
            walletAddress: walletAddress,
            message: 'Cannot verify offline - not in cache'
          });
        }
      } else {
        // Online mode - verify on Polygon blockchain
        console.log('Verifying on Polygon (Source of Truth)...');
        console.log('Wallet Address:', walletAddress);
        
        const verification = await verifyTicket(walletAddress);
        
        if (verification.valid) {
          const ticket = verification.ticket;
          const metadata = ticket.rawMetadata || ticket.metadata;
          
          setTicketResult({
            status: 'valid',
            ticketId: ticketId || ticket.tokenId,
            walletAddress: walletAddress,
            message: 'Valid Ticket',
            metadata: metadata,
            nftAddress: ticket.contract.address,
            tokenId: ticket.tokenId,
            verifiedOn: 'Polygon'
          });
          
          // Cache for offline use
          const cachedTickets = await AsyncStorage.getItem('cached_tickets');
          const cache = cachedTickets ? JSON.parse(cachedTickets) : {};
          cache[walletAddress] = {
            metadata,
            tokenId: ticket.tokenId,
            cachedAt: new Date().toISOString()
          };
          await AsyncStorage.setItem('cached_tickets', JSON.stringify(cache));
        } else {
          setTicketResult({
            status: 'invalid',
            ticketId: ticketId || 'N/A',
            walletAddress: walletAddress,
            message: verification.error || 'No Ticket Found - Not found on Polygon blockchain'
          });
        }
      }
      
      await saveScanHistory({
        ticketId: ticketId || walletAddress,
        status: ticketResult?.status || 'unknown',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Scan error:', error);
      setTicketResult({
        status: 'error',
        ticketId: data,
        message: 'Error verifying ticket: ' + error.message
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkAsUsed = async () => {
    if (!ticketResult || ticketResult.status !== 'valid') return;
    
    try {
      await markTicketAsUsed(ticketResult.ticketId, ticketResult);
      setTicketResult({
        ...ticketResult,
        status: 'used',
        message: 'Ticket Marked as Used'
      });
      alert('Ticket marked as used successfully');
    } catch (error) {
      alert('Failed to mark ticket as used: ' + error.message);
    }
  };

  const resetScanner = () => {
    setTicketResult(null);
    setScanning(true);
    setProcessing(false);
  };

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

  // Render ticket result
  if (ticketResult) {
    const getStatusColor = () => {
      switch (ticketResult.status) {
        case 'valid': return '#10b981';
        case 'used': return '#f59e0b';
        case 'invalid': return '#ef4444';
        default: return '#6b7280';
      }
    };

    const getStatusIcon = () => {
      switch (ticketResult.status) {
        case 'valid': return '✅';
        case 'used': return '⚠️';
        case 'invalid': return '❌';
        default: return '❓';
      }
    };

    return (
      <ScrollView style={styles.container}>
        <View style={[styles.resultCard, { borderColor: getStatusColor() }]}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultIcon}>{getStatusIcon()}</Text>
            <Text style={[styles.resultTitle, { color: getStatusColor() }]}>
              {ticketResult.message}
            </Text>
          </View>

          {offlineMode && (
            <View style={styles.offlineBanner}>
              <Text style={styles.offlineText}>📡 OFFLINE MODE</Text>
            </View>
          )}

          <View style={styles.detailsContainer}>
            <DetailRow label="Ticket ID" value={ticketResult.ticketId} />
            
            {ticketResult.metadata && (
              <>
                <DetailRow label="Route" value={ticketResult.metadata.attributes?.find(a => a.trait_type === 'Route')?.value || 'N/A'} />
                <DetailRow label="Class" value={ticketResult.metadata.attributes?.find(a => a.trait_type === 'Class')?.value || 'N/A'} />
                <DetailRow label="Seat" value={ticketResult.metadata.attributes?.find(a => a.trait_type === 'Seat')?.value || 'N/A'} />
                <DetailRow label="Passenger" value={ticketResult.metadata.attributes?.find(a => a.trait_type === 'Passenger')?.value || 'N/A'} />
              </>
            )}

            {ticketResult.status === 'used' && (
              <>
                <DetailRow label="Used At" value={new Date(ticketResult.usedAt).toLocaleString()} />
                <DetailRow label="Used By" value={ticketResult.usedBy} />
                <DetailRow label="Location" value={ticketResult.location} />
              </>
            )}

            {ticketResult.nftAddress && (
              <DetailRow label="NFT Address" value={`${ticketResult.nftAddress.slice(0, 10)}...`} />
            )}
          </View>

          <View style={styles.buttonContainer}>
            {ticketResult.status === 'valid' && (
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]} 
                onPress={handleMarkAsUsed}
              >
                <Text style={styles.buttonText}>MARK AS USED</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={resetScanner}
            >
              <Text style={styles.buttonText}>SCAN ANOTHER</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.buttonText}>DONE</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>Recent Scans</Text>
            {scanHistory.map((scan, index) => (
              <View key={index} style={styles.historyItem}>
                <Text style={styles.historyText}>{scan.ticketId}</Text>
                <Text style={[styles.historyStatus, { color: scan.status === 'valid' ? '#10b981' : '#ef4444' }]}>
                  {scan.status}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {processing ? (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={styles.processingText}>Verifying ticket on blockchain...</Text>
          {offlineMode && (
            <Text style={styles.offlineText}>Checking local cache...</Text>
          )}
        </View>
      ) : scanning ? (
        <>
          <CameraView 
            style={styles.scanner} 
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          />
          <View style={styles.overlay}>
            {offlineMode && (
              <View style={styles.offlineBanner}>
                <Text style={styles.offlineText}>📡 OFFLINE MODE</Text>
              </View>
            )}
            <View style={styles.scanFrame} />
            <Text style={styles.instructionText}>
              Position QR code within the frame
            </Text>
            <Text style={styles.networkStatus}>
              Network: {CONFIG.network} • Chain ID: {CONFIG.chainId}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </>
      ) : null}
    </View>
  );
};

// Helper component for detail rows
const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
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
    borderWidth: 3,
    borderColor: '#FFB800',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  instructionText: {
    color: '#F1F5F9',
    fontSize: 16,
    marginTop: 20,
    backgroundColor: 'rgba(2, 6, 23, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  networkStatus: {
    color: '#38bdf8',
    fontSize: 12,
    marginTop: 10,
    backgroundColor: 'rgba(2, 6, 23, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 8,
  },
  offlineBanner: {
    position: 'absolute',
    top: 60,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  offlineText: {
    color: '#020617',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginVertical: 5,
  },
  primaryButton: {
    backgroundColor: '#10b981',
  },
  secondaryButton: {
    backgroundColor: '#38bdf8',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  processingText: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  resultCard: {
    margin: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    borderWidth: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  detailsContainer: {
    marginVertical: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  detailValue: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 20,
  },
  historyContainer: {
    margin: 20,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
  },
  historyTitle: {
    color: '#FFB800',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  historyText: {
    color: '#F1F5F9',
    fontSize: 14,
  },
  historyStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ScanTicketScreen;
