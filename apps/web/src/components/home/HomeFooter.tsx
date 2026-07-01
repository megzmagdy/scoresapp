import { MONO } from '~/lib/theme';

export function HomeFooter() {
  return (
    <footer className="bg-dpt-bg border-t border-white/6 py-8">
      <div className="container flex items-center justify-between gap-6 flex-wrap">
        <div className="flex items-center gap-3.5">
          <img
            src="/logo.png"
            alt="Delta Padel Tour"
            className="w-10 h-10 object-contain"
          />
          <div>
            <p
              className="text-[10px] uppercase tracking-[0.15em] text-[#888] mb-0.5"
              style={{ fontFamily: MONO }}
            >
              Delta Padel Tour · Season 2 · 2026
            </p>
            <p
              className="text-[10px] tracking-widest text-dim"
              style={{ fontFamily: MONO }}
            >
              Mansoura · Egypt
            </p>
          </div>
        </div>

        <p
          className="text-[10px] text-[#444] tracking-wider"
          style={{ fontFamily: MONO }}
        >
          © 2026 Delta Padel Tour. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
