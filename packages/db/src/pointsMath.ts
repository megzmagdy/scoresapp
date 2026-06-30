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

  // Never lost a recorded match. Champion is inferred as "reached the final
  // round and has no recorded loss", rather than "won the final match" (i.e.
  // not `finalMatch?.winner_id === participantId`) — this also covers the
  // case where the final has been played but winner_id hasn't been recorded
  // yet, or the final match row doesn't exist in `matches` at all.
  //
  // NOTE: this can't distinguish "reached the final, not yet played" from
  // "won the final, winner_id not recorded" — both read as champion (100).
  // Callers showing this as a suggestion before the bracket is complete
  // should treat it accordingly (e.g. gate on getCurrentRound() === 'complete').
  const reachedFinal = participantMatches.some((m) => m.round === totalRounds);

  // Returns 0 both for "lost in round 1" and for "still alive, hasn't lost
  // yet, hasn't reached the final" — there's no recorded loss to grade in
  // either case, and this function has no way to express "still alive,
  // undetermined" without changing its return type.
  return reachedFinal ? SUGGESTED_POINTS_BY_ROUNDS_FROM_FINAL[0] : 0;
}
