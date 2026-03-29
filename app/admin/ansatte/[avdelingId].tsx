import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Modal,
} from 'react-native';
import {
  collection, addDoc, onSnapshot, orderBy, query,
  serverTimestamp, doc, getDoc,
} from 'firebase/firestore';
import { useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { db } from '@/lib/firebase';

const C = {
  background: '#F5F5F7', foreground: '#1A1F36', card: '#FFFFFF',
  mutedFg: '#6B6E7B', border: '#D1D3D9',
  rolleA: '#1A1F36', rolleB: '#3B6FD4',
};

type Ansatt = { id: string; navn: string; rolle: string };
type Rolle = 'Miljøarbeider' | 'Miljøterapeut';

const ROLLER: Rolle[] = ['Miljøarbeider', 'Miljøterapeut'];

export default function AnsatteScreen() {
  const { avdelingId } = useLocalSearchParams<{ avdelingId: string }>();
  const [avdelingNavn, setAvdelingNavn] = useState('');
  const [ansatte, setAnsatte] = useState<Ansatt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [addModal, setAddModal] = useState(false);
  const [navn, setNavn] = useState('');
  const [rolle, setRolle] = useState<Rolle>('Miljøarbeider');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'avdelinger', avdelingId)).then((d) => {
      if (d.exists()) setAvdelingNavn((d.data() as any).navn ?? avdelingId);
    });
    const q = query(collection(db, 'ansatte'), orderBy('navn'));
    return onSnapshot(q, (snap) => {
      setAnsatte(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Ansatt, 'id'>) })));
      setLoading(false);
    });
  }, [avdelingId]);

  async function handleAdd() {
    if (!navn.trim()) return;
    setAdding(true);
    await addDoc(collection(db, 'ansatte'), {
      navn: navn.trim(),
      rolle,
      createdAt: serverTimestamp(),
    });
    setNavn('');
    setRolle('Miljøarbeider');
    setAdding(false);
    setAddModal(false);
  }

  const filtered = ansatte.filter((a) =>
    a.navn.toLowerCase().includes(search.toLowerCase())
  );

  function rolleColor(r: string) {
    return r === 'Miljøterapeut' ? C.rolleB : C.rolleA;
  }

  return (
    <View style={s.container}>
      {/* Søk + legg til */}
      <View style={s.topBar}>
        <View style={s.searchRow}>
          <Feather name="search" size={16} color={C.mutedFg} style={s.searchIcon} />
          <TextInput
            style={s.searchInput}
            placeholder="Søk ansatt..."
            placeholderTextColor="#9DA3B4"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={16} color={C.mutedFg} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setAddModal(true)}>
          <Feather name="plus" size={20} color="#fff" />
          <Text style={s.addBtnText}>Ny ansatt</Text>
        </TouchableOpacity>
      </View>

      {/* Liste */}
      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {loading ? (
          <ActivityIndicator color={C.mutedFg} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <Text style={s.empty}>{search ? 'Ingen treff' : 'Ingen ansatte ennå'}</Text>
        ) : (
          filtered.map((a) => (
            <View key={a.id} style={s.ansattCard}>
              <View style={[s.rollePill, { backgroundColor: rolleColor(a.rolle) + '18' }]}>
                <Text style={[s.rolleText, { color: rolleColor(a.rolle) }]}>{a.rolle[0]}</Text>
              </View>
              <View style={s.ansattInfo}>
                <Text style={s.ansattNavn}>{a.navn}</Text>
                <Text style={s.ansattRolle}>{a.rolle}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal: legg til */}
      <Modal visible={addModal} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Ny ansatt</Text>

            <Text style={s.label}>Navn</Text>
            <TextInput
              style={s.input}
              placeholder="Fullt navn"
              placeholderTextColor="#9DA3B4"
              value={navn}
              onChangeText={setNavn}
              autoFocus
            />

            <Text style={s.label}>Rolle</Text>
            <View style={s.rolleRow}>
              {ROLLER.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[s.rolleBtn, rolle === r && s.rolleBtnActive]}
                  onPress={() => setRolle(r)}
                >
                  <Text style={[s.rolleBtnText, rolle === r && s.rolleBtnTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => { setAddModal(false); setNavn(''); }}>
                <Text style={s.cancelText}>Avbryt</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={handleAdd} disabled={adding || !navn.trim()}>
                {adding ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.confirmText}>Legg til</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },

  topBar: {
    backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border,
    padding: 16, gap: 12,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.background,
    borderWidth: 1, borderColor: C.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  searchIcon: {},
  searchInput: { flex: 1, fontSize: 15, color: C.foreground },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.foreground, borderRadius: 6,
    paddingHorizontal: 16, paddingVertical: 12, alignSelf: 'flex-start',
  },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  empty: { color: C.mutedFg, textAlign: 'center', marginTop: 40, fontSize: 15 },

  ansattCard: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 4,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 8, gap: 14,
  },
  rollePill: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rolleText: { fontSize: 15, fontWeight: '700' },
  ansattInfo: { flex: 1 },
  ansattNavn: { fontSize: 16, fontWeight: '600', color: C.foreground },
  ansattRolle: { fontSize: 13, color: C.mutedFg, marginTop: 2 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modal: { backgroundColor: C.card, borderRadius: 8, padding: 24, width: '100%', maxWidth: 360 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.foreground, marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '600', color: C.mutedFg, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: 4, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: C.foreground, marginBottom: 16 },
  rolleRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  rolleBtn: { flex: 1, paddingVertical: 12, borderRadius: 4, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  rolleBtnActive: { backgroundColor: C.foreground, borderColor: C.foreground },
  rolleBtnText: { fontSize: 14, fontWeight: '600', color: C.foreground },
  rolleBtnTextActive: { color: '#fff' },
  modalBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 4, paddingVertical: 13, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: C.mutedFg },
  confirmBtn: { flex: 1, backgroundColor: C.foreground, borderRadius: 4, paddingVertical: 13, alignItems: 'center' },
  confirmText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
