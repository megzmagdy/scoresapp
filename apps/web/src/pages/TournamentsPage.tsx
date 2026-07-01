import { Hammer } from 'lucide-react';
import { SectionLabel } from '@dpt/ui';

import { ARCHIVO } from '~/lib/theme';

export function TournamentsPage() {
  return (
    <div className="bg-dpt-bg min-h-screen flex items-center justify-center">
      <div className="text-center px-6">
        <Hammer className="mx-auto mb-4 text-dpt-gold" size={36} />
        <SectionLabel className="mb-1.5">Tournaments</SectionLabel>
        <h1
          className="text-3xl sm:text-4xl font-black italic uppercase leading-none text-[#f0f0f0]"
          style={{ fontFamily: ARCHIVO }}
        >
          Coming Soon
        </h1>
      </div>
    </div>
  );
}

/* Original TournamentsPage implementation — commented out while tournaments is disabled.
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
*/
