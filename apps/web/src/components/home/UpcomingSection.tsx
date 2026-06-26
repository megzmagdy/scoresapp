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
    <section className="bg-dpt-bg py-20">
      <div className="mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 2xl:px-32">
        <p
          className="text-[11px] uppercase tracking-[0.2em] text-dpt-gold mb-2"
          style={{ fontFamily: MONO }}
        >
          // Schedule
        </p>
        <h2
          className="text-4xl sm:text-5xl font-black italic uppercase leading-none text-[#f0f0f0] mb-10"
          style={{ fontFamily: ARCHIVO }}
        >
          Upcoming Tournaments
        </h2>

        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {items.map((t) => {
            const sc = STATUS_CONFIG[t.status];
            return (
              <div
                key={t.id}
                className="bg-[#111] border border-[#1e1e1e] rounded-[10px] p-5 flex flex-col"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] uppercase tracking-[0.12em]"
                    style={{
                      fontFamily: MONO,
                      color: sc.color,
                      background: `${sc.color}12`,
                      border: `1px solid ${sc.color}35`,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: sc.color }}
                    />
                    {sc.label}
                  </div>
                  <span
                    className="text-[10px] text-[#444] tracking-[0.08em]"
                    style={{ fontFamily: MONO }}
                  >
                    {t.bracketFormat}
                  </span>
                </div>

                <p
                  className="text-[22px] font-black italic uppercase text-[#f0f0f0] leading-[1.1] mb-4"
                  style={{ fontFamily: ARCHIVO }}
                >
                  {t.name}
                </p>

                <div className="flex flex-col gap-2 mb-5">
                  <div className="flex items-center gap-2">
                    <Calendar size={13} color="#555" className="shrink-0" />
                    <span className="text-[13px] text-[#888]">{t.dateRange}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={13} color="#555" className="shrink-0" />
                    <span className="text-[13px] text-[#888]">{t.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={13} color="#555" className="shrink-0" />
                    <span className="text-[13px] text-[#888]">
                      <span className="mr-1.5" style={{ fontFamily: MONO }}>{t.playerCount}</span>
                      players
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/brackets')}
                  className="w-full py-2.5 mt-auto bg-[#1a1a1a] border border-[#2e2e2e] rounded-md text-[#d0d0d0] text-[13px] font-semibold cursor-pointer transition-all duration-150 hover:border-[rgba(232,181,58,0.35)] hover:text-dpt-gold hover:bg-[rgba(232,181,58,0.05)]"
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
