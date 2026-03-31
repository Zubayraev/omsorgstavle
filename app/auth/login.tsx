import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { router } from 'expo-router';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

type Fane = 'admin' | 'bolig';

export default function LoginScreen() {
  const { loginSomBolig } = useAuth();
  const [fane, setFane] = useState<Fane>('admin');

  // Personlig innlogging
  const [email, setEmail] = useState('');
  const [passord, setPassord] = useState('');
  const [feil, setFeil] = useState('');
  const [laster, setLaster] = useState(false);

  // Bolig-innlogging
  const [boliger, setBoliger] = useState<{ id: string; navn: string }[]>([]);
  const [valgtBolig, setValgtBolig] = useState<string>('');
  const [boligPin, setBoligPin] = useState('');
  const [boligFeil, setBoligFeil] = useState('');
  const [boligLaster, setBoligLaster] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'boliger'), orderBy('createdAt'));
    const unsub = onSnapshot(q, (snap) => {
      const liste = snap.docs.map((d) => ({ id: d.id, navn: (d.data() as any).navn }));
      setBoliger(liste);
      if (liste.length > 0 && !valgtBolig) setValgtBolig(liste[0].navn);
    });
    return unsub;
  }, []);

  async function handlePersonligLogin() {
    if (!email || !passord) { setFeil('Fyll inn e-post og passord'); return; }
    setLaster(true);
    setFeil('');
    try {
      const cred = await signInWithEmailAndPassword(auth, email, passord);
      const snap = await getDoc(doc(db, 'brukere', cred.user.uid));
      if (!snap.exists()) {
        await signOut(auth);
        setFeil('Ingen tilgang');
        setLaster(false);
        return;
      }
      const data = snap.data() as any;
      if (data.rolle === 'admin') {
        router.replace('/admin');
      } else if (data.rolle === 'ansatt') {
        router.replace('/(tabs)');
      } else {
        await signOut(auth);
        setFeil('Ingen tilgang');
      }
    } catch {
      setFeil('Feil e-post eller passord');
    } finally {
      setLaster(false);
    }
  }

  async function handleBoligLogin() {
    if (!valgtBolig) { setBoligFeil('Velg en bolig'); return; }
    if (boligPin.length !== 4) { setBoligFeil('PIN-koden må være 4 siffer'); return; }
    setBoligLaster(true);
    setBoligFeil('');
    const resultat = await loginSomBolig(valgtBolig, boligPin);
    setBoligLaster(false);
    if (resultat === 'ok') {
      router.replace('/(tabs)');
    } else if (resultat === 'feil_pin') {
      setBoligFeil('Feil PIN-kode');
      setBoligPin('');
    } else {
      setBoligFeil('Fant ikke boligen');
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <Text style={s.title}>INNLOGGING</Text>
          <Text style={s.subtitle}>Omsorgstavle</Text>

          {/* Fane-velger */}
          <View style={s.faneRow}>
            <TouchableOpacity
              style={[s.faneBtn, fane === 'admin' && s.faneBtnActive]}
              onPress={() => { setFane('admin'); setFeil(''); setBoligFeil(''); }}
            >
              <Text style={[s.faneTekst, fane === 'admin' && s.faneTekstActive]}>Admin</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.faneBtn, fane === 'bolig' && s.faneBtnActive]}
              onPress={() => { setFane('bolig'); setFeil(''); setBoligFeil(''); }}
            >
              <Text style={[s.faneTekst, fane === 'bolig' && s.faneTekstActive]}>Boligstavle</Text>
            </TouchableOpacity>
          </View>

          {fane === 'admin' ? (
            <>
              <TextInput
                style={s.input}
                placeholder="E-post"
                placeholderTextColor="#9DA3B4"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                style={s.input}
                placeholder="Passord"
                placeholderTextColor="#9DA3B4"
                value={passord}
                onChangeText={setPassord}
                secureTextEntry
              />
              {feil ? <Text style={s.feilTekst}>{feil}</Text> : null}
              <TouchableOpacity style={s.button} onPress={handlePersonligLogin} disabled={laster}>
                {laster ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Logg inn</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={s.velgerLabel}>Velg bolig</Text>
              {boliger.length === 0 ? (
                <Text style={s.ingenBoliger}>Ingen boliger opprettet ennå</Text>
              ) : (
                <View style={s.boligListe}>
                  {boliger.map((b) => (
                    <TouchableOpacity
                      key={b.id}
                      style={[s.boligItem, valgtBolig === b.navn && s.boligItemActive]}
                      onPress={() => setValgtBolig(b.navn)}
                    >
                      <Text style={[s.boligItemTekst, valgtBolig === b.navn && s.boligItemTekstActive]}>
                        {b.navn}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TextInput
                style={[s.input, { marginTop: 16, textAlign: 'center', letterSpacing: 8, fontSize: 20 }]}
                placeholder="PIN"
                placeholderTextColor="#9DA3B4"
                value={boligPin}
                onChangeText={(t) => { setBoligPin(t); setBoligFeil(''); }}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
              />
              {boligFeil ? <Text style={s.feilTekst}>{boligFeil}</Text> : null}
              <TouchableOpacity style={s.button} onPress={handleBoligLogin} disabled={boligLaster}>
                {boligLaster ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Logg inn</Text>}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={s.tilbake} onPress={() => router.back()}>
            <Text style={s.tilbakeTekst}>← Tilbake</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const C = { foreground: '#1A1F36', mutedFg: '#6B6E7B', border: '#D1D3D9', critical: '#C9302C' };

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: {
    backgroundColor: '#fff', borderRadius: 4, padding: 32,
    width: '100%', maxWidth: 400, borderWidth: 1, borderColor: C.border,
  },
  title: { fontSize: 20, fontWeight: '700', color: C.foreground, letterSpacing: 0.5, marginBottom: 4 },
  subtitle: { fontSize: 14, color: C.mutedFg, marginBottom: 24 },

  // Faner
  faneRow: { flexDirection: 'row', borderWidth: 1, borderColor: C.border, borderRadius: 4, marginBottom: 24, overflow: 'hidden' },
  faneBtn: { flex: 1, paddingVertical: 11, alignItems: 'center', backgroundColor: '#fff' },
  faneBtnActive: { backgroundColor: C.foreground },
  faneTekst: { fontSize: 14, fontWeight: '600', color: C.mutedFg },
  faneTekstActive: { color: '#fff' },

  // Felles
  input: {
    borderWidth: 1, borderColor: C.border, borderRadius: 4,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: C.foreground, marginBottom: 12,
  },
  feilTekst: { color: C.critical, fontSize: 14, marginBottom: 12 },
  button: { backgroundColor: C.foreground, borderRadius: 4, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  tilbake: { marginTop: 20, alignItems: 'center' },
  tilbakeTekst: { color: C.mutedFg, fontSize: 14 },

  // Bolig-velger
  velgerLabel: { fontSize: 13, fontWeight: '600', color: C.mutedFg, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.4 },
  ingenBoliger: { fontSize: 14, color: C.mutedFg, textAlign: 'center', marginBottom: 12 },
  boligListe: { gap: 8 },
  boligItem: {
    borderWidth: 1, borderColor: C.border, borderRadius: 4,
    paddingHorizontal: 16, paddingVertical: 13,
  },
  boligItemActive: { backgroundColor: C.foreground, borderColor: C.foreground },
  boligItemTekst: { fontSize: 16, fontWeight: '600', color: C.foreground },
  boligItemTekstActive: { color: '#fff' },
});
