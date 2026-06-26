import { useEffect, useState } from 'react';
import { useLocation, NavLink } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
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

const bezier = [0.22, 1, 0.36, 1] as const;
const GOLD = '#E8B53A';

const menuVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden:   { opacity: 0, x: -18 },
  visible:  { opacity: 1, x: 0, transition: { duration: 0.32, ease: bezier } },
};

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center w-5 h-4 gap-[5px]">
      <motion.span
        className="block w-full h-px bg-white origin-center"
        animate={open ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.25, ease: bezier }}
      />
      <motion.span
        className="block w-full h-px bg-white"
        animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.2 }}
      />
      <motion.span
        className="block w-full h-px bg-white origin-center"
        animate={open ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.25, ease: bezier }}
      />
    </div>
  );
}

function Logo() {
  return (
    <img src='logo.png'/>
  );
}

export function Navbar() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const y = window.scrollY;
    const b = document.body;
    b.style.overflow = 'hidden';
    b.style.position = 'fixed';
    b.style.top = `-${y}px`;
    b.style.width = '100%';
    return () => {
      b.style.overflow = '';
      b.style.position = '';
      b.style.top = '';
      b.style.width = '';
      window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior });
    };
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full @container bg-dpt-bg/90 backdrop-blur-[14px] border-b border-white/8">
        <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 2xl:px-32">
          <div className="flex items-center justify-between h-20 ">
            <NavLink to="/" aria-label="Delta Padel Tour home" className="no-underline w-12 h-12">
              <Logo />
            </NavLink>

            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.key}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => cn(
                    'inline-flex items-center px-4 py-2 rounded-lg text-[13.5px] font-semibold border transition-all duration-150 whitespace-nowrap no-underline',
                    isActive
                      ? 'text-amber-200 bg-amber-500/10 border-amber-500/30'
                      : 'text-[#8a8f9a] border-transparent hover:text-white hover:bg-white/5'
                  )}
                >
                  {item.label}
                </NavLink>
              ))}

              <div className="w-px h-5 mx-2 bg-white/10" />
            </nav>

            <button
              className="flex lg:hidden w-10 h-10 rounded-lg items-center justify-center cursor-pointer  border-white/12 bg-transparent transition-colors hover:bg-white/5"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              <HamburgerIcon open={menuOpen} />
            </button>
          </div>
        </div>

        {isAdmin && (
          <div className="border-t border-white/7 bg-dpt-gold/[4%]">
            <div className="px-6 sm:px-10 lg:px-16 xl:px-24 2xl:px-32 flex items-center gap-1 min-h-12">
              <span
                className="text-[10px] tracking-[0.15em] text-zinc-600 uppercase mr-2"
                style={{ fontFamily: "'Source Code Pro', monospace" }}
              >
                Console /
              </span>
              {ADMIN_TABS.map((tab) => (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  end
                  className={({ isActive }) => cn(
                    'px-3.5 py-3 text-[13.5px] font-semibold border-b-2 transition-all whitespace-nowrap no-underline',
                    isActive
                      ? 'text-amber-200 border-amber-400'
                      : 'text-zinc-500 border-transparent hover:text-white'
                  )}
                >
                  {tab.label}
                </NavLink>
              ))}
              <NavLink
                to="/"
                className="ml-auto px-3.5 py-1.5 text-[12.5px] font-semibold text-zinc-500 rounded-lg border border-white/10 hover:text-white hover:border-white/25 transition-all whitespace-nowrap no-underline"
              >
                ↗ View live site
              </NavLink>
            </div>
          </div>
        )}
      </header>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[99] flex flex-col bg-dpt-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Mirror the header bar */}
            <div className="flex items-center justify-between h-16 px-6 sm:px-10 lg:px-16 xl:px-24 2xl:px-32 shrink-0 border-b border-white/8">
              <NavLink to="/" aria-label="Delta Padel Tour home" className="no-underline">
                <Logo />
              </NavLink>
              <button
                className="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer border border-white/12 bg-transparent"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                <HamburgerIcon open />
              </button>
            </div>

            <motion.div
              className="flex flex-col px-6 py-8 gap-3 overflow-y-auto flex-1"
              variants={menuVariants}
              initial="hidden"
              animate="visible"
            >
              {NAV_ITEMS.map((item) => (
                <motion.div key={item.key} variants={itemVariants}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) => cn(
                      'block w-full px-5 py-4 rounded-xl text-xl font-bold border transition-colors no-underline',
                      isActive
                        ? 'text-amber-200 bg-amber-500/10 border-amber-500/30'
                        : 'text-[#c0c0c8] border-white/8 hover:text-white hover:bg-white/5'
                    )}
                  >
                    {item.label}
                  </NavLink>
                </motion.div>
              ))}

              <motion.div variants={itemVariants} className="mt-2">
                <div className="w-full h-px mb-4 bg-white/8" />
                <NavLink
                  to="/admin"
                  className={cn(
                    'flex items-center gap-3 w-full px-5 py-4 rounded-xl text-xl font-bold border transition-colors no-underline',
                    isAdmin
                      ? 'text-amber-200 bg-amber-500/10 border-amber-500/30'
                      : 'text-[#c0c0c8] border-white/15 hover:text-white hover:bg-white/5'
                  )}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: isAdmin ? GOLD : '#555' }}
                  />
                  Admin Console
                </NavLink>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
