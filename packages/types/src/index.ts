export type TierLabel = 'LEGEND' | 'ELITE' | 'PRO' | 'ROOKIE';
export type BracketFormat = 'R16' | 'QF';
export type TournamentType = 'individual' | 'team';
export type TournamentStatus = 'upcoming' | 'ongoing' | 'completed';
export type AnnouncementType = 'general' | 'tournament' | 'rules' | 'rewards';
export type Venue = 'Mansoura Padel Point' | 'Ace Town Complex' | 'Padel H';

export interface Player {
  id: string;
  name: string;
  code: string | null;
  venue: string | null;
  total_points: number;
  created_at: string;
}

export type SnapshotType = 'auto' | 'tournament_close' | 'manual';

export interface RankSnapshot {
  id: string;
  player_id: string;
  rank: number;
  total_points: number;
  snapshot_type: SnapshotType;
  created_at: string;
}

export interface Team {
  id: string;
  created_at: string;
}

export interface TeamMember {
  team_id: string;
  player_id: string;
}

export interface TeamWithPlayers extends Team {
  players: Player[];
}

export interface Tournament {
  id: string;
  name: string;
  date: string;
  venue: Venue;
  bracket_format: BracketFormat;
  tournament_type: TournamentType;
  status: TournamentStatus;
  created_at: string;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  player_id: string | null;
  team_id: string | null;
  bracket_position: number | null;
  points_awarded: number;
}

export interface TournamentParticipantWithDetails extends TournamentParticipant {
  player?: Player;
  team?: TeamWithPlayers;
}

export interface Match {
  id: string;
  tournament_id: string;
  round: number;
  position: number;
  participant1_id: string | null;
  participant2_id: string | null;
  score1: number | null;
  score2: number | null;
  winner_id: string | null;
}

export interface MatchWithParticipants extends Match {
  participant1?: TournamentParticipantWithDetails;
  participant2?: TournamentParticipantWithDetails;
  winner?: TournamentParticipantWithDetails;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  published_at: string;
}

export interface Tier {
  label: TierLabel;
  min: number;
  color: string;
}
