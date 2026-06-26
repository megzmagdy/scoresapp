-- Add code and venue columns to players
alter table players add column if not exists code  text;
alter table players add column if not exists venue text;

-- Create rank_snapshots table
create table if not exists rank_snapshots (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null references players(id) on delete cascade,
  rank          int not null,
  total_points  int not null,
  snapshot_type text not null check (snapshot_type in ('auto', 'tournament_close', 'manual')),
  created_at    timestamptz default now()
);

create index if not exists rank_snapshots_player_created
  on rank_snapshots (player_id, created_at desc);
