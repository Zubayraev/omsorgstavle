import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  avdelingId: string | null;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, avdelingId: null });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [avdelingId, setAvdelingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const profileSnap = await getDoc(doc(db, 'userProfiles', u.uid));
        setAvdelingId(profileSnap.exists() ? (profileSnap.data() as any).avdelingId ?? null : null);
      } else {
        setAvdelingId(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, avdelingId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
