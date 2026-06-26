import { motion } from 'framer-motion';
import heroEmblem from '../../assets/hero.png';

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
        <img
          src={heroEmblem}
          alt="Delta Padel Tour Season 2 2026"
          className="relative w-full h-full object-contain drop-shadow-2xl"
          style={{ filter: 'drop-shadow(0 0 40px rgba(238,177,73,0.2))' }}
        />
      </motion.div>
    </motion.div>
  );
}
