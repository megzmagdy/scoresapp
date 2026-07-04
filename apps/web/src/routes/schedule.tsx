import type { MetaFunction } from 'react-router';

export { SchedulePage as default } from '../pages/SchedulePage';

export const meta: MetaFunction = () => [
  { title: 'Schedule — Delta Padel Tour' },
  {
    name: 'description',
    content: 'See when and where upcoming Delta Padel Tour matches are being played.',
  },
];
