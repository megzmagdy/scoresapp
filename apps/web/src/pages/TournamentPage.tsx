import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { getTournament, getTournamentParticipants, getMatches, subscribeToMatches } from '@dpt/db';
import type { Tournament, TournamentParticipantWithDetails, Match } from '@dpt/types';

export function TournamentPage() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<TournamentParticipantWithDetails[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    if (!id) return;
    getTournament(id).then(setTournament);
    getTournamentParticipants(id).then(setParticipants);
    getMatches(id).then(setMatches);
    const channel = subscribeToMatches(id, setMatches);
    return () => { channel.unsubscribe(); };
  }, [id]);

  if (!tournament) return <div>Loading...</div>;

  return (
    <div>
      <h1>{tournament.name}</h1>
      <p>{tournament.venue} · {tournament.date} · {tournament.bracket_format} · {tournament.tournament_type}</p>
      <h2>Participants ({participants.length})</h2>
      <h2>Matches ({matches.length})</h2>
    </div>
  );
}
