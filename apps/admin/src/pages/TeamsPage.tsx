import { useEffect, useState } from 'react';
import { getTeams, getPlayers, createTeam, deleteTeam } from '@dpt/db';
import type { Player, TeamWithPlayers } from '@dpt/types';

export function TeamsPage() {
  const [teams, setTeams] = useState<TeamWithPlayers[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');

  useEffect(() => {
    getTeams().then(setTeams);
    getPlayers().then(setPlayers);
  }, []);

  async function add() {
    if (!p1 || !p2 || p1 === p2) return;
    const team = await createTeam([p1, p2]);
    const p1data = players.find(p => p.id === p1)!;
    const p2data = players.find(p => p.id === p2)!;
    setTeams(prev => [...prev, { ...team, players: [p1data, p2data] }]);
    setP1(''); setP2('');
  }

  async function remove(id: string) {
    await deleteTeam(id);
    setTeams(prev => prev.filter(t => t.id !== id));
  }

  return (
    <div>
      <h1>Teams</h1>
      <select value={p1} onChange={e => setP1(e.target.value)}>
        <option value="">Player 1</option>
        {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <select value={p2} onChange={e => setP2(e.target.value)}>
        <option value="">Player 2</option>
        {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <button onClick={add} disabled={!p1 || !p2 || p1 === p2}>Create Team</button>
      <ul>
        {teams.map(t => (
          <li key={t.id}>
            {t.players.map(p => p.name).join(' & ')}
            <button onClick={() => remove(t.id)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
