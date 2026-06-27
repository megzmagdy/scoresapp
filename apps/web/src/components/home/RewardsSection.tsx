import { GOLD, MONO, ARCHIVO } from '~/lib/theme';

const rewards = [
  { rank: 1, label: 'Champion',      prize: 'EGP 120K', points: '2,000 ranking points', emoji: '🥇', color: GOLD      },
  { rank: 2, label: 'Runner-Up',     prize: 'EGP 70K',  points: '1,200 ranking points', emoji: '🥈', color: '#C0C0C0' },
  { rank: 3, label: 'Semi-Finalist', prize: 'EGP 40K',  points: '720 ranking points',   emoji: '🥉', color: '#CD7F32' },
];

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
          Points accumulate across every leg. The top of the table at season's end claims
          the championship purse.
        </p>

        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {rewards.map((r) => (
            <div
              key={r.rank}
              className="relative overflow-hidden bg-[#111] rounded-[10px] p-6"
              style={{ border: `1px solid ${r.color}25` }}
            >
              <div
                aria-hidden
                className="absolute right-3 -top-4 text-[140px] font-black italic leading-none pointer-events-none select-none text-white/2.5"
                style={{ fontFamily: ARCHIVO }}
              >
                {r.rank}
              </div>

              <div
                className="w-13 h-13 rounded-xl flex items-center justify-center text-[26px] mb-4"
                style={{ background: `${r.color}18`, border: `1.5px solid ${r.color}35` }}
              >
                {r.emoji}
              </div>

              <p
                className="text-[10px] uppercase tracking-[0.18em] mb-2"
                style={{ fontFamily: MONO, color: r.color }}
              >
                {r.label}
              </p>

              <p
                className="text-[40px] font-black italic text-[#f0f0f0] leading-none mb-2 tracking-tight"
                style={{ fontFamily: ARCHIVO }}
              >
                {r.prize}
              </p>

              <p className="text-[13px] text-[#555]">{r.points}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
