import type { MiddlewareHandler } from 'hono';
import { randomUUID } from 'node:crypto';
import { log } from '@lib/log.ts';

export function requestId(): MiddlewareHandler {
  return async (c, next) => {
    const id = c.req.header('x-request-id') ?? randomUUID();
    c.set('requestId', id);
    // Child logger carries request_id automatically — routes use c.get('log')
    // for correlated lines per SAD §11.2.
    c.set('log', log.child({ request_id: id }));
    c.header('x-request-id', id);
    await next();
  };
}
