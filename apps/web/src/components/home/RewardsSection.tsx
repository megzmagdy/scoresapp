const GOLD = '#E8B53A';
const MONO = "'Source Code Pro', monospace";
const ARCHIVO = "'Archivo', sans-serif";

const rewards = [
  { rank: 1, label: 'Champion',      prize: 'EGP 120K', points: '2,000 ranking points', emoji: '🥇', color: GOLD      },
  { rank: 2, label: 'Runner-Up',     prize: 'EGP 70K',  points: '1,200 ranking points', emoji: '🥈', color: '#C0C0C0' },
  { rank: 3, label: 'Semi-Finalist', prize: 'EGP 40K',  points: '720 ranking points',   emoji: '🥉', color: '#CD7F32' },
];

export function RewardsSection() {
  return (
    <section style={{ background: '#0b0c0f', padding: '80px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
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
          // Rewards
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
            marginBottom: 12,
          }}
        >
          The Race Rewards
        </h2>
        <p style={{ fontSize: 14, color: '#666', maxWidth: '50ch', lineHeight: 1.7, marginBottom: 40 }}>
          Points accumulate across every leg. The top of the table at season's end claims
          the championship purse.
        </p>

        {/* Reward cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {rewards.map((r) => (
            <div
              key={r.rank}
              style={{
                position: 'relative',
                overflow: 'hidden',
                background: '#111',
                border: `1px solid ${r.color}25`,
                borderRadius: 10,
                padding: '24px',
              }}
            >
              {/* Watermark rank */}
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  right: 12,
                  top: -16,
                  fontSize: 140,
                  fontWeight: 900,
                  fontStyle: 'italic',
                  color: 'rgba(255,255,255,0.025)',
                  lineHeight: 1,
                  pointerEvents: 'none',
                  userSelect: 'none',
                  fontFamily: ARCHIVO,
                }}
              >
                {r.rank}
              </div>

              {/* Medal icon */}
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: `${r.color}18`,
                  border: `1.5px solid ${r.color}35`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                  marginBottom: 16,
                }}
              >
                {r.emoji}
              </div>

              {/* Label */}
              <p
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: r.color,
                  marginBottom: 8,
                }}
              >
                {r.label}
              </p>

              {/* Prize amount */}
              <p
                style={{
                  fontFamily: ARCHIVO,
                  fontSize: 40,
                  fontWeight: 900,
                  fontStyle: 'italic',
                  color: '#f0f0f0',
                  lineHeight: 1,
                  marginBottom: 8,
                  letterSpacing: '-0.01em',
                }}
              >
                {r.prize}
              </p>

              {/* Points */}
              <p style={{ fontSize: 13, color: '#555' }}>{r.points}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
