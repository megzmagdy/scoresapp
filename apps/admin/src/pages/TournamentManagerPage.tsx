import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getTournament, getTournamentParticipants, getMatches,
  getPlayers, getTeams, addParticipant, saveMatchResult,
  awardPoints, upsertMatch, updateTournamentStatus, takeRankSnapshot,
  supabase, requireAuth,
} from '@dpt/db';
import type {
  Tournament, TournamentParticipantWithDetails,
  Match, Player, TeamWithPlayers,
} from '@dpt/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { X, Shuffle, Target, AlignJustify, Zap } from 'lucide-react';
import { PageHeader, PageBody } from '../components/PageHeader';

import { MONO, statusColor } from '~/lib/theme';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getLabel(p?: TournamentParticipantWithDetails): string {
  if (!p) return 'TBD';
  if (p.player) return p.player.name;
  if (p.team) return p.team.players.map(pl => pl.name).join(' & ');
  return 'TBD';
}

const matchSchema = z.object({
  score1: z.number().int().min(0),
  score2: z.number().int().min(0),
});
type MatchFormValues = z.infer<typeof matchSchema>;

function MatchCard({
  match, p1Label, p2Label, p1Id, p2Id, onSave,
}: {
  match: Match;
  p1Label: string; p2Label: string;
  p1Id?: string; p2Id?: string;
  onSave: (s1: number, s2: number, winnerId: string) => Promise<void>;
}) {
  const { register, getValues, formState: { isSubmitting } } = useForm<MatchFormValues>({
    resolver: zodResolver(matchSchema),
    defaultValues: { score1: match.score1 ?? 0, score2: match.score2 ?? 0 },
  });

  async function saveWinner(winnerId: string) {
    const { score1, score2 } = getValues();
    await onSave(score1, score2, winnerId);
  }

  return (
    <div className="bg-[#141414] border border-white/8 rounded-xl p-4">
      <p className="text-[10px] text-[#555] mb-3" style={{ fontFamily: MONO }}>
        Round {match.round} · Match {match.position}
        {match.winner_id && <span className="text-green-400 ml-2">✓ Result set</span>}
      </p>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-white font-semibold flex-1 truncate">{p1Label}</span>
        <Input type="number" {...register('score1')} className="w-14 h-8 text-center text-sm bg-[#1a1a1a] border-white/10 text-white" />
        <span className="text-[#555] text-xs" style={{ fontFamily: MONO }}>vs</span>
        <Input type="number" {...register('score2')} className="w-14 h-8 text-center text-sm bg-[#1a1a1a] border-white/10 text-white" />
        <span className="text-white font-semibold flex-1 truncate text-right">{p2Label}</span>
      </div>
      <div className="flex gap-2">
        {p1Id && (
          <Button size="sm" variant="outline" disabled={isSubmitting} onClick={() => saveWinner(p1Id)} className="text-xs border-white/15 text-white hover:bg-white/5 flex-1">
            {p1Label} wins
          </Button>
        )}
        {p2Id && (
          <Button size="sm" variant="outline" disabled={isSubmitting} onClick={() => saveWinner(p2Id)} className="text-xs border-white/15 text-white hover:bg-white/5 flex-1">
            {p2Label} wins
          </Button>
        )}
      </div>
    </div>
  );
}

function ParticipantsTab({
  tournament, participants, players, teams, maxSlots, onAdd, onRemove,
}: {
  tournament: Tournament;
  participants: TournamentParticipantWithDetails[];
  players: Player[];
  teams: TeamWithPlayers[];
  maxSlots: number;
  onAdd: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState('');
  const [adding, setAdding] = useState(false);
  const isTeam = tournament.tournament_type === 'team';
  const added = new Set([
    ...participants.map(p => p.player_id).filter(Boolean),
    ...participants.map(p => p.team_id).filter(Boolean),
  ]);
  const options = isTeam
    ? teams.filter(t => !added.has(t.id)).map(t => ({ id: t.id, label: t.players.map(p => p.name).join(' & ') }))
    : players.filter(p => !added.has(p.id)).map(p => ({ id: p.id, label: p.name }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Select value={selectedId} onValueChange={setSelectedId} disabled={participants.length >= maxSlots}>
          <SelectTrigger className="bg-[#1a1a1a] border-white/10 text-white w-64">
            <SelectValue placeholder={`Select ${isTeam ? 'team' : 'player'}...`} />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-white/10">
            {options.map(o => <SelectItem key={o.id} value={o.id} className="text-white focus:bg-white/5">{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button
          onClick={async () => { setAdding(true); try { await onAdd(selectedId); setSelectedId(''); } finally { setAdding(false); } }}
          disabled={!selectedId || participants.length >= maxSlots || adding}
          className="bg-dpt-gold text-black hover:bg-[#d4a32e] font-bold"
        >
          Add
        </Button>
        <span className="text-[#555] text-sm" style={{ fontFamily: MONO }}>{participants.length}/{maxSlots}</span>
      </div>
      <div className="rounded-xl border border-white/8 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/8 hover:bg-transparent">
              <TableHead className="text-[#3a3a3a] text-[10px] uppercase tracking-widest" style={{ fontFamily: MONO }}>Slot</TableHead>
              <TableHead className="text-[#3a3a3a] text-[10px] uppercase tracking-widest" style={{ fontFamily: MONO }}>{isTeam ? 'Team' : 'Player'}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.map(p => (
              <TableRow key={p.id} className="border-white/5 hover:bg-white/2">
                <TableCell className="text-[#555] text-xs" style={{ fontFamily: MONO }}>{p.bracket_position ?? '—'}</TableCell>
                <TableCell className="text-white font-semibold">{getLabel(p)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => onRemove(p.id)} className="h-7 w-7 text-[#555] hover:text-red-400 hover:bg-red-500/10">
                    <X size={14} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function BracketTab({
  participants, maxSlots, matches, onAssign, onGenerateMatches,
}: {
  participants: TournamentParticipantWithDetails[];
  maxSlots: number;
  matches: Match[];
  onAssign: (participantId: string, slot: number) => Promise<void>;
  onGenerateMatches: () => Promise<void>;
}) {
  const [working, setWorking] = useState(false);

  async function run(fn: () => Promise<void>) {
    setWorking(true);
    try { await fn(); } finally { setWorking(false); }
  }

  async function randomize() {
    const shuffled = shuffle(participants);
    for (let i = 0; i < shuffled.length; i++) await onAssign(shuffled[i].id, i + 1);
  }

  async function seedAndRandomize() {
    const sorted = [...participants].sort((a, b) => (b.player?.total_points ?? 0) - (a.player?.total_points ?? 0));
    const half = Math.ceil(sorted.length / 2);
    const top = shuffle(sorted.slice(0, half));
    const bottom = shuffle(sorted.slice(half));
    const combined = top.flatMap((p, i) => bottom[i] ? [p, bottom[i]] : [p]);
    for (let i = 0; i < combined.length; i++) await onAssign(combined[i].id, i + 1);
  }

  async function autoAssign() {
    const sorted = [...participants].sort((a, b) => (b.player?.total_points ?? 0) - (a.player?.total_points ?? 0));
    for (let i = 0; i < sorted.length; i++) await onAssign(sorted[i].id, i + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => run(randomize)} disabled={working} variant="outline" className="border-white/15 text-white hover:bg-white/5 gap-2">
          <Shuffle size={14} /> Randomize
        </Button>
        <Button onClick={() => run(seedAndRandomize)} disabled={working} variant="outline" className="border-dpt-gold/30 text-dpt-gold hover:bg-dpt-gold/10 gap-2">
          <Target size={14} /> Seed & Randomize
        </Button>
        <Button onClick={() => run(autoAssign)} disabled={working} variant="outline" className="border-white/15 text-white hover:bg-white/5 gap-2">
          <AlignJustify size={14} /> Auto-assign by Rank
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Array.from({ length: maxSlots }, (_, i) => i + 1).map(slot => {
          const assigned = participants.find(p => p.bracket_position === slot);
          return (
            <div key={slot} className="bg-[#141414] border border-white/8 rounded-lg p-3">
              <p className="text-[10px] text-[#555] mb-1.5" style={{ fontFamily: MONO }}>Slot {slot}</p>
              <Select
                value={assigned?.id ?? '__empty__'}
                onValueChange={v => { if (v !== '__empty__') onAssign(v, slot); }}
              >
                <SelectTrigger className="h-8 text-xs bg-[#1a1a1a] border-white/10 text-white">
                  <SelectValue placeholder="Empty" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10">
                  <SelectItem value="__empty__" className="text-[#555] focus:bg-white/5">Empty</SelectItem>
                  {participants.map(p => (
                    <SelectItem key={p.id} value={p.id} className="text-white focus:bg-white/5">{getLabel(p)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>

      {matches.length === 0 && participants.length >= 2 && (
        <Button onClick={() => run(onGenerateMatches)} disabled={working} className="bg-dpt-gold text-black hover:bg-[#d4a32e] font-bold gap-2 self-start">
          <Zap size={14} /> Generate Round 1 Matches
        </Button>
      )}
    </div>
  );
}

function PointsTab({
  participants, tournament, onSavePoints, onComplete,
}: {
  participants: TournamentParticipantWithDetails[];
  tournament: Tournament;
  onSavePoints: (id: string, pts: number) => Promise<void>;
  onComplete: () => Promise<void>;
}) {
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [completing, setCompleting] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-white/8 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/8 hover:bg-transparent">
              <TableHead className="text-[#3a3a3a] text-[10px] uppercase tracking-widest" style={{ fontFamily: MONO }}>Participant</TableHead>
              <TableHead className="text-[#3a3a3a] text-[10px] uppercase tracking-widest text-right" style={{ fontFamily: MONO }}>Points</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.map(p => {
              const val = edits[p.id] ?? String(p.points_awarded);
              return (
                <TableRow key={p.id} className="border-white/5 hover:bg-white/2">
                  <TableCell className="text-white font-semibold">{getLabel(p)}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={val}
                      onChange={e => setEdits(ed => ({ ...ed, [p.id]: e.target.value }))}
                      className="w-24 h-7 text-right text-sm bg-[#1a1a1a] border-white/10 text-white ml-auto"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => onSavePoints(p.id, Number(val))}
                      disabled={edits[p.id] === undefined}
                      className="h-7 text-xs bg-dpt-gold text-black hover:bg-[#d4a32e] disabled:opacity-30"
                    >
                      Save
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {tournament.status !== 'completed' && (
        <Button
          onClick={async () => { setCompleting(true); try { await onComplete(); } finally { setCompleting(false); } }}
          disabled={completing}
          variant="outline"
          className="self-start border-green-500/30 text-green-400 hover:bg-green-500/10 font-bold gap-2"
        >
          {completing ? 'Completing...' : '✓ Mark Tournament Complete'}
        </Button>
      )}
    </div>
  );
}

export function TournamentManagerPage() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<TournamentParticipantWithDetails[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<TeamWithPlayers[]>([]);

  async function loadAll() {
    if (!id) return;
    try {
      const [t, parts, ms, ps, ts] = await Promise.all([
        getTournament(id),
        getTournamentParticipants(id),
        getMatches(id),
        getPlayers(),
        getTeams(),
      ]);
      setTournament(t);
      setParticipants(parts);
      setMatches(ms);
      setPlayers(ps);
      setTeams(ts);
    } catch (err) {
      console.error('Failed to load tournament:', err);
    }
  }

  useEffect(() => { loadAll(); }, [id]);

  if (!tournament) return <div className="text-[#555] p-8">Loading...</div>;

  const maxSlots = tournament.bracket_format === 'R32' ? 32 : tournament.bracket_format === 'R16' ? 16 : 8;
  const isTeam = tournament.tournament_type === 'team';
  const pMap = Object.fromEntries(participants.map(p => [p.id, p]));

  async function handleAdd(entityId: string) {
    try {
      await addParticipant({
        tournament_id: id!,
        [isTeam ? 'team_id' : 'player_id']: entityId,
        bracket_position: participants.length + 1,
      });
      getTournamentParticipants(id!).then(setParticipants);
    } catch (err) {
      console.error('Failed to add participant:', err);
    }
  }

  async function handleRemove(participantId: string) {
    try {
      await requireAuth();
      await supabase.from('tournament_participants').delete().eq('id', participantId);
      getTournamentParticipants(id!).then(setParticipants);
    } catch (err) {
      console.error('Failed to remove participant:', err);
    }
  }

  async function handleAssign(participantId: string, slot: number) {
    try {
      await requireAuth();
      await supabase.from('tournament_participants').update({ bracket_position: slot }).eq('id', participantId);
      getTournamentParticipants(id!).then(setParticipants);
    } catch (err) {
      console.error('Failed to assign slot:', err);
    }
  }

  async function handleGenerateMatches() {
    const sorted = [...participants].sort((a, b) => (a.bracket_position ?? 99) - (b.bracket_position ?? 99));
    try {
      for (let i = 0; i < Math.floor(sorted.length / 2); i++) {
        await upsertMatch({
          tournament_id: id!,
          round: 1,
          position: i + 1,
          participant1_id: sorted[i * 2]?.id ?? null,
          participant2_id: sorted[i * 2 + 1]?.id ?? null,
        });
      }
      getMatches(id!).then(setMatches);
    } catch (err) {
      console.error('Failed to generate matches:', err);
    }
  }

  async function handleSaveMatchResult(matchId: string, s1: number, s2: number, winnerId: string) {
    try {
      await saveMatchResult(matchId, s1, s2, winnerId);
      const match = matches.find(m => m.id === matchId);
      if (match) {
        const nextRound = match.round + 1;
        const nextPos = Math.ceil(match.position / 2);
        const nextMatch = matches.find(m => m.round === nextRound && m.position === nextPos);
        if (nextMatch) {
          const isOddSlot = match.position % 2 === 1;
          await upsertMatch({
            ...nextMatch,
            [isOddSlot ? 'participant1_id' : 'participant2_id']: winnerId,
          });
        }
      }
      getMatches(id!).then(setMatches);
    } catch (err) {
      console.error('Failed to save match result:', err);
    }
  }

  async function handleComplete() {
    try {
      await updateTournamentStatus(id!, 'completed');
      await takeRankSnapshot('tournament_close');
      setTournament(t => t ? { ...t, status: 'completed' } : t);
    } catch (err) {
      console.error('Failed to complete tournament:', err);
    }
  }

  const sc = statusColor(tournament.status);

  return (
    <>
      <PageHeader
        label="// Tournament Manager"
        title={tournament.name}
        meta={
          <p className="text-[#555] text-sm" style={{ fontFamily: MONO }}>
            {tournament.venue} · {tournament.date} · {tournament.bracket_format} · {tournament.tournament_type}
          </p>
        }
        action={
          <Badge style={{ background: `${sc}22`, color: sc, border: `1px solid ${sc}44`, fontFamily: MONO }} className="text-[10px] uppercase tracking-widest mt-1 shrink-0">
            {tournament.status}
          </Badge>
        }
      />
      <PageBody>
      <Tabs defaultValue="participants">
        <TabsList className="bg-[#141414] border border-white/8 mb-6">
          {['participants', 'bracket', 'matches', 'points'].map(t => (
            <TabsTrigger key={t} value={t} className="capitalize data-[state=active]:bg-dpt-gold/15 data-[state=active]:text-dpt-gold">
              {t}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="participants">
          <ParticipantsTab
            tournament={tournament} participants={participants}
            players={players} teams={teams} maxSlots={maxSlots}
            onAdd={handleAdd} onRemove={handleRemove}
          />
        </TabsContent>

        <TabsContent value="bracket">
          <BracketTab
            participants={participants} maxSlots={maxSlots} matches={matches}
            onAssign={handleAssign} onGenerateMatches={handleGenerateMatches}
          />
        </TabsContent>

        <TabsContent value="matches">
          <div className="grid gap-3 sm:grid-cols-2">
            {matches.length === 0
              ? <p className="text-[#555] text-sm col-span-2">No matches yet — generate them in the Bracket tab.</p>
              : matches.map(m => {
                  const p1 = pMap[m.participant1_id ?? ''];
                  const p2 = pMap[m.participant2_id ?? ''];
                  return (
                    <MatchCard
                      key={m.id} match={m}
                      p1Label={getLabel(p1)} p2Label={getLabel(p2)}
                      p1Id={p1?.id} p2Id={p2?.id}
                      onSave={(s1, s2, wId) => handleSaveMatchResult(m.id, s1, s2, wId)}
                    />
                  );
                })
            }
          </div>
        </TabsContent>

        <TabsContent value="points">
          <PointsTab
            participants={participants} tournament={tournament}
            onSavePoints={async (pId, pts) => { await awardPoints(pId, pts); getTournamentParticipants(id!).then(setParticipants); }}
            onComplete={handleComplete}
          />
        </TabsContent>
      </Tabs>
      </PageBody>
    </>
  );
}
