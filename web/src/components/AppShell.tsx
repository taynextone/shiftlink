import { Link, useLocation } from 'react-router-dom';
import type { PropsWithChildren } from 'react';

const navGroups = [
  {
    label: 'Pflegekraft',
    items: [
      { to: '/nurse', label: 'Dashboard' },
      { to: '/nurse/jobs', label: 'Einsätze' },
      { to: '/nurse/matches', label: 'Angebote' },
      { to: '/nurse/profile', label: 'Profil' },
    ],
  },
  {
    label: 'Hospital',
    items: [
      { to: '/hospital', label: 'Dashboard' },
      { to: '/hospital/shifts', label: 'Schichten' },
      { to: '/hospital/offers', label: 'Offers' },
      { to: '/hospital/contracts', label: 'Verträge' },
    ],
  },
];

export function AppShell({ children }: PropsWithChildren) {
  const location = useLocation();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div>
            <strong>Shiftlink</strong>
            <p>Pflege-Matching</p>
          </div>
        </div>
        <nav className="stack small-gap">
          {navGroups.map((group) => (
            <div key={group.label} className="stack tiny-gap">
              <span className="section-label">{group.label}</span>
              {group.items.map((item) => (
                <Link key={item.to} className={location.pathname === item.to ? 'nav-link active' : 'nav-link'} to={item.to}>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
