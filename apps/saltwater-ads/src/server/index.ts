import { serve } from 'bun';
import { createApp } from './app.ts';
import { loadSecrets } from '@lib/services/secrets.ts';

loadSecrets();

const PORT = Number(process.env.PORT ?? 3001);
const app = createApp();

serve({
  fetch: app.fetch,
  port: PORT,
  development: process.env.NODE_ENV !== 'production',
});

console.log(`saltwater-ads web ⟶ http://localhost:${PORT}`);
