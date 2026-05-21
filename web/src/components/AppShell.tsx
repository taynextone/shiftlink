import { Link, useLocation } from 'react-router-dom';
import type { PropsWithChildren } from 'react';

const navGroups = [
  {
    label: 'Pflegekraft',
    items: [
      { to: '/nurse', label: 'Dashboard', caption: 'Status & Überblick' },
      { to: '/nurse/jobs', label: 'Einsätze', caption: 'Verfügbare Bedarfe' },
      { to: '/nurse/matches', label: 'Angebote', caption: 'Offers & Antworten' },
      { to: '/nurse/profile', label: 'Profil', caption: 'Verifikation & Freigabe' },
    ],
  },
  {
    label: 'Krankenhaus',
    items: [
      { to: '/hospital', label: 'Dashboard', caption: 'Operativer Überblick' },
      { to: '/hospital/shifts', label: 'Schichten', caption: 'Bedarfe & Import' },
      { to: '/hospital/offers', label: 'Offers', caption: 'Kandidaten & Angebote' },
      { to: '/hospital/contracts', label: 'Verträge', caption: 'Lifecycle & Aktionen' },
    ],
  },
];

export function AppShell({ children }: PropsWithChildren) {
  const location = useLocation();

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
        </div>
        <nav className="nav-groups">
          {navGroups.map((group) => (
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
        </nav>
      </aside>
      <main className="content">
        <div className="content-inner">{children}</div>
      </main>
    </div>
  );
}
