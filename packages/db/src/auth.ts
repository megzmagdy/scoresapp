import { supabase } from './client';

export async function requireAuth(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Unauthorized: you must be signed in to perform this action.');
  }
}
