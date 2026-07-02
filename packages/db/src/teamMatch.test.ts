import { describe, it, expect } from 'vitest';
import { findMatchingTeamId } from './teamMatch';

describe('findMatchingTeamId', () => {
  it('returns null when there are no rows', () => {
    expect(findMatchingTeamId([], 'p1', 'p2')).toBeNull();
  });

  it('returns null when no team contains both players', () => {
    const rows = [
      { team_id: 't1', player_id: 'p1' },
      { team_id: 't2', player_id: 'p2' },
    ];
    expect(findMatchingTeamId(rows, 'p1', 'p2')).toBeNull();
  });

  it('returns the team id when a team has exactly this pair', () => {
    const rows = [
      { team_id: 't1', player_id: 'p1' },
      { team_id: 't1', player_id: 'p2' },
    ];
    expect(findMatchingTeamId(rows, 'p1', 'p2')).toBe('t1');
  });

  it('ignores a team that only has one of the two players', () => {
    const rows = [
      { team_id: 't1', player_id: 'p1' },
      { team_id: 't2', player_id: 'p1' },
      { team_id: 't2', player_id: 'p3' },
    ];
    expect(findMatchingTeamId(rows, 'p1', 'p2')).toBeNull();
  });

  it('ignores a team where a third player is also present', () => {
    const rows = [
      { team_id: 't1', player_id: 'p1' },
      { team_id: 't1', player_id: 'p2' },
      { team_id: 't1', player_id: 'p3' },
    ];
    expect(findMatchingTeamId(rows, 'p1', 'p2')).toBeNull();
  });
});
