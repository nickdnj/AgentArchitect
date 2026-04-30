import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { api } from '../../src/web/api.ts';

// H-2 regression: api.variants.approve(id) used to hardcode
// `ai_disclosure_acknowledged: true` regardless of UI state, defeating the
// PRD §7.5 hard gate. The fix requires callers to pass the actual checkbox
// state. These tests pin that contract.

interface CapturedRequest {
  url: string;
  method: string;
  body: unknown;
}

let captured: CapturedRequest | null;
const realFetch = globalThis.fetch;

beforeEach(() => {
  captured = null;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    captured = {
      url,
      method: init?.method ?? 'GET',
      body: init?.body ? JSON.parse(init.body as string) : undefined,
    };
    return new Response(JSON.stringify({ download_url: 'https://example.test/x.mp4' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe('H-2 api.variants.approve sends actual checkbox state', () => {
  test('approve(id, true) sends ai_disclosure_acknowledged: true', async () => {
    await api.variants.approve(42, true);
    expect(captured).not.toBeNull();
    expect(captured!.url).toBe('/api/variants/42/approve');
    expect(captured!.method).toBe('POST');
    expect(captured!.body).toEqual({ ai_disclosure_acknowledged: true });
  });

  test('approve(id, false) sends ai_disclosure_acknowledged: false (NOT silently rewritten)', async () => {
    // The whole point: the client used to silently lie and send `true`.
    // Now it sends what the user actually chose. The server's z.literal(true)
    // validator will reject false with 400 ai_disclosure_required — verified
    // by routes/variants.ts; not duplicated here. This test pins the client's
    // honesty.
    await api.variants.approve(99, false);
    expect(captured!.body).toEqual({ ai_disclosure_acknowledged: false });
  });
});

describe('api.variants other shapes (smoke)', () => {
  test('regen sends feedback', async () => {
    await api.variants.regen(7, 'less ocean, more grit');
    expect(captured!.url).toBe('/api/variants/7/regen');
    expect(captured!.body).toEqual({ feedback: 'less ocean, more grit' });
  });

  test('reject is a POST with empty body', async () => {
    await api.variants.reject(7);
    expect(captured!.url).toBe('/api/variants/7/reject');
    expect(captured!.method).toBe('POST');
  });
});
