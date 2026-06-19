import { Outlet, NavLink } from 'react-router';
import { supabase } from '@dpt/db';

const NAV = [
  { to: '/rankings', label: 'Rankings' },
  { to: '/players', label: 'Players' },
  { to: '/teams', label: 'Teams' },
  { to: '/tournaments', label: 'Tournaments' },
  { to: '/announcements', label: 'Announcements' },
];

export function AdminLayout() {
  return (
    <div style={{ display: 'flex' }}>
      <nav style={{ width: 160, padding: 16 }}>
        <strong>DPT Admin</strong>
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 16 }}>
          {NAV.map(({ to, label }) => (
            <li key={to}>
              <NavLink to={to}>{label}</NavLink>
            </li>
          ))}
        </ul>
        <button onClick={() => supabase.auth.signOut()}>Sign out</button>
      </nav>
      <main style={{ flex: 1, padding: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}
