# Bracket Generation & Points Wiring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix bracket generation so it produces the full tournament tree upfront (not just round 1), derive "current round" from match state, and wire tournament points awards into `players.total_points` with automatic ranking snapshots.

**Architecture:** Pure, framework-agnostic helpers (bracket math, points math) live in `packages/db` alongside the existing Supabase query functions, unit-tested with vitest (mirroring the existing `packages/ui/src/lib/tiers.test.ts` pattern — zero config, run via `npx vitest run`). Supabase-touching functions follow the existing sequential-client-call pattern used throughout `packages/db/src/queries/*` (no DB transactions exist in this codebase today). UI changes are isolated to `apps/admin/src/pages/TournamentManagerPage.tsx` and `apps/web/src/pages/BracketsPage.tsx`.

**Tech Stack:** TypeScript, React 19, Supabase (Postgres), vitest, pnpm workspaces (turborepo monorepo: `packages/db`, `packages/types`, `apps/admin`, `apps/web`).

**Design doc:** `docs/plans/2026-06-30-bracket-points-design.md`

---

## Task 1: Add vitest to `packages/db`

**Files:**
- Modify: `packages/db/package.json`

**Step 1: Add the devDependency**

Add `"vitest": "^3.0.0"` to `devDependencies` in `packages/db/package.json`, matching the version already used in `packages/ui/package.json`.

**Step 2: Install**

Run: `pnpm install`
Expected: lockfile updates, no errors.

**Step 3: Commit**

```bash
git add packages/db/package.json pnpm-lock.yaml
git commit -m "chore(db): add vitest for unit testing pure helpers"
```

---

## Task 2: Pure bracket math — total rounds & current round

**Files:**
- Create: `packages/db/src/bracketMath.ts`
- Test: `packages/db/src/bracketMath.test.ts`

**Step 1: Write the failing tests**

```typescript
// packages/db/src/bracketMath.test.ts
import { describe, it, expect } from 'vitest';
import { getTotalRounds, getCurrentRound } from './bracketMath';
import type { Match } from '@dpt/types';

function match(round: number, position: number, winner_id: string | null): Match {
  return {
    id: `${round}-${position}`,
    tournament_id: 't1',
    round,
    position,
    participant1_id: null,
    participant2_id: null,
    score1: null,
    score2: null,
    winner_id,
  };
}

describe('getTotalRounds', () => {
  it('returns 3 for QF (8 slots)', () => {
    expect(getTotalRounds('QF')).toBe(3);
  });
  it('returns 4 for R16 (16 slots)', () => {
    expect(getTotalRounds('R16')).toBe(4);
  });
  it('returns 5 for R32 (32 slots)', () => {
    expect(getTotalRounds('R32')).toBe(5);
  });
});

describe('getCurrentRound', () => {
  it('returns null when there are no matches', () => {
    expect(getCurrentRound([])).toBeNull();
  });
  it('returns round 1 when no match has a winner yet', () => {
    const matches = [match(1, 1, null), match(1, 2, null), match(2, 1, null)];
    expect(getCurrentRound(matches)).toBe(1);
  });
  it('returns round 2 once all round 1 matches have a winner', () => {
    const matches = [match(1, 1, 'a'), match(1, 2, 'b'), match(2, 1, null)];
    expect(getCurrentRound(matches)).toBe(2);
  });
  it("returns 'complete' once the final match has a winner", () => {
    const matches = [match(1, 1, 'a'), match(1, 2, 'b'), match(2, 1, 'a')];
    expect(getCurrentRound(matches)).toBe('complete');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/db && npx vitest run src/bracketMath.test.ts`
Expected: FAIL — `bracketMath.ts` does not exist / exports not found.

**Step 3: Write the implementation**

```typescript
// packages/db/src/bracketMath.ts
import type { BracketFormat, Match } from '@dpt/types';

const SLOTS: Record<BracketFormat, number> = { QF: 8, R16: 16, R32: 32 };

export function getTotalRounds(format: BracketFormat): number {
  return Math.log2(SLOTS[format]);
}

export function getCurrentRound(matches: Match[]): number | 'complete' | null {
  if (matches.length === 0) return null;
  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
  for (const r of rounds) {
    const roundMatches = matches.filter((m) => m.round === r);
    if (roundMatches.some((m) => m.winner_id === null)) return r;
  }
  return 'complete';
}
```

**Step 4: Run tests to verify they pass**

Run: `cd packages/db && npx vitest run src/bracketMath.test.ts`
Expected: PASS, 7 tests.

**Step 5: Commit**

```bash
git add packages/db/src/bracketMath.ts packages/db/src/bracketMath.test.ts
git commit -m "feat(db): add pure bracket round-counting helpers"
```

---

## Task 3: Pure bracket math — full-tree match shells

**Files:**
- Modify: `packages/db/src/bracketMath.ts`
- Modify: `packages/db/src/bracketMath.test.ts`

**Step 1: Write the failing test**

Append to `packages/db/src/bracketMath.test.ts`:

```typescript
import { buildBracketShells } from './bracketMath';

describe('buildBracketShells', () => {
  it('builds round 1 from seeded participant ids and empty shells for later rounds (QF = 8 slots)', () => {
    const participantIds = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];
    const shells = buildBracketShells('t1', 'QF', participantIds);

    // 4 + 2 + 1 = 7 matches total
    expect(shells).toHaveLength(7);

    const round1 = shells.filter((s) => s.round === 1);
    expect(round1).toHaveLength(4);
    expect(round1[0]).toMatchObject({
      tournament_id: 't1', round: 1, position: 1,
      participant1_id: 'p1', participant2_id: 'p2',
    });
    expect(round1[3]).toMatchObject({
      tournament_id: 't1', round: 1, position: 4,
      participant1_id: 'p7', participant2_id: 'p8',
    });

    const round2 = shells.filter((s) => s.round === 2);
    expect(round2).toHaveLength(2);
    expect(round2[0]).toMatchObject({
      round: 2, position: 1, participant1_id: null, participant2_id: null,
    });

    const round3 = shells.filter((s) => s.round === 3);
    expect(round3).toHaveLength(1);
    expect(round3[0]).toMatchObject({
      round: 3, position: 1, participant1_id: null, participant2_id: null,
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/db && npx vitest run src/bracketMath.test.ts`
Expected: FAIL — `buildBracketShells` not exported.

**Step 3: Write the implementation**

Add to `packages/db/src/bracketMath.ts`:

```typescript
export interface MatchShell {
  tournament_id: string;
  round: number;
  position: number;
  participant1_id: string | null;
  participant2_id: string | null;
}

export function buildBracketShells(
  tournamentId: string,
  format: BracketFormat,
  seededParticipantIds: (string | null)[]
): MatchShell[] {
  const totalRounds = getTotalRounds(format);
  const shells: MatchShell[] = [];

  const round1Count = SLOTS[format] / 2;
  for (let i = 0; i < round1Count; i++) {
    shells.push({
      tournament_id: tournamentId,
      round: 1,
      position: i + 1,
      participant1_id: seededParticipantIds[i * 2] ?? null,
      participant2_id: seededParticipantIds[i * 2 + 1] ?? null,
    });
  }

  for (let round = 2; round <= totalRounds; round++) {
    const matchCount = round1Count / Math.pow(2, round - 1);
    for (let position = 1; position <= matchCount; position++) {
      shells.push({
        tournament_id: tournamentId,
        round,
        position,
        participant1_id: null,
        participant2_id: null,
      });
    }
  }

  return shells;
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/db && npx vitest run src/bracketMath.test.ts`
Expected: PASS, 8 tests.

**Step 5: Commit**

```bash
git add packages/db/src/bracketMath.ts packages/db/src/bracketMath.test.ts
git commit -m "feat(db): generate full bracket tree shells, not just round 1"
```

---

## Task 4: Wire `generateBracket` into the matches query layer

**Files:**
- Modify: `packages/db/src/queries/matches.ts`
- Modify: `packages/db/src/index.ts` (already does `export * from './queries/matches'` — no change needed, verify)

**Step 1: Add the function**

In `packages/db/src/queries/matches.ts`, add:

```typescript
import type { BracketFormat } from '@dpt/types';
import { buildBracketShells } from '../bracketMath';

export async function generateBracket(
  tournamentId: string,
  format: BracketFormat,
  seededParticipantIds: (string | null)[]
): Promise<void> {
  await requireAuth();
  const shells = buildBracketShells(tournamentId, format, seededParticipantIds);
  for (const shell of shells) {
    const { error } = await supabase
      .from('matches')
      .upsert(shell, { onConflict: 'tournament_id,round,position' });
    if (error) throw error;
  }
}
```

This is not unit tested — it's a thin Supabase I/O wrapper around the already-tested `buildBracketShells`, consistent with how `upsertMatch`/`saveMatchResult` in the same file have no tests today.

**Step 2: Type-check**

Run: `pnpm --filter @dpt/db type-check` (or `cd packages/db && npx tsc --noEmit` if no per-package script exists — check `packages/db/package.json` first; if there's no `type-check` script, run `npx tsc --noEmit -p .` from `packages/db`)
Expected: no errors.

**Step 3: Commit**

```bash
git add packages/db/src/queries/matches.ts
git commit -m "feat(db): add generateBracket to create the full match tree"
```

---

## Task 5: Replace round-1-only generation in the admin panel

**Files:**
- Modify: `apps/admin/src/pages/TournamentManagerPage.tsx:389-405` (`handleGenerateMatches`)
- Modify: `apps/admin/src/pages/TournamentManagerPage.tsx:245-247` (button label, inside `BracketTab`)
- Modify: `apps/admin/src/pages/TournamentManagerPage.tsx:6-11` (imports)

**Step 1: Update imports**

Change:
```typescript
import {
  getTournament, getTournamentParticipants, getMatches,
  getPlayers, getTeams, addParticipant, saveMatchResult,
  awardPoints, upsertMatch, updateTournamentStatus, takeRankSnapshot,
  supabase, requireAuth,
} from '@dpt/db';
```
to:
```typescript
import {
  getTournament, getTournamentParticipants, getMatches,
  getPlayers, getTeams, addParticipant, saveMatchResult,
  awardPoints, generateBracket, updateTournamentStatus, takeRankSnapshot,
  supabase, requireAuth,
} from '@dpt/db';
import { getCurrentRound } from '@dpt/db';
```
(`upsertMatch` is no longer called directly from this file once Task 9 also removes its use in `handleSaveMatchResult`'s propagation step — but that call still needs `upsertMatch` for writing the winner into the next match, so keep `upsertMatch` in the import list. Only remove it if a later task shows it's unused.)

**Step 2: Replace `handleGenerateMatches`**

Replace (lines 389-405):
```typescript
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
```
with:
```typescript
  async function handleGenerateMatches() {
    const sorted = [...participants].sort((a, b) => (a.bracket_position ?? 99) - (b.bracket_position ?? 99));
    const seededIds = sorted.map((p) => p.id);
    try {
      await generateBracket(id!, tournament!.bracket_format, seededIds);
      getMatches(id!).then(setMatches);
    } catch (err) {
      console.error('Failed to generate bracket:', err);
    }
  }
```

**Step 3: Rename the button**

In `BracketTab` (around line 245-247), change:
```tsx
        <Button onClick={() => run(onGenerateMatches)} disabled={working} className="bg-dpt-gold text-black hover:bg-[#d4a32e] font-bold gap-2 self-start">
          <Zap size={14} /> Generate Round 1 Matches
        </Button>
```
to:
```tsx
        <Button onClick={() => run(onGenerateMatches)} disabled={working} className="bg-dpt-gold text-black hover:bg-[#d4a32e] font-bold gap-2 self-start">
          <Zap size={14} /> Generate Bracket
        </Button>
```

**Step 4: Type-check**

Run: `pnpm --filter @dpt/admin type-check` (check `apps/admin/package.json` for the actual script name first)
Expected: no errors.

**Step 5: Commit**

```bash
git add apps/admin/src/pages/TournamentManagerPage.tsx
git commit -m "fix(admin): generate the full bracket tree instead of round 1 only"
```

---

## Task 6: Surface "current round" in the admin Matches tab

**Files:**
- Modify: `apps/admin/src/pages/TournamentManagerPage.tsx` (`TabsContent value="matches"`, around line 482-500)

**Step 1: Compute and display the badge**

Inside `TournamentManagerPage`, near where `pMap` is defined (line 354), add:
```typescript
  const currentRound = getCurrentRound(matches);
```

In the matches `TabsContent` block, add a header line above the grid:
```tsx
        <TabsContent value="matches">
          {matches.length > 0 && (
            <p className="text-[10px] text-[#555] mb-3 uppercase tracking-widest" style={{ fontFamily: MONO }}>
              {currentRound === 'complete' ? 'Bracket complete' : `Current round: ${currentRound}`}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
```
(Closing `</div>` and `</TabsContent>` unchanged.)

**Step 2: Manually verify**

Run the admin app (`pnpm --filter @dpt/admin dev` or the project's existing dev command) and open a tournament with a generated bracket. Confirm the label updates as match results are saved.

**Step 3: Commit**

```bash
git add apps/admin/src/pages/TournamentManagerPage.tsx
git commit -m "feat(admin): show current round in the matches tab"
```

---

## Task 7: Surface "current round" on the public bracket page

**Files:**
- Modify: `apps/web/src/pages/BracketsPage.tsx`

**Step 1: Compute the label**

Add imports:
```typescript
import { getCurrentRound } from '@dpt/db';
import { getRoundLabel } from '~/components/brackets/bracketMath';
```

After `const selectedTournament = ...` (line 54), add:
```typescript
  const currentRound = getCurrentRound(matches);
  const roundsByNumber = new Map<number, number>(); // round number -> match count in that round
  for (const m of matches) {
    roundsByNumber.set(m.round, (roundsByNumber.get(m.round) ?? 0) + 1);
  }
  const currentRoundLabel =
    currentRound === null ? null
    : currentRound === 'complete' ? 'Tournament Complete'
    : `${getRoundLabel(roundsByNumber.get(currentRound) ?? 0)} — Live`;
```

**Step 2: Render it**

In the header block, just under the `<h1>` (around line 71, before the `TournamentTabs`), add:
```tsx
          {currentRoundLabel && (
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#888] mb-4" style={{ fontFamily: MONO }}>
              {currentRoundLabel}
            </p>
          )}
```

**Step 3: Manually verify**

Run `pnpm --filter @dpt/web dev`, open the Brackets page. Note `USE_MOCK = true` at the top of the file means it renders against `mockBracketData` — confirm the badge computes correctly against that fixture (this is a pre-existing condition, not something to fix here).

**Step 4: Commit**

```bash
git add apps/web/src/pages/BracketsPage.tsx
git commit -m "feat(web): show current round on the public bracket page"
```

---

## Task 8: Migration — `participant_player_points` table

**Files:**
- Create: `supabase/migrations/20260630_participant_player_points.sql`

**Step 1: Write the migration**

```sql
create table if not exists participant_player_points (
  id             uuid primary key default gen_random_uuid(),
  participant_id uuid not null references tournament_participants(id) on delete cascade,
  player_id      uuid not null references players(id) on delete cascade,
  points         int not null default 0 check (points >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (participant_id, player_id)
);

create index if not exists participant_player_points_participant
  on participant_player_points (participant_id);
```

(`updated_at` has no auto-refresh trigger — no other table in this codebase has one — so Task 11's `savePlayerPoints` must explicitly set `updated_at` on every upsert, or it will silently stay frozen at row-creation time.)

**Step 2: Apply it**

Run whatever this project's existing migration-apply command is (check for a `supabase` CLI script in root `package.json` or README; if none, apply via `supabase db push` or the Supabase dashboard SQL editor, matching how `20260626_admin_panel.sql` was applied).

**Step 3: Commit**

```bash
git add supabase/migrations/20260630_participant_player_points.sql
git commit -m "feat(db): add participant_player_points table for per-player point breakdowns"
```

---

## Task 9: Add `Player` points types

**Files:**
- Modify: `packages/types/src/index.ts`

**Step 1: Add the interface**

After `TournamentParticipant` (around line 60), add:
```typescript
export interface ParticipantPlayerPoints {
  id: string;
  participant_id: string;
  player_id: string;
  points: number;
}
```

**Step 2: Type-check**

Run: `pnpm --filter @dpt/types type-check` (or root `pnpm type-check`)
Expected: no errors.

**Step 3: Commit**

```bash
git add packages/types/src/index.ts
git commit -m "feat(types): add ParticipantPlayerPoints type"
```

---

## Task 10: Pure points math — suggested points by placement

**Files:**
- Create: `packages/db/src/pointsMath.ts`
- Test: `packages/db/src/pointsMath.test.ts`

**Step 1: Write the failing tests**

```typescript
// packages/db/src/pointsMath.test.ts
import { describe, it, expect } from 'vitest';
import { getSuggestedPoints } from './pointsMath';
import type { Match } from '@dpt/types';

function match(round: number, position: number, p1: string | null, p2: string | null, winner: string | null): Match {
  return { id: `${round}-${position}`, tournament_id: 't1', round, position, participant1_id: p1, participant2_id: p2, score1: null, score2: null, winner_id: winner };
}

describe('getSuggestedPoints', () => {
  // QF format -> totalRounds = 3
  const matches: Match[] = [
    match(1, 1, 'champ', 'r1-loser', 'champ'),
    match(1, 2, 'semi-loser', 'qf-loser', 'semi-loser'),
    match(2, 1, 'champ', 'semi-loser', 'champ'),
    match(3, 1, 'champ', null, null),
  ];

  it('suggests the champion tier for the eventual final winner', () => {
    expect(getSuggestedPoints('champ', matches, 3)).toBe(100);
  });

  it('suggests the runner-up tier for the finalist who lost', () => {
    expect(getSuggestedPoints('semi-loser', matches, 3)).toBeLessThan(100);
  });

  it('suggests 0 for a participant not found in any match', () => {
    expect(getSuggestedPoints('nobody', matches, 3)).toBe(0);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/db && npx vitest run src/pointsMath.test.ts`
Expected: FAIL — module not found.

**Step 3: Write the implementation**

```typescript
// packages/db/src/pointsMath.ts
import type { Match } from '@dpt/types';

// Index 0 = champion, 1 = runner-up, 2 = lost in round (totalRounds - 2), etc.
const SUGGESTED_POINTS_BY_ROUNDS_FROM_FINAL = [100, 60, 30, 15, 5];

export function getSuggestedPoints(
  participantId: string,
  matches: Match[],
  totalRounds: number
): number {
  const finalMatch = matches.find((m) => m.round === totalRounds);
  if (finalMatch?.winner_id === participantId) {
    return SUGGESTED_POINTS_BY_ROUNDS_FROM_FINAL[0];
  }

  const lostMatch = matches.find(
    (m) =>
      (m.participant1_id === participantId || m.participant2_id === participantId) &&
      m.winner_id !== null &&
      m.winner_id !== participantId
  );
  if (!lostMatch) return 0;

  const roundsFromFinal = totalRounds - lostMatch.round + 1;
  return SUGGESTED_POINTS_BY_ROUNDS_FROM_FINAL[roundsFromFinal] ?? 0;
}
```

**Step 4: Run tests to verify they pass**

Run: `cd packages/db && npx vitest run src/pointsMath.test.ts`
Expected: PASS, 3 tests.

**Step 5: Commit**

```bash
git add packages/db/src/pointsMath.ts packages/db/src/pointsMath.test.ts
git commit -m "feat(db): add suggested-points-by-placement helper"
```

---

## Task 11: Points query functions — read/write per-player breakdown with delta-applied totals and auto snapshot

**Files:**
- Modify: `packages/db/src/queries/tournaments.ts`

**Step 1: Replace `awardPoints` with `getParticipantPlayerPoints` and `savePlayerPoints`**

Remove the existing `awardPoints` function (lines 82-89) and add:

```typescript
import type { ParticipantPlayerPoints } from '@dpt/types';
import { takeRankSnapshot } from './rankSnapshots';

export async function getParticipantPlayerPoints(
  participantId: string
): Promise<ParticipantPlayerPoints[]> {
  const { data, error } = await supabase
    .from('participant_player_points')
    .select('*')
    .eq('participant_id', participantId);
  if (error) throw error;
  return data;
}

export async function savePlayerPoints(
  participantId: string,
  entries: { player_id: string; points: number }[]
): Promise<void> {
  await requireAuth();

  const existing = await getParticipantPlayerPoints(participantId);
  const existingByPlayer = Object.fromEntries(existing.map((e) => [e.player_id, e.points]));

  for (const entry of entries) {
    const oldPoints = existingByPlayer[entry.player_id] ?? 0;
    const delta = entry.points - oldPoints;

    const { error: upsertError } = await supabase
      .from('participant_player_points')
      .upsert(
        {
          participant_id: participantId,
          player_id: entry.player_id,
          points: entry.points,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'participant_id,player_id' }
      );
    if (upsertError) throw upsertError;

    if (delta !== 0) {
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('total_points')
        .eq('id', entry.player_id)
        .single();
      if (playerError) throw playerError;

      const { error: updateError } = await supabase
        .from('players')
        .update({ total_points: player.total_points + delta })
        .eq('id', entry.player_id);
      if (updateError) throw updateError;
    }
  }

  const total = entries.reduce((sum, e) => sum + e.points, 0);
  const { error: totalError } = await supabase
    .from('tournament_participants')
    .update({ points_awarded: total })
    .eq('id', participantId);
  if (totalError) throw totalError;

  await takeRankSnapshot('auto');
}
```

**Step 2: Type-check**

Run: `pnpm --filter @dpt/db type-check` (or `npx tsc --noEmit -p .` from `packages/db`)
Expected: no errors. Watch for a circular import between `queries/tournaments.ts` and `queries/rankSnapshots.ts` — both are leaf modules with no dependency on each other, so this should be fine, but verify.

**Step 3: Commit**

```bash
git add packages/db/src/queries/tournaments.ts
git commit -m "feat(db): wire participant point awards into player totals and auto-snapshot"
```

---

## Task 12: Update the admin Points tab for per-player entry

**Files:**
- Modify: `apps/admin/src/pages/TournamentManagerPage.tsx` (`PointsTab`, lines 253-318, and its usage at 502-508)

**Step 1: Rewrite `PointsTab` to show one row per player**

Replace the `PointsTab` function (lines 253-318) with:

```tsx
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
              const suggested = getSuggestedPoints(p.id, matches, totalRounds);
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
                        onClick={() => {
                          const entries = players.map((pl) => {
                            const k = `${p.id}:${pl.id}`;
                            return { player_id: pl.id, points: Number(edits[k] ?? suggested) };
                          });
                          onSavePoints(p.id, entries);
                        }}
                        className="h-7 text-xs bg-dpt-gold text-black hover:bg-[#d4a32e]"
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
```

Note: saving one player's row submits `entries` for *every* player on that participant (using each row's current edited or suggested value) so a team's two `participant_player_points` rows always stay consistent with each other — clicking "Save" on either row saves both.

**Step 2: Update imports and the call site**

Add to imports: `import { getSuggestedPoints } from '@dpt/db';` and `import { getTotalRounds } from '@dpt/db';`.

In `TournamentManagerPage`, compute once near `currentRound`:
```typescript
  const totalRounds = getTotalRounds(tournament.bracket_format);
```

Update the call site (lines 502-508):
```tsx
        <TabsContent value="points">
          <PointsTab
            participants={participants} matches={matches} totalRounds={totalRounds} tournament={tournament}
            onSavePoints={async (pId, entries) => { await savePlayerPoints(pId, entries); getTournamentParticipants(id!).then(setParticipants); }}
            onComplete={handleComplete}
          />
        </TabsContent>
```

Replace `awardPoints` in the top imports with `savePlayerPoints`, `getSuggestedPoints`, `getTotalRounds`.

**Step 3: Manually verify**

Run the admin app, open a tournament's Points tab. Confirm:
- Individual tournaments show one row per participant (unchanged from before).
- Team tournaments show two rows per team, prefilled with a suggested value.
- Editing one row and saving updates both that player's and (if unedited) the partner's `total_points`.
- The Rankings page reflects the change and shows an updated "Last snapshot" time.

**Step 4: Commit**

```bash
git add apps/admin/src/pages/TournamentManagerPage.tsx
git commit -m "feat(admin): per-player points entry with placement-based suggestions"
```

---

## Task 13: Auto-complete the tournament when the final match is scored

**Files:**
- Modify: `apps/admin/src/pages/TournamentManagerPage.tsx` (`handleSaveMatchResult`, lines 407-427)

**Step 1: Update `handleSaveMatchResult`**

Replace:
```typescript
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
```
with:
```typescript
  async function handleSaveMatchResult(matchId: string, s1: number, s2: number, winnerId: string) {
    try {
      await saveMatchResult(matchId, s1, s2, winnerId);
      const match = matches.find(m => m.id === matchId);
      if (match) {
        const isFinal = match.round === totalRounds;
        if (isFinal) {
          await handleComplete();
        } else {
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
      }
      getMatches(id!).then(setMatches);
    } catch (err) {
      console.error('Failed to save match result:', err);
    }
  }
```

`totalRounds` is already computed in Task 12 — reuse it here (it's in the same component scope).

**Step 2: Manually verify**

Play through a full small bracket (e.g. a `QF` tournament) in the admin app: generate the bracket, score every match through the final. Confirm:
- Round 2/3 matches get populated with winners automatically.
- After the final is scored, `tournament.status` flips to `completed` without clicking the manual button, and a `tournament_close` snapshot appears on the Rankings page.
- The manual "Mark Tournament Complete" button still works as a fallback (it's unreachable in the normal flow now since status flips automatically, but leave it for edge cases like correcting a tournament that was never auto-completed).

**Step 3: Commit**

```bash
git add apps/admin/src/pages/TournamentManagerPage.tsx
git commit -m "feat(admin): auto-complete tournament when the final match is scored"
```

---

## Task 14: Full manual verification pass

**Files:** none (verification only)

**Step 1: Run all unit tests**

Run: `cd packages/db && npx vitest run`
Expected: all tests in `bracketMath.test.ts` and `pointsMath.test.ts` pass.

**Step 2: Type-check the whole workspace**

Run: `pnpm type-check` (root turbo script)
Expected: no errors across `packages/types`, `packages/db`, `apps/admin`, `apps/web`.

**Step 3: End-to-end manual walkthrough**

Use the `/verify` skill (or run both apps locally) to walk through, against a real Supabase project (not mocks):
1. Create a `QF` team tournament, add 8 team participants.
2. Generate the bracket — confirm all 7 matches (4+2+1) exist immediately, later rounds showing "TBD".
3. Score round 1 — confirm round 2 fills in automatically and the "current round" badge advances on both admin and public pages.
4. Score through the final — confirm tournament auto-completes and a `tournament_close` snapshot is recorded.
5. On the Points tab, confirm suggested points are prefilled per player based on placement, edit one, save, and confirm `players.total_points` and the Rankings page's "Last snapshot" both update.

**Step 4: Report results**

Summarize pass/fail for each step before considering this plan complete.
