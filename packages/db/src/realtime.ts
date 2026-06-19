import { supabase } from './client';
import type { Player, Match } from '@dpt/types';

export function subscribeToPlayers(onUpdate: (players: Player[]) => void) {
  return supabase
    .channel('players-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'players' },
      async () => {
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .order('total_points', { ascending: false });
        if (error) { console.error('subscribeToPlayers refetch failed:', error); return; }
        if (data) onUpdate(data);
      }
    )
    .subscribe();
}

export function subscribeToMatches(
  tournamentId: string,
  onUpdate: (matches: Match[]) => void
) {
  return supabase
    .channel(`matches-${tournamentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'matches',
        filter: `tournament_id=eq.${tournamentId}`,
      },
      async () => {
        const { data, error } = await supabase
          .from('matches')
          .select('*')
          .eq('tournament_id', tournamentId)
          .order('round')
          .order('position');
        if (error) { console.error('subscribeToMatches refetch failed:', error); return; }
        if (data) onUpdate(data);
      }
    )
    .subscribe();
}
