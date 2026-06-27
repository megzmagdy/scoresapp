import { useNavigate } from 'react-router';

const MONO = "'Source Code Pro', monospace";
const ARCHIVO = "'Archivo', sans-serif";

const rules = [
  'All matches follow best-of-three sets; the Golden Point applies at deuce.',
  'Players must check in 30 minutes before their scheduled match time.',
  'Ranking points are awarded per tournament based on the round reached.',
  'A walkover forfeits all points for the absent player or pair.',
  'The season-long Race standings determine final championship seeding.',
];

const navCards = [
  {
    label: 'Rankings →',
    description: 'The full leaderboard with live standings and the Top 3 podium.',
    route: '/rankings',
  },
  {
    label: 'Brackets →',
    description: 'Follow every match and progression path through the draw.',
    route: '/brackets',
  },
];

export function RulesSection() {
  const navigate = useNavigate();

  return (
    <section className="bg-dpt-bg court-mesh py-20 border-t border-white/4">
      <div className="mx-auto container">
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-10 lg:gap-16 items-start">
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.2em] text-dpt-gold mb-2"
              style={{ fontFamily: MONO }}
            >
              // Regulations
            </p>
            <h2
              className="text-4xl sm:text-5xl font-black italic uppercase leading-none text-[#f0f0f0] mb-10"
              style={{ fontFamily: ARCHIVO }}
            >
              Rules &amp; Regulations
            </h2>

            <div className="flex flex-col">
              {rules.map((rule, i) => (
                <div
                  key={i}
                  className="flex gap-5 items-start py-5 border-b border-white/6 first:pt-0"
                >
                  <span
                    className="text-[12px] font-bold tracking-wider text-dpt-gold shrink-0 mt-0.5"
                    style={{ fontFamily: MONO }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="text-sm text-[#c0c0c8] leading-relaxed">{rule}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:pt-22">
            {navCards.map((card) => (
              <button
                key={card.route}
                type="button"
                onClick={() => navigate(card.route)}
                className="text-left rounded-xl p-6 cursor-pointer transition-all duration-150 border bg-[rgba(232,181,58,0.05)] border-[rgba(232,181,58,0.18)] hover:bg-[rgba(232,181,58,0.09)] hover:border-[rgba(232,181,58,0.35)]"
              >
                <p
                  className="text-lg font-black italic uppercase text-[#f0f0f0] mb-2"
                  style={{ fontFamily: ARCHIVO }}
                >
                  {card.label}
                </p>
                <p className="text-[13px] text-[#777] leading-relaxed">
                  {card.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
