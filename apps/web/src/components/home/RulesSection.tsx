import { useNavigate } from 'react-router';

const GOLD = '#E8B53A';
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
    <section
      style={{
        background: '#0b0c0f',
        padding: '80px 0',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <div className="mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 2xl:px-32">
        {/* Section header */}
        <p
          style={{
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: GOLD,
            marginBottom: 8,
          }}
        >
          // Regulations
        </p>
        <h2
          className="text-4xl sm:text-5xl"
          style={{
            fontFamily: ARCHIVO,
            fontWeight: 900,
            fontStyle: 'italic',
            textTransform: 'uppercase',
            color: '#f0f0f0',
            lineHeight: 1,
            marginBottom: 48,
          }}
        >
          Rules &amp; Regulations
        </h2>

        {/* Two-column layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 40,
          }}
          className="lg:grid-cols-[1fr_360px]"
        >
          {/* Rules list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {rules.map((rule, i) => (
              <div key={i} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 12,
                    fontWeight: 700,
                    color: GOLD,
                    letterSpacing: '0.05em',
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p style={{ fontSize: 14, color: '#c0c0c8', lineHeight: 1.7 }}>{rule}</p>
              </div>
            ))}
          </div>

          {/* Navigation cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {navCards.map((card) => (
              <button
                key={card.route}
                type="button"
                onClick={() => navigate(card.route)}
                style={{
                  textAlign: 'left',
                  background: 'rgba(232,181,58,0.05)',
                  border: `1px solid rgba(232,181,58,0.18)`,
                  borderRadius: 10,
                  padding: '20px 24px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.background = 'rgba(232,181,58,0.09)';
                  el.style.borderColor = 'rgba(232,181,58,0.35)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.background = 'rgba(232,181,58,0.05)';
                  el.style.borderColor = 'rgba(232,181,58,0.18)';
                }}
              >
                <p
                  style={{
                    fontFamily: ARCHIVO,
                    fontSize: 18,
                    fontWeight: 900,
                    fontStyle: 'italic',
                    textTransform: 'uppercase',
                    color: '#f0f0f0',
                    marginBottom: 8,
                  }}
                >
                  {card.label}
                </p>
                <p style={{ fontSize: 13, color: '#777', lineHeight: 1.6 }}>
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
