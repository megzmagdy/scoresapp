import { describe, it, expect } from 'vitest';
import { getSuggestedPoints } from './pointsMath';
import type { Match } from '@dpt/types';

function match(round: number, position: number, p1: string | null, p2: string | null, winner: string | null): Match {
  return { id: `${round}-${position}`, tournament_id: 't1', round, position, participant1_id: p1, participant2_id: p2, sets: [], winner_id: winner };
}

describe('getSuggestedPoints', () => {
  // QF format -> totalRounds = 3
  const matches: Match[] = [
    match(1, 1, 'champ', 'r1-loser', 'champ'),
    match(1, 2, 'semi-loser', 'qf-loser', 'semi-loser'),
    match(2, 1, 'champ', 'semi-loser', 'champ'),
    match(3, 1, 'champ', null, null),
  ];

  it('suggests the champion tier for the eventual final winner', () => {
    expect(getSuggestedPoints('champ', matches, 3)).toBe(100);
  });

  it('suggests the runner-up tier for the finalist who lost', () => {
    expect(getSuggestedPoints('semi-loser', matches, 3)).toBeLessThan(100);
  });

  it('suggests 0 for a participant not found in any match', () => {
    expect(getSuggestedPoints('nobody', matches, 3)).toBe(0);
  });
});
