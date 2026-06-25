// apps/web/src/components/brackets/bracketMath.ts
import type { TournamentParticipantWithDetails, TournamentType } from '@dpt/types';

export const CARD_H = 88;
export const GAP = 8;
export const SLOT = CARD_H + GAP; // 96
export const COL_W = 240;
export const COL_GAP = 56;
export const LABEL_H = 32; // space above each column for round label

// R = round number (1-indexed), P = position (0-indexed)
export function centerY(R: number, P: number): number {
  const scale = Math.pow(2, R - 1);
  return P * SLOT * scale + CARD_H / 2 + SLOT * (scale - 1) / 2;
}

export function topY(R: number, P: number): number {
  return centerY(R, P) - CARD_H / 2;
}

export function bracketTotalHeight(numRound1Matches: number): number {
  if (numRound1Matches <= 0) return 0;
  return numRound1Matches * SLOT - GAP;
}

export function bracketTotalWidth(numRounds: number): number {
  return numRounds * COL_W + (numRounds - 1) * COL_GAP;
}

/** matchCount must be a power of 2 */
export function getRoundLabel(matchCount: number): string {
  if (matchCount === 1) return 'Final';
  if (matchCount === 2) return 'Semi Finals';
  if (matchCount === 4) return 'Quarter Finals';
  return `Round of ${matchCount * 2}`;
}

export function getParticipantName(
  participant: TournamentParticipantWithDetails | undefined,
  type: TournamentType
): string {
  if (!participant) return 'TBD';
  if (type === 'individual') return participant.player?.name ?? 'TBD';
  return participant.team?.players.map((p) => p.name).join(' / ') ?? 'TBD';
}

export function getParticipantSeed(
  participant: TournamentParticipantWithDetails | undefined
): number | null {
  return participant?.bracket_position ?? null;
}
