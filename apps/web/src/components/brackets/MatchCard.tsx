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
