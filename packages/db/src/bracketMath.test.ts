import { describe, it, expect } from 'vitest';
import { getTotalRounds, getCurrentRound } from './bracketMath';
import type { Match } from '@dpt/types';

function match(round: number, position: number, winner_id: string | null): Match {
  return {
    id: `${round}-${position}`,
    tournament_id: 't1',
    round,
    position,
    participant1_id: null,
    participant2_id: null,
    score1: null,
    score2: null,
    winner_id,
  };
}

describe('getTotalRounds', () => {
  it('returns 3 for QF (8 slots)', () => {
    expect(getTotalRounds('QF')).toBe(3);
  });
  it('returns 4 for R16 (16 slots)', () => {
    expect(getTotalRounds('R16')).toBe(4);
  });
  it('returns 5 for R32 (32 slots)', () => {
    expect(getTotalRounds('R32')).toBe(5);
  });
});

describe('getCurrentRound', () => {
  it('returns null when there are no matches', () => {
    expect(getCurrentRound([])).toBeNull();
  });
  it('returns round 1 when no match has a winner yet', () => {
    const matches = [match(1, 1, null), match(1, 2, null), match(2, 1, null)];
    expect(getCurrentRound(matches)).toBe(1);
  });
  it('returns round 2 once all round 1 matches have a winner', () => {
    const matches = [match(1, 1, 'a'), match(1, 2, 'b'), match(2, 1, null)];
    expect(getCurrentRound(matches)).toBe(2);
  });
  it("returns 'complete' once the final match has a winner", () => {
    const matches = [match(1, 1, 'a'), match(1, 2, 'b'), match(2, 1, 'a')];
    expect(getCurrentRound(matches)).toBe('complete');
  });
});
