import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { groupMatchesByDay } from './scheduleMath';
import type { Match } from '@dpt/types';

// This package's tsconfig doesn't include @types/node (it targets the vite/browser
// runtime), so `process` isn't ambiently typed. Vitest itself runs on Node and
// mutating process.env.TZ is the reliable way to pin the local timezone for a test.
declare const process: { env: Record<string, string | undefined> };

const originalTz = process.env.TZ;

beforeAll(() => {
  process.env.TZ = 'UTC';
});

afterAll(() => {
  if (originalTz === undefined) delete process.env.TZ;
  else process.env.TZ = originalTz;
});

function match(id: string, scheduled_at: string | null): Match {
  return {
    id, tournament_id: 't1', round: 1, position: 0,
    participant1_id: null, participant2_id: null,
    score1: null, score2: null, winner_id: null,
    scheduled_at, venue: null,
  };
}

describe('groupMatchesByDay', () => {
  it('returns an empty array for no matches', () => {
    expect(groupMatchesByDay([])).toEqual([]);
  });

  it('filters out matches with no scheduled_at', () => {
    const matches = [match('a', null), match('b', '2026-07-05T15:00:00Z')];
    expect(groupMatchesByDay(matches)).toHaveLength(1);
  });

  it('groups matches on the same local day together, sorted by time', () => {
    const matches = [
      match('later', '2026-07-05T18:00:00Z'),
      match('earlier', '2026-07-05T10:00:00Z'),
    ];
    const groups = groupMatchesByDay(matches);
    expect(groups).toHaveLength(1);
    expect(groups[0].matches.map(m => m.id)).toEqual(['earlier', 'later']);
  });

  it('splits matches on different days into separate groups, ordered chronologically', () => {
    const matches = [
      match('day2', '2026-07-06T10:00:00Z'),
      match('day1', '2026-07-05T10:00:00Z'),
    ];
    const groups = groupMatchesByDay(matches);
    expect(groups).toHaveLength(2);
    expect(groups[0].matches[0].id).toBe('day1');
    expect(groups[1].matches[0].id).toBe('day2');
  });
});
