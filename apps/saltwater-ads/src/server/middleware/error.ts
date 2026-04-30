import type { ErrorHandler } from 'hono';
import { log } from '@lib/log.ts';

export const errorHandler: ErrorHandler = (err, c) => {
  const requestId = c.get('requestId');
  // Always pass request_id as a field — even if the per-request child logger
  // didn't fire, this keeps the correlation. Routes themselves can use
  // c.get('log') to avoid threading request_id through every call.
  log.error(
    {
      request_id: requestId,
      err: { message: err.message, stack: err.stack },
      method: c.req.method,
      path: c.req.path,
    },
    'unhandled_error',
  );
  return c.json({
    error: 'internal_error',
    message: 'Something went wrong',
    request_id: requestId,
  }, 500);
};
