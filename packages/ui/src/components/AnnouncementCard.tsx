import { cn } from '../lib/utils';
import type { Announcement } from '@dpt/types';

const TYPE_STYLES: Record<Announcement['type'], string> = {
  general: 'border-[#2e2e2e] bg-[#111]',
  tournament: 'border-[#eeb149]/30 bg-[#eeb149]/5',
  rules: 'border-blue-800/40 bg-blue-900/10',
  rewards: 'border-green-800/40 bg-green-900/10',
};

interface AnnouncementCardProps {
  announcement: Announcement;
  className?: string;
}

export function AnnouncementCard({ announcement, className }: AnnouncementCardProps) {
  return (
    <div className={cn('rounded-2xl border p-4', TYPE_STYLES[announcement.type], className)}>
      <h3 className="font-bold text-[#e5e5e5] mb-1">{announcement.title}</h3>
      <p className="text-sm text-[#999] whitespace-pre-wrap">{announcement.content}</p>
      <p className="text-xs text-[#555] mt-3">
        {new Date(announcement.published_at).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </p>
    </div>
  );
}
