import { Stack, router } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout() {
  const { user, loading, rolle } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user || rolle !== 'admin') {
      router.replace('/auth/login');
    }
  }, [user, loading, rolle]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1A1F36" />
      </View>
    );
  }

  if (!user || rolle !== 'admin') return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#F5F5F7' },
        headerTintColor: '#1A1F36',
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false, title: 'Admin' }} />
      <Stack.Screen name="avdeling/[id]" options={{ title: 'Avdeling' }} />
      <Stack.Screen name="beskjeder/[avdelingId]" options={{ title: 'Beskjeder' }} />
      <Stack.Screen name="ansatte/[avdelingId]" options={{ title: 'Ansatte' }} />
      <Stack.Screen name="vaktliste/[avdelingId]" options={{ title: 'Vaktliste' }} />
      <Stack.Screen name="medisin/[avdelingId]" options={{ title: 'Medisin' }} />
      <Stack.Screen name="oppgaver/[avdelingId]" options={{ title: 'Oppgaver' }} />
    </Stack>
  );
}
