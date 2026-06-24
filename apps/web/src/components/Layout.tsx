import { Outlet } from 'react-router';
import { Navbar } from './Navbar';

export function Layout() {
  return (
    <div className="min-h-screen" style={{ background: '#0b0c0f' }}>
      <Navbar />
      <Outlet />
    </div>
  );
}
