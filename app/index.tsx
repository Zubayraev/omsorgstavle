import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

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
    day: 'numeric',
    month: 'long',
  });
}

export default function WelcomeScreen() {
  const now = useCurrentTime();
  const { user } = useAuth();

  function handleAdmin() {
    if (user) {
      router.replace('/admin');
    } else {
      router.push('/auth/login');
    }
  }

  function handleBruker() {
    router.push('/auth/bruker-login');
  }

  return (
    <ImageBackground
      source={require('@/assets/images/omsorgstavleintro.png')}
      style={s.bg}
      resizeMode="cover"
    >
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Frosted header */}
      <SafeAreaView style={s.headerWrap}>
        <View style={s.header}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={s.logo}
            resizeMode="contain"
          />
          <View style={s.headerRight}>
            <Text style={s.headerTime}>{formatTime(now)}</Text>
            <Text style={s.headerDate}>{formatDate(now)}</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Bottom content card */}
      <View style={s.bottomCard}>
        <Text style={s.welcome}>Velkommen</Text>
        <Text style={s.subtitle}>
          Din digitale omsorgstavle — alltid oppdatert, alltid tilgjengelig for deg og dine nærmeste.
        </Text>

        <View style={s.buttons}>
          <TouchableOpacity
            style={s.btnUser}
            onPress={handleBruker}
            activeOpacity={0.85}
          >
            <Text style={s.btnUserText}>Bruker</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.btnAdmin}
            onPress={handleAdmin}
            activeOpacity={0.85}
          >
            <Text style={s.btnAdminText}>Admin</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const C = {
  foreground: '#1A1F36',
  mutedFg: '#6B6E7B',
};

const s = StyleSheet.create({
  bg: {
    flex: 1,
  },

  // Header
  headerWrap: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(209,211,217,0.6)',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
    paddingVertical: 14,
  },
  logo: {
    width: 170,
    height: 48,
    marginLeft: -16,
  },
  headerRight: {
    alignItems: 'flex-end',
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

  // Bottom card
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 48,
  },
  welcome: {
    fontSize: 34,
    fontWeight: '700',
    color: C.foreground,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 15,
    color: C.mutedFg,
    lineHeight: 22,
    marginBottom: 32,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  btnUser: {
    flex: 1,
    backgroundColor: C.foreground,
    borderRadius: 8,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnUserText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  btnAdmin: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: C.foreground,
  },
  btnAdminText: {
    color: C.foreground,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
