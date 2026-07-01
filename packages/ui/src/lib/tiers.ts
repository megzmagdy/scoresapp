import type { Tier, TierLabel } from '@dpt/types';
import { GOLD } from './theme';

const RANK_COLORS: Record<number, string> = {
  1: GOLD,
  2: '#C0C0C0',
  3: '#CD7F32',
};

export function getRankColor(rank: number, fallback = '#444'): string {
  return RANK_COLORS[rank] ?? fallback;
}

export const TIERS: Tier[] = [
  { label: 'LEGEND', min: 0.75, color: '#FFD700' },
  { label: 'ELITE',  min: 0.50, color: '#C0C0C0' },
  { label: 'PRO',    min: 0.25, color: '#CD7F32' },
  { label: 'ROOKIE', min: 0,    color: '#ea785e' },
];

export function getTier(score: number, maxScore: number): Tier {
  const ratio = maxScore > 0 ? score / maxScore : 0;
  return TIERS.find((t) => ratio >= t.min) ?? TIERS[3];
}

export function getTierMinPoints(tier: TierLabel, maxScore: number): number {
  const t = TIERS.find((t) => t.label === tier);
  return t ? Math.floor(t.min * maxScore) : 0;
}
