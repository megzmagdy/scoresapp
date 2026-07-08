import type { Match, Tournament, TournamentParticipantWithDetails } from '@dpt/types';
import { groupMatchesByDay } from '@dpt/db';
import { getParticipantName, getRoundLabel } from '~/components/brackets/bracketLayout';
import { MONO } from '~/lib/theme';

interface MatchScheduleListProps {
  matches: Match[];
  participants: TournamentParticipantWithDetails[];
  tournament: Tournament;
}

export function MatchScheduleList({ matches, participants, tournament }: MatchScheduleListProps) {
  const participantMap: Record<string, TournamentParticipantWithDetails> = {};
  for (const p of participants) participantMap[p.id] = p;

  const roundsByNumber = new Map<number, number>(); // round number -> match count in that round
  for (const m of matches) {
    roundsByNumber.set(m.round, (roundsByNumber.get(m.round) ?? 0) + 1);
  }

  const dayGroups = groupMatchesByDay(matches);

  if (dayGroups.length === 0) {
    return <p className="text-[#555] pt-12 text-center">No matches scheduled yet</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      {dayGroups.map(group => (
        <div key={group.dateKey}>
          <p className="text-[11px] uppercase tracking-[0.2em] text-dpt-gold mb-3" style={{ fontFamily: MONO }}>
            {new Date(group.dateKey + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <div className="flex flex-col gap-2">
            {group.matches.map(m => {
              const p1 = m.participant1_id ? participantMap[m.participant1_id] : undefined;
              const p2 = m.participant2_id ? participantMap[m.participant2_id] : undefined;
              const time = new Date(m.scheduled_at!).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
              return (
                <div key={m.id} className="flex items-center gap-4 bg-[#141414] border border-white/8 rounded-xl p-3">
                  <span className="text-dpt-gold text-sm font-bold w-16 shrink-0" style={{ fontFamily: MONO }}>{time}</span>
                  <span className="text-dim text-xs shrink-0" style={{ fontFamily: MONO }}>{getRoundLabel(roundsByNumber.get(m.round) ?? 0)}</span>
                  <span className="text-white text-sm flex-1">
                    {getParticipantName(p1, tournament.tournament_type)} vs {getParticipantName(p2, tournament.tournament_type)}
                  </span>
                  {m.venue && <span className="text-dim text-xs" style={{ fontFamily: MONO }}>{m.venue}</span>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
