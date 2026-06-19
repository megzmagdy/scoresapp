import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { supabase } from '@dpt/db';
import { LoginPage } from './pages/LoginPage';
import { AdminLayout } from './components/AdminLayout';
import { RankingsPage } from './pages/RankingsPage';
import { PlayersPage } from './pages/PlayersPage';
import { TeamsPage } from './pages/TeamsPage';
import { TournamentsPage } from './pages/TournamentsPage';
import { CreateTournamentPage } from './pages/CreateTournamentPage';
import { TournamentManagerPage } from './pages/TournamentManagerPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';

export function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (authed === null) return null;

  return (
    <Routes>
      <Route path="/login" element={authed ? <Navigate to="/" replace /> : <LoginPage />} />
      {authed ? (
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/rankings" replace />} />
          <Route path="rankings" element={<RankingsPage />} />
          <Route path="players" element={<PlayersPage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="tournaments" element={<TournamentsPage />} />
          <Route path="tournaments/new" element={<CreateTournamentPage />} />
          <Route path="tournaments/:id" element={<TournamentManagerPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}
