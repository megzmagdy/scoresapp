import { supabase } from '../client';
import { requireAuth } from '../auth';
import type { Announcement } from '@dpt/types';

export async function getAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('published_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function upsertAnnouncement(
  announcement: Omit<Announcement, 'id'> & { id?: string }
): Promise<Announcement> {
  await requireAuth();
  const { data, error } = await supabase
    .from('announcements')
    .upsert(announcement)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await requireAuth();
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) throw error;
}
