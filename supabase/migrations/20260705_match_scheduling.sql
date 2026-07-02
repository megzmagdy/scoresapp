alter table matches
  add column scheduled_at timestamptz,
  add column venue text;
