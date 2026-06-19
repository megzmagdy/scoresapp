import { supabase } from '../client';
import type { Tournament, TournamentParticipantWithDetails } from '@dpt/types';

export async function getTournaments(): Promise<Tournament[]> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getTournament(id: string): Promise<Tournament> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createTournament(
  payload: Omit<Tournament, 'id' | 'created_at'>
): Promise<Tournament> {
  const { data, error } = await supabase
    .from('tournaments')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTournamentStatus(
  id: string,
  status: Tournament['status']
): Promise<void> {
  const { error } = await supabase
    .from('tournaments')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

export async function getTournamentParticipants(
  tournamentId: string
): Promise<TournamentParticipantWithDetails[]> {
  const { data, error } = await supabase
    .from('tournament_participants')
    .select(`*, players(*), teams(*, team_members(player_id, players(*)))`)
    .eq('tournament_id', tournamentId)
    .order('bracket_position', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data as any[]).map((p) => ({
    ...p,
    team: p.teams
      ? {
          id: p.teams.id,
          created_at: p.teams.created_at,
          players: (p.teams.team_members as any[]).map((m: any) => m.players),
        }
      : undefined,
    teams: undefined,
  }));
}

export async function addParticipant(payload: {
  tournament_id: string;
  player_id?: string;
  team_id?: string;
  bracket_position?: number;
}): Promise<void> {
  const { error } = await supabase.from('tournament_participants').insert(payload);
  if (error) throw error;
}

export async function awardPoints(participantId: string, points: number): Promise<void> {
  const { error } = await supabase
    .from('tournament_participants')
    .update({ points_awarded: points })
    .eq('id', participantId);
  if (error) throw error;
}
