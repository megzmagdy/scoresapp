import { useEffect, useState } from 'react';
import { getPlayers, updatePlayerPoints } from '@dpt/db';
import type { Player } from '@dpt/types';

export function RankingsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [edits, setEdits] = useState<Record<string, number>>({});

  useEffect(() => { getPlayers().then(setPlayers); }, []);

  async function save(id: string) {
    const pts = edits[id];
    if (pts === undefined) return;
    await updatePlayerPoints(id, pts);
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, total_points: pts } : p));
    setEdits(e => { const n = { ...e }; delete n[id]; return n; });
  }

  return (
    <div>
      <h1>Rankings</h1>
      {players.map((p, i) => (
        <div key={p.id}>
          <span>{i + 1}. {p.name}</span>
          <input
            type="number"
            value={edits[p.id] ?? p.total_points}
            onChange={e => setEdits(ed => ({ ...ed, [p.id]: Number(e.target.value) }))}
          />
          <button onClick={() => save(p.id)} disabled={edits[p.id] === undefined}>Save</button>
        </div>
      ))}
    </div>
  );
}
