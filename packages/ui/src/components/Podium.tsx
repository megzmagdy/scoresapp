import type { Player } from '@dpt/types';
import { MEDAL_COLORS, AVATAR_COLOR } from '../lib/constants';

const HEIGHTS = [138, 100, 82];
const AVATAR_SIZES = [62, 48, 42];

interface PodiumProps {
  top3: [Player | undefined, Player | undefined, Player | undefined];
}

export function Podium({ top3 }: PodiumProps) {
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
                background: AVATAR_COLOR,
                fontSize: AVATAR_SIZES[rankIdx] * 0.5,
                boxShadow: `0 0 18px ${MEDAL_COLORS[rankIdx]}60`,
              }}
            >
              {player.name[0].toUpperCase()}
            </div>
            <div className="font-black text-sm text-white text-center max-w-[80px] truncate">
              {player.name}
            </div>
            <div className="font-semibold text-base" style={{ color: MEDAL_COLORS[rankIdx] }}>
              {player.total_points.toLocaleString()}
            </div>
            <div
              className="w-full flex items-center justify-center text-3xl font-black rounded-[20px_4px_20px_4px]"
              style={{
                height: HEIGHTS[rankIdx],
                background: `linear-gradient(200deg, ${MEDAL_COLORS[rankIdx]}70, ${MEDAL_COLORS[rankIdx]}0a)`,
                border: `2px solid ${MEDAL_COLORS[rankIdx]}90`,
                color: MEDAL_COLORS[rankIdx],
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
