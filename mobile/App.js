import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sentinel Mobile</Text>
      <Text style={styles.status}>Status: Scanning Spine...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e1a', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#FFB800', fontSize: 24, fontWeight: 'bold' },
  status: { color: '#00D4FF', marginTop: 10 }
});
