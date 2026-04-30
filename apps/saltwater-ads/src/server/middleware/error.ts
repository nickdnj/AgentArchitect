import type { ErrorHandler } from 'hono';

export const errorHandler: ErrorHandler = (err, c) => {
  const requestId = c.get('requestId') as string | undefined;
  console.error(JSON.stringify({
    level: 'error',
    request_id: requestId,
    error: err.message,
    stack: err.stack,
  }));
  return c.json({
    error: 'internal_error',
    message: 'Something went wrong',
    request_id: requestId,
  }, 500);
};
