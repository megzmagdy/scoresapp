import { useEffect, useState } from 'react';
import { getPlayers, updatePlayerPoints, takeRankSnapshot, getLatestSnapshots, getLastSnapshotTime } from '@dpt/db';
import type { Player, RankSnapshot } from '@dpt/types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Camera, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MONO = "'Source Code Pro', monospace";
const ARCHIVO = "'Archivo', sans-serif";
const GOLD = '#E8B53A';

function TrendCell({ trend }: { trend: number }) {
  if (trend === 0) return <span className="flex items-center gap-1 justify-center text-[#555] text-sm"><Minus size={12} /> 0</span>;
  if (trend > 0)   return <span className="flex items-center gap-1 justify-center text-green-400 text-sm"><TrendingUp size={12} /> {trend}</span>;
  return               <span className="flex items-center gap-1 justify-center text-red-400 text-sm"><TrendingDown size={12} /> {Math.abs(trend)}</span>;
}

export function RankingsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [snapshots, setSnapshots] = useState<RankSnapshot[]>([]);
  const [lastSnapshot, setLastSnapshot] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [locking, setLocking] = useState(false);

  async function load() {
    const [ps, snaps, last] = await Promise.all([
      getPlayers(),
      getLatestSnapshots(),
      getLastSnapshotTime(),
    ]);
    setPlayers(ps);
    setSnapshots(snaps);
    setLastSnapshot(last);
  }

  useEffect(() => { load(); }, []);

  const snapshotMap = Object.fromEntries(snapshots.map(s => [s.player_id, s]));
  const ranked = [...players].sort((a, b) => b.total_points - a.total_points);

  function getTrend(player: Player, currentRank: number): number {
    const snap = snapshotMap[player.id];
    if (!snap) return 0;
    return snap.rank - currentRank;
  }

  async function savePoints(player: Player) {
    const val = edits[player.id];
    if (val === undefined) return;
    const pts = parseInt(val, 10);
    if (isNaN(pts)) return;
    try {
      await updatePlayerPoints(player.id, pts);
      await takeRankSnapshot('auto');
      setEdits(e => { const n = { ...e }; delete n[player.id]; return n; });
      await load();
    } catch (err) {
      console.error('Failed to save points:', err);
    }
  }

  async function lockSnapshot() {
    setLocking(true);
    try {
      await takeRankSnapshot('manual');
      await load();
    } catch (err) {
      console.error('Failed to lock snapshot:', err);
    } finally {
      setLocking(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#E8B53A] mb-1" style={{ fontFamily: MONO }}>// Live Standings</p>
          <h1 className="text-3xl font-black italic uppercase text-white" style={{ fontFamily: ARCHIVO }}>Rankings</h1>
          {lastSnapshot && (
            <p className="text-[10px] text-[#555] mt-1" style={{ fontFamily: MONO }}>
              Last snapshot: {new Date(lastSnapshot).toLocaleString()}
            </p>
          )}
        </div>
        <Button onClick={lockSnapshot} disabled={locking} variant="outline" className="border-[#E8B53A]/40 text-[#E8B53A] hover:bg-[#E8B53A]/10 gap-2">
          <Camera size={15} /> {locking ? 'Locking...' : 'Lock Snapshot'}
        </Button>
      </div>

      <div className="rounded-xl border border-white/8 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/8 hover:bg-transparent">
              <TableHead className="text-[#3a3a3a] text-[10px] uppercase tracking-widest w-14" style={{ fontFamily: MONO }}>Rank</TableHead>
              <TableHead className="text-[#3a3a3a] text-[10px] uppercase tracking-widest" style={{ fontFamily: MONO }}>Player</TableHead>
              <TableHead className="text-[#3a3a3a] text-[10px] uppercase tracking-widest text-center" style={{ fontFamily: MONO }}>Trend</TableHead>
              <TableHead className="text-[#3a3a3a] text-[10px] uppercase tracking-widest text-right" style={{ fontFamily: MONO }}>Points</TableHead>
              <TableHead className="text-[#3a3a3a] text-[10px] uppercase tracking-widest w-36" style={{ fontFamily: MONO }}>Edit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranked.map((player, i) => {
              const rank = i + 1;
              const trend = getTrend(player, rank);
              const isDirty = edits[player.id] !== undefined;
              return (
                <TableRow key={player.id} className="border-white/5 hover:bg-white/[0.02]">
                  <TableCell className="font-black italic text-[15px]" style={{ fontFamily: ARCHIVO, color: rank <= 3 ? GOLD : '#444' }}>
                    {rank}
                  </TableCell>
                  <TableCell>
                    <p className="text-white font-semibold">{player.name}</p>
                    <p className="text-[10px] text-[#555]" style={{ fontFamily: MONO }}>{player.code ?? '—'}</p>
                  </TableCell>
                  <TableCell><TrendCell trend={trend} /></TableCell>
                  <TableCell className="text-right font-bold text-white" style={{ fontFamily: ARCHIVO }}>
                    {player.total_points.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5 items-center">
                      <Input
                        type="number"
                        value={edits[player.id] ?? player.total_points}
                        onChange={e => setEdits(ed => ({ ...ed, [player.id]: e.target.value }))}
                        className="h-7 w-20 text-xs bg-[#1a1a1a] border-white/10 text-white"
                      />
                      <Button
                        size="sm"
                        onClick={() => savePoints(player)}
                        disabled={!isDirty}
                        className="h-7 text-xs bg-[#E8B53A] text-black hover:bg-[#d4a32e] disabled:opacity-30"
                      >
                        Save
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
