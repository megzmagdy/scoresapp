import { cn } from '@/lib/utils';
import { GOLD, MONO, ARCHIVO } from '~/lib/theme';

const rewards = [
  { rank: 1, label: 'Champion',      image: '/first.png',  color: GOLD      },
  { rank: 2, label: 'Runner-Up',     image: '/second.png', color: '#C0C0C0' },
  { rank: 3, label: 'Semi-Finalist', image: '/third.png',  color: '#CD7F32' },
];

const PODIUM_ORDER = [1, 0, 2];

export function RewardsSection() {
  return (
    <section className="bg-dpt-bg court-mesh py-20 border-t border-white/4">
      <div className="mx-auto container">
        <p
          className="text-[11px] uppercase tracking-[0.2em] text-dpt-gold mb-2"
          style={{ fontFamily: MONO }}
        >
          // Rewards
        </p>
        <h2
          className="text-4xl sm:text-5xl font-black italic uppercase leading-none text-[#f0f0f0] mb-3"
          style={{ fontFamily: ARCHIVO }}
        >
          The Race Rewards
        </h2>
        <p className="text-sm text-[#666] max-w-[50ch] leading-relaxed mb-10">
          Points accumulate across every leg. The top of the table at season's end
          takes home the gear.
        </p>

        <div className="flex flex-wrap items-end justify-center gap-5">
          {PODIUM_ORDER.map((idx) => {
            const r = rewards[idx];
            const isFirst = r.rank === 1;
            return (
              <div
                key={r.rank}
                className={cn(
                  'relative flex-1 min-w-57.5 max-w-75 rounded-2xl overflow-hidden transition-transform',
                  isFirst && 'sm:scale-[1.08] z-10'
                )}
                style={{
                  border: `1px solid ${r.color}40`,
                  boxShadow: isFirst ? `0 0 60px ${GOLD}1f` : `0 0 30px rgba(0,0,0,0.4)`,
                }}
              >
                <div className="relative aspect-576/876 w-full overflow-hidden">
                  <img
                    src={r.image}
                    alt={`${r.label} prize`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
