import { Routes, Route } from 'react-router';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { RankingsPage } from './pages/RankingsPage';
import { TournamentsPage } from './pages/TournamentsPage';
import { TournamentPage } from './pages/TournamentPage';
import { BracketsPage } from './pages/BracketsPage';
import '@dpt/ui/globals.css';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="rankings" element={<RankingsPage />} />
        <Route path="brackets" element={<BracketsPage />} />
        <Route path="tournaments" element={<TournamentsPage />} />
        <Route path="tournaments/:id" element={<TournamentPage />} />
      </Route>
    </Routes>
  );
}
