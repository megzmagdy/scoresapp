import type { MetaFunction } from 'react-router';

export { RankingsPage as default } from '../pages/RankingsPage';

export const meta: MetaFunction = () => [
  { title: 'Rankings — Delta Padel Tour' },
  {
    name: 'description',
    content: 'See current player and team rankings across the Delta Padel Tour season.',
  },
];
