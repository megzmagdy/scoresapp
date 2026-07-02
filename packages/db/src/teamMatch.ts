import type { TeamMember } from '@dpt/types';

export function findMatchingTeamId(
  rows: TeamMember[],
  playerA: string,
  playerB: string
): string | null {
  const byTeam = new Map<string, Set<string>>();
  for (const row of rows) {
    const members = byTeam.get(row.team_id) ?? new Set<string>();
    members.add(row.player_id);
    byTeam.set(row.team_id, members);
  }
  for (const [teamId, members] of byTeam) {
    if (members.size === 2 && members.has(playerA) && members.has(playerB)) {
      return teamId;
    }
  }
  return null;
}
