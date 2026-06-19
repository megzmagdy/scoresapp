# DPT Revamp — Design Document
**Date:** 2026-06-19
**Branch:** revamp

---

## Overview

Full rebuild of the Delta Padel Tour (DPT) app from a single-file JSX leaderboard into a TypeScript monorepo with a public website and an admin dashboard, backed by Supabase.

---

## Monorepo Structure

```
scoresapp/
├── apps/
│   ├── web/          # Public site — Vite + React + TS
│   └── admin/        # Admin panel — Vite + React + TS
├── packages/
│   ├── ui/           # Shared shadcn/ui components
│   ├── db/           # Supabase client + generated types
│   └── types/        # Shared TypeScript types
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

**Monorepo tooling:** Turborepo + pnpm workspaces

---

## Tech Stack (per app)

| Layer | Choice |
|---|---|
| Build | Vite 7 |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Animation | Framer Motion |
| Routing | React Router v7 |
| Backend | Supabase (Postgres + Realtime + Auth) |
| Deployment | Vercel (each app independently) |

---

## Data Model

```sql
players
  id             uuid PRIMARY KEY
  name           text NOT NULL
  total_points   int DEFAULT 0
  created_at     timestamptz

teams
  id             uuid PRIMARY KEY
  name           text NOT NULL
  created_at     timestamptz

team_members
  team_id        uuid FK → teams.id
  player_id      uuid FK → players.id
  PRIMARY KEY (team_id, player_id)

tournaments
  id             uuid PRIMARY KEY
  name           text NOT NULL
  date           date NOT NULL
  venue          text NOT NULL   -- 'Mansoura Padel Point' | 'Ace Town Complex' | 'Padel H'
  bracket_format text NOT NULL   -- 'R16' | 'QF'
  tournament_type text NOT NULL  -- 'individual' | 'team'
  status         text DEFAULT 'upcoming'  -- 'upcoming' | 'ongoing' | 'completed'
  created_at     timestamptz

tournament_participants
  id             uuid PRIMARY KEY
  tournament_id  uuid FK → tournaments.id
  player_id      uuid FK → players.id    -- null for team tournaments
  team_id        uuid FK → teams.id      -- null for individual tournaments
  bracket_position int                   -- 1–16 (R16) or 1–8 (QF)
  points_awarded int DEFAULT 0

matches
  id             uuid PRIMARY KEY
  tournament_id  uuid FK → tournaments.id
  round          int NOT NULL   -- 1 = first round, 2 = QF, 3 = SF, 4 = Final
  position       int NOT NULL   -- match slot within the round
  participant1_id uuid FK → tournament_participants.id
  participant2_id uuid FK → tournament_participants.id
  score1         int
  score2         int
  winner_id      uuid FK → tournament_participants.id

announcements
  id             uuid PRIMARY KEY
  title          text NOT NULL
  content        text NOT NULL
  type           text DEFAULT 'general'  -- 'general' | 'tournament' | 'rules' | 'rewards'
  published_at   timestamptz
```

### Key behaviors
- When a match winner is saved and points are awarded, `players.total_points` is updated (via DB trigger or admin action).
- Supabase Realtime watches `players` and `matches` — the public site updates without a page refresh.
- RLS: public role can only `SELECT`; authenticated admin role can `INSERT/UPDATE/DELETE`.

---

## Public Website — `apps/web`

### Routes

| Route | Page | Content |
|---|---|---|
| `/` | Home | Announcements, upcoming tournaments, rules section, prize/rewards, CTAs |
| `/rankings` | Rankings | Animated podium (top 3), full leaderboard, search, tier filter |
| `/tournaments` | Tournament List | Tournament cards with status badge, date, venue, format |
| `/tournaments/:id` | Bracket View | Visual bracket tree, match scores, progression, winner highlights |

### Tiers (carried over from current app)
- **LEGEND** — top 75% of max score
- **ELITE** — top 50%
- **PRO** — top 25%
- **ROOKIE** — below 25%

---

## Admin Dashboard — `apps/admin`

### Routes

| Route | Page | Actions |
|---|---|---|
| `/login` | Login | Supabase email/password |
| `/rankings` | Rankings Manager | Inline point editing per player, save triggers realtime push |
| `/players` | Players | Add / edit / delete players |
| `/teams` | Teams | Create teams, assign 2 players per team |
| `/tournaments` | Tournament List | Overview, status management |
| `/tournaments/new` | Create Tournament | Name, date, venue, format (R16/QF), type (individual/team) |
| `/tournaments/:id` | Tournament Manager | Add participants → assign bracket positions → record scores → award points |

---

## Shared Package — `packages/ui`

Components built once, consumed by both apps:
- `PlayerCard`
- `TierBadge`
- `BracketMatch`
- `TournamentCard`
- `Podium`
- `AnnouncementCard`

---

## Visual & UX Design

### Brand
- **Background:** Black / near-black (`#000`, `#0a0a0a`)
- **Primary accent:** Gold (`#eeb149`)
- **Secondary accent:** Warm orange (`#ca832a`)
- **Font:** Sora
- **Theme:** Dark only

### Public Website
- **Home:** Bold hero with DPT logo, animated announcement cards, prize/rules sections
- **Rankings:** Framer Motion stagger on leaderboard rows, animated podium reveal, score flash on realtime update
- **Bracket:** SVG connecting lines between match cards, gold highlight on winner, animated progression on result save

### Admin Dashboard
- Minimal, functional — shadcn/ui defaults with dark theme
- Less animation than the public site; prioritises clarity and speed of use
- Bracket manager: drag-and-drop player/team assignment into bracket slots

---

## Realtime Strategy

The public `apps/web` opens a Supabase Realtime subscription on mount:
- `players` channel — reflects points changes instantly on Rankings page
- `matches` channel — reflects bracket result updates on Tournament Bracket page

Admin saves trigger DB writes; Supabase broadcasts to all subscribed clients automatically.

---

## Security

- Supabase RLS enforced at the DB level — public users cannot write any table
- Admin auth via Supabase Auth (email/password); JWT token passed with every write request
- Admin app protected routes: unauthenticated users redirected to `/login`
