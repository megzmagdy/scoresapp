# Delta Padel Tour (DPT)

A full-stack monorepo for the **Delta Padel Tour** — a competitive padel league management platform. It includes a public-facing website for players and fans, an admin dashboard for organizers, and a shared layer of components, types, and database utilities.

---

## Table of Contents

- [Overview](#overview)
- [Monorepo Structure](#monorepo-structure)
- [Tech Stack](#tech-stack)
- [Apps](#apps)
  - [Public Website (`apps/web`)](#public-website-appsweb)
  - [Admin Dashboard (`apps/admin`)](#admin-dashboard-appsadmin)
- [Packages](#packages)
  - [`@dpt/ui`](#dptui)
  - [`@dpt/db`](#dptdb)
  - [`@dpt/types`](#dpttypes)
- [Data Model](#data-model)
- [Player Tiers](#player-tiers)
- [Realtime](#realtime)
- [Security](#security)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Sponsors](#sponsors)

---

## Overview

DPT was rebuilt from a single-file JSX leaderboard into a TypeScript monorepo with:

- A **public website** — tournament brackets, live rankings, announcements, and sponsor info
- An **admin panel** — full tournament lifecycle management, from player registration to bracket scoring and point awarding
- A **Supabase backend** — Postgres database, Row-Level Security, Auth, and Realtime subscriptions

---

## Monorepo Structure

```
scoresapp/
├── apps/
│   ├── web/               # Public site — Vite + React + TypeScript
│   └── admin/             # Admin panel — Vite + React + TypeScript
├── packages/
│   ├── ui/                # Shared shadcn/ui components + design tokens
│   ├── db/                # Supabase client + all query functions + realtime
│   └── types/             # Shared TypeScript interfaces and union types
├── supabase/
│   └── migrations/        # SQL migration files
├── docs/
│   └── plans/             # Design and implementation planning documents
├── turbo.json             # Turborepo task pipeline
├── pnpm-workspace.yaml    # pnpm workspace definition
└── package.json           # Root — workspace scripts + dev dependencies
```

Workspaces are managed by **pnpm** and task orchestration is handled by **Turborepo**. Building `apps/web` or `apps/admin` automatically builds the packages they depend on first (`^build`).

---

## Tech Stack

| Concern | Tool |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Build | Vite 7 |
| UI Framework | React 19 |
| Language | TypeScript 5.8 |
| Styling | Tailwind CSS v4 |
| Component Library | shadcn/ui (Radix UI primitives) |
| Animation | Framer Motion 12 |
| Routing | React Router v7 |
| Forms & Validation | React Hook Form + Zod (admin) |
| Backend | Supabase (Postgres, Auth, Realtime) |
| Deployment | Netlify (SPA redirect config per app) |
| Icons | Lucide React |

---

## Apps

### Public Website (`apps/web`)

Runs on port **5173** (Vite default).

#### Routes

| Path | Page | Description |
|---|---|---|
| `/` | Home | Hero, animated stats bar, announcements, upcoming tournaments, rewards, rules, sponsor marquee |
| `/rankings` | Rankings | Animated podium (top 3), full leaderboard with search and tier filter, live Supabase updates |
| `/tournaments` | Tournament List | Cards for all tournaments with status badge, date, venue, and format |
| `/tournaments/:id` | Tournament Detail | Bracket view with SVG connectors, match scores, winner highlights |
| `/brackets` | Brackets Overview | Cross-tournament bracket explorer |

#### Key Components

- **`HeroBackground`** — animated background for the landing hero section
- **`HeroContent`** — headline, CTAs, and introduction copy
- **`HeroEmblem`** — DPT logo/emblem treatment
- **`StatsBar`** — animated count-up statistics (players, tour stops, prize pool, matches) triggered by scroll into view via `useInView`
- **`AnnouncementsSection`** — pulls live announcements from Supabase
- **`UpcomingSection`** — upcoming tournaments fetched on mount
- **`RewardsSection`** — prize and reward structure display
- **`RulesSection`** — tournament rules
- **`SponsorsSection`** — auto-scrolling sponsor logo marquee (clickable, opens sponsor sites)
- **`BracketView`** / **`BracketColumn`** / **`BracketSVG`** / **`MatchCard`** — full bracket rendering with SVG connector lines

---

### Admin Dashboard (`apps/admin`)

Runs on port **3001**.

Protected behind Supabase Auth — unauthenticated users are redirected to `/login`. Auth state is persisted via Supabase session and re-checked on every page load.

#### Routes

| Path | Page | Description |
|---|---|---|
| `/login` | Login | DPT-branded login form with email/password via Supabase Auth |
| `/rankings` | Rankings Manager | View and edit player points inline |
| `/players` | Players | Add, edit, and delete players; assign player codes and home venue |
| `/teams` | Teams | Create teams by pairing two registered players |
| `/tournaments` | Tournament List | Overview of all tournaments with status management |
| `/tournaments/new` | Create Tournament | Form to create a new tournament (name, date, venue, format, type) |
| `/tournaments/:id` | Tournament Manager | Add participants → assign bracket positions → enter scores → award points |
| `/announcements` | Announcements | Create and manage announcements by type |

#### Form Stack

All admin forms use **React Hook Form** with **Zod** schema validation. UI components are built on **Radix UI** primitives (Dialog, Select, Tabs, DropdownMenu) styled with Tailwind.

---

## Packages

### `@dpt/ui`

Shared component library consumed by both `apps/web` and `apps/admin`.

**Components:**
- `PlayerCard` — displays a player with tier badge and point total
- `TierBadge` — colored label (LEGEND / ELITE / PRO / ROOKIE)
- `TournamentCard` — card with name, venue, date, status, and format
- `AnnouncementCard` — card for displaying announcements by type
- `Podium` — animated top-3 podium display
- `Button`, `Card` — base UI primitives
- `Marquee` / `MarqueeContent` / `MarqueeFade` / `MarqueeItem` — auto-scrolling marquee with edge fades

**Utilities:**
- `tiers.ts` — tier definitions and `getTier(score, maxScore)` helper
- `utils.ts` — `cn()` class merging utility (clsx + tailwind-merge)

**Global styles** are exported from `@dpt/ui/globals.css` and imported once at each app root.

---

### `@dpt/db`

Supabase client and all data access functions. Both apps import from this package — never instantiate a Supabase client directly.

**Exports:**
- `supabase` — the configured Supabase client (reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`)
- **Players:** `getPlayers`, `createPlayer`, `updatePlayer`, `deletePlayer`
- **Teams:** `getTeams`, `createTeam`, `deleteTeam`
- **Tournaments:** `getTournaments`, `getTournament`, `createTournament`, `updateTournamentStatus`
- **Matches:** `getMatches`, `updateMatch`
- **Announcements:** `getAnnouncements`, `createAnnouncement`, `updateAnnouncement`, `deleteAnnouncement`
- **Rank Snapshots:** `getRankSnapshots`, `createRankSnapshot`
- **Realtime:** `subscribeToPlayers(onUpdate)`, `subscribeToMatches(tournamentId, onUpdate)`

Realtime subscriptions listen to Postgres `postgres_changes` events and refetch the affected table on any change, calling the provided callback with fresh data.

---

### `@dpt/types`

Shared TypeScript types. No runtime code — pure type exports.

**Types:**
- `Player`, `Team`, `TeamMember`, `TeamWithPlayers`
- `Tournament`, `TournamentParticipant`, `TournamentParticipantWithDetails`
- `Match`, `MatchWithParticipants`
- `Announcement`, `RankSnapshot`
- `Tier`

**Union types:**
- `TierLabel` — `'LEGEND' | 'ELITE' | 'PRO' | 'ROOKIE'`
- `BracketFormat` — `'R32' | 'R16' | 'QF'`
- `TournamentType` — `'individual' | 'team'`
- `TournamentStatus` — `'upcoming' | 'ongoing' | 'completed'`
- `AnnouncementType` — `'general' | 'tournament' | 'rules' | 'rewards'`
- `Venue` — `'Mansoura Padel Point' | 'Ace Town Complex' | 'Padel H'`
- `SnapshotType` — `'auto' | 'tournament_close' | 'manual'`

---

## Data Model

```sql
players
  id             uuid PRIMARY KEY
  name           text NOT NULL
  code           text                          -- player short code
  venue          text                          -- home venue
  total_points   int DEFAULT 0
  created_at     timestamptz

teams
  id             uuid PRIMARY KEY
  created_at     timestamptz

team_members
  team_id        uuid FK → teams.id
  player_id      uuid FK → players.id
  PRIMARY KEY (team_id, player_id)

tournaments
  id             uuid PRIMARY KEY
  name           text NOT NULL
  date           date NOT NULL
  venue          text NOT NULL                 -- 'Mansoura Padel Point' | 'Ace Town Complex' | 'Padel H'
  bracket_format text NOT NULL                 -- 'R32' | 'R16' | 'QF'
  tournament_type text NOT NULL                -- 'individual' | 'team'
  status         text DEFAULT 'upcoming'       -- 'upcoming' | 'ongoing' | 'completed'
  created_at     timestamptz

tournament_participants
  id             uuid PRIMARY KEY
  tournament_id  uuid FK → tournaments.id
  player_id      uuid FK → players.id          -- null for team tournaments
  team_id        uuid FK → teams.id            -- null for individual tournaments
  bracket_position int                         -- seed slot within the bracket
  points_awarded int DEFAULT 0

matches
  id             uuid PRIMARY KEY
  tournament_id  uuid FK → tournaments.id
  round          int NOT NULL                  -- 1 = first round … 4 = final
  position       int NOT NULL                  -- match slot within the round
  participant1_id uuid FK → tournament_participants.id
  participant2_id uuid FK → tournament_participants.id
  score1         int
  score2         int
  winner_id      uuid FK → tournament_participants.id

announcements
  id             uuid PRIMARY KEY
  title          text NOT NULL
  content        text NOT NULL
  type           text DEFAULT 'general'        -- 'general' | 'tournament' | 'rules' | 'rewards'
  published_at   timestamptz

rank_snapshots
  id             uuid PRIMARY KEY
  player_id      uuid FK → players.id ON DELETE CASCADE
  rank           int NOT NULL
  total_points   int NOT NULL
  snapshot_type  text NOT NULL                 -- 'auto' | 'tournament_close' | 'manual'
  created_at     timestamptz
```

**Indexes:**
- `rank_snapshots(player_id, created_at DESC)` — fast historical rank lookups per player

---

## Player Tiers

Tiers are computed dynamically relative to the current top score in the leaderboard.

| Tier | Threshold | Color |
|---|---|---|
| LEGEND | ≥ 75% of max score | Gold `#FFD700` |
| ELITE | ≥ 50% of max score | Silver `#C0C0C0` |
| PRO | ≥ 25% of max score | Bronze `#CD7F32` |
| ROOKIE | < 25% of max score | Coral `#ea785e` |

The `getTier(score, maxScore)` utility in `@dpt/ui/src/lib/tiers.ts` handles this calculation.

---

## Realtime

The public website subscribes to Supabase Realtime on mount:

- **`players` channel** — any insert, update, or delete on the `players` table triggers a full refetch and re-renders the Rankings page live
- **`matches` channel** — scoped to a specific `tournament_id`; updates re-render the bracket view live as scores are entered in the admin panel

Admin writes go through the Supabase client with the authenticated JWT; Supabase broadcasts the change to all subscribed public clients automatically.

Subscriptions are cleaned up on component unmount to prevent memory leaks.

---

## Security

- **Row-Level Security (RLS)** is enforced at the Postgres level — the `anon` role can only `SELECT`; `INSERT`, `UPDATE`, and `DELETE` require an authenticated session
- **Admin auth** uses Supabase Auth (email/password). The JWT is automatically attached to every Supabase client request after login
- **Protected routes** in `apps/admin` — all routes except `/login` check `supabase.auth.getSession()` on load and redirect unauthenticated users to `/login`
- **Realtime** uses the anon key — read-only access; no data can be mutated through the realtime channel

---

## Environment Variables

Both apps require the same three variables. Create a `.env` file in each app directory:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
```

These are injected at build time by Vite and exposed on `import.meta.env`. Never commit real keys to source control — the `.env` files are gitignored.

---

## Getting Started

### Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9 (`npm install -g pnpm`)

### Install

```bash
git clone <repo-url>
cd scoresapp
pnpm install
```

### Configure environment

```bash
cp apps/web/.env.example apps/web/.env
cp apps/admin/.env.example apps/admin/.env
# Fill in your Supabase project URL and keys
```

### Run all apps (development)

```bash
pnpm dev
```

Turborepo starts all apps in parallel:
- Public website → http://localhost:5173
- Admin dashboard → http://localhost:3001

### Run a single app

```bash
pnpm --filter @dpt/web dev
pnpm --filter @dpt/admin dev
```

### Database migrations

Apply migrations using the Supabase CLI or paste them directly into the Supabase SQL editor:

```bash
supabase db push
# or apply supabase/migrations/*.sql manually
```

---

## Scripts

All scripts are run from the root and delegated by Turborepo:

| Command | Description |
|---|---|
| `pnpm dev` | Start all apps in development mode (parallel, with HMR) |
| `pnpm build` | Production build for all apps (packages built first) |
| `pnpm lint` | ESLint across all workspaces |
| `pnpm type-check` | TypeScript `tsc --noEmit` across all workspaces |

---

## Deployment

Both apps are deployed as static SPAs. Each app has a `netlify.toml` with a catch-all redirect so React Router handles client-side navigation:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Build settings per app:

| App | Build command | Publish directory |
|---|---|---|
| `apps/web` | `pnpm --filter @dpt/web build` | `apps/web/dist` |
| `apps/admin` | `pnpm --filter @dpt/admin build` | `apps/admin/dist` |

Set the three `VITE_SUPABASE_*` environment variables in each Netlify site's settings.

---

## Sponsors

| Sponsor | Website |
|---|---|
| Bonelli Sports | https://bonellisports.com |
| El Saba Group | https://www.elsaba-group.com |
| TMC | https://tmc.eg |
| JNYA | https://jnyaa.com |

Sponsor logos are displayed in the auto-scrolling marquee on the public website home page and link directly to each sponsor's site.
