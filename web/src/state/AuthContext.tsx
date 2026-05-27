import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { api, type AuthState, type AuthUser } from '../lib/api';

type AuthContextValue = {
  session: AuthState | null;
  user: AuthUser | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
  setAuthenticatedUser: (user: AuthUser | null) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthState | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const result = await api.getSession();
      setSession(result.auth);
      setUser((current) =>
        current && current.id === result.auth.userId ? current : current
      );
    } catch {
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const setAuthenticatedUser = useCallback(async (nextUser: AuthUser | null) => {
    setUser(nextUser);
    if (nextUser) {
      await refreshSession();
    }
  }, [refreshSession]);

  const logout = useCallback(async () => {
    await api.logout();
    setSession(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ session, user, loading, refreshSession, setAuthenticatedUser, logout }),
    [session, user, loading, refreshSession, setAuthenticatedUser, logout],
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
