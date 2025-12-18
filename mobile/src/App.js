import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function App() {
  const [balance, setBalance] = useState('150.00');
  return (
    <View style={styles.container}>
      <Text style={styles.header}>🌍 Africoin Wallet</Text>
      <View style={styles.card}>
        <Text style={styles.balance}>{balance} AFRC</Text>
        <Text style={styles.label}>Node: Lusaka Mainnet</Text>
      </View>
      <TouchableOpacity style={styles.btn}>
        <Text style={styles.btnText}>Submit Sentinel Safety Report</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center' },
  header: { color: '#FFD700', fontSize: 24, fontWeight: 'bold' },
  card: { backgroundColor: '#1E1E1E', padding: 30, borderRadius: 20, marginVertical: 20 },
  balance: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
  label: { color: '#888', textAlign: 'center' },
  btn: { backgroundColor: '#2E7D32', padding: 15, borderRadius: 10 }
});
