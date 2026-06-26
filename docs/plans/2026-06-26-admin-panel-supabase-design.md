# Admin Panel UI + Supabase Integration Design

**Date:** 2026-06-26  
**Approach:** Feature-by-feature (C) — schema + query + admin UI + public wire-up per feature

---

## Context

The project is a monorepo with `apps/admin` (separate Vite + React app) and `apps/web` (public site). The admin already has all pages scaffolded but completely unstyled. `packages/db` has Supabase queries for players, tournaments, matches, and points. The public rankings page uses hardcoded mock data with a `trend` field that has no real backend yet.

---

## Schema Changes

### New table: `rank_snapshots`

```sql
create table rank_snapshots (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid references players(id) on delete cascade,
  rank          int not null,
  total_points  int not null,
  snapshot_type text not null check (snapshot_type in ('auto', 'tournament_close', 'manual')),
  created_at    timestamptz default now()
);
```

Rank trend displayed on the public site = `previous_rank - current_rank` where `previous_rank` comes from the most recent `rank_snapshots` row per player. Positive = climbed, negative = dropped.

### Changes to `players` table

```sql
alter table players add column code  text;   -- e.g. DPT-01
alter table players add column venue text;   -- home venue
```

These fields are already shown in the public rankings mock data but missing from the real schema.

### No other schema changes needed

The matches, tournament_participants, and tournaments tables already support all required features.

---

## Rank Snapshot Triggers

All three write to the same `rank_snapshots` table — no duplicate logic:

| Trigger | snapshot_type | When |
|---|---|---|
| Admin edits player points | `auto` | On `updatePlayerPoints` call |
| Admin marks tournament completed | `tournament_close` | On tournament status → `completed` |
| Admin clicks "Lock Snapshot" button | `manual` | Explicit button in admin Rankings page |

The snapshot operation: compute current rank order from `players.total_points DESC`, insert one row per player with their rank at that moment.

---

## Admin UI Theme

**Stack:** shadcn/ui installed into `apps/admin`, custom dark theme via CSS variables.

**Color palette:**
```
--background:  #0e0e0e
--card:        #141414
--border:      rgba(255,255,255,0.07)
--foreground:  #f0f0f0
--muted:       #3a3a3a
--primary:     #E8B53A   (DPT gold — CTAs, active states, focus rings)
--destructive: #f87171
```

**Component conventions:**
- `DataTable` (shadcn Table) for all list views — row actions via `DropdownMenu`
- `Dialog` for all create/edit forms
- `Badge` for status and tier labels
- `Tabs` for Tournament Manager
- `Button` variants: default (gold fill), outline, ghost, destructive

**Layout:** Existing `AdminLayout` sidebar rebuilt with shadcn — fixed sidebar on desktop, `Sheet` drawer on mobile. Gold accent on active nav item.

---

## Feature Breakdown (Build Order)

### 1. Players Page

- `DataTable`: Code, Name, Venue, Points, Tier badge, row actions
- "Add Player" → `Dialog`: name, code (auto-suggest DPT-XX), venue (select), starting points
- Edit row → same dialog pre-filled
- Delete → confirm dialog
- Inline points edit → save → triggers `auto` rank snapshot for all players

### 2. Rankings Page (admin)

- Read-only `DataTable`: rank, trend arrow, name, code, venue, points
- "Lock Snapshot" button → inserts `manual` snapshot for all players
- Shows timestamp of last snapshot

### 3. Tournament Creation

- Rebuild `CreateTournamentPage` as a clean form in a shadcn `Card`
- Fields: name, date (date picker), venue (select), bracket format (R16/QF toggle), type (individual/team toggle)

### 4. Tournament Manager (4 tabs)

**Participants tab**
- Searchable combobox to add players (individual) or teams
- Current participant list with remove action
- Shows slot count vs max (e.g. 6/16)

**Bracket tab**
- Slot grid showing assigned participant per position
- Three generation buttons:
  - **Randomize** — pure random shuffle of participants into slots
  - **Seed & Randomize** — top half by points rank assigned to one bracket side, bottom half to the other; random within each side
  - **Auto-assign** — fills slots in descending points order (no randomness)
- Manual drag-to-reorder within the slot grid after any generation mode
- "Generate Matches" button → creates round 1 match rows from current slot assignments

**Matches tab**
- Each match displayed as a card: round label, participant names, score inputs, winner select
- Saving a result auto-populates the winner into the next round's slot

**Points tab**
- Per-participant points input
- "Save All Points" button
- "Mark Complete" button → saves points, updates tournament status to `completed`, triggers `tournament_close` rank snapshot

### 5. Teams Page

- Create team by selecting 2 existing players
- Table shows team member names, delete option

### 6. Announcements Page

- `DataTable` with create/edit/delete via `Dialog`
- Fields: title, content (textarea), type (select), published date

---

## Public Web App Wire-up

Runs alongside each feature as it lands:

- Remove `USE_MOCK` flag from `RankingsPage` — fetch real players, compute trend from `rank_snapshots`
- Remove mock data from `BracketsPage` / `TournamentPage` once bracket flow is complete
- Rankings `trend` field: query latest snapshot per player, diff against current computed rank

---

## Type Updates (`packages/types`)

```ts
interface Player {
  id: string;
  name: string;
  code: string | null;
  venue: string | null;
  total_points: number;
  created_at: string;
}

interface RankSnapshot {
  id: string;
  player_id: string;
  rank: number;
  total_points: number;
  snapshot_type: 'auto' | 'tournament_close' | 'manual';
  created_at: string;
}
```
