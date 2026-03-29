import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

// ─── Colors ──────────────────────────────────────────────────────────────────
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

// ─── Mock data ────────────────────────────────────────────────────────────────
const medicineSchedule = [
  { id: 1, name: 'PARACETAMOL', dosage: '500 mg', time: '08:00', status: 'completed' },
  { id: 2, name: 'METFORMIN', dosage: '850 mg', time: '12:00', status: 'pending' },
  { id: 3, name: 'ATORVASTATIN', dosage: '20 mg', time: '20:00', status: 'pending' },
];

const currentShift = {
  nurse: 'Kari Nordmann',
  role: 'Sykepleier',
  shift: 'Dag',
  time: '07:00 – 15:00',
  phone: '+47 123 45 678',
};

const messages = [
  { id: 1, from: 'Lege Hansen', text: 'Blodprøve må tas i morgen tidlig', priority: 'attention', time: '13:45' },
  { id: 2, from: 'Familie', text: 'Kommer på besøk kl 16:00', priority: 'normal', time: '12:30' },
];

const tasks = [
  { id: 1, task: 'Blodtrykksmåling', time: '14:00', completed: false },
  { id: 2, task: 'Sårstell', time: '15:30', completed: false },
  { id: 3, task: 'Mobilisering', time: '10:00', completed: true },
];

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

// ─── Sections ─────────────────────────────────────────────────────────────────
function MedicineSection() {
  return (
    <View style={s.section}>
      <SectionHeader
        label="MEDISIN"
        icon={<MaterialCommunityIcons name="pill" size={30} color={C.foreground} />}
      />
      <View style={s.card}>
        {medicineSchedule.map((med, i) => (
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
            {i < medicineSchedule.length - 1 && <Divider />}
          </View>
        ))}
      </View>
    </View>
  );
}

function ShiftSection() {
  return (
    <View style={s.section}>
      <SectionHeader
        label="VAKT"
        icon={<Feather name="users" size={26} color={C.foreground} />}
      />
      <View style={s.card}>
        <View style={s.shiftGrid}>
          <View style={s.shiftCell}>
            <Text style={s.shiftLabel}>Navn</Text>
            <Text style={s.shiftValue}>{currentShift.nurse}</Text>
          </View>
          <View style={s.shiftCell}>
            <Text style={s.shiftLabel}>Rolle</Text>
            <Text style={s.shiftValue}>{currentShift.role}</Text>
          </View>
          <View style={s.shiftCell}>
            <Text style={s.shiftLabel}>Skift</Text>
            <Text style={s.shiftValue}>{currentShift.shift}</Text>
          </View>
          <View style={s.shiftCell}>
            <Text style={s.shiftLabel}>Tid</Text>
            <Text style={s.shiftValue}>{currentShift.time}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function MessagesSection() {
  return (
    <View style={s.section}>
      <SectionHeader
        label="BESKJEDER"
        icon={<Feather name="message-square" size={22} color={C.foreground} />}
      />
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
    </View>
  );
}

function TasksSection() {
  return (
    <View style={[s.section, { marginBottom: 48 }]}>
      <SectionHeader
        label="OPPGAVER"
        icon={<Feather name="check-square" size={22} color={C.foreground} />}
      />
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
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function OmsorgstavleScreen() {
  const now = useCurrentTime();

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.card} />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>OMSORGSTAVLE</Text>
            <Text style={s.headerDate}>{formatDate(now)}</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerTime}>{formatTime(now)}</Text>
            <Text style={s.headerTimeLabel}>Nåværende tidspunkt</Text>
          </View>
        </View>

        {/* Sections */}
        <View style={s.main}>
          <MedicineSection />
          <ShiftSection />
          <MessagesSection />
          <TasksSection />
        </View>
      </ScrollView>
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
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 28,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '600',
    color: C.foreground,
    letterSpacing: 0.5,
  },
  headerDate: {
    fontSize: 13,
    color: C.mutedFg,
    fontWeight: '500',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerTime: {
    fontSize: 36,
    fontWeight: '600',
    color: C.foreground,
    lineHeight: 40,
  },
  headerTimeLabel: {
    fontSize: 12,
    color: C.mutedFg,
    fontWeight: '500',
    marginTop: 2,
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
});
