import type { MetaFunction } from 'react-router';

export { HomePage as default } from '../pages/HomePage';

export const meta: MetaFunction = () => [
  { title: 'Delta Padel Tour — Home' },
  {
    name: 'description',
    content: 'Follow live padel tournament brackets, rankings, and results on Delta Padel Tour.',
  },
];
