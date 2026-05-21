import { Navigate } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { useAuth } from '../state/AuthContext';

type ProtectedRouteProps = PropsWithChildren<{
  allowedRoles?: string[];
  redirectTo?: string;
}>;

export function ProtectedRoute({ children, allowedRoles, redirectTo = '/login' }: ProtectedRouteProps) {
  const { loading, session } = useAuth();

  if (loading) {
    return <div className="panel state-panel">Session wird geladen…</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    const fallback = session.role === 'HOSPITAL_ADMIN' || session.role === 'SUPER_ADMIN' ? '/hospital' : '/nurse';
    return <Navigate to={redirectTo === '/login' ? fallback : redirectTo} replace />;
  }

  return <>{children}</>;
}
