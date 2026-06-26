import { supabase } from '../client';
import type { RankSnapshot, SnapshotType } from '@dpt/types';

export async function takeRankSnapshot(type: SnapshotType): Promise<void> {
  const { data: players, error } = await supabase
    .from('players')
    .select('id, total_points')
    .order('total_points', { ascending: false });
  if (error) throw error;

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
  const { data, error } = await supabase
    .from('rank_snapshots')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;

  const seen = new Set<string>();
  return data.filter((s) => {
    if (seen.has(s.player_id)) return false;
    seen.add(s.player_id);
    return true;
  });
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
