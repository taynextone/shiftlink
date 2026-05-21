import { Navigate } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { useAuth } from '../state/AuthContext';

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { loading, session } = useAuth();

  if (loading) {
    return <div className="panel state-panel">Session wird geladen…</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
