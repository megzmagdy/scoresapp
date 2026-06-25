# Brackets Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a fully dynamic, visually accurate tournament bracket viewer that fetches from Supabase and renders SVG connector lines between rounds.

**Architecture:** Math-only SVG connectors (no DOM measurement) — card height is fixed at 88px, so all Y coordinates are computed from `round` and `position` numbers. Components are composed bottom-up: constants → MatchCard → BracketSVG → BracketColumn → BracketView → BracketsPage.

**Tech Stack:** React 19, TypeScript, Tailwind v4, framer-motion, `@dpt/db` (Supabase queries), `@dpt/types`, lucide-react (Trophy icon from `@dpt/ui` deps).

---

## Key Alias Reference

In `apps/web/vite.config.ts`:
- `@` → `packages/ui/src` (shadcn components, utils)
- `~` → `apps/web/src` (app-local code)

## Color Tokens (hardcoded, matching design)

```ts
const GOLD = '#E8B53A';
const BG_CARD = '#181818';
const BORDER = '#2e2e2e';
const MUTED = '#555';
const TEXT = '#e5e5e5';
```

---

## Task 1: Bracket Math Utilities

**Files:**
- Create: `apps/web/src/components/brackets/bracketMath.ts`

**Step 1: Create the file with all layout constants and pure functions**

```ts
// apps/web/src/components/brackets/bracketMath.ts
import type { TournamentParticipantWithDetails, TournamentType } from '@dpt/types';

export const CARD_H = 88;
export const GAP = 8;
export const SLOT = CARD_H + GAP; // 96
export const COL_W = 240;
export const COL_GAP = 56;
export const LABEL_H = 32; // space above each column for round label

// R = round number (1-indexed), P = position (0-indexed)
export function centerY(R: number, P: number): number {
  const scale = Math.pow(2, R - 1);
  return P * SLOT * scale + CARD_H / 2 + SLOT * (scale - 1) / 2;
}

export function topY(R: number, P: number): number {
  return centerY(R, P) - CARD_H / 2;
}

export function bracketTotalHeight(numRound1Matches: number): number {
  return numRound1Matches * SLOT - GAP;
}

export function bracketTotalWidth(numRounds: number): number {
  return numRounds * COL_W + (numRounds - 1) * COL_GAP;
}

export function getRoundLabel(matchCount: number): string {
  if (matchCount === 1) return 'Final';
  if (matchCount === 2) return 'Semi Finals';
  if (matchCount === 4) return 'Quarter Finals';
  return `Round of ${matchCount * 2}`;
}

export function getParticipantName(
  participant: TournamentParticipantWithDetails | undefined,
  type: TournamentType
): string {
  if (!participant) return 'TBD';
  if (type === 'individual') return participant.player?.name ?? 'TBD';
  return participant.team?.players.map((p) => p.name).join(' / ') ?? 'TBD';
}

export function getParticipantSeed(
  participant: TournamentParticipantWithDetails | undefined
): number | null {
  return participant?.bracket_position ?? null;
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/brackets/bracketMath.ts
git commit -m "feat(brackets): add bracket layout math utilities"
```

---

## Task 2: MatchCard Component

**Files:**
- Create: `apps/web/src/components/brackets/MatchCard.tsx`

**Step 1: Create the MatchCard**

```tsx
// apps/web/src/components/brackets/MatchCard.tsx
import type { Match, TournamentParticipantWithDetails, TournamentType } from '@dpt/types';
import { CARD_H, COL_W, getParticipantName, getParticipantSeed } from './bracketMath';

const GOLD = '#E8B53A';
const BG_CARD = '#181818';
const BORDER = '#2e2e2e';

interface ParticipantRowProps {
  participant: TournamentParticipantWithDetails | undefined;
  score: number | null | undefined;
  isWinner: boolean;
  tournamentType: TournamentType;
}

function ParticipantRow({ participant, score, isWinner, tournamentType }: ParticipantRowProps) {
  const name = getParticipantName(participant, tournamentType);
  const seed = getParticipantSeed(participant);
  const isTBD = !participant;

  return (
    <div
      className="flex items-center justify-between px-3 flex-1"
      style={{
        background: isWinner ? 'rgba(232,181,58,0.06)' : 'transparent',
      }}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {seed !== null && (
          <span
            className="shrink-0 text-[10px] tabular-nums w-6"
            style={{ fontFamily: "'Source Code Pro', monospace", color: '#555' }}
          >
            #{seed}
          </span>
        )}
        <span
          className="text-sm truncate"
          style={{
            color: isTBD ? '#444' : isWinner ? '#f0f0f0' : '#888',
            fontWeight: isWinner ? 700 : 400,
            fontStyle: isTBD ? 'italic' : 'normal',
          }}
        >
          {name}
        </span>
      </div>
      {score !== null && score !== undefined && (
        <span
          className="text-sm font-bold tabular-nums ml-2"
          style={{ color: isWinner ? GOLD : '#666' }}
        >
          {score}
        </span>
      )}
    </div>
  );
}

interface MatchCardProps {
  match: Match;
  participant1: TournamentParticipantWithDetails | undefined;
  participant2: TournamentParticipantWithDetails | undefined;
  tournamentType: TournamentType;
  style?: React.CSSProperties;
}

export function MatchCard({ match, participant1, participant2, tournamentType, style }: MatchCardProps) {
  const winner1 = match.winner_id === match.participant1_id && match.winner_id !== null;
  const winner2 = match.winner_id === match.participant2_id && match.winner_id !== null;

  return (
    <div
      style={{
        position: 'absolute',
        width: COL_W,
        height: CARD_H,
        background: BG_CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...style,
      }}
    >
      <ParticipantRow
        participant={participant1}
        score={match.score1}
        isWinner={winner1}
        tournamentType={tournamentType}
      />
      <div style={{ height: 1, background: BORDER, flexShrink: 0 }} />
      <ParticipantRow
        participant={participant2}
        score={match.score2}
        isWinner={winner2}
        tournamentType={tournamentType}
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/brackets/MatchCard.tsx
git commit -m "feat(brackets): add MatchCard component"
```

---

## Task 3: BracketSVG Component

**Files:**
- Create: `apps/web/src/components/brackets/BracketSVG.tsx`

**Step 1: Create the SVG connector renderer**

```tsx
// apps/web/src/components/brackets/BracketSVG.tsx
import type { Match } from '@dpt/types';
import { centerY, COL_W, COL_GAP, LABEL_H } from './bracketMath';

interface BracketSVGProps {
  rounds: Map<number, Match[]>;
  totalHeight: number;
  totalWidth: number;
}

export function BracketSVG({ rounds, totalHeight, totalWidth }: BracketSVGProps) {
  const paths: string[] = [];
  const sortedRoundNums = Array.from(rounds.keys()).sort((a, b) => a - b);

  for (let i = 0; i < sortedRoundNums.length - 1; i++) {
    const R = sortedRoundNums[i];          // source round (1-indexed in data)
    const R1 = sortedRoundNums[i + 1];    // next round
    const rIdx = i;                         // 0-indexed column index for R
    const r1Idx = i + 1;                   // 0-indexed column index for R+1

    const xRight = rIdx * (COL_W + COL_GAP) + COL_W;
    const xLeft = r1Idx * (COL_W + COL_GAP);
    const xMid = xRight + COL_GAP / 2;

    const nextMatches = rounds.get(R1) ?? [];

    for (const nextMatch of nextMatches) {
      // nextMatch at position P in R+1 is fed by positions 2P and 2P+1 in R
      const P = nextMatch.position;
      const yTop = centerY(1, P * 2);      // We normalize to relative positions
      const yBottom = centerY(1, P * 2 + 1);
      const yMid = (yTop + yBottom) / 2;

      // Actually we need the absolute centerY based on the actual round index (0-based from this round)
      // The math uses R=1 for the first round in the view, so we remap
      const absYTop = centerY(rIdx + 1, P * 2);
      const absYBottom = centerY(rIdx + 1, P * 2 + 1);
      const absYMid = (absYTop + absYBottom) / 2;

      paths.push(
        `M ${xRight} ${absYTop} H ${xMid} V ${absYBottom} H ${xRight} M ${xMid} ${absYMid} H ${xLeft}`
      );
    }
  }

  return (
    <svg
      style={{
        position: 'absolute',
        top: LABEL_H,
        left: 0,
        pointerEvents: 'none',
        overflow: 'visible',
      }}
      width={totalWidth}
      height={totalHeight}
    >
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="#E8B53A"
          strokeOpacity={0.35}
          strokeWidth={1.5}
        />
      ))}
    </svg>
  );
}
```

**Important note on the SVG path math:** The `centerY(rIdx + 1, P * 2)` calls use `rIdx + 1` (1-indexed column position in the view) rather than the raw database `round` number, because `round` values in the database might not start at 1 or be sequential. Always remap to 1-indexed view columns before calling centerY.

**Step 2: Commit**

```bash
git add apps/web/src/components/brackets/BracketSVG.tsx
git commit -m "feat(brackets): add BracketSVG connector component"
```

---

## Task 4: BracketColumn Component

**Files:**
- Create: `apps/web/src/components/brackets/BracketColumn.tsx`

**Step 1: Create the column (round label + absolutely positioned cards)**

```tsx
// apps/web/src/components/brackets/BracketColumn.tsx
import type { Match, TournamentParticipantWithDetails, TournamentType } from '@dpt/types';
import { topY, COL_W, COL_GAP, LABEL_H, getRoundLabel } from './bracketMath';
import { MatchCard } from './MatchCard';

interface BracketColumnProps {
  roundNumber: number;        // 1-indexed column position in view (not raw DB round)
  matches: Match[];
  participantMap: Record<string, TournamentParticipantWithDetails>;
  tournamentType: TournamentType;
  totalHeight: number;
  columnIndex: number;        // 0-indexed, for absolute x positioning
}

export function BracketColumn({
  roundNumber,
  matches,
  participantMap,
  tournamentType,
  totalHeight,
  columnIndex,
}: BracketColumnProps) {
  const xLeft = columnIndex * (COL_W + COL_GAP);
  const label = getRoundLabel(matches.length);

  return (
    <div
      style={{
        position: 'absolute',
        left: xLeft,
        top: 0,
        width: COL_W,
        height: totalHeight + LABEL_H,
      }}
    >
      {/* Round label */}
      <div
        style={{
          height: LABEL_H,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontFamily: "'Source Code Pro', monospace",
            fontSize: 11,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#555',
          }}
        >
          {label}
        </span>
      </div>

      {/* Match cards */}
      {matches.map((match) => {
        const p1 = match.participant1_id ? participantMap[match.participant1_id] : undefined;
        const p2 = match.participant2_id ? participantMap[match.participant2_id] : undefined;

        return (
          <MatchCard
            key={match.id}
            match={match}
            participant1={p1}
            participant2={p2}
            tournamentType={tournamentType}
            style={{ top: topY(roundNumber, match.position) }}
          />
        );
      })}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/brackets/BracketColumn.tsx
git commit -m "feat(brackets): add BracketColumn component"
```

---

## Task 5: ChampionCard Component

**Files:**
- Create: `apps/web/src/components/brackets/ChampionCard.tsx`

**Step 1: Create the champion display**

```tsx
// apps/web/src/components/brackets/ChampionCard.tsx
import { Trophy } from 'lucide-react';
import type { TournamentParticipantWithDetails, TournamentType } from '@dpt/types';
import { CARD_H, COL_W, COL_GAP, LABEL_H, getParticipantName } from './bracketMath';

const GOLD = '#E8B53A';

interface ChampionCardProps {
  champion: TournamentParticipantWithDetails;
  tournamentName: string;
  tournamentType: TournamentType;
  numColumns: number;       // total number of round columns (for positioning)
  totalHeight: number;
}

export function ChampionCard({
  champion,
  tournamentName,
  tournamentType,
  numColumns,
  totalHeight,
}: ChampionCardProps) {
  const xLeft = numColumns * (COL_W + COL_GAP);
  const centerYPos = totalHeight / 2;
  const cardHeight = 160;

  return (
    <div
      style={{
        position: 'absolute',
        left: xLeft,
        top: LABEL_H + centerYPos - cardHeight / 2,
        width: COL_W,
      }}
    >
      {/* Label above */}
      <span
        style={{
          display: 'block',
          fontFamily: "'Source Code Pro', monospace",
          fontSize: 11,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: GOLD,
          marginBottom: 10,
        }}
      >
        Champion
      </span>

      <div
        style={{
          background: 'linear-gradient(135deg, rgba(232,181,58,0.12) 0%, rgba(232,181,58,0.04) 100%)',
          border: `1px solid rgba(232,181,58,0.3)`,
          borderRadius: 10,
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          height: cardHeight,
          justifyContent: 'center',
        }}
      >
        <Trophy size={28} color={GOLD} />
        <span
          style={{
            color: GOLD,
            fontWeight: 900,
            fontSize: 20,
            fontStyle: 'italic',
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            textAlign: 'center',
          }}
        >
          {getParticipantName(champion, tournamentType)}
        </span>
        <span
          style={{
            color: '#555',
            fontSize: 11,
            textAlign: 'center',
          }}
        >
          {tournamentName} · Winner
        </span>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/brackets/ChampionCard.tsx
git commit -m "feat(brackets): add ChampionCard component"
```

---

## Task 6: TournamentTabs Component

**Files:**
- Create: `apps/web/src/components/brackets/TournamentTabs.tsx`

**Step 1: Create the tab bar**

```tsx
// apps/web/src/components/brackets/TournamentTabs.tsx
import type { Tournament } from '@dpt/types';

const GOLD = '#E8B53A';

interface TournamentTabsProps {
  tournaments: Tournament[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function TournamentTabs({ tournaments, selectedId, onSelect }: TournamentTabsProps) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {tournaments.map((t) => {
        const active = t.id === selectedId;
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            style={{
              padding: '6px 16px',
              borderRadius: 9999,
              border: `1px solid ${active ? GOLD : '#2e2e2e'}`,
              background: active ? 'rgba(232,181,58,0.08)' : 'transparent',
              color: active ? GOLD : '#888',
              fontWeight: active ? 700 : 400,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: 'inherit',
            }}
          >
            {t.name}
          </button>
        );
      })}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/brackets/TournamentTabs.tsx
git commit -m "feat(brackets): add TournamentTabs component"
```

---

## Task 7: BracketView Component

**Files:**
- Create: `apps/web/src/components/brackets/BracketView.tsx`

**Step 1: Create the main bracket assembly**

This component:
1. Groups matches by round (sorted by round number), then sorts matches within each round by position
2. Computes total dimensions from round 1 match count
3. Renders columns, SVG connectors, and champion card inside a scrollable container

```tsx
// apps/web/src/components/brackets/BracketView.tsx
import type { Match, Tournament, TournamentParticipantWithDetails } from '@dpt/types';
import {
  bracketTotalHeight,
  bracketTotalWidth,
  COL_W,
  COL_GAP,
  LABEL_H,
} from './bracketMath';
import { BracketColumn } from './BracketColumn';
import { BracketSVG } from './BracketSVG';
import { ChampionCard } from './ChampionCard';

interface BracketViewProps {
  matches: Match[];
  participants: TournamentParticipantWithDetails[];
  tournament: Tournament;
}

export function BracketView({ matches, participants, tournament }: BracketViewProps) {
  // Build participant lookup
  const participantMap: Record<string, TournamentParticipantWithDetails> = {};
  for (const p of participants) {
    participantMap[p.id] = p;
  }

  // Group matches by round, sorted
  const roundMap = new Map<number, Match[]>();
  for (const match of matches) {
    if (!roundMap.has(match.round)) roundMap.set(match.round, []);
    roundMap.get(match.round)!.push(match);
  }
  for (const [, rMatches] of roundMap) {
    rMatches.sort((a, b) => a.position - b.position);
  }

  const sortedRounds = Array.from(roundMap.keys()).sort((a, b) => a - b);
  const numRounds = sortedRounds.length;

  if (numRounds === 0) {
    return (
      <div style={{ color: '#555', padding: '48px 0', textAlign: 'center' }}>
        Bracket not yet set up
      </div>
    );
  }

  const round1Matches = roundMap.get(sortedRounds[0])!;
  const totalH = bracketTotalHeight(round1Matches.length);
  const totalW = bracketTotalWidth(numRounds);

  // Determine champion: winner of the final round's single match
  const finalMatches = roundMap.get(sortedRounds[numRounds - 1])!;
  const finalMatch = finalMatches[0];
  const champion =
    finalMatch?.winner_id ? participantMap[finalMatch.winner_id] : null;

  // Extra width for champion card
  const champColWidth = champion ? COL_W + COL_GAP : 0;
  const containerW = totalW + champColWidth + 40; // 40px right padding

  return (
    <div
      style={{
        overflowX: 'auto',
        overflowY: 'visible',
        paddingBottom: 24,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: containerW,
          height: totalH + LABEL_H,
          minHeight: totalH + LABEL_H,
        }}
      >
        {/* Columns */}
        {sortedRounds.map((roundNum, colIdx) => (
          <BracketColumn
            key={roundNum}
            roundNumber={colIdx + 1}
            matches={roundMap.get(roundNum)!}
            participantMap={participantMap}
            tournamentType={tournament.tournament_type}
            totalHeight={totalH}
            columnIndex={colIdx}
          />
        ))}

        {/* SVG connectors */}
        <BracketSVG
          rounds={roundMap}
          totalHeight={totalH}
          totalWidth={totalW}
          sortedRounds={sortedRounds}
        />

        {/* Champion card */}
        {champion && (
          <ChampionCard
            champion={champion}
            tournamentName={tournament.name}
            tournamentType={tournament.tournament_type}
            numColumns={numRounds}
            totalHeight={totalH}
          />
        )}
      </div>
    </div>
  );
}
```

**Note:** `BracketSVG` needs to receive `sortedRounds` so it can remap database round numbers to 0-indexed column positions. Update its props accordingly (see Task 3 — pass `sortedRounds` and use `colIdx` for the centerY call, not the raw round number).

**Updated BracketSVG signature:**

```tsx
interface BracketSVGProps {
  rounds: Map<number, Match[]>;
  totalHeight: number;
  totalWidth: number;
  sortedRounds: number[];   // add this
}
```

And update the connector loop to:
```tsx
for (let i = 0; i < sortedRounds.length - 1; i++) {
  const R = sortedRounds[i];
  const R1 = sortedRounds[i + 1];
  // colIdx for R is i (0-based), for R1 is i+1
  const xRight = i * (COL_W + COL_GAP) + COL_W;
  const xLeft = (i + 1) * (COL_W + COL_GAP);
  const xMid = xRight + COL_GAP / 2;

  const nextMatches = rounds.get(R1) ?? [];
  for (const nextMatch of nextMatches) {
    const P = nextMatch.position;
    // viewRound for source column = i + 1 (1-indexed)
    const absYTop = centerY(i + 1, P * 2);
    const absYBottom = centerY(i + 1, P * 2 + 1);
    const absYMid = (absYTop + absYBottom) / 2;
    paths.push(`M ${xRight} ${absYTop} H ${xMid} V ${absYBottom} H ${xRight} M ${xMid} ${absYMid} H ${xLeft}`);
  }
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/brackets/BracketView.tsx
git commit -m "feat(brackets): add BracketView assembly component"
```

---

## Task 8: Wire Up BracketsPage

**Files:**
- Modify: `apps/web/src/pages/BracketsPage.tsx`

**Step 1: Replace placeholder with full data-fetching page**

```tsx
// apps/web/src/pages/BracketsPage.tsx
import { useEffect, useState } from 'react';
import { getTournaments, getMatches, getTournamentParticipants } from '@dpt/db';
import type { Tournament, Match, TournamentParticipantWithDetails } from '@dpt/types';
import { TournamentTabs } from '~/components/brackets/TournamentTabs';
import { BracketView } from '~/components/brackets/BracketView';

const GOLD = '#E8B53A';

export function BracketsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [participants, setParticipants] = useState<TournamentParticipantWithDetails[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [loadingBracket, setLoadingBracket] = useState(false);

  // Fetch tournament list on mount
  useEffect(() => {
    getTournaments()
      .then((data) => {
        setTournaments(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .finally(() => setLoadingTournaments(false));
  }, []);

  // Fetch bracket data when selection changes
  useEffect(() => {
    if (!selectedId) return;
    setLoadingBracket(true);
    Promise.all([getMatches(selectedId), getTournamentParticipants(selectedId)])
      .then(([m, p]) => {
        setMatches(m);
        setParticipants(p);
      })
      .finally(() => setLoadingBracket(false));
  }, [selectedId]);

  const selectedTournament = tournaments.find((t) => t.id === selectedId) ?? null;

  return (
    <div style={{ background: '#0b0c0f', minHeight: '100vh' }}>
      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'linear-gradient(180deg, rgba(232,181,58,0.05) 0%, transparent 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-10">
          <p
            style={{
              fontFamily: "'Source Code Pro', monospace",
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: GOLD,
              marginBottom: 6,
            }}
          >
            Season 2 · 2026
          </p>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 900,
              fontStyle: 'italic',
              textTransform: 'uppercase',
              color: '#f0f0f0',
              lineHeight: 1,
              marginBottom: 24,
              fontFamily: "'Archivo', sans-serif",
            }}
          >
            Brackets
          </h1>

          {!loadingTournaments && (
            <TournamentTabs
              tournaments={tournaments}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
        </div>
      </div>

      {/* Bracket */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {loadingTournaments || loadingBracket ? (
          <div style={{ color: '#555', paddingTop: 48, textAlign: 'center' }}>
            Loading bracket...
          </div>
        ) : !selectedTournament ? (
          <div style={{ color: '#555', paddingTop: 48, textAlign: 'center' }}>
            No tournaments found
          </div>
        ) : (
          <BracketView
            matches={matches}
            participants={participants}
            tournament={selectedTournament}
          />
        )}
      </div>
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

```bash
cd apps/web && npx tsc --noEmit
```

Fix any type errors before continuing.

**Step 3: Commit**

```bash
git add apps/web/src/pages/BracketsPage.tsx
git commit -m "feat(brackets): wire up BracketsPage with data fetching"
```

---

## Task 9: Fix BracketSVG to Use sortedRounds

Update `BracketSVG.tsx` to accept `sortedRounds` prop (see note in Task 7) and remove the broken version from Task 3.

**Step 1: Update BracketSVG.tsx with the corrected implementation**

Replace the full file with the corrected version (using `sortedRounds` prop and `colIdx`-based centerY calls as described in the Task 7 note above).

**Step 2: Verify no TypeScript errors**

```bash
cd apps/web && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add apps/web/src/components/brackets/BracketSVG.tsx
git commit -m "fix(brackets): use sortedRounds in BracketSVG for correct connector positions"
```

---

## Task 10: Visual Verification

**Step 1: Start the dev server**

```bash
cd apps/web && pnpm dev
```

Navigate to `/brackets` and verify:
- [ ] Tournament tabs render and are clickable
- [ ] Active tab is highlighted in gold
- [ ] Match cards show participant names with seeds (#N)
- [ ] Winner row is gold + bold, loser is muted
- [ ] SVG connector lines link rounds visually
- [ ] Final round has a ChampionCard if a winner exists
- [ ] Bracket scrolls horizontally if wider than viewport
- [ ] TBD slots show dimmed italic placeholder

**Step 2: Fix any visual discrepancies**, then commit:

```bash
git add -p
git commit -m "fix(brackets): visual polish from verification"
```

---

## Execution Notes

- The `~` import alias resolves to `apps/web/src` — use it for local imports within the web app
- The `@` alias resolves to `packages/ui/src` — only needed for shadcn components like `@/lib/utils`
- `lucide-react` is already a dependency of `@dpt/ui` and available
- No new packages need installing
- Match `position` values in the database are 0-indexed (the math above assumes this)
- If `position` values turn out to be 1-indexed in the DB, subtract 1 before passing to `topY`/`centerY`
