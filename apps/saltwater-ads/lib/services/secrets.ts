import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// SAD §6 — secrets management.
// Vendor keys never leave the server. Loaded at process boot.

const DEFAULT_SECRETS_PATH = resolve(import.meta.dir, '../../data/secrets.env');
const SECRETS_PATH = process.env.SECRETS_PATH ?? DEFAULT_SECRETS_PATH;

export function loadSecrets(): void {
  if (!existsSync(SECRETS_PATH)) {
    console.warn(`[secrets] no ${SECRETS_PATH} found — relying on process.env only`);
    return;
  }
  const text = readFileSync(SECRETS_PATH, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const m = trimmed.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1');
    }
  }
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`missing required secret: ${name}`);
  return v;
}

export const secrets = {
  anthropic:    () => required('ANTHROPIC_API_KEY'),
  heygen:       () => required('HEYGEN_API_KEY'),
  fashn:        () => required('FASHN_API_KEY'),
  triplewhale:  () => required('TRIPLEWHALE_API_KEY'),
  resend:       () => required('RESEND_API_KEY'),
  sessionSig:   () => required('SESSION_SECRET'),
  signingKey:   () => required('SIGNING_KEY'),
  allowedOperators: () => required('ALLOWED_OPERATORS').split(',').map((s) => s.trim().toLowerCase()),
};

export function presence(): Record<string, boolean> {
  return {
    anthropic:   !!process.env.ANTHROPIC_API_KEY,
    heygen:      !!process.env.HEYGEN_API_KEY,
    fashn:       !!process.env.FASHN_API_KEY,
    triplewhale: !!process.env.TRIPLEWHALE_API_KEY,
    resend:      !!process.env.RESEND_API_KEY,
  };
}
