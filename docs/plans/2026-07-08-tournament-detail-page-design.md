# Tournament Detail Page — Design

## Context

`apps/web/src/pages/TournamentsPage.tsx` (list) and `apps/web/src/pages/SchedulePage.tsx`
already fetch real data from `@dpt/db`. The gap is
`apps/web/src/pages/TournamentPage.tsx` — the `/tournaments/:id` detail page reached by
clicking a tournament card — which is still an unstyled stub: it fetches data but only
renders plain `<h1>`/`<h2>` placeholders, with no bracket, schedule, or participant list.

## Goals

Build out the tournament detail page to show, for a single tournament:
- A styled header (status, format, name, date, venue, participant count/type)
- Its live bracket
- Its match schedule
- Its participant roster

Reuse existing components (`BracketView`, `groupMatchesByDay`) rather than re-implementing them.

## Shared extractions

Two small pieces are currently only defined inside `TournamentsPage.tsx` /
`SchedulePage.tsx` but are needed by the new detail page too. Extract them so all
pages share one source of truth instead of duplicating:

1. **`apps/web/src/lib/tournamentLabels.ts`**
   Moves `STATUS_CONFIG`, `FORMAT_LABEL`, `TYPE_LABEL` (currently defined inline in
   `TournamentsPage.tsx`) into a shared module. `TournamentsPage` and `TournamentPage`
   both import from here.

2. **`apps/web/src/components/schedule/MatchScheduleList.tsx`**
   Moves the day-grouped match list rendering (currently inline in `SchedulePage.tsx`,
   built on `groupMatchesByDay` + `getRoundLabel`/`getParticipantName`) into a
   component: `<MatchScheduleList matches participantMap tournament />`. Handles its
   own "No matches scheduled yet" empty state. `SchedulePage` and `TournamentPage`
   both use it.

## TournamentPage layout

Follows the same banner + container pattern as `TournamentsPage`/`BracketsPage`/`SchedulePage`
(gradient header band, `Season 2 · 2026` eyebrow, `ARCHIVO` title).

1. **Header**
   - Back link to `/tournaments`
   - Status badge + format tag (from `tournamentLabels.ts`)
   - Tournament name (title)
   - Meta row: date · venue · participant count & type

2. **Bracket section**
   `<BracketView matches participants tournament />` — already renders "Bracket not yet
   set up" when there are no matches.

3. **Schedule section**
   `<MatchScheduleList>` scoped to this tournament's matches.

4. **Participants section**
   Simple roster list: seed (`bracket_position`) + participant name
   (`getParticipantName`), in the order already returned by
   `getTournamentParticipants` (sorted by `bracket_position`).

## Data flow

Keep the four calls already present in the file: `getTournament`,
`getTournamentParticipants`, `getMatches`, `subscribeToMatches` (for live match
updates). Only the rendering changes.

## Error handling

Current code: `getTournament(id).then(setTournament)` has no `.catch`. An invalid ID
throws an unhandled rejection and the page is stuck showing "Loading...". Fix: add a
`.catch` that sets a distinct `notFound` state, rendered as "Tournament not found"
separately from the loading state.

## Testing

No unit tests planned — this is page composition/layout, matching the existing
convention where only pure-logic modules (`bracketMath.ts`, `scheduleMath.ts`) have
tests. Verify manually in the browser:
- Navigate from a tournament card on `/tournaments` to its detail page
- A tournament with no matches yet (bracket/schedule empty states)
- An invalid tournament ID (not-found state)
- Mobile-width layout
