# Bracket Generation & Points Wiring — Design

## Context

The admin panel's bracket and points flows have gaps that surfaced when comparing the actual schema (Supabase/Postgres, defined in `packages/types/src/index.ts` and `supabase/migrations/20260626_admin_panel.sql`) against intended behavior:

1. `handleGenerateMatches` (`apps/admin/src/pages/TournamentManagerPage.tsx:389`) only ever creates **round 1** matches. `handleSaveMatchResult` (same file, line 407) tries to propagate a winner into `round+1` at `position = ceil(position/2)`, but that match is never created — so brackets silently stall after round 1.
2. There is no explicit "current round" field; it's meant to be derived from match data, but the derivation has nothing reliable to read once (1) breaks.
3. `awardPoints` (`packages/db/src/queries/tournaments.ts:82`) writes `tournament_participants.points_awarded` only. It never updates `players.total_points` and never snapshots. Meanwhile `RankingsPage.savePoints` (`apps/admin/src/pages/RankingsPage.tsx:51`) edits `players.total_points` directly and calls `takeRankSnapshot('auto')`. These are two disconnected paths to the same number.

The existing `Player` / `Team` / `team_members` / `TournamentParticipant` model is correct as-is: `Team` is a reusable 2-player pairing, and all tournament-specific state (seeding, points) lives on `TournamentParticipant`. A player joining a different partner gets a new `Team` row naturally. No change needed there.

## Goals

- Generate the full bracket tree (all rounds) at draw time, so winner-propagation always has a slot to write into.
- Derive "current round" purely from match completion state — no new field on `Tournament`.
- Wire tournament points awards into `players.total_points` and auto-snapshot, matching the existing Rankings page behavior, while supporting full/split/custom point distribution for team participants.
- Surface current round and suggested points in the UI; auto-complete the tournament when the final is scored.

## Non-goals

- Bye handling for non-power-of-2 signups (admin manually manages partial brackets for now).
- Double elimination / losers bracket.
- Server-side atomicity (Postgres functions/triggers) — this codebase has none today; all writes are sequential client calls, matching existing patterns (e.g. `RankingsPage.savePoints`). Single-admin usage makes this an acceptable tradeoff.

## Design

### 1. Full bracket-tree generation

Replace the round-1-only loop in `handleGenerateMatches` with logic that creates every round upfront:

- Map `bracket_format` → slot count: `QF` → 8, `R16` → 16, `R32` → 32.
- `totalRounds = log2(slotCount)`.
- Round 1: `slotCount / 2` matches, `participant1_id`/`participant2_id` populated from `bracket_position`-sorted participants (existing logic, unchanged).
- Rounds 2..totalRounds: `matchCount` halves each round (4 → 2 → 1 for `QF`), created with `participant1_id: null, participant2_id: null, score1: null, score2: null, winner_id: null`. `position` numbering follows the same scheme `handleSaveMatchResult` already assumes (`nextPos = ceil(position/2)` of the prior round).
- This is a one-time generation, same trigger point ("Generate Round 1 Matches" button — rename to "Generate Bracket").

`handleSaveMatchResult` requires **no logic change** — it already looks up `(round+1, ceil(position/2))`; that match now reliably exists.

### 2. Current round derivation

No schema change. Add a small pure function (e.g. in `bracketMath.ts`, reused by both admin and web):

```ts
function getCurrentRound(matches: Match[]): number | 'complete' {
  const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => a - b);
  for (const r of rounds) {
    const roundMatches = matches.filter(m => m.round === r);
    if (roundMatches.some(m => m.winner_id === null)) return r;
  }
  return 'complete'; // every match in every round has a winner
}
```

Used by:
- A "current round" badge on the public bracket view (`apps/web/src/components/brackets/BracketView.tsx`), using the existing `getRoundLabel` for display text.
- The admin Matches tab, to highlight which round needs attention.

### 3. Points wiring

**Schema addition** — new table `participant_player_points`:

```sql
create table if not exists participant_player_points (
  id              uuid primary key default gen_random_uuid(),
  participant_id  uuid not null references tournament_participants(id) on delete cascade,
  player_id       uuid not null references players(id) on delete cascade,
  points          int not null default 0,
  unique (participant_id, player_id)
);
```

- Individual participants: exactly one row, mirrors `tournament_participants.points_awarded`.
- Team participants: one row per player on the team. Admin can set both equal (full-to-each), halve them (split), or enter custom values per player.
- `tournament_participants.points_awarded` remains as the displayed "team total" — kept in sync as `sum(participant_player_points.points)` for that participant whenever rows are saved (computed client-side on save, written alongside).

**Award flow** (replaces `awardPoints`, used by the Points tab):

1. For the participant being edited, read prior `participant_player_points` rows (0 if none yet).
2. For each player row being saved, compute `delta = newPoints - oldPoints`.
3. Write the new `participant_player_points` row(s) and the recomputed `points_awarded` total.
4. Apply `delta` to that player's `players.total_points` (read-modify-write, matching `updatePlayerPoints` semantics already used elsewhere).
5. Call `takeRankSnapshot('auto')` once after all player updates for that save — same call already used in `RankingsPage.savePoints`.

This makes the Points tab and the Rankings page converge on the same invariant: any change to `players.total_points` is always followed by an `auto` snapshot.

**Suggested points by placement**: when opening the Points tab for a participant, prefill the input(s) with a suggested value derived from how far they advanced (e.g. lost in final → runner-up tier, lost in semis → semifinalist tier, etc.), using a small placement → suggested-points table the admin can edit per tournament or accept the default. Purely a UI prefill — does not change the manual-entry, editable nature of the flow.

### 4. Auto-complete on final match

In `handleSaveMatchResult`, after propagating a winner: if the match just scored is the final (`round === totalRounds`), call the same logic currently behind the manual "Complete" button — `updateTournamentStatus(id, 'completed')` then `takeRankSnapshot('tournament_close')`. The manual "Complete" button can stay as a fallback/override but is no longer required for the common path.

## Open risk

Client-side sequential writes (no DB transaction) mean a failed step mid-flow (e.g. network drop between updating `participant_player_points` and `players.total_points`) can leave numbers briefly inconsistent. Acceptable for a single-admin tool; flagged here in case usage grows to multiple concurrent admins, at which point a Postgres function would be worth revisiting.
