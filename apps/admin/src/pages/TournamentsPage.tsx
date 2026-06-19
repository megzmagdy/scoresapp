import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getTournaments, updateTournamentStatus } from '@dpt/db';
import type { Tournament } from '@dpt/types';

export function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => { getTournaments().then(setTournaments); }, []);

  async function advance(t: Tournament) {
    const next = t.status === 'upcoming' ? 'ongoing' : 'completed';
    await updateTournamentStatus(t.id, next);
    setTournaments(prev => prev.map(x => x.id === t.id ? { ...x, status: next } : x));
  }

  return (
    <div>
      <h1>Tournaments</h1>
      <Link to="/tournaments/new">+ Create</Link>
      <ul>
        {tournaments.map(t => (
          <li key={t.id}>
            <Link to={`/tournaments/${t.id}`}>{t.name}</Link> — {t.status}
            {t.status !== 'completed' && (
              <button onClick={() => advance(t)}>{t.status === 'upcoming' ? 'Start' : 'Complete'}</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
