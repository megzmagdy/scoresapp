import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getTournaments } from '@dpt/db';
import type { Tournament } from '@dpt/types';

export function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => { getTournaments().then(setTournaments); }, []);

  return (
    <div>
      <h1>Tournaments</h1>
      <ul>
        {tournaments.map((t) => (
          <li key={t.id}>
            <Link to={`/tournaments/${t.id}`}>{t.name}</Link> — {t.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
