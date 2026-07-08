# Tournament Detail Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build out `apps/web/src/pages/TournamentPage.tsx` (the `/tournaments/:id` detail
page) from an unstyled stub into a full page showing header info, live bracket, match
schedule, and participant roster for a single tournament.

**Architecture:** Extract two small pieces of logic that already exist inline in
`TournamentsPage.tsx` (status/format/type labels) and `SchedulePage.tsx` (day-grouped
match list rendering) into shared modules, then compose them — plus the existing
`BracketView` component — into the new `TournamentPage.tsx` layout. No new data-fetching
logic is needed; `TournamentPage.tsx` already calls `getTournament`,
`getTournamentParticipants`, `getMatches`, `subscribeToMatches`.

**Tech Stack:** React, react-router, Tailwind, `@dpt/db`, `@dpt/types`, `@dpt/ui` (theme
constants), `lucide-react` icons.

**Design doc:** `docs/plans/2026-07-08-tournament-detail-page-design.md`

---

### Task 1: Extract shared tournament labels

**Files:**
- Create: `apps/web/src/lib/tournamentLabels.ts`
- Modify: `apps/web/src/pages/TournamentsPage.tsx`

**Step 1: Create the shared labels module**

Move the three lookup tables out of `TournamentsPage.tsx` (currently lines 9-24) into
a new file:

```typescript
// apps/web/src/lib/tournamentLabels.ts
import type { TournamentStatus, BracketFormat, TournamentType } from '@dpt/types';
import { GOLD } from '~/lib/theme';

export const STATUS_CONFIG: Record<TournamentStatus, { color: string; label: string }> = {
  ongoing:   { color: '#4ade80', label: 'Live' },
  upcoming:  { color: GOLD,     label: 'Upcoming' },
  completed: { color: '#555',   label: 'Completed' },
};

export const FORMAT_LABEL: Record<BracketFormat, string> = {
  R32: 'Round of 32',
  R16: 'Round of 16',
  QF: 'Quarter Finals',
};

export const TYPE_LABEL: Record<TournamentType, string> = {
  individual: 'Individual',
  team: 'Team',
};
```

**Step 2: Update `TournamentsPage.tsx` to import from the shared module**

- Delete lines 9-24 (the three `const` declarations) from
  `apps/web/src/pages/TournamentsPage.tsx`.
- Remove the now-unused `GOLD` import if nothing else in the file uses it (check
  first — `MONO, ARCHIVO` are still used from the same import line 7; keep those,
  drop `GOLD` only if unused elsewhere in the file).
- Add: `import { STATUS_CONFIG, FORMAT_LABEL, TYPE_LABEL } from '~/lib/tournamentLabels';`

**Step 3: Type-check**

Run: `cd apps/web && npm run type-check`
Expected: no errors.

**Step 4: Commit**

```bash
git add apps/web/src/lib/tournamentLabels.ts apps/web/src/pages/TournamentsPage.tsx
git commit -m "refactor(web): extract tournament status/format/type labels to shared module"
```

---

### Task 2: Extract `MatchScheduleList` component

**Files:**
- Create: `apps/web/src/components/schedule/MatchScheduleList.tsx`
- Modify: `apps/web/src/pages/SchedulePage.tsx`

**Step 1: Create the component**

Move the day-grouped rendering block out of `SchedulePage.tsx` (currently lines 74-99,
the `dayGroups.map(...)` block and the empty-state check) into a standalone component
that owns its own empty state:

```typescript
// apps/web/src/components/schedule/MatchScheduleList.tsx
import type { Match, Tournament, TournamentParticipantWithDetails } from '@dpt/types';
import { groupMatchesByDay } from '@dpt/db';
import { getParticipantName, getRoundLabel } from '~/components/brackets/bracketLayout';
import { MONO } from '~/lib/theme';

interface MatchScheduleListProps {
  matches: Match[];
  participants: TournamentParticipantWithDetails[];
  tournament: Tournament;
}

export function MatchScheduleList({ matches, participants, tournament }: MatchScheduleListProps) {
  const participantMap: Record<string, TournamentParticipantWithDetails> = {};
  for (const p of participants) participantMap[p.id] = p;

  const roundsByNumber = new Map<number, number>(); // round number -> match count in that round
  for (const m of matches) {
    roundsByNumber.set(m.round, (roundsByNumber.get(m.round) ?? 0) + 1);
  }

  const dayGroups = groupMatchesByDay(matches);

  if (dayGroups.length === 0) {
    return <p className="text-[#555] pt-12 text-center">No matches scheduled yet</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      {dayGroups.map(group => (
        <div key={group.dateKey}>
          <p className="text-[11px] uppercase tracking-[0.2em] text-dpt-gold mb-3" style={{ fontFamily: MONO }}>
            {new Date(group.dateKey + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <div className="flex flex-col gap-2">
            {group.matches.map(m => {
              const p1 = m.participant1_id ? participantMap[m.participant1_id] : undefined;
              const p2 = m.participant2_id ? participantMap[m.participant2_id] : undefined;
              const time = new Date(m.scheduled_at!).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
              return (
                <div key={m.id} className="flex items-center gap-4 bg-[#141414] border border-white/8 rounded-xl p-3">
                  <span className="text-dpt-gold text-sm font-bold w-16 shrink-0" style={{ fontFamily: MONO }}>{time}</span>
                  <span className="text-dim text-xs shrink-0" style={{ fontFamily: MONO }}>{getRoundLabel(roundsByNumber.get(m.round) ?? 0)}</span>
                  <span className="text-white text-sm flex-1">
                    {getParticipantName(p1, tournament.tournament_type)} vs {getParticipantName(p2, tournament.tournament_type)}
                  </span>
                  {m.venue && <span className="text-dim text-xs" style={{ fontFamily: MONO }}>{m.venue}</span>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Update `SchedulePage.tsx` to use it**

Replace the loading/empty/day-groups conditional block (lines 66-101) with:

```tsx
      <div className="mx-auto container py-6 sm:py-10">
        {loadingTournaments || loadingMatches ? (
          <p className="text-[#555] pt-12 text-center">Loading schedule…</p>
        ) : !selectedTournament ? (
          <p className="text-[#555] pt-12 text-center">No tournaments found</p>
        ) : (
          <MatchScheduleList matches={matches} participants={participants} tournament={selectedTournament} />
        )}
      </div>
```

- Add `import { MatchScheduleList } from '~/components/schedule/MatchScheduleList';`
- Remove now-unused imports/logic from `SchedulePage.tsx`: `groupMatchesByDay`,
  `getParticipantName`, `getRoundLabel` are no longer used directly in this file (they're
  used inside `MatchScheduleList` now) — remove them from the import lines. Keep
  `getTournaments`, `getMatches`, `getTournamentParticipants` (still used for fetching).
  The `participantMap` and `roundsByNumber` local variables in `SchedulePage.tsx`
  (lines 40-46) are also now dead code — delete them.

**Step 3: Type-check**

Run: `cd apps/web && npm run type-check`
Expected: no errors, no unused-import warnings.

**Step 4: Commit**

```bash
git add apps/web/src/components/schedule/MatchScheduleList.tsx apps/web/src/pages/SchedulePage.tsx
git commit -m "refactor(web): extract MatchScheduleList component from SchedulePage"
```

---

### Task 3: Rebuild TournamentPage.tsx

**Files:**
- Modify: `apps/web/src/pages/TournamentPage.tsx` (full rewrite)

**Step 1: Replace the file contents**

```tsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { Calendar, MapPin, Users, ArrowLeft } from 'lucide-react';
import { getTournament, getTournamentParticipants, getMatches, subscribeToMatches } from '@dpt/db';
import type { Tournament, TournamentParticipantWithDetails, Match } from '@dpt/types';
import { BracketView } from '~/components/brackets/BracketView';
import { MatchScheduleList } from '~/components/schedule/MatchScheduleList';
import { getParticipantName } from '~/components/brackets/bracketLayout';
import { STATUS_CONFIG, FORMAT_LABEL, TYPE_LABEL } from '~/lib/tournamentLabels';
import { MONO, ARCHIVO } from '~/lib/theme';

export function TournamentPage() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<TournamentParticipantWithDetails[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    getTournament(id)
      .then(setTournament)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
    getTournamentParticipants(id).then(setParticipants);
    getMatches(id).then(setMatches);
    const channel = subscribeToMatches(id, setMatches);
    return () => { channel.unsubscribe(); };
  }, [id]);

  if (loading) {
    return (
      <div className="bg-dpt-bg min-h-screen">
        <p className="text-[#555] pt-24 text-center">Loading tournament…</p>
      </div>
    );
  }

  if (notFound || !tournament) {
    return (
      <div className="bg-dpt-bg min-h-screen">
        <div className="mx-auto container py-24 text-center">
          <p className="text-[#555] mb-4">Tournament not found</p>
          <Link to="/tournaments" className="text-dpt-gold text-sm" style={{ fontFamily: MONO }}>
            Back to tournaments
          </Link>
        </div>
      </div>
    );
  }

  const sc = STATUS_CONFIG[tournament.status];

  return (
    <div className="bg-dpt-bg min-h-screen">
      <div className="border-b border-white/6 bg-linear-to-b from-[rgba(232,181,58,0.05)] to-transparent">
        <div className="mx-auto container py-6 sm:py-10">
          <Link
            to="/tournaments"
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-[#888] hover:text-dpt-gold mb-4"
            style={{ fontFamily: MONO }}
          >
            <ArrowLeft size={12} /> Tournaments
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] uppercase tracking-[0.12em]"
              style={{
                fontFamily: MONO,
                color: sc.color,
                background: `${sc.color}12`,
                border: `1px solid ${sc.color}35`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sc.color }} />
              {sc.label}
            </div>
            <span className="text-[10px] text-[#444] tracking-[0.08em]" style={{ fontFamily: MONO }}>
              {FORMAT_LABEL[tournament.bracket_format]}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black italic uppercase leading-none text-[#f0f0f0] mb-6" style={{ fontFamily: ARCHIVO }}>
            {tournament.name}
          </h1>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <Calendar size={13} color="#555" className="shrink-0" />
              <span className="text-[13px] text-[#888]">
                {new Date(tournament.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={13} color="#555" className="shrink-0" />
              <span className="text-[13px] text-[#888]">{tournament.venue}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={13} color="#555" className="shrink-0" />
              <span className="text-[13px] text-[#888]">
                <span className="mr-1.5" style={{ fontFamily: MONO }}>{participants.length}</span>
                {TYPE_LABEL[tournament.tournament_type]}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto container py-6 sm:py-10 flex flex-col gap-12">
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-dpt-gold mb-4" style={{ fontFamily: MONO }}>
            Bracket
          </h2>
          <BracketView matches={matches} participants={participants} tournament={tournament} />
        </section>

        <section>
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-dpt-gold mb-4" style={{ fontFamily: MONO }}>
            Schedule
          </h2>
          <MatchScheduleList matches={matches} participants={participants} tournament={tournament} />
        </section>

        <section>
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-dpt-gold mb-4" style={{ fontFamily: MONO }}>
            Participants ({participants.length})
          </h2>
          {participants.length === 0 ? (
            <p className="text-[#555] text-center py-8">No participants yet</p>
          ) : (
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
              {participants.map((p) => (
                <div key={p.id} className="flex items-center gap-3 bg-[#141414] border border-white/8 rounded-xl p-3">
                  <span className="text-dpt-gold text-xs font-bold w-6 shrink-0" style={{ fontFamily: MONO }}>
                    {p.bracket_position ?? '–'}
                  </span>
                  <span className="text-white text-sm">{getParticipantName(p, tournament.tournament_type)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
```

**Step 2: Type-check**

Run: `cd apps/web && npm run type-check`
Expected: no errors.

**Step 3: Commit**

```bash
git add apps/web/src/pages/TournamentPage.tsx
git commit -m "feat(web): build out tournament detail page with header, bracket, schedule, and roster"
```

---

### Task 4: Manual verification

**Step 1: Start the dev server**

Run: `cd apps/web && npm run dev`

**Step 2: Verify in browser**

- Go to `/tournaments`, click a tournament card, confirm it navigates to
  `/tournaments/:id` and renders header (status/format/name/date/venue/participant
  count), bracket, schedule, and participants sections without console errors.
- Find (or temporarily note) a tournament with no matches yet — confirm the bracket
  shows "Bracket not yet set up" and schedule shows "No matches scheduled yet" rather
  than crashing.
- Visit `/tournaments/not-a-real-id` directly — confirm it shows "Tournament not
  found" with a link back to `/tournaments`, not an infinite loading spinner.
- Resize to mobile width (~375px) — confirm the header wraps cleanly and the bracket
  section scrolls horizontally without breaking page layout.
- Re-visit `/tournaments` and `/schedule` directly — confirm both still render
  correctly after the `Task 1`/`Task 2` extractions (no visual regression).

**Step 3: Stop the dev server** once verified.

No commit needed for this task (verification only).
