import type { ReactNode } from 'react';
import { LoadingSkeleton } from './LoadingSkeleton';

type AsyncStateProps = {
  loading: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
};

export function AsyncState({ loading, error, isEmpty, emptyMessage, children }: AsyncStateProps) {
  if (loading) {
    return (
      <div className="panel state-panel">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return <div className="panel state-panel error-state">{error}</div>;
  }

  if (isEmpty) {
    return <div className="panel state-panel">{emptyMessage ?? 'Keine Daten vorhanden.'}</div>;
  }

  return <>{children}</>;
}
