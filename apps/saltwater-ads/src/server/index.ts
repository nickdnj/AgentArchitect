import { serve } from 'bun';
import { createApp } from './app.ts';
import { loadSecrets } from '@lib/services/secrets.ts';
import { log } from '@lib/log.ts';

loadSecrets();

const PORT = Number(process.env.PORT ?? 3001);
const app = createApp();

serve({
  fetch: app.fetch,
  port: PORT,
  development: process.env.NODE_ENV !== 'production',
});

log.info({ port: PORT, pid: process.pid }, 'web_started');
