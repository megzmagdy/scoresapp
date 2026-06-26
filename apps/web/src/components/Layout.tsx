import { Outlet } from 'react-router';
import { Navbar } from './Navbar';

export function Layout() {
  return (
    <div className="min-h-screen bg-dpt-bg">
      <Navbar />
      <Outlet />
    </div>
  );
}
