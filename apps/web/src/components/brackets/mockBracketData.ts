import type {
  Tournament,
  Match,
  TournamentParticipantWithDetails,
  BracketFormat,
  TournamentType,
  TournamentStatus,
  Venue,
} from '@dpt/types';

/**
 * Comprehensive dummy-data generator for manually exercising BracketsPage
 * across every tournament size / progress state combination that can occur
 * with real Supabase data. Each scenario below becomes its own tournament
 * tab so they can be flipped through in the browser.
 */

const VENUES: Venue[] = ['Mansoura Padel Point', 'Ace Town Complex', 'Padel H'];

const INDIVIDUAL_NAMES = [
  'Gutiérrez', 'Khalil', 'Navarro', 'Soto', 'El-Sayed', 'Ruiz', 'Hesham', 'Adel',
  'Fernández', 'Nabil', 'Mostafa', 'Ramírez', 'Khaled', 'Saad', 'Ortega', 'Fawzy',
  'Torres', 'Amr', 'Delgado', 'Youssef', 'Herrera', 'Sami', 'Castro', 'Farouk',
  'Molina', 'Tarek', 'Vega', 'Hany', 'Reyes', 'Emad', 'Cabrera', 'Nour',
];

const TEAM_PAIRS: [string, string][] = [
  ['Gutiérrez', 'Torres'], ['Khalil', 'Amr'], ['Navarro', 'Delgado'], ['Soto', 'Youssef'],
  ['El-Sayed', 'Herrera'], ['Ruiz', 'Sami'], ['Hesham', 'Castro'], ['Adel', 'Farouk'],
  ['Fernández', 'Molina'], ['Nabil', 'Tarek'], ['Mostafa', 'Vega'], ['Ramírez', 'Hany'],
  ['Khaled', 'Reyes'], ['Saad', 'Emad'], ['Ortega', 'Cabrera'], ['Fawzy', 'Nour'],
];

const SLOTS: Record<BracketFormat, number> = { QF: 8, R16: 16, R32: 32 };

// Deterministic RNG (mulberry32) so scenarios render the same way every reload.
function makeRng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0;
  return h;
}

interface ScenarioConfig {
  id: string;
  name: string;
  format: BracketFormat;
  tournamentType: TournamentType;
  status: TournamentStatus;
  date: string;
  /** Number of rounds fully decided (0 = round 1 hasn't finished). */
  completedRounds: number;
  /** State of the round right after completedRounds. Ignored once the whole bracket is complete. */
  currentRoundState: 'not-started' | 'partial';
  /** 0-indexed round-1 match indices where participant2 is a bye (auto-advance, no score). */
  byeMatchIndexes?: number[];
  /** Use unusually long names to stress-test truncation. */
  longNames?: boolean;
}

function buildScenario(cfg: ScenarioConfig): {
  tournament: Tournament;
  participants: TournamentParticipantWithDetails[];
  matches: Match[];
} {
  const { id, name, format, tournamentType, status, date, completedRounds, currentRoundState, byeMatchIndexes = [], longNames } = cfg;
  const totalSlots = SLOTS[format];
  const totalRounds = Math.log2(totalSlots);
  const round1Count = totalSlots / 2;
  const rng = makeRng(hashSeed(id));
  const venue = VENUES[Math.abs(hashSeed(id)) % VENUES.length];

  const tournament: Tournament = {
    id,
    name,
    date,
    venue,
    bracket_format: format,
    tournament_type: tournamentType,
    status,
    created_at: '',
  };

  const participants: TournamentParticipantWithDetails[] = [];
  let seed = 1;
  let nameIdx = 0;

  function makeParticipant(): string {
    const pid = `${id}-p${seed}`;
    if (tournamentType === 'individual') {
      const rawName = longNames
        ? `${INDIVIDUAL_NAMES[nameIdx % INDIVIDUAL_NAMES.length]}-Fernández-Rodríguez`
        : INDIVIDUAL_NAMES[nameIdx % INDIVIDUAL_NAMES.length];
      nameIdx++;
      participants.push({
        id: pid,
        tournament_id: id,
        player_id: `${pid}-player`,
        team_id: null,
        bracket_position: seed,
        points_awarded: 0,
        player: { id: `${pid}-player`, name: rawName, code: null, venue: null, total_points: 0, created_at: '' },
      });
    } else {
      const [n1, n2] = TEAM_PAIRS[nameIdx % TEAM_PAIRS.length];
      nameIdx++;
      const p1Name = longNames ? `${n1}-Wentworth-Huang` : n1;
      const p2Name = longNames ? `${n2}-Álvarez-Contreras` : n2;
      participants.push({
        id: pid,
        tournament_id: id,
        player_id: null,
        team_id: `${pid}-team`,
        bracket_position: seed,
        points_awarded: 0,
        team: {
          id: `${pid}-team`,
          created_at: '',
          players: [
            { id: `${pid}-p1`, name: p1Name, code: null, venue: null, total_points: 0, created_at: '' },
            { id: `${pid}-p2`, name: p2Name, code: null, venue: null, total_points: 0, created_at: '' },
          ],
        },
      });
    }
    seed++;
    return pid;
  }

  function randomResult(p1: string, p2: string): { score1: number; score2: number; winner_id: string } {
    const p1Wins = rng() > 0.45;
    const winnerScore = 21;
    const loserScore = 8 + Math.floor(rng() * 11); // 8-18
    return p1Wins
      ? { score1: winnerScore, score2: loserScore, winner_id: p1 }
      : { score1: loserScore, score2: winnerScore, winner_id: p2 };
  }

  // Round 1 pairing, honoring byes.
  const round1Pairs: { p1: string | null; p2: string | null }[] = [];
  for (let m = 0; m < round1Count; m++) {
    const p1 = makeParticipant();
    const p2 = byeMatchIndexes.includes(m) ? null : makeParticipant();
    round1Pairs.push({ p1, p2 });
  }

  const matches: Match[] = [];
  const winnersByRound = new Map<number, (string | null)[]>();

  for (let round = 1; round <= totalRounds; round++) {
    const matchCount = round1Count / Math.pow(2, round - 1);
    const isCompletedRound = round <= completedRounds;
    const isCurrentRound = round === completedRounds + 1;
    const roundWinners: (string | null)[] = [];

    for (let pos = 0; pos < matchCount; pos++) {
      let p1id: string | null;
      let p2id: string | null;
      if (round === 1) {
        p1id = round1Pairs[pos].p1;
        p2id = round1Pairs[pos].p2;
      } else {
        const prevWinners = winnersByRound.get(round - 1)!;
        p1id = prevWinners[pos * 2] ?? null;
        p2id = prevWinners[pos * 2 + 1] ?? null;
      }

      let score1: number | null = null;
      let score2: number | null = null;
      let winner_id: string | null = null;

      const isBye = round === 1 && p1id !== null && p2id === null;
      if (isBye) {
        winner_id = p1id;
      } else if (p1id && p2id) {
        if (isCompletedRound) {
          ({ score1, score2, winner_id } = randomResult(p1id, p2id));
        } else if (isCurrentRound && currentRoundState === 'partial' && matchCount > 1 && pos % 2 === 0) {
          ({ score1, score2, winner_id } = randomResult(p1id, p2id));
        }
      }

      matches.push({
        id: `${id}-m-r${round}-${pos}`,
        tournament_id: id,
        round,
        position: pos,
        participant1_id: p1id,
        participant2_id: p2id,
        score1,
        score2,
        winner_id,
      });
      roundWinners.push(winner_id);
    }
    winnersByRound.set(round, roundWinners);
  }

  return { tournament, participants, matches };
}

const scenarioConfigs: ScenarioConfig[] = [
  // ---------- QF (8 slots) ----------
  { id: 'qf-not-started', name: 'QF · Not Started', format: 'QF', tournamentType: 'individual', status: 'upcoming', date: '2026-08-01', completedRounds: 0, currentRoundState: 'not-started' },
  { id: 'qf-r1-progress', name: 'QF · Quarters Live', format: 'QF', tournamentType: 'individual', status: 'ongoing', date: '2026-07-28', completedRounds: 0, currentRoundState: 'partial' },
  { id: 'qf-r2-progress', name: 'QF · Semis Live', format: 'QF', tournamentType: 'individual', status: 'ongoing', date: '2026-07-20', completedRounds: 1, currentRoundState: 'partial' },
  { id: 'qf-final-progress', name: 'QF · Final Live', format: 'QF', tournamentType: 'individual', status: 'ongoing', date: '2026-07-15', completedRounds: 2, currentRoundState: 'partial' },
  { id: 'qf-complete', name: 'QF · Complete', format: 'QF', tournamentType: 'individual', status: 'completed', date: '2026-07-01', completedRounds: 3, currentRoundState: 'partial' },
  { id: 'qf-complete-team', name: 'QF Teams · Complete', format: 'QF', tournamentType: 'team', status: 'completed', date: '2026-06-25', completedRounds: 3, currentRoundState: 'partial' },
  { id: 'qf-with-bye', name: 'QF · Quarters Live (w/ Bye)', format: 'QF', tournamentType: 'individual', status: 'ongoing', date: '2026-07-29', completedRounds: 0, currentRoundState: 'partial', byeMatchIndexes: [1] },

  // ---------- R16 (16 slots) ----------
  { id: 'r16-not-started', name: 'R16 · Not Started', format: 'R16', tournamentType: 'individual', status: 'upcoming', date: '2026-08-10', completedRounds: 0, currentRoundState: 'not-started' },
  { id: 'r16-r1-progress', name: 'R16 · Round of 16 Live', format: 'R16', tournamentType: 'individual', status: 'ongoing', date: '2026-08-05', completedRounds: 0, currentRoundState: 'partial' },
  { id: 'r16-r2-progress', name: 'R16 · Quarters Live', format: 'R16', tournamentType: 'individual', status: 'ongoing', date: '2026-07-30', completedRounds: 1, currentRoundState: 'partial' },
  { id: 'r16-r3-progress', name: 'R16 · Semis Live', format: 'R16', tournamentType: 'individual', status: 'ongoing', date: '2026-07-22', completedRounds: 2, currentRoundState: 'partial' },
  { id: 'r16-final-progress', name: 'R16 · Final Live', format: 'R16', tournamentType: 'individual', status: 'ongoing', date: '2026-07-16', completedRounds: 3, currentRoundState: 'partial' },
  { id: 'r16-complete', name: 'R16 · Complete', format: 'R16', tournamentType: 'individual', status: 'completed', date: '2026-07-05', completedRounds: 4, currentRoundState: 'partial' },
  { id: 'r16-complete-team', name: 'R16 Teams · Complete', format: 'R16', tournamentType: 'team', status: 'completed', date: '2026-06-28', completedRounds: 4, currentRoundState: 'partial' },
  { id: 'r16-with-byes', name: 'R16 · Round of 16 Live (3 Byes)', format: 'R16', tournamentType: 'individual', status: 'ongoing', date: '2026-08-06', completedRounds: 0, currentRoundState: 'partial', byeMatchIndexes: [0, 3, 7] },

  // ---------- R32 (32 slots) ----------
  { id: 'r32-not-started', name: 'R32 · Not Started', format: 'R32', tournamentType: 'individual', status: 'upcoming', date: '2026-08-20', completedRounds: 0, currentRoundState: 'not-started' },
  { id: 'r32-r1-progress', name: 'R32 · Round of 32 Live', format: 'R32', tournamentType: 'individual', status: 'ongoing', date: '2026-08-15', completedRounds: 0, currentRoundState: 'partial' },
  { id: 'r32-r2-progress', name: 'R32 · Round of 16 Live', format: 'R32', tournamentType: 'individual', status: 'ongoing', date: '2026-08-08', completedRounds: 1, currentRoundState: 'partial' },
  { id: 'r32-r3-progress', name: 'R32 · Quarters Live', format: 'R32', tournamentType: 'individual', status: 'ongoing', date: '2026-08-01', completedRounds: 2, currentRoundState: 'partial' },
  { id: 'r32-r4-progress', name: 'R32 · Semis Live', format: 'R32', tournamentType: 'individual', status: 'ongoing', date: '2026-07-24', completedRounds: 3, currentRoundState: 'partial' },
  { id: 'r32-final-progress', name: 'R32 · Final Live', format: 'R32', tournamentType: 'individual', status: 'ongoing', date: '2026-07-18', completedRounds: 4, currentRoundState: 'partial' },
  { id: 'r32-complete', name: 'R32 · Complete', format: 'R32', tournamentType: 'individual', status: 'completed', date: '2026-07-10', completedRounds: 5, currentRoundState: 'partial' },
  { id: 'r32-complete-team', name: 'R32 Teams · Complete', format: 'R32', tournamentType: 'team', status: 'completed', date: '2026-07-02', completedRounds: 5, currentRoundState: 'partial' },

  // ---------- Edge cases ----------
  { id: 'long-names', name: 'QF · Long Names', format: 'QF', tournamentType: 'individual', status: 'ongoing', date: '2026-07-27', completedRounds: 0, currentRoundState: 'partial', longNames: true },
  { id: 'long-names-team', name: 'QF Teams · Long Names', format: 'QF', tournamentType: 'team', status: 'ongoing', date: '2026-07-26', completedRounds: 2, currentRoundState: 'partial', longNames: true },
];

const built = scenarioConfigs.map(buildScenario);

// "Bracket not yet set up" — tournament exists but no match shells created yet.
const noShellsTournament: Tournament = {
  id: 'no-shells',
  name: 'QF · Bracket Not Set Up',
  date: '2026-09-01',
  venue: 'Padel H',
  bracket_format: 'QF',
  tournament_type: 'individual',
  status: 'upcoming',
  created_at: '',
};

export const mockTournaments: Tournament[] = [
  ...built.map((b) => b.tournament),
  noShellsTournament,
];

export const mockParticipantsByTournament: Record<string, TournamentParticipantWithDetails[]> = Object.fromEntries(
  built.map((b) => [b.tournament.id, b.participants])
);
mockParticipantsByTournament[noShellsTournament.id] = [];

export const mockMatchesByTournament: Record<string, Match[]> = Object.fromEntries(
  built.map((b) => [b.tournament.id, b.matches])
);
mockMatchesByTournament[noShellsTournament.id] = [];

// Back-compat flat exports (first scenario), kept in case anything imports these directly.
export const mockParticipants: TournamentParticipantWithDetails[] = built[0].participants;
export const mockMatches: Match[] = built[0].matches;
