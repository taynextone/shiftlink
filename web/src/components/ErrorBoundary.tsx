import { Component, type PropsWithChildren, type ReactNode } from 'react';

type ErrorBoundaryProps = PropsWithChildren<{ fallback?: ReactNode }>;
type ErrorBoundaryState = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="empty-state" role="alert">
          <h2>Ein Fehler ist aufgetreten</h2>
          <p>Bitte laden die Seite neu oder kontaktiere den Support.</p>
          {this.state.error?.message ? (
            <p className="hint">{this.state.error.message}</p>
          ) : null}
        </div>
      );
    }
    return this.props.children;
  }
}
