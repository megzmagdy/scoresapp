import { cn } from '../lib/utils';
import type { Tier } from '@dpt/types';

interface TierBadgeProps {
  tier: Tier;
  className?: string;
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  return (
    <span
      className={cn('text-[10px] font-extrabold tracking-widest uppercase opacity-60', className)}
      style={{ color: tier.color }}
    >
      {tier.label}
    </span>
  );
}
