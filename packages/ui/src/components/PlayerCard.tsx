import { cn } from '../lib/utils';
import { TierBadge } from './TierBadge';
import type { Player, Tier } from '@dpt/types';

const AVATAR_COLOR = '#ca832a';
const MEDAL_COLORS = ['#d4af37', '#c0c0c0', '#cd7f32'];

interface PlayerCardProps {
  player: Player;
  rank: number;
  tier: Tier;
  flash?: 'up' | 'down' | null;
  className?: string;
}

export function PlayerCard({ player, rank, tier, flash, className }: PlayerCardProps) {
  const isTop3 = rank <= 3;
  const medalColor = isTop3 ? MEDAL_COLORS[rank - 1] : undefined;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-full border px-3 py-2 transition-all duration-300',
        className
      )}
      style={{
        background: isTop3
          ? `linear-gradient(90deg, ${medalColor}0d, #111)`
          : '#111111',
        borderColor: isTop3
          ? `${medalColor}44`
          : flash === 'up'
          ? '#22d3ee44'
          : flash === 'down'
          ? '#f8717144'
          : '#2e2e2e',
      }}
    >
      <div
        className="w-8 shrink-0 text-center font-black text-sm"
        style={{ color: isTop3 ? medalColor : '#ca832a' }}
      >
        {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
      </div>

      <div
        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-black shrink-0"
        style={{ background: AVATAR_COLOR }}
      >
        {player.name[0].toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate text-[#e5e5e5]">{player.name}</div>
        <TierBadge tier={tier} />
      </div>

      <div
        className="font-black text-base text-right min-w-[65px]"
        style={{ color: flash === 'up' ? '#4ade80' : flash === 'down' ? '#f87171' : tier.color }}
      >
        {player.total_points.toLocaleString()}
        <span className="text-xs text-[#475569] ml-1">pts</span>
      </div>
    </div>
  );
}
