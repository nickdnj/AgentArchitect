import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Hono } from 'hono';
import { setSignedCookie } from 'hono/cookie';

import { loadSecrets, secrets } from '@lib/services/secrets.ts';
import { createApp } from '../../src/server/app.ts';

async function mintSessionCookie(email: string): Promise<string> {
  const tmp = new Hono();
  tmp.get('/', async (c) => {
    await setSignedCookie(c, 'sw_session', JSON.stringify({ email }), secrets.sessionSig());
    return c.text('ok');
  });
  const res = await tmp.request('/');
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) throw new Error('mintSessionCookie: no set-cookie header');
  return setCookie.split(';')[0];
}

// Use a per-test STATIC_ROOT so we can simulate "dist exists" vs "dist missing"
// without poisoning the real ./dist/web output.
const TMP_STATIC = resolve(import.meta.dir, '../../data/test-static-root');

describe('H-4 static asset + SPA fallback', () => {
  describe('when dist/web is NOT built (dev / fresh checkout)', () => {
    let app: ReturnType<typeof createApp>;

    beforeAll(async () => {
      // Point STATIC_ROOT at a guaranteed-missing directory.
      process.env.STATIC_ROOT = resolve(import.meta.dir, '../../data/does-not-exist');
      loadSecrets();
      app = createApp();
    });

    test('GET / → 404 spa_not_built (graceful, not crash)', async () => {
      const res = await app.request('/');
      expect(res.status).toBe(404);
      const body = (await res.json()) as { error: string; reason: string };
      expect(body.error).toBe('not_found');
      expect(body.reason).toBe('spa_not_built');
    });

    test('GET /some/spa/route → 404 spa_not_built (no crash)', async () => {
      const res = await app.request('/review-queue/42');
      expect(res.status).toBe(404);
      const body = (await res.json()) as { error: string; reason: string; path: string };
      expect(body.error).toBe('not_found');
      expect(body.reason).toBe('spa_not_built');
      expect(body.path).toBe('/review-queue/42');
    });

    test('GET /api/nonexistent without session → 401 (auth gate fires first)', async () => {
      const res = await app.request('/api/nonexistent');
      expect(res.status).toBe(401);
    });

    test('GET /api/nonexistent with session → 404 JSON (not SPA shell)', async () => {
      const cookie = await mintSessionCookie('test@example.com');
      const res = await app.request('/api/nonexistent', { headers: { cookie } });
      expect(res.status).toBe(404);
      const body = (await res.json()) as { error: string; reason: string; path: string };
      expect(body.error).toBe('not_found');
      expect(body.reason).toBe('route_not_found');
      expect(body.path).toBe('/api/nonexistent');
    });

    test('GET /auth/nonexistent → 404 JSON (auth namespace stays JSON)', async () => {
      const res = await app.request('/auth/nonexistent');
      expect(res.status).toBe(404);
      const body = (await res.json()) as { error: string; reason: string };
      expect(body.error).toBe('not_found');
      expect(body.reason).toBe('route_not_found');
    });

    test('GET /media/nonexistent → 401 (auth gate fires before notFound)', async () => {
      // /media/* is gated by requireAuth — even nonexistent paths 401 first.
      const res = await app.request('/media/nonexistent');
      expect(res.status).toBe(401);
    });

    test('GET /healthz/nonexistent → 404 JSON', async () => {
      const res = await app.request('/healthz/nonexistent');
      expect(res.status).toBe(404);
      const body = (await res.json()) as { error: string; reason: string };
      expect(body.error).toBe('not_found');
      expect(body.reason).toBe('route_not_found');
    });
  });

  describe('when dist/web IS built (production)', () => {
    let app: ReturnType<typeof createApp>;

    beforeAll(async () => {
      // Materialize a fake dist/web tree so SPA fallback can serve a real shell.
      await mkdir(resolve(TMP_STATIC, 'assets'), { recursive: true });
      await writeFile(
        resolve(TMP_STATIC, 'index.html'),
        '<!doctype html><html><body><div id="root">SPA shell</div></body></html>',
      );
      await writeFile(
        resolve(TMP_STATIC, 'assets', 'app.js'),
        'console.log("bundled");\n',
      );

      process.env.STATIC_ROOT = TMP_STATIC;
      loadSecrets();
      app = createApp();
    });

    afterAll(async () => {
      await rm(TMP_STATIC, { recursive: true, force: true });
      delete process.env.STATIC_ROOT;
    });

    test('GET / → SPA shell (200, text/html)', async () => {
      const res = await app.request('/');
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/html');
      const body = await res.text();
      expect(body).toContain('SPA shell');
    });

    test('GET /review-queue/42 → SPA shell (client-side route)', async () => {
      const res = await app.request('/review-queue/42');
      expect(res.status).toBe(200);
      const body = await res.text();
      expect(body).toContain('SPA shell');
    });

    test('GET /assets/app.js → bundled asset (200)', async () => {
      const res = await app.request('/assets/app.js');
      expect(res.status).toBe(200);
      const body = await res.text();
      expect(body).toContain('bundled');
    });

    test('GET /assets/missing.js → 404', async () => {
      const res = await app.request('/assets/missing.js');
      expect(res.status).toBe(404);
    });

    test('GET /api/nonexistent with session → 404 JSON (not SPA shell, even with dist present)', async () => {
      const cookie = await mintSessionCookie('test@example.com');
      const res = await app.request('/api/nonexistent', { headers: { cookie } });
      expect(res.status).toBe(404);
      const body = (await res.json()) as { error: string; reason: string };
      expect(body.error).toBe('not_found');
      expect(body.reason).toBe('route_not_found');
    });

    test('GET /healthz still works (200) — static config does not break health', async () => {
      const res = await app.request('/healthz');
      expect(res.status).toBe(200);
    });
  });
});
