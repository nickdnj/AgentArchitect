import { Hono } from 'hono';
import { z } from 'zod';
import { resolve } from 'node:path';
import { existsSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { presence } from '@lib/services/secrets.ts';
import { syncIncremental, verifyKey as twVerifyKey } from '@lib/services/tw-connector.ts';
import { log } from '@lib/log.ts';
import { audit } from '../middleware/audit.ts';

const app = new Hono();

// SAD §6.1 — Settings screen contract: presence booleans only, never values
app.get('/', (c) => c.json({ secrets: presence() }));

// Vendor keys we accept for update via the UI. Other env vars (SESSION_SECRET,
// SIGNING_KEY, ALLOWED_OPERATORS) are NOT updatable through this surface —
// those need ops-side rotation.
const UPDATABLE_KEYS = new Set([
  'ANTHROPIC_API_KEY',
  'HEYGEN_API_KEY',
  'FASHN_API_KEY',
  'TRIPLEWHALE_API_KEY',
  'RESEND_API_KEY',
]);

const SecretUpdate = z.object({
  key: z.string().refine((k) => UPDATABLE_KEYS.has(k), { message: 'unknown or non-updatable key' }),
  value: z.string().min(8).max(2000),
});

function secretsPath(): string {
  return process.env.SECRETS_PATH ?? resolve(import.meta.dir, '../../../data/secrets.env');
}

/**
 * Update a single key in data/secrets.env and update process.env in-place
 * so the new value takes effect immediately. The file is rewritten preserving
 * order + comments + non-target lines exactly. Mode 0600 is enforced.
 */
function updateSecret(key: string, value: string): void {
  const path = secretsPath();
  let content = '';
  if (existsSync(path)) {
    content = readFileSync(path, 'utf8');
  }
  const lines = content.split('\n');
  let found = false;
  const out = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line;
    const m = trimmed.match(/^([A-Z_]+)=(.*)$/);
    if (!m) return line;
    if (m[1] === key) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!found) {
    // Drop a header comment if the file is empty so future reads have context.
    if (out.filter((l) => l.trim()).length === 0) {
      out.push(`# Saltwater secrets — gitignored, mode 0600.`);
    }
    out.push(`${key}=${value}`);
  }
  writeFileSync(path, out.join('\n'));
  chmodSync(path, 0o600);
  process.env[key] = value;
}

app.post('/secrets', audit('secret_update', 'secret'), async (c) => {
  const requestId = c.get('requestId') as string | undefined;
  const body = await c.req.json().catch(() => null);
  const parsed = SecretUpdate.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'invalid_secret_update', issues: parsed.error.issues }, 400);
  }
  const { key, value } = parsed.data;
  c.set('auditTargetId', key);

  // Light validation per vendor: TW key gets a live identity check before
  // we persist. The other vendors don't have a cheap identity probe — we
  // accept them and let the next render call surface auth issues.
  if (key === 'TRIPLEWHALE_API_KEY') {
    process.env.TRIPLEWHALE_API_KEY = value;
    try {
      const user = await twVerifyKey();
      log.info({ request_id: requestId, tw_user_id: user.user_id }, 'tw_key_validated');
    } catch (err) {
      const message = (err as Error).message;
      log.warn({ request_id: requestId, err: { message } }, 'tw_key_validation_failed');
      c.set('auditMeta', { key, validated: false, error: message.slice(0, 200) });
      return c.json({ error: 'tw_key_invalid', message }, 400);
    }
  }

  updateSecret(key, value);
  c.set('auditMeta', { key, validated: key === 'TRIPLEWHALE_API_KEY' });
  return c.json({ ok: true, key, presence: true });
});

app.post('/tw-sync', audit('tw_sync'), async (c) => {
  const requestId = c.get('requestId') as string | undefined;
  try {
    const result = await syncIncremental();
    c.set('auditMeta', {
      window_start: result.windowStart,
      window_end: result.windowEnd,
      metrics: result.metricsUpserted,
      orders: result.ordersUpserted,
      ad_rows: result.adRowsUpserted,
    });
    return c.json(result);
  } catch (err) {
    const message = (err as Error).message;
    log.error({ request_id: requestId, err: { message } }, 'tw_sync_failed');
    c.set('auditMeta', { error: message.slice(0, 500) });
    // Graceful degradation per F-TW-8: return 502 so the UI can show "TW
    // sync failed — last good sync at <pulled_at>". Never crash the server.
    return c.json({ error: 'tw_sync_failed', message }, 502);
  }
});

export default app;
