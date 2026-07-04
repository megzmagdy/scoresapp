-- The "testMegz" tournament's bracket was generated before the match.position
-- 0-indexing fix landed (see 20260703_matches_position_zero_index.sql for the
-- original fix + full-table renumber). Its rows were never swept into that
-- migration and are still 1-indexed, causing the same broken bracket-connector
-- rendering. Scoped to this one tournament only -- every other tournament's
-- positions are already correct and must not be touched again.
update matches
set position = position - 1
where tournament_id = 'f000c117-2844-4e23-a7ad-c353b13f0693';
