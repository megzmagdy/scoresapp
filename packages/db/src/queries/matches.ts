import { supabase } from '../client';
import { requireAuth } from '../auth';
import type { Match } from '@dpt/types';

export async function getMatches(tournamentId: string): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('round', { ascending: true })
    .order('position', { ascending: true });
  if (error) throw error;
  return data;
}

export async function upsertMatch(
  match: Partial<Match> & { tournament_id: string; round: number; position: number }
): Promise<Match> {
  await requireAuth();
  const { data, error } = await supabase
    .from('matches')
    .upsert(match, { onConflict: 'tournament_id,round,position' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function saveMatchResult(
  id: string,
  score1: number,
  score2: number,
  winner_id: string
): Promise<void> {
  await requireAuth();
  const { error } = await supabase
    .from('matches')
    .update({ score1, score2, winner_id })
    .eq('id', id);
  if (error) throw error;
}
