import { Link, useLocation } from 'react-router-dom';
import type { PropsWithChildren } from 'react';

const navItems = [
  { to: '/nurse', label: 'Dashboard' },
  { to: '/nurse/jobs', label: 'Einsätze' },
  { to: '/nurse/matches', label: 'Angebote' },
  { to: '/nurse/profile', label: 'Profil' },
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
        <nav>
          {navItems.map((item) => (
            <Link key={item.to} className={location.pathname === item.to ? 'nav-link active' : 'nav-link'} to={item.to}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
