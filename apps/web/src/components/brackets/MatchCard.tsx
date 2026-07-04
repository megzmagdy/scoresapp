import type { CSSProperties } from 'react';
import type { Match, SetScore, TournamentParticipantWithDetails, TournamentType } from '@dpt/types';
import { CARD_H, COL_W, getParticipantName, getParticipantSeed, formatSchedule } from './bracketLayout';
import { GOLD, MONO } from '~/lib/theme';

const BG_CARD = '#181818';
const BORDER = '#2e2e2e';
const MUTED = '#555';

interface ParticipantRowProps {
  participant: TournamentParticipantWithDetails | undefined;
  sets: SetScore[];
  side: 'p1' | 'p2';
  isWinner: boolean;
  tournamentType: TournamentType;
}

function ParticipantRow({ participant, sets, side, isWinner, tournamentType }: ParticipantRowProps) {
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
            style={{ fontFamily: MONO, color: MUTED }}
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
      {sets.length > 0 && (
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {sets.map((s, i) => (
            <span
              key={i}
              className="text-xs font-bold tabular-nums"
              style={{ color: isWinner ? GOLD : '#666' }}
            >
              {side === 'p1' ? s.p1 : s.p2}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface MatchCardProps {
  match: Match;
  participant1: TournamentParticipantWithDetails | undefined;
  participant2: TournamentParticipantWithDetails | undefined;
  tournamentType: TournamentType;
  style?: CSSProperties;
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
        sets={match.sets}
        side="p1"
        isWinner={winner1}
        tournamentType={tournamentType}
      />
      <div style={{ height: 1, background: BORDER, flexShrink: 0 }} />
      <ParticipantRow
        participant={participant2}
        sets={match.sets}
        side="p2"
        isWinner={winner2}
        tournamentType={tournamentType}
      />
      {(match.scheduled_at || match.venue) && (
        <div className="px-3 py-1 shrink-0" style={{ borderTop: `1px solid ${BORDER}` }}>
          <span className="text-[10px]" style={{ fontFamily: MONO, color: MUTED }}>
            {formatSchedule(match.scheduled_at, match.venue)}
          </span>
        </div>
      )}
    </div>
  );
}
