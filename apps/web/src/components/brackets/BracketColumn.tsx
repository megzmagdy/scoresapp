// apps/web/src/components/brackets/BracketColumn.tsx
import type { Match, TournamentParticipantWithDetails, TournamentType } from '@dpt/types';
import { topY, COL_W, COL_GAP, LABEL_H, getRoundLabel } from './bracketMath';
import { MatchCard } from './MatchCard';

interface BracketColumnProps {
  roundNumber: number;        // 1-indexed view column position (NOT raw DB round number)
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
            style={{ top: LABEL_H + topY(roundNumber, match.position) }}
          />
        );
      })}
    </div>
  );
}
