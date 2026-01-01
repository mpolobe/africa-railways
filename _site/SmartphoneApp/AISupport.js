import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, SafeAreaView } from 'react-native';
import { Send, X, Volume2 } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { styles } from './Styles';

export default function AISupport({ visible, onClose }) {
  const [chat, setChat] = useState([{ role: 'bot', text: 'Hello! I am your Africa Rail Voice Assistant. How can I help you today?' }]);
  const [input, setInput] = useState('');

  const speak = (text) => {
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.9,
    });
  };

  const handleSend = () => {
    if (!input) return;
    const userMessage = input;
    const newChat = [...chat, { role: 'user', text: userMessage }];
    setChat(newChat);
    setInput('');

    // Simulate AI Logic & Voice Response
    setTimeout(() => {
      const botResponse = "I've processed your request regarding " + userMessage + ". The Lagos-Ibadan express is currently on schedule and arriving in 20 minutes.";
      setChat([...newChat, { role: 'bot', text: botResponse }]);
      speak(botResponse); // AI talks back
    }, 1000);
  };

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ padding: 20, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#eee', alignItems: 'center' }}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#1e293b' }}>Voice Assistant</Text>
            <Volume2 color="#2563eb" size={20} style={{marginLeft: 8}} />
          </View>
          <TouchableOpacity onPress={onClose}><X color="#1e293b" /></TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1, padding: 20 }}>
          {chat.map((m, i) => (
            <View key={i} style={[
              { padding: 15, borderRadius: 20, marginBottom: 10, maxWidth: '80%' },
              m.role === 'user' ? { backgroundColor: '#2563eb', alignSelf: 'flex-end' } : { backgroundColor: '#f1f5f9', alignSelf: 'flex-start' }
            ]}>
              <Text style={m.role === 'user' ? { color: '#fff' } : { color: '#1e293b' }}>{m.text}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={{ padding: 20, flexDirection: 'row', borderTopWidth: 1, borderColor: '#eee' }}>
          <TextInput 
            style={{ flex: 1, backgroundColor: '#f1f5f9', padding: 12, borderRadius: 20, marginRight: 10 }} 
            value={input} 
            onChangeText={setInput} 
            placeholder="Ask me a question..." 
          />
          <TouchableOpacity onPress={handleSend} style={{ backgroundColor: '#2563eb', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' }}>
            <Send color="#fff" size={18} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
