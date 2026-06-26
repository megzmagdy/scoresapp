import { useEffect, useState } from 'react';
import { getPlayers, upsertPlayer, deletePlayer } from '@dpt/db';
import type { Player } from '@dpt/types';

export function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState('');

  useEffect(() => { getPlayers().then(setPlayers); }, []);

  async function add() {
    if (!name.trim()) return;
    const p = await upsertPlayer({ id: crypto.randomUUID(), name: name.trim(), code: null, venue: null, total_points: 0 });
    setPlayers(prev => [...prev, p]);
    setName('');
  }

  async function remove(id: string) {
    await deletePlayer(id);
    setPlayers(prev => prev.filter(p => p.id !== id));
  }

  return (
    <div>
      <h1>Players</h1>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
      <button onClick={add}>Add</button>
      <ul>
        {players.map(p => (
          <li key={p.id}>{p.name} ({p.total_points} pts) <button onClick={() => remove(p.id)}>Remove</button></li>
        ))}
      </ul>
    </div>
  );
}
