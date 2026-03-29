import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function MedisinScreen() {
  return (
    <View style={s.container}>
      <Feather name="clock" size={48} color="#D1D3D9" />
      <Text style={s.title}>Kommer snart</Text>
      <Text style={s.sub}>Medisinplan og doser er under utvikling</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7', justifyContent: 'center', alignItems: 'center', padding: 32 },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1F36', marginTop: 20, marginBottom: 8 },
  sub: { fontSize: 15, color: '#6B6E7B', textAlign: 'center' },
});
