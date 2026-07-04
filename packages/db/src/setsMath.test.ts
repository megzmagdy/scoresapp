import { describe, it, expect } from 'vitest';
import { setsWon } from './setsMath';

describe('setsWon', () => {
  it('returns 0-0 for no sets', () => {
    expect(setsWon([])).toEqual({ p1: 0, p2: 0 });
  });

  it('tallies a straight 2-0', () => {
    const sets = [{ p1: 6, p2: 4 }, { p1: 6, p2: 3 }];
    expect(setsWon(sets)).toEqual({ p1: 2, p2: 0 });
  });

  it('tallies a deciding 3rd set', () => {
    const sets = [{ p1: 6, p2: 4 }, { p1: 3, p2: 6 }, { p1: 6, p2: 2 }];
    expect(setsWon(sets)).toEqual({ p1: 2, p2: 1 });
  });

  it('counts a tied set toward neither side', () => {
    const sets = [{ p1: 6, p2: 4 }, { p1: 5, p2: 5 }];
    expect(setsWon(sets)).toEqual({ p1: 1, p2: 0 });
  });
});
