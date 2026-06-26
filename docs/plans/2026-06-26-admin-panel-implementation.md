# Admin Panel UI + Supabase Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a fully styled admin panel with shadcn + dark gold theme, wired to real Supabase data, covering player management, rank tracking, tournament/bracket/match management, and public site wire-up.

**Architecture:** Feature-by-feature (schema → queries → admin UI → public wire-up). All rank trend data flows through a single `rank_snapshots` table. shadcn installed directly into `apps/admin` with CSS variable overrides for the dark gold palette. Tier computation uses `getTier(score, maxScore)` from `@dpt/ui`.

**Tech Stack:** React 19, Vite 7, Tailwind v4, shadcn/ui, Supabase, TypeScript, pnpm workspaces

---

## Phase 1: Foundation

### Task 1: Supabase Schema Migrations

**Files:**
- Create: `supabase/migrations/20260626_admin_panel.sql`

**Step 1: Create migration file**

```sql
-- Add code and venue columns to players
alter table players add column if not exists code  text;
alter table players add column if not exists venue text;

-- Create rank_snapshots table
create table if not exists rank_snapshots (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null references players(id) on delete cascade,
  rank          int not null,
  total_points  int not null,
  snapshot_type text not null check (snapshot_type in ('auto', 'tournament_close', 'manual')),
  created_at    timestamptz default now()
);

create index if not exists rank_snapshots_player_created
  on rank_snapshots (player_id, created_at desc);
```

**Step 2: Apply via Supabase dashboard**

Go to Supabase dashboard → SQL Editor → paste and run the migration.

**Step 3: Verify**

In Supabase Table Editor, confirm:
- `players` table has `code` and `venue` columns (nullable)
- `rank_snapshots` table exists with all 6 columns

**Step 4: Commit**

```bash
git add supabase/
git commit -m "feat: add rank_snapshots table and player code/venue columns"
```

---

### Task 2: Update TypeScript Types

**Files:**
- Modify: `packages/types/src/index.ts`

**Step 1: Update Player interface** (add `code` and `venue` as nullable)

```typescript
export interface Player {
  id: string;
  name: string;
  code: string | null;
  venue: string | null;
  total_points: number;
  created_at: string;
}
```

**Step 2: Add RankSnapshot type** (insert after the Player block)

```typescript
export type SnapshotType = 'auto' | 'tournament_close' | 'manual';

export interface RankSnapshot {
  id: string;
  player_id: string;
  rank: number;
  total_points: number;
  snapshot_type: SnapshotType;
  created_at: string;
}
```

**Step 3: Run type-check**

```bash
pnpm -r type-check
```

Expected: passes. `code`/`venue` are nullable so all existing callers still compile.

**Step 4: Commit**

```bash
git add packages/types/src/index.ts
git commit -m "feat(types): add code/venue to Player, add RankSnapshot type"
```

---

### Task 3: Add Rank Snapshot DB Queries

**Files:**
- Create: `packages/db/src/queries/rankSnapshots.ts`
- Modify: `packages/db/src/index.ts`

**Step 1: Create the queries file**

```typescript
import { supabase } from '../client';
import type { RankSnapshot, SnapshotType } from '@dpt/types';

export async function takeRankSnapshot(type: SnapshotType): Promise<void> {
  const { data: players, error } = await supabase
    .from('players')
    .select('id, total_points')
    .order('total_points', { ascending: false });
  if (error) throw error;

  const snapshots = players.map((p, i) => ({
    player_id: p.id,
    rank: i + 1,
    total_points: p.total_points,
    snapshot_type: type,
  }));

  const { error: insertError } = await supabase
    .from('rank_snapshots')
    .insert(snapshots);
  if (insertError) throw insertError;
}

export async function getLatestSnapshots(): Promise<RankSnapshot[]> {
  const { data, error } = await supabase
    .from('rank_snapshots')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;

  const seen = new Set<string>();
  return data.filter((s) => {
    if (seen.has(s.player_id)) return false;
    seen.add(s.player_id);
    return true;
  });
}

export async function getLastSnapshotTime(): Promise<string | null> {
  const { data, error } = await supabase
    .from('rank_snapshots')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.created_at ?? null;
}
```

**Step 2: Export from db package**

In `packages/db/src/index.ts`, append:

```typescript
export * from './queries/rankSnapshots';
```

**Step 3: Type-check**

```bash
pnpm -r type-check
```

Expected: passes.

**Step 4: Commit**

```bash
git add packages/db/src/queries/rankSnapshots.ts packages/db/src/index.ts
git commit -m "feat(db): add rank snapshot queries"
```

---

### Task 4: Install shadcn in apps/admin

**Files:**
- Modify: `apps/admin/src/index.css`
- Create: `apps/admin/components.json` (auto-generated)
- Create: `apps/admin/src/lib/utils.ts` (auto-generated)

**Step 1: Run shadcn init from inside apps/admin**

```bash
cd apps/admin && npx shadcn@latest init
```

When prompted: Default style, Neutral base color, yes to CSS variables. This generates `components.json` and `src/lib/utils.ts`, and patches `src/index.css`.

**Step 2: Override CSS variables for dark gold theme**

In `apps/admin/src/index.css`, replace the generated `:root` block entirely with:

```css
:root {
  --background: 0 0% 5.5%;
  --foreground: 0 0% 94%;
  --card: 0 0% 7.8%;
  --card-foreground: 0 0% 94%;
  --popover: 0 0% 7.8%;
  --popover-foreground: 0 0% 94%;
  --primary: 42 78% 57%;
  --primary-foreground: 0 0% 5.5%;
  --secondary: 0 0% 14%;
  --secondary-foreground: 0 0% 94%;
  --muted: 0 0% 14%;
  --muted-foreground: 0 0% 50%;
  --accent: 42 78% 57%;
  --accent-foreground: 0 0% 5.5%;
  --destructive: 0 72% 71%;
  --destructive-foreground: 0 0% 5.5%;
  --border: rgba(255, 255, 255, 0.07);
  --input: 0 0% 14%;
  --ring: 42 78% 57%;
  --radius: 0.5rem;
}
```

Note: the shadcn init may produce Tailwind v4 `@theme` syntax instead of `:root`. If so, adapt the variable names to match the `@theme` block format it generated.

**Step 3: Install shadcn components needed across all pages**

```bash
npx shadcn@latest add button dialog table badge tabs select input label textarea dropdown-menu
```

**Step 4: Add lucide-react to apps/admin**

```bash
pnpm --filter @dpt/admin add lucide-react
```

**Step 5: Verify dev server loads**

```bash
pnpm --filter @dpt/admin dev
```

Navigate to http://localhost:3001. Login page renders without errors.

**Step 6: Commit**

```bash
cd ../..
git add apps/admin/
git commit -m "feat(admin): install shadcn with dark gold theme"
```

---

## Phase 2: Players Feature

### Task 5: Players Page

**Files:**
- Modify: `apps/admin/src/pages/PlayersPage.tsx`

**Step 1: Rewrite PlayersPage**

Replace the entire file with:

```typescript
import { useEffect, useState } from 'react';
import { getPlayers, upsertPlayer, deletePlayer, takeRankSnapshot } from '@dpt/db';
import type { Player, Venue } from '@dpt/types';
import { getTier } from '@dpt/ui';
import { Button } from '../components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { MoreHorizontal, Plus, Pencil, Trash2 } from 'lucide-react';

const VENUES: Venue[] = ['Mansoura Padel Point', 'Ace Town Complex', 'Padel H'];
const MONO = "'Source Code Pro', monospace";
const ARCHIVO = "'Archivo', sans-serif";

type PlayerForm = { name: string; code: string; venue: Venue; total_points: number };

function nextCode(players: Player[]): string {
  const nums = players
    .map(p => p.code)
    .filter(Boolean)
    .map(c => parseInt((c as string).replace('DPT-', ''), 10))
    .filter(n => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `DPT-${String(max + 1).padStart(2, '0')}`;
}

function PlayerDialog({
  initial, players, onSave, trigger,
}: {
  initial?: Player;
  players: Player[];
  onSave: (form: PlayerForm) => Promise<void>;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [venue, setVenue] = useState<Venue>(VENUES[0]);
  const [points, setPoints] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setCode(initial?.code ?? nextCode(players));
    setVenue((initial?.venue as Venue) ?? VENUES[0]);
    setPoints(initial?.total_points ?? 0);
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ name: name.trim(), code: code.trim(), venue, total_points: points });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-[#141414] border-white/10">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: ARCHIVO }} className="text-white">
            {initial ? 'Edit Player' : 'Add Player'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#a0a0a8] text-xs uppercase tracking-widest" style={{ fontFamily: MONO }}>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} required className="bg-[#1a1a1a] border-white/10 text-white" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#a0a0a8] text-xs uppercase tracking-widest" style={{ fontFamily: MONO }}>Code</Label>
            <Input value={code} onChange={e => setCode(e.target.value)} placeholder="DPT-01" className="bg-[#1a1a1a] border-white/10 text-white" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#a0a0a8] text-xs uppercase tracking-widest" style={{ fontFamily: MONO }}>Venue</Label>
            <Select value={venue} onValueChange={v => setVenue(v as Venue)}>
              <SelectTrigger className="bg-[#1a1a1a] border-white/10 text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/10">
                {VENUES.map(v => (
                  <SelectItem key={v} value={v} className="text-white focus:bg-white/5">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#a0a0a8] text-xs uppercase tracking-widest" style={{ fontFamily: MONO }}>Points</Label>
            <Input type="number" value={points} onChange={e => setPoints(Number(e.target.value))} className="bg-[#1a1a1a] border-white/10 text-white" />
          </div>
          <Button type="submit" disabled={saving} className="bg-[#E8B53A] text-black hover:bg-[#d4a32e] font-bold mt-2">
            {saving ? 'Saving...' : initial ? 'Save Changes' : 'Add Player'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Player | null>(null);

  useEffect(() => { getPlayers().then(setPlayers); }, []);

  const maxPts = players[0]?.total_points ?? 1;

  async function handleSave(existing: Player | undefined, form: PlayerForm) {
    const saved = await upsertPlayer({ id: existing?.id ?? crypto.randomUUID(), ...form });
    setPlayers(prev =>
      existing
        ? prev.map(p => p.id === saved.id ? saved : p)
        : [...prev, saved].sort((a, b) => b.total_points - a.total_points)
    );
    if (form.total_points !== existing?.total_points) {
      await takeRankSnapshot('auto');
    }
  }

  async function handleDelete(p: Player) {
    await deletePlayer(p.id);
    setPlayers(prev => prev.filter(x => x.id !== p.id));
    setDeleteTarget(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#E8B53A] mb-1" style={{ fontFamily: MONO }}>// Management</p>
          <h1 className="text-3xl font-black italic uppercase text-white" style={{ fontFamily: ARCHIVO }}>Players</h1>
        </div>
        <PlayerDialog
          players={players}
          onSave={form => handleSave(undefined, form)}
          trigger={
            <Button className="bg-[#E8B53A] text-black hover:bg-[#d4a32e] font-bold gap-2">
              <Plus size={16} /> Add Player
            </Button>
          }
        />
      </div>

      <div className="rounded-xl border border-white/8 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/8 hover:bg-transparent">
              {['Code', 'Name', 'Venue', 'Tier', 'Points', ''].map((h, i) => (
                <TableHead key={i} className="text-[#3a3a3a] text-[10px] uppercase tracking-widest" style={{ fontFamily: MONO }}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map(p => {
              const tier = getTier(p.total_points, maxPts);
              return (
                <TableRow key={p.id} className="border-white/5 hover:bg-white/[0.02]">
                  <TableCell className="text-[#555] text-xs" style={{ fontFamily: MONO }}>{p.code ?? '—'}</TableCell>
                  <TableCell className="text-white font-semibold">{p.name}</TableCell>
                  <TableCell className="text-[#666] text-sm">{p.venue ?? '—'}</TableCell>
                  <TableCell>
                    <Badge
                      style={{
                        background: `${tier.color}22`,
                        color: tier.color,
                        border: `1px solid ${tier.color}44`,
                        fontFamily: MONO,
                      }}
                      className="text-[10px] uppercase tracking-widest"
                    >
                      {tier.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-white font-bold" style={{ fontFamily: ARCHIVO }}>
                    {p.total_points.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#555] hover:text-white hover:bg-white/5">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
                        <PlayerDialog
                          initial={p}
                          players={players}
                          onSave={form => handleSave(p, form)}
                          trigger={
                            <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-white focus:bg-white/5 gap-2 cursor-pointer">
                              <Pencil size={14} /> Edit
                            </DropdownMenuItem>
                          }
                        />
                        <DropdownMenuItem
                          onSelect={() => setDeleteTarget(p)}
                          className="text-red-400 focus:bg-red-500/10 focus:text-red-400 gap-2 cursor-pointer"
                        >
                          <Trash2 size={14} /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <DialogContent className="bg-[#141414] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white" style={{ fontFamily: ARCHIVO }}>Delete Player</DialogTitle>
          </DialogHeader>
          <p className="text-[#888] text-sm">
            Remove <span className="text-white font-semibold">{deleteTarget?.name}</span> permanently? This cannot be undone.
          </p>
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="border-white/15 text-white hover:bg-white/5">Cancel</Button>
            <Button variant="destructive" onClick={() => deleteTarget && handleDelete(deleteTarget)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

**Step 2: Check that `getTier` is exported from `@dpt/ui`**

```bash
grep -r "export" /Users/omarash27/Desktop/Work/scoresapp/packages/ui/src/index.ts 2>/dev/null || grep -r "getTier" /Users/omarash27/Desktop/Work/scoresapp/packages/ui/src
```

If `getTier` is not re-exported from the package root, add it to `packages/ui/src/index.ts`.

**Step 3: Type-check and run**

```bash
pnpm --filter @dpt/admin type-check
pnpm --filter @dpt/admin dev
```

Navigate to http://localhost:3001/players. Verify: table renders, Add Player dialog opens, tier badge shows correct color, edit and delete work, saving a points change takes an auto snapshot.

**Step 4: Commit**

```bash
git add apps/admin/src/pages/PlayersPage.tsx
git commit -m "feat(admin): rebuild Players page with shadcn DataTable and CRUD dialogs"
```

---

## Phase 3: Admin Rankings Page

### Task 6: Admin Rankings Page

**Files:**
- Modify: `apps/admin/src/pages/RankingsPage.tsx`

**Step 1: Rewrite admin RankingsPage**

Replace the entire file with:

```typescript
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
    await updatePlayerPoints(player.id, pts);
    await takeRankSnapshot('auto');
    setEdits(e => { const n = { ...e }; delete n[player.id]; return n; });
    await load();
  }

  async function lockSnapshot() {
    setLocking(true);
    try {
      await takeRankSnapshot('manual');
      await load();
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
```

**Step 2: Type-check and verify**

```bash
pnpm --filter @dpt/admin type-check
pnpm --filter @dpt/admin dev
```

Navigate to http://localhost:3001/rankings. Verify: table renders with rank numbers, trend column shows arrows, editing points and saving triggers snapshot and updates trend, Lock Snapshot button works and updates the timestamp.

**Step 3: Commit**

```bash
git add apps/admin/src/pages/RankingsPage.tsx
git commit -m "feat(admin): rebuild Rankings page with trend display and snapshot controls"
```

---

### Task 7: Wire Public Rankings Page to Real Data

**Files:**
- Modify: `apps/web/src/pages/RankingsPage.tsx`

**Step 1: Remove `USE_MOCK` and wire real data**

In `apps/web/src/pages/RankingsPage.tsx`:

1. Remove the `USE_MOCK` constant and `mockRankings` array.
2. Add `getLatestSnapshots` to the `@dpt/db` import.
3. Replace the `useEffect` with:

```typescript
useEffect(() => {
  Promise.all([getPlayers(), getLatestSnapshots()])
    .then(([ps, snaps]) => {
      const snapMap = Object.fromEntries(snaps.map(s => [s.player_id, s]));
      const sorted = [...ps].sort((a, b) => b.total_points - a.total_points);
      setRankings(sorted.map((p, i) => {
        const currentRank = i + 1;
        const snap = snapMap[p.id];
        const trend = snap ? snap.rank - currentRank : 0;
        return {
          id: p.id,
          name: p.name,
          code: p.code ?? '—',
          venue: p.venue ?? '—',
          total_points: p.total_points,
          trend,
        };
      }));
    })
    .catch(console.error);
}, []);
```

4. Remove the `if (USE_MOCK) return;` guard that was inside the effect.
5. Keep the `RankingEntry` interface — it already matches the shape above.

**Step 2: Verify public site**

```bash
pnpm --filter @dpt/web dev
```

Navigate to http://localhost:5173/rankings. Rankings table shows real player data with live trend arrows.

**Step 3: Commit**

```bash
git add apps/web/src/pages/RankingsPage.tsx
git commit -m "feat(web): wire Rankings page to real Supabase data with rank trends"
```

---

## Phase 4: Tournament Creation

### Task 8: Rebuild Create Tournament Page

**Files:**
- Modify: `apps/admin/src/pages/CreateTournamentPage.tsx`

**Step 1: Rewrite with shadcn**

Replace the entire file with:

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { createTournament } from '@dpt/db';
import type { Venue, BracketFormat, TournamentType } from '@dpt/types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const VENUES: Venue[] = ['Mansoura Padel Point', 'Ace Town Complex', 'Padel H'];
const MONO = "'Source Code Pro', monospace";
const ARCHIVO = "'Archivo', sans-serif";
const GOLD = '#E8B53A';

function ToggleGroup<T extends string>({
  options, value, onChange, label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[#a0a0a8] text-xs uppercase tracking-widest" style={{ fontFamily: MONO }}>{label}</Label>
      <div className="flex gap-2">
        {options.map(o => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="flex-1 py-2 rounded-lg text-sm font-bold border transition-all cursor-pointer"
            style={{
              background: value === o.value ? `${GOLD}18` : '#1a1a1a',
              border: value === o.value ? `1px solid ${GOLD}44` : '1px solid rgba(255,255,255,0.1)',
              color: value === o.value ? GOLD : '#666',
              fontFamily: MONO,
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CreateTournamentPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState<Venue>(VENUES[0]);
  const [format, setFormat] = useState<BracketFormat>('QF');
  const [type, setType] = useState<TournamentType>('individual');
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const t = await createTournament({ name, date, venue, bracket_format: format, tournament_type: type, status: 'upcoming' });
      navigate(`/tournaments/${t.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#E8B53A] mb-1" style={{ fontFamily: MONO }}>// New Event</p>
        <h1 className="text-3xl font-black italic uppercase text-white" style={{ fontFamily: ARCHIVO }}>Create Tournament</h1>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-5 bg-[#141414] border border-white/8 rounded-xl p-6">
        <div className="flex flex-col gap-1.5">
          <Label className="text-[#a0a0a8] text-xs uppercase tracking-widest" style={{ fontFamily: MONO }}>Tournament Name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} required placeholder="DPT Season 2 — Open" className="bg-[#1a1a1a] border-white/10 text-white" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-[#a0a0a8] text-xs uppercase tracking-widest" style={{ fontFamily: MONO }}>Date</Label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} required className="bg-[#1a1a1a] border-white/10 text-white [color-scheme:dark]" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-[#a0a0a8] text-xs uppercase tracking-widest" style={{ fontFamily: MONO }}>Venue</Label>
          <Select value={venue} onValueChange={v => setVenue(v as Venue)}>
            <SelectTrigger className="bg-[#1a1a1a] border-white/10 text-white"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-white/10">
              {VENUES.map(v => <SelectItem key={v} value={v} className="text-white focus:bg-white/5">{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ToggleGroup
            label="Format"
            value={format}
            onChange={setFormat}
            options={[{ value: 'QF', label: 'QF (8)' }, { value: 'R16', label: 'R16 (16)' }]}
          />
          <ToggleGroup
            label="Type"
            value={type}
            onChange={setType}
            options={[{ value: 'individual', label: 'Individual' }, { value: 'team', label: 'Team' }]}
          />
        </div>

        <Button type="submit" disabled={saving} className="bg-[#E8B53A] text-black hover:bg-[#d4a32e] font-bold mt-2 w-full">
          {saving ? 'Creating...' : 'Create Tournament'}
        </Button>
      </form>
    </div>
  );
}
```

**Step 2: Type-check and verify**

```bash
pnpm --filter @dpt/admin type-check
pnpm --filter @dpt/admin dev
```

Navigate to http://localhost:3001/tournaments/new. Verify: form renders, format/type toggles switch visually, submission creates tournament and redirects to manager.

**Step 3: Commit**

```bash
git add apps/admin/src/pages/CreateTournamentPage.tsx
git commit -m "feat(admin): rebuild Create Tournament page with shadcn form"
```

---

## Phase 5: Tournament Manager

### Task 9: Tournament Manager — Full Rebuild

**Files:**
- Modify: `apps/admin/src/pages/TournamentManagerPage.tsx`

This is the largest page. Replace the entire file with the implementation below. It's organized as sub-components in the same file.

**Step 1: Write the helpers and sub-components**

```typescript
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import {
  getTournament, getTournamentParticipants, getMatches,
  getPlayers, getTeams, addParticipant, saveMatchResult,
  awardPoints, upsertMatch, updateTournamentStatus, takeRankSnapshot,
} from '@dpt/db';
import { supabase } from '@dpt/db';
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

const MONO = "'Source Code Pro', monospace";
const ARCHIVO = "'Archivo', sans-serif";
const GOLD = '#E8B53A';

// Fisher-Yates shuffle
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

function statusColor(s: Tournament['status']) {
  if (s === 'upcoming') return '#60a5fa';
  if (s === 'ongoing') return GOLD;
  return '#4ade80';
}
```

**Step 2: Write the ParticipantsTab component**

```typescript
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
          onClick={async () => { await onAdd(selectedId); setSelectedId(''); }}
          disabled={!selectedId || participants.length >= maxSlots}
          className="bg-[#E8B53A] text-black hover:bg-[#d4a32e] font-bold"
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
              <TableRow key={p.id} className="border-white/5 hover:bg-white/[0.02]">
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
```

**Step 3: Write the BracketTab component**

```typescript
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
    // Interleave: top[0], bottom[0], top[1], bottom[1] ... keeps top/bottom halves on opposite sides
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
        <Button onClick={() => run(seedAndRandomize)} disabled={working} variant="outline" className="border-[#E8B53A]/30 text-[#E8B53A] hover:bg-[#E8B53A]/10 gap-2">
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
              <Select value={assigned?.id ?? '__empty__'} onValueChange={v => v !== '__empty__' && onAssign(v, slot)}>
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
        <Button onClick={() => run(onGenerateMatches)} disabled={working} className="bg-[#E8B53A] text-black hover:bg-[#d4a32e] font-bold gap-2 self-start">
          <Zap size={14} /> Generate Round 1 Matches
        </Button>
      )}
    </div>
  );
}
```

**Step 4: Write MatchCard and PointsTab**

```typescript
function MatchCard({
  match, p1Label, p2Label, p1Id, p2Id, onSave,
}: {
  match: Match;
  p1Label: string; p2Label: string;
  p1Id?: string; p2Id?: string;
  onSave: (s1: number, s2: number, winnerId: string) => Promise<void>;
}) {
  const [s1, setS1] = useState(match.score1?.toString() ?? '');
  const [s2, setS2] = useState(match.score2?.toString() ?? '');
  const [saving, setSaving] = useState(false);

  return (
    <div className="bg-[#141414] border border-white/8 rounded-xl p-4">
      <p className="text-[10px] text-[#555] mb-3" style={{ fontFamily: MONO }}>
        Round {match.round} · Match {match.position}
        {match.winner_id && <span className="text-green-400 ml-2">✓ Result set</span>}
      </p>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-white font-semibold flex-1 truncate">{p1Label}</span>
        <Input type="number" value={s1} onChange={e => setS1(e.target.value)} className="w-14 h-8 text-center text-sm bg-[#1a1a1a] border-white/10 text-white" />
        <span className="text-[#555] text-xs" style={{ fontFamily: MONO }}>vs</span>
        <Input type="number" value={s2} onChange={e => setS2(e.target.value)} className="w-14 h-8 text-center text-sm bg-[#1a1a1a] border-white/10 text-white" />
        <span className="text-white font-semibold flex-1 truncate text-right">{p2Label}</span>
      </div>
      <div className="flex gap-2">
        {p1Id && (
          <Button size="sm" variant="outline" disabled={saving} onClick={async () => { setSaving(true); await onSave(Number(s1), Number(s2), p1Id); setSaving(false); }} className="text-xs border-white/15 text-white hover:bg-white/5 flex-1">
            {p1Label} wins
          </Button>
        )}
        {p2Id && (
          <Button size="sm" variant="outline" disabled={saving} onClick={async () => { setSaving(true); await onSave(Number(s1), Number(s2), p2Id); setSaving(false); }} className="text-xs border-white/15 text-white hover:bg-white/5 flex-1">
            {p2Label} wins
          </Button>
        )}
      </div>
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
                <TableRow key={p.id} className="border-white/5 hover:bg-white/[0.02]">
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
                    <Button size="sm" onClick={() => onSavePoints(p.id, Number(val))} disabled={edits[p.id] === undefined} className="h-7 text-xs bg-[#E8B53A] text-black hover:bg-[#d4a32e] disabled:opacity-30">
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
          onClick={async () => { setCompleting(true); await onComplete(); setCompleting(false); }}
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
```

**Step 5: Write the main TournamentManagerPage component**

```typescript
export function TournamentManagerPage() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<TournamentParticipantWithDetails[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<TeamWithPlayers[]>([]);

  useEffect(() => {
    if (!id) return;
    getTournament(id).then(setTournament);
    getTournamentParticipants(id).then(setParticipants);
    getMatches(id).then(setMatches);
    getPlayers().then(setPlayers);
    getTeams().then(setTeams);
  }, [id]);

  if (!tournament) return <div className="text-[#555] p-8">Loading...</div>;

  const maxSlots = tournament.bracket_format === 'R16' ? 16 : 8;
  const isTeam = tournament.tournament_type === 'team';
  const pMap = Object.fromEntries(participants.map(p => [p.id, p]));

  async function handleAdd(entityId: string) {
    await addParticipant({
      tournament_id: id!,
      [isTeam ? 'team_id' : 'player_id']: entityId,
      bracket_position: participants.length + 1,
    });
    getTournamentParticipants(id!).then(setParticipants);
  }

  async function handleRemove(participantId: string) {
    await supabase.from('tournament_participants').delete().eq('id', participantId);
    getTournamentParticipants(id!).then(setParticipants);
  }

  async function handleAssign(participantId: string, slot: number) {
    await supabase.from('tournament_participants').update({ bracket_position: slot }).eq('id', participantId);
    getTournamentParticipants(id!).then(setParticipants);
  }

  async function handleGenerateMatches() {
    const sorted = [...participants].sort((a, b) => (a.bracket_position ?? 99) - (b.bracket_position ?? 99));
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
  }

  async function handleSaveMatchResult(matchId: string, s1: number, s2: number, winnerId: string) {
    await saveMatchResult(matchId, s1, s2, winnerId);
    // Auto-advance winner to next round slot
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
  }

  async function handleComplete() {
    await updateTournamentStatus(id!, 'completed');
    await takeRankSnapshot('tournament_close');
    setTournament(t => t ? { ...t, status: 'completed' } : t);
  }

  const sc = statusColor(tournament.status);

  return (
    <div>
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#E8B53A] mb-1" style={{ fontFamily: MONO }}>// Tournament Manager</p>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-black italic uppercase text-white" style={{ fontFamily: ARCHIVO }}>{tournament.name}</h1>
          <Badge style={{ background: `${sc}22`, color: sc, border: `1px solid ${sc}44`, fontFamily: MONO }} className="text-[10px] uppercase tracking-widest mt-1 shrink-0">
            {tournament.status}
          </Badge>
        </div>
        <p className="text-[#555] text-sm mt-1" style={{ fontFamily: MONO }}>
          {tournament.venue} · {tournament.date} · {tournament.bracket_format} · {tournament.tournament_type}
        </p>
      </div>

      <Tabs defaultValue="participants">
        <TabsList className="bg-[#141414] border border-white/8 mb-6">
          {['participants', 'bracket', 'matches', 'points'].map(t => (
            <TabsTrigger key={t} value={t} className="capitalize data-[state=active]:bg-[#E8B53A]/15 data-[state=active]:text-[#E8B53A]">
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
            onSavePoints={(pId, pts) => awardPoints(pId, pts).then(() => getTournamentParticipants(id!).then(setParticipants))}
            onComplete={handleComplete}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Step 6: Type-check and verify**

```bash
pnpm --filter @dpt/admin type-check
pnpm --filter @dpt/admin dev
```

Open a tournament manager page and test each tab:
- Participants: add/remove a player
- Bracket: test all 3 randomization buttons, verify slots update, generate matches
- Matches: enter scores and set a winner, verify winner appears in next round slot
- Points: award points, mark tournament complete, verify console shows no errors

**Step 7: Commit**

```bash
git add apps/admin/src/pages/TournamentManagerPage.tsx
git commit -m "feat(admin): rebuild Tournament Manager with bracket randomization and full match flow"
```

---

## Phase 6: Teams Page

### Task 10: Teams Page

**Files:**
- Modify: `apps/admin/src/pages/TeamsPage.tsx`

**Step 1: Rewrite with shadcn**

Replace the entire file with:

```typescript
import { useEffect, useState } from 'react';
import { getTeams, getPlayers, createTeam, deleteTeam } from '@dpt/db';
import type { Player, TeamWithPlayers } from '@dpt/types';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Trash2, Plus } from 'lucide-react';

const MONO = "'Source Code Pro', monospace";
const ARCHIVO = "'Archivo', sans-serif";

export function TeamsPage() {
  const [teams, setTeams] = useState<TeamWithPlayers[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getTeams().then(setTeams);
    getPlayers().then(setPlayers);
  }, []);

  async function add() {
    if (!p1 || !p2 || p1 === p2) return;
    setSaving(true);
    try {
      const team = await createTeam([p1, p2]);
      const p1data = players.find(p => p.id === p1)!;
      const p2data = players.find(p => p.id === p2)!;
      setTeams(prev => [...prev, { ...team, players: [p1data, p2data] }]);
      setP1(''); setP2('');
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    await deleteTeam(id);
    setTeams(prev => prev.filter(t => t.id !== id));
  }

  const teamed = new Set(teams.flatMap(t => t.players.map(p => p.id)));
  const available = players.filter(p => !teamed.has(p.id));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#E8B53A] mb-1" style={{ fontFamily: MONO }}>// Pairs</p>
          <h1 className="text-3xl font-black italic uppercase text-white" style={{ fontFamily: ARCHIVO }}>Teams</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#E8B53A] text-black hover:bg-[#d4a32e] font-bold gap-2"><Plus size={16} /> Create Team</Button>
          </DialogTrigger>
          <DialogContent className="bg-[#141414] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white" style={{ fontFamily: ARCHIVO }}>Create Team</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-2">
              {([{ val: p1, set: setP1, label: 'Player 1', other: p2 }, { val: p2, set: setP2, label: 'Player 2', other: p1 }] as const).map(({ val, set, label, other }) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <p className="text-[#a0a0a8] text-xs uppercase tracking-widest" style={{ fontFamily: MONO }}>{label}</p>
                  <Select value={val} onValueChange={set}>
                    <SelectTrigger className="bg-[#1a1a1a] border-white/10 text-white"><SelectValue placeholder={`Select ${label}`} /></SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/10">
                      {available.filter(p => p.id !== other).map(p => (
                        <SelectItem key={p.id} value={p.id} className="text-white focus:bg-white/5">{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <Button onClick={add} disabled={!p1 || !p2 || p1 === p2 || saving} className="bg-[#E8B53A] text-black hover:bg-[#d4a32e] font-bold mt-2">
                {saving ? 'Creating...' : 'Create Team'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-white/8 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/8 hover:bg-transparent">
              <TableHead className="text-[#3a3a3a] text-[10px] uppercase tracking-widest" style={{ fontFamily: MONO }}>Players</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map(t => (
              <TableRow key={t.id} className="border-white/5 hover:bg-white/[0.02]">
                <TableCell className="text-white font-semibold">{t.players.map(p => p.name).join(' & ')}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => remove(t.id)} className="h-8 w-8 text-[#555] hover:text-red-400 hover:bg-red-500/10">
                    <Trash2 size={14} />
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
```

**Step 2: Type-check and verify**

```bash
pnpm --filter @dpt/admin type-check
pnpm --filter @dpt/admin dev
```

Navigate to http://localhost:3001/teams. Verify: create team dialog shows available players, player selects exclude already-teamed players, deletion works.

**Step 3: Commit**

```bash
git add apps/admin/src/pages/TeamsPage.tsx
git commit -m "feat(admin): rebuild Teams page with shadcn"
```

---

## Phase 7: Announcements Page

### Task 11: Announcements Page

**Files:**
- Modify: `apps/admin/src/pages/AnnouncementsPage.tsx`

**Step 1: Check the upsertAnnouncement signature**

```bash
cat packages/db/src/queries/announcements.ts
```

Confirm it accepts an object with `id` field for updates and that the `Announcement` type has an `id`. Adjust the `handleSave` call below if the signature differs.

**Step 2: Rewrite AnnouncementsPage**

Replace the entire file with:

```typescript
import { useEffect, useState } from 'react';
import { getAnnouncements, upsertAnnouncement, deleteAnnouncement } from '@dpt/db';
import type { Announcement, AnnouncementType } from '@dpt/types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

const MONO = "'Source Code Pro', monospace";
const ARCHIVO = "'Archivo', sans-serif";

const TYPE_COLORS: Record<AnnouncementType, string> = {
  general: '#60a5fa',
  tournament: '#E8B53A',
  rules: '#a78bfa',
  rewards: '#4ade80',
};

type AForm = { title: string; content: string; type: AnnouncementType };

function AnnouncementDialog({ initial, onSave, trigger }: {
  initial?: Announcement;
  onSave: (form: AForm) => Promise<void>;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<AnnouncementType>('general');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? '');
    setContent(initial?.content ?? '');
    setType(initial?.type ?? 'general');
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ title: title.trim(), content: content.trim(), type });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-[#141414] border-white/10 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white" style={{ fontFamily: ARCHIVO }}>{initial ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#a0a0a8] text-xs uppercase tracking-widest" style={{ fontFamily: MONO }}>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} required className="bg-[#1a1a1a] border-white/10 text-white" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#a0a0a8] text-xs uppercase tracking-widest" style={{ fontFamily: MONO }}>Content</Label>
            <Textarea value={content} onChange={e => setContent(e.target.value)} required rows={4} className="bg-[#1a1a1a] border-white/10 text-white resize-none" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#a0a0a8] text-xs uppercase tracking-widest" style={{ fontFamily: MONO }}>Type</Label>
            <Select value={type} onValueChange={v => setType(v as AnnouncementType)}>
              <SelectTrigger className="bg-[#1a1a1a] border-white/10 text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/10">
                {(['general', 'tournament', 'rules', 'rewards'] as AnnouncementType[]).map(t => (
                  <SelectItem key={t} value={t} className="text-white focus:bg-white/5 capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={saving} className="bg-[#E8B53A] text-black hover:bg-[#d4a32e] font-bold mt-2">
            {saving ? 'Saving...' : initial ? 'Save Changes' : 'Post Announcement'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  useEffect(() => { getAnnouncements().then(setAnnouncements); }, []);

  async function handleSave(existing: Announcement | undefined, form: AForm) {
    const a = await upsertAnnouncement({
      ...(existing ?? { id: crypto.randomUUID() }),
      ...form,
      published_at: existing?.published_at ?? new Date().toISOString(),
    });
    setAnnouncements(prev => existing ? prev.map(x => x.id === a.id ? a : x) : [a, ...prev]);
  }

  async function handleDelete(a: Announcement) {
    await deleteAnnouncement(a.id);
    setAnnouncements(prev => prev.filter(x => x.id !== a.id));
    setDeleteTarget(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#E8B53A] mb-1" style={{ fontFamily: MONO }}>// Comms</p>
          <h1 className="text-3xl font-black italic uppercase text-white" style={{ fontFamily: ARCHIVO }}>Announcements</h1>
        </div>
        <AnnouncementDialog
          onSave={form => handleSave(undefined, form)}
          trigger={
            <Button className="bg-[#E8B53A] text-black hover:bg-[#d4a32e] font-bold gap-2">
              <Plus size={16} /> New Announcement
            </Button>
          }
        />
      </div>

      <div className="rounded-xl border border-white/8 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/8 hover:bg-transparent">
              <TableHead className="text-[#3a3a3a] text-[10px] uppercase tracking-widest" style={{ fontFamily: MONO }}>Title</TableHead>
              <TableHead className="text-[#3a3a3a] text-[10px] uppercase tracking-widest" style={{ fontFamily: MONO }}>Type</TableHead>
              <TableHead className="text-[#3a3a3a] text-[10px] uppercase tracking-widest" style={{ fontFamily: MONO }}>Published</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {announcements.map(a => {
              const c = TYPE_COLORS[a.type];
              return (
                <TableRow key={a.id} className="border-white/5 hover:bg-white/[0.02]">
                  <TableCell className="text-white font-semibold">{a.title}</TableCell>
                  <TableCell>
                    <Badge style={{ background: `${c}22`, color: c, border: `1px solid ${c}44`, fontFamily: MONO }} className="text-[10px] uppercase tracking-widest capitalize">
                      {a.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[#555] text-sm" style={{ fontFamily: MONO }}>
                    {new Date(a.published_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#555] hover:text-white hover:bg-white/5">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
                        <AnnouncementDialog
                          initial={a}
                          onSave={form => handleSave(a, form)}
                          trigger={
                            <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-white focus:bg-white/5 gap-2 cursor-pointer">
                              <Pencil size={14} /> Edit
                            </DropdownMenuItem>
                          }
                        />
                        <DropdownMenuItem onSelect={() => setDeleteTarget(a)} className="text-red-400 focus:bg-red-500/10 focus:text-red-400 gap-2 cursor-pointer">
                          <Trash2 size={14} /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <DialogContent className="bg-[#141414] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white" style={{ fontFamily: ARCHIVO }}>Delete Announcement</DialogTitle>
          </DialogHeader>
          <p className="text-[#888] text-sm">Remove <span className="text-white font-semibold">"{deleteTarget?.title}"</span> permanently?</p>
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="border-white/15 text-white hover:bg-white/5">Cancel</Button>
            <Button variant="destructive" onClick={() => deleteTarget && handleDelete(deleteTarget)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

**Step 2: Type-check and verify**

```bash
pnpm --filter @dpt/admin type-check
pnpm --filter @dpt/admin dev
```

Navigate to http://localhost:3001/announcements. Verify CRUD dialogs, type badges with correct colors, delete confirm.

**Step 3: Commit**

```bash
git add apps/admin/src/pages/AnnouncementsPage.tsx
git commit -m "feat(admin): rebuild Announcements page with shadcn DataTable and CRUD dialogs"
```

---

## Phase 8: Tournaments List Page

### Task 12: Tournaments List Page

**Files:**
- Modify: `apps/admin/src/pages/TournamentsPage.tsx`

**Step 1: Rewrite with shadcn**

Replace the entire file with:

```typescript
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getTournaments } from '@dpt/db';
import type { Tournament } from '@dpt/types';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, ChevronRight } from 'lucide-react';

const MONO = "'Source Code Pro', monospace";
const ARCHIVO = "'Archivo', sans-serif";
const GOLD = '#E8B53A';

function statusColor(s: Tournament['status']) {
  if (s === 'upcoming') return '#60a5fa';
  if (s === 'ongoing') return GOLD;
  return '#4ade80';
}

export function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => { getTournaments().then(setTournaments); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#E8B53A] mb-1" style={{ fontFamily: MONO }}>// Events</p>
          <h1 className="text-3xl font-black italic uppercase text-white" style={{ fontFamily: ARCHIVO }}>Tournaments</h1>
        </div>
        <Button asChild className="bg-[#E8B53A] text-black hover:bg-[#d4a32e] font-bold gap-2">
          <Link to="/tournaments/new"><Plus size={16} /> Create Tournament</Link>
        </Button>
      </div>

      <div className="rounded-xl border border-white/8 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/8 hover:bg-transparent">
              {['Name', 'Date', 'Venue', 'Format', 'Status', ''].map((h, i) => (
                <TableHead key={i} className="text-[#3a3a3a] text-[10px] uppercase tracking-widest" style={{ fontFamily: MONO }}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tournaments.map(t => {
              const sc = statusColor(t.status);
              return (
                <TableRow key={t.id} className="border-white/5 hover:bg-white/[0.02]">
                  <TableCell className="text-white font-semibold">{t.name}</TableCell>
                  <TableCell className="text-[#666] text-sm" style={{ fontFamily: MONO }}>{t.date}</TableCell>
                  <TableCell className="text-[#666] text-sm">{t.venue}</TableCell>
                  <TableCell>
                    <Badge style={{ background: 'rgba(255,255,255,0.04)', color: '#888', border: '1px solid rgba(255,255,255,0.1)', fontFamily: MONO }} className="text-[10px] uppercase tracking-widest">
                      {t.bracket_format}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge style={{ background: `${sc}22`, color: sc, border: `1px solid ${sc}44`, fontFamily: MONO }} className="text-[10px] uppercase tracking-widest capitalize">
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-[#555] hover:text-white hover:bg-white/5">
                      <Link to={`/tournaments/${t.id}`}><ChevronRight size={16} /></Link>
                    </Button>
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
```

**Step 2: Type-check and verify**

```bash
pnpm --filter @dpt/admin type-check
pnpm --filter @dpt/admin dev
```

Navigate to http://localhost:3001/tournaments. Verify: list loads, status badges, clicking the chevron navigates to tournament manager.

**Step 3: Commit**

```bash
git add apps/admin/src/pages/TournamentsPage.tsx
git commit -m "feat(admin): rebuild Tournaments list page with shadcn"
```

---

## Final Verification

**Step 1: Full monorepo type-check**

```bash
pnpm -r type-check
```

Expected: zero errors.

**Step 2: Build check**

```bash
pnpm --filter @dpt/admin build
pnpm --filter @dpt/web build
```

Expected: both build with no errors.

**Step 3: End-to-end manual walkthrough**

Run both apps:
```bash
pnpm --filter @dpt/admin dev &
pnpm --filter @dpt/web dev
```

Walk through this sequence:
1. Log in at http://localhost:3001
2. Add a player with name/code/venue — verify tier badge shows
3. Edit that player's points — verify the Rankings page shows an auto snapshot timestamp
4. Go to Rankings → click Lock Snapshot → verify timestamp updates, trend arrows appear
5. Create a tournament (QF, individual)
6. Add 8 participants from the player list
7. Bracket tab: test Randomize, then Seed & Randomize, then Auto-assign — verify slots change each time
8. Generate Round 1 matches — verify 4 match cards appear in Matches tab
9. Enter scores for a match, click "[Player] wins" — verify winner appears in next round slot
10. Points tab: award points to participants, click Mark Complete
11. Open http://localhost:5173/rankings — verify real data, trend arrows reflect snapshot differences

**Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete admin panel UI + Supabase integration"
```
