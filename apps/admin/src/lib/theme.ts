import type { Venue, TournamentStatus } from '@dpt/types';
import { GOLD } from '@dpt/ui';

export { GOLD, MONO, ARCHIVO } from '@dpt/ui';

export const VENUES: Venue[] = ['Mansoura Padel Point', 'Ace Town Complex', 'Padel H'];

export function statusColor(s: TournamentStatus): string {
  if (s === 'upcoming') return '#60a5fa';
  if (s === 'ongoing') return GOLD;
  return '#4ade80';
}
