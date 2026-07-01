import type { MetaFunction } from 'react-router';

export { BracketsPage as default } from '../pages/BracketsPage';

export const meta: MetaFunction = () => [
  { title: 'Brackets — Delta Padel Tour' },
  {
    name: 'description',
    content: 'View live tournament brackets for the Delta Padel Tour.',
  },
];
