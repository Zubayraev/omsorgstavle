import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  collection, addDoc, onSnapshot, orderBy, query,
  serverTimestamp, doc, getDoc, deleteDoc,
} from 'firebase/firestore';
import { useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { db } from '@/lib/firebase';

const C = {
  background: '#F5F5F7', foreground: '#1A1F36', card: '#FFFFFF',
  mutedFg: '#6B6E7B', border: '#D1D3D9', success: '#2D7A3E',
  critical: '#C9302C', attention: '#D4A017',
};

type Hendelse = {
  id: string;
  tittel: string;
  dato: string;   // YYYY-MM-DD
  tid: string;    // HH:MM
  sted: string;
  createdAt?: any;
};

function parseDate(input: string): string | null {
  // Accept DD.MM.ÅÅÅÅ
  const parts = input.trim().split('.');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  if (!d || !m || !y || y.length !== 4) return null;
  const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  if (isNaN(Date.parse(iso))) return null;
  return iso;
}

function displayDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function dayLabel(iso: string): string {
  const date = new Date(iso + 'T12:00:00');
  return date.toLocaleDateString('nb-NO', { weekday: 'long' });
}

export default function HendelserScreen() {
  const { avdelingId } = useLocalSearchParams<{ avdelingId: string }>();
  const [avdelingNavn, setAvdelingNavn] = useState('');
  const [hendelser, setHendelser] = useState<Hendelse[]>([]);
  const [sending, setSending] = useState(false);
  const [feil, setFeil] = useState('');

  const [tittel, setTittel] = useState('');
  const [dato, setDato] = useState('');
  const [tid, setTid] = useState('');
  const [sted, setSted] = useState('');

  useEffect(() => {
    getDoc(doc(db, 'avdelinger', avdelingId)).then((d) => {
      if (d.exists()) setAvdelingNavn((d.data() as any).navn ?? avdelingId);
    });
    const q = query(
      collection(db, 'avdelinger', avdelingId, 'hendelser'),
      orderBy('dato', 'asc')
    );
    return onSnapshot(
      q,
      (snap) => {
        setHendelser(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Hendelse, 'id'>) })));
      },
      (err) => console.error('[Hendelser] onSnapshot:', err.code, err.message),
    );
  }, [avdelingId]);

  async function handleSend() {
    setFeil('');
    if (!tittel.trim()) { setFeil('Fyll inn tittel'); return; }
    const isoDate = parseDate(dato);
    if (!isoDate) { setFeil('Dato må være i format DD.MM.ÅÅÅÅ'); return; }
    if (!tid.trim() || !/^\d{2}:\d{2}$/.test(tid.trim())) {
      setFeil('Tid må være i format TT:MM (f.eks. 14:30)'); return;
    }

    setSending(true);
    await addDoc(collection(db, 'avdelinger', avdelingId, 'hendelser'), {
      tittel: tittel.trim(),
      dato: isoDate,
      tid: tid.trim(),
      sted: sted.trim(),
      createdAt: serverTimestamp(),
    });
    setTittel('');
    setDato('');
    setTid('');
    setSted('');
    setSending(false);
  }

  async function handleDelete(id: string) {
    await deleteDoc(doc(db, 'avdelinger', avdelingId, 'hendelser', id));
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Text style={s.avdelingNavn}>{avdelingNavn}</Text>

        {/* Legg til hendelse */}
        <View style={s.card}>
          <Text style={s.label}>Ny hendelse</Text>

          <TextInput
            style={s.input}
            placeholder="Tittel"
            placeholderTextColor="#9DA3B4"
            value={tittel}
            onChangeText={setTittel}
          />
          <View style={s.row}>
            <TextInput
              style={[s.input, s.halfInput]}
              placeholder="Dato (DD.MM.ÅÅÅÅ)"
              placeholderTextColor="#9DA3B4"
              value={dato}
              onChangeText={setDato}
              keyboardType="numbers-and-punctuation"
            />
            <TextInput
              style={[s.input, s.halfInput]}
              placeholder="Tid (TT:MM)"
              placeholderTextColor="#9DA3B4"
              value={tid}
              onChangeText={setTid}
              keyboardType="numbers-and-punctuation"
            />
          </View>
          <TextInput
            style={s.input}
            placeholder="Sted (valgfritt)"
            placeholderTextColor="#9DA3B4"
            value={sted}
            onChangeText={setSted}
          />

          {feil ? <Text style={s.feilTekst}>{feil}</Text> : null}

          <TouchableOpacity style={s.sendBtn} onPress={handleSend} disabled={sending}>
            {sending
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.sendText}>Legg til hendelse</Text>}
          </TouchableOpacity>
        </View>

        <Text style={s.sectionTitle}>Kommende hendelser</Text>

        {hendelser.length === 0 && (
          <Text style={s.empty}>Ingen hendelser lagt til ennå</Text>
        )}

        {hendelser.map((h) => {
          const isPast = h.dato < todayStr;
          const isTomorrow = (() => {
            const d = new Date();
            d.setDate(d.getDate() + 1);
            return h.dato === d.toISOString().split('T')[0];
          })();

          return (
            <View key={h.id} style={[s.eventCard, isPast && s.eventCardPast]}>
              <View style={s.eventLeft}>
                <Text style={[s.eventDay, isPast && s.mutedText]}>
                  {displayDate(h.dato)}
                </Text>
                <Text style={[s.eventWeekday, isPast && s.mutedText]}>
                  {dayLabel(h.dato)}
                  {isTomorrow ? '  ·  Påminnelse sendes i dag' : ''}
                </Text>
                <Text style={[s.eventTittel, isPast && s.mutedText]}>{h.tittel}</Text>
                <View style={s.eventMeta}>
                  <Feather name="clock" size={13} color={isPast ? C.mutedFg : C.foreground} />
                  <Text style={[s.eventMetaText, isPast && s.mutedText]}>{h.tid}</Text>
                  {h.sted ? (
                    <>
                      <Feather name="map-pin" size={13} color={isPast ? C.mutedFg : C.foreground} />
                      <Text style={[s.eventMetaText, isPast && s.mutedText]}>{h.sted}</Text>
                    </>
                  ) : null}
                </View>
              </View>
              <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(h.id)}>
                <Feather name="trash-2" size={18} color={C.critical} />
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: 20, paddingBottom: 48 },
  avdelingNavn: { fontSize: 22, fontWeight: '700', color: C.foreground, marginBottom: 20 },

  card: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: 4, padding: 20, marginBottom: 28,
  },
  label: {
    fontSize: 12, fontWeight: '600', color: C.mutedFg,
    textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12,
  },
  input: {
    borderWidth: 1, borderColor: C.border, borderRadius: 4,
    padding: 14, fontSize: 16, color: C.foreground, marginBottom: 12,
  },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  feilTekst: { fontSize: 13, color: C.critical, marginBottom: 10 },
  sendBtn: {
    backgroundColor: C.foreground, borderRadius: 4,
    paddingVertical: 14, alignItems: 'center',
  },
  sendText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  sectionTitle: { fontSize: 17, fontWeight: '600', color: C.foreground, marginBottom: 14 },
  empty: { color: C.mutedFg, fontSize: 14, textAlign: 'center', marginBottom: 16 },

  eventCard: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: 4, padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center',
  },
  eventCardPast: { opacity: 0.5 },
  eventLeft: { flex: 1 },
  eventDay: { fontSize: 15, fontWeight: '700', color: C.foreground, marginBottom: 2 },
  eventWeekday: { fontSize: 12, color: C.mutedFg, marginBottom: 6 },
  eventTittel: { fontSize: 16, fontWeight: '600', color: C.foreground, marginBottom: 6 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eventMetaText: { fontSize: 13, color: C.foreground },
  mutedText: { color: C.mutedFg },
  deleteBtn: { padding: 8 },
});
