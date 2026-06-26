import { useNavigate } from 'react-router';
import { Calendar, MapPin, Users } from 'lucide-react';
import type { Tournament } from '@dpt/types';

const GOLD = '#E8B53A';
const MONO = "'Source Code Pro', monospace";
const ARCHIVO = "'Archivo', sans-serif";

const USE_MOCK = true;

interface TournamentDisplay {
  id: string;
  name: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  bracketFormat: string;
  dateRange: string;
  venue: string;
  playerCount: number;
}

const mockTournaments: TournamentDisplay[] = [
  {
    id: 't1',
    name: 'Mansoura Open',
    status: 'ongoing',
    bracketFormat: 'Round of 16',
    dateRange: 'Aug 14–17, 2026',
    venue: 'Mansoura Padel Point',
    playerCount: 32,
  },
  {
    id: 't2',
    name: 'Ace Town Championship',
    status: 'upcoming',
    bracketFormat: 'Round of 16',
    dateRange: 'Sep 05–07, 2026',
    venue: 'Ace Town Complex',
    playerCount: 24,
  },
  {
    id: 't3',
    name: 'Padel H Masters',
    status: 'completed',
    bracketFormat: 'Quarter Finals',
    dateRange: 'Jul 02–04, 2026',
    venue: 'Padel H',
    playerCount: 16,
  },
];

const STATUS_CONFIG: Record<TournamentDisplay['status'], { color: string; label: string }> = {
  ongoing:   { color: '#4ade80', label: 'Live' },
  upcoming:  { color: GOLD,     label: 'Upcoming' },
  completed: { color: '#555',   label: 'Completed' },
};

function toDisplay(t: Tournament): TournamentDisplay {
  return {
    id: t.id,
    name: t.name,
    status: t.status,
    bracketFormat: t.bracket_format ?? '—',
    dateRange: t.date ?? '—',
    venue: t.venue ?? '—',
    playerCount: 0,
  };
}

interface Props {
  tournaments?: Tournament[];
}

export function UpcomingSection({ tournaments }: Props) {
  const navigate = useNavigate();
  const items: TournamentDisplay[] = USE_MOCK
    ? mockTournaments
    : (tournaments ?? []).map(toDisplay);

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
          // Schedule
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
          Upcoming Tournaments
        </h2>

        {/* Cards grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {items.map((t) => {
            const sc = STATUS_CONFIG[t.status];
            return (
              <div
                key={t.id}
                style={{
                  background: '#111',
                  border: '1px solid #1e1e1e',
                  borderRadius: 10,
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0,
                }}
              >
                {/* Top row: status badge + bracket format */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px',
                      borderRadius: 4,
                      background: `${sc.color}12`,
                      border: `1px solid ${sc.color}35`,
                      fontFamily: MONO,
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: sc.color,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: sc.color,
                        flexShrink: 0,
                      }}
                    />
                    {sc.label}
                  </div>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      color: '#444',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {t.bracketFormat}
                  </span>
                </div>

                {/* Tournament name */}
                <p
                  style={{
                    fontFamily: ARCHIVO,
                    fontSize: 22,
                    fontWeight: 900,
                    fontStyle: 'italic',
                    textTransform: 'uppercase',
                    color: '#f0f0f0',
                    lineHeight: 1.1,
                    marginBottom: 16,
                  }}
                >
                  {t.name}
                </p>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calendar size={13} color="#555" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#888' }}>{t.dateRange}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={13} color="#555" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#888' }}>{t.venue}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Users size={13} color="#555" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#888' }}>
                      <span style={{ fontFamily: MONO, marginRight: 6 }}>{t.playerCount}</span>
                      players
                    </span>
                  </div>
                </div>

                {/* View Bracket button */}
                <button
                  type="button"
                  onClick={() => navigate('/brackets')}
                  style={{
                    width: '100%',
                    padding: '10px 0',
                    background: '#1a1a1a',
                    border: '1px solid #2e2e2e',
                    borderRadius: 6,
                    color: '#d0d0d0',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                    marginTop: 'auto',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.borderColor = `${GOLD}50`;
                    el.style.color = GOLD;
                    el.style.background = `rgba(232,181,58,0.05)`;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.borderColor = '#2e2e2e';
                    el.style.color = '#d0d0d0';
                    el.style.background = '#1a1a1a';
                  }}
                >
                  View Bracket
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
