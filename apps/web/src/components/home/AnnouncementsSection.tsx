const GOLD = '#E8B53A';
const MONO = "'Source Code Pro', monospace";
const ARCHIVO = "'Archivo', sans-serif";

type Category = 'NEWS' | 'SCHEDULE' | 'RULES';

interface Announcement {
  id: string;
  category: Category;
  date: string;
  title: string;
  excerpt: string;
  imagePlaceholder: string;
}

const announcements: Announcement[] = [
  {
    id: 'a1',
    category: 'NEWS',
    date: 'Jun 18, 2026',
    title: 'Season 2 wildcards announced',
    excerpt: 'Four wildcard entries confirmed for the Mansoura Open main draw.',
    imagePlaceholder: '{ announcement image }',
  },
  {
    id: 'a2',
    category: 'SCHEDULE',
    date: 'Jun 12, 2026',
    title: 'Mansoura Open draw is live',
    excerpt: 'The full Round of 16 bracket has been seeded and published.',
    imagePlaceholder: '{ court photo }',
  },
  {
    id: 'a3',
    category: 'RULES',
    date: 'Jun 05, 2026',
    title: 'Updated scoring for the Race',
    excerpt: 'Revised point allocations now apply across all three tour stops.',
    imagePlaceholder: '{ rulebook }',
  },
];

export function AnnouncementsSection() {
  return (
    <section style={{ background: '#0b0c0f', padding: '80px 0' }}>
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
          // Latest
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
            marginBottom: 40,
          }}
        >
          Announcements &amp; Updates
        </h2>

        {/* Cards grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {announcements.map((a) => (
            <div
              key={a.id}
              style={{
                background: '#111',
                border: '1px solid #1e1e1e',
                borderRadius: 10,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = '#2e2e2e')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = '#1e1e1e')}
            >
              {/* Image area */}
              <div
                style={{
                  position: 'relative',
                  height: 160,
                  background: '#0e0e0e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Category badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    padding: '4px 10px',
                    borderRadius: 4,
                    background: 'rgba(232,181,58,0.1)',
                    border: `1px solid rgba(232,181,58,0.3)`,
                    fontFamily: MONO,
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: GOLD,
                  }}
                >
                  {a.category}
                </div>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 11,
                    color: '#2e2e2e',
                    letterSpacing: '0.05em',
                  }}
                >
                  {a.imagePlaceholder}
                </span>
              </div>

              {/* Card body */}
              <div style={{ padding: '16px 20px 20px' }}>
                <p
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    color: '#555',
                    letterSpacing: '0.08em',
                    marginBottom: 8,
                  }}
                >
                  {a.date}
                </p>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#f0f0f0',
                    lineHeight: 1.3,
                    marginBottom: 8,
                  }}
                >
                  {a.title}
                </p>
                <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                  {a.excerpt}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
