import type { MetaFunction } from 'react-router';

export { TournamentPage as default } from '../pages/TournamentPage';

export const meta: MetaFunction = () => [
  { title: 'Tournament — Delta Padel Tour' },
  {
    name: 'description',
    content: 'Live bracket, participants, and results for this Delta Padel Tour tournament.',
  },
];
