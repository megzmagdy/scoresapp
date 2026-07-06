import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Calendar, MapPin, Users } from 'lucide-react';
import { getTournaments, getTournamentParticipants } from '@dpt/db';
import type { Tournament, TournamentStatus, BracketFormat, TournamentType } from '@dpt/types';

import { GOLD, MONO, ARCHIVO } from '~/lib/theme';

const STATUS_CONFIG: Record<TournamentStatus, { color: string; label: string }> = {
  ongoing:   { color: '#4ade80', label: 'Live' },
  upcoming:  { color: GOLD,     label: 'Upcoming' },
  completed: { color: '#555',   label: 'Completed' },
};

const FORMAT_LABEL: Record<BracketFormat, string> = {
  R32: 'Round of 32',
  R16: 'Round of 16',
  QF: 'Quarter Finals',
};

const TYPE_LABEL: Record<TournamentType, string> = {
  individual: 'Individual',
  team: 'Team',
};

export function TournamentsPage() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTournaments()
      .then(async (data) => {
        setTournaments(data);
        const counts = await Promise.all(
          data.map((t) => getTournamentParticipants(t.id).then((p) => [t.id, p.length] as const))
        );
        setParticipantCounts(Object.fromEntries(counts));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-dpt-bg min-h-screen">
      <div className="border-b border-white/6 bg-linear-to-b from-[rgba(232,181,58,0.05)] to-transparent">
        <div className="mx-auto container py-6 sm:py-10">
          <p
            className="text-[11px] uppercase tracking-[0.2em] text-dpt-gold mb-1.5"
            style={{ fontFamily: MONO }}
          >
            Season 2 · 2026
          </p>
          <h1
            className="text-3xl sm:text-4xl font-black italic uppercase leading-none text-[#f0f0f0]"
            style={{ fontFamily: ARCHIVO }}
          >
            Tournaments
          </h1>
        </div>
      </div>

      <div className="mx-auto container py-6 sm:py-10">
        {loading ? (
          <p className="text-[#555] pt-12 text-center">Loading tournaments…</p>
        ) : tournaments.length === 0 ? (
          <p className="text-[#555] pt-12 text-center">No tournaments found</p>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {tournaments.map((t) => {
              const sc = STATUS_CONFIG[t.status];
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => navigate(`/tournaments/${t.id}`)}
                  className="text-left bg-[#111] border border-[#1e1e1e] rounded-[10px] p-5 flex flex-col cursor-pointer transition-colors hover:border-[rgba(232,181,58,0.35)]"
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
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sc.color }} />
                      {sc.label}
                    </div>
                    <span className="text-[10px] text-[#444] tracking-[0.08em]" style={{ fontFamily: MONO }}>
                      {FORMAT_LABEL[t.bracket_format]}
                    </span>
                  </div>

                  <p
                    className="text-[22px] font-black italic uppercase text-[#f0f0f0] leading-[1.1] mb-4"
                    style={{ fontFamily: ARCHIVO }}
                  >
                    {t.name}
                  </p>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar size={13} color="#555" className="shrink-0" />
                      <span className="text-[13px] text-[#888]">
                        {new Date(t.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={13} color="#555" className="shrink-0" />
                      <span className="text-[13px] text-[#888]">{t.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={13} color="#555" className="shrink-0" />
                      <span className="text-[13px] text-[#888]">
                        <span className="mr-1.5" style={{ fontFamily: MONO }}>
                          {participantCounts[t.id] ?? 0}
                        </span>
                        {TYPE_LABEL[t.tournament_type]}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
