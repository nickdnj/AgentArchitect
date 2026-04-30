import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { requestId } from './middleware/request-id.ts';
import { errorHandler } from './middleware/error.ts';
import { requireAuth } from './middleware/auth.ts';
import healthRoutes from './routes/health.ts';
import authRoutes from './routes/auth.ts';
import briefsRoutes from './routes/briefs.ts';
import variantsRoutes from './routes/variants.ts';
import settingsRoutes from './routes/settings.ts';
import mediaRoutes from './routes/media.ts';

export function createApp(): Hono {
  const app = new Hono();

  app.use('*', logger());
  app.use('*', secureHeaders());
  app.use('*', requestId());
  app.onError(errorHandler);

  // Public routes — health probes + magic-link flow.
  app.route('/healthz', healthRoutes);
  app.route('/auth', authRoutes);

  // Protected routes — require valid signed session cookie (SAD §5.2).
  // Middleware MUST be registered before the routes it protects.
  app.use('/api/*', requireAuth());
  app.use('/media/*', requireAuth());

  app.route('/api/briefs', briefsRoutes);
  app.route('/api/variants', variantsRoutes);
  app.route('/api/settings', settingsRoutes);
  app.route('/media', mediaRoutes);

  return app;
}
