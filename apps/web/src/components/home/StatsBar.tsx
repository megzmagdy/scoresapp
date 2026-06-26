import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Card } from '@dpt/ui/components/ui/card';

const stats = [
  { label: 'Registered Players', target: 128, suffix: '' },
  { label: 'Tour Stops', target: 3, suffix: '' },
  { label: 'Prize Pool (EGP)', target: 250, suffix: 'K' },
  { label: 'Matches Played', target: 48, suffix: '' },
];

function CountUp({
  target,
  suffix = '',
  delay = 0,
}: {
  target: number;
  suffix?: string;
  delay?: number;
}) {
  const count = useMotionValue(0);
  const display = useTransform(count, (v) => `${Math.round(v).toLocaleString()}${suffix}`);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const timer = setTimeout(() => {
      const controls = animate(count, target, {
        duration: 1.6,
        ease: [0.16, 1, 0.3, 1],
      });
      return controls.stop;
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [count, target, delay]);

  return <motion.span>{display}</motion.span>;
}

export function StatsBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full border-t border-[#1a1a1a] bg-black/60"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
          {stats.map((stat, i) => (
            <Card
              key={stat.label}
              className="flex flex-col items-center justify-center border-l py-7 px-4 text-center rounded-lg border-[#1a1a1a] bg-black/40"
            >
              <span className="font-black italic mb-2 leading-none tracking-[-0.03em] text-[clamp(2rem,4vw,3.25rem)] text-gold">
                <CountUp target={stat.target} suffix={stat.suffix} delay={0.75 + i * 0.06} />
              </span>
              <span className="font-medium uppercase text-[0.62rem] tracking-[0.18em] text-[#555]">
                {stat.label}
              </span>
            </Card>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
