import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  collection, addDoc, onSnapshot, orderBy, query,
  serverTimestamp, doc, getDoc,
} from 'firebase/firestore';
import { useLocalSearchParams } from 'expo-router';
import { db } from '@/lib/firebase';

const C = {
  background: '#F5F5F7', foreground: '#1A1F36', card: '#FFFFFF',
  mutedFg: '#6B6E7B', border: '#D1D3D9', attention: '#D4A017',
};

type Message = { id: string; from: string; text: string; priority: string; time: string };

export default function BeskjederScreen() {
  const { avdelingId } = useLocalSearchParams<{ avdelingId: string }>();
  const [avdelingNavn, setAvdelingNavn] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<'normal' | 'attention'>('normal');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'avdelinger', avdelingId)).then((d) => {
      if (d.exists()) setAvdelingNavn((d.data() as any).navn ?? avdelingId);
    });
    const q = query(collection(db, 'avdelinger', avdelingId, 'beskjeder'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Message, 'id'>) })));
    });
  }, [avdelingId]);

  async function handleSend() {
    if (!text.trim()) return;
    setSending(true);
    const now = new Date();
    await addDoc(collection(db, 'avdelinger', avdelingId, 'beskjeder'), {
      from: 'Admin',
      text: text.trim(),
      priority,
      time: now.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' }),
      createdAt: serverTimestamp(),
    });
    setText('');
    setSending(false);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Text style={s.avdelingNavn}>{avdelingNavn}</Text>

        <View style={s.card}>
          <Text style={s.label}>Send beskjed</Text>
          <TextInput
            style={s.input} placeholder="Skriv beskjed..." placeholderTextColor="#9DA3B4"
            value={text} onChangeText={setText} multiline numberOfLines={3}
          />
          <View style={s.priorityRow}>
            <TouchableOpacity style={[s.priBtn, priority === 'normal' && s.priActive]} onPress={() => setPriority('normal')}>
              <Text style={[s.priText, priority === 'normal' && s.priActiveText]}>Normal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.priBtn, priority === 'attention' && s.priAttention]} onPress={() => setPriority('attention')}>
              <Text style={[s.priText, priority === 'attention' && { color: '#fff' }]}>Viktig</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={s.sendBtn} onPress={handleSend} disabled={sending}>
            {sending ? <ActivityIndicator color="#fff" /> : <Text style={s.sendText}>Send</Text>}
          </TouchableOpacity>
        </View>

        <Text style={s.sectionTitle}>Sendte beskjeder</Text>
        {messages.length === 0 && <Text style={s.empty}>Ingen beskjeder ennå</Text>}
        {messages.map((msg) => (
          <View key={msg.id} style={s.msgCard}>
            <View style={[s.bar, { backgroundColor: msg.priority === 'attention' ? C.attention : 'transparent' }]} />
            <View style={s.msgContent}>
              <View style={s.msgMeta}>
                <Text style={s.msgFrom}>{msg.from}</Text>
                <Text style={s.msgTime}>{msg.time}</Text>
              </View>
              <Text style={s.msgText}>{msg.text}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: 20, paddingBottom: 48 },
  avdelingNavn: { fontSize: 22, fontWeight: '700', color: C.foreground, marginBottom: 20 },
  card: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 20, marginBottom: 28 },
  label: { fontSize: 12, fontWeight: '600', color: C.mutedFg, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 14, fontSize: 16, color: C.foreground, minHeight: 80, textAlignVertical: 'top', marginBottom: 14 },
  priorityRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  priBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 4, borderWidth: 1, borderColor: C.border },
  priActive: { backgroundColor: C.foreground, borderColor: C.foreground },
  priAttention: { backgroundColor: C.attention, borderColor: C.attention },
  priText: { fontSize: 14, fontWeight: '600', color: C.foreground },
  priActiveText: { color: '#fff' },
  sendBtn: { backgroundColor: C.foreground, borderRadius: 4, paddingVertical: 14, alignItems: 'center' },
  sendText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: C.foreground, marginBottom: 14 },
  empty: { color: C.mutedFg, fontSize: 14, textAlign: 'center', marginBottom: 16 },
  msgCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 4, flexDirection: 'row', marginBottom: 10, overflow: 'hidden' },
  bar: { width: 4 },
  msgContent: { flex: 1, padding: 14 },
  msgMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  msgFrom: { fontSize: 13, fontWeight: '600', color: C.foreground },
  msgTime: { fontSize: 13, color: C.mutedFg },
  msgText: { fontSize: 15, color: C.foreground, lineHeight: 21 },
});
