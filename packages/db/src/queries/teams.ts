import { supabase } from '../client';
import { requireAuth } from '../auth';
import type { Team, TeamWithPlayers } from '@dpt/types';

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

export async function deleteTeam(id: string): Promise<void> {
  await requireAuth();
  const { error } = await supabase.from('teams').delete().eq('id', id);
  if (error) throw error;
}
