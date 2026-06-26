import { useEffect, useState } from 'react';
import { LayoutList, LayoutGrid } from 'lucide-react';
import { getPlayers } from '@dpt/db';
import type { Player } from '@dpt/types';

const GOLD = '#E8B53A';
const MONO = "'Source Code Pro', monospace";
const ARCHIVO = "'Archivo', sans-serif";

// ─── Local type (extends Player with display-only fields) ─────────────────────

interface RankingEntry {
  id: string;
  name: string;
  code: string;
  venue: string;
  total_points: number;
  trend: number; // spots moved since last update: +2 = up 2, -1 = down 1, 0 = flat
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const USE_MOCK = true; // flip to false once Supabase has real player data

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Atoms ────────────────────────────────────────────────────────────────────

function TrendCell({ trend }: { trend: number }) {
  if (trend === 0) return <span className="tabular-nums text-sm" style={{ color: '#555' }}>— 0</span>;
  if (trend > 0)   return <span className="tabular-nums text-sm" style={{ color: '#4ade80' }}>▲ {trend}</span>;
  return               <span className="tabular-nums text-sm" style={{ color: '#f87171' }}>▼ {Math.abs(trend)}</span>;
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#262626',
        border: '1px solid #333',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.38,
        fontWeight: 700,
        color: '#666',
        fontFamily: ARCHIVO,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Podium card (top 3) ──────────────────────────────────────────────────────

function PodiumCard({ player, rank }: { player: RankingEntry; rank: 1 | 2 | 3 }) {
  const m = MEDAL[rank];
  const isFirst = rank === 1;
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: '#141414',
        border: `1px solid ${m.color}${isFirst ? '55' : '28'}`,
        borderRadius: 12,
        padding: '20px 24px 24px',
        boxShadow: isFirst ? `0 0 48px ${GOLD}12` : undefined,
        flex: 1,
        minWidth: 220,
      }}
    >
      {/* Watermark rank number */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: 10,
          top: -14,
          fontSize: 140,
          fontWeight: 900,
          fontStyle: 'italic',
          color: 'rgba(255,255,255,0.028)',
          lineHeight: 1,
          pointerEvents: 'none',
          userSelect: 'none',
          fontFamily: ARCHIVO,
        }}
      >
        {rank}
      </div>

      {/* Medal row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: `${m.color}18`,
            border: `1.5px solid ${m.color}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          {m.emoji}
        </div>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: m.color,
          }}
        >
          {m.label}
        </span>
      </div>

      {/* Player name */}
      <p
        style={{
          fontFamily: ARCHIVO,
          fontSize: 22,
          fontWeight: 900,
          fontStyle: 'italic',
          textTransform: 'uppercase',
          color: '#f0f0f0',
          lineHeight: 1.1,
          marginBottom: 4,
        }}
      >
        {player.name}
      </p>

      {/* Code · venue */}
      <p style={{ fontFamily: MONO, fontSize: 11, color: '#555', letterSpacing: '0.04em', marginBottom: 20 }}>
        {player.code} · {player.venue}
      </p>

      {/* Points */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span
          style={{
            fontFamily: ARCHIVO,
            fontSize: 34,
            fontWeight: 900,
            color: isFirst ? GOLD : '#e0e0e0',
            lineHeight: 1,
          }}
        >
          {fmt(player.total_points)}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 10, color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          PTS
        </span>
      </div>
    </div>
  );
}

// ─── Full rankings table ──────────────────────────────────────────────────────

function RankTable({ rankings }: { rankings: RankingEntry[] }) {
  return (
    <div style={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '52px 1fr 90px 90px',
          padding: '10px 20px',
          background: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {['RANK', 'PLAYER', 'TREND', 'POINTS'].map((h, i) => (
          <span
            key={h}
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: '0.15em',
              color: '#3a3a3a',
              textTransform: 'uppercase',
              textAlign: i >= 2 ? 'center' : 'left',
            }}
          >
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      {rankings.map((player, i) => {
        const rank = i + 1;
        const rc = rankColor(rank);
        return (
          <div
            key={player.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '52px 1fr 90px 90px',
              padding: '13px 20px',
              alignItems: 'center',
              borderBottom: i < rankings.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              background: rank <= 3 ? `${rc}06` : 'transparent',
            }}
          >
            <span
              style={{
                fontFamily: ARCHIVO,
                fontSize: 15,
                fontWeight: 900,
                fontStyle: 'italic',
                color: rc,
              }}
            >
              {rank}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <Avatar name={player.name} size={32} />
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: rank <= 3 ? '#f0f0f0' : '#c0c0c8',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {player.name}
                </p>
                <p style={{ fontFamily: MONO, fontSize: 10, color: '#555', letterSpacing: '0.04em', marginTop: 1 }}>
                  {player.code} · {player.venue}
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <TrendCell trend={player.trend} />
            </div>

            <span
              style={{
                textAlign: 'right',
                fontFamily: ARCHIVO,
                fontSize: 15,
                fontWeight: 700,
                color: rank <= 3 ? rc : '#8a8f9a',
              }}
            >
              {fmt(player.total_points)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Cards grid ───────────────────────────────────────────────────────────────

function CardsGrid({ rankings }: { rankings: RankingEntry[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 10,
      }}
    >
      {rankings.map((player, i) => {
        const rank = i + 1;
        const rc = rankColor(rank);
        return (
          <div
            key={player.id}
            style={{
              position: 'relative',
              overflow: 'hidden',
              background: '#141414',
              border: `1px solid ${rank <= 3 ? rc + '35' : '#2e2e2e'}`,
              borderRadius: 10,
              padding: '14px 18px',
            }}
          >
            <div
              aria-hidden
              style={{
                position: 'absolute',
                right: 8,
                top: -8,
                fontSize: 90,
                fontWeight: 900,
                fontStyle: 'italic',
                color: 'rgba(255,255,255,0.025)',
                lineHeight: 1,
                pointerEvents: 'none',
                userSelect: 'none',
                fontFamily: ARCHIVO,
              }}
            >
              {rank}
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontFamily: MONO, fontSize: 10, color: rc, letterSpacing: '0.1em', marginBottom: 4 }}>
                  #{rank}
                </p>
                <p
                  style={{
                    fontFamily: ARCHIVO,
                    fontSize: 15,
                    fontWeight: 900,
                    fontStyle: 'italic',
                    textTransform: 'uppercase',
                    color: '#f0f0f0',
                    lineHeight: 1.2,
                    marginBottom: 3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {player.name}
                </p>
                <p style={{ fontFamily: MONO, fontSize: 10, color: '#555', letterSpacing: '0.04em' }}>
                  {player.code} · {player.venue}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontFamily: ARCHIVO, fontSize: 20, fontWeight: 900, color: rank <= 3 ? rc : '#e0e0e0', lineHeight: 1 }}>
                  {fmt(player.total_points)}
                </p>
                <p style={{ fontFamily: MONO, fontSize: 9, color: '#555', marginTop: 2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

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
    <div style={{ background: '#0b0c0f', minHeight: '100vh' }}>
      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'linear-gradient(180deg, rgba(232,181,58,0.05) 0%, transparent 100%)',
        }}
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-16 xl:px-24 2xl:px-32 py-6 sm:py-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: GOLD,
                  marginBottom: 6,
                }}
              >
                // Standings · Updated Live
              </p>
              <h1
                className="text-4xl sm:text-5xl"
                style={{
                  fontFamily: ARCHIVO,
                  fontWeight: 900,
                  fontStyle: 'italic',
                  textTransform: 'uppercase',
                  color: '#f0f0f0',
                  lineHeight: 1,
                }}
              >
                Rankings
              </h1>
            </div>

            {/* View toggle */}
            <div
              style={{
                display: 'flex',
                gap: 4,
                padding: 4,
                background: '#181818',
                border: '1px solid #2e2e2e',
                borderRadius: 8,
                marginTop: 4,
                flexShrink: 0,
              }}
            >
              {(['list', 'cards'] as const).map((v) => {
                const active = view === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setView(v)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      borderRadius: 5,
                      border: `1px solid ${active ? GOLD : 'transparent'}`,
                      background: active ? 'rgba(232,181,58,0.08)' : 'transparent',
                      color: active ? GOLD : '#666',
                      fontSize: 12,
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      whiteSpace: 'nowrap',
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

      {/* Body */}
      <div className="mx-auto px-4 sm:px-6 lg:px-16 xl:px-24 2xl:px-32 py-8 sm:py-12">
        {rankings.length === 0 ? (
          <div style={{ color: '#444', textAlign: 'center', paddingTop: 48 }}>
            No rankings yet — players will appear here once tournaments begin.
          </div>
        ) : (
          <>
            {/* Top 3 podium (list view only) */}
            {view === 'list' && hasTop3 && (
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  marginBottom: 28,
                  flexWrap: 'wrap',
                }}
              >
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
