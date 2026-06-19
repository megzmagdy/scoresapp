import { Outlet, NavLink } from 'react-router';

export function Layout() {
  return (
    <div>
      <nav>
        <NavLink to="/">Home</NavLink>
        {' | '}
        <NavLink to="/rankings">Rankings</NavLink>
        {' | '}
        <NavLink to="/tournaments">Tournaments</NavLink>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
