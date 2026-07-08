import { useState } from 'react';
import { LayoutList, LayoutGrid, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPlayers, getLatestSnapshots } from '@dpt/db';
import { formatNumber as fmt, getRankColor, SectionLabel, useAsyncData } from '@dpt/ui';

import { GOLD, MONO, ARCHIVO } from '~/lib/theme';
import { SponsorsMarquee } from '~/components/rankings/SponsorsMarquee';

interface RankingEntry {
  id: string;
  name: string;
  code: string;
  venue: string;
  total_points: number;
  trend: number;
}


const PAGE_SIZE = 20;

const MEDAL = {
  1: { color: getRankColor(1), label: '1ST PLACE · GOLD',   emoji: '🥇' },
  2: { color: getRankColor(2), label: '2ND PLACE · SILVER', emoji: '🥈' },
  3: { color: getRankColor(3), label: '3RD PLACE · BRONZE', emoji: '🥉' },
} as const;

function TrendCell({ trend }: { trend: number }) {
  if (trend === 0) return <span className="tabular-nums text-sm text-dim">— 0</span>;
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

function PodiumCard({ player, rank, className = '' }: { player: RankingEntry; rank: 1 | 2 | 3; className?: string }) {
  const m = MEDAL[rank];
  const isFirst = rank === 1;
  return (
    <div
      className={`relative overflow-hidden bg-[#141414] rounded-xl sm:flex-1 sm:min-w-55 p-5 pb-6 ${className}`}
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

      <p className="text-[11px] text-dim tracking-[0.04em] mb-5" style={{ fontFamily: MONO }}>
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
          className="text-[10px] text-dim uppercase tracking-[0.15em]"
          style={{ fontFamily: MONO }}
        >
          PTS
        </span>
      </div>
    </div>
  );
}

function RankTable({ rankings, rankOffset }: { rankings: RankingEntry[]; rankOffset: number }) {
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
        const rank = rankOffset + i + 1;
        const rc = getRankColor(rank);
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
                <p className="text-[10px] text-dim tracking-[0.04em] mt-px" style={{ fontFamily: MONO }}>
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

function CardsGrid({ rankings, rankOffset }: { rankings: RankingEntry[]; rankOffset: number }) {
  return (
    <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
      {rankings.map((player, i) => {
        const rank = rankOffset + i + 1;
        const rc = getRankColor(rank);
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
                <p className="text-[10px] text-dim tracking-[0.04em]" style={{ fontFamily: MONO }}>
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
                  className="text-[9px] text-dim mt-0.5 uppercase tracking-[0.1em]"
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

function Pager({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center gap-1.5 mt-6">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="w-8 h-8 flex items-center justify-center rounded-md border border-[#2e2e2e] text-[#888] disabled:opacity-30 disabled:cursor-not-allowed hover:border-dpt-gold/40 hover:text-dpt-gold cursor-pointer transition-colors"
      >
        <ChevronLeft size={14} />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className="w-8 h-8 flex items-center justify-center rounded-md text-[13px] cursor-pointer transition-colors"
          style={{
            fontFamily: MONO,
            border: `1px solid ${p === page ? GOLD : '#2e2e2e'}`,
            background: p === page ? 'rgba(232,181,58,0.08)' : 'transparent',
            color: p === page ? GOLD : '#888',
          }}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="w-8 h-8 flex items-center justify-center rounded-md border border-[#2e2e2e] text-[#888] disabled:opacity-30 disabled:cursor-not-allowed hover:border-dpt-gold/40 hover:text-dpt-gold cursor-pointer transition-colors"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

export function RankingsPage() {
  const [view, setView] = useState<'list' | 'cards'>('list');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  function handleQueryChange(value: string) {
    setQuery(value);
    setPage(1);
  }

  const { data: rankings, loading } = useAsyncData(async () => {
    const [ps, snaps] = await Promise.all([getPlayers(), getLatestSnapshots()]);
    const snapMap = Object.fromEntries(snaps.map(s => [s.player_id, s]));
    const sorted = [...ps].sort((a, b) => b.total_points - a.total_points);
    return sorted.map((p, i): RankingEntry => {
      const currentRank = i + 1;
      const snap = snapMap[p.id];
      const trend = snap ? snap.rank - currentRank : 0;
      return {
        id: p.id,
        name: p.name,
        code: p.code ?? '—',
        venue: p.venue ?? '—',
        total_points: p.total_points,
        trend,
      };
    });
  }, [] as RankingEntry[]);

  const top3 = rankings.slice(0, 3);
  const hasTop3 = top3.length === 3;

  const filtered = query.trim()
    ? rankings.filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase()))
    : rankings;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div className="bg-dpt-bg min-h-screen">
      <SponsorsMarquee />
      <div className="border-b border-white/6 bg-linear-to-b from-[rgba(232,181,58,0.05)] to-transparent">
        <div className="mx-auto px-4 sm:px-6 lg:px-16 xl:px-24 2xl:px-32 py-6 sm:py-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <SectionLabel className="mb-1.5">// Standings · Updated Live</SectionLabel>
              <h1
                className="text-4xl sm:text-5xl font-black italic uppercase leading-none text-[#f0f0f0]"
                style={{ fontFamily: ARCHIVO }}
              >
                Rankings
              </h1>
            </div>

            <div className="flex items-center gap-2 flex-wrap mt-1">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="Search players..."
                  className="pl-8 pr-3 py-1.5 rounded-lg bg-[#181818] border border-[#2e2e2e] text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-dpt-gold/40 w-full sm:w-56"
                />
              </div>

              <div className="flex gap-1 p-1 bg-[#181818] border border-[#2e2e2e] rounded-lg shrink-0">
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
      </div>

      <div className="mx-auto px-4 sm:px-6 lg:px-16 xl:px-24 2xl:px-32 py-8 sm:py-12">
        {loading ? (
          <p className="text-dim text-center pt-12">Loading rankings…</p>
        ) : rankings.length === 0 ? (
          <p className="text-[#444] text-center pt-12">
            No rankings yet — players will appear here once tournaments begin.
          </p>
        ) : (
          <>
            {view === 'list' && hasTop3 && (
              <div className="flex flex-col sm:flex-row gap-2.5 mb-7">
                <PodiumCard player={top3[0]} rank={1} className="order-1 sm:order-2" />
                <PodiumCard player={top3[1]} rank={2} className="order-2 sm:order-1" />
                <PodiumCard player={top3[2]} rank={3} className="order-3" />
              </div>
            )}
            {filtered.length === 0 ? (
              <p className="text-[#444] text-center pt-12">
                No players match &ldquo;{query}&rdquo;.
              </p>
            ) : (
              <>
                {view === 'list' ? (
                  <RankTable rankings={pageItems} rankOffset={pageStart} />
                ) : (
                  <CardsGrid rankings={pageItems} rankOffset={pageStart} />
                )}
                <Pager page={currentPage} totalPages={totalPages} onChange={setPage} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
