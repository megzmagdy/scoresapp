# Inline Team Pairing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let admins pair two players and add them as a tournament participant in one step from the Participants tab, without pre-creating a team on the separate Teams page — plus loosen the Teams page's player restriction and add search to player dropdowns.

**Architecture:** A new `getOrCreateTeam` query in `@dpt/db` (backed by a pure, unit-tested matching helper) dedupes team creation. `TournamentManagerPage.tsx`'s `ParticipantsTab` gets a two-player quick-pair UI for team tournaments, filtering out players already used in that tournament. `TeamsPage.tsx` drops its global "already teamed" filter. Dropdown search is added once, to the shared `SelectContent` primitive, so every existing `Select` usage in the admin app benefits without per-page changes.

**Tech Stack:** React, TypeScript, Supabase, react-hook-form + zod, Radix UI Select, Vitest.

**Design doc:** `docs/plans/2026-07-02-inline-team-pairing-design.md`

---

### Task 1: Pure team-matching helper + tests

**Files:**
- Create: `packages/db/src/teamMatch.ts`
- Test: `packages/db/src/teamMatch.test.ts`

**Step 1: Write the failing test**

```ts
// packages/db/src/teamMatch.test.ts
import { describe, it, expect } from 'vitest';
import { findMatchingTeamId } from './teamMatch';

describe('findMatchingTeamId', () => {
  it('returns undefined when there are no rows', () => {
    expect(findMatchingTeamId([], 'p1', 'p2')).toBeUndefined();
  });

  it('returns undefined when no team contains both players', () => {
    const rows = [
      { team_id: 't1', player_id: 'p1' },
      { team_id: 't2', player_id: 'p2' },
    ];
    expect(findMatchingTeamId(rows, 'p1', 'p2')).toBeUndefined();
  });

  it('returns the team id when a team has exactly this pair', () => {
    const rows = [
      { team_id: 't1', player_id: 'p1' },
      { team_id: 't1', player_id: 'p2' },
    ];
    expect(findMatchingTeamId(rows, 'p1', 'p2')).toBe('t1');
  });

  it('ignores a team that only has one of the two players', () => {
    const rows = [
      { team_id: 't1', player_id: 'p1' },
      { team_id: 't2', player_id: 'p1' },
      { team_id: 't2', player_id: 'p3' },
    ];
    expect(findMatchingTeamId(rows, 'p1', 'p2')).toBeUndefined();
  });

  it('ignores a team where a third player is also present', () => {
    const rows = [
      { team_id: 't1', player_id: 'p1' },
      { team_id: 't1', player_id: 'p2' },
      { team_id: 't1', player_id: 'p3' },
    ];
    expect(findMatchingTeamId(rows, 'p1', 'p2')).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/db && npx vitest run src/teamMatch.test.ts`
Expected: FAIL — `Cannot find module './teamMatch'` (file doesn't exist yet).

**Step 3: Write minimal implementation**

```ts
// packages/db/src/teamMatch.ts
export interface TeamMemberRow {
  team_id: string;
  player_id: string;
}

export function findMatchingTeamId(
  rows: TeamMemberRow[],
  playerA: string,
  playerB: string
): string | undefined {
  const byTeam = new Map<string, Set<string>>();
  for (const row of rows) {
    const members = byTeam.get(row.team_id) ?? new Set<string>();
    members.add(row.player_id);
    byTeam.set(row.team_id, members);
  }
  for (const [teamId, members] of byTeam) {
    if (members.size === 2 && members.has(playerA) && members.has(playerB)) {
      return teamId;
    }
  }
  return undefined;
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/db && npx vitest run src/teamMatch.test.ts`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add packages/db/src/teamMatch.ts packages/db/src/teamMatch.test.ts
git commit -m "feat(db): add pure helper to find a team matching an exact player pair"
```

---

### Task 2: `getOrCreateTeam` query

**Files:**
- Modify: `packages/db/src/queries/teams.ts`

**Step 1: Add the function**

Insert after the existing `createTeam` function in `packages/db/src/queries/teams.ts`:

```ts
import { findMatchingTeamId } from '../teamMatch';

// ...(existing code)...

export async function getOrCreateTeam(playerIds: [string, string]): Promise<Team> {
  const [a, b] = playerIds;
  const { data: rows, error } = await supabase
    .from('team_members')
    .select('team_id, player_id')
    .in('player_id', [a, b]);
  if (error) throw error;

  const existingTeamId = findMatchingTeamId((rows ?? []) as { team_id: string; player_id: string }[], a, b);
  if (existingTeamId) {
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', existingTeamId)
      .single();
    if (teamError) throw teamError;
    return team;
  }

  return createTeam(playerIds);
}
```

Add the `import { findMatchingTeamId } from '../teamMatch';` line at the top of the file with the other imports.

**Step 2: Type-check**

Run: `cd packages/db && npx tsc --noEmit -p .` (or from repo root: `pnpm --filter @dpt/db type-check` if that script exists — otherwise run `npx tsc --noEmit` inside `packages/db`)
Expected: no errors.

**Step 3: Commit**

```bash
git add packages/db/src/queries/teams.ts
git commit -m "feat(db): add getOrCreateTeam to dedupe team creation by player pair"
```

*(No new unit test here — this function is a thin Supabase read/write wrapper around the already-tested `findMatchingTeamId`, matching this codebase's existing convention of only unit-testing pure logic modules like `bracketMath.ts`/`pointsMath.ts`, not the `queries/*.ts` Supabase wrappers.)*

---

### Task 3: Searchable `SelectContent`

**Files:**
- Modify: `apps/admin/src/components/ui/select.tsx`

**Step 1: Implement search inside `SelectContent`**

Replace the `SelectContent` component (currently lines 70–100) with:

```tsx
const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => {
  const [query, setQuery] = React.useState("")

  const items = React.Children.toArray(children)
  const filtered = query.trim()
    ? items.filter((child) => {
        if (!React.isValidElement(child)) return true
        const label = child.props.children
        return typeof label === "string"
          ? label.toLowerCase().includes(query.trim().toLowerCase())
          : true
      })
    : items

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        onCloseAutoFocus={(e) => {
          setQuery("")
          props.onCloseAutoFocus?.(e)
        }}
        {...props}
      >
        <SelectScrollUpButton />
        <div className="px-2 py-1.5 sticky top-0 z-10 bg-popover" onKeyDown={(e) => e.stopPropagation()}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="w-full h-7 rounded border border-input bg-transparent px-2 text-xs outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
          />
        </div>
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          )}
        >
          {filtered.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">No matches</p>
          ) : (
            filtered
          )}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
})
SelectContent.displayName = SelectPrimitive.Content.displayName
```

This is a drop-in replacement — no other file that imports `Select`/`SelectContent`/`SelectItem` needs to change for search to start working, since they all pass their items as `children` already.

**Step 2: Type-check**

Run: `cd apps/admin && npx tsc --noEmit -p .` (or `pnpm --filter admin type-check` if defined)
Expected: no errors. Note `child.props.children` is untyped (`unknown`) coming off `React.isValidElement` — the `typeof label === "string"` guard handles that safely, but confirm the compiler doesn't complain about accessing `.props.children` on a generic `ReactElement`. If it does, narrow with `child.props as { children?: unknown }`.

**Step 3: Manual verification**

Covered in Task 6 (full browser walkthrough) — this component touches every `Select` in the admin app, so it's verified alongside the rest rather than in isolation.

**Step 4: Commit**

```bash
git add apps/admin/src/components/ui/select.tsx
git commit -m "feat(admin): add search box to Select dropdowns app-wide"
```

---

### Task 4: Teams page — allow multiple team combinations per player

**Files:**
- Modify: `apps/admin/src/pages/TeamsPage.tsx`

**Step 1: Remove the global exclusion**

In `TeamsPage.tsx`, delete these two lines (around line 40-41):

```ts
const teamed = new Set(teams.flatMap(t => t.players.map(p => p.id)));
const available = players.filter(p => !teamed.has(p.id));
```

Replace every remaining reference to `available` with `players` (there are two: the Player 1 dropdown's `available.filter(p => p.id !== p2)` and the Player 2 dropdown's `available.filter(p => p.id !== p1)` — become `players.filter(p => p.id !== p2)` and `players.filter(p => p.id !== p1)`).

**Step 2: Type-check**

Run: `cd apps/admin && npx tsc --noEmit -p .`
Expected: no errors, no unused-variable warnings (confirm `teams` prop/state is still used elsewhere on the page — it is, for the table listing below).

**Step 3: Commit**

```bash
git add apps/admin/src/pages/TeamsPage.tsx
git commit -m "feat(admin): allow a player to be part of multiple team combinations"
```

---

### Task 5: Inline quick-pair in Participants tab

**Files:**
- Modify: `apps/admin/src/pages/TournamentManagerPage.tsx`

**Step 1: Update imports**

Remove `getTeams` from the `@dpt/db` import list and add `getOrCreateTeam`. Remove `TeamWithPlayers` from the `@dpt/types` import list (no longer used in this file).

Before:
```tsx
import {
  getTournament, getTournamentParticipants, getMatches,
  getPlayers, getTeams, addParticipant, saveMatchResult,
  savePlayerPoints, upsertMatch, generateBracket, updateTournamentStatus, takeRankSnapshot,
  removeParticipant, assignParticipantSlot,
  getCurrentRound, getSuggestedPoints, getTotalRounds,
} from '@dpt/db';
import type {
  Tournament, TournamentParticipantWithDetails,
  Match, Player, TeamWithPlayers,
} from '@dpt/types';
```

After:
```tsx
import {
  getTournament, getTournamentParticipants, getMatches,
  getPlayers, addParticipant, saveMatchResult,
  savePlayerPoints, upsertMatch, generateBracket, updateTournamentStatus, takeRankSnapshot,
  removeParticipant, assignParticipantSlot, getOrCreateTeam,
  getCurrentRound, getSuggestedPoints, getTotalRounds,
} from '@dpt/db';
import type {
  Tournament, TournamentParticipantWithDetails,
  Match, Player,
} from '@dpt/types';
```

**Step 2: Rewrite `ParticipantsTab`**

Replace the entire `ParticipantsTab` function (currently lines 102–170) with:

```tsx
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
```

**Step 3: Update `TournamentManagerPage` state and handlers**

Remove the `teams` state (around line 354):
```tsx
const [teams, setTeams] = useState<TeamWithPlayers[]>([]);
```

In `loadAll`, remove `getTeams()` from the `Promise.all` call and the `setTeams(ts)` line:

Before:
```tsx
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
```

After:
```tsx
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
```

Add a new handler next to `handleAdd` (around line 388-399):

```tsx
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
```

**Step 4: Update the `ParticipantsTab` call site**

Before:
```tsx
<ParticipantsTab
  tournament={tournament} participants={participants}
  players={players} teams={teams} maxSlots={maxSlots}
  onAdd={handleAdd} onRemove={handleRemove}
/>
```

After:
```tsx
<ParticipantsTab
  tournament={tournament} participants={participants}
  players={players} maxSlots={maxSlots}
  onAdd={handleAdd} onAddTeamPair={handleAddTeamPair} onRemove={handleRemove}
/>
```

**Step 5: Type-check**

Run: `cd apps/admin && npx tsc --noEmit -p .`
Expected: no errors (confirms `teams`/`getTeams`/`TeamWithPlayers` are fully unused now and cleanly removed).

**Step 6: Commit**

```bash
git add apps/admin/src/pages/TournamentManagerPage.tsx
git commit -m "feat(admin): add inline player quick-pair to tournament Participants tab"
```

---

### Task 6: Manual verification in the browser

**No files changed** — this is a verification pass over Tasks 1-5 together.

**Step 1: Start the admin app**

Run: `cd apps/admin && npm run dev` (or `pnpm --filter admin dev` from repo root), then open the printed local URL (default port 3001).

**Step 2: Walk through the scenarios from the design doc's Testing section**

1. Open a **team** tournament's Participants tab (or create one via "Create Tournament" with Type = Team). Confirm you see two "Player..." dropdowns + Add, not a single team dropdown.
2. Pick two fresh players, hit Add. Confirm a new row appears in the table labeled `PlayerA & PlayerB`, and check the Teams page — a new team with that pair now exists.
3. Pick two players that already form a team (create one on the Teams page first, e.g. pair X & Y) via quick-pair. Confirm no duplicate shows up on the Teams page after adding — same team id gets reused (only one `X & Y` row on Teams page).
4. Confirm a player already added to this tournament (solo or via a team) no longer appears in either Player 1/Player 2 dropdown.
5. Go to the Teams page, create a team with player A and B. Then start creating another team and confirm player A is still selectable (can now pair with C) — this used to be blocked.
6. On any dropdown with several players (Teams page selects, Participants tab selects, Players page venue filter, etc.), type a few letters into the new search box at the top and confirm the list narrows to matching names; clear it and confirm the full list returns; close and reopen the dropdown and confirm the search box is empty again.
7. Confirm an **individual** tournament's Participants tab still works exactly as before (single player dropdown, Add button, no regressions).

**Step 3: Report result**

If all scenarios pass, proceed to finishing-a-development-branch. If any fail, fix and re-verify before moving on — do not mark this task done on a failing scenario.

---

### Task 7: Final check and handoff

**Step 1: Run the full test suite and type-check**

```bash
cd packages/db && npx vitest run
cd ../../apps/admin && npx tsc --noEmit -p .
```

Expected: all `packages/db` tests pass (including the 5 new `teamMatch` tests), no admin type errors.

**Step 2: Review the diff**

```bash
git log --oneline main..HEAD
git diff main...HEAD --stat
```

Confirm it matches: `packages/db/src/teamMatch.ts`, `packages/db/src/teamMatch.test.ts`, `packages/db/src/queries/teams.ts`, `apps/admin/src/components/ui/select.tsx`, `apps/admin/src/pages/TeamsPage.tsx`, `apps/admin/src/pages/TournamentManagerPage.tsx`, plus the two design docs already committed.

**Step 3: Hand off**

Use the superpowers:finishing-a-development-branch skill to decide how to integrate (merge, PR, or further cleanup).
