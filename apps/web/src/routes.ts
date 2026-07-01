import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('rankings', 'routes/rankings.tsx'),
  route('brackets', 'routes/brackets.tsx'),
  route('tournaments', 'routes/tournaments.tsx'),
  route('tournaments/:id', 'routes/tournament.tsx'),
] satisfies RouteConfig;
