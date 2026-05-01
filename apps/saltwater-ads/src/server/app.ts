import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { resolve } from 'node:path';
import { requestId } from './middleware/request-id.ts';
import { errorHandler } from './middleware/error.ts';
import { requireAuth } from './middleware/auth.ts';
import healthRoutes from './routes/health.ts';
import authRoutes from './routes/auth.ts';
import briefsRoutes from './routes/briefs.ts';
import variantsRoutes from './routes/variants.ts';
import settingsRoutes from './routes/settings.ts';
import assetsRoutes from './routes/assets.ts';
import mediaRoutes from './routes/media.ts';

// In dev, Vite serves the SPA on :5173 and proxies /api|/auth|/media to Hono.
// In prod, Hono serves dist/web/ directly. STATIC_ROOT can override for tests.
const API_PREFIXES = ['/api/', '/auth/', '/media/', '/healthz'] as const;
function isApiPath(path: string): boolean {
  return API_PREFIXES.some((p) => path === p || path.startsWith(p));
}

export function createApp(): Hono {
  // Read STATIC_ROOT per call so tests + dev/prod can override.
  const staticRoot = process.env.STATIC_ROOT ?? resolve(import.meta.dir, '../../dist/web');
  const spaIndex = `${staticRoot}/index.html`;
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
  app.route('/api/assets', assetsRoutes);
  app.route('/media', mediaRoutes);

  // Static assets (Vite build output). Bundled JS/CSS live under /assets/.
  // hono/bun's serveStatic resolves paths relative to process.cwd(), not an
  // absolute root, so we use a custom handler with Bun.file() instead.
  // Missing assets must NOT fall through to the SPA shell handler — they're
  // hard 404s (otherwise <script src="/assets/missing.js"> would return HTML
  // and the browser would silently fail).
  app.get('/assets/*', async (c) => {
    const file = Bun.file(`${staticRoot}${c.req.path}`);
    if (!(await file.exists())) {
      return c.json({ error: 'not_found', reason: 'asset_missing', path: c.req.path }, 404);
    }
    return new Response(file);
  });
  app.get('/favicon.ico', async (c) => {
    const file = Bun.file(`${staticRoot}/favicon.ico`);
    if (!(await file.exists())) {
      return c.json({ error: 'not_found', reason: 'asset_missing', path: '/favicon.ico' }, 404);
    }
    return new Response(file);
  });

  // SPA fallback: anything that didn't match an API/auth/media/healthz route
  // and didn't match a static asset returns the SPA shell so React Router
  // can handle the route client-side. API 404s stay JSON.
  //
  // CQ1: 404 responses share a single shape — { error, reason, path } —
  // so clients can branch on `reason` without parsing free-text:
  //   reason: 'route_not_found' — API path with no handler (auth-gated paths
  //                                still 401 before reaching here)
  //   reason: 'asset_missing'   — /assets/* file doesn't exist
  //   reason: 'spa_not_built'   — frontend hasn't been built (dev/fresh repo)
  app.notFound(async (c) => {
    const path = c.req.path;
    if (isApiPath(path)) {
      return c.json({ error: 'not_found', reason: 'route_not_found', path }, 404);
    }
    const file = Bun.file(spaIndex);
    if (await file.exists()) {
      return new Response(file, {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    }
    return c.json({ error: 'not_found', reason: 'spa_not_built', path }, 404);
  });

  return app;
}
