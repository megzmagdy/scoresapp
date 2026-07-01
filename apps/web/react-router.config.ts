import type { Config } from '@react-router/dev/config';

export default {
  appDirectory: 'src',
  // No Node server: build static HTML for all static routes, hydrate on the client.
  ssr: false,
  // Prerenders every route without a dynamic segment (e.g. skips /tournaments/:id).
  prerender: true,
} satisfies Config;
