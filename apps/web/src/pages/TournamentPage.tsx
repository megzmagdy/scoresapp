import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { Calendar, MapPin, Users, ArrowLeft } from 'lucide-react';
import { getTournament, getTournamentParticipants, getMatches, subscribeToMatches } from '@dpt/db';
import type { Tournament, TournamentParticipantWithDetails, Match } from '@dpt/types';
import { BracketView } from '~/components/brackets/BracketView';
import { MatchScheduleList } from '~/components/schedule/MatchScheduleList';
import { getParticipantName } from '~/components/brackets/bracketLayout';
import { STATUS_CONFIG, FORMAT_LABEL, TYPE_LABEL } from '~/lib/tournamentLabels';
import { MONO, ARCHIVO } from '~/lib/theme';

export function TournamentPage() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<TournamentParticipantWithDetails[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    getTournament(id)
      .then(setTournament)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
    getTournamentParticipants(id).then(setParticipants);
    getMatches(id).then(setMatches);
    const channel = subscribeToMatches(id, setMatches);
    return () => { channel.unsubscribe(); };
  }, [id]);

  if (loading) {
    return (
      <div className="bg-dpt-bg min-h-screen">
        <p className="text-[#555] pt-24 text-center">Loading tournament…</p>
      </div>
    );
  }

  if (notFound || !tournament) {
    return (
      <div className="bg-dpt-bg min-h-screen">
        <div className="mx-auto container py-24 text-center">
          <p className="text-[#555] mb-4">Tournament not found</p>
          <Link to="/tournaments" className="text-dpt-gold text-sm" style={{ fontFamily: MONO }}>
            Back to tournaments
          </Link>
        </div>
      </div>
    );
  }

  const sc = STATUS_CONFIG[tournament.status];

  return (
    <div className="bg-dpt-bg min-h-screen">
      <div className="border-b border-white/6 bg-linear-to-b from-[rgba(232,181,58,0.05)] to-transparent">
        <div className="mx-auto container py-6 sm:py-10">
          <Link
            to="/tournaments"
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-[#888] hover:text-dpt-gold mb-4"
            style={{ fontFamily: MONO }}
          >
            <ArrowLeft size={12} /> Tournaments
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] uppercase tracking-[0.12em]"
              style={{
                fontFamily: MONO,
                color: sc.color,
                background: `${sc.color}12`,
                border: `1px solid ${sc.color}35`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sc.color }} />
              {sc.label}
            </div>
            <span className="text-[10px] text-[#444] tracking-[0.08em]" style={{ fontFamily: MONO }}>
              {FORMAT_LABEL[tournament.bracket_format]}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black italic uppercase leading-none text-[#f0f0f0] mb-6" style={{ fontFamily: ARCHIVO }}>
            {tournament.name}
          </h1>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <Calendar size={13} color="#555" className="shrink-0" />
              <span className="text-[13px] text-[#888]">
                {new Date(tournament.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={13} color="#555" className="shrink-0" />
              <span className="text-[13px] text-[#888]">{tournament.venue}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={13} color="#555" className="shrink-0" />
              <span className="text-[13px] text-[#888]">
                <span className="mr-1.5" style={{ fontFamily: MONO }}>{participants.length}</span>
                {TYPE_LABEL[tournament.tournament_type]}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto container py-6 sm:py-10 flex flex-col gap-12">
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-dpt-gold mb-4" style={{ fontFamily: MONO }}>
            Bracket
          </h2>
          <BracketView matches={matches} participants={participants} tournament={tournament} />
        </section>

        <section>
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-dpt-gold mb-4" style={{ fontFamily: MONO }}>
            Schedule
          </h2>
          <MatchScheduleList matches={matches} participants={participants} tournament={tournament} />
        </section>

        <section>
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-dpt-gold mb-4" style={{ fontFamily: MONO }}>
            Participants ({participants.length})
          </h2>
          {participants.length === 0 ? (
            <p className="text-[#555] text-center py-8">No participants yet</p>
          ) : (
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
              {participants.map((p) => (
                <div key={p.id} className="flex items-center gap-3 bg-[#141414] border border-white/8 rounded-xl p-3">
                  <span className="text-dpt-gold text-xs font-bold w-6 shrink-0" style={{ fontFamily: MONO }}>
                    {p.bracket_position ?? '–'}
                  </span>
                  <span className="text-white text-sm">{getParticipantName(p, tournament.tournament_type)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
