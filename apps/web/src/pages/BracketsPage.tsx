import { useEffect, useState } from 'react';
import { getTournaments, getMatches, getTournamentParticipants } from '@dpt/db';
import type { Tournament, Match, TournamentParticipantWithDetails } from '@dpt/types';
import { TournamentTabs } from '~/components/brackets/TournamentTabs';
import { BracketView } from '~/components/brackets/BracketView';
import { mockTournaments, mockMatches, mockParticipants } from '~/components/brackets/mockBracketData';

const MONO = "'Source Code Pro', monospace";
const ARCHIVO = "'Archivo', sans-serif";
const USE_MOCK = true;

export function BracketsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [participants, setParticipants] = useState<TournamentParticipantWithDetails[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [loadingBracket, setLoadingBracket] = useState(false);

  useEffect(() => {
    if (USE_MOCK) {
      setTournaments(mockTournaments);
      setSelectedId(mockTournaments[0].id);
      setLoadingTournaments(false);
      return;
    }
    getTournaments()
      .then((data) => {
        setTournaments(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .finally(() => setLoadingTournaments(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    if (USE_MOCK) {
      setMatches(mockMatches);
      setParticipants(mockParticipants);
      return;
    }
    setLoadingBracket(true);
    setMatches([]);
    setParticipants([]);
    Promise.all([getMatches(selectedId), getTournamentParticipants(selectedId)])
      .then(([m, p]) => {
        setMatches(m);
        setParticipants(p);
      })
      .catch(console.error)
      .finally(() => setLoadingBracket(false));
  }, [selectedId]);

  const selectedTournament = tournaments.find((t) => t.id === selectedId) ?? null;

  return (
    <div className="bg-dpt-bg min-h-screen">
      {/* Header */}
      <div className="border-b border-white/6 bg-linear-to-b from-[rgba(232,181,58,0.05)] to-transparent">
        <div className="mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 2xl:px-32 py-6 sm:py-10">
          <p
            className="text-[11px] uppercase tracking-[0.2em] text-dpt-gold mb-1.5"
            style={{ fontFamily: MONO }}
          >
            Season 2 · 2026
          </p>
          <h1
            className="text-3xl sm:text-4xl font-black italic uppercase leading-none text-[#f0f0f0] mb-6"
            style={{ fontFamily: ARCHIVO }}
          >
            Brackets
          </h1>

          {!loadingTournaments && (
            <TournamentTabs
              tournaments={tournaments}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
        </div>
      </div>

      <div className="mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 2xl:px-32 py-6 sm:py-10">
        {loadingTournaments || loadingBracket ? (
          <p className="text-[#555] pt-12 text-center">Loading bracket…</p>
        ) : !selectedTournament ? (
          <p className="text-[#555] pt-12 text-center">No tournaments found</p>
        ) : (
          <BracketView
            matches={matches}
            participants={participants}
            tournament={selectedTournament}
          />
        )}
      </div>
    </div>
  );
}
