-- generateBracket's upsert targets (tournament_id, round, position) via on_conflict,
-- but no unique constraint on that triple ever existed, so PostgREST rejects the
-- upsert with "no unique or exclusion constraint matching the ON CONFLICT specification".
alter table matches
  add constraint matches_tournament_round_position_key unique (tournament_id, round, position);
