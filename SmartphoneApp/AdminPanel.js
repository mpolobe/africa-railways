import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { X, ShieldAlert } from 'lucide-react-native';
import { RAIL_SCHEDULES } from './Schedules';
import { db } from './firebaseConfig';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { seedTrains } from './seedDatabase';

export default function AdminPanel({ onClose }) {
  const triggerTrainEmergency = async (trainId) => {
    try {
      const trainRef = doc(db, "trains", trainId);
      await updateDoc(trainRef, {
        status: 'Emergency',
        lastAlertTime: serverTimestamp()
      });
      alert(`Emergency triggered for Train ${trainId}`);
    } catch (e) {
      alert("Error: Initialize the database first.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <ScrollView contentContainerStyle={{ padding: 25 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 }}>
          <View>
            <Text style={{ color: '#6366F1', fontWeight: '800' }}>CONTROL CENTER</Text>
            <Text style={{ color: '#FFF', fontSize: 24, fontWeight: '900' }}>Train Management</Text>
          </View>
          <TouchableOpacity onPress={onClose}><X color="#FFF" size={30} /></TouchableOpacity>
        </View>

        {RAIL_SCHEDULES.map(train => (
          <View key={train.id} style={{ backgroundColor: '#1E293B', padding: 20, borderRadius: 20, marginBottom: 15 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: '#FFF', fontWeight: '800' }}>{train.train}</Text>
                <Text style={{ color: '#94A3B8', fontSize: 12 }}>ID: {train.id} | {train.from} → {train.to}</Text>
              </View>
              <TouchableOpacity 
                onPress={() => triggerTrainEmergency(train.id)}
                style={{ backgroundColor: '#EF4444', padding: 12, borderRadius: 12 }}
              >
                <ShieldAlert color="#FFF" size={20} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity 
          onPress={seedTrains}
          style={{ marginTop: 30, padding: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#475569', borderRadius: 15 }}
        >
          <Text style={{ color: '#94A3B8', textAlign: 'center', fontWeight: '800' }}>INITIALIZE DATABASE SEED</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
