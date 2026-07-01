import { cn } from '../lib/utils';
import type { Tournament } from '@dpt/types';

const STATUS_STYLES: Record<Tournament['status'], string> = {
  upcoming: 'bg-blue-900/30 text-blue-300 border-blue-700',
  ongoing: 'bg-green-900/30 text-green-300 border-green-700',
  completed: 'bg-zinc-800 text-zinc-400 border-zinc-700',
};

interface TournamentCardProps {
  tournament: Tournament;
  onClick?: () => void;
  className?: string;
}

export function TournamentCard({ tournament, onClick, className }: TournamentCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl border border-[#2e2e2e] bg-[#111] p-4 cursor-pointer hover:border-[#eeb149]/40 transition-colors',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-[#e5e5e5]">{tournament.name}</h3>
        <span
          className={cn(
            'text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0',
            STATUS_STYLES[tournament.status]
          )}
        >
          {tournament.status.toUpperCase()}
        </span>
      </div>
      <p className="text-sm text-[#777] mt-1">{tournament.venue}</p>
      <p className="text-xs text-dim mt-2">
        {new Date(tournament.date).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </p>
      <div className="flex gap-2 mt-3">
        <span className="text-xs bg-[#222] border border-[#2e2e2e] rounded px-2 py-0.5 text-[#777]">
          {tournament.bracket_format}
        </span>
        <span className="text-xs bg-[#222] border border-[#2e2e2e] rounded px-2 py-0.5 text-[#777]">
          {tournament.tournament_type}
        </span>
      </div>
    </div>
  );
}
