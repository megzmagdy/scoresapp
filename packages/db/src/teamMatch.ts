export interface TeamMemberRow {
  team_id: string;
  player_id: string;
}

export function findMatchingTeamId(
  rows: TeamMemberRow[],
  playerA: string,
  playerB: string
): string | undefined {
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
  return undefined;
}
