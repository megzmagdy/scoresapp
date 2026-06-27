import { MONO, ARCHIVO } from '~/lib/theme';

type Category = 'NEWS' | 'SCHEDULE' | 'RULES';

interface Announcement {
  id: string;
  category: Category;
  date: string;
  title: string;
  excerpt: string;
  imagePlaceholder: string;
}

function CourtSVG() {
  return (
    <svg viewBox="0 0 200 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="8" width="180" height="84" stroke="rgba(232,181,58,0.12)" strokeWidth="1.5" />
      <line x1="10" y1="8" x2="10" y2="92" stroke="rgba(232,181,58,0.22)" strokeWidth="3" />
      <line x1="190" y1="8" x2="190" y2="92" stroke="rgba(232,181,58,0.22)" strokeWidth="3" />
      <line x1="100" y1="8" x2="100" y2="92" stroke="rgba(232,181,58,0.28)" strokeWidth="1.5" />
      <circle cx="100" cy="8" r="2" fill="rgba(232,181,58,0.3)" />
      <circle cx="100" cy="92" r="2" fill="rgba(232,181,58,0.3)" />
      <line x1="73" y1="8" x2="73" y2="92" stroke="rgba(255,255,255,0.07)" strokeWidth="0.75" />
      <line x1="127" y1="8" x2="127" y2="92" stroke="rgba(255,255,255,0.07)" strokeWidth="0.75" />
      <line x1="73" y1="50" x2="127" y2="50" stroke="rgba(255,255,255,0.07)" strokeWidth="0.75" />
    </svg>
  );
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
    <section className="bg-dpt-bg court-mesh py-20">
      <div className="mx-auto container">
        <p
          className="text-[11px] uppercase tracking-[0.2em] text-dpt-gold mb-2"
          style={{ fontFamily: MONO }}
        >
          // Latest
        </p>
        <h2
          className="text-4xl sm:text-5xl font-black italic uppercase leading-none text-[#f0f0f0] mb-10"
          style={{ fontFamily: ARCHIVO }}
        >
          Announcements &amp; Updates
        </h2>

        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {announcements.map((a) => (
            <div
              key={a.id}
              className="bg-[#111] border border-[#1e1e1e] rounded-[10px] overflow-hidden cursor-pointer transition-colors duration-150 hover:border-border"
            >
              <div className="relative h-40 bg-[#0a0a0a] overflow-hidden flex items-center justify-center p-6">
                <div className="absolute inset-0 flex items-center justify-center p-6 opacity-60">
                  <CourtSVG />
                </div>
                <div
                  className="absolute top-3 left-3 px-2.5 py-1 rounded text-[10px] uppercase tracking-[0.12em] text-dpt-gold bg-[rgba(232,181,58,0.1)] border border-[rgba(232,181,58,0.3)]"
                  style={{ fontFamily: MONO }}
                >
                  {a.category}
                </div>
              </div>

              <div className="px-5 pt-4 pb-5">
                <p
                  className="text-[10px] text-[#555] tracking-[0.08em] mb-2"
                  style={{ fontFamily: MONO }}
                >
                  {a.date}
                </p>
                <p className="text-[15px] font-bold text-[#f0f0f0] leading-[1.3] mb-2">
                  {a.title}
                </p>
                <p className="text-[13px] text-[#666] leading-relaxed">{a.excerpt}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
