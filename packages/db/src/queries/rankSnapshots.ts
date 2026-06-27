import { supabase } from '../client';
import { requireAuth } from '../auth';
import type { RankSnapshot, SnapshotType } from '@dpt/types';

export async function takeRankSnapshot(type: SnapshotType): Promise<void> {
  await requireAuth();
  const { data: players, error } = await supabase
    .from('players')
    .select('id, total_points')
    .order('total_points', { ascending: false })
    .order('id', { ascending: true });
  if (error) throw error;

  if (players.length === 0) return;

  const snapshots = players.map((p, i) => ({
    player_id: p.id,
    rank: i + 1,
    total_points: p.total_points,
    snapshot_type: type,
  }));

  const { error: insertError } = await supabase
    .from('rank_snapshots')
    .insert(snapshots);
  if (insertError) throw insertError;
}

export async function getLatestSnapshots(): Promise<RankSnapshot[]> {
  const timeResult = await supabase
    .from('rank_snapshots')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (timeResult.error) throw timeResult.error;
  if (!timeResult.data) return [];

  const { data, error } = await supabase
    .from('rank_snapshots')
    .select('*')
    .eq('created_at', timeResult.data.created_at);
  if (error) throw error;
  return data;
}

export async function getLastSnapshotTime(): Promise<string | null> {
  const { data, error } = await supabase
    .from('rank_snapshots')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.created_at ?? null;
}
