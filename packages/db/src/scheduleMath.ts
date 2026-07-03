import type { Match } from '@dpt/types';

export interface DayGroup {
  dateKey: string;
  matches: Match[];
}

/**
 * Groups scheduled matches by the *local* calendar day (using the viewer's
 * timezone, not UTC) they fall on. Matches with no scheduled_at are dropped.
 * Groups are ordered chronologically by day, and matches within each group
 * are sorted chronologically by time.
 *
 * We use getFullYear/getMonth/getDate (local) rather than getUTC* so that,
 * e.g., a match at 2026-07-05T23:00:00Z groups with "July 5" for a UTC
 * viewer but with "July 6" for a viewer in UTC+2 — matching what each
 * viewer actually sees on their own calendar/clock.
 */
export function groupMatchesByDay(matches: Match[]): DayGroup[] {
  const scheduled = matches.filter((m): m is Match & { scheduled_at: string } => m.scheduled_at !== null);
  const sorted = [...scheduled].sort(
    (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  );

  const groups = new Map<string, Match[]>();
  for (const m of sorted) {
    const d = new Date(m.scheduled_at);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!groups.has(dateKey)) groups.set(dateKey, []);
    groups.get(dateKey)!.push(m);
  }

  return Array.from(groups.entries()).map(([dateKey, matches]) => ({ dateKey, matches }));
}
