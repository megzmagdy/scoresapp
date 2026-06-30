-- Create participant_player_points table
create table if not exists participant_player_points (
  id             uuid primary key default gen_random_uuid(),
  participant_id uuid not null references tournament_participants(id) on delete cascade,
  player_id      uuid not null references players(id) on delete cascade,
  points         int not null default 0,
  unique (participant_id, player_id)
);

create index if not exists participant_player_points_participant
  on participant_player_points (participant_id);
