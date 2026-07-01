import type { MetaFunction } from 'react-router';

export { TournamentsPage as default } from '../pages/TournamentsPage';

export const meta: MetaFunction = () => [
  { title: 'Tournaments — Delta Padel Tour' },
  {
    name: 'description',
    content: 'Browse upcoming and past Delta Padel Tour tournaments.',
  },
];
