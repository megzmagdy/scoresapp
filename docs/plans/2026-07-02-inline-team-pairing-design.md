# Inline Team Pairing for Tournament Participants

## Problem

In the admin app's tournament manager, adding participants to a **team** tournament (`apps/admin/src/pages/TournamentManagerPage.tsx`, `ParticipantsTab`) requires the team to already exist. Today that means leaving the tournament page, going to `TeamsPage.tsx`, creating the pair there, then coming back and selecting it from a dropdown — an unnecessary context switch for the common case of pairing up two players for a specific tournament.

## Goals

- Let an admin pair two players and add them as a tournament participant in a single step, without leaving the Participants tab.
- Reuse an existing team if the exact same pair was already created (e.g. via the standalone Teams page), instead of creating duplicate team rows.
- Allow a player to be paired with different partners across different tournaments (the current global "a player can only ever be on one team" restriction on the Teams page is a UI-only filter, not a schema constraint, and does not need to carry over to this flow).

- Enforce that a player cannot belong to two different teams *within the same tournament* — a player already used in a tournament, whether solo or as part of a team, cannot be picked again for that tournament (applies to both the quick-pair flow and the existing individual-player flow).
- Allow a player to appear in more than one team *combination* over time on the standalone Teams page (e.g. paired with B in one tournament, paired with C in another) — remove the current global "already on a team, ever" exclusion there.
- Make player-picking dropdowns searchable, since player lists get long enough that scrolling to find a name is painful.

## Non-goals

- No schema changes. `team_members` already supports a player belonging to multiple teams over time.

## Design

### 1. UX flow (Participants tab, team tournaments only)

Replace the single "select team" dropdown with two player dropdowns (Player 1 / Player 2) + one **Add** button, matching the pairing pattern already used in `TeamsPage.tsx`'s create-team dialog.

Filtering rules for each dropdown:
- Excludes whichever player is currently selected in the other dropdown.
- Excludes any player already used in *this tournament's* participant list — whether as a solo entry (n/a for team tournaments, but kept for symmetry) or as a member of a team already added as a participant here.

Individual tournaments are unaffected — they keep the existing single-player-select dropdown.

Clicking Add:
1. Look up whether a team of exactly `{player1, player2}` already exists.
2. Reuse it if found, otherwise create a new team.
3. Add that team as a tournament participant at the next open bracket position.
4. Refresh the participants list.

### 2. Data layer

Add to `packages/db/src/queries/teams.ts`:

```ts
export async function getOrCreateTeam(playerIds: [string, string]): Promise<Team>
```

Implementation: query `team_members` for rows where `player_id` is one of the two given players, group matching rows by `team_id`, and find a team whose matched member set is exactly `{a, b}` (size 2, contains both). If found, fetch and return that team. Otherwise, delegate to the existing `createTeam(playerIds)`.

This is a read-then-maybe-write; no `requireAuth()` needed for the lookup itself (matches the existing `getTeams` convention of unauthenticated reads), but `createTeam` already calls `requireAuth()` internally for the write path.

### 3. Component changes

In `TournamentManagerPage.tsx`:

- `ParticipantsTab`: for the `isTeam` branch, replace the single team-select + options list with two `useState` selections (`player1Id`, `player2Id`) and two `Select` components. Compute the excluded-player set from `participants` directly (covers solo players and existing team members), rather than the current `added` set built from `player_id`/`team_id`.
- New handler in the parent, `handleAddTeamPair(p1: string, p2: string)`: calls `getOrCreateTeam([p1, p2])`, then `addParticipant({ tournament_id, team_id: team.id, bracket_position: participants.length + 1 })`, then refreshes participants via `getTournamentParticipants`.
- The `teams` state and `getTeams()` fetch in `TournamentManagerPage` are no longer needed anywhere on this page and are removed.

### 4. Teams page: allow multiple team combinations per player

In `TeamsPage.tsx`, drop the `teamed` set (built from every existing team, across all time) that currently filters `available`. Player 1 and Player 2 dropdowns should list all players, each only excluding whichever player is currently selected in the *other* dropdown of the same form (the existing `available.filter(p => p.id !== p2)` / `p.id !== p1)` mutual-exclusion logic already does this — it's the `!teamed.has(p.id)` pre-filter that needs to go). The zod refine (`player1 !== player2`) already guards against picking the same player twice.

### 5. Searchable dropdowns (app-wide)

Rather than adding a search box per call site, bake it into the shared `SelectContent` in `apps/admin/src/components/ui/select.tsx` — every page that imports `Select` from `~/components/ui/select` (`PlayersPage`, `TeamsPage`, `AnnouncementsPage`, `CreateTournamentPage`, `TournamentManagerPage`) gets search for free, no per-page changes needed.

Implementation: `SelectContent` gets local `query` state and a plain `<input>` pinned above the `Viewport`. On each render, `React.Children.toArray(children)` is filtered to items whose rendered text (a `SelectItem`'s string child) includes the query, case-insensitive; non-matching items are dropped, everything else (separators, labels) passes through untouched. The input calls `stopPropagation()` on `onKeyDown` so Radix's built-in type-ahead-to-select-item behavior doesn't fight with normal typing. Query resets to `''` via the `onCloseAutoFocus` callback on `SelectPrimitive.Content` (fires when the popover closes). No autofocus on open — Radix's own focus management for the initially-selected item takes priority, and layering a fight over initial focus isn't worth it; the admin clicks the search box, then types.

## Testing

- Team tournament: pair two fresh players → new team created, added as participant, shows up correctly labeled in Participants/Bracket/Matches/Points tabs.
- Team tournament: pair two players who already form an existing team (created via Teams page) → no duplicate team row created; existing team reused.
- Team tournament: a player already on a team elsewhere (different tournament) is still selectable and can be paired with someone new.
- Team tournament: a player already added to *this* tournament (via a team) does not appear in either dropdown again.
- Individual tournament: a player already added to the tournament does not appear in the player dropdown again (same enforcement, one participant type).
- Teams page: a player already on team (A, B) can still be selected to form a new team (A, C).
- Any Select dropdown with a decent-sized option list (e.g. players): typing in the search box narrows the visible items; clearing the search restores the full list; closing and reopening the dropdown resets the search.
- Individual tournament: Participants tab behavior is unchanged.
