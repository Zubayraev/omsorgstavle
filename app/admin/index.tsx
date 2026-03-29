import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Modal,
} from 'react-native';
import {
  collection, addDoc, onSnapshot, orderBy, query, serverTimestamp,
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { router } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { db, auth } from '@/lib/firebase';

const C = {
  background: '#F5F5F7', foreground: '#1A1F36', card: '#FFFFFF',
  mutedFg: '#6B6E7B', border: '#D1D3D9',
};

type Avdeling = { id: string; navn: string };

const MENU_ITEMS = [
  {
    key: 'beskjeder',
    icon: <Feather name="message-square" size={24} color="#1A1F36" />,
    title: 'Beskjeder',
    sub: 'Se og send beskjeder',
    route: (id: string) => `/admin/beskjeder/${id}`,
  },
  {
    key: 'ansatte',
    icon: <Feather name="user" size={24} color="#1A1F36" />,
    title: 'Ansatte',
    sub: 'Se og legg til ansatte',
    route: (id: string) => `/admin/ansatte/${id}`,
  },
  {
    key: 'vakter',
    icon: <Feather name="calendar" size={24} color="#1A1F36" />,
    title: 'Vakter',
    sub: 'Administrer vaktliste',
    route: (id: string) => `/admin/vaktliste/${id}`,
  },
  {
    key: 'medisin',
    icon: <MaterialCommunityIcons name="pill" size={24} color="#1A1F36" />,
    title: 'Medisin',
    sub: 'Medisinplan og doser',
    route: (id: string) => `/admin/medisin/${id}`,
  },
  {
    key: 'oppgaver',
    icon: <Feather name="check-square" size={24} color="#1A1F36" />,
    title: 'Oppgaver',
    sub: 'Daglige oppgaver',
    route: (id: string) => `/admin/oppgaver/${id}`,
  },
];

export default function AdminDashboard() {
  const [avdelinger, setAvdelinger] = useState<Avdeling[]>([]);
  const [selected, setSelected] = useState<Avdeling | null>(null);
  const [loading, setLoading] = useState(true);

  const [avdelingModal, setAvdelingModal] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'avdelinger'), orderBy('createdAt'));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, navn: (d.data() as any).navn }));
      setAvdelinger(list);
      if (!selected && list.length > 0) setSelected(list[0]);
      setLoading(false);
    });
  }, []);

  async function handleAdd() {
    if (!newName.trim()) return;
    setAdding(true);
    await addDoc(collection(db, 'avdelinger'), {
      navn: newName.trim(), createdAt: serverTimestamp(),
    });
    setNewName('');
    setAdding(false);
    setAddModal(false);
  }

  async function handleLogout() {
    setSettingsOpen(false);
    await signOut(auth);
    router.replace('/');
  }

  return (
    <View style={s.container}>
      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <Text style={s.headerTitle}>Admin</Text>
          <TouchableOpacity style={s.gearBtn} onPress={() => setSettingsOpen(true)}>
            <Feather name="settings" size={22} color={C.foreground} />
          </TouchableOpacity>
        </View>

        {/* Avdeling-velger */}
        <TouchableOpacity style={s.avdelingPicker} onPress={() => setAvdelingModal(true)}>
          <Text style={s.avdelingPickerText}>
            {selected ? selected.navn : 'Ingen avdeling valgt'}
          </Text>
          <Feather name="chevron-down" size={16} color={C.mutedFg} />
        </TouchableOpacity>
      </View>

      {/* ── Hovedkort ── */}
      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {loading ? (
          <ActivityIndicator color={C.mutedFg} style={{ marginTop: 40 }} />
        ) : !selected ? (
          <Text style={s.empty}>Legg til en avdeling for å komme i gang</Text>
        ) : (
          MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.key}
              style={[s.menuCard, i === MENU_ITEMS.length - 1 && { marginBottom: 0 }]}
              onPress={() => router.push(item.route(selected.id) as any)}
              activeOpacity={0.75}
            >
              <View style={s.menuIcon}>{item.icon}</View>
              <View style={s.menuText}>
                <Text style={s.menuTitle}>{item.title}</Text>
                <Text style={s.menuSub}>{item.sub}</Text>
              </View>
              <Feather name="chevron-right" size={20} color={C.mutedFg} />
            </TouchableOpacity>
          ))
        )}

        {/* Legg til avdeling */}
        <TouchableOpacity style={s.addAvdelingBtn} onPress={() => setAddModal(true)}>
          <Feather name="plus" size={16} color={C.mutedFg} />
          <Text style={s.addAvdelingText}>Legg til avdeling</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Avdeling-velger modal ── */}
      <Modal visible={avdelingModal} transparent animationType="fade">
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setAvdelingModal(false)}>
          <View style={s.pickerModal}>
            <Text style={s.pickerTitle}>Velg avdeling</Text>
            {avdelinger.map((avd) => (
              <TouchableOpacity
                key={avd.id}
                style={[s.pickerItem, selected?.id === avd.id && s.pickerItemActive]}
                onPress={() => { setSelected(avd); setAvdelingModal(false); }}
              >
                <Text style={[s.pickerItemText, selected?.id === avd.id && s.pickerItemTextActive]}>
                  {avd.navn}
                </Text>
                {selected?.id === avd.id && <Feather name="check" size={16} color={C.foreground} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Innstillinger modal ── */}
      <Modal visible={settingsOpen} transparent animationType="fade">
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setSettingsOpen(false)}>
          <View style={s.settingsMenu}>
            <TouchableOpacity style={s.settingsItem} onPress={handleLogout}>
              <Feather name="log-out" size={16} color={C.foreground} />
              <Text style={s.settingsItemText}>Logg ut</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Ny avdeling modal ── */}
      <Modal visible={addModal} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.addModal}>
            <Text style={s.addModalTitle}>Ny avdeling</Text>
            <TextInput
              style={s.input}
              placeholder="Navn på avdeling"
              placeholderTextColor="#9DA3B4"
              value={newName}
              onChangeText={setNewName}
              autoFocus
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <View style={s.addModalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => { setAddModal(false); setNewName(''); }}>
                <Text style={s.cancelText}>Avbryt</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={handleAdd} disabled={adding}>
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

  // Header
  header: {
    backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border,
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  headerTitle: { fontSize: 26, fontWeight: '700', color: C.foreground, letterSpacing: 0.3 },
  gearBtn: { padding: 4 },
  avdelingPicker: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.background, borderWidth: 1, borderColor: C.border,
    borderRadius: 6, paddingHorizontal: 14, paddingVertical: 10, alignSelf: 'flex-start',
  },
  avdelingPickerText: { fontSize: 15, fontWeight: '600', color: C.foreground },

  // Scroll
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 48 },
  empty: { color: C.mutedFg, textAlign: 'center', marginTop: 40, fontSize: 15 },

  // Menu cards
  menuCard: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 4,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 20,
    marginBottom: 10,
  },
  menuIcon: { width: 40, alignItems: 'center' },
  menuText: { flex: 1, paddingHorizontal: 14 },
  menuTitle: { fontSize: 17, fontWeight: '700', color: C.foreground, marginBottom: 2 },
  menuSub: { fontSize: 13, color: C.mutedFg },

  // Add avdeling
  addAvdelingBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    justifyContent: 'center', marginTop: 24, paddingVertical: 14,
  },
  addAvdelingText: { fontSize: 14, color: C.mutedFg, fontWeight: '500' },

  // Overlay & modals
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  pickerModal: {
    backgroundColor: C.card, borderRadius: 8, padding: 20, width: '100%', maxWidth: 340,
  },
  pickerTitle: { fontSize: 16, fontWeight: '700', color: C.foreground, marginBottom: 14 },
  pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  pickerItemActive: {},
  pickerItemText: { fontSize: 16, color: C.foreground },
  pickerItemTextActive: { fontWeight: '700' },

  settingsMenu: {
    position: 'absolute', top: 80, right: 20,
    backgroundColor: C.card, borderRadius: 8, borderWidth: 1, borderColor: C.border,
    minWidth: 160, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  settingsItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 16 },
  settingsItemText: { fontSize: 15, fontWeight: '600', color: C.foreground },

  addModal: { backgroundColor: C.card, borderRadius: 8, padding: 24, width: '100%', maxWidth: 340 },
  addModalTitle: { fontSize: 18, fontWeight: '700', color: C.foreground, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: 4, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: C.foreground, marginBottom: 16 },
  addModalBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 4, paddingVertical: 13, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: C.mutedFg },
  confirmBtn: { flex: 1, backgroundColor: C.foreground, borderRadius: 4, paddingVertical: 13, alignItems: 'center' },
  confirmText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
