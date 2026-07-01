import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import { fadeUp } from '~/utils/motion';

export function HeroContent() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 max-w-xl lg:max-w-7xl w-full">
      <motion.div
        {...fadeUp(0)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium tracking-widest uppercase mb-7"
        style={{
          background: 'rgba(74,222,128,0.08)',
          border: '1px solid rgba(74,222,128,0.25)',
          color: '#86efac',
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: '#4ade80' }}
        />
        Mansoura Open · Live Now
      </motion.div>

      <motion.h1
        {...fadeUp(0.1)}
        className="font-black w-1/2 uppercase leading-none mb-6"
        style={{
          fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
          letterSpacing: '-0.02em',
          lineHeight: 0.95,
        }}
      >
        <span style={{ color: '#f0f0f0' }}>The Race{' '}</span>
        <br />
        <span style={{ color: '#f0f0f0' }}>to </span>
        <span
          style={{
            color: '#eeb149',
            textShadow: '0 0 60px rgba(238,177,73,0.35)',
          }}
        >
          Season
          <br />2
        </span>
      </motion.h1>

      <motion.p
        {...fadeUp(0.2)}
        className="text-base leading-relaxed mb-8"
        style={{ color: '#777', maxWidth: '38ch' }}
      >
        Egypt's premier padel circuit returns. Track live rankings,
        follow every bracket, and chase the championship across three
        legendary courts.
      </motion.p>

      <motion.div {...fadeUp(0.3)} className="flex flex-wrap gap-3">
        <motion.button
          onClick={() => navigate('/rankings')}
          className="flex items-center gap-2 px-6 py-3 font-bold text-sm tracking-wide rounded-md"
          style={{
            background: 'linear-gradient(135deg, #eeb149 0%, #ca832a 100%)',
            color: '#0a0a0a',
            boxShadow: '0 4px 24px rgba(238,177,73,0.3)',
          }}
          whileHover={{ scale: 1.03, boxShadow: '0 6px 32px rgba(238,177,73,0.45)' }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          View Rankings →
        </motion.button>

        <motion.button
          onClick={() => navigate('/tournaments')}
          className="flex items-center gap-2 px-6 py-3 font-semibold text-sm tracking-wide rounded-md"
          style={{
            background: 'transparent',
            color: '#e5e5e5',
            border: '1px solid #2e2e2e',
          }}
          whileHover={{
            borderColor: 'rgba(238,177,73,0.4)',
            color: '#eeb149',
            background: 'rgba(238,177,73,0.05)',
          }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15 }}
        >
          Tournament Brackets
        </motion.button>
      </motion.div>
    </div>
  );
}
