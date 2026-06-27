import { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@dpt/db';

const NAV_ITEMS = [
  { label: 'Rankings',      path: '/rankings' },
  { label: 'Players',       path: '/players' },
  { label: 'Teams',         path: '/teams' },
  { label: 'Tournaments',   path: '/tournaments' },
  { label: 'Announcements', path: '/announcements' },
] as const;

const bezier = [0.22, 1, 0.36, 1] as const;
const MONO = "'Source Code Pro', monospace";
const ARCHIVO = "'Archivo', sans-serif";

const menuVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -18 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.32, ease: bezier } },
};

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <div className="flex flex-col items-center w-5 gap-1.25">
      <motion.span
        className="block w-full bg-white"
        style={{ height: 1.5, transformOrigin: 'center' }}
        animate={open ? { rotate: 45, y: 6.5 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.25, ease: bezier }}
      />
      <motion.span
        className="block w-full bg-white"
        style={{ height: 1.5 }}
        animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.2 }}
      />
      <motion.span
        className="block w-full bg-white"
        style={{ height: 1.5, transformOrigin: 'center' }}
        animate={open ? { rotate: -45, y: -6.5 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.25, ease: bezier }}
      />
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(232,181,58,0.15) 0%, rgba(232,181,58,0.05) 100%)',
          border: '1.5px solid rgba(232,181,58,0.35)',
          boxShadow: '0 0 16px rgba(232,181,58,0.15)',
        }}
      >
        <span
          className="text-[12px] font-black italic text-dpt-gold"
          style={{ fontFamily: ARCHIVO }}
        >
          DPT
        </span>
      </div>
      <div className="flex flex-col leading-none">
        <span
          className="text-base font-black italic uppercase tracking-[0.04em] text-white"
          style={{ fontFamily: ARCHIVO }}
        >
          Delta Padel Tour
        </span>
        <span
          className="mt-1 text-[10px] uppercase tracking-[0.2em] text-dpt-gold"
          style={{ fontFamily: MONO }}
        >
          ADMIN · SEASON 2
        </span>
      </div>
    </div>
  );
}

export function AdminLayout() {
  const { pathname } = useLocation();
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
    <div className="min-h-screen flex flex-col bg-dpt-bg">
      <header className="sticky top-0 z-50 w-full bg-[#0b0c0f]/90 backdrop-blur-[14px] border-b border-white/8">
        <div className="container">
          <div className="flex items-center justify-between h-17">
            <NavLink to="/" aria-label="DPT Admin" className="no-underline">
              <Logo />
            </NavLink>

            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => cn(
                    'inline-flex items-center px-4 py-2 rounded-lg text-[13.5px] font-semibold border transition-all whitespace-nowrap no-underline',
                    isActive
                      ? 'text-amber-200 bg-amber-500/10 border-amber-500/30'
                      : 'text-[#8a8f9a] border-transparent hover:text-white hover:bg-white/5'
                  )}
                >
                  {item.label}
                </NavLink>
              ))}

              <div className="w-px h-5 mx-1.5 bg-white/10" />

              <button
                onClick={() => supabase.auth.signOut()}
                className="inline-flex items-center px-4 py-2 rounded-lg text-[13.5px] font-bold border border-white/15 bg-transparent text-[#8a8f9a] hover:text-white hover:bg-white/5 transition-all cursor-pointer whitespace-nowrap"
              >
                Sign out
              </button>
            </nav>

            <button
              className="flex lg:hidden w-10 h-10 rounded-lg items-center justify-center cursor-pointer bg-transparent border border-white/12 transition-colors hover:bg-white/5"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              <HamburgerIcon open={menuOpen} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-99 flex flex-col bg-dpt-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="container flex items-center justify-between h-17 shrink-0 w-full border-b border-white/8">
              <NavLink to="/" aria-label="DPT Admin" className="no-underline">
                <Logo />
              </NavLink>
              <button
                className="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer bg-transparent border border-white/12"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                <HamburgerIcon open />
              </button>
            </div>

            <motion.div
              className="container flex flex-col py-8 gap-3 overflow-y-auto flex-1"
              variants={menuVariants}
              initial="hidden"
              animate="visible"
            >
              {NAV_ITEMS.map((item) => (
                <motion.div key={item.path} variants={itemVariants}>
                  <NavLink
                    to={item.path}
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
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="w-full text-left px-5 py-4 rounded-xl text-xl font-bold border border-white/8 bg-transparent text-[#c0c0c8] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
