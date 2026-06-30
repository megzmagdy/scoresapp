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

export interface MatchShell {
  tournament_id: string;
  round: number;
  position: number;
  participant1_id: string | null;
  participant2_id: string | null;
}

export function buildBracketShells(
  tournamentId: string,
  format: BracketFormat,
  seededParticipantIds: (string | null)[]
): MatchShell[] {
  const totalRounds = getTotalRounds(format);
  const shells: MatchShell[] = [];

  const round1Count = SLOTS[format] / 2;
  for (let i = 0; i < round1Count; i++) {
    shells.push({
      tournament_id: tournamentId,
      round: 1,
      position: i + 1,
      participant1_id: seededParticipantIds[i * 2] ?? null,
      participant2_id: seededParticipantIds[i * 2 + 1] ?? null,
    });
  }

  for (let round = 2; round <= totalRounds; round++) {
    const matchCount = round1Count / Math.pow(2, round - 1);
    for (let position = 1; position <= matchCount; position++) {
      shells.push({
        tournament_id: tournamentId,
        round,
        position,
        participant1_id: null,
        participant2_id: null,
      });
    }
  }

  return shells;
}
