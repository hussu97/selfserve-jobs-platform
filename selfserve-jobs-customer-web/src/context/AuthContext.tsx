'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface AuthState {
  email: string | null;
  sessionToken: string | null;
}

interface AuthContextValue extends AuthState {
  isLoggedIn: boolean;
  isHydrated: boolean;
  initial: string;
  login: (sessionToken: string, email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'auth_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ email: null, sessionToken: null });
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthState;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (parsed.sessionToken && parsed.email) setAuth(parsed);
      }
    } catch {
      // ignore corrupt storage
    }
    setIsHydrated(true);
  }, []);

  const login = useCallback((sessionToken: string, email: string) => {
    const state = { sessionToken, email };
    setAuth(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, []);

  const logoutFn = useCallback(() => {
    setAuth({ email: null, sessionToken: null });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const isLoggedIn = !!auth.sessionToken && !!auth.email;
  const initial = auth.email ? auth.email[0].toUpperCase() : '';

  return (
    <AuthContext.Provider value={{ ...auth, isLoggedIn, isHydrated, initial, login, logout: logoutFn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
