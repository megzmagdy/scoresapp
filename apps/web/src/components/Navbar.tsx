import { useLocation, NavLink } from 'react-router';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { key: 'home',     label: 'Home',     path: '/' },
  { key: 'rankings', label: 'Rankings', path: '/rankings' },
  { key: 'brackets', label: 'Brackets', path: '/brackets' },
] as const;

const ADMIN_TABS = [
  { label: 'Tournaments',     path: '/admin' },
  { label: 'Bracket Builder', path: '/admin/brackets' },
  { label: 'Points',          path: '/admin/points' },
] as const;

export function Navbar() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-50 w-full" style={{ background: 'rgba(11,12,15,0.82)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-5 flex-wrap">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-3 mr-auto" aria-label="Delta Padel Tour home">
          <img
            src="/assets/dpt-logo.png"
            alt="Delta Padel Tour"
            className="h-11 w-auto"
            style={{ filter: 'drop-shadow(0 2px 8px rgba(232,181,58,0.25))' }}
          />
          <div className="flex flex-col leading-none">
            <span className="text-[17px] font-black uppercase italic tracking-wide">Delta Padel Tour</span>
            <span className="mt-1 font-mono text-[10.5px] tracking-[2px]" style={{ color: '#E8B53A' }}>SEASON 2 · 2026</span>
          </div>
        </NavLink>

        {/* Public nav */}
        <nav className="flex flex-wrap items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => cn(
                'px-4 py-2 rounded-lg text-[13.5px] font-semibold border transition-all',
                isActive
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                  : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
              )}
            >
              {item.label}
            </NavLink>
          ))}

          <div className="w-px h-5 mx-1.5 bg-white/10" />

          <NavLink
            to="/admin"
            className={({ isActive }) => cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-[13.5px] font-bold border transition-all',
              isActive
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                : 'border-white/15 text-zinc-400 hover:text-white hover:bg-white/5'
            )}
          >
            {({ isActive }) => (
              <>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: isActive ? '#E8B53A' : '#6c6e76' }}
                />
                Admin Console
              </>
            )}
          </NavLink>
        </nav>
      </div>

      {/* Admin sub-tabs */}
      {isAdmin && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(232,181,58,0.04)' }}>
          <div className="max-w-7xl mx-auto px-6 flex items-center gap-1 flex-wrap min-h-12.5">
            <span className="font-mono text-[11px] tracking-[1.5px] text-zinc-600 uppercase mr-2">Console /</span>
            {ADMIN_TABS.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                end
                className={({ isActive }) => cn(
                  'px-3.5 py-3 text-[13.5px] font-semibold border-b-2 transition-all',
                  isActive
                    ? 'text-amber-300 border-amber-400'
                    : 'text-zinc-500 border-transparent hover:text-white'
                )}
              >
                {tab.label}
              </NavLink>
            ))}
            <NavLink
              to="/"
              className="ml-auto px-3.5 py-1.5 text-[12.5px] font-semibold text-zinc-500 rounded-lg border border-white/10 hover:text-white hover:border-white/25 transition-all"
            >
              <span aria-hidden="true">↗</span> View live site
            </NavLink>
          </div>
        </div>
      )}
    </header>
  );
}
