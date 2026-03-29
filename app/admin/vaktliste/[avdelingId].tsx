import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Modal,
} from 'react-native';
import {
  collection, onSnapshot, orderBy, query, doc, getDoc,
  updateDoc, setDoc,
} from 'firebase/firestore';
import { useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { db } from '@/lib/firebase';
import { getWeekDays, DAG_NAVN, formatDateKey } from '@/lib/turnus';

const C = {
  background: '#F5F5F7', foreground: '#1A1F36', card: '#FFFFFF',
  mutedFg: '#6B6E7B', border: '#D1D3D9',
  on: '#EAF4EC', onText: '#2D7A3E',
};

type Ansatt = { id: string; navn: string; rolle: string };

export default function VaktlisteScreen() {
  const { avdelingId } = useLocalSearchParams<{ avdelingId: string }>();
  const [ansatte, setAnsatte] = useState<Ansatt[]>([]);
  const [vaktoppgaver, setVaktoppgaver] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [weekRef, setWeekRef] = useState(new Date());

  // Modal state
  const [modalDay, setModalDay] = useState<string | null>(null);
  const [modalSelected, setModalSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'ansatte'), orderBy('navn'));
    const unsub1 = onSnapshot(q, (snap) => {
      setAnsatte(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Ansatt, 'id'>) })));
      setLoading(false);
    });

    const unsub2 = onSnapshot(collection(db, 'avdelinger', avdelingId, 'vaktoppgaver'), (snap) => {
      const map: Record<string, string[]> = {};
      snap.docs.forEach((d) => { map[d.id] = (d.data() as any).ansatteIds ?? []; });
      setVaktoppgaver(map);
    });

    return () => { unsub1(); unsub2(); };
  }, [avdelingId]);

  const weekDays = getWeekDays(weekRef);

  function openModal(dateKey: string) {
    setModalDay(dateKey);
    setModalSelected(vaktoppgaver[dateKey] ?? []);
    setSearch('');
  }

  async function handleSave() {
    if (!modalDay) return;
    setSaving(true);
    await setDoc(doc(db, 'avdelinger', avdelingId, 'vaktoppgaver', modalDay), {
      ansatteIds: modalSelected,
    });
    setSaving(false);
    setModalDay(null);
  }

  function toggleAnsatt(id: string) {
    setModalSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const filteredAnsatte = ansatte.filter((a) =>
    a.navn.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={s.container}>
      {/* Ukenavigasjon */}
      <View style={s.weekNav}>
        <TouchableOpacity onPress={() => { const d = new Date(weekRef); d.setDate(d.getDate() - 7); setWeekRef(d); }} style={s.weekBtn}>
          <Feather name="chevron-left" size={22} color={C.foreground} />
        </TouchableOpacity>
        <Text style={s.weekLabel}>
          {weekDays[0].toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })}
          {' – '}
          {weekDays[6].toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })}
        </Text>
        <TouchableOpacity onPress={() => { const d = new Date(weekRef); d.setDate(d.getDate() + 7); setWeekRef(d); }} style={s.weekBtn}>
          <Feather name="chevron-right" size={22} color={C.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {loading ? (
          <ActivityIndicator color={C.mutedFg} style={{ marginTop: 40 }} />
        ) : ansatte.length === 0 ? (
          <View style={s.emptyBox}>
            <Feather name="users" size={32} color={C.border} />
            <Text style={s.emptyText}>Ingen ansatte registrert</Text>
            <Text style={s.emptySub}>Legg til ansatte under "Ansatte" i menyen</Text>
          </View>
        ) : (
          weekDays.map((day, i) => {
            const key = formatDateKey(day);
            const assignedIds = vaktoppgaver[key] ?? [];
            const assigned = ansatte.filter((a) => assignedIds.includes(a.id));
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <View key={key} style={[s.dayCard, isToday && s.dayCardToday]}>
                <View style={s.dayHeader}>
                  <Text style={[s.dayName, isToday && { color: '#3B6FD4' }]}>
                    {DAG_NAVN[i]} {day.getDate()}.{day.getMonth() + 1}
                  </Text>
                  <TouchableOpacity style={s.editBtn} onPress={() => openModal(key)}>
                    <Feather name="edit-2" size={14} color={C.mutedFg} />
                    <Text style={s.editBtnText}>Rediger</Text>
                  </TouchableOpacity>
                </View>

                {assigned.length === 0 ? (
                  <Text style={s.noVakt}>Ingen på vakt</Text>
                ) : (
                  <View style={s.badgeRow}>
                    {assigned.map((a) => (
                      <View key={a.id} style={s.badge}>
                        <Text style={s.badgeText}>{a.navn}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Ansatt-velger modal */}
      <Modal visible={!!modalDay} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Velg ansatte på vakt</Text>
              <TouchableOpacity onPress={() => setModalDay(null)}>
                <Feather name="x" size={22} color={C.foreground} />
              </TouchableOpacity>
            </View>

            {/* Søk */}
            <View style={s.searchRow}>
              <Feather name="search" size={15} color={C.mutedFg} />
              <TextInput
                style={s.searchInput}
                placeholder="Søk ansatt..."
                placeholderTextColor="#9DA3B4"
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {/* Liste */}
            <ScrollView style={s.modalList} keyboardShouldPersistTaps="handled">
              {filteredAnsatte.map((a) => {
                const checked = modalSelected.includes(a.id);
                return (
                  <TouchableOpacity key={a.id} style={s.ansattRow} onPress={() => toggleAnsatt(a.id)}>
                    <View style={[s.checkbox, checked && s.checkboxChecked]}>
                      {checked && <Feather name="check" size={14} color="#fff" />}
                    </View>
                    <View style={s.ansattInfo}>
                      <Text style={s.ansattNavn}>{a.navn}</Text>
                      <Text style={s.ansattRolle}>{a.rolle}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.saveBtnText}>Lagre ({modalSelected.length} valgt)</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  weekNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border,
    paddingHorizontal: 8, paddingVertical: 12,
  },
  weekBtn: { padding: 8 },
  weekLabel: { fontSize: 15, fontWeight: '600', color: C.foreground },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  emptyBox: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyText: { fontSize: 16, fontWeight: '600', color: C.foreground },
  emptySub: { fontSize: 13, color: C.mutedFg, textAlign: 'center' },
  dayCard: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: 4, padding: 14, marginBottom: 8,
  },
  dayCardToday: { borderColor: '#3B6FD4', borderWidth: 2 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  dayName: { fontSize: 15, fontWeight: '700', color: C.foreground },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
  editBtnText: { fontSize: 13, color: C.mutedFg },
  noVakt: { fontSize: 13, color: C.mutedFg, fontStyle: 'italic' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { backgroundColor: C.on, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText: { fontSize: 13, fontWeight: '600', color: C.onText },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: C.card, borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 20, maxHeight: '80%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: C.foreground },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.background, borderWidth: 1, borderColor: C.border,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15, color: C.foreground },
  modalList: { maxHeight: 300 },
  ansattRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: C.foreground, borderColor: C.foreground },
  ansattInfo: { flex: 1 },
  ansattNavn: { fontSize: 15, fontWeight: '600', color: C.foreground },
  ansattRolle: { fontSize: 12, color: C.mutedFg, marginTop: 1 },
  saveBtn: {
    backgroundColor: C.foreground, borderRadius: 6,
    paddingVertical: 16, alignItems: 'center', marginTop: 16,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
