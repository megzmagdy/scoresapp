import type { CSSProperties } from 'react';
import type { Match } from '@dpt/types';
import { centerY, COL_W, COL_GAP, LABEL_H } from './bracketMath';
import { GOLD } from '~/lib/theme';

interface BracketSVGProps {
  rounds: Map<number, Match[]>;
  totalHeight: number;
  totalWidth: number;
  sortedRounds: number[]; 
}

export function BracketSVG({ rounds, totalHeight, totalWidth, sortedRounds }: BracketSVGProps) {
  if (sortedRounds.length < 2) return null;

  const paths: string[] = [];

  for (let i = 0; i < sortedRounds.length - 1; i++) {
    const R1 = sortedRounds[i + 1];
    const xRight = i * (COL_W + COL_GAP) + COL_W;
    const xLeft = (i + 1) * (COL_W + COL_GAP);
    const xMid = xRight + COL_GAP / 2;

    const nextMatches = rounds.get(R1) ?? [];

    for (const nextMatch of nextMatches) {
      const P = nextMatch.position;
      const absYTop = centerY(i + 1, P * 2);
      const absYBottom = centerY(i + 1, P * 2 + 1);
      const absYMid = (absYTop + absYBottom) / 2;

      paths.push(
        `M ${xRight} ${absYTop} H ${xMid} V ${absYBottom} H ${xRight} M ${xMid} ${absYMid} H ${xLeft}`
      );
    }
  }

  const svgStyle: CSSProperties = {
    position: 'absolute',
    top: LABEL_H,
    left: 0,
    pointerEvents: 'none',
    overflow: 'visible',
  };

  return (
    <svg style={svgStyle} width={totalWidth} height={totalHeight}>
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={GOLD}
          strokeOpacity={0.35}
          strokeWidth={1.5}
        />
      ))}
    </svg>
  );
}
