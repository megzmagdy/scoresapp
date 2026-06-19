import { useEffect, useState } from 'react';
import { getAnnouncements, upsertAnnouncement, deleteAnnouncement } from '@dpt/db';
import type { Announcement, AnnouncementType } from '@dpt/types';

export function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<AnnouncementType>('general');

  useEffect(() => { getAnnouncements().then(setAnnouncements); }, []);

  async function add() {
    if (!title.trim() || !content.trim()) return;
    const a = await upsertAnnouncement({ title, content, type, published_at: new Date().toISOString() });
    setAnnouncements(prev => [a, ...prev]);
    setTitle(''); setContent('');
  }

  async function remove(id: string) {
    await deleteAnnouncement(id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  }

  return (
    <div>
      <h1>Announcements</h1>
      <div>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Content" />
        <select value={type} onChange={e => setType(e.target.value as AnnouncementType)}>
          <option value="general">General</option>
          <option value="tournament">Tournament</option>
          <option value="rules">Rules</option>
          <option value="rewards">Rewards</option>
        </select>
        <button onClick={add}>Post</button>
      </div>
      <ul>
        {announcements.map(a => (
          <li key={a.id}>
            <strong>{a.title}</strong> [{a.type}]
            <button onClick={() => remove(a.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
