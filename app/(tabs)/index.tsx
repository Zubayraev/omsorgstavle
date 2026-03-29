import { auth, db } from '@/lib/firebase';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  background: '#F5F5F7',
  foreground: '#1A1F36',
  card: '#FFFFFF',
  mutedFg: '#6B6E7B',
  border: '#D1D3D9',
  success: '#2D7A3E',
  critical: '#C9302C',
  attention: '#D4A017',
};

const PIN = '1945';

// ─── Types ────────────────────────────────────────────────────────────────────
type Medicine = {
  id: string;
  name: string;
  dosage: string;
  time: string;
  status: string;
};

type Shift = {
  id: string;
  nurse: string;
  role: string;
  shift: string;
  time: string;
  phone?: string;
};

type Message = {
  id: string;
  from: string;
  text: string;
  priority: string;
  time: string;
};

type Task = {
  id: string;
  task: string;
  time: string;
  completed: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function useCurrentTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(id);
  }, []);
  return now;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: Date) {
  return date.toLocaleDateString('nb-NO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function useCollection<T extends { id: string }>(path: [string, ...string[]], orderByField?: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = collection(db, ...path);
    const q = orderByField ? query(ref, orderBy(orderByField)) : ref;
    const unsub = onSnapshot(q, (snap) => {
      setData(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<T, 'id'>) })) as T[]
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  return { data, loading };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionHeader({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <View style={s.sectionHeader}>
      {icon}
      <Text style={s.sectionTitle}>{label}</Text>
    </View>
  );
}

function Divider() {
  return <View style={s.divider} />;
}

function Checkbox({ done, size = 22 }: { done: boolean; size?: number }) {
  return (
    <View
      style={[
        s.checkbox,
        { width: size, height: size, borderRadius: 3 },
        done && { backgroundColor: C.success, borderColor: C.success },
      ]}
    >
      {done && <Feather name="check" size={size * 0.65} color="#fff" strokeWidth={3} />}
    </View>
  );
}

function LoadingCard() {
  return (
    <View style={[s.card, { padding: 24, alignItems: 'center' }]}>
      <ActivityIndicator color={C.mutedFg} />
    </View>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <View style={[s.card, { padding: 24, alignItems: 'center' }]}>
      <Text style={{ color: C.mutedFg, fontSize: 15 }}>{text}</Text>
    </View>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────────
function MedicineSection({ avdelingId }: { avdelingId: string }) {
  const { data: medicines, loading } = useCollection<Medicine>(
    ['avdelinger', avdelingId, 'medisiner'],
    'time'
  );

  return (
    <View style={s.section}>
      <SectionHeader
        label="MEDISIN"
        icon={<MaterialCommunityIcons name="pill" size={30} color={C.foreground} />}
      />
      {loading ? (
        <LoadingCard />
      ) : medicines.length === 0 ? (
        <EmptyCard text="Ingen medisiner registrert" />
      ) : (
        <View style={s.card}>
          {medicines.map((med, i) => (
            <View key={med.id}>
              <View style={s.medRow}>
                <View style={s.medLeft}>
                  <Text style={s.medName}>{med.name}</Text>
                  <Text style={s.medDosage}>{med.dosage}</Text>
                </View>
                <View style={s.medRight}>
                  <Text style={s.medTime}>{med.time}</Text>
                  <Checkbox done={med.status === 'completed'} size={24} />
                </View>
              </View>
              {i < medicines.length - 1 && <Divider />}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function ShiftSection({ avdelingId }: { avdelingId: string }) {
  const { data: shifts, loading } = useCollection<Shift>(
    ['avdelinger', avdelingId, 'vakter']
  );
  const shift = shifts[0];

  return (
    <View style={s.section}>
      <SectionHeader
        label="VAKT"
        icon={<Feather name="users" size={26} color={C.foreground} />}
      />
      {loading ? (
        <LoadingCard />
      ) : !shift ? (
        <EmptyCard text="Ingen vaktinfo registrert" />
      ) : (
        <View style={s.card}>
          <View style={s.shiftGrid}>
            <View style={s.shiftCell}>
              <Text style={s.shiftLabel}>Navn</Text>
              <Text style={s.shiftValue}>{shift.nurse}</Text>
            </View>
            <View style={s.shiftCell}>
              <Text style={s.shiftLabel}>Rolle</Text>
              <Text style={s.shiftValue}>{shift.role}</Text>
            </View>
            <View style={s.shiftCell}>
              <Text style={s.shiftLabel}>Skift</Text>
              <Text style={s.shiftValue}>{shift.shift}</Text>
            </View>
            <View style={s.shiftCell}>
              <Text style={s.shiftLabel}>Tid</Text>
              <Text style={s.shiftValue}>{shift.time}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function MessagesSection({ avdelingId }: { avdelingId: string }) {
  const { data: messages, loading } = useCollection<Message>(
    ['avdelinger', avdelingId, 'beskjeder'],
    'createdAt'
  );

  return (
    <View style={s.section}>
      <SectionHeader
        label="BESKJEDER"
        icon={<Feather name="message-square" size={22} color={C.foreground} />}
      />
      {loading ? (
        <LoadingCard />
      ) : messages.length === 0 ? (
        <EmptyCard text="Ingen beskjeder" />
      ) : (
        <View style={s.card}>
          {messages.map((msg, i) => (
            <View key={msg.id}>
              <View style={s.msgRow}>
                <View
                  style={[
                    s.msgPriorityBar,
                    { backgroundColor: msg.priority === 'attention' ? C.attention : 'transparent' },
                  ]}
                />
                <View style={s.msgContent}>
                  <View style={s.msgMeta}>
                    <Text style={s.msgFrom}>{msg.from}</Text>
                    <Text style={s.msgTime}>{msg.time}</Text>
                  </View>
                  <Text style={s.msgText}>{msg.text}</Text>
                </View>
              </View>
              {i < messages.length - 1 && <Divider />}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function TasksSection({ avdelingId }: { avdelingId: string }) {
  const { data: tasks, loading } = useCollection<Task>(
    ['avdelinger', avdelingId, 'oppgaver'],
    'time'
  );

  return (
    <View style={[s.section, { marginBottom: 48 }]}>
      <SectionHeader
        label="OPPGAVER"
        icon={<Feather name="check-square" size={22} color={C.foreground} />}
      />
      {loading ? (
        <LoadingCard />
      ) : tasks.length === 0 ? (
        <EmptyCard text="Ingen oppgaver registrert" />
      ) : (
        <View style={s.card}>
          {tasks.map((task, i) => (
            <View key={task.id}>
              <View style={s.taskRow}>
                <View style={s.taskLeft}>
                  <Checkbox done={task.completed} size={20} />
                  <Text style={[s.taskName, task.completed && s.taskDone]}>
                    {task.task}
                  </Text>
                </View>
                <Text style={s.taskTime}>{task.time}</Text>
              </View>
              {i < tasks.length - 1 && <Divider />}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function OmsorgstavleScreen() {
  const now = useCurrentTime();
  const { avdelingId } = useAuth();
  const [pinModal, setPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  function handleLogout() {
    if (pin === PIN) {
      setPinModal(false);
      setPin('');
      setPinError(false);
      signOut(auth).catch(() => {});
      router.replace('/');
    } else {
      setPinError(true);
      setPin('');
    }
  }

  const avd = avdelingId ?? 'avdeling1';

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.background} />

      <View style={s.header}>
        <Image source={require('@/assets/images/logo.png')} style={s.logo} resizeMode="contain" />
        <View style={s.headerRight}>
          <Text style={s.headerTime}>{formatTime(now)}</Text>
          <Text style={s.headerDate} numberOfLines={2}>{formatDate(now)}</Text>
          <TouchableOpacity style={s.logoutBtn} onPress={() => { setPin(''); setPinError(false); setPinModal(true); }}>
            <Text style={s.logoutBtnText}>Logg ut</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={s.main}>
          <MedicineSection avdelingId={avd} />
          <ShiftSection avdelingId={avd} />
          <MessagesSection avdelingId={avd} />
          <TasksSection avdelingId={avd} />
        </View>
      </ScrollView>

      {/* PIN-modal */}
      <Modal visible={pinModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Logg ut</Text>
            <Text style={s.modalSub}>Skriv inn PIN-koden for å logge ut</Text>
            <TextInput
              style={[s.pinInput, pinError && { borderColor: C.critical }]}
              value={pin}
              onChangeText={(t) => { setPin(t); setPinError(false); }}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              placeholder="• • • •"
              placeholderTextColor="#9DA3B4"
              autoFocus
            />
            {pinError && <Text style={s.pinError}>Feil PIN-kode</Text>}
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setPinModal(false)}>
                <Text style={s.cancelText}>Avbryt</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={handleLogout}>
                <Text style={s.confirmText}>Logg ut</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Header
  header: {
    backgroundColor: C.background,
    borderBottomWidth: 0,
    paddingLeft: 0,
    paddingRight: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRight: {
    alignItems: 'flex-end',
    flexShrink: 1,
  },
  headerTime: {
    fontSize: 30,
    fontWeight: '700',
    color: C.foreground,
    lineHeight: 34,
  },
  headerDate: {
    fontSize: 11,
    color: C.mutedFg,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'right',
  },

  // Layout
  main: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  section: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: C.foreground,
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
  },

  // Medicine
  medRow: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  medLeft: {
    flex: 1,
  },
  medName: {
    fontSize: 22,
    fontWeight: '600',
    color: C.foreground,
    letterSpacing: 0.5,
  },
  medDosage: {
    fontSize: 15,
    color: C.mutedFg,
    fontWeight: '500',
    marginTop: 2,
  },
  medRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  medTime: {
    fontSize: 22,
    fontWeight: '600',
    color: C.foreground,
  },

  // Checkbox
  checkbox: {
    borderWidth: 2,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Shift
  shiftGrid: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  shiftCell: {
    width: '45%',
  },
  shiftLabel: {
    fontSize: 12,
    color: C.mutedFg,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  shiftValue: {
    fontSize: 17,
    fontWeight: '600',
    color: C.foreground,
  },

  // Messages
  msgRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  msgPriorityBar: {
    width: 3,
    borderRadius: 2,
    marginRight: 16,
  },
  msgContent: {
    flex: 1,
  },
  msgMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  msgFrom: {
    fontSize: 13,
    fontWeight: '600',
    color: C.foreground,
  },
  msgTime: {
    fontSize: 13,
    color: C.mutedFg,
    fontWeight: '500',
  },
  msgText: {
    fontSize: 15,
    color: C.foreground,
    fontWeight: '500',
    lineHeight: 22,
  },

  // Tasks
  taskRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  taskName: {
    fontSize: 15,
    fontWeight: '500',
    color: C.foreground,
  },
  taskDone: {
    color: C.mutedFg,
    textDecorationLine: 'line-through',
  },
  taskTime: {
    fontSize: 15,
    color: C.mutedFg,
    fontWeight: '500',
  },

  logo: {
    width: 170,
    height: 48,
    marginLeft: -16,
  },

  // Logout button
  logoutBtn: {
    marginTop: 8,
    alignSelf: 'flex-end',
    backgroundColor: C.foreground,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  logoutBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },

  // PIN modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 28,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.foreground, marginBottom: 6 },
  modalSub: { fontSize: 14, color: C.mutedFg, marginBottom: 20 },
  pinInput: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 22,
    color: C.foreground,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 8,
  },
  pinError: { fontSize: 13, color: C.critical, marginBottom: 12, textAlign: 'center' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 4,
    paddingVertical: 13, alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: C.mutedFg },
  confirmBtn: {
    flex: 1, backgroundColor: C.foreground, borderRadius: 4,
    paddingVertical: 13, alignItems: 'center',
  },
  confirmText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
