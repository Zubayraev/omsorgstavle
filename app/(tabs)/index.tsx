import { auth, db } from '@/lib/firebase';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import {
  Timestamp, collection, doc, onSnapshot, orderBy, query, updateDoc, where,
} from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Image, Modal, SafeAreaView, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, Vibration, View,
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
type Message = {
  id: string;
  from: string;
  text: string;
  priority: string;
  time: string;
  lest?: boolean;
  createdAt?: any;
};

type Task = {
  id: string;
  task: string;
  time: string;
  completed: boolean;
};

type Alarm = { tid: string; tekst: string };

type Event = {
  id: string;
  tittel: string;
  dato: string;   // YYYY-MM-DD
  tid: string;
  sted: string;
};

type BannerItem = {
  id: string;
  type: 'message';
  from: string;
  text: string;
  priority: 'normal' | 'attention';
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

// Locale-independent HH:MM for alarm matching
function formatHHMM(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function useCollection<T extends { id: string }>(path: [string, ...string[]], orderByField?: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = collection(db, ...path);
    const q = orderByField ? query(ref, orderBy(orderByField)) : ref;
    const unsub = onSnapshot(
      q,
      (snap) => {
        setData(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<T, 'id'>) })) as T[]
        );
        setLoading(false);
      },
      (err) => console.error('[useCollection] onSnapshot:', err.code, err.message),
    );
    return unsub;
  }, []);

  return { data, loading };
}

// ─── Notification Banner ──────────────────────────────────────────────────────
function NotificationBanner({
  item,
  onClose,
  onMarkRead,
}: {
  item: BannerItem;
  onClose: () => void;
  onMarkRead?: () => void;
}) {
  const translateY = useRef(new Animated.Value(-200)).current;
  const pulseOpacity = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      stiffness: 180,
      damping: 15,
      useNativeDriver: true,
    }).start();

    if (item.priority === 'attention') {
      pulseLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseOpacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulseLoopRef.current.start();
    }

    return () => { pulseLoopRef.current?.stop(); };
  }, []);

  function slideOut(callback: () => void) {
    Animated.spring(translateY, {
      toValue: -200,
      stiffness: 180,
      damping: 15,
      useNativeDriver: true,
    }).start(() => callback());
  }

  return (
    <Animated.View
      style={[
        bs.banner,
        { transform: [{ translateY }] },
        item.priority === 'attention' && bs.attentionBorder,
      ]}
    >
      <View style={bs.topRow}>
        {item.priority === 'attention' && (
          <Animated.View style={[bs.dot, { opacity: pulseOpacity }]} />
        )}
        <View style={bs.textArea}>
          <Text style={bs.from}>{item.from}</Text>
          <Text style={bs.msgText} numberOfLines={3}>{item.text}</Text>
        </View>
      </View>
      <View style={bs.buttonRow}>
        <TouchableOpacity style={bs.closeBtn} onPress={() => slideOut(onClose)}>
          <Text style={bs.closeBtnText}>Lukk</Text>
        </TouchableOpacity>
        {onMarkRead && (
          <TouchableOpacity style={bs.markReadBtn} onPress={() => slideOut(onMarkRead)}>
            <Text style={bs.markReadBtnText}>Marker som lest</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
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

// MessagesSection subscribes with a 24h Firestore filter, then re-filters
// client-side on each render so messages age out as `now` ticks forward.
function MessagesSection({ avdelingId, now }: { avdelingId: string; now: Date }) {
  const [rawMessages, setRawMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cutoff = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const q = query(
      collection(db, 'avdelinger', avdelingId, 'beskjeder'),
      where('createdAt', '>', cutoff),
      orderBy('createdAt', 'desc'),
    );
    return onSnapshot(
      q,
      (snap) => {
        setRawMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Message, 'id'>) })));
        setLoading(false);
      },
      (err) => console.error('[MessagesSection] onSnapshot:', err.code, err.message),
    );
  }, [avdelingId]);

  const boundary = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const messages = rawMessages
    .filter((m) => m.createdAt?.toDate && m.createdAt.toDate() > boundary)
    .sort((a, b) => {
      const aScore = a.priority === 'attention' ? 0 : 1;
      const bScore = b.priority === 'attention' ? 0 : 1;
      return aScore - bScore;
    });

  return (
    <View style={s.section}>
      <SectionHeader
        label="BESKJEDER"
        icon={<Feather name="message-square" size={22} color={C.foreground} />}
      />
      {loading ? (
        <LoadingCard />
      ) : messages.length === 0 ? (
        <EmptyCard text="Ingen aktive beskjeder" />
      ) : (
        <View style={s.card}>
          {messages.map((msg, i) => (
            <View key={msg.id}>
              <View style={s.msgRow}>
                <View
                  style={[
                    s.msgPriorityBar,
                    { backgroundColor: msg.priority === 'attention' ? C.critical : 'transparent' },
                  ]}
                />
                <View style={s.msgContent}>
                  <View style={s.msgMeta}>
                    <View style={s.msgMetaLeft}>
                      <Text style={s.msgFrom}>{msg.from}</Text>
                      {msg.lest === true && (
                        <View style={s.lestBadge}>
                          <Text style={s.lestBadgeText}>✓ Lest</Text>
                        </View>
                      )}
                    </View>
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

function HendelserSection({ avdelingId }: { avdelingId: string }) {
  const { data: events, loading } = useCollection<Event>(
    ['avdelinger', avdelingId, 'hendelser'],
    'dato'
  );

  const todayStr = getTodayStr();
  const upcoming = events.filter((e) => e.dato >= todayStr);

  return (
    <View style={s.section}>
      <SectionHeader
        label="HENDELSER"
        icon={<Feather name="calendar" size={22} color={C.foreground} />}
      />
      {loading ? (
        <LoadingCard />
      ) : upcoming.length === 0 ? (
        <EmptyCard text="Ingen kommende hendelser" />
      ) : (
        <View style={s.card}>
          {upcoming.map((evt, i) => {
            const isToday = evt.dato === todayStr;
            return (
              <View key={evt.id}>
                <View style={s.eventRow}>
                  <View style={s.eventDateBox}>
                    <Text style={s.eventDayNum}>{evt.dato.split('-')[2]}</Text>
                    <Text style={s.eventMonthLabel}>
                      {new Date(evt.dato + 'T12:00:00').toLocaleDateString('nb-NO', { month: 'short' })}
                    </Text>
                  </View>
                  <View style={s.eventContent}>
                    <View style={s.eventTitleRow}>
                      <Text style={s.eventTitle}>{evt.tittel}</Text>
                      {isToday && (
                        <View style={s.todayBadge}>
                          <Text style={s.todayBadgeText}>I dag</Text>
                        </View>
                      )}
                    </View>
                    <View style={s.eventMeta}>
                      <Feather name="clock" size={12} color={C.mutedFg} />
                      <Text style={s.eventMetaText}>{evt.tid}</Text>
                      {evt.sted ? (
                        <>
                          <Text style={s.eventMetaDot}>·</Text>
                          <Feather name="map-pin" size={12} color={C.mutedFg} />
                          <Text style={s.eventMetaText}>{evt.sted}</Text>
                        </>
                      ) : null}
                    </View>
                  </View>
                </View>
                {i < upcoming.length - 1 && <Divider />}
              </View>
            );
          })}
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
  const { avdelingId, boligBruker, loggUtBolig } = useAuth();
  const [pinModal, setPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const gjeldendePin = boligBruker ? boligBruker.pin : PIN;
  const avd = boligBruker?.avdelingId ?? avdelingId ?? '';

  // ── Banner state ───────────────────────────────────────────────────────────
  const [unreadMessages, setUnreadMessages] = useState<Message[]>([]);
  const [bannerItem, setBannerItem] = useState<BannerItem | null>(null);
  const unreadMessagesRef = useRef<Message[]>([]);
  const skippedIdsRef = useRef(new Set<string>());
  const isTransitioningRef = useRef(false);

  // ── Alarm state ────────────────────────────────────────────────────────────
  const [alarmer, setAlarmer] = useState<Alarm[]>([]);
  const [alarmVisible, setAlarmVisible] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState<Alarm | null>(null);
  const activeAlarmRef = useRef<Alarm | null>(null);
  const alarmAutoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissedTodayRef = useRef<Set<string>>(new Set());

  // Listen for unread messages (24h window) for the banner
  useEffect(() => {
    if (!avd) return;
    const cutoff = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const q = query(
      collection(db, 'avdelinger', avd, 'beskjeder'),
      where('createdAt', '>', cutoff),
      orderBy('createdAt', 'desc'),
    );
    return onSnapshot(
      q,
      (snap) => {
        const msgs = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Message, 'id'>) }) as Message)
          .filter((m) => m.lest === false);
        setUnreadMessages(msgs);
        unreadMessagesRef.current = msgs;
      },
      (err) => console.error('[Tabs] beskjeder onSnapshot:', err.code, err.message),
    );
  }, [avd]);

  // Listen for alarm configuration
  useEffect(() => {
    if (!avd) return;
    const ref = doc(db, 'avdelinger', avd, 'innstillinger', 'alarmer');
    return onSnapshot(
      ref,
      (snap) => {
        setAlarmer(snap.exists() ? ((snap.data() as any).alarmer ?? []) : []);
      },
      (err) => console.error('[Tabs] alarmer onSnapshot:', err.code, err.message),
    );
  }, [avd]);

  // ── Alarm dismiss ──────────────────────────────────────────────────────────
  const dismissAlarm = useCallback(() => {
    if (alarmAutoCloseRef.current) {
      clearTimeout(alarmAutoCloseRef.current);
      alarmAutoCloseRef.current = null;
    }
    const alarm = activeAlarmRef.current;
    if (alarm) {
      dismissedTodayRef.current.add(`${getTodayStr()}:${alarm.tid}`);
    }
    setAlarmVisible(false);
    setActiveAlarm(null);
    activeAlarmRef.current = null;
  }, []);

  // ── Alarm check – runs every 30s when `now` ticks ─────────────────────────
  useEffect(() => {
    if (alarmVisible) return;
    const timeStr = formatHHMM(now);
    const dateStr = getTodayStr();
    for (const alarm of alarmer) {
      const key = `${dateStr}:${alarm.tid}`;
      if (alarm.tid === timeStr && !dismissedTodayRef.current.has(key)) {
        activeAlarmRef.current = alarm;
        setActiveAlarm(alarm);
        setAlarmVisible(true);
        Vibration.vibrate([0, 500, 200, 500]);
        alarmAutoCloseRef.current = setTimeout(dismissAlarm, 15 * 60 * 1000);
        break;
      }
    }
  }, [now, alarmer, alarmVisible, dismissAlarm]);

  // Cleanup auto-close timer on unmount
  useEffect(() => {
    return () => {
      if (alarmAutoCloseRef.current) clearTimeout(alarmAutoCloseRef.current);
    };
  }, []);

  // ── Banner logic ───────────────────────────────────────────────────────────
  function buildQueue(messages: Message[], excludeId?: string): BannerItem[] {
    return messages
      .map((m) => ({
        id: m.id,
        type: 'message' as const,
        from: m.from,
        text: m.text,
        priority: (m.priority === 'attention' ? 'attention' : 'normal') as 'normal' | 'attention',
      }))
      .filter((i) => i.id !== excludeId && !skippedIdsRef.current.has(i.id));
  }

  useEffect(() => {
    if (bannerItem !== null || isTransitioningRef.current) return;
    const next = buildQueue(unreadMessages)[0] ?? null;
    if (next) setBannerItem(next);
  }, [unreadMessages]);

  function showNext(excludeId?: string) {
    setBannerItem(buildQueue(unreadMessagesRef.current, excludeId)[0] ?? null);
  }

  function handleBannerClose() {
    const id = bannerItem?.id;
    if (id) skippedIdsRef.current.add(id);
    setBannerItem(null);
    isTransitioningRef.current = true;
    setTimeout(() => {
      isTransitioningRef.current = false;
      showNext(id);
    }, 600);
  }

  async function handleMarkRead() {
    if (!bannerItem) return;
    const msgId = bannerItem.id;
    setBannerItem(null);
    isTransitioningRef.current = true;
    await updateDoc(doc(db, 'avdelinger', avd, 'beskjeder', msgId), { lest: true });
    setTimeout(() => {
      isTransitioningRef.current = false;
      showNext(msgId);
    }, 600);
  }

  // ── Auth ───────────────────────────────────────────────────────────────────
  async function handleLogout() {
    if (pin === gjeldendePin || pin === PIN) {
      setPinModal(false);
      setPin('');
      setPinError(false);
      if (boligBruker) {
        router.replace('/');
        setTimeout(() => loggUtBolig(), 100);
      } else {
        await signOut(auth);
        router.replace('/');
      }
    } else {
      setPinError(true);
      setPin('');
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.background} />

      {/* ── Header ── */}
      <View style={s.header}>
        <Image source={require('@/assets/images/logo.png')} style={s.logo} resizeMode="contain" />
        <View style={s.headerRight}>
          <Text style={s.headerTime}>{formatTime(now)}</Text>
          <Text style={s.headerDate} numberOfLines={2}>{formatDate(now)}</Text>
          <TouchableOpacity
            style={s.logoutBtn}
            onPress={() => { setPin(''); setPinError(false); setPinModal(true); }}
          >
            <Text style={s.logoutBtnText}>Logg ut</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Scroll: Beskjeder → Oppgaver ── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.main}>
          <MessagesSection avdelingId={avd} now={now} />
          <HendelserSection avdelingId={avd} />
          <TasksSection avdelingId={avd} />
        </View>
      </ScrollView>

      {/* ── Notification banner ── */}
      {bannerItem && (
        <NotificationBanner
          key={bannerItem.id}
          item={bannerItem}
          onClose={handleBannerClose}
          onMarkRead={handleMarkRead}
        />
      )}

      {/* ── Alarm fullscreen overlay ── */}
      <Modal visible={alarmVisible} transparent={false} animationType="fade" statusBarTranslucent>
        <View style={s.alarmOverlay}>
          <Feather name="bell" size={64} color="#fff" style={{ marginBottom: 24 }} />
          <Text style={s.alarmTime}>{activeAlarm?.tid}</Text>
          <Text style={s.alarmTekst}>{activeAlarm?.tekst ?? 'Alarm'}</Text>
          <TouchableOpacity style={s.alarmOkBtn} onPress={dismissAlarm}>
            <Text style={s.alarmOkText}>OK</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── PIN modal ── */}
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

// ─── Banner styles ────────────────────────────────────────────────────────────
const bs = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 100,
    backgroundColor: '#1A1F36',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  attentionBorder: { borderBottomWidth: 3, borderBottomColor: '#D4A017' },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  dot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#D4A017',
    marginRight: 12, marginTop: 5, flexShrink: 0,
  },
  textArea: { flex: 1 },
  from: {
    fontSize: 13, fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4,
  },
  msgText: { fontSize: 15, color: '#FFFFFF', fontWeight: '500', lineHeight: 22 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  closeBtn: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4, paddingHorizontal: 16, paddingVertical: 8,
  },
  closeBtnText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  markReadBtn: {
    backgroundColor: '#2D7A3E', borderRadius: 4,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  markReadBtnText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
});

// ─── Screen styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  // Header
  header: {
    backgroundColor: C.background,
    paddingLeft: 0, paddingRight: 16, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerRight: { alignItems: 'flex-end', flexShrink: 1 },
  headerTime: { fontSize: 30, fontWeight: '700', color: C.foreground, lineHeight: 34 },
  headerDate: {
    fontSize: 11, color: C.mutedFg, fontWeight: '500',
    marginTop: 2, textAlign: 'right',
  },
  logo: { width: 170, height: 48, marginLeft: -16 },
  logoutBtn: {
    marginTop: 8, alignSelf: 'flex-end',
    backgroundColor: C.foreground, borderRadius: 4,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  logoutBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  // Layout
  main: { paddingHorizontal: 20, paddingTop: 32 },
  section: { marginBottom: 40 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16,
  },
  sectionTitle: { fontSize: 22, fontWeight: '600', color: C.foreground, letterSpacing: 0.3 },
  card: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: 4, overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: C.border },
  checkbox: { borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },

  // Messages
  msgRow: {
    paddingHorizontal: 20, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'stretch',
  },
  msgPriorityBar: { width: 3, borderRadius: 2, marginRight: 16 },
  msgContent: { flex: 1 },
  msgMeta: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  msgMetaLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  msgFrom: { fontSize: 13, fontWeight: '600', color: C.foreground },
  msgTime: { fontSize: 13, color: C.mutedFg, fontWeight: '500' },
  msgText: { fontSize: 15, color: C.foreground, fontWeight: '500', lineHeight: 22 },
  lestBadge: {
    backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: C.success,
    borderRadius: 3, paddingHorizontal: 6, paddingVertical: 1,
  },
  lestBadgeText: { fontSize: 11, color: C.success, fontWeight: '600' },

  // Tasks
  taskRow: {
    paddingHorizontal: 20, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  taskLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  taskName: { fontSize: 15, fontWeight: '500', color: C.foreground },
  taskDone: { color: C.mutedFg, textDecorationLine: 'line-through' },
  taskTime: { fontSize: 15, color: C.mutedFg, fontWeight: '500' },

  // Events
  eventRow: {
    paddingHorizontal: 20, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  eventDateBox: {
    width: 48, alignItems: 'center',
    backgroundColor: C.background, borderRadius: 4,
    paddingVertical: 6, borderWidth: 1, borderColor: C.border,
  },
  eventDayNum: { fontSize: 20, fontWeight: '700', color: C.foreground, lineHeight: 24 },
  eventMonthLabel: {
    fontSize: 11, fontWeight: '500', color: C.mutedFg,
    textTransform: 'uppercase', letterSpacing: 0.3,
  },
  eventContent: { flex: 1 },
  eventTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  eventTitle: { fontSize: 15, fontWeight: '600', color: C.foreground },
  todayBadge: {
    backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: C.success,
    borderRadius: 3, paddingHorizontal: 6, paddingVertical: 1,
  },
  todayBadgeText: { fontSize: 11, fontWeight: '600', color: C.success },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  eventMetaText: { fontSize: 13, color: C.mutedFg },
  eventMetaDot: { fontSize: 13, color: C.mutedFg },

  // Alarm overlay
  alarmOverlay: {
    flex: 1, backgroundColor: C.foreground,
    justifyContent: 'center', alignItems: 'center', padding: 40,
  },
  alarmTime: {
    fontSize: 80, fontWeight: '700', color: '#fff',
    lineHeight: 88, marginBottom: 16,
  },
  alarmTekst: {
    fontSize: 28, fontWeight: '500', color: 'rgba(255,255,255,0.85)',
    textAlign: 'center', marginBottom: 56,
  },
  alarmOkBtn: {
    backgroundColor: '#fff', borderRadius: 8,
    paddingHorizontal: 64, paddingVertical: 20,
  },
  alarmOkText: { fontSize: 22, fontWeight: '700', color: C.foreground },

  // PIN modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  modalCard: { backgroundColor: '#fff', borderRadius: 8, padding: 28, width: '100%', maxWidth: 340 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.foreground, marginBottom: 6 },
  modalSub: { fontSize: 14, color: C.mutedFg, marginBottom: 20 },
  pinInput: {
    borderWidth: 1, borderColor: C.border, borderRadius: 4,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 22, color: C.foreground, textAlign: 'center',
    letterSpacing: 8, marginBottom: 8,
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
