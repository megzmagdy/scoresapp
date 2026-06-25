# Brackets Page Design

**Date:** 2026-06-25
**Status:** Approved

## Goal

Replace the `BracketsPage` placeholder with a fully functional, visually accurate tournament bracket viewer that matches the screenshot design. Tournaments and participants are fetched from Supabase. Bracket size is dynamic (any number of participants). Connector lines use mathematical SVG.

## Component Tree

```
apps/web/src/pages/BracketsPage.tsx          ← owns all state, data fetching
apps/web/src/components/brackets/
  ├── TournamentTabs.tsx                      ← pill tab selector
  ├── BracketView.tsx                         ← horizontally scrollable bracket
  ├── BracketColumn.tsx                       ← one column per round
  ├── MatchCard.tsx                           ← two participant rows per match
  ├── BracketSVG.tsx                          ← mathematical SVG connectors
  └── ChampionCard.tsx                        ← winner display after Final
```

## Data Flow

```
getTournaments()                              → populate TournamentTabs
on tab select (tournamentId changes):
  parallel:
    getMatches(tournamentId)
    getTournamentParticipants(tournamentId)
  → participantMap: Record<string, TournamentParticipantWithDetails>
  → rounds: Map<number, Match[]> (keyed by round number, sorted by position)
  → champion: TournamentParticipantWithDetails | null  (winner of max round)
```

No real-time subscription. Refetch on tournament selection change.

## Layout Math

**Constants:**
```
CARD_H  = 88    // px — fixed match card height
GAP     = 8     // px — gap between cards in same round
SLOT    = 96    // px — CARD_H + GAP
COL_W   = 240   // px — width of each round column
COL_GAP = 56    // px — horizontal gap between columns (SVG connectors live here)
```

**Center Y of match at round R (1-indexed), position P (0-indexed):**
```
centerY(R, P) = P * SLOT * 2^(R-1) + CARD_H/2 + SLOT * (2^(R-1) - 1) / 2
```

**Top Y of match card:**
```
topY(R, P) = centerY(R, P) - CARD_H / 2
```

**Total container height** (same for all rounds, determined by round 1):
```
totalHeight = numRound1Matches * SLOT - GAP
```

## SVG Connector Paths

For each transition from round R to R+1, and each match at position P in round R+1:

1. Horizontal line: right edge of (R, 2P) → mid-x between columns
2. Horizontal line: right edge of (R, 2P+1) → mid-x between columns
3. Vertical line at mid-x: from centerY(R, 2P) to centerY(R, 2P+1)
4. Horizontal line: mid-x → left edge of (R+1, P)

Mid-x between column R and R+1:
```
midX = R * (COL_W + COL_GAP) + COL_W + COL_GAP / 2
```

SVG is absolutely positioned over the entire bracket container, full width × totalHeight.
Stroke: `#E8B53A` (gold), opacity 0.4. Stroke-width: 1.5.

## Round Labels

| Matches in round | Label              |
|------------------|--------------------|
| 1                | Final              |
| 2                | Semi Finals        |
| 4                | Quarter Finals     |
| ≥ 8              | Round of `M × 2`   |

## MatchCard

Each card is `CARD_H = 88px` tall, width `COL_W = 240px`.

Two `ParticipantRow`s stacked with a divider line between them.

**ParticipantRow:**
- Left: seed chip `#<bracket_position>` (muted, monospace, small)
- Center: participant name
  - Individual: player name
  - Team: "Player1 / Player2" (two lines or truncated)
  - TBD: dimmed italic "TBD"
- Right: score (if match has been played)
- Winner row: name bold, score in gold (`#E8B53A`), row background slightly lighter
- Loser row: name and score muted

Card background: `#181818`, border: `1px solid #2e2e2e`, rounded: `8px`.

## ChampionCard

Rendered as an extra column after the Final column when `champion !== null`.

Contains:
- Label: "CHAMPION" (monospace, gold, small caps)
- Trophy icon (🏆 or Lucide Trophy)
- Champion name (large, bold, italic, gold)
- Tournament name + "· Winner" subtitle (muted)

Matches the visual from the screenshot.

## TournamentTabs

Pill buttons for each tournament. Active tab: gold border + gold text. Inactive: muted border + muted text. Uses existing `Button` component from `@dpt/ui`.

## Loading & Empty States

- Loading: dimmed "Loading bracket..." centered text
- No tournaments: "No tournaments found"
- Tournament with no matches: "Bracket not yet set up"

## Files to Create/Modify

- **Modify:** `apps/web/src/pages/BracketsPage.tsx`
- **Create:** `apps/web/src/components/brackets/TournamentTabs.tsx`
- **Create:** `apps/web/src/components/brackets/BracketView.tsx`
- **Create:** `apps/web/src/components/brackets/BracketColumn.tsx`
- **Create:** `apps/web/src/components/brackets/MatchCard.tsx`
- **Create:** `apps/web/src/components/brackets/BracketSVG.tsx`
- **Create:** `apps/web/src/components/brackets/ChampionCard.tsx`

No new shadcn components needed — existing `Button` and `Card` from `@dpt/ui` suffice.
