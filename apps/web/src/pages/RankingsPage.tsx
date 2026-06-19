import { useEffect, useState } from 'react';
import { getPlayers, subscribeToPlayers } from '@dpt/db';
import type { Player } from '@dpt/types';

export function RankingsPage() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    getPlayers().then(setPlayers);
    const channel = subscribeToPlayers(setPlayers);
    return () => { channel.unsubscribe(); };
  }, []);

  return (
    <div>
      <h1>Rankings</h1>
      <p>{players.length} players</p>
      <ul>
        {players.map((p, i) => (
          <li key={p.id}>{i + 1}. {p.name} — {p.total_points} pts</li>
        ))}
      </ul>
    </div>
  );
}
