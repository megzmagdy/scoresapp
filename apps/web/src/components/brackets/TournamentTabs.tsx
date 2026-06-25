// apps/web/src/components/brackets/TournamentTabs.tsx
import type { Tournament } from '@dpt/types';

const GOLD = '#E8B53A';

interface TournamentTabsProps {
  tournaments: Tournament[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function TournamentTabs({ tournaments, selectedId, onSelect }: TournamentTabsProps) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {tournaments.map((t) => {
        const active = t.id === selectedId;
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            style={{
              padding: '6px 16px',
              borderRadius: 9999,
              border: `1px solid ${active ? GOLD : '#2e2e2e'}`,
              background: active ? 'rgba(232,181,58,0.08)' : 'transparent',
              color: active ? GOLD : '#888',
              fontWeight: active ? 700 : 400,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: 'inherit',
            }}
          >
            {t.name}
          </button>
        );
      })}
    </div>
  );
}
