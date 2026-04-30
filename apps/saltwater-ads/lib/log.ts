// SAD §11.1 — structured logging.
// pino with JSON output to stdout. systemd captures via journalctl.
//
// Every log line carries:
//   - proc: 'web' | 'worker' (from PROC_NAME env)
//   - request_id: per-HTTP-request (web; via child logger from middleware)
//   - attempt_id, variant_id, brief_id where relevant
//   - vendor, cost_credits on vendor calls
//
// Replaces the ad-hoc `console.error(JSON.stringify({...}))` patterns the
// scaffold shipped with — those had inconsistent field names (source vs no
// source, error vs message) and made `journalctl -u saltwater-ads-* -f`
// grepping unreliable.

import pino, { type Logger } from 'pino';

export const log: Logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'test' ? 'silent' : 'info'),
  base: { proc: process.env.PROC_NAME ?? 'web' },
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export type { Logger };
