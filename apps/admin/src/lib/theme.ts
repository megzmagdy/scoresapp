import type { Venue, TournamentStatus } from '@dpt/types';

export const GOLD = '#E8B53A';
export const MONO = "'Source Code Pro', monospace";
export const ARCHIVO = "'Archivo', sans-serif";

export const VENUES: Venue[] = ['Mansoura Padel Point', 'Ace Town Complex', 'Padel H'];

export function statusColor(s: TournamentStatus): string {
  if (s === 'upcoming') return '#60a5fa';
  if (s === 'ongoing') return GOLD;
  return '#4ade80';
}
