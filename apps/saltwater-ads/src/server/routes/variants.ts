import { Hono } from 'hono';
import { z } from 'zod';

const app = new Hono();

// GET /api/variants?status=ready_for_review
app.get('/', (c) => {
  const status = c.req.query('status');
  // TODO: SELECT variants filtered by status, with signed thumbnail URLs
  return c.json({ error: 'not_implemented', step: 'variants.list', filter: { status } }, 501);
});

app.get('/:id', (c) => {
  // TODO: full variant detail incl. video signed URL, hook text, brief context, history
  return c.json({ error: 'not_implemented', step: 'variants.get' }, 501);
});

const ApproveBody = z.object({
  ai_disclosure_acknowledged: z.literal(true), // hard gate per PRD §7.5
});

app.post('/:id/approve', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = ApproveBody.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'ai_disclosure_required' }, 400);
  }
  // TODO: INSERT approval, UPDATE variant.status='approved', mint 24h signed download URL
  return c.json({ error: 'not_implemented', step: 'variants.approve' }, 501);
});

app.post('/:id/reject', async (c) => {
  // TODO: INSERT approval(decision='reject'), UPDATE variant.status='rejected'
  return c.json({ error: 'not_implemented', step: 'variants.reject' }, 501);
});

const RegenBody = z.object({
  feedback: z.string().min(1).max(1000),
});

app.post('/:id/regen', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = RegenBody.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'invalid_regen_request', issues: parsed.error.issues }, 400);
  }
  // TODO: enqueue new render_attempt with feedback included in next prompt
  return c.json({ error: 'not_implemented', step: 'variants.regen' }, 501);
});

export default app;
