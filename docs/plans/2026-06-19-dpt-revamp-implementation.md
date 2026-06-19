# DPT Revamp Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the Delta Padel Tour app as a TypeScript monorepo with a public leaderboard website and an admin dashboard, backed by Supabase.

**Architecture:** Turborepo + pnpm workspaces with two Vite/React/TS apps (`apps/web`, `apps/admin`) sharing code via three packages (`packages/ui`, `packages/db`, `packages/types`). Supabase provides Postgres, Realtime, and Auth.

**Tech Stack:** Vite 7, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion, React Router v7, Supabase JS v2, Turborepo, pnpm

---

## Prerequisites (do before starting)

1. Create a Supabase project at supabase.com — note the **Project URL** and **anon key** and **service_role key**
2. Install pnpm globally if not present: `npm i -g pnpm`
3. Confirm Node ≥ 20 and pnpm ≥ 9

---

## Task 1: Tear down old app & scaffold monorepo root

**Files:**
- Delete: `src/`, `public/`, `index.html`, `vite.config.js`, `eslint.config.js`, `package.json`, `package-lock.json`
- Create: `pnpm-workspace.yaml`, `turbo.json`, `package.json` (root), `.gitignore` (updated)

**Step 1: Remove old files**
```bash
rm -rf src public index.html vite.config.js eslint.config.js package.json package-lock.json
```

**Step 2: Create `pnpm-workspace.yaml`**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**Step 3: Create root `package.json`**
```json
{
  "name": "dpt",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "type-check": "turbo type-check"
  },
  "devDependencies": {
    "turbo": "^2.5.0",
    "typescript": "^5.8.0"
  },
  "engines": {
    "node": ">=20",
    "pnpm": ">=9"
  }
}
```

**Step 4: Create `turbo.json`**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "type-check": {}
  }
}
```

**Step 5: Install root deps**
```bash
pnpm install
```

**Step 6: Commit**
```bash
git add -A
git commit -m "chore: tear down old app, scaffold monorepo root"
```

---

## Task 2: Create `packages/types`

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/src/index.ts`

**Step 1: Create `packages/types/package.json`**
```json
{
  "name": "@dpt/types",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  }
}
```

**Step 2: Create `packages/types/tsconfig.json`**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true
  }
}
```

**Step 3: Create `packages/types/src/index.ts`**
```typescript
export type TierLabel = 'LEGEND' | 'ELITE' | 'PRO' | 'ROOKIE';
export type BracketFormat = 'R16' | 'QF';
export type TournamentType = 'individual' | 'team';
export type TournamentStatus = 'upcoming' | 'ongoing' | 'completed';
export type AnnouncementType = 'general' | 'tournament' | 'rules' | 'rewards';
export type Venue = 'Mansoura Padel Point' | 'Ace Town Complex' | 'Padel H';

export interface Player {
  id: string;
  name: string;
  total_points: number;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  created_at: string;
}

export interface TeamMember {
  team_id: string;
  player_id: string;
}

export interface TeamWithPlayers extends Team {
  players: Player[];
}

export interface Tournament {
  id: string;
  name: string;
  date: string;
  venue: Venue;
  bracket_format: BracketFormat;
  tournament_type: TournamentType;
  status: TournamentStatus;
  created_at: string;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  player_id: string | null;
  team_id: string | null;
  bracket_position: number | null;
  points_awarded: number;
}

export interface TournamentParticipantWithDetails extends TournamentParticipant {
  player?: Player;
  team?: TeamWithPlayers;
}

export interface Match {
  id: string;
  tournament_id: string;
  round: number;
  position: number;
  participant1_id: string | null;
  participant2_id: string | null;
  score1: number | null;
  score2: number | null;
  winner_id: string | null;
}

export interface MatchWithParticipants extends Match {
  participant1?: TournamentParticipantWithDetails;
  participant2?: TournamentParticipantWithDetails;
  winner?: TournamentParticipantWithDetails;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  published_at: string;
}

export interface Tier {
  label: TierLabel;
  min: number;
  color: string;
}
```

**Step 4: Commit**
```bash
git add packages/types
git commit -m "feat(types): add shared TypeScript types package"
```

---

## Task 3: Set up Supabase schema

Run these SQL statements in the Supabase SQL editor (Dashboard → SQL Editor).

**Step 1: Create tables**
```sql
-- Enable UUID generation
create extension if not exists "pgcrypto";

create table players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  total_points int not null default 0,
  created_at timestamptz not null default now()
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table team_members (
  team_id uuid not null references teams(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  primary key (team_id, player_id)
);

create table tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  venue text not null,
  bracket_format text not null check (bracket_format in ('R16', 'QF')),
  tournament_type text not null check (tournament_type in ('individual', 'team')),
  status text not null default 'upcoming' check (status in ('upcoming', 'ongoing', 'completed')),
  created_at timestamptz not null default now()
);

create table tournament_participants (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  team_id uuid references teams(id) on delete cascade,
  bracket_position int,
  points_awarded int not null default 0,
  constraint participant_xor check (
    (player_id is not null and team_id is null) or
    (player_id is null and team_id is not null)
  )
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  round int not null,
  position int not null,
  participant1_id uuid references tournament_participants(id),
  participant2_id uuid references tournament_participants(id),
  score1 int,
  score2 int,
  winner_id uuid references tournament_participants(id),
  created_at timestamptz not null default now()
);

create table announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  type text not null default 'general' check (type in ('general', 'tournament', 'rules', 'rewards')),
  published_at timestamptz not null default now()
);
```

**Step 2: Enable Realtime on key tables**

In Supabase Dashboard → Database → Replication, enable Realtime for:
- `players`
- `matches`

**Step 3: Set up RLS**
```sql
-- Enable RLS on all tables
alter table players enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table tournaments enable row level security;
alter table tournament_participants enable row level security;
alter table matches enable row level security;
alter table announcements enable row level security;

-- Public can read everything
create policy "Public read players" on players for select using (true);
create policy "Public read teams" on teams for select using (true);
create policy "Public read team_members" on team_members for select using (true);
create policy "Public read tournaments" on tournaments for select using (true);
create policy "Public read tournament_participants" on tournament_participants for select using (true);
create policy "Public read matches" on matches for select using (true);
create policy "Public read announcements" on announcements for select using (true);

-- Authenticated users (admins) can write everything
create policy "Auth write players" on players for all using (auth.role() = 'authenticated');
create policy "Auth write teams" on teams for all using (auth.role() = 'authenticated');
create policy "Auth write team_members" on team_members for all using (auth.role() = 'authenticated');
create policy "Auth write tournaments" on tournaments for all using (auth.role() = 'authenticated');
create policy "Auth write tournament_participants" on tournament_participants for all using (auth.role() = 'authenticated');
create policy "Auth write matches" on matches for all using (auth.role() = 'authenticated');
create policy "Auth write announcements" on announcements for all using (auth.role() = 'authenticated');
```

**Step 4: Create the points trigger**

When `tournament_participants.points_awarded` is updated, add the delta to `players.total_points`:
```sql
create or replace function sync_player_points()
returns trigger as $$
begin
  if NEW.player_id is not null then
    update players
    set total_points = total_points + (NEW.points_awarded - OLD.points_awarded)
    where id = NEW.player_id;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_participant_points_updated
  after update of points_awarded on tournament_participants
  for each row execute function sync_player_points();
```

**Step 5: Create an admin user**

In Supabase Dashboard → Authentication → Users → Invite user — add admin email. Or use:
```sql
-- In SQL editor (replace values)
select auth.create_user('admin@dpt.com', 'your-strong-password');
```

---

## Task 4: Create `packages/db`

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/src/client.ts`
- Create: `packages/db/src/queries/players.ts`
- Create: `packages/db/src/queries/teams.ts`
- Create: `packages/db/src/queries/tournaments.ts`
- Create: `packages/db/src/queries/matches.ts`
- Create: `packages/db/src/queries/announcements.ts`
- Create: `packages/db/src/realtime.ts`
- Create: `packages/db/src/index.ts`

**Step 1: `packages/db/package.json`**
```json
{
  "name": "@dpt/db",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "@dpt/types": "workspace:*",
    "@supabase/supabase-js": "^2.50.0"
  }
}
```

**Step 2: `packages/db/tsconfig.json`**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true
  }
}
```

**Step 3: `packages/db/src/client.ts`**
```typescript
import { createClient } from '@supabase/supabase-js';

// Both apps must set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in their .env
const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(url, key);
```

**Step 4: `packages/db/src/queries/players.ts`**
```typescript
import { supabase } from '../client';
import type { Player } from '@dpt/types';

export async function getPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('total_points', { ascending: false });
  if (error) throw error;
  return data;
}

export async function upsertPlayer(player: Omit<Player, 'created_at'>): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .upsert(player)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePlayer(id: string): Promise<void> {
  const { error } = await supabase.from('players').delete().eq('id', id);
  if (error) throw error;
}

export async function updatePlayerPoints(id: string, total_points: number): Promise<void> {
  const { error } = await supabase
    .from('players')
    .update({ total_points })
    .eq('id', id);
  if (error) throw error;
}
```

**Step 5: `packages/db/src/queries/teams.ts`**
```typescript
import { supabase } from '../client';
import type { Team, TeamWithPlayers } from '@dpt/types';

export async function getTeams(): Promise<TeamWithPlayers[]> {
  const { data, error } = await supabase
    .from('teams')
    .select(`*, team_members(player_id, players(*))`);
  if (error) throw error;
  return data.map((t: any) => ({
    ...t,
    players: t.team_members.map((m: any) => m.players),
  }));
}

export async function createTeam(name: string, playerIds: [string, string]): Promise<Team> {
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({ name })
    .select()
    .single();
  if (teamError) throw teamError;

  const { error: memberError } = await supabase
    .from('team_members')
    .insert(playerIds.map((player_id) => ({ team_id: team.id, player_id })));
  if (memberError) throw memberError;

  return team;
}

export async function deleteTeam(id: string): Promise<void> {
  const { error } = await supabase.from('teams').delete().eq('id', id);
  if (error) throw error;
}
```

**Step 6: `packages/db/src/queries/tournaments.ts`**
```typescript
import { supabase } from '../client';
import type { Tournament, TournamentParticipantWithDetails } from '@dpt/types';

export async function getTournaments(): Promise<Tournament[]> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getTournament(id: string): Promise<Tournament> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createTournament(
  payload: Omit<Tournament, 'id' | 'created_at'>
): Promise<Tournament> {
  const { data, error } = await supabase
    .from('tournaments')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTournamentStatus(
  id: string,
  status: Tournament['status']
): Promise<void> {
  const { error } = await supabase
    .from('tournaments')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

export async function getTournamentParticipants(
  tournamentId: string
): Promise<TournamentParticipantWithDetails[]> {
  const { data, error } = await supabase
    .from('tournament_participants')
    .select(`*, players(*), teams(*, team_members(player_id, players(*)))`)
    .eq('tournament_id', tournamentId)
    .order('bracket_position', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data.map((p: any) => ({
    ...p,
    team: p.teams
      ? {
          ...p.teams,
          players: p.teams.team_members.map((m: any) => m.players),
        }
      : undefined,
  }));
}

export async function addParticipant(payload: {
  tournament_id: string;
  player_id?: string;
  team_id?: string;
  bracket_position?: number;
}): Promise<void> {
  const { error } = await supabase.from('tournament_participants').insert(payload);
  if (error) throw error;
}

export async function awardPoints(participantId: string, points: number): Promise<void> {
  const { error } = await supabase
    .from('tournament_participants')
    .update({ points_awarded: points })
    .eq('id', participantId);
  if (error) throw error;
}
```

**Step 7: `packages/db/src/queries/matches.ts`**
```typescript
import { supabase } from '../client';
import type { Match } from '@dpt/types';

export async function getMatches(tournamentId: string): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('round', { ascending: true })
    .order('position', { ascending: true });
  if (error) throw error;
  return data;
}

export async function upsertMatch(match: Partial<Match> & { tournament_id: string; round: number; position: number }): Promise<Match> {
  const { data, error } = await supabase
    .from('matches')
    .upsert(match, { onConflict: 'tournament_id,round,position' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function saveMatchResult(
  id: string,
  score1: number,
  score2: number,
  winner_id: string
): Promise<void> {
  const { error } = await supabase
    .from('matches')
    .update({ score1, score2, winner_id })
    .eq('id', id);
  if (error) throw error;
}
```

**Step 8: `packages/db/src/queries/announcements.ts`**
```typescript
import { supabase } from '../client';
import type { Announcement } from '@dpt/types';

export async function getAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('published_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function upsertAnnouncement(
  announcement: Partial<Announcement>
): Promise<Announcement> {
  const { data, error } = await supabase
    .from('announcements')
    .upsert(announcement)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) throw error;
}
```

**Step 9: `packages/db/src/realtime.ts`**
```typescript
import { supabase } from './client';
import type { Player, Match } from '@dpt/types';

export function subscribeToPlayers(onUpdate: (players: Player[]) => void) {
  return supabase
    .channel('players-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, async () => {
      const { data } = await supabase
        .from('players')
        .select('*')
        .order('total_points', { ascending: false });
      if (data) onUpdate(data);
    })
    .subscribe();
}

export function subscribeToMatches(
  tournamentId: string,
  onUpdate: (matches: Match[]) => void
) {
  return supabase
    .channel(`matches-${tournamentId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'matches', filter: `tournament_id=eq.${tournamentId}` },
      async () => {
        const { data } = await supabase
          .from('matches')
          .select('*')
          .eq('tournament_id', tournamentId)
          .order('round')
          .order('position');
        if (data) onUpdate(data);
      }
    )
    .subscribe();
}
```

**Step 10: `packages/db/src/index.ts`**
```typescript
export { supabase } from './client';
export * from './queries/players';
export * from './queries/teams';
export * from './queries/tournaments';
export * from './queries/matches';
export * from './queries/announcements';
export { subscribeToPlayers, subscribeToMatches } from './realtime';
```

**Step 11: Install packages/db deps**
```bash
cd packages/db && pnpm install && cd ../..
```

**Step 12: Commit**
```bash
git add packages/db
git commit -m "feat(db): add Supabase client, queries, and realtime helpers"
```

---

## Task 5: Scaffold `apps/web`

**Step 1: Create the app with Vite**
```bash
pnpm create vite apps/web --template react-ts
```

**Step 2: Update `apps/web/package.json`** — add workspace deps and dev tools
```json
{
  "name": "@dpt/web",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@dpt/db": "workspace:*",
    "@dpt/types": "workspace:*",
    "@dpt/ui": "workspace:*",
    "framer-motion": "^12.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router": "^7.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "^5.8.0",
    "vite": "^7.0.0",
    "vitest": "^3.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.0.0",
    "jsdom": "^26.0.0"
  }
}
```

**Step 3: Create `apps/web/.env`** (never commit — already in .gitignore)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Step 4: Configure `apps/web/vite.config.ts`**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
});
```

**Step 5: Install web deps**
```bash
cd apps/web && pnpm install && cd ../..
```

**Step 6: Commit**
```bash
git add apps/web
git commit -m "chore(web): scaffold Vite + React TS app"
```

---

## Task 6: Scaffold `apps/admin`

Same process as Task 5 but for admin:

**Step 1:**
```bash
pnpm create vite apps/admin --template react-ts
```

**Step 2: Update `apps/admin/package.json`** — identical dep list to web (no framer-motion)
```json
{
  "name": "@dpt/admin",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port 3001",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@dpt/db": "workspace:*",
    "@dpt/types": "workspace:*",
    "@dpt/ui": "workspace:*",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router": "^7.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "^5.8.0",
    "vite": "^7.0.0",
    "vitest": "^3.0.0"
  }
}
```

**Step 3: Create `apps/admin/.env`**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Step 4: Install and commit**
```bash
cd apps/admin && pnpm install && cd ../..
git add apps/admin
git commit -m "chore(admin): scaffold Vite + React TS app"
```

---

## Task 7: Set up Tailwind CSS v4 in both apps

Tailwind v4 uses a CSS-first config (no `tailwind.config.js`).

**Step 1: Install Tailwind in both apps**
```bash
cd apps/web && pnpm add -D tailwindcss @tailwindcss/vite && cd ../..
cd apps/admin && pnpm add -D tailwindcss @tailwindcss/vite && cd ../..
```

**Step 2: Add Tailwind Vite plugin to `apps/web/vite.config.ts`**
```typescript
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // ...rest
});
```
Do the same in `apps/admin/vite.config.ts`.

**Step 3: Replace `apps/web/src/index.css`**
```css
@import "tailwindcss";

@theme {
  --color-gold: #eeb149;
  --color-gold-dark: #ca832a;
  --color-bg: #000000;
  --color-bg-soft: #111111;
  --color-bg-card: #181818;
  --color-border: #2e2e2e;
  --color-text: #e5e5e5;
  --color-muted: #777777;
  --font-sora: 'Sora', sans-serif;
}
```

Do the same in `apps/admin/src/index.css`.

**Step 4: Add Sora font to `apps/web/index.html` and `apps/admin/index.html`**
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
```

**Step 5: Commit**
```bash
git add apps/web apps/admin
git commit -m "chore: add Tailwind CSS v4 to both apps"
```

---

## Task 8: Create `packages/ui` with shadcn

**Step 1: Create `packages/ui/package.json`**
```json
{
  "name": "@dpt/ui",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./globals.css": "./src/globals.css"
  },
  "dependencies": {
    "@dpt/types": "workspace:*",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.3.0",
    "lucide-react": "^0.511.0",
    "framer-motion": "^12.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "react": "^19.0.0",
    "typescript": "^5.8.0"
  },
  "peerDependencies": {
    "react": "^19.0.0"
  }
}
```

**Step 2: Create `packages/ui/src/lib/utils.ts`**
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Step 3: Create `packages/ui/src/lib/tiers.ts`**
```typescript
import type { Tier, TierLabel } from '@dpt/types';

export const TIERS: Tier[] = [
  { label: 'LEGEND', min: 0.75, color: '#FFD700' },
  { label: 'ELITE',  min: 0.50, color: '#C0C0C0' },
  { label: 'PRO',    min: 0.25, color: '#CD7F32' },
  { label: 'ROOKIE', min: 0,    color: '#ea785e' },
];

export function getTier(score: number, maxScore: number): Tier {
  const ratio = maxScore > 0 ? score / maxScore : 0;
  return TIERS.find((t) => ratio >= t.min) ?? TIERS[3];
}

export function getTierMinPoints(tier: TierLabel, maxScore: number): number {
  const t = TIERS.find((t) => t.label === tier);
  return t ? Math.floor(t.min * maxScore) : 0;
}
```

**Write and run a test for `getTier` before moving on:**

Create `packages/ui/src/lib/tiers.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { getTier } from './tiers';

describe('getTier', () => {
  it('returns LEGEND for score at 75%+ of max', () => {
    expect(getTier(1500, 2000).label).toBe('LEGEND');
  });
  it('returns ELITE for score between 50–75%', () => {
    expect(getTier(1000, 2000).label).toBe('ELITE');
  });
  it('returns PRO for score between 25–50%', () => {
    expect(getTier(500, 2000).label).toBe('PRO');
  });
  it('returns ROOKIE for score below 25%', () => {
    expect(getTier(100, 2000).label).toBe('ROOKIE');
  });
  it('handles zero max score gracefully', () => {
    expect(getTier(0, 0).label).toBe('ROOKIE');
  });
});
```

Add vitest to `packages/ui/package.json` devDependencies and run:
```bash
cd packages/ui && pnpm add -D vitest && pnpm vitest run
```
Expected: all 5 tests PASS.

**Step 4: Create `packages/ui/src/components/TierBadge.tsx`**
```tsx
import { cn } from '../lib/utils';
import type { Tier } from '@dpt/types';

interface TierBadgeProps {
  tier: Tier;
  className?: string;
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  return (
    <span
      className={cn('text-[10px] font-extrabold tracking-widest uppercase opacity-60', className)}
      style={{ color: tier.color }}
    >
      {tier.label}
    </span>
  );
}
```

**Step 5: Create `packages/ui/src/components/PlayerCard.tsx`**
```tsx
import { cn } from '../lib/utils';
import { TierBadge } from './TierBadge';
import type { Player, Tier } from '@dpt/types';

const AVATAR_COLOR = '#ca832a';
const MEDAL_COLORS = ['#d4af37', '#c0c0c0', '#cd7f32'];

interface PlayerCardProps {
  player: Player;
  rank: number;
  tier: Tier;
  flash?: 'up' | 'down' | null;
  className?: string;
}

export function PlayerCard({ player, rank, tier, flash, className }: PlayerCardProps) {
  const isTop3 = rank <= 3;
  const medalColor = isTop3 ? MEDAL_COLORS[rank - 1] : undefined;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-full border px-3 py-2 transition-all duration-300',
        className
      )}
      style={{
        background: isTop3
          ? `linear-gradient(90deg, ${medalColor}0d, #111)`
          : '#111111',
        borderColor: isTop3
          ? `${medalColor}44`
          : flash === 'up'
          ? '#22d3ee44'
          : flash === 'down'
          ? '#f8717144'
          : '#2e2e2e',
      }}
    >
      <div
        className="w-8 shrink-0 text-center font-black text-sm"
        style={{ color: isTop3 ? medalColor : '#ca832a' }}
      >
        {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
      </div>

      <div
        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-black shrink-0"
        style={{ background: AVATAR_COLOR }}
      >
        {player.name[0].toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate text-[#e5e5e5]">{player.name}</div>
        <TierBadge tier={tier} />
      </div>

      <div
        className="font-black text-base text-right min-w-[65px]"
        style={{ color: flash === 'up' ? '#4ade80' : flash === 'down' ? '#f87171' : tier.color }}
      >
        {player.total_points.toLocaleString()}
        <span className="text-xs text-[#475569] ml-1">pts</span>
      </div>
    </div>
  );
}
```

**Step 6: Create `packages/ui/src/components/TournamentCard.tsx`**
```tsx
import { cn } from '../lib/utils';
import type { Tournament } from '@dpt/types';

const STATUS_STYLES: Record<Tournament['status'], string> = {
  upcoming: 'bg-blue-900/30 text-blue-300 border-blue-700',
  ongoing: 'bg-green-900/30 text-green-300 border-green-700',
  completed: 'bg-zinc-800 text-zinc-400 border-zinc-700',
};

interface TournamentCardProps {
  tournament: Tournament;
  onClick?: () => void;
  className?: string;
}

export function TournamentCard({ tournament, onClick, className }: TournamentCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl border border-[#2e2e2e] bg-[#111] p-4 cursor-pointer hover:border-[#eeb149]/40 transition-colors',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-[#e5e5e5]">{tournament.name}</h3>
        <span
          className={cn(
            'text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0',
            STATUS_STYLES[tournament.status]
          )}
        >
          {tournament.status.toUpperCase()}
        </span>
      </div>
      <p className="text-sm text-[#777] mt-1">{tournament.venue}</p>
      <p className="text-xs text-[#555] mt-2">
        {new Date(tournament.date).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </p>
      <div className="flex gap-2 mt-3">
        <span className="text-xs bg-[#222] border border-[#2e2e2e] rounded px-2 py-0.5 text-[#777]">
          {tournament.bracket_format}
        </span>
        <span className="text-xs bg-[#222] border border-[#2e2e2e] rounded px-2 py-0.5 text-[#777]">
          {tournament.tournament_type}
        </span>
      </div>
    </div>
  );
}
```

**Step 7: Create `packages/ui/src/components/Podium.tsx`**
```tsx
import type { Player, Tier } from '@dpt/types';

const MEDAL = ['#d4af37', '#c0c0c0', '#cd7f32'];
const HEIGHTS = [138, 100, 82];
const AVATAR_SIZES = [62, 48, 42];

interface PodiumProps {
  top3: [Player | undefined, Player | undefined, Player | undefined];
  tiers: [Tier | undefined, Tier | undefined, Tier | undefined];
}

export function Podium({ top3, tiers }: PodiumProps) {
  // Podium order: 2nd (left), 1st (center), 3rd (right)
  const order = [1, 0, 2] as const;

  return (
    <div className="flex items-end justify-center gap-2.5 max-w-[460px] mx-auto px-4 pb-8">
      {order.map((rankIdx, colIdx) => {
        const player = top3[rankIdx];
        if (!player) return <div key={colIdx} className="flex-1" />;
        const isCenter = colIdx === 1;

        return (
          <div key={player.id} className="flex-1 flex flex-col items-center gap-1.5">
            {isCenter && <div className="text-5xl">👑</div>}
            <div
              className="rounded-full flex items-center justify-center font-bold text-black"
              style={{
                width: AVATAR_SIZES[rankIdx],
                height: AVATAR_SIZES[rankIdx],
                background: '#ca832a',
                fontSize: AVATAR_SIZES[rankIdx] * 0.5,
                boxShadow: `0 0 18px ${MEDAL[rankIdx]}60`,
              }}
            >
              {player.name[0].toUpperCase()}
            </div>
            <div className="font-black text-sm text-white text-center max-w-[80px] truncate">
              {player.name}
            </div>
            <div className="font-semibold text-base" style={{ color: MEDAL[rankIdx] }}>
              {player.total_points.toLocaleString()}
            </div>
            <div
              className="w-full flex items-center justify-center text-3xl font-black rounded-[20px_4px_20px_4px]"
              style={{
                height: HEIGHTS[rankIdx],
                background: `linear-gradient(200deg, ${MEDAL[rankIdx]}70, ${MEDAL[rankIdx]}0a)`,
                border: `2px solid ${MEDAL[rankIdx]}90`,
                color: MEDAL[rankIdx],
              }}
            >
              #{rankIdx + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

**Step 8: Create `packages/ui/src/components/AnnouncementCard.tsx`**
```tsx
import { cn } from '../lib/utils';
import type { Announcement } from '@dpt/types';

const TYPE_STYLES: Record<Announcement['type'], string> = {
  general: 'border-[#2e2e2e] bg-[#111]',
  tournament: 'border-[#eeb149]/30 bg-[#eeb149]/5',
  rules: 'border-blue-800/40 bg-blue-900/10',
  rewards: 'border-green-800/40 bg-green-900/10',
};

interface AnnouncementCardProps {
  announcement: Announcement;
  className?: string;
}

export function AnnouncementCard({ announcement, className }: AnnouncementCardProps) {
  return (
    <div className={cn('rounded-2xl border p-4', TYPE_STYLES[announcement.type], className)}>
      <h3 className="font-bold text-[#e5e5e5] mb-1">{announcement.title}</h3>
      <p className="text-sm text-[#999] whitespace-pre-wrap">{announcement.content}</p>
      <p className="text-xs text-[#555] mt-3">
        {new Date(announcement.published_at).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </p>
    </div>
  );
}
```

**Step 9: Create `packages/ui/src/index.ts`**
```typescript
export { TierBadge } from './components/TierBadge';
export { PlayerCard } from './components/PlayerCard';
export { TournamentCard } from './components/TournamentCard';
export { Podium } from './components/Podium';
export { AnnouncementCard } from './components/AnnouncementCard';
export { cn } from './lib/utils';
export { getTier, getTierMinPoints, TIERS } from './lib/tiers';
```

**Step 10: Install packages/ui deps and run tests**
```bash
cd packages/ui && pnpm install && pnpm vitest run && cd ../..
```

**Step 11: Commit**
```bash
git add packages/ui
git commit -m "feat(ui): add shared component library with TierBadge, PlayerCard, Podium, etc."
```

---

## Task 9: Build `apps/web` — App shell

**Step 1: Delete Vite boilerplate**
```bash
rm apps/web/src/App.css apps/web/src/App.tsx apps/web/src/assets/react.svg apps/web/src/main.css
```

**Step 2: Create `apps/web/src/main.tsx`**
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

**Step 3: Create `apps/web/src/App.tsx`**
```tsx
import { Routes, Route } from 'react-router';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { RankingsPage } from './pages/RankingsPage';
import { TournamentsPage } from './pages/TournamentsPage';
import { TournamentPage } from './pages/TournamentPage';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="rankings" element={<RankingsPage />} />
        <Route path="tournaments" element={<TournamentsPage />} />
        <Route path="tournaments/:id" element={<TournamentPage />} />
      </Route>
    </Routes>
  );
}
```

**Step 4: Create `apps/web/src/components/Layout.tsx`**
```tsx
import { Outlet, NavLink } from 'react-router';
import logo from '../assets/logo.png';

export function Layout() {
  return (
    <div className="min-h-screen text-[#e5e5e5]" style={{ background: 'radial-gradient(circle at top, rgba(238,177,73,0.12) 0%, transparent 35%), linear-gradient(180deg, #000 0%, #0a0a0a 100%)' }}>
      <header className="sticky top-0 z-50 backdrop-blur border-b border-[#2e2e2e] bg-black/80">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <NavLink to="/">
            <img src={logo} alt="DPT" className="h-8 w-auto" />
          </NavLink>
          <nav className="flex gap-1">
            {[
              { to: '/', label: 'Home' },
              { to: '/rankings', label: 'Rankings' },
              { to: '/tournaments', label: 'Tournaments' },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-[#eeb149]/10 text-[#eeb149]' : 'text-[#777] hover:text-[#e5e5e5]'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
```

**Step 5: Copy logo asset from old location**
```bash
cp /path/to/old/logo.png apps/web/src/assets/logo.png
```
(The old assets are still in git history — `git show HEAD~1:src/assets/logo.png > apps/web/src/assets/logo.png` if needed.)

**Step 6: Stub out the 4 pages so the app compiles** — create empty placeholder components:

`apps/web/src/pages/HomePage.tsx`, `RankingsPage.tsx`, `TournamentsPage.tsx`, `TournamentPage.tsx` — each just `export function XPage() { return <div>Coming soon</div>; }`.

**Step 7: Run dev server and confirm navigation works**
```bash
pnpm dev --filter @dpt/web
```
Open http://localhost:5173. Nav links should render without errors.

**Step 8: Commit**
```bash
git add apps/web
git commit -m "feat(web): add app shell with router and nav layout"
```

---

## Task 10: Build `apps/web` — Rankings page

**Files:**
- Modify: `apps/web/src/pages/RankingsPage.tsx`

**Step 1: Write `RankingsPage.tsx`**
```tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPlayers, subscribeToPlayers } from '@dpt/db';
import { PlayerCard, Podium, getTier, TIERS } from '@dpt/ui';
import type { Player } from '@dpt/types';

const TIER_LABELS = ['ALL', 'LEGEND', 'ELITE', 'PRO', 'ROOKIE'] as const;

export function RankingsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState<string>('ALL');
  const [flash, setFlash] = useState<Record<string, 'up' | 'down' | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlayers().then((data) => { setPlayers(data); setLoading(false); });

    const channel = subscribeToPlayers((updated) => {
      setPlayers((prev) => {
        const prevMap = Object.fromEntries(prev.map((p) => [p.id, p.total_points]));
        const flashes: Record<string, 'up' | 'down'> = {};
        updated.forEach((p) => {
          const old = prevMap[p.id];
          if (old !== undefined && old !== p.total_points) {
            flashes[p.id] = p.total_points > old ? 'up' : 'down';
          }
        });
        if (Object.keys(flashes).length) {
          setFlash((f) => ({ ...f, ...flashes }));
          setTimeout(() => setFlash((f) => {
            const next = { ...f };
            Object.keys(flashes).forEach((id) => { next[id] = null; });
            return next;
          }), 1400);
        }
        return updated;
      });
    });

    return () => { channel.unsubscribe(); };
  }, []);

  const maxScore = Math.max(...players.map((p) => p.total_points), 1);
  const top3 = players.slice(0, 3) as [Player?, Player?, Player?];

  const displayed = players.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const tier = getTier(p.total_points, maxScore);
    const matchTier = filterTier === 'ALL' || tier.label === filterTier;
    return matchSearch && matchTier;
  });

  if (loading) {
    return <div className="text-center text-[#777] py-20">Loading rankings…</div>;
  }

  return (
    <div>
      <h1 className="font-sora text-2xl font-black text-[#eeb149] text-center mb-6">
        Delta Padel Tour — Season 2 Leaderboard
      </h1>

      <Podium
        top3={[top3[0], top3[1], top3[2]]}
        tiers={top3.map((p) => (p ? getTier(p.total_points, maxScore) : undefined)) as any}
      />

      <div className="space-y-3 mt-6">
        <input
          placeholder="Search players…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-black border border-[#2e2e2e] rounded-2xl px-4 py-2.5 text-[#e5e5e5] outline-none focus:border-[#eeb149]/40 transition-colors"
        />

        <div className="flex gap-1.5 flex-wrap items-center">
          {TIER_LABELS.map((t) => (
            <button
              key={t}
              onClick={() => setFilterTier(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filterTier === t
                  ? 'border-[#5f9ca5] text-[#e8c200] bg-black/20'
                  : 'border-[#8a8a8a] text-white'
              }`}
            >
              {t}
            </button>
          ))}
          <span className="ml-auto text-sm text-[#ca832a]">{displayed.length} players</span>
        </div>

        <AnimatePresence>
          {displayed.map((player, i) => {
            const rank = players.indexOf(player) + 1;
            const tier = getTier(player.total_points, maxScore);
            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <PlayerCard
                  player={player}
                  rank={rank}
                  tier={tier}
                  flash={flash[player.id]}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {displayed.length === 0 && (
          <p className="text-center text-[#555] py-10">No players found</p>
        )}
      </div>

      {/* Tier Legend */}
      <div className="flex flex-wrap gap-3 justify-center mt-8 p-4 bg-black border border-[#2e2e2e] rounded-xl">
        {TIERS.map((t) => (
          <div key={t.label} className="flex items-center gap-1.5 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ background: t.color }} />
            <span className="font-bold" style={{ color: t.color }}>{t.label}</span>
            <span className="text-white">{Math.round(t.min * 100)}%+</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Verify in browser**
```bash
pnpm dev --filter @dpt/web
```
Navigate to `/rankings`. Confirm players load, search works, tier filter works, podium shows.

**Step 3: Commit**
```bash
git add apps/web/src/pages/RankingsPage.tsx
git commit -m "feat(web): add Rankings page with realtime and Framer Motion"
```

---

## Task 11: Build `apps/web` — Home page

**Files:**
- Modify: `apps/web/src/pages/HomePage.tsx`

```tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { getAnnouncements, getTournaments } from '@dpt/db';
import { AnnouncementCard, TournamentCard } from '@dpt/ui';
import type { Announcement, Tournament } from '@dpt/types';
import logo from '../assets/logo.png';
import poster from '../assets/poster.png';

export function HomePage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [upcoming, setUpcoming] = useState<Tournament[]>([]);

  useEffect(() => {
    getAnnouncements().then(setAnnouncements);
    getTournaments().then((all) =>
      setUpcoming(all.filter((t) => t.status === 'upcoming').slice(0, 3))
    );
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center gap-6"
      >
        <img src={logo} alt="DPT" className="w-[clamp(80px,15vw,140px)] h-auto" />
        <img
          src={poster}
          alt="Sponsors"
          className="w-full max-w-3xl rounded-2xl border border-[#eeb149] p-2 shadow-2xl"
        />
        <h1 className="font-sora text-[clamp(1rem,3vw,2rem)] font-black text-[#eeb149]" style={{ textShadow: '1px 1px 2px black, 0 0 5px gold' }}>
          Delta Padel Tour<br />Season 2
        </h1>
        <div className="flex gap-3">
          <Link to="/rankings" className="px-5 py-2 bg-[#eeb149] text-black font-bold rounded-full text-sm hover:bg-[#ca832a] transition-colors">
            View Rankings
          </Link>
          <Link to="/tournaments" className="px-5 py-2 border border-[#eeb149] text-[#eeb149] font-bold rounded-full text-sm hover:bg-[#eeb149]/10 transition-colors">
            Tournaments
          </Link>
        </div>
      </motion.section>

      {/* Upcoming Tournaments */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="font-bold text-lg text-[#eeb149] mb-4">Upcoming Tournaments</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((t) => (
              <Link key={t.id} to={`/tournaments/${t.id}`}>
                <TournamentCard tournament={t} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <section>
          <h2 className="font-bold text-lg text-[#eeb149] mb-4">Announcements</h2>
          <div className="space-y-4">
            {announcements.map((a) => (
              <AnnouncementCard key={a.id} announcement={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

**Commit:**
```bash
git add apps/web/src/pages/HomePage.tsx
git commit -m "feat(web): add Home page with announcements and upcoming tournaments"
```

---

## Task 12: Build `apps/web` — Tournaments list & bracket pages

**Tournaments list (`apps/web/src/pages/TournamentsPage.tsx`):**
```tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { getTournaments } from '@dpt/db';
import { TournamentCard } from '@dpt/ui';
import type { Tournament } from '@dpt/types';

export function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => { getTournaments().then(setTournaments); }, []);

  const grouped = {
    ongoing: tournaments.filter((t) => t.status === 'ongoing'),
    upcoming: tournaments.filter((t) => t.status === 'upcoming'),
    completed: tournaments.filter((t) => t.status === 'completed'),
  };

  return (
    <div className="space-y-10">
      <h1 className="font-sora font-black text-2xl text-[#eeb149]">Tournaments</h1>
      {(['ongoing', 'upcoming', 'completed'] as const).map((status) =>
        grouped[status].length > 0 ? (
          <section key={status}>
            <h2 className="font-bold text-[#777] uppercase tracking-widest text-xs mb-3">{status}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {grouped[status].map((t) => (
                <Link key={t.id} to={`/tournaments/${t.id}`}>
                  <TournamentCard tournament={t} />
                </Link>
              ))}
            </div>
          </section>
        ) : null
      )}
      {tournaments.length === 0 && (
        <p className="text-[#555] text-center py-16">No tournaments yet.</p>
      )}
    </div>
  );
}
```

**Tournament bracket page (`apps/web/src/pages/TournamentPage.tsx`):**
```tsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { getTournament, getTournamentParticipants, getMatches, subscribeToMatches } from '@dpt/db';
import { BracketView } from '../components/BracketView';
import type { Tournament, TournamentParticipantWithDetails, Match } from '@dpt/types';

export function TournamentPage() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<TournamentParticipantWithDetails[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getTournament(id).then(setTournament),
      getTournamentParticipants(id).then(setParticipants),
      getMatches(id).then(setMatches),
    ]);

    const channel = subscribeToMatches(id, setMatches);
    return () => { channel.unsubscribe(); };
  }, [id]);

  if (!tournament) return <div className="text-[#777] text-center py-20">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sora font-black text-2xl text-[#eeb149]">{tournament.name}</h1>
        <p className="text-[#777] text-sm">{tournament.venue} · {new Date(tournament.date).toLocaleDateString()}</p>
      </div>
      <BracketView
        tournament={tournament}
        participants={participants}
        matches={matches}
      />
    </div>
  );
}
```

**Create `apps/web/src/components/BracketView.tsx`** — a read-only visual bracket:
```tsx
import type { Tournament, TournamentParticipantWithDetails, Match } from '@dpt/types';

interface BracketViewProps {
  tournament: Tournament;
  participants: TournamentParticipantWithDetails[];
  matches: Match[];
}

function getParticipantLabel(p?: TournamentParticipantWithDetails): string {
  if (!p) return 'TBD';
  if (p.player) return p.player.name;
  if (p.team) return p.team.name;
  return 'TBD';
}

export function BracketView({ tournament, participants, matches }: BracketViewProps) {
  const totalRounds = tournament.bracket_format === 'R16' ? 4 : 3;
  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);
  const pMap = Object.fromEntries(participants.map((p) => [p.id, p]));

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-8 min-w-max">
        {rounds.map((round) => {
          const roundMatches = matches.filter((m) => m.round === round).sort((a, b) => a.position - b.position);
          return (
            <div key={round} className="flex flex-col gap-4 justify-around">
              <p className="text-xs text-[#555] font-bold uppercase tracking-widest text-center mb-2">
                {round === totalRounds ? 'Final' : round === totalRounds - 1 ? 'Semi-Final' : round === 1 && tournament.bracket_format === 'R16' ? 'Round of 16' : 'Quarter-Final'}
              </p>
              {roundMatches.map((match) => {
                const p1 = pMap[match.participant1_id ?? ''];
                const p2 = pMap[match.participant2_id ?? ''];
                const winnerId = match.winner_id;
                return (
                  <div key={match.id} className="border border-[#2e2e2e] rounded-xl overflow-hidden w-48 bg-[#111]">
                    {[{ p: p1, score: match.score1 }, { p: p2, score: match.score2 }].map(({ p, score }, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between px-3 py-2 text-sm border-b border-[#2e2e2e] last:border-0 ${
                          winnerId && p?.id === winnerId ? 'text-[#eeb149] font-bold' : 'text-[#777]'
                        }`}
                      >
                        <span className="truncate">{getParticipantLabel(p)}</span>
                        <span className="ml-2 font-mono shrink-0">{score ?? '-'}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Commit:**
```bash
git add apps/web/src/pages/TournamentsPage.tsx apps/web/src/pages/TournamentPage.tsx apps/web/src/components/BracketView.tsx
git commit -m "feat(web): add Tournaments list and bracket view pages"
```

---

## Task 13: Scaffold `apps/admin` — App shell & auth

**Step 1: Clean boilerplate** (same as Task 9 Step 1 but for admin)

**Step 2: Create `apps/admin/src/lib/auth.ts`**
```typescript
import { supabase } from '@dpt/db';

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export function onAuthChange(cb: (session: boolean) => void) {
  return supabase.auth.onAuthStateChange((_, session) => {
    cb(!!session);
  });
}
```

**Step 3: Create `apps/admin/src/main.tsx`** — same structure as web but uses `HashRouter` (simpler for admin SPA)
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
```

**Step 4: Create `apps/admin/src/App.tsx`**
```tsx
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { onAuthChange } from './lib/auth';
import { LoginPage } from './pages/LoginPage';
import { AdminLayout } from './components/AdminLayout';
import { RankingsPage } from './pages/RankingsPage';
import { PlayersPage } from './pages/PlayersPage';
import { TeamsPage } from './pages/TeamsPage';
import { TournamentsPage } from './pages/TournamentsPage';
import { CreateTournamentPage } from './pages/CreateTournamentPage';
import { TournamentManagerPage } from './pages/TournamentManagerPage';

export function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: { subscription } } = onAuthChange(setAuthed);
    return () => subscription.unsubscribe();
  }, []);

  if (authed === null) return null; // waiting for session check

  return (
    <Routes>
      <Route path="/login" element={authed ? <Navigate to="/" /> : <LoginPage />} />
      {authed ? (
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/rankings" />} />
          <Route path="rankings" element={<RankingsPage />} />
          <Route path="players" element={<PlayersPage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="tournaments" element={<TournamentsPage />} />
          <Route path="tournaments/new" element={<CreateTournamentPage />} />
          <Route path="tournaments/:id" element={<TournamentManagerPage />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" />} />
      )}
    </Routes>
  );
}
```

**Step 5: Create `apps/admin/src/pages/LoginPage.tsx`**
```tsx
import { useState } from 'react';
import { signIn } from '../lib/auth';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#000] flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 border border-[#2e2e2e] bg-[#111] rounded-2xl p-8">
        <h1 className="font-bold text-xl text-[#eeb149]">DPT Admin</h1>
        <input
          type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Email" required
          className="w-full bg-[#000] border border-[#2e2e2e] rounded-xl px-4 py-2.5 text-[#e5e5e5] outline-none focus:border-[#eeb149]/40"
        />
        <input
          type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Password" required
          className="w-full bg-[#000] border border-[#2e2e2e] rounded-xl px-4 py-2.5 text-[#e5e5e5] outline-none focus:border-[#eeb149]/40"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit" disabled={loading}
          className="w-full bg-[#eeb149] text-black font-bold rounded-xl py-2.5 hover:bg-[#ca832a] transition-colors disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
```

**Step 6: Create `apps/admin/src/components/AdminLayout.tsx`**
```tsx
import { Outlet, NavLink } from 'react-router';
import { signOut } from '../lib/auth';

const NAV = [
  { to: '/rankings', label: 'Rankings' },
  { to: '/players', label: 'Players' },
  { to: '/teams', label: 'Teams' },
  { to: '/tournaments', label: 'Tournaments' },
];

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#000] text-[#e5e5e5] flex">
      <aside className="w-48 shrink-0 border-r border-[#2e2e2e] bg-[#0a0a0a] flex flex-col">
        <div className="p-4 border-b border-[#2e2e2e]">
          <span className="font-black text-[#eeb149]">DPT Admin</span>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-[#eeb149]/10 text-[#eeb149]' : 'text-[#777] hover:text-[#e5e5e5]'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-[#2e2e2e]">
          <button
            onClick={signOut}
            className="w-full text-left text-xs text-[#555] hover:text-red-400 transition-colors px-3 py-2"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
```

**Step 7: Stub remaining admin pages** — create empty components for `RankingsPage`, `PlayersPage`, `TeamsPage`, `TournamentsPage`, `CreateTournamentPage`, `TournamentManagerPage`.

**Step 8: Verify admin app compiles and login renders**
```bash
pnpm dev --filter @dpt/admin
```
Open http://localhost:3001. Should show login form.

**Step 9: Commit**
```bash
git add apps/admin
git commit -m "feat(admin): add app shell, auth, and layout"
```

---

## Task 14: Build `apps/admin` — Rankings & Players pages

**Rankings (`apps/admin/src/pages/RankingsPage.tsx`):**
```tsx
import { useState, useEffect } from 'react';
import { getPlayers, updatePlayerPoints } from '@dpt/db';
import { getTier } from '@dpt/ui';
import type { Player } from '@dpt/types';

export function RankingsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => { getPlayers().then(setPlayers); }, []);

  const maxScore = Math.max(...players.map((p) => p.total_points), 1);

  async function save(id: string) {
    const newPoints = edits[id];
    if (newPoints === undefined) return;
    setSaving(id);
    await updatePlayerPoints(id, newPoints);
    setPlayers((prev) => prev.map((p) => p.id === id ? { ...p, total_points: newPoints } : p).sort((a, b) => b.total_points - a.total_points));
    setEdits((e) => { const next = { ...e }; delete next[id]; return next; });
    setSaving(null);
  }

  return (
    <div className="space-y-4">
      <h1 className="font-bold text-xl text-[#eeb149]">Rankings Manager</h1>
      <div className="space-y-2">
        {players.map((player, i) => {
          const tier = getTier(player.total_points, maxScore);
          const editVal = edits[player.id];
          const isDirty = editVal !== undefined;
          return (
            <div key={player.id} className="flex items-center gap-3 bg-[#111] border border-[#2e2e2e] rounded-xl px-4 py-3">
              <span className="text-[#555] w-8 text-sm font-bold">#{i + 1}</span>
              <span className="flex-1 font-medium text-sm">{player.name}</span>
              <span className="text-xs font-bold opacity-60" style={{ color: tier.color }}>{tier.label}</span>
              <input
                type="number"
                value={isDirty ? editVal : player.total_points}
                onChange={(e) => setEdits((ed) => ({ ...ed, [player.id]: Number(e.target.value) }))}
                className="w-24 bg-[#000] border border-[#2e2e2e] rounded-lg px-3 py-1.5 text-right text-sm text-[#e5e5e5] outline-none focus:border-[#eeb149]/40"
              />
              <button
                onClick={() => save(player.id)}
                disabled={!isDirty || saving === player.id}
                className="px-3 py-1.5 text-xs font-bold bg-[#eeb149] text-black rounded-lg disabled:opacity-30 hover:bg-[#ca832a] transition-colors"
              >
                {saving === player.id ? '…' : 'Save'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Players (`apps/admin/src/pages/PlayersPage.tsx`):**
```tsx
import { useState, useEffect } from 'react';
import { getPlayers, upsertPlayer, deletePlayer } from '@dpt/db';
import type { Player } from '@dpt/types';

export function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { getPlayers().then(setPlayers); }, []);

  async function addPlayer() {
    if (!name.trim()) return;
    setSaving(true);
    const created = await upsertPlayer({ id: crypto.randomUUID(), name: name.trim(), total_points: 0 });
    setPlayers((prev) => [...prev, created]);
    setName('');
    setSaving(false);
  }

  async function remove(id: string) {
    await deletePlayer(id);
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-4">
      <h1 className="font-bold text-xl text-[#eeb149]">Players</h1>
      <div className="flex gap-2">
        <input
          value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
          placeholder="Player name"
          className="flex-1 bg-[#000] border border-[#2e2e2e] rounded-xl px-4 py-2.5 text-sm text-[#e5e5e5] outline-none focus:border-[#eeb149]/40"
        />
        <button onClick={addPlayer} disabled={saving || !name.trim()} className="px-4 py-2.5 bg-[#eeb149] text-black font-bold rounded-xl text-sm disabled:opacity-40 hover:bg-[#ca832a] transition-colors">
          Add
        </button>
      </div>
      <div className="space-y-2">
        {players.map((p) => (
          <div key={p.id} className="flex items-center justify-between bg-[#111] border border-[#2e2e2e] rounded-xl px-4 py-3">
            <span className="text-sm">{p.name}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#555]">{p.total_points} pts</span>
              <button onClick={() => remove(p.id)} className="text-xs text-[#555] hover:text-red-400 transition-colors">Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Commit:**
```bash
git add apps/admin/src/pages/RankingsPage.tsx apps/admin/src/pages/PlayersPage.tsx
git commit -m "feat(admin): add Rankings manager and Players management"
```

---

## Task 15: Build `apps/admin` — Teams page

**`apps/admin/src/pages/TeamsPage.tsx`:**
```tsx
import { useState, useEffect } from 'react';
import { getTeams, getPlayers, createTeam, deleteTeam } from '@dpt/db';
import type { Player, TeamWithPlayers } from '@dpt/types';

export function TeamsPage() {
  const [teams, setTeams] = useState<TeamWithPlayers[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState('');
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');

  useEffect(() => {
    getTeams().then(setTeams);
    getPlayers().then(setPlayers);
  }, []);

  async function add() {
    if (!name.trim() || !p1 || !p2 || p1 === p2) return;
    const team = await createTeam(name.trim(), [p1, p2]);
    setTeams((prev) => [...prev, {
      ...team,
      players: players.filter((p) => p.id === p1 || p.id === p2),
    }]);
    setName(''); setP1(''); setP2('');
  }

  async function remove(id: string) {
    await deleteTeam(id);
    setTeams((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-6">
      <h1 className="font-bold text-xl text-[#eeb149]">Teams</h1>
      <div className="border border-[#2e2e2e] bg-[#111] rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold text-sm text-[#777]">Create team</h2>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Team name"
          className="w-full bg-[#000] border border-[#2e2e2e] rounded-xl px-4 py-2 text-sm text-[#e5e5e5] outline-none focus:border-[#eeb149]/40" />
        <div className="flex gap-2">
          {[{ val: p1, set: setP1, label: 'Player 1' }, { val: p2, set: setP2, label: 'Player 2' }].map(({ val, set, label }) => (
            <select key={label} value={val} onChange={(e) => set(e.target.value)}
              className="flex-1 bg-[#000] border border-[#2e2e2e] rounded-xl px-3 py-2 text-sm text-[#e5e5e5] outline-none">
              <option value="">{label}</option>
              {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          ))}
        </div>
        <button onClick={add} disabled={!name.trim() || !p1 || !p2 || p1 === p2}
          className="px-4 py-2 bg-[#eeb149] text-black font-bold rounded-xl text-sm disabled:opacity-40">
          Create Team
        </button>
      </div>
      <div className="space-y-2">
        {teams.map((t) => (
          <div key={t.id} className="flex items-center justify-between bg-[#111] border border-[#2e2e2e] rounded-xl px-4 py-3">
            <div>
              <div className="font-medium text-sm">{t.name}</div>
              <div className="text-xs text-[#555]">{t.players.map((p) => p.name).join(' & ')}</div>
            </div>
            <button onClick={() => remove(t.id)} className="text-xs text-[#555] hover:text-red-400">Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Commit:**
```bash
git add apps/admin/src/pages/TeamsPage.tsx
git commit -m "feat(admin): add Teams management page"
```

---

## Task 16: Build `apps/admin` — Tournament creation & list

**Tournaments list (`apps/admin/src/pages/TournamentsPage.tsx`):**
```tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { getTournaments, updateTournamentStatus } from '@dpt/db';
import { TournamentCard } from '@dpt/ui';
import type { Tournament } from '@dpt/types';

export function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => { getTournaments().then(setTournaments); }, []);

  async function advance(t: Tournament) {
    const next = t.status === 'upcoming' ? 'ongoing' : 'completed';
    await updateTournamentStatus(t.id, next);
    setTournaments((prev) => prev.map((x) => x.id === t.id ? { ...x, status: next } : x));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-xl text-[#eeb149]">Tournaments</h1>
        <Link to="/tournaments/new" className="px-4 py-2 bg-[#eeb149] text-black font-bold rounded-xl text-sm hover:bg-[#ca832a] transition-colors">
          + Create
        </Link>
      </div>
      <div className="space-y-3">
        {tournaments.map((t) => (
          <div key={t.id} className="flex items-center gap-3">
            <Link to={`/tournaments/${t.id}`} className="flex-1">
              <TournamentCard tournament={t} />
            </Link>
            {t.status !== 'completed' && (
              <button onClick={() => advance(t)} className="text-xs text-[#555] hover:text-[#eeb149] border border-[#2e2e2e] rounded-lg px-3 py-2 whitespace-nowrap">
                {t.status === 'upcoming' ? 'Start' : 'Complete'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Create Tournament (`apps/admin/src/pages/CreateTournamentPage.tsx`):**
```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { createTournament } from '@dpt/db';
import type { Venue, BracketFormat, TournamentType } from '@dpt/types';

const VENUES: Venue[] = ['Mansoura Padel Point', 'Ace Town Complex', 'Padel H'];

export function CreateTournamentPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    date: '',
    venue: VENUES[0] as Venue,
    bracket_format: 'QF' as BracketFormat,
    tournament_type: 'individual' as TournamentType,
  });

  function set<K extends keyof typeof form>(key: K, val: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const tournament = await createTournament({ ...form, status: 'upcoming' });
    navigate(`/tournaments/${tournament.id}`);
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="font-bold text-xl text-[#eeb149]">Create Tournament</h1>
      <form onSubmit={submit} className="space-y-4">
        {[
          { label: 'Name', key: 'name', type: 'text', placeholder: 'e.g. DPT Open #3' },
          { label: 'Date', key: 'date', type: 'date', placeholder: '' },
        ].map(({ label, key, type, placeholder }) => (
          <div key={key}>
            <label className="block text-xs text-[#777] mb-1">{label}</label>
            <input type={type} value={form[key as 'name' | 'date']} placeholder={placeholder}
              onChange={(e) => set(key as 'name' | 'date', e.target.value)} required
              className="w-full bg-[#000] border border-[#2e2e2e] rounded-xl px-4 py-2.5 text-sm text-[#e5e5e5] outline-none focus:border-[#eeb149]/40" />
          </div>
        ))}

        <div>
          <label className="block text-xs text-[#777] mb-1">Venue</label>
          <select value={form.venue} onChange={(e) => set('venue', e.target.value as Venue)}
            className="w-full bg-[#000] border border-[#2e2e2e] rounded-xl px-4 py-2.5 text-sm text-[#e5e5e5] outline-none">
            {VENUES.map((v) => <option key={v}>{v}</option>)}
          </select>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs text-[#777] mb-1">Bracket</label>
            <select value={form.bracket_format} onChange={(e) => set('bracket_format', e.target.value as BracketFormat)}
              className="w-full bg-[#000] border border-[#2e2e2e] rounded-xl px-4 py-2.5 text-sm text-[#e5e5e5] outline-none">
              <option value="QF">Quarter Finals (8)</option>
              <option value="R16">Round of 16 (16)</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-[#777] mb-1">Type</label>
            <select value={form.tournament_type} onChange={(e) => set('tournament_type', e.target.value as TournamentType)}
              className="w-full bg-[#000] border border-[#2e2e2e] rounded-xl px-4 py-2.5 text-sm text-[#e5e5e5] outline-none">
              <option value="individual">Individual</option>
              <option value="team">Team</option>
            </select>
          </div>
        </div>

        <button type="submit" className="w-full bg-[#eeb149] text-black font-bold rounded-xl py-3 hover:bg-[#ca832a] transition-colors">
          Create Tournament
        </button>
      </form>
    </div>
  );
}
```

**Commit:**
```bash
git add apps/admin/src/pages/TournamentsPage.tsx apps/admin/src/pages/CreateTournamentPage.tsx
git commit -m "feat(admin): add tournament list and create tournament pages"
```

---

## Task 17: Build `apps/admin` — Tournament Manager

This is the most complex page. It has three tabs: **Participants**, **Bracket**, **Points**.

**`apps/admin/src/pages/TournamentManagerPage.tsx`:**
```tsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import {
  getTournament, getTournamentParticipants, getMatches, getPlayers, getTeams,
  addParticipant, upsertMatch, saveMatchResult, awardPoints,
} from '@dpt/db';
import type {
  Tournament, TournamentParticipantWithDetails, Match, Player, TeamWithPlayers,
} from '@dpt/types';

type Tab = 'participants' | 'bracket' | 'points';

export function TournamentManagerPage() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<TournamentParticipantWithDetails[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<TeamWithPlayers[]>([]);
  const [tab, setTab] = useState<Tab>('participants');
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getTournament(id).then(setTournament),
      getTournamentParticipants(id).then(setParticipants),
      getMatches(id).then(setMatches),
      getPlayers().then(setPlayers),
      getTeams().then(setTeams),
    ]);
  }, [id]);

  const maxSlots = tournament?.bracket_format === 'R16' ? 16 : 8;
  const pMap = Object.fromEntries(participants.map((p) => [p.id, p]));

  function getLabel(p?: TournamentParticipantWithDetails): string {
    if (!p) return 'TBD';
    if (p.player) return p.player.name;
    if (p.team) return p.team.name;
    return 'TBD';
  }

  async function addSelected() {
    if (!selectedId || !id) return;
    const isTeam = teams.some((t) => t.id === selectedId);
    await addParticipant({
      tournament_id: id,
      [isTeam ? 'team_id' : 'player_id']: selectedId,
      bracket_position: participants.length + 1,
    });
    const updated = await getTournamentParticipants(id);
    setParticipants(updated);
    setSelectedId('');
  }

  async function assignBracket(participantId: string, position: number) {
    // update bracket_position via direct supabase call
    const { supabase } = await import('@dpt/db');
    await supabase
      .from('tournament_participants')
      .update({ bracket_position: position })
      .eq('id', participantId);
    const updated = await getTournamentParticipants(id!);
    setParticipants(updated);
  }

  async function recordResult(matchId: string, score1: number, score2: number, winnerId: string) {
    await saveMatchResult(matchId, score1, score2, winnerId);
    const updated = await getMatches(id!);
    setMatches(updated);
  }

  async function savePoints(participantId: string, points: number) {
    await awardPoints(participantId, points);
    const updated = await getTournamentParticipants(id!);
    setParticipants(updated);
  }

  if (!tournament) return <div className="text-[#777]">Loading…</div>;

  const options = tournament.tournament_type === 'team'
    ? teams.map((t) => ({ id: t.id, label: `${t.name} (${t.players.map((p) => p.name).join(' & ')})` }))
    : players.map((p) => ({ id: p.id, label: p.name }));

  const alreadyAdded = new Set([
    ...participants.map((p) => p.player_id).filter(Boolean),
    ...participants.map((p) => p.team_id).filter(Boolean),
  ]);

  const available = options.filter((o) => !alreadyAdded.has(o.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-xl text-[#eeb149]">{tournament.name}</h1>
        <p className="text-sm text-[#555]">{tournament.venue} · {tournament.bracket_format} · {tournament.tournament_type}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#2e2e2e]">
        {(['participants', 'bracket', 'points'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-[#eeb149] text-[#eeb149]' : 'border-transparent text-[#555] hover:text-[#e5e5e5]'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Participants tab */}
      {tab === 'participants' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
              className="flex-1 bg-[#000] border border-[#2e2e2e] rounded-xl px-4 py-2.5 text-sm text-[#e5e5e5] outline-none">
              <option value="">Select {tournament.tournament_type === 'team' ? 'team' : 'player'}…</option>
              {available.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <button onClick={addSelected} disabled={!selectedId || participants.length >= maxSlots}
              className="px-4 py-2.5 bg-[#eeb149] text-black font-bold rounded-xl text-sm disabled:opacity-40">
              Add ({participants.length}/{maxSlots})
            </button>
          </div>
          <div className="space-y-2">
            {participants.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-[#111] border border-[#2e2e2e] rounded-xl px-4 py-3">
                <span className="text-sm">{getLabel(p)}</span>
                <span className="text-xs text-[#555]">Slot {p.bracket_position ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bracket tab */}
      {tab === 'bracket' && (
        <div className="space-y-4">
          <p className="text-sm text-[#777]">Assign participants to bracket slots, then record match results.</p>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: maxSlots }, (_, i) => i + 1).map((slot) => {
              const assigned = participants.find((p) => p.bracket_position === slot);
              return (
                <div key={slot} className="flex items-center gap-2 bg-[#111] border border-[#2e2e2e] rounded-xl px-3 py-2">
                  <span className="text-xs text-[#555] w-6">#{slot}</span>
                  <select
                    value={assigned?.id ?? ''}
                    onChange={(e) => e.target.value && assignBracket(e.target.value, slot)}
                    className="flex-1 bg-transparent text-sm text-[#e5e5e5] outline-none"
                  >
                    <option value="">Empty</option>
                    {participants.map((p) => (
                      <option key={p.id} value={p.id}>{getLabel(p)}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          <h3 className="font-semibold text-[#eeb149] mt-6">Match Results</h3>
          <MatchEditor
            tournament={tournament}
            participants={participants}
            matches={matches}
            pMap={pMap}
            getLabel={getLabel}
            onSave={recordResult}
            onMatchCreated={async () => { const updated = await getMatches(id!); setMatches(updated); }}
            tournamentId={id!}
          />
        </div>
      )}

      {/* Points tab */}
      {tab === 'points' && (
        <PointsEditor participants={participants} getLabel={getLabel} onSave={savePoints} />
      )}
    </div>
  );
}

// Sub-component: MatchEditor
function MatchEditor({ tournament, participants, matches, pMap, getLabel, onSave, onMatchCreated, tournamentId }: {
  tournament: Tournament;
  participants: TournamentParticipantWithDetails[];
  matches: Match[];
  pMap: Record<string, TournamentParticipantWithDetails>;
  getLabel: (p?: TournamentParticipantWithDetails) => string;
  onSave: (matchId: string, s1: number, s2: number, winnerId: string) => Promise<void>;
  onMatchCreated: () => Promise<void>;
  tournamentId: string;
}) {
  const totalRounds = tournament.bracket_format === 'R16' ? 4 : 3;
  const [scores, setScores] = useState<Record<string, { s1: string; s2: string }>>({});

  async function generate() {
    const sorted = [...participants].sort((a, b) => (a.bracket_position ?? 99) - (b.bracket_position ?? 99));
    const matchCount = sorted.length / 2;
    for (let i = 0; i < matchCount; i++) {
      await upsertMatch({
        tournament_id: tournamentId,
        round: 1,
        position: i + 1,
        participant1_id: sorted[i * 2]?.id ?? null,
        participant2_id: sorted[i * 2 + 1]?.id ?? null,
      });
    }
    await onMatchCreated();
  }

  return (
    <div className="space-y-4">
      {matches.length === 0 && (
        <button onClick={generate} className="px-4 py-2 bg-[#222] border border-[#2e2e2e] rounded-xl text-sm text-[#e5e5e5] hover:border-[#eeb149]/40">
          Generate Round 1 matches
        </button>
      )}
      {Array.from({ length: totalRounds }, (_, i) => i + 1).map((round) => {
        const roundMatches = matches.filter((m) => m.round === round);
        if (roundMatches.length === 0) return null;
        return (
          <div key={round}>
            <h4 className="text-xs font-bold text-[#555] uppercase tracking-widest mb-2">Round {round}</h4>
            <div className="space-y-2">
              {roundMatches.map((match) => {
                const p1 = pMap[match.participant1_id ?? ''];
                const p2 = pMap[match.participant2_id ?? ''];
                const key = match.id;
                const s = scores[key] ?? { s1: match.score1?.toString() ?? '', s2: match.score2?.toString() ?? '' };
                return (
                  <div key={match.id} className="bg-[#111] border border-[#2e2e2e] rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="flex-1 truncate">{getLabel(p1)}</span>
                      <input type="number" value={s.s1} onChange={(e) => setScores((sc) => ({ ...sc, [key]: { ...s, s1: e.target.value } }))}
                        className="w-14 bg-[#000] border border-[#2e2e2e] rounded px-2 py-1 text-center text-sm outline-none" />
                      <span className="text-[#555]">vs</span>
                      <input type="number" value={s.s2} onChange={(e) => setScores((sc) => ({ ...sc, [key]: { ...s, s2: e.target.value } }))}
                        className="w-14 bg-[#000] border border-[#2e2e2e] rounded px-2 py-1 text-center text-sm outline-none" />
                      <span className="flex-1 truncate text-right">{getLabel(p2)}</span>
                    </div>
                    {p1 && p2 && (
                      <div className="flex gap-2">
                        {[{ label: getLabel(p1), id: p1.id }, { label: getLabel(p2), id: p2.id }].map(({ label, id }) => (
                          <button key={id}
                            onClick={() => onSave(match.id, Number(s.s1), Number(s.s2), id)}
                            className={`flex-1 text-xs py-1 rounded-lg border transition-colors ${
                              match.winner_id === id
                                ? 'border-[#eeb149] bg-[#eeb149]/10 text-[#eeb149]'
                                : 'border-[#2e2e2e] text-[#555] hover:border-[#eeb149]/40'
                            }`}>
                            {label} wins
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Sub-component: PointsEditor
function PointsEditor({ participants, getLabel, onSave }: {
  participants: TournamentParticipantWithDetails[];
  getLabel: (p?: TournamentParticipantWithDetails) => string;
  onSave: (id: string, pts: number) => Promise<void>;
}) {
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#777]">Assign points to each participant. Saved points are automatically added to player rankings.</p>
      {participants.map((p) => {
        const val = edits[p.id] ?? p.points_awarded.toString();
        return (
          <div key={p.id} className="flex items-center gap-3 bg-[#111] border border-[#2e2e2e] rounded-xl px-4 py-3">
            <span className="flex-1 text-sm">{getLabel(p)}</span>
            <input type="number" value={val} onChange={(e) => setEdits((ed) => ({ ...ed, [p.id]: e.target.value }))}
              className="w-24 bg-[#000] border border-[#2e2e2e] rounded-lg px-3 py-1.5 text-right text-sm text-[#e5e5e5] outline-none" />
            <button onClick={async () => { setSaving(p.id); await onSave(p.id, Number(val)); setSaving(null); }}
              disabled={saving === p.id}
              className="px-3 py-1.5 text-xs font-bold bg-[#eeb149] text-black rounded-lg disabled:opacity-40">
              {saving === p.id ? '…' : 'Save'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

**Commit:**
```bash
git add apps/admin/src/pages/TournamentManagerPage.tsx
git commit -m "feat(admin): add Tournament Manager with participants, bracket, and points tabs"
```

---

## Task 18: Final wiring & `pnpm install`

**Step 1: Run install from root to link all workspace packages**
```bash
pnpm install
```

**Step 2: Verify both apps build**
```bash
pnpm build
```
Expected: both `apps/web` and `apps/admin` build to `dist/` with no TypeScript errors.

**Step 3: Run both dev servers in parallel**
```bash
pnpm dev
```
- Web: http://localhost:5173
- Admin: http://localhost:3001

**Step 4: Smoke test checklist**
- [ ] Web `/rankings` loads players from Supabase
- [ ] Web `/tournaments` lists tournaments
- [ ] Admin `/login` authenticates
- [ ] Admin `/players` add a player → appears in web rankings
- [ ] Admin `/rankings` update a player's points → web rankings update via realtime
- [ ] Admin `/tournaments/new` creates tournament → appears in web
- [ ] Admin `/tournaments/:id` adds participants, records match results, awards points → player rankings update

**Step 5: Commit**
```bash
git add -A
git commit -m "chore: final wiring, all workspace packages linked and verified"
```

---

## Task 19: Vercel deployment config

**Step 1: Create `apps/web/vercel.json`**
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**Step 2: Create `apps/admin/vercel.json`** — same content

**Step 3: Add `.env` files to `.gitignore`**
Confirm `.gitignore` at repo root includes:
```
.env
.env.local
apps/*/.env
apps/*/.env.local
```

**Step 4: Deploy instructions**
- In Vercel: import the repo, set **Root Directory** to `apps/web` for the web deployment and `apps/admin` for the admin deployment
- Set environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Build command: `pnpm build` (Vercel auto-detects Turborepo)

**Step 5: Commit**
```bash
git add apps/web/vercel.json apps/admin/vercel.json .gitignore
git commit -m "chore: add Vercel deployment config for both apps"
```

---

## Asset migration note

The existing assets in the old `src/assets/` directory are still accessible from git history. To recover them:
```bash
git show HEAD~10:src/assets/logo.png > apps/web/src/assets/logo.png
git show HEAD~10:src/assets/squarelogo.png > apps/web/src/assets/squarelogo.png
git show HEAD~10:src/assets/poster.png > apps/web/src/assets/poster.png
```

---

## Environment variables reference

Both apps need these set in `.env` (local) and Vercel environment variables (production):

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
