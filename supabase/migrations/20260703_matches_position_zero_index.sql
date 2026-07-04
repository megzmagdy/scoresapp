-- buildBracketShells previously generated 1-indexed match.position values, but the
-- web bracket renderer (bracketLayout.ts / BracketColumn / BracketSVG) has always
-- expected 0-indexed positions, causing misaligned cards and broken connector lines.
-- The app code is now fixed to generate/consume 0-indexed positions; renumber any
-- existing rows (written under the old convention) to match.
update matches set position = position - 1;
