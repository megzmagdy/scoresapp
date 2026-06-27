import { motion } from 'framer-motion';

const GOLD = '#E8B53A';
const ARCHIVO = "'Archivo', sans-serif";
const MONO = "'Source Code Pro', monospace";

function DPTEmblemSVG() {
  return (
    <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="e-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={GOLD} stopOpacity="0.22" />
          <stop offset="60%"  stopColor={GOLD} stopOpacity="0.06" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="e-court" cx="50%" cy="50%" r="70%">
          <stop offset="0%"   stopColor={GOLD} stopOpacity="0.05" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient glow */}
      <circle cx="150" cy="150" r="150" fill="url(#e-glow)" />

      {/* Outermost halo */}
      <circle cx="150" cy="150" r="146" stroke={GOLD} strokeOpacity="0.08" strokeWidth="1" />

      {/* Primary border ring */}
      <circle cx="150" cy="150" r="136" stroke={GOLD} strokeOpacity="0.72" strokeWidth="2" />

      {/* Secondary inner ring */}
      <circle cx="150" cy="150" r="126" stroke={GOLD} strokeOpacity="0.2" strokeWidth="0.75" />

      {/* Top arch: DELTA · PADEL · TOUR */}
      <path id="e-arc-top" d="M 28,150 A 122,122 0 0,1 272,150" />
      <text fontFamily={MONO} fontSize="8.5" letterSpacing="4.5" fill={GOLD} fillOpacity="0.65">
        <textPath href="#e-arc-top" startOffset="50%" textAnchor="middle">
          DELTA · PADEL · TOUR
        </textPath>
      </text>

      {/* Bottom arch: SEASON 2 · 2026 */}
      <path id="e-arc-btm" d="M 44,150 A 106,106 0 0,0 256,150" />
      <text fontFamily={MONO} fontSize="7.5" letterSpacing="3" fill={GOLD} fillOpacity="0.4">
        <textPath href="#e-arc-btm" startOffset="50%" textAnchor="middle">
          SEASON 2 · 2026
        </textPath>
      </text>

      {/* Crown tick + dot */}
      <line x1="150" y1="15" x2="150" y2="26" stroke={GOLD} strokeOpacity="0.55" strokeWidth="1.5" />
      <circle cx="150" cy="14" r="2" fill={GOLD} fillOpacity="0.45" />

      {/* Base tick + dot */}
      <line x1="150" y1="274" x2="150" y2="263" stroke={GOLD} strokeOpacity="0.4" strokeWidth="1.5" />
      <circle cx="150" cy="276" r="2" fill={GOLD} fillOpacity="0.35" />

      {/* ── Padel court top-down ── */}
      {/* Court 160×80 centered at (150,142): x 70–230, y 102–182 */}
      <rect x="70" y="102" width="160" height="80"
        stroke={GOLD} strokeOpacity="0.42" strokeWidth="1.25" fill="url(#e-court)" />

      {/* Glass back walls */}
      <line x1="70"  y1="102" x2="70"  y2="182" stroke={GOLD} strokeOpacity="0.75" strokeWidth="3.5" />
      <line x1="230" y1="102" x2="230" y2="182" stroke={GOLD} strokeOpacity="0.75" strokeWidth="3.5" />

      {/* Net */}
      <line x1="150" y1="102" x2="150" y2="182" stroke={GOLD} strokeOpacity="0.55" strokeWidth="1.5" />
      <circle cx="150" cy="102" r="2.5" fill={GOLD} fillOpacity="0.6" />
      <circle cx="150" cy="182" r="2.5" fill={GOLD} fillOpacity="0.6" />

      {/* Service lines: 7m from wall = 56px in 160px court */}
      <line x1="126" y1="102" x2="126" y2="182" stroke="white" strokeOpacity="0.18" strokeWidth="0.75" />
      <line x1="174" y1="102" x2="174" y2="182" stroke="white" strokeOpacity="0.18" strokeWidth="0.75" />

      {/* Centre service line */}
      <line x1="126" y1="142" x2="174" y2="142" stroke="white" strokeOpacity="0.18" strokeWidth="0.75" />

      {/* DPT watermark inside court */}
      <text
        x="150" y="149"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily={ARCHIVO}
        fontSize="24"
        fontWeight="900"
        fontStyle="italic"
        fill={GOLD}
        fillOpacity="0.16"
        letterSpacing="5"
      >
        DPT
      </text>
    </svg>
  );
}

export function HeroEmblem() {
  return (
    <motion.div
      className="shrink-0 flex items-center justify-center w-full lg:w-auto"
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
    >
      <motion.div
        animate={{ rotate: [0, 1, -1, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
        style={{ width: 'clamp(260px, 38vw, 480px)', aspectRatio: '1' }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(238,177,73,0.15) 30%, transparent 70%)',
            filter: 'blur(30px)',
            transform: 'scale(1.1)',
          }}
        />
        <DPTEmblemSVG />
      </motion.div>
    </motion.div>
  );
}
