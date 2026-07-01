import { Trophy } from 'lucide-react';
import type { TournamentParticipantWithDetails, TournamentType } from '@dpt/types';
import { COL_W, COL_GAP, LABEL_H, getParticipantName } from './bracketLayout';
import { GOLD, MONO } from '~/lib/theme';

interface ChampionCardProps {
  champion: TournamentParticipantWithDetails;
  tournamentName: string;
  tournamentType: TournamentType;
  numColumns: number;       
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
      <span
        style={{
          display: 'block',
          fontFamily: MONO,
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
