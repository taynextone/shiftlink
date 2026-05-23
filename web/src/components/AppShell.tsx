import { Link, useLocation } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { useAuth } from '../state/AuthContext';

const navGroups = [
  {
    label: 'Pflegekraft',
    roles: ['NURSE'],
    items: [
      { to: '/nurse', label: 'Dashboard', caption: 'Status & Überblick' },
      { to: '/nurse/jobs', label: 'Einsätze', caption: 'Verfügbare Bedarfe' },
      { to: '/nurse/availability', label: 'Verfügbarkeiten', caption: 'Matching-Zeitfenster' },
      { to: '/nurse/matches', label: 'Angebote', caption: 'Offers & Antworten' },
      { to: '/nurse/profile', label: 'Profil', caption: 'Verifikation & Freigabe' },
    ],
  },
  {
    label: 'Krankenhaus',
    roles: ['HOSPITAL_ADMIN', 'SUPER_ADMIN'],
    items: [
      { to: '/hospital', label: 'Dashboard', caption: 'Operativer Überblick' },
      { to: '/hospital/shifts', label: 'Schichten', caption: 'Bedarfe & Import' },
      { to: '/hospital/offers', label: 'Offers', caption: 'Kandidaten & Angebote' },
      { to: '/hospital/dossier', label: 'Dossiers', caption: 'Verifizierte Profile' },
      { to: '/hospital/contracts', label: 'Verträge', caption: 'Lifecycle & Aktionen' },
      { to: '/hospital/billing', label: 'Billing', caption: 'Gebühren & Exporte' },
    ],
  },
  {
    label: 'Superadmin',
    roles: ['SUPER_ADMIN'],
    items: [
      { to: '/admin/verification', label: 'Verification Ops', caption: 'Review, Release, Intervention' },
      { to: '/admin/ops', label: 'Ops Control Plane', caption: 'Hotspots, Failures, Prioritäten' },
    ],
  },
];

export function AppShell({ children }: PropsWithChildren) {
  const location = useLocation();
  const { session, logout } = useAuth();

  const visibleGroups = session
    ? navGroups.filter((group) => group.roles.includes(session.role))
    : [];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand-card">
            <div className="brand-mark">S</div>
            <div>
              <strong>Shiftlink</strong>
              <p>Direct staffing marketplace for hospitals and nurses</p>
            </div>
          </div>
          <div className="workspace-card">
            <span className="workspace-label">Workspace</span>
            <strong>Operations Console</strong>
            <p>Matching, contracts, verification and platform-fee workflows.</p>
          </div>
          <div className="workspace-card session-card">
            <span className="workspace-label">Session</span>
            <strong>{session ? session.role : 'Nicht eingeloggt'}</strong>
            <p>{session ? `User ID: ${session.userId}` : 'Bitte anmelden, um geschützte Produktbereiche zu öffnen.'}</p>
            {session ? <button className="secondary ghost-button" onClick={() => void logout()}>Logout</button> : null}
          </div>
        </div>
        <nav className="nav-groups">
          {visibleGroups.map((group) => (
            <section key={group.label} className="nav-group">
              <span className="section-label">{group.label}</span>
              <div className="nav-list">
                {group.items.map((item) => {
                  const active = location.pathname === item.to;
                  return (
                    <Link key={item.to} className={active ? 'nav-link active' : 'nav-link'} to={item.to}>
                      <span className="nav-link-title">{item.label}</span>
                      <span className="nav-link-caption">{item.caption}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
          {!session ? (
            <section className="nav-group">
              <span className="section-label">Zugang</span>
              <div className="nav-list">
                <Link className={location.pathname === '/login' ? 'nav-link active' : 'nav-link'} to="/login">
                  <span className="nav-link-title">Login</span>
                  <span className="nav-link-caption">Bestehenden Zugang verwenden</span>
                </Link>
                <Link className={location.pathname === '/register' ? 'nav-link active' : 'nav-link'} to="/register">
                  <span className="nav-link-title">Registrierung</span>
                  <span className="nav-link-caption">Neue Pflegekraft anlegen</span>
                </Link>
              </div>
            </section>
          ) : null}
        </nav>
      </aside>
      <main className="content">
        <div className="content-inner">{children}</div>
      </main>
    </div>
  );
}
