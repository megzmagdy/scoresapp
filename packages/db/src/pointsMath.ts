import type { Match } from '@dpt/types';

// Index 0 = champion, 1 = runner-up, 2 = lost in round (totalRounds - 2), etc.
const SUGGESTED_POINTS_BY_ROUNDS_FROM_FINAL = [100, 60, 30, 15, 5];

export function getSuggestedPoints(
  participantId: string,
  matches: Match[],
  totalRounds: number
): number {
  const participantMatches = matches.filter(
    (m) => m.participant1_id === participantId || m.participant2_id === participantId
  );
  if (participantMatches.length === 0) return 0;

  const lostMatch = participantMatches.find(
    (m) => m.winner_id !== null && m.winner_id !== participantId
  );
  if (lostMatch) {
    const roundsFromFinal = totalRounds - lostMatch.round + 1;
    return SUGGESTED_POINTS_BY_ROUNDS_FROM_FINAL[roundsFromFinal] ?? 0;
  }

  // Never lost a recorded match. They're the champion if they reached
  // (i.e. played in) the final round without losing.
  const reachedFinal = participantMatches.some((m) => m.round === totalRounds);
  return reachedFinal ? SUGGESTED_POINTS_BY_ROUNDS_FROM_FINAL[0] : 0;
}
