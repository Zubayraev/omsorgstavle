import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

type Rolle = 'admin' | 'ansatt' | null;

export type BoligBruker = {
  id: string;
  navn: string;
  avdelingId: string;
  pin: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  rolle: Rolle;
  avdelingId: string | null;
  boligBruker: BoligBruker | null;
  loginSomBolig: (navn: string, pin: string) => Promise<'ok' | 'feil_pin' | 'ikke_funnet'>;
  loggUtBolig: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  rolle: null,
  avdelingId: null,
  boligBruker: null,
  loginSomBolig: async () => 'ikke_funnet',
  loggUtBolig: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [rolle, setRolle] = useState<Rolle>(null);
  const [avdelingId, setAvdelingId] = useState<string | null>(null);
  const [boligBruker, setBoligBruker] = useState<BoligBruker | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, 'brukere', u.uid));
        if (snap.exists()) {
          const data = snap.data() as any;
          setRolle(data.rolle ?? null);
          setAvdelingId(data.avdelingId ?? null);
        } else {
          setRolle(null);
          setAvdelingId(null);
        }
      } else {
        setRolle(null);
        setAvdelingId(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function loginSomBolig(navn: string, pin: string): Promise<'ok' | 'feil_pin' | 'ikke_funnet'> {
    const q = query(
      collection(db, 'boliger'),
      where('navn', '==', navn.trim())
    );
    const snap = await getDocs(q);
    if (snap.empty) return 'ikke_funnet';

    const docSnap = snap.docs[0];
    const data = docSnap.data() as any;

    if (data.pin !== pin) return 'feil_pin';

    setBoligBruker({
      id: docSnap.id,
      navn: data.navn,
      avdelingId: data.avdelingId,
      pin: data.pin,
    });
    return 'ok';
  }

  function loggUtBolig() {
    setBoligBruker(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, rolle, avdelingId, boligBruker, loginSomBolig, loggUtBolig }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
