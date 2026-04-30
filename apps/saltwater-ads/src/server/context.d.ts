// Hono context variable map — augments the global Variables type so
// `c.set('foo', ...)` and `c.get('foo')` typecheck across middleware + routes.
// Centralized here so middleware/auth.ts, middleware/audit.ts, and route
// handlers don't each redeclare the same keys.

import 'hono';

declare module 'hono' {
  interface ContextVariableMap {
    requestId: string;
    email: string;
    auditTargetId: string;
    auditMeta: Record<string, unknown>;
  }
}
