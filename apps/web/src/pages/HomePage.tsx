import { useEffect, useState } from 'react';
import { getAnnouncements, getTournaments } from '@dpt/db';
import type { Announcement, Tournament } from '@dpt/types';

export function HomePage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [upcoming, setUpcoming] = useState<Tournament[]>([]);

  useEffect(() => {
    getAnnouncements().then(setAnnouncements);
    getTournaments().then((all) =>
      setUpcoming(all.filter((t) => t.status === 'upcoming'))
    );
  }, []);

  return (
    <div>
      <h1>Home</h1>
      <h2>Upcoming Tournaments ({upcoming.length})</h2>
      <h2>Announcements ({announcements.length})</h2>
    </div>
  );
}
