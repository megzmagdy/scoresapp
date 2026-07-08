# Hide Homepage Upcoming Section + Rankings Search/Pagination — Design

## Context

Two small, unrelated UI changes requested together:

1. Hide the "Upcoming Tournaments" section on the homepage.
2. Add search and pagination to the rankings page.

## 1. Hide homepage "Upcoming Tournaments" section

Temporary hide (not deletion), matching the pattern already used elsewhere in this
codebase for the hero live-tournament badge (commit `96983f8`, which wraps the JSX in
`{/* ... */}` rather than deleting it).

In `apps/web/src/pages/HomePage.tsx`:
- Comment out `<UpcomingSection tournaments={tournaments} />`.
- Since `tournaments` state and its `getTournaments()` fetch exist only to feed that
  section, comment those out too (the `useEffect`, the `useState`, and the
  `getTournaments`/`Tournament`/`useEffect`/`useState` imports that become unused as a
  result), so there's no dead-but-still-running fetch or unused-variable lint noise.
- `UpcomingSection.tsx` itself and `UpcomingSection` import are left untouched/commented
  consistently, so re-enabling later is a matter of uncommenting.

## 2. Rankings search + pagination

`apps/web/src/pages/RankingsPage.tsx` currently loads all players via `useAsyncData`,
sorts by points, and renders either `RankTable` or `CardsGrid` with the full list, plus
a top-3 `PodiumCard` row (List view only).

### State

Add two new pieces of local state to `RankingsPage`:
- `query: string` — the search input's current value.
- `page: number` — current 1-indexed page number.

### Derived data

- `filtered`: `rankings` filtered by case-insensitive substring match on `name` against
  `query` (no filtering if `query` is empty). Client-side, since the full rankings list
  is already loaded in memory (small dataset, one player roster).
- `PAGE_SIZE = 20` (constant).
- `totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))`.
- `pageItems`: the `PAGE_SIZE`-sized slice of `filtered` for the current `page`.
- `top3`: **unchanged** — still derived from the full, unfiltered `rankings` (not
  `filtered`), so the podium always reflects the true overall #1–#3 regardless of
  search text or current page.

### Behavior

- Typing in the search input updates `query` and resets `page` to `1`.
- `RankTable`/`CardsGrid` are passed `pageItems` instead of the full `rankings` — no
  changes needed inside those two components, since they just render whatever array
  they're given (their internal `rank = i + 1` numbering will need to become
  `((page - 1) * PAGE_SIZE) + i + 1` so displayed ranks reflect true overall position,
  not position-within-page — this is the one behavioral wrinkle to handle explicitly).
- Podium (`hasTop3` block) keeps rendering under the same condition as today
  (`view === 'list' && hasTop3`), unaffected by `query`/`page`.
- If `filtered.length === 0` (search matches nothing), show a "No players match ‘…’"
  empty state instead of the table/grid and pager.

### UI

- Search `<input>` placed in the header row of `RankingsPage`, next to the existing
  List/Cards toggle (same flex row, so it sits inline on wide screens and wraps
  sensibly on mobile alongside the existing toggle).
- Pager: simple Prev / page-number buttons / Next row below the table/grid, styled
  consistent with existing button conventions in this file (`MONO` font, gold accent
  for the active state, disabled state for Prev on page 1 / Next on last page). No new
  shared component needed — this is single-page-only UI, not reused elsewhere yet.

### Testing

No unit tests planned — matches the existing convention (only pure-logic files like
`bracketMath.ts`/`scheduleMath.ts` are unit-tested; page components aren't). Verify
manually in the browser: search matches/narrows the list, search resets to page 1,
pagination navigates correctly, podium stays fixed on true top 3 while searching/on
page 2+, rank numbers in the table/grid reflect true overall position not
position-within-page, mobile layout doesn't break.
