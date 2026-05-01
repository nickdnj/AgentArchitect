import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  root: 'src/web',
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@lib': resolve(__dirname, 'lib'),
      '@db': resolve(__dirname, 'db'),
    },
  },
  build: {
    outDir: resolve(__dirname, 'dist/web'),
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    port: 5173,
    proxy: {
      // Regex patterns instead of bare prefixes: bare '/api' would also match
      // '/api.ts' (the typed-fetch client file in src/web/) and proxy it to
      // Hono, which returns spa_not_built 404. Discovered in eng-review-3
      // dogfood. Trailing slash + ^ anchor avoids the collision.
      '^/api/': 'http://localhost:3001',
      '^/auth/': 'http://localhost:3001',
      '^/media/': 'http://localhost:3001',
      '/healthz': 'http://localhost:3001',
    },
  },
});
