// apps/web/src/pages/BracketsPage.tsx
import { useEffect, useState } from 'react';
import { getTournaments, getMatches, getTournamentParticipants } from '@dpt/db';
import type { Tournament, Match, TournamentParticipantWithDetails } from '@dpt/types';
import { TournamentTabs } from '~/components/brackets/TournamentTabs';
import { BracketView } from '~/components/brackets/BracketView';

const GOLD = '#E8B53A';

export function BracketsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [participants, setParticipants] = useState<TournamentParticipantWithDetails[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [loadingBracket, setLoadingBracket] = useState(false);

  // Fetch tournament list on mount
  useEffect(() => {
    getTournaments()
      .then((data) => {
        setTournaments(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .finally(() => setLoadingTournaments(false));
  }, []);

  // Fetch bracket data when selection changes
  useEffect(() => {
    if (!selectedId) return;
    setLoadingBracket(true);
    Promise.all([getMatches(selectedId), getTournamentParticipants(selectedId)])
      .then(([m, p]) => {
        setMatches(m);
        setParticipants(p);
      })
      .finally(() => setLoadingBracket(false));
  }, [selectedId]);

  const selectedTournament = tournaments.find((t) => t.id === selectedId) ?? null;

  return (
    <div style={{ background: '#0b0c0f', minHeight: '100vh' }}>
      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'linear-gradient(180deg, rgba(232,181,58,0.05) 0%, transparent 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-10">
          <p
            style={{
              fontFamily: "'Source Code Pro', monospace",
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: GOLD,
              marginBottom: 6,
            }}
          >
            Season 2 · 2026
          </p>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 900,
              fontStyle: 'italic',
              textTransform: 'uppercase',
              color: '#f0f0f0',
              lineHeight: 1,
              marginBottom: 24,
              fontFamily: "'Archivo', sans-serif",
            }}
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

      {/* Bracket */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {loadingTournaments || loadingBracket ? (
          <div style={{ color: '#555', paddingTop: 48, textAlign: 'center' }}>
            Loading bracket...
          </div>
        ) : !selectedTournament ? (
          <div style={{ color: '#555', paddingTop: 48, textAlign: 'center' }}>
            No tournaments found
          </div>
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
