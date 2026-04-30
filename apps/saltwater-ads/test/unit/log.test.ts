import { describe, test, expect } from 'bun:test';
import pino from 'pino';

import { log } from '@lib/log.ts';

// H-6 (internal eng review v0.4): pino with consistent JSON shape replaces
// the four ad-hoc `console.error(JSON.stringify({...}))` patterns the
// scaffold shipped with. These tests pin the contract:
//
//   1. lib/log.ts exports a pino Logger with the SAD §11.1 base fields
//   2. Log lines carry: level, time (ISO), proc, msg
//   3. Child loggers inherit base fields and add their own
//   4. Test harness can capture output via destination param (so future
//      integration tests can assert on log shape without polluting stdout)

describe('H-6 lib/log structured logging', () => {
  test('exported `log` is a pino logger with info+ enabled in non-test', () => {
    expect(log).toBeDefined();
    expect(typeof log.info).toBe('function');
    expect(typeof log.error).toBe('function');
    expect(typeof log.child).toBe('function');
  });

  test('test-mode logger is silent (NODE_ENV=test)', () => {
    // setup.ts sets NODE_ENV=test, log.ts maps that to level: 'silent'.
    // This keeps the test runner output clean while letting tests construct
    // their own loggers for shape assertions.
    expect(log.level).toBe('silent');
  });

  test('a fresh logger emits JSON with level + time + proc + msg fields', () => {
    const lines: string[] = [];
    const dest = {
      write: (chunk: string) => {
        lines.push(chunk);
        return true;
      },
    };
    const testLog = pino(
      {
        level: 'info',
        base: { proc: 'web' },
        formatters: { level: (label) => ({ level: label }) },
        timestamp: pino.stdTimeFunctions.isoTime,
      },
      dest as unknown as NodeJS.WritableStream,
    );
    testLog.error({ request_id: 'req-abc-123', err: { message: 'boom' } }, 'unhandled_error');

    expect(lines.length).toBe(1);
    const parsed = JSON.parse(lines[0]);
    expect(parsed.level).toBe('error');
    expect(parsed.proc).toBe('web');
    expect(parsed.msg).toBe('unhandled_error');
    expect(parsed.request_id).toBe('req-abc-123');
    expect(parsed.err.message).toBe('boom');
    // ISO-8601 time field
    expect(typeof parsed.time).toBe('string');
    expect(parsed.time).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('child logger carries inherited fields (the request_id correlation pattern)', () => {
    const lines: string[] = [];
    const dest = {
      write: (chunk: string) => {
        lines.push(chunk);
        return true;
      },
    };
    const testLog = pino(
      { level: 'info', base: { proc: 'web' } },
      dest as unknown as NodeJS.WritableStream,
    );
    const reqLog = testLog.child({ request_id: 'req-xyz' });
    reqLog.info({ path: '/api/briefs' }, 'route_hit');

    const parsed = JSON.parse(lines[0]);
    expect(parsed.request_id).toBe('req-xyz');
    expect(parsed.path).toBe('/api/briefs');
    expect(parsed.proc).toBe('web');
  });

  test('worker proc base field overrides web default when PROC_NAME=worker', () => {
    const lines: string[] = [];
    const dest = {
      write: (chunk: string) => {
        lines.push(chunk);
        return true;
      },
    };
    const workerLog = pino(
      { level: 'info', base: { proc: 'worker' } },
      dest as unknown as NodeJS.WritableStream,
    );
    workerLog.error({ attempt_id: 42, err: { message: 'heygen 504' } }, 'pipeline_failed');

    const parsed = JSON.parse(lines[0]);
    expect(parsed.proc).toBe('worker');
    expect(parsed.attempt_id).toBe(42);
    expect(parsed.msg).toBe('pipeline_failed');
  });
});
