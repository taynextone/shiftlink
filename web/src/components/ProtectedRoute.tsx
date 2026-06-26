import { Navigate } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { useAuth } from '../state/AuthContext';
import { LoadingSkeleton } from './LoadingSkeleton';

type ProtectedRouteProps = PropsWithChildren<{
  allowedRoles?: string[];
  redirectTo?: string;
}>;

export function ProtectedRoute({ children, allowedRoles, redirectTo = '/login' }: ProtectedRouteProps) {
  const { loading, session } = useAuth();

  if (loading) {
    return (
      <div className="panel state-panel">
        <LoadingSkeleton title="Sitzung wird geprüft" compact rows={3} />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    const fallback = session.user.role === 'HOSPITAL_ADMIN' || session.user.role === 'SUPER_ADMIN' ? '/hospital' : '/nurse';
    return <Navigate to={redirectTo === '/login' ? fallback : redirectTo} replace />;
  }

  return <>{children}</>;
}
