import { supabase } from '../client';
import { requireAuth } from '../auth';
import type { Tournament, TournamentParticipantWithDetails, ParticipantPlayerPoints } from '@dpt/types';
import { takeRankSnapshot } from './rankSnapshots';

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
  await requireAuth();
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
  await requireAuth();
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
  await requireAuth();
  const { error } = await supabase.from('tournament_participants').insert(payload);
  if (error) throw error;
}

export async function getParticipantPlayerPoints(
  participantId: string
): Promise<ParticipantPlayerPoints[]> {
  const { data, error } = await supabase
    .from('participant_player_points')
    .select('*')
    .eq('participant_id', participantId);
  if (error) throw error;
  return data;
}

export async function savePlayerPoints(
  participantId: string,
  entries: { player_id: string; points: number }[]
): Promise<void> {
  await requireAuth();

  const existing = await getParticipantPlayerPoints(participantId);
  const existingByPlayer = Object.fromEntries(existing.map((e) => [e.player_id, e.points]));

  for (const entry of entries) {
    const oldPoints = existingByPlayer[entry.player_id] ?? 0;
    const delta = entry.points - oldPoints;

    const { error: upsertError } = await supabase
      .from('participant_player_points')
      .upsert(
        {
          participant_id: participantId,
          player_id: entry.player_id,
          points: entry.points,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'participant_id,player_id' }
      );
    if (upsertError) throw upsertError;

    if (delta !== 0) {
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('total_points')
        .eq('id', entry.player_id)
        .single();
      if (playerError) throw playerError;

      const { error: updateError } = await supabase
        .from('players')
        .update({ total_points: player.total_points + delta })
        .eq('id', entry.player_id);
      if (updateError) throw updateError;
    }
  }

  const total = entries.reduce((sum, e) => sum + e.points, 0);
  const { error: totalError } = await supabase
    .from('tournament_participants')
    .update({ points_awarded: total })
    .eq('id', participantId);
  if (totalError) throw totalError;

  await takeRankSnapshot('auto');
}
