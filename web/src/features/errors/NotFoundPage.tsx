import { Link } from 'react-router-dom';
import { useAuth } from '../../state/AuthContext';

export function NotFoundPage() {
  const { session } = useAuth();
  const homePath = session
    ? session.role === 'NURSE'
      ? '/nurse'
      : '/hospital'
    : '/';

  return (
    <section className="empty-state" style={{ minHeight: '60vh', textAlign: 'center' }}>
      <h2 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>404</h2>
      <h3 style={{ marginBottom: '1rem' }}>Seite nicht gefunden</h3>
      <p style={{ marginBottom: '1.5rem' }}>Diese Seite existiert nicht oder wurde verschoben.</p>
      <Link to={homePath} className="landing-btn landing-btn-primary" style={{ display: 'inline-flex' }}>
        → Zur Startseite
      </Link>
    </section>
  );
}
