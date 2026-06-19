import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import {
  getTournament, getTournamentParticipants, getMatches,
  getPlayers, getTeams, addParticipant, saveMatchResult, awardPoints, upsertMatch,
} from '@dpt/db';
import { supabase } from '@dpt/db';
import type { Tournament, TournamentParticipantWithDetails, Match, Player, TeamWithPlayers } from '@dpt/types';

type Tab = 'participants' | 'bracket' | 'points';

export function TournamentManagerPage() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<TournamentParticipantWithDetails[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<TeamWithPlayers[]>([]);
  const [tab, setTab] = useState<Tab>('participants');
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    if (!id) return;
    getTournament(id).then(setTournament);
    getTournamentParticipants(id).then(setParticipants);
    getMatches(id).then(setMatches);
    getPlayers().then(setPlayers);
    getTeams().then(setTeams);
  }, [id]);

  if (!tournament) return <div>Loading...</div>;

  const maxSlots = tournament.bracket_format === 'R16' ? 16 : 8;
  const isTeamTournament = tournament.tournament_type === 'team';

  const alreadyAdded = new Set([
    ...participants.map(p => p.player_id).filter(Boolean),
    ...participants.map(p => p.team_id).filter(Boolean),
  ]);

  const options = isTeamTournament
    ? teams.filter(t => !alreadyAdded.has(t.id)).map(t => ({ id: t.id, label: t.players.map(p => p.name).join(' & ') }))
    : players.filter(p => !alreadyAdded.has(p.id)).map(p => ({ id: p.id, label: p.name }));

  async function addSelected() {
    if (!selectedId || !id) return;
    await addParticipant({
      tournament_id: id,
      [isTeamTournament ? 'team_id' : 'player_id']: selectedId,
      bracket_position: participants.length + 1,
    });
    getTournamentParticipants(id).then(setParticipants);
    setSelectedId('');
  }

  async function assignPosition(participantId: string, position: number) {
    await supabase.from('tournament_participants').update({ bracket_position: position }).eq('id', participantId);
    getTournamentParticipants(id!).then(setParticipants);
  }

  async function generateRound1() {
    const sorted = [...participants].sort((a, b) => (a.bracket_position ?? 99) - (b.bracket_position ?? 99));
    for (let i = 0; i < sorted.length / 2; i++) {
      await upsertMatch({
        tournament_id: id!,
        round: 1,
        position: i + 1,
        participant1_id: sorted[i * 2]?.id ?? null,
        participant2_id: sorted[i * 2 + 1]?.id ?? null,
      });
    }
    getMatches(id!).then(setMatches);
  }

  function getLabel(p?: TournamentParticipantWithDetails): string {
    if (!p) return 'TBD';
    if (p.player) return p.player.name;
    if (p.team) return p.team.players.map(pl => pl.name).join(' & ');
    return 'TBD';
  }

  const pMap = Object.fromEntries(participants.map(p => [p.id, p]));

  return (
    <div>
      <h1>{tournament.name}</h1>
      <p>{tournament.venue} · {tournament.date} · {tournament.bracket_format} · {tournament.tournament_type}</p>

      <div>
        {(['participants', 'bracket', 'points'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ fontWeight: tab === t ? 'bold' : 'normal' }}>{t}</button>
        ))}
      </div>

      {tab === 'participants' && (
        <div>
          <h2>Participants ({participants.length}/{maxSlots})</h2>
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)}>
            <option value="">Select...</option>
            {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <button onClick={addSelected} disabled={!selectedId || participants.length >= maxSlots}>Add</button>
          <ul>
            {participants.map(p => <li key={p.id}>{getLabel(p)} (slot {p.bracket_position})</li>)}
          </ul>
        </div>
      )}

      {tab === 'bracket' && (
        <div>
          <h2>Bracket</h2>
          <div>
            {Array.from({ length: maxSlots }, (_, i) => i + 1).map(slot => {
              const assigned = participants.find(p => p.bracket_position === slot);
              return (
                <div key={slot}>
                  Slot {slot}:
                  <select value={assigned?.id ?? ''} onChange={e => e.target.value && assignPosition(e.target.value, slot)}>
                    <option value="">Empty</option>
                    {participants.map(p => <option key={p.id} value={p.id}>{getLabel(p)}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
          {matches.length === 0 && participants.length >= 2 && (
            <button onClick={generateRound1}>Generate Round 1 matches</button>
          )}
          <h3>Matches</h3>
          {matches.map(m => {
            const p1 = pMap[m.participant1_id ?? ''];
            const p2 = pMap[m.participant2_id ?? ''];
            return (
              <MatchResultRow key={m.id} match={m} p1Label={getLabel(p1)} p2Label={getLabel(p2)}
                p1Id={p1?.id} p2Id={p2?.id}
                onSave={async (s1, s2, winnerId) => {
                  await saveMatchResult(m.id, s1, s2, winnerId);
                  getMatches(id!).then(setMatches);
                }} />
            );
          })}
        </div>
      )}

      {tab === 'points' && (
        <div>
          <h2>Award Points</h2>
          {participants.map(p => (
            <PointsRow key={p.id} participant={p} label={getLabel(p)}
              onSave={async (pts) => {
                await awardPoints(p.id, pts);
                getTournamentParticipants(id!).then(setParticipants);
              }} />
          ))}
        </div>
      )}
    </div>
  );
}

function MatchResultRow({ match, p1Label, p2Label, p1Id, p2Id, onSave }: {
  match: Match;
  p1Label: string;
  p2Label: string;
  p1Id?: string;
  p2Id?: string;
  onSave: (s1: number, s2: number, winnerId: string) => Promise<void>;
}) {
  const [s1, setS1] = useState(match.score1?.toString() ?? '');
  const [s2, setS2] = useState(match.score2?.toString() ?? '');
  return (
    <div>
      <span>R{match.round} M{match.position}: {p1Label}</span>
      <input type="number" value={s1} onChange={e => setS1(e.target.value)} style={{ width: 50 }} />
      vs
      <input type="number" value={s2} onChange={e => setS2(e.target.value)} style={{ width: 50 }} />
      <span>{p2Label}</span>
      {p1Id && <button onClick={() => onSave(Number(s1), Number(s2), p1Id)}>{p1Label} wins</button>}
      {p2Id && <button onClick={() => onSave(Number(s1), Number(s2), p2Id)}>{p2Label} wins</button>}
      {match.winner_id && <span> ✓ winner set</span>}
    </div>
  );
}

function PointsRow({ participant, label, onSave }: {
  participant: TournamentParticipantWithDetails;
  label: string;
  onSave: (pts: number) => Promise<void>;
}) {
  const [pts, setPts] = useState(participant.points_awarded.toString());
  return (
    <div>
      <span>{label}</span>
      <input type="number" value={pts} onChange={e => setPts(e.target.value)} style={{ width: 80 }} />
      <button onClick={() => onSave(Number(pts))}>Save</button>
    </div>
  );
}
