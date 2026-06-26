import { useEffect, useState } from 'react';
import { LayoutList, LayoutGrid } from 'lucide-react';
import { getPlayers } from '@dpt/db';
import type { Player } from '@dpt/types';

const GOLD = '#E8B53A';
const MONO = "'Source Code Pro', monospace";
const ARCHIVO = "'Archivo', sans-serif";

interface RankingEntry {
  id: string;
  name: string;
  code: string;
  venue: string;
  total_points: number;
  trend: number;
}

const USE_MOCK = true;

const mockRankings: RankingEntry[] = [
  { id: '1',  name: 'Marcos Gutiérrez', code: 'DPT-01', venue: 'Ace Town Complex',     total_points: 2480, trend:  1 },
  { id: '2',  name: 'Ahmed El-Sayed',   code: 'DPT-02', venue: 'Mansoura Padel Point', total_points: 2310, trend:  0 },
  { id: '3',  name: 'Pablo Navarro',    code: 'DPT-03', venue: 'Padel H',              total_points: 2150, trend:  2 },
  { id: '4',  name: 'Youssef Hesham',  code: 'DPT-04', venue: 'Mansoura Padel Point', total_points: 1990, trend: -1 },
  { id: '5',  name: 'Diego Fernández', code: 'DPT-05', venue: 'Ace Town Complex',     total_points: 1820, trend:  1 },
  { id: '6',  name: 'Karim Mostafa',   code: 'DPT-06', venue: 'Padel H',              total_points: 1670, trend: -2 },
  { id: '7',  name: 'Lucas Ramírez',   code: 'DPT-07', venue: 'Ace Town Complex',     total_points: 1540, trend:  0 },
  { id: '8',  name: 'Omar Khaled',     code: 'DPT-08', venue: 'Mansoura Padel Point', total_points: 1420, trend:  3 },
  { id: '9',  name: 'Javier Soto',     code: 'DPT-09', venue: 'Padel H',              total_points: 1290, trend: -1 },
  { id: '10', name: 'Tarek Adel',      code: 'DPT-10', venue: 'Mansoura Padel Point', total_points: 1180, trend:  1 },
  { id: '11', name: 'Mateo Ruiz',      code: 'DPT-11', venue: 'Ace Town Complex',     total_points: 1050, trend:  0 },
  { id: '12', name: 'Hassan Nabil',    code: 'DPT-12', venue: 'Padel H',              total_points:  940, trend: -2 },
];

function toRankingEntry(p: Player): RankingEntry {
  return { id: p.id, name: p.name, code: '—', venue: '—', total_points: p.total_points, trend: 0 };
}

const MEDAL = {
  1: { color: GOLD,      label: '1ST PLACE · GOLD',   emoji: '🥇' },
  2: { color: '#C0C0C0', label: '2ND PLACE · SILVER', emoji: '🥈' },
  3: { color: '#CD7F32', label: '3RD PLACE · BRONZE', emoji: '🥉' },
} as const;

function rankColor(rank: number) {
  if (rank === 1) return GOLD;
  if (rank === 2) return '#C0C0C0';
  if (rank === 3) return '#CD7F32';
  return '#444';
}

function fmt(n: number) {
  return n.toLocaleString('en-US');
}

function TrendCell({ trend }: { trend: number }) {
  if (trend === 0) return <span className="tabular-nums text-sm text-[#555]">— 0</span>;
  if (trend > 0)   return <span className="tabular-nums text-sm text-[#4ade80]">▲ {trend}</span>;
  return               <span className="tabular-nums text-sm text-[#f87171]">▼ {Math.abs(trend)}</span>;
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div
      className="rounded-full bg-[#262626] border border-[#333] shrink-0 flex items-center justify-center font-bold text-[#666]"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        fontFamily: ARCHIVO,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function PodiumCard({ player, rank }: { player: RankingEntry; rank: 1 | 2 | 3 }) {
  const m = MEDAL[rank];
  const isFirst = rank === 1;
  return (
    <div
      className="relative overflow-hidden bg-[#141414] rounded-xl flex-1 min-w-[220px] p-5 pb-6"
      style={{
        border: `1px solid ${m.color}${isFirst ? '55' : '28'}`,
        boxShadow: isFirst ? `0 0 48px ${GOLD}12` : undefined,
      }}
    >
      <div
        aria-hidden
        className="absolute right-2.5 -top-3.5 text-[140px] font-black italic leading-none pointer-events-none select-none text-white/2.5"
        style={{ fontFamily: ARCHIVO }}
      >
        {rank}
      </div>

      <div className="flex items-center gap-3 mb-3.5">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-[22px] shrink-0"
          style={{ background: `${m.color}18`, border: `1.5px solid ${m.color}40` }}
        >
          {m.emoji}
        </div>
        <span
          className="text-[10px] uppercase tracking-[0.15em]"
          style={{ fontFamily: MONO, color: m.color }}
        >
          {m.label}
        </span>
      </div>

      <p
        className="text-[22px] font-black italic uppercase text-[#f0f0f0] leading-[1.1] mb-1"
        style={{ fontFamily: ARCHIVO }}
      >
        {player.name}
      </p>

      <p className="text-[11px] text-[#555] tracking-[0.04em] mb-5" style={{ fontFamily: MONO }}>
        {player.code} · {player.venue}
      </p>

      <div className="flex items-baseline gap-1.5">
        <span
          className="text-[34px] font-black leading-none"
          style={{ fontFamily: ARCHIVO, color: isFirst ? GOLD : '#e0e0e0' }}
        >
          {fmt(player.total_points)}
        </span>
        <span
          className="text-[10px] text-[#555] uppercase tracking-[0.15em]"
          style={{ fontFamily: MONO }}
        >
          PTS
        </span>
      </div>
    </div>
  );
}

function RankTable({ rankings }: { rankings: RankingEntry[] }) {
  return (
    <div className="rounded-[10px] border border-white/[0.07] overflow-hidden">
      <div
        className="grid px-5 py-2.5 bg-white/[0.03] border-b border-white/6"
        style={{ gridTemplateColumns: '52px 1fr 90px 90px' }}
      >
        {(['RANK', 'PLAYER', 'TREND', 'POINTS'] as const).map((h, i) => (
          <span
            key={h}
            className={`text-[10px] uppercase tracking-[0.15em] text-[#3a3a3a] ${i >= 2 ? 'text-center' : ''}`}
            style={{ fontFamily: MONO }}
          >
            {h}
          </span>
        ))}
      </div>

      {rankings.map((player, i) => {
        const rank = i + 1;
        const rc = rankColor(rank);
        return (
          <div
            key={player.id}
            className="grid px-5 py-[13px] items-center"
            style={{
              gridTemplateColumns: '52px 1fr 90px 90px',
              borderBottom: i < rankings.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              background: rank <= 3 ? `${rc}06` : 'transparent',
            }}
          >
            <span
              className="text-[15px] font-black italic"
              style={{ fontFamily: ARCHIVO, color: rc }}
            >
              {rank}
            </span>

            <div className="flex items-center gap-3 min-w-0">
              <Avatar name={player.name} size={32} />
              <div className="min-w-0">
                <p
                  className="text-sm font-semibold truncate"
                  style={{ color: rank <= 3 ? '#f0f0f0' : '#c0c0c8' }}
                >
                  {player.name}
                </p>
                <p className="text-[10px] text-[#555] tracking-[0.04em] mt-px" style={{ fontFamily: MONO }}>
                  {player.code} · {player.venue}
                </p>
              </div>
            </div>

            <div className="text-center">
              <TrendCell trend={player.trend} />
            </div>

            <span
              className="text-right text-[15px] font-bold"
              style={{ fontFamily: ARCHIVO, color: rank <= 3 ? rc : '#8a8f9a' }}
            >
              {fmt(player.total_points)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function CardsGrid({ rankings }: { rankings: RankingEntry[] }) {
  return (
    <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
      {rankings.map((player, i) => {
        const rank = i + 1;
        const rc = rankColor(rank);
        return (
          <div
            key={player.id}
            className="relative overflow-hidden bg-[#141414] rounded-[10px] px-4.5 py-3.5"
            style={{ border: `1px solid ${rank <= 3 ? rc + '35' : '#2e2e2e'}` }}
          >
            <div
              aria-hidden
              className="absolute right-2 -top-2 text-[90px] font-black italic leading-none pointer-events-none select-none text-white/2.5"
              style={{ fontFamily: ARCHIVO }}
            >
              {rank}
            </div>

            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p
                  className="text-[10px] tracking-[0.1em] mb-1"
                  style={{ fontFamily: MONO, color: rc }}
                >
                  #{rank}
                </p>
                <p
                  className="text-[15px] font-black italic uppercase text-[#f0f0f0] leading-[1.2] mb-0.5 truncate"
                  style={{ fontFamily: ARCHIVO }}
                >
                  {player.name}
                </p>
                <p className="text-[10px] text-[#555] tracking-[0.04em]" style={{ fontFamily: MONO }}>
                  {player.code} · {player.venue}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p
                  className="text-xl font-black leading-none"
                  style={{ fontFamily: ARCHIVO, color: rank <= 3 ? rc : '#e0e0e0' }}
                >
                  {fmt(player.total_points)}
                </p>
                <p
                  className="text-[9px] text-[#555] mt-0.5 uppercase tracking-[0.1em]"
                  style={{ fontFamily: MONO }}
                >
                  PTS
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function RankingsPage() {
  const [view, setView] = useState<'list' | 'cards'>('list');
  const [rankings, setRankings] = useState<RankingEntry[]>(USE_MOCK ? mockRankings : []);

  useEffect(() => {
    if (USE_MOCK) return;
    getPlayers()
      .then((players) => setRankings([...players].sort((a, b) => b.total_points - a.total_points).map(toRankingEntry)))
      .catch(console.error);
  }, []);

  const top3 = rankings.slice(0, 3);
  const hasTop3 = top3.length === 3;

  return (
    <div className="bg-dpt-bg min-h-screen">
      <div className="border-b border-white/6 bg-linear-to-b from-[rgba(232,181,58,0.05)] to-transparent">
        <div className="mx-auto px-4 sm:px-6 lg:px-16 xl:px-24 2xl:px-32 py-6 sm:py-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p
                className="text-[11px] uppercase tracking-[0.2em] text-dpt-gold mb-1.5"
                style={{ fontFamily: MONO }}
              >
                // Standings · Updated Live
              </p>
              <h1
                className="text-4xl sm:text-5xl font-black italic uppercase leading-none text-[#f0f0f0]"
                style={{ fontFamily: ARCHIVO }}
              >
                Rankings
              </h1>
            </div>

            <div className="flex gap-1 p-1 bg-[#181818] border border-[#2e2e2e] rounded-lg mt-1 shrink-0">
              {(['list', 'cards'] as const).map((v) => {
                const active = view === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setView(v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] cursor-pointer transition-all duration-150 whitespace-nowrap"
                    style={{
                      border: `1px solid ${active ? GOLD : 'transparent'}`,
                      background: active ? 'rgba(232,181,58,0.08)' : 'transparent',
                      color: active ? GOLD : '#666',
                      fontFamily: 'inherit',
                    }}
                  >
                    {v === 'list' ? <LayoutList size={14} /> : <LayoutGrid size={14} />}
                    {v === 'list' ? 'List' : 'Cards'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 sm:px-6 lg:px-16 xl:px-24 2xl:px-32 py-8 sm:py-12">
        {rankings.length === 0 ? (
          <p className="text-[#444] text-center pt-12">
            No rankings yet — players will appear here once tournaments begin.
          </p>
        ) : (
          <>
            {view === 'list' && hasTop3 && (
              <div className="flex gap-2.5 mb-7 flex-wrap">
                <PodiumCard player={top3[1]} rank={2} />
                <PodiumCard player={top3[0]} rank={1} />
                <PodiumCard player={top3[2]} rank={3} />
              </div>
            )}
            {view === 'list' ? (
              <RankTable rankings={rankings} />
            ) : (
              <CardsGrid rankings={rankings} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
