import { supabase } from '../client';
import { requireAuth } from '../auth';
import type { Player } from '@dpt/types';

export async function getPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('total_points', { ascending: false });
  if (error) throw error;
  return data;
}

export async function upsertPlayer(player: Omit<Player, 'created_at'>): Promise<Player> {
  await requireAuth();
  const { data, error } = await supabase
    .from('players')
    .upsert(player)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePlayer(id: string): Promise<void> {
  await requireAuth();
  const { error } = await supabase.from('players').delete().eq('id', id);
  if (error) throw error;
}

export async function updatePlayerPoints(id: string, total_points: number): Promise<void> {
  await requireAuth();
  const { error } = await supabase
    .from('players')
    .update({ total_points })
    .eq('id', id);
  if (error) throw error;
}
