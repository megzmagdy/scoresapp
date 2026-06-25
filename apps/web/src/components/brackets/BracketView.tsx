import type { Match, Tournament, TournamentParticipantWithDetails } from '@dpt/types';
import {
  bracketTotalHeight,
  bracketTotalWidth,
  COL_W,
  COL_GAP,
  LABEL_H,
} from './bracketMath';
import { BracketColumn } from './BracketColumn';
import { BracketSVG } from './BracketSVG';
import { ChampionCard } from './ChampionCard';

interface BracketViewProps {
  matches: Match[];
  participants: TournamentParticipantWithDetails[];
  tournament: Tournament;
}

export function BracketView({ matches, participants, tournament }: BracketViewProps) {
  // Build participant lookup
  const participantMap: Record<string, TournamentParticipantWithDetails> = {};
  for (const p of participants) {
    participantMap[p.id] = p;
  }

  // Group matches by round, sort within each round by position
  const roundMap = new Map<number, Match[]>();
  for (const match of matches) {
    if (!roundMap.has(match.round)) roundMap.set(match.round, []);
    roundMap.get(match.round)!.push(match);
  }
  for (const [, rMatches] of roundMap) {
    rMatches.sort((a, b) => a.position - b.position);
  }

  const sortedRounds = Array.from(roundMap.keys()).sort((a, b) => a - b);
  const numRounds = sortedRounds.length;

  if (numRounds === 0) {
    return (
      <div style={{ color: '#555', padding: '48px 0', textAlign: 'center' }}>
        Bracket not yet set up
      </div>
    );
  }

  const round1Matches = roundMap.get(sortedRounds[0])!;
  const totalH = bracketTotalHeight(round1Matches.length);
  const totalW = bracketTotalWidth(numRounds);

  // Champion: winner of the final round's match
  const finalMatches = roundMap.get(sortedRounds[numRounds - 1])!;
  const finalMatch = finalMatches[0];
  const champion = finalMatch?.winner_id ? participantMap[finalMatch.winner_id] : null;

  // Extra width for champion card when present
  const champColWidth = champion ? COL_W + COL_GAP : 0;
  const containerW = totalW + champColWidth + 40;

  return (
    <div style={{ overflowX: 'auto', overflowY: 'visible', paddingBottom: 24 }}>
      <div
        style={{
          position: 'relative',
          width: containerW,
          height: totalH + LABEL_H,
          minHeight: totalH + LABEL_H,
        }}
      >
        {sortedRounds.map((roundNum, colIdx) => (
          <BracketColumn
            key={roundNum}
            roundNumber={colIdx + 1}
            matches={roundMap.get(roundNum)!}
            participantMap={participantMap}
            tournamentType={tournament.tournament_type}
            totalHeight={totalH}
            columnIndex={colIdx}
          />
        ))}

        <BracketSVG
          rounds={roundMap}
          totalHeight={totalH}
          totalWidth={totalW}
          sortedRounds={sortedRounds}
        />

        {champion && (
          <ChampionCard
            champion={champion}
            tournamentName={tournament.name}
            tournamentType={tournament.tournament_type}
            numColumns={numRounds}
            totalHeight={totalH}
          />
        )}
      </div>
    </div>
  );
}
