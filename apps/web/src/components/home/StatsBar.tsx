import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate, useInView } from 'framer-motion';
import { Card } from '@dpt/ui/components/ui/card';
import { getPlayers, getCompletedMatchesCount } from '@dpt/db';

const static_stats = [{ label: 'Tour Stops', target: 2, suffix: '' },
    { label: 'Total Prize Pool', target: 250, suffix: 'K' }
    ];

function CountUp({
  target,
  suffix = '',
  delay = 0,
  inView,
}: {
  target: number;
  suffix?: string;
  delay?: number;
  inView: boolean;
}) {
  const count = useMotionValue(0);
  const display = useTransform(count, (v) => `${Math.round(v).toLocaleString()}${suffix}`);
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    const timer = setTimeout(() => {
      const controls = animate(count, target, {
        duration: 3.5,
        ease: [0.16, 1, 0.3, 1],
      });
      return controls.stop;
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [inView, count, target, delay]);

  return <motion.span>{display}</motion.span>;
}

export function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const [playerCount, setPlayerCount] = useState(0);
  const [matchesPlayed, setMatchesPlayed] = useState(0);

  useEffect(() => {
    getPlayers().then((players) => setPlayerCount(players.length)).catch(console.error);
    getCompletedMatchesCount().then(setMatchesPlayed).catch(console.error);
  }, []);

  const stats = [
    { label: 'Registered Players', target: playerCount, suffix: '' },
    ...static_stats,
//     { label: 'Matches Played', target: matchesPlayed, suffix: '' },
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full border-t border-[#1a1a1a] bg-black/60"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-0">
          {stats.map((stat, i) => (
            <Card
              key={stat.label}
              className="flex flex-col items-center justify-center border-l py-7 px-4 text-center rounded-lg border-[#1a1a1a] bg-black/40"
            >
              <span className="font-black italic mb-2 leading-none tracking-[-0.03em] text-[clamp(2rem,4vw,3.25rem)] text-gold">
                <CountUp key={`${stat.label}-${stat.target}`} target={stat.target} suffix={stat.suffix} delay={i * 0.1} inView={inView} />
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
