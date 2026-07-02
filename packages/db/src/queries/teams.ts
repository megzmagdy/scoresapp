import { supabase } from '../client';
import { requireAuth } from '../auth';
import { findMatchingTeamId } from '../teamMatch';
import type { Team, TeamMember, TeamWithPlayers } from '@dpt/types';

export async function getTeams(): Promise<TeamWithPlayers[]> {
  const { data, error } = await supabase
    .from('teams')
    .select(`*, team_members(player_id, players(*))`);
  if (error) throw error;
  return (data as any[]).map((t) => ({
    id: t.id,
    created_at: t.created_at,
    players: (t.team_members as any[]).map((m: any) => m.players),
  }));
}

export async function createTeam(playerIds: [string, string]): Promise<Team> {
  await requireAuth();
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({})
    .select()
    .single();
  if (teamError) throw teamError;

  const { error: memberError } = await supabase
    .from('team_members')
    .insert(playerIds.map((player_id) => ({ team_id: team.id, player_id })));
  if (memberError) {
    await supabase.from('teams').delete().eq('id', team.id);
    throw memberError;
  }

  return team;
}

export async function getOrCreateTeam(playerIds: [string, string]): Promise<Team> {
  const [a, b] = playerIds;
  const { data: rows, error } = await supabase
    .from('team_members')
    .select('team_id, player_id')
    .in('player_id', [a, b]);
  if (error) throw error;

  const existingTeamId = findMatchingTeamId((rows ?? []) as TeamMember[], a, b);
  if (existingTeamId) {
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', existingTeamId)
      .single();
    if (teamError) throw teamError;
    return team;
  }

  return createTeam(playerIds);
}

export async function deleteTeam(id: string): Promise<void> {
  await requireAuth();
  const { error } = await supabase.from('teams').delete().eq('id', id);
  if (error) throw error;
}
