# Homepage Hide + Rankings Search/Pagination Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Hide the "Upcoming Tournaments" section on the homepage (temporarily, easily
reversible), and add search + pagination to the rankings page while keeping the top-3
podium always showing the true overall top 3.

**Architecture:** Two independent, unrelated changes in the same plan. Task 1 comments
out JSX/state/imports in `HomePage.tsx` (no new code). Task 2 adds local
search/pagination state to `RankingsPage.tsx`, threads a `rankOffset` prop through the
existing `RankTable`/`CardsGrid` components so displayed rank numbers stay correct
across pages, and adds a small in-file `Pager` component.

**Tech Stack:** React, Tailwind, `lucide-react` icons.

**Design doc:** `docs/plans/2026-07-08-homepage-hide-and-rankings-search-design.md`

---

### Task 1: Hide homepage "Upcoming Tournaments" section

**Files:**
- Modify: `apps/web/src/pages/HomePage.tsx`

**Step 1: Comment out the section, its data fetch, and now-unused imports**

This repo's `tsconfig.base.json` has `noUnusedLocals: true`, so `useEffect`, `useState`,
`getTournaments`, and the `Tournament` type import must be commented out too, not just
the state/effect/JSX that used them — otherwise they become unused live imports and
`type-check` fails.

Replace the full contents of `apps/web/src/pages/HomePage.tsx` with:

```tsx
// import { useEffect, useState } from 'react';
// import { getTournaments } from '@dpt/db';
// import type { Tournament } from '@dpt/types';

import { HeroBackground } from '~/components/home/HeroBackground';
import { HeroContent } from '~/components/home/HeroContent';
import { HeroEmblem } from '~/components/home/HeroEmblem';
import { StatsBar } from '~/components/home/StatsBar';
import { AnnouncementsSection } from '~/components/home/AnnouncementsSection';
// import { UpcomingSection } from '~/components/home/UpcomingSection';
import { RewardsSection } from '~/components/home/RewardsSection';
import { RulesSection } from '~/components/home/RulesSection';
import { SponsorsSection } from '~/components/home/SponsorsSection';
import { HomeFooter } from '~/components/home/HomeFooter';

export function HomePage() {
  // const [tournaments, setTournaments] = useState<Tournament[]>([]);

  // useEffect(() => {
  //   getTournaments().then(setTournaments);
  // }, []);

  return (
    <div style={{ background: '#000', minHeight: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      <section
        className="relative flex flex-col"
        style={{ minHeight: 'calc(100vh - 64px)' }}
      >
        <HeroBackground />

        <div className="relative flex-1 container w-full mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10 pt-16 pb-10 lg:pt-16 lg:pb-16 min-h-[calc(100vh-130px)]">
            <HeroContent />
            <HeroEmblem />
          </div>
        </div>

        <StatsBar />
      </section>
      <SponsorsSection />
      <AnnouncementsSection />
      {/* <UpcomingSection tournaments={tournaments} /> */}
      <RewardsSection />
      <RulesSection />
      <HomeFooter />
    </div>
  );
}
```

**Step 2: Type-check**

Run: `cd apps/web && pnpm run type-check`
Expected: no errors, no unused-import/unused-local errors.

**Step 3: Commit**

```bash
git add apps/web/src/pages/HomePage.tsx
git commit -m "chore(web): hide upcoming tournaments section on homepage"
```

---

### Task 2: Rankings search + pagination

**Files:**
- Modify: `apps/web/src/pages/RankingsPage.tsx`

**Step 1: Add imports and the page-size constant**

At the top of the file, extend the existing `lucide-react` import and add a constant
near `MEDAL`:

```tsx
import { LayoutList, LayoutGrid, Search, ChevronLeft, ChevronRight } from 'lucide-react';
```

(replaces the existing `import { LayoutList, LayoutGrid } from 'lucide-react';` line)

Add, near the top-level `MEDAL` constant:

```tsx
const PAGE_SIZE = 20;
```

**Step 2: Add `rankOffset` prop to `RankTable` and `CardsGrid`**

In `RankTable` (currently `function RankTable({ rankings }: { rankings: RankingEntry[] })`),
change the signature and the rank calculation:

```tsx
function RankTable({ rankings, rankOffset }: { rankings: RankingEntry[]; rankOffset: number }) {
```

and inside its `.map`, change:

```tsx
      {rankings.map((player, i) => {
        const rank = i + 1;
```

to:

```tsx
      {rankings.map((player, i) => {
        const rank = rankOffset + i + 1;
```

Do the exact same two changes in `CardsGrid` (signature adds `rankOffset: number`, and
`const rank = i + 1;` becomes `const rank = rankOffset + i + 1;`).

**Step 3: Add a `Pager` component**

Add this new function in the file, after `CardsGrid` and before `export function
RankingsPage()`:

```tsx
function Pager({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center gap-1.5 mt-6">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="w-8 h-8 flex items-center justify-center rounded-md border border-[#2e2e2e] text-[#888] disabled:opacity-30 disabled:cursor-not-allowed hover:border-dpt-gold/40 hover:text-dpt-gold cursor-pointer transition-colors"
      >
        <ChevronLeft size={14} />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className="w-8 h-8 flex items-center justify-center rounded-md text-[13px] cursor-pointer transition-colors"
          style={{
            fontFamily: MONO,
            border: `1px solid ${p === page ? GOLD : '#2e2e2e'}`,
            background: p === page ? 'rgba(232,181,58,0.08)' : 'transparent',
            color: p === page ? GOLD : '#888',
          }}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="w-8 h-8 flex items-center justify-center rounded-md border border-[#2e2e2e] text-[#888] disabled:opacity-30 disabled:cursor-not-allowed hover:border-dpt-gold/40 hover:text-dpt-gold cursor-pointer transition-colors"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
```

This assumes a modest number of total pages (this app's player roster is small — dozens,
not thousands), so rendering every page number directly is fine; no ellipsis/windowing
needed (YAGNI).

**Step 4: Add search/pagination state and derived data in `RankingsPage`**

Inside `export function RankingsPage() {`, after the existing
`const [view, setView] = useState<'list' | 'cards'>('list');` line, add:

```tsx
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  function handleQueryChange(value: string) {
    setQuery(value);
    setPage(1);
  }
```

After the existing `const { data: rankings, loading } = useAsyncData(...)` block (leave
that block itself unchanged), and after the existing
`const top3 = rankings.slice(0, 3); const hasTop3 = top3.length === 3;` lines (leave
those unchanged too — the podium must keep reading from the full `rankings`, not the
filtered list), add:

```tsx
  const filtered = query.trim()
    ? rankings.filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase()))
    : rankings;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);
```

**Step 5: Add the search input to the header row**

The current header row is:

```tsx
          <div className="flex items-start justify-between gap-4">
            <div>
              <SectionLabel className="mb-1.5">// Standings · Updated Live</SectionLabel>
              <h1
                className="text-4xl sm:text-5xl font-black italic uppercase leading-none text-[#f0f0f0]"
                style={{ fontFamily: ARCHIVO }}
              >
                Rankings
              </h1>
            </div>

            <div className="flex gap-1 p-1 bg-[#181818] border border-[#2e2e2e] rounded-lg mt-1 shrink-0">
              {(['list', 'cards'] as const).map((v) => {
                ...
              })}
            </div>
          </div>
```

Wrap the toggle-group `<div>` and a new search-input `<div>` together in an outer flex
container, so the result is:

```tsx
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <SectionLabel className="mb-1.5">// Standings · Updated Live</SectionLabel>
              <h1
                className="text-4xl sm:text-5xl font-black italic uppercase leading-none text-[#f0f0f0]"
                style={{ fontFamily: ARCHIVO }}
              >
                Rankings
              </h1>
            </div>

            <div className="flex items-center gap-2 flex-wrap mt-1">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="Search players..."
                  className="pl-8 pr-3 py-1.5 rounded-lg bg-[#181818] border border-[#2e2e2e] text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-dpt-gold/40 w-full sm:w-56"
                />
              </div>

              <div className="flex gap-1 p-1 bg-[#181818] border border-[#2e2e2e] rounded-lg shrink-0">
                {(['list', 'cards'] as const).map((v) => {
                  const active = view === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setView(v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] cursor-pointer transition-all duration-150 whitespace-nowrap"
                      style={{
                        border: `1px solid ${active ? GOLD : 'transparent'}`,
                        background: active ? 'rgba(232,181,58,0.08)' : 'transparent',
                        color: active ? GOLD : '#666',
                        fontFamily: 'inherit',
                      }}
                    >
                      {v === 'list' ? <LayoutList size={14} /> : <LayoutGrid size={14} />}
                      {v === 'list' ? 'List' : 'Cards'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
```

(Only the wrapping structure and the addition of the search `<div>` are new — the
List/Cards toggle's own markup/logic is unchanged, just re-indented one level deeper
and moved `mt-1 shrink-0` classes: `mt-1` moved to the new outer wrapper, `shrink-0`
kept on the toggle-group div itself.)

**Step 6: Update the body to use `pageItems`/`rankOffset`, add empty-search state and the pager**

The current body is:

```tsx
        {loading ? (
          <p className="text-dim text-center pt-12">Loading rankings…</p>
        ) : rankings.length === 0 ? (
          <p className="text-[#444] text-center pt-12">
            No rankings yet — players will appear here once tournaments begin.
          </p>
        ) : (
          <>
            {view === 'list' && hasTop3 && (
              <div className="flex flex-col sm:flex-row gap-2.5 mb-7">
                <PodiumCard player={top3[0]} rank={1} className="order-1 sm:order-2" />
                <PodiumCard player={top3[1]} rank={2} className="order-2 sm:order-1" />
                <PodiumCard player={top3[2]} rank={3} className="order-3" />
              </div>
            )}
            {view === 'list' ? (
              <RankTable rankings={rankings} />
            ) : (
              <CardsGrid rankings={rankings} />
            )}
          </>
        )}
```

Change it to:

```tsx
        {loading ? (
          <p className="text-dim text-center pt-12">Loading rankings…</p>
        ) : rankings.length === 0 ? (
          <p className="text-[#444] text-center pt-12">
            No rankings yet — players will appear here once tournaments begin.
          </p>
        ) : (
          <>
            {view === 'list' && hasTop3 && (
              <div className="flex flex-col sm:flex-row gap-2.5 mb-7">
                <PodiumCard player={top3[0]} rank={1} className="order-1 sm:order-2" />
                <PodiumCard player={top3[1]} rank={2} className="order-2 sm:order-1" />
                <PodiumCard player={top3[2]} rank={3} className="order-3" />
              </div>
            )}
            {filtered.length === 0 ? (
              <p className="text-[#444] text-center pt-12">
                No players match &ldquo;{query}&rdquo;.
              </p>
            ) : (
              <>
                {view === 'list' ? (
                  <RankTable rankings={pageItems} rankOffset={pageStart} />
                ) : (
                  <CardsGrid rankings={pageItems} rankOffset={pageStart} />
                )}
                <Pager page={currentPage} totalPages={totalPages} onChange={setPage} />
              </>
            )}
          </>
        )}
```

Note: the podium block (`view === 'list' && hasTop3 && (...)`) stays outside/above the
`filtered.length === 0` check and keeps reading `top3`/`hasTop3` exactly as before —
this is what keeps it showing the true overall top 3 regardless of search text.

**Step 7: Type-check**

Run: `cd apps/web && pnpm run type-check`
Expected: no errors.

**Step 8: Commit**

```bash
git add apps/web/src/pages/RankingsPage.tsx
git commit -m "feat(web): add search and pagination to rankings page"
```

---

### Task 3: Manual verification

**Step 1: Start the dev server**

Run: `cd apps/web && pnpm run dev`

**Step 2: Verify in browser**

- Go to `/` — confirm "Upcoming Tournaments" no longer renders, no console errors, no
  unused-import type errors (already caught by Task 1's type-check, but double check
  visually that the rest of the homepage still renders normally around the removed
  section).
- Go to `/rankings` — confirm:
  - Search input appears next to the List/Cards toggle.
  - Typing a player's name (or partial name) narrows the table/grid to matches, and
    resets to page 1 if you were on a later page.
  - Typing a query that matches nobody shows the "No players match" message instead of
    an empty table.
  - Clearing the search restores the full list.
  - If there are more than 20 players, a pager appears below the table/grid; clicking
    page numbers / Prev / Next navigates correctly, and rank numbers shown in the
    table/grid continue counting up correctly across pages (e.g., page 2 starts at
    rank 21, not rank 1).
  - The top-3 podium (List view) keeps showing the true overall #1–#3 regardless of
    search text or current page.
  - Switching between List/Cards views preserves the current search/page.
  - Mobile-width layout: search input and toggle wrap sensibly, pager remains usable.

**Step 3: Stop the dev server** once verified.

No commit needed for this task (verification only).
