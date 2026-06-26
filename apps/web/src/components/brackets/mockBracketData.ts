import type { Tournament, Match, TournamentParticipantWithDetails } from '@dpt/types';

export const mockTournaments: Tournament[] = [
  { id: 't1', name: 'Mansoura Open', date: '2026-03-01', venue: 'Mansoura Padel Point', bracket_format: 'R16', tournament_type: 'individual', status: 'completed', created_at: '' },
  { id: 't2', name: 'Ace Town Championship', date: '2026-04-15', venue: 'Ace Town Complex', bracket_format: 'R16', tournament_type: 'individual', status: 'completed', created_at: '' },
  { id: 't3', name: 'Padel H Masters', date: '2026-05-20', venue: 'Padel H', bracket_format: 'QF', tournament_type: 'individual', status: 'ongoing', created_at: '' },
];

const mkP = (id: string, name: string, seed: number): TournamentParticipantWithDetails => ({
  id,
  tournament_id: 't1',
  player_id: `player-${id}`,
  team_id: null,
  bracket_position: seed,
  points_awarded: 0,
  player: { id: `player-${id}`, name, total_points: 0, created_at: '' },
});

export const mockParticipants: TournamentParticipantWithDetails[] = [
  mkP('p1',  'Gutiérrez', 1),
  mkP('p2',  'Khalil',    16),
  mkP('p3',  'Navarro',   8),
  mkP('p4',  'Soto',      9),
  mkP('p5',  'El-Sayed',  5),
  mkP('p6',  'Ruiz',      12),
  mkP('p7',  'Hesham',    4),
  mkP('p8',  'Adel',      13),
  mkP('p9',  'Fernández', 6),
  mkP('p10', 'Nabil',     11),
  mkP('p11', 'Mostafa',   3),
  mkP('p12', 'Ramírez',   14),
  mkP('p13', 'Khaled',    7),
  mkP('p14', 'Saad',      10),
  mkP('p15', 'Ortega',    2),
  mkP('p16', 'Fawzy',     15),
];

// Matches: round 1 (R16), round 2 (QF), round 3 (SF), round 4 (Final)
export const mockMatches: Match[] = [
  // Round 1 — Round of 16 (8 matches)
  { id: 'm1',  tournament_id: 't1', round: 1, position: 0, participant1_id: 'p1',  participant2_id: 'p2',  score1: 16, score2: 14, winner_id: 'p1'  },
  { id: 'm2',  tournament_id: 't1', round: 1, position: 1, participant1_id: 'p3',  participant2_id: 'p4',  score1: 21, score2: 18, winner_id: 'p3'  },
  { id: 'm3',  tournament_id: 't1', round: 1, position: 2, participant1_id: 'p5',  participant2_id: 'p6',  score1: 15, score2: 21, winner_id: 'p6'  },
  { id: 'm4',  tournament_id: 't1', round: 1, position: 3, participant1_id: 'p7',  participant2_id: 'p8',  score1: 19, score2: 17, winner_id: 'p7'  },
  { id: 'm5',  tournament_id: 't1', round: 1, position: 4, participant1_id: 'p9',  participant2_id: 'p10', score1: 21, score2: 12, winner_id: 'p9'  },
  { id: 'm6',  tournament_id: 't1', round: 1, position: 5, participant1_id: 'p11', participant2_id: 'p12', score1: 16, score2: 20, winner_id: 'p12' },
  { id: 'm7',  tournament_id: 't1', round: 1, position: 6, participant1_id: 'p13', participant2_id: 'p14', score1: 21, score2: 14, winner_id: 'p13' },
  { id: 'm8',  tournament_id: 't1', round: 1, position: 7, participant1_id: 'p15', participant2_id: 'p16', score1: 13, score2: 21, winner_id: 'p16' },

  // Round 2 — Quarter Finals (4 matches)
  { id: 'm9',  tournament_id: 't1', round: 2, position: 0, participant1_id: 'p1',  participant2_id: 'p3',  score1: 21, score2: 18, winner_id: 'p1'  },
  { id: 'm10', tournament_id: 't1', round: 2, position: 1, participant1_id: 'p6',  participant2_id: 'p7',  score1: 15, score2: 21, winner_id: 'p7'  },
  { id: 'm11', tournament_id: 't1', round: 2, position: 2, participant1_id: 'p9',  participant2_id: 'p12', score1: 21, score2: 16, winner_id: 'p9'  },
  { id: 'm12', tournament_id: 't1', round: 2, position: 3, participant1_id: 'p13', participant2_id: 'p16', score1: 19, score2: 21, winner_id: 'p16' },

  // Round 3 — Semi Finals (2 matches)
  { id: 'm13', tournament_id: 't1', round: 3, position: 0, participant1_id: 'p1',  participant2_id: 'p7',  score1: 21, score2: 17, winner_id: 'p1'  },
  { id: 'm14', tournament_id: 't1', round: 3, position: 1, participant1_id: 'p9',  participant2_id: 'p16', score1: 21, score2: 19, winner_id: 'p9'  },

  // Round 4 — Final (1 match)
  { id: 'm15', tournament_id: 't1', round: 4, position: 0, participant1_id: 'p1',  participant2_id: 'p9',  score1: 21, score2: 18, winner_id: 'p1'  },
];
