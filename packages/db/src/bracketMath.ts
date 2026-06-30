import type { BracketFormat, Match } from '@dpt/types';

const SLOTS: Record<BracketFormat, number> = { QF: 8, R16: 16, R32: 32 };

export function getTotalRounds(format: BracketFormat): number {
  return Math.log2(SLOTS[format]);
}

export function getCurrentRound(matches: Match[]): number | 'complete' | null {
  if (matches.length === 0) return null;
  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
  for (const r of rounds) {
    const roundMatches = matches.filter((m) => m.round === r);
    if (roundMatches.some((m) => m.winner_id === null)) return r;
  }
  return 'complete';
}
