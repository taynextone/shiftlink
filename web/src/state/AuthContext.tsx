import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { api, type AuthState, type AuthUser } from '../lib/api';

type AuthContextValue = {
  session: AuthState | null;
  user: AuthUser | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
  setAuthenticatedSession: (auth: AuthState | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const result = await api.getSession();
      setSession(result.auth);
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const setAuthenticatedSession = useCallback((auth: AuthState | null) => {
    setSession(auth);
    setLoading(false);
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setSession(null);
    window.location.href = '/login';
  }, []);

  const value = useMemo(
    () => ({ session, user: session?.user ?? null, loading, refreshSession, setAuthenticatedSession, logout }),
    [session, loading, refreshSession, setAuthenticatedSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
