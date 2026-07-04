alter table matches
  drop column score1,
  drop column score2,
  add column sets jsonb not null default '[]'::jsonb;
