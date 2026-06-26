import { Link, useLocation } from 'react-router-dom';
import { useState, type PropsWithChildren } from 'react';
import { useAuth } from '../state/AuthContext';

const navGroups = [
  {
    label: 'Pflegekraft',
    roles: ['NURSE'],
    items: [
      { to: '/nurse', label: 'Dashboard', caption: 'Status & Überblick' },
      { to: '/nurse/jobs', label: 'Einsätze', caption: 'Verfügbare Bedarfe' },
      { to: '/nurse/availability', label: 'Verfügbarkeiten', caption: 'Matching-Zeitfenster' },
      { to: '/nurse/matches', label: 'Angebote', caption: 'Anfragen & Antworten' },
      { to: '/nurse/profile', label: 'Profil', caption: 'Verifikation & Freigabe' },
      { to: '/nurse/contracts', label: 'Verträge', caption: 'Meine Verträge & Signatur' },
    ],
  },
  {
    label: 'Krankenhaus',
    roles: ['HOSPITAL_ADMIN', 'SUPER_ADMIN'],
    items: [
      { to: '/hospital', label: 'Dashboard', caption: 'Operativer Überblick' },
      { to: '/hospital/shifts', label: 'Schichten', caption: 'Bedarfe & Import' },
      { to: '/hospital/offers', label: 'Angebote', caption: 'Kandidaten & Zusagen' },
      { to: '/hospital/dossier', label: 'Dossiers', caption: 'Verifizierte Profile' },
      { to: '/hospital/contracts', label: 'Verträge', caption: 'Lifecycle & Aktionen' },
      { to: '/hospital/billing', label: 'Abrechnung', caption: 'Gebühren & Exporte' },
    ],
  },
  {
    label: 'Superadmin',
    roles: ['SUPER_ADMIN'],
    items: [
      { to: '/admin/verification', label: 'Verifikation', caption: 'Prüfung, Freigabe, Intervention' },
      { to: '/admin/ops', label: 'Betrieb', caption: 'Hotspots, Fehler, Prioritäten' },
    ],
  },
];

export function AppShell({ children }: PropsWithChildren) {
  const location = useLocation();
  const { session, user, logout } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  const visibleGroups = session
    ? navGroups.filter((group) => group.roles.includes(session.role))
    : [];

  return (
    <div className="app-shell">
      <aside className={navOpen ? 'sidebar sidebar-open' : 'sidebar'}>
        <div className="sidebar-top">
          <div className="brand-card">
            <div className="brand-mark">S</div>
            <div>
              <strong>Shiftlink</strong>
              <p>Kurzfristige Dienste direkt zwischen Pflegekräften und Einrichtungen besetzen</p>
            </div>
          </div>
          <button
            type="button"
            className="mobile-nav-toggle"
            aria-label={navOpen ? 'Navigation schließen' : 'Navigation öffnen'}
            aria-expanded={navOpen}
            onClick={() => setNavOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
          <div className="workspace-card">
            <span className="workspace-label">Arbeitsbereich</span>
            <strong>Einsatzsteuerung</strong>
            <p>Matching, Verträge, Verifikation und Abrechnung in einem operativen Ablauf.</p>
          </div>
          <div className="workspace-card session-card">
            <span className="workspace-label">Sitzung</span>
            <strong>{session ? (user?.email ?? session.role) : 'Nicht eingeloggt'}</strong>
            <p>{session ? (session.role === 'NURSE' ? 'Pflegekraft' : session.role === 'HOSPITAL_ADMIN' ? 'Krankenhaus' : 'Superadmin') : 'Bitte anmelden, um geschützte Produktbereiche zu öffnen.'}</p>
            {session ? <button className="secondary ghost-button" onClick={() => void logout()}>Abmelden</button> : null}
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
                    <Link
                      key={item.to}
                      className={active ? 'nav-link active' : 'nav-link'}
                      to={item.to}
                      onClick={() => setNavOpen(false)}
                    >
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
                <Link className={location.pathname === '/' ? 'nav-link active' : 'nav-link'} to="/" onClick={() => setNavOpen(false)}>
                  <span className="nav-link-title">Startseite</span>
                  <span className="nav-link-caption">Produktüberblick für Pflegekräfte und Kliniken</span>
                </Link>
                <Link className={location.pathname === '/login' ? 'nav-link active' : 'nav-link'} to="/login" onClick={() => setNavOpen(false)}>
                  <span className="nav-link-title">Login</span>
                  <span className="nav-link-caption">Bestehenden Zugang verwenden</span>
                </Link>
                <Link className={location.pathname === '/register' ? 'nav-link active' : 'nav-link'} to="/register" onClick={() => setNavOpen(false)}>
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
