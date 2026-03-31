import { Tabs, router } from 'expo-router';
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

export default function TabLayout() {
  const { user, loading, boligBruker } = useAuth();
  const harTilgang = !!user || !!boligBruker;

  useEffect(() => {
    if (!loading && !harTilgang) {
      router.replace('/auth/login');
    }
  }, [harTilgang, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F7' }}>
        <ActivityIndicator size="large" color="#1A1F36" />
      </View>
    );
  }

  if (!harTilgang) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Omsorgstavle',
          tabBarIcon: ({ color }) => <Feather name="grid" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
