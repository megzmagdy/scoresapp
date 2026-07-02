import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getTournament, getTournamentParticipants, getMatches,
  getPlayers, addParticipant, saveMatchResult,
  savePlayerPoints, upsertMatch, generateBracket, updateTournamentStatus, takeRankSnapshot,
  removeParticipant, assignParticipantSlot, getOrCreateTeam,
  getCurrentRound, getSuggestedPoints, getTotalRounds,
} from '@dpt/db';
import type {
  Tournament, TournamentParticipantWithDetails,
  Match, Player, SetScore,
} from '@dpt/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Button } from '@dpt/ui/components/ui/button';
import { Badge } from '@dpt/ui/components/ui/badge';
import { Input } from '~/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '~/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '~/components/ui/table';
import { X, Shuffle, Target, AlignJustify, Zap } from 'lucide-react';
import { PageHeader, PageBody } from '~/components/PageHeader';

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

const setScoreSchema = z.object({
  p1: z.number().int().min(0),
  p2: z.number().int().min(0),
});
const matchSchema = z.object({
  sets: z.array(setScoreSchema),
});
type MatchFormValues = z.infer<typeof matchSchema>;

function MatchCard({
  match, p1Label, p2Label, p1Id, p2Id, onRequestConfirm, locked,
}: {
  match: Match;
  p1Label: string; p2Label: string;
  p1Id?: string; p2Id?: string;
  onRequestConfirm: (sets: SetScore[], winnerId: string, winnerLabel: string, loserLabel: string) => void;
  locked: boolean;
}) {
  const { register, control, getValues } = useForm<MatchFormValues>({
    resolver: zodResolver(matchSchema),
    defaultValues: { sets: match.sets.length > 0 ? match.sets : [{ p1: 0, p2: 0 }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'sets' });

  function requestWinner(winnerId: string, winnerLabel: string, loserLabel: string) {
    const { sets } = getValues();
    onRequestConfirm(sets, winnerId, winnerLabel, loserLabel);
  }

  return (
    <div className="bg-[#141414] border border-white/8 rounded-xl p-4">
      <p className="text-[10px] text-dim mb-3" style={{ fontFamily: MONO }}>
        Round {match.round} · Match {match.position + 1}
        {match.winner_id && <span className="text-green-400 ml-2">✓ Result set</span>}
      </p>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-white font-semibold flex-1 truncate">{p1Label}</span>
        <span className="text-white font-semibold flex-1 truncate text-right">{p2Label}</span>
      </div>
      <div className="flex flex-col gap-2 mb-3">
        {fields.map((field, i) => (
          <div key={field.id} className="flex items-center gap-2">
            <span className="text-dim text-[10px] w-8 shrink-0" style={{ fontFamily: MONO }}>Set {i + 1}</span>
            <Input
              type="number"
              {...register(`sets.${i}.p1` as const, { valueAsNumber: true })}
              disabled={locked}
              className="w-14 h-8 text-center text-sm bg-[#1a1a1a] border-white/10 text-white"
            />
            <span className="text-dim text-xs" style={{ fontFamily: MONO }}>vs</span>
            <Input
              type="number"
              {...register(`sets.${i}.p2` as const, { valueAsNumber: true })}
              disabled={locked}
              className="w-14 h-8 text-center text-sm bg-[#1a1a1a] border-white/10 text-white"
            />
            {!locked && fields.length > 1 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} className="h-7 w-7 text-dim hover:text-red-400 hover:bg-red-500/10">
                <X size={14} />
              </Button>
            )}
          </div>
        ))}
        {!locked && (
          <Button type="button" variant="outline" size="sm" onClick={() => append({ p1: 0, p2: 0 })} className="border-white/15 text-white hover:bg-white/5 self-start">
            + Add Set
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        {p1Id && (
          <Button size="sm" variant="outline" disabled={locked} onClick={() => requestWinner(p1Id, p1Label, p2Label)} className="text-xs border-white/15 text-white hover:bg-white/5 flex-1">
            {p1Label} wins
          </Button>
        )}
        {p2Id && (
          <Button size="sm" variant="outline" disabled={locked} onClick={() => requestWinner(p2Id, p2Label, p1Label)} className="text-xs border-white/15 text-white hover:bg-white/5 flex-1">
            {p2Label} wins
          </Button>
        )}
      </div>
    </div>
  );
}

function ParticipantsTab({
  tournament, participants, players, maxSlots, onAdd, onAddTeamPair, onRemove,
}: {
  tournament: Tournament;
  participants: TournamentParticipantWithDetails[];
  players: Player[];
  maxSlots: number;
  onAdd: (id: string) => Promise<void>;
  onAddTeamPair: (player1Id: string, player2Id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState('');
  const [player1Id, setPlayer1Id] = useState('');
  const [player2Id, setPlayer2Id] = useState('');
  const [adding, setAdding] = useState(false);
  const isTeam = tournament.tournament_type === 'team';
  const atCapacity = participants.length >= maxSlots;

  const usedPlayerIds = new Set(
    participants.flatMap(p => (p.team ? p.team.players.map(pl => pl.id) : p.player ? [p.player.id] : []))
  );
  const availablePlayers = players.filter(p => !usedPlayerIds.has(p.id));

  async function addSingle() {
    setAdding(true);
    try { await onAdd(selectedId); setSelectedId(''); } finally { setAdding(false); }
  }

  async function addPair() {
    setAdding(true);
    try { await onAddTeamPair(player1Id, player2Id); setPlayer1Id(''); setPlayer2Id(''); } finally { setAdding(false); }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {isTeam ? (
          <>
            <Select value={player1Id} onValueChange={setPlayer1Id} disabled={atCapacity}>
              <SelectTrigger className="bg-[#1a1a1a] border-white/10 text-white w-56">
                <SelectValue placeholder="Player 1..." />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/10">
                {availablePlayers.filter(p => p.id !== player2Id).map(p => (
                  <SelectItem key={p.id} value={p.id} className="text-white focus:bg-white/5">{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={player2Id} onValueChange={setPlayer2Id} disabled={atCapacity}>
              <SelectTrigger className="bg-[#1a1a1a] border-white/10 text-white w-56">
                <SelectValue placeholder="Player 2..." />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/10">
                {availablePlayers.filter(p => p.id !== player1Id).map(p => (
                  <SelectItem key={p.id} value={p.id} className="text-white focus:bg-white/5">{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={addPair}
              disabled={!player1Id || !player2Id || atCapacity || adding}
              className="bg-dpt-gold text-black hover:bg-[#d4a32e] font-bold"
            >
              Add
            </Button>
          </>
        ) : (
          <>
            <Select value={selectedId} onValueChange={setSelectedId} disabled={atCapacity}>
              <SelectTrigger className="bg-[#1a1a1a] border-white/10 text-white w-64">
                <SelectValue placeholder="Select player..." />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/10">
                {availablePlayers.map(p => (
                  <SelectItem key={p.id} value={p.id} className="text-white focus:bg-white/5">{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={addSingle}
              disabled={!selectedId || atCapacity || adding}
              className="bg-dpt-gold text-black hover:bg-[#d4a32e] font-bold"
            >
              Add
            </Button>
          </>
        )}
        <span className="text-dim text-sm" style={{ fontFamily: MONO }}>{participants.length}/{maxSlots}</span>
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
                <TableCell className="text-dim text-xs" style={{ fontFamily: MONO }}>{p.bracket_position ?? '—'}</TableCell>
                <TableCell className="text-white font-semibold">{getLabel(p)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => onRemove(p.id)} className="h-7 w-7 text-dim hover:text-red-400 hover:bg-red-500/10">
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
              <p className="text-[10px] text-dim mb-1.5" style={{ fontFamily: MONO }}>Slot {slot}</p>
              <Select
                value={assigned?.id ?? '__empty__'}
                onValueChange={v => { if (v !== '__empty__') onAssign(v, slot); }}
              >
                <SelectTrigger className="h-8 text-xs bg-[#1a1a1a] border-white/10 text-white">
                  <SelectValue placeholder="Empty" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10">
                  <SelectItem value="__empty__" className="text-dim focus:bg-white/5">Empty</SelectItem>
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
          <Zap size={14} /> Generate Bracket
        </Button>
      )}
    </div>
  );
}

function PointsTab({
  participants, matches, totalRounds, tournament, onSavePoints, onComplete,
}: {
  participants: TournamentParticipantWithDetails[];
  matches: Match[];
  totalRounds: number;
  tournament: Tournament;
  onSavePoints: (participantId: string, entries: { player_id: string; points: number }[]) => Promise<void>;
  onComplete: () => Promise<void>;
}) {
  const [edits, setEdits] = useState<Record<string, string>>({}); // key: `${participantId}:${playerId}`
  const [completing, setCompleting] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const bracketComplete = getCurrentRound(matches) === 'complete';

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-white/8 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/8 hover:bg-transparent">
              <TableHead className="text-[#3a3a3a] text-[10px] uppercase tracking-widest" style={{ fontFamily: MONO }}>Participant</TableHead>
              <TableHead className="text-[#3a3a3a] text-[10px] uppercase tracking-widest" style={{ fontFamily: MONO }}>Player</TableHead>
              <TableHead className="text-[#3a3a3a] text-[10px] uppercase tracking-widest text-right" style={{ fontFamily: MONO }}>Points</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.flatMap((p) => {
              const players = p.player ? [p.player] : p.team?.players ?? [];
              // Only prefill a non-zero suggestion once the bracket is actually decided —
              // before that, "reached the final" and "won the final" are indistinguishable
              // (see packages/db/src/pointsMath.ts), so suggesting e.g. 100 for someone
              // who merely reached an unplayed final would be misleading.
              const suggested = bracketComplete ? getSuggestedPoints(p.id, matches, totalRounds) : 0;
              return players.map((player) => {
                const key = `${p.id}:${player.id}`;
                const val = edits[key] ?? String(suggested);
                return (
                  <TableRow key={key} className="border-white/5 hover:bg-white/2">
                    <TableCell className="text-white font-semibold">{getLabel(p)}</TableCell>
                    <TableCell className="text-[#aaa]">{player.name}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={val}
                        onChange={(e) => setEdits((ed) => ({ ...ed, [key]: e.target.value }))}
                        className="w-24 h-7 text-right text-sm bg-[#1a1a1a] border-white/10 text-white ml-auto"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        disabled={savingId === p.id}
                        onClick={async () => {
                          const entries = players.map((pl) => {
                            const k = `${p.id}:${pl.id}`;
                            return { player_id: pl.id, points: Number(edits[k] ?? suggested) };
                          });
                          setSavingId(p.id);
                          try {
                            await onSavePoints(p.id, entries);
                          } finally {
                            setSavingId(null);
                          }
                        }}
                        className="h-7 text-xs bg-dpt-gold text-black hover:bg-[#d4a32e] disabled:opacity-50"
                      >
                        Save
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              });
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

  async function loadAll() {
    if (!id) return;
    try {
      const [t, parts, ms, ps] = await Promise.all([
        getTournament(id),
        getTournamentParticipants(id),
        getMatches(id),
        getPlayers(),
      ]);
      setTournament(t);
      setParticipants(parts);
      setMatches(ms);
      setPlayers(ps);
    } catch (err) {
      console.error('Failed to load tournament:', err);
    }
  }

  // loadAll is redefined every render; adding it here would loop forever.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAll(); }, [id]);

  if (!tournament) return <div className="text-dim p-8">Loading...</div>;

  const maxSlots = tournament.bracket_format === 'R32' ? 32 : tournament.bracket_format === 'R16' ? 16 : 8;
  const isTeam = tournament.tournament_type === 'team';
  const pMap = Object.fromEntries(participants.map(p => [p.id, p]));
  const currentRound = getCurrentRound(matches);
  const totalRounds = getTotalRounds(tournament.bracket_format);

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

  async function handleAddTeamPair(player1Id: string, player2Id: string) {
    try {
      const team = await getOrCreateTeam([player1Id, player2Id]);
      await addParticipant({
        tournament_id: id!,
        team_id: team.id,
        bracket_position: participants.length + 1,
      });
      getTournamentParticipants(id!).then(setParticipants);
    } catch (err) {
      console.error('Failed to add team:', err);
    }
  }

  async function handleRemove(participantId: string) {
    try {
      await removeParticipant(participantId);
      getTournamentParticipants(id!).then(setParticipants);
    } catch (err) {
      console.error('Failed to remove participant:', err);
    }
  }

  async function handleAssign(participantId: string, slot: number) {
    try {
      await assignParticipantSlot(participantId, slot);
      getTournamentParticipants(id!).then(setParticipants);
    } catch (err) {
      console.error('Failed to assign slot:', err);
    }
  }

  async function handleGenerateMatches() {
    if (!tournament) return;
    const sorted = [...participants].sort((a, b) => (a.bracket_position ?? 99) - (b.bracket_position ?? 99));
    const seededIds = sorted.map((p) => p.id);
    try {
      await generateBracket(id!, tournament.bracket_format, seededIds);
      getMatches(id!).then(setMatches);
    } catch (err) {
      console.error('Failed to generate bracket:', err);
    }
  }

  async function handleSaveMatchResult(matchId: string, s1: number, s2: number, winnerId: string) {
    if (!tournament) return;
    try {
      await saveMatchResult(matchId, s1, s2, winnerId);
      const match = matches.find(m => m.id === matchId);
      if (match) {
        const isFinal = match.round === totalRounds;
        if (isFinal) {
          if (tournament.status !== 'completed') {
            await handleComplete();
          }
        } else {
          const nextRound = match.round + 1;
          const nextPos = Math.floor(match.position / 2);
          const nextMatch = matches.find(m => m.round === nextRound && m.position === nextPos);
          if (nextMatch) {
            const isEvenSlot = match.position % 2 === 0;
            await upsertMatch({
              ...nextMatch,
              [isEvenSlot ? 'participant1_id' : 'participant2_id']: winnerId,
            });
          }
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
          <p className="text-dim text-sm" style={{ fontFamily: MONO }}>
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
            players={players} maxSlots={maxSlots}
            onAdd={handleAdd} onAddTeamPair={handleAddTeamPair} onRemove={handleRemove}
          />
        </TabsContent>

        <TabsContent value="bracket">
          <BracketTab
            participants={participants} maxSlots={maxSlots} matches={matches}
            onAssign={handleAssign} onGenerateMatches={handleGenerateMatches}
          />
        </TabsContent>

        <TabsContent value="matches">
          {matches.length > 0 && (
            <p className="text-[10px] text-dim mb-3 uppercase tracking-widest" style={{ fontFamily: MONO }}>
              {currentRound === 'complete' ? 'Bracket complete' : `Current round: ${currentRound}`}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {matches.length === 0
              ? <p className="text-dim text-sm col-span-2">No matches yet — generate them in the Bracket tab.</p>
              : matches.map(m => {
                  const p1 = pMap[m.participant1_id ?? ''];
                  const p2 = pMap[m.participant2_id ?? ''];
                  return (
                    <MatchCard
                      key={m.id} match={m}
                      p1Label={getLabel(p1)} p2Label={getLabel(p2)}
                      p1Id={p1?.id} p2Id={p2?.id}
                      onSave={(s1, s2, wId) => handleSaveMatchResult(m.id, s1, s2, wId)}
                      locked={tournament.status === 'completed'}
                    />
                  );
                })
            }
          </div>
        </TabsContent>

        <TabsContent value="points">
          <PointsTab
            participants={participants} matches={matches} totalRounds={totalRounds} tournament={tournament}
            onSavePoints={async (pId, entries) => { await savePlayerPoints(pId, entries); getTournamentParticipants(id!).then(setParticipants); }}
            onComplete={handleComplete}
          />
        </TabsContent>
      </Tabs>
      </PageBody>
    </>
  );
}
