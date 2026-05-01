import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// SAD §6 — secrets management.
// Vendor keys never leave the server. Loaded at process boot.
//
// Format constraints (CQ3):
//   - Lines: KEY=value (KEY = uppercase + underscores)
//   - Comments: lines starting with #
//   - Blank lines OK
//   - Optional double-quote wrapping: KEY="value with spaces"
//   - Multi-line values, escape chars, single-quote wrapping NOT supported.
//     A future PEM/JSON-blob secret needs base64 encoding or a separate file.
// Lines that don't match the KEY=VALUE regex log a warning and are skipped —
// previously they were silently dropped, which made typos hard to debug.

function defaultSecretsPath(): string {
  return resolve(import.meta.dir, '../../data/secrets.env');
}

export function loadSecrets(): void {
  const path = process.env.SECRETS_PATH ?? defaultSecretsPath();
  if (!existsSync(path)) {
    console.warn(`[secrets] no ${path} found — relying on process.env only`);
    return;
  }
  const text = readFileSync(path, 'utf8');
  let lineNumber = 0;
  for (const line of text.split('\n')) {
    lineNumber++;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const m = trimmed.match(/^([A-Z_]+)=(.*)$/);
    if (!m) {
      console.warn(`[secrets] ${path}:${lineNumber} ignored — does not match KEY=VALUE: ${trimmed.slice(0, 60)}${trimmed.length > 60 ? '...' : ''}`);
      continue;
    }
    if (!process.env[m[1]]) {
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
