import { defineConfig } from 'vite';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzer } from 'vite-bundle-analyzer'

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);
export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), analyzer()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../packages/ui/src'),
      '~': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    // Deps only reachable through the @dpt/ui / @dpt/db workspace packages
    // aren't found by Vite's initial crawl, which otherwise triggers a
    // late "new dependencies optimized" reload on first navigation and can
    // race the client entry's dynamic import (504 Outdated Optimize Dep).
    include: ['framer-motion', 'clsx', 'tailwind-merge', 'react-fast-marquee', '@supabase/supabase-js'],
  },
});
