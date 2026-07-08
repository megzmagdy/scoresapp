import type { TournamentStatus, BracketFormat, TournamentType } from '@dpt/types';
import { GOLD } from '~/lib/theme';

export const STATUS_CONFIG: Record<TournamentStatus, { color: string; label: string }> = {
  ongoing:   { color: '#4ade80', label: 'Live' },
  upcoming:  { color: GOLD,     label: 'Upcoming' },
  completed: { color: '#555',   label: 'Completed' },
};

export const FORMAT_LABEL: Record<BracketFormat, string> = {
  R32: 'Round of 32',
  R16: 'Round of 16',
  QF: 'Quarter Finals',
};

export const TYPE_LABEL: Record<TournamentType, string> = {
  individual: 'Individual',
  team: 'Team',
};
