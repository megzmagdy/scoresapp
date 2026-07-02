# Inline Team Pairing for Tournament Participants

## Problem

In the admin app's tournament manager, adding participants to a **team** tournament (`apps/admin/src/pages/TournamentManagerPage.tsx`, `ParticipantsTab`) requires the team to already exist. Today that means leaving the tournament page, going to `TeamsPage.tsx`, creating the pair there, then coming back and selecting it from a dropdown — an unnecessary context switch for the common case of pairing up two players for a specific tournament.

## Goals

- Let an admin pair two players and add them as a tournament participant in a single step, without leaving the Participants tab.
- Reuse an existing team if the exact same pair was already created (e.g. via the standalone Teams page), instead of creating duplicate team rows.
- Allow a player to be paired with different partners across different tournaments (the current global "a player can only ever be on one team" restriction on the Teams page is a UI-only filter, not a schema constraint, and does not need to carry over to this flow).

## Non-goals

- No changes to the standalone `TeamsPage.tsx` or its existing (more restrictive) player-selection behavior — it stays as a general team management view.
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

## Testing

- Team tournament: pair two fresh players → new team created, added as participant, shows up correctly labeled in Participants/Bracket/Matches/Points tabs.
- Team tournament: pair two players who already form an existing team (created via Teams page) → no duplicate team row created; existing team reused.
- Team tournament: a player already on a team elsewhere (different tournament) is still selectable and can be paired with someone new.
- Team tournament: a player already added to *this* tournament (via a team) does not appear in either dropdown again.
- Individual tournament: Participants tab behavior is unchanged.
