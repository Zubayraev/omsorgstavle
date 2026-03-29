import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { router } from 'expo-router';
import { auth } from '@/lib/firebase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      setError('Fyll inn e-post og passord');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/admin');
    } catch {
      setError('Feil e-post eller passord');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.card}>
        <Text style={s.title}>ADMIN INNLOGGING</Text>
        <Text style={s.subtitle}>Omsorgstavle</Text>

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
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? <Text style={s.error}>{error}</Text> : null}

        <TouchableOpacity style={s.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.buttonText}>Logg inn</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 4,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#D1D3D9',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1F36',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B6E7B',
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D3D9',
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1F36',
    marginBottom: 12,
  },
  error: {
    color: '#C9302C',
    fontSize: 14,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#1A1F36',
    borderRadius: 4,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
