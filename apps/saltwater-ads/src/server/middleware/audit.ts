import type { MiddlewareHandler } from 'hono';
import { db } from '@db/client.ts';
import { log } from '@lib/log.ts';

// SAD §5.3 + §11 — write audit_log on mutating routes
export function audit(action: string, targetType?: string): MiddlewareHandler {
  return async (c, next) => {
    await next();
    const requestId = c.get('requestId') as string | undefined;
    const email = c.get('email') as string | undefined;
    const targetId = c.get('auditTargetId') as string | undefined;
    const meta = c.get('auditMeta') as Record<string, unknown> | undefined;
    try {
      db().run(
        `INSERT INTO audit_log (email, request_id, action, target_type, target_id, meta_json)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          email ?? null,
          requestId ?? null,
          action,
          targetType ?? null,
          targetId ?? null,
          meta ? JSON.stringify(meta) : null,
        ]
      );
    } catch (err) {
      log.error(
        {
          request_id: requestId,
          err: { message: (err as Error).message },
          action,
          target_type: targetType,
          target_id: targetId,
        },
        'audit_log_write_failed',
      );
    }
  };
}
