import { useNavigate } from 'react-router';

import { MONO, ARCHIVO } from '~/lib/theme';

const rules = [
'Punctuality: Any team arriving more than 10 minutes late for their scheduled match will be considered to have forfeited the match.',
'Check-In: Players must arrive at least 10 minutes before their scheduled match time for registration and preparation.',
'Warm-Up: A maximum of 5 minutes of warm-up is allowed before each match.',
'Match Format: The Golden Point system will be applied at 40/40 throughout the tournament.',
'Referee Authority: An official referee will oversee each match, and the referee’s decision is final in the event of any dispute during play.',
'Code of Conduct: Respect towards opponents, referees, organizers, and spectators is mandatory; inappropriate behavior may result in warnings, point deductions, financial penalties, or disqualification.',
'Player Eligibility & Division Approval: The Organizing Committee reserves the right to approve player participation and division placement and may move or exclude players or teams deemed above the designated level.',
'Withdrawal & No Show: Teams that withdraw after the draw or fail to attend without prior notice may lose ranking points and be subject to additional penalties.',
'Injury & Retirement: If a player cannot continue a match due to injury, the match will be recorded as a retirement, and the opposing team will advance.',
'Rankings & Race Points: Ranking points will be awarded according to the official Delta Padel Tour Race system and standings.',
'Final Authority: The Organizing Committee reserves the right to interpret, amend, and enforce all tournament rules, and all committee decisions are final and binding.',
];

const navCards = [
  {
    label: 'Rankings →',
    description: 'The full leaderboard with live standings and the Top 3 podium.',
    route: '/rankings',
  },
  {
    label: 'Brackets →',
    description: 'Follow every match and progression path through the draw.',
    route: '/brackets',
  },
];

export function RulesSection() {
  const navigate = useNavigate();

  return (
    <section className="bg-dpt-bg court-mesh py-20 border-t border-white/4">
      <div className="mx-auto container">
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-10 lg:gap-16 items-start">
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.2em] text-dpt-gold mb-2"
              style={{ fontFamily: MONO }}
            >
              // Regulations
            </p>
            <h2
              className="text-4xl sm:text-5xl font-black italic uppercase leading-none text-[#f0f0f0] mb-10"
              style={{ fontFamily: ARCHIVO }}
            >
              Rules &amp; Regulations
            </h2>

            <div className="flex flex-col">
              {rules.map((rule, i) => (
                <div
                  key={i}
                  className="flex gap-5 items-start py-5 border-b border-white/6 first:pt-0"
                >
                  <span
                    className="text-[12px] font-bold tracking-wider text-dpt-gold shrink-0 mt-0.5"
                    style={{ fontFamily: MONO }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="text-sm text-[#c0c0c8] leading-relaxed">{rule}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:pt-22">
            {navCards.map((card) => (
              <button
                key={card.route}
                type="button"
                onClick={() => navigate(card.route)}
                className="text-left rounded-xl p-6 cursor-pointer transition-all duration-150 border bg-[rgba(232,181,58,0.05)] border-[rgba(232,181,58,0.18)] hover:bg-[rgba(232,181,58,0.09)] hover:border-[rgba(232,181,58,0.35)]"
              >
                <p
                  className="text-lg font-black italic uppercase text-[#f0f0f0] mb-2"
                  style={{ fontFamily: ARCHIVO }}
                >
                  {card.label}
                </p>
                <p className="text-[13px] text-[#777] leading-relaxed">
                  {card.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
