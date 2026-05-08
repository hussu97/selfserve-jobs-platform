'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getMe } from '@/lib/api';

interface AuthState {
  email: string | null;
  sessionToken: string | null;
  userType: string | null;
  recruiterCode: string | null;
  recruiterStatus: string | null;
}

interface AuthContextValue extends AuthState {
  isLoggedIn: boolean;
  isHydrated: boolean;
  isAdmin: boolean;
  isRecruiter: boolean;
  isActiveRecruiter: boolean;
  isPendingRecruiter: boolean;
  initial: string;
  login: (sessionToken: string, email: string, userType?: string | null, recruiterCode?: string | null, recruiterStatus?: string | null) => void;
  logout: () => void;
  updateRecruiterStatus: (status: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'auth_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    email: null,
    sessionToken: null,
    userType: null,
    recruiterCode: null,
    recruiterStatus: null,
  });
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let storedState: AuthState | null = null;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthState;
        if (parsed.sessionToken && parsed.email) {
          storedState = parsed;
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setAuth(parsed);
        }
      }
    } catch {
      // ignore corrupt storage
    }
    setIsHydrated(true);

    if (!storedState?.sessionToken) return;

    getMe(storedState.sessionToken)
      .then((me) => {
        const refreshed: AuthState = {
          sessionToken: storedState.sessionToken,
          email: me.email,
          userType: me.user_type ?? null,
          recruiterCode: me.recruiter_code ?? null,
          recruiterStatus: me.recruiter_status ?? null,
        };
        setAuth(refreshed);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(refreshed));
      })
      .catch(() => {
        // Keep the stored session if the refresh fails for a transient reason.
      });
  }, []);

  const login = useCallback(
    (
      sessionToken: string,
      email: string,
      userType?: string | null,
      recruiterCode?: string | null,
      recruiterStatus?: string | null,
    ) => {
      const state: AuthState = {
        sessionToken,
        email,
        userType: userType ?? null,
        recruiterCode: recruiterCode ?? null,
        recruiterStatus: recruiterStatus ?? null,
      };
      setAuth(state);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    },
    [],
  );

  const logoutFn = useCallback(() => {
    setAuth({ email: null, sessionToken: null, userType: null, recruiterCode: null, recruiterStatus: null });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Auto-logout when any API call receives a 401 (expired/invalid session token)
  useEffect(() => {
    const handler = () => logoutFn();
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
  }, [logoutFn]);

  const updateRecruiterStatus = useCallback((status: string) => {
    setAuth((prev) => {
      const next = { ...prev, recruiterStatus: status };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isLoggedIn = !!auth.sessionToken && !!auth.email;
  const isAdmin = isLoggedIn && auth.userType === 'admin';
  const isRecruiter = isLoggedIn && auth.userType === 'recruiter';
  const isActiveRecruiter = isAdmin || (isRecruiter && auth.recruiterStatus === 'active');
  const isPendingRecruiter = isRecruiter && (auth.recruiterStatus === 'pending_approval' || auth.recruiterStatus === 'pending_verification');
  const initial = auth.email ? auth.email[0].toUpperCase() : '';

  return (
    <AuthContext.Provider
      value={{
        ...auth,
        isLoggedIn,
        isHydrated,
        isAdmin,
        isRecruiter,
        isActiveRecruiter,
        isPendingRecruiter,
        initial,
        login,
        logout: logoutFn,
        updateRecruiterStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
