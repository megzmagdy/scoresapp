import type { SetScore } from '@dpt/types';

export function setsWon(sets: SetScore[]): { p1: number; p2: number } {
  let p1 = 0;
  let p2 = 0;
  for (const set of sets) {
    if (set.p1 > set.p2) p1++;
    else if (set.p2 > set.p1) p2++;
  }
  return { p1, p2 };
}
