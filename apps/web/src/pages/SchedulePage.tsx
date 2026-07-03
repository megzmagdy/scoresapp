import { useEffect, useState } from 'react';
import { getTournaments, getMatches, getTournamentParticipants, groupMatchesByDay } from '@dpt/db';
import type { Tournament, Match, TournamentParticipantWithDetails } from '@dpt/types';
import { TournamentTabs } from '~/components/brackets/TournamentTabs';
import { getParticipantName } from '~/components/brackets/bracketLayout';
import { MONO, ARCHIVO } from '~/lib/theme';

export function SchedulePage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [participants, setParticipants] = useState<TournamentParticipantWithDetails[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    getTournaments()
      .then((data) => {
        setTournaments(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .finally(() => setLoadingTournaments(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingMatches(true);
    setMatches([]);
    setParticipants([]);
    Promise.all([getMatches(selectedId), getTournamentParticipants(selectedId)])
      .then(([m, p]) => {
        setMatches(m);
        setParticipants(p);
      })
      .catch(console.error)
      .finally(() => setLoadingMatches(false));
  }, [selectedId]);

  const selectedTournament = tournaments.find((t) => t.id === selectedId) ?? null;
  const participantMap: Record<string, TournamentParticipantWithDetails> = {};
  for (const p of participants) participantMap[p.id] = p;

  const dayGroups = groupMatchesByDay(matches);

  return (
    <div className="bg-dpt-bg min-h-screen">
      <div className="border-b border-white/6 bg-linear-to-b from-[rgba(232,181,58,0.05)] to-transparent">
        <div className="mx-auto container py-6 sm:py-10">
          <p className="text-[11px] uppercase tracking-[0.2em] text-dpt-gold mb-1.5" style={{ fontFamily: MONO }}>
            Season 2 · 2026
          </p>
          <h1 className="text-3xl sm:text-4xl font-black italic uppercase leading-none text-[#f0f0f0] mb-6" style={{ fontFamily: ARCHIVO }}>
            Schedule
          </h1>
          {!loadingTournaments && (
            <TournamentTabs tournaments={tournaments} selectedId={selectedId} onSelect={setSelectedId} />
          )}
        </div>
      </div>

      <div className="mx-auto container py-6 sm:py-10">
        {loadingTournaments || loadingMatches ? (
          <p className="text-[#555] pt-12 text-center">Loading schedule…</p>
        ) : !selectedTournament ? (
          <p className="text-[#555] pt-12 text-center">No tournaments found</p>
        ) : dayGroups.length === 0 ? (
          <p className="text-[#555] pt-12 text-center">No matches scheduled yet</p>
        ) : (
          <div className="flex flex-col gap-8">
            {dayGroups.map(group => (
              <div key={group.dateKey}>
                <p className="text-[11px] uppercase tracking-[0.2em] text-dpt-gold mb-3" style={{ fontFamily: MONO }}>
                  {new Date(group.dateKey + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <div className="flex flex-col gap-2">
                  {group.matches.map(m => {
                    const p1 = m.participant1_id ? participantMap[m.participant1_id] : undefined;
                    const p2 = m.participant2_id ? participantMap[m.participant2_id] : undefined;
                    const time = new Date(m.scheduled_at!).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                    return (
                      <div key={m.id} className="flex items-center gap-4 bg-[#141414] border border-white/8 rounded-xl p-3">
                        <span className="text-dpt-gold text-sm font-bold w-16 shrink-0" style={{ fontFamily: MONO }}>{time}</span>
                        <span className="text-white text-sm flex-1">
                          {getParticipantName(p1, selectedTournament.tournament_type)} vs {getParticipantName(p2, selectedTournament.tournament_type)}
                        </span>
                        {m.venue && <span className="text-dim text-xs" style={{ fontFamily: MONO }}>{m.venue}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
