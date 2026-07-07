import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Modal,
} from 'react-native';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { db } from '@/lib/firebase';

const C = {
  background: '#F5F5F7', foreground: '#1A1F36', card: '#FFFFFF',
  mutedFg: '#6B6E7B', border: '#D1D3D9', critical: '#C9302C',
};

type Alarm = { tid: string; tekst: string };

export default function AlarmerScreen() {
  const { avdelingId } = useLocalSearchParams<{ avdelingId: string }>();
  const [alarmer, setAlarmer] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [tid, setTid] = useState('');
  const [tekst, setTekst] = useState('Husk medisiner');
  const [saving, setSaving] = useState(false);
  const [feil, setFeil] = useState('');

  const alarmerRef = doc(db, 'avdelinger', avdelingId, 'innstillinger', 'alarmer');

  useEffect(() => {
    return onSnapshot(
      alarmerRef,
      (snap) => {
        setAlarmer(snap.exists() ? ((snap.data() as any).alarmer ?? []) : []);
        setLoading(false);
      },
      (err) => console.error('[Alarmer] onSnapshot:', err.code, err.message),
    );
  }, [avdelingId]);

  async function handleAdd() {
    if (!tid.match(/^\d{2}:\d{2}$/)) { setFeil('Tid må være HH:MM (f.eks. 14:00)'); return; }
    if (!tekst.trim()) { setFeil('Fyll inn tekst'); return; }
    setSaving(true);
    setFeil('');
    await setDoc(alarmerRef, { alarmer: [...alarmer, { tid, tekst: tekst.trim() }] });
    setModal(false);
    setTid('');
    setTekst('Husk medisiner');
    setSaving(false);
  }

  async function handleDelete(index: number) {
    await setDoc(alarmerRef, { alarmer: alarmer.filter((_, i) => i !== index) });
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.headerRow}>
        <Text style={s.title}>Faste alarmer</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => { setFeil(''); setModal(true); }}>
          <Feather name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={C.mutedFg} style={{ marginTop: 32 }} />
      ) : alarmer.length === 0 ? (
        <Text style={s.empty}>Ingen alarmer lagt til</Text>
      ) : (
        alarmer.map((a, i) => (
          <View key={i} style={s.alarmRow}>
            <Feather name="bell" size={18} color={C.foreground} style={{ marginRight: 14 }} />
            <View style={s.alarmInfo}>
              <Text style={s.alarmTid}>{a.tid}</Text>
              <Text style={s.alarmTekst}>{a.tekst}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(i)} style={s.deleteBtn}>
              <Feather name="trash-2" size={16} color={C.critical} />
            </TouchableOpacity>
          </View>
        ))
      )}

      <Modal visible={modal} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Ny alarm</Text>
            <TextInput
              style={s.input}
              placeholder="Tid (HH:MM, f.eks. 14:00)"
              placeholderTextColor="#9DA3B4"
              value={tid}
              onChangeText={(t) => { setTid(t); setFeil(''); }}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              autoFocus
            />
            <TextInput
              style={s.input}
              placeholder="Tekst"
              placeholderTextColor="#9DA3B4"
              value={tekst}
              onChangeText={(t) => { setTekst(t); setFeil(''); }}
            />
            {feil ? <Text style={s.feilTekst}>{feil}</Text> : null}
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setModal(false)}>
                <Text style={s.cancelText}>Avbryt</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={handleAdd} disabled={saving}>
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.confirmText}>Legg til</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: 20, paddingBottom: 48 },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '700', color: C.foreground },
  addBtn: { backgroundColor: C.foreground, borderRadius: 4, padding: 10 },
  empty: { color: C.mutedFg, fontSize: 14, textAlign: 'center', marginTop: 32 },
  alarmRow: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 4,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 10,
  },
  alarmInfo: { flex: 1 },
  alarmTid: { fontSize: 17, fontWeight: '700', color: C.foreground },
  alarmTekst: { fontSize: 14, color: C.mutedFg, marginTop: 2 },
  deleteBtn: { padding: 6 },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalCard: { backgroundColor: C.card, borderRadius: 8, padding: 24, width: '100%', maxWidth: 360 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.foreground, marginBottom: 16 },
  input: {
    borderWidth: 1, borderColor: C.border, borderRadius: 4,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, color: C.foreground, marginBottom: 12,
  },
  feilTekst: { fontSize: 13, color: C.critical, marginBottom: 8 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: C.border,
    borderRadius: 4, paddingVertical: 13, alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: C.mutedFg },
  confirmBtn: { flex: 1, backgroundColor: C.foreground, borderRadius: 4, paddingVertical: 13, alignItems: 'center' },
  confirmText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
