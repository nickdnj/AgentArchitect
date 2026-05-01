// Typed fetch client. Routes proxied through Vite to Hono server in dev.

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
    credentials: 'include',
  });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`API ${r.status} ${path}: ${body}`);
  }
  return (await r.json()) as T;
}

export interface BriefInput {
  free_text: string;
  sku_id?: string | null;
  pattern?: 'founder' | 'problem_solution' | 'limited_drop' | null;
  audience_tag?: string | null;
  season?: string | null;
}

export const api = {
  briefs: {
    create: (input: BriefInput) =>
      request<{ brief_id: number; variant_ids: number[] }>('/api/briefs', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  },
  variants: {
    list: (status?: string) =>
      request<{ variants: unknown[] }>(`/api/variants${status ? `?status=${encodeURIComponent(status)}` : ''}`),
    get: (id: number) => request<{ variant: unknown }>(`/api/variants/${id}`),
    // PRD §7.5 hard gate: caller MUST pass the actual checkbox state. Hardcoding
    // `true` here would defeat the disclosure gate (H-2 in internal eng review).
    approve: (id: number, aiDisclosureAcknowledged: boolean) =>
      request<{ download_url: string }>(`/api/variants/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ ai_disclosure_acknowledged: aiDisclosureAcknowledged }),
      }),
    regen: (id: number, feedback: string) =>
      request<{ new_variant_id: number }>(`/api/variants/${id}/regen`, {
        method: 'POST',
        body: JSON.stringify({ feedback }),
      }),
    reject: (id: number) =>
      request<{ ok: true }>(`/api/variants/${id}/reject`, { method: 'POST', body: '{}' }),
  },
  settings: {
    get: () => request<{ secrets: Record<string, boolean> }>('/api/settings'),
    updateSecret: (key: string, value: string) =>
      request<{ ok: true; key: string; presence: true }>('/api/settings/secrets', {
        method: 'POST',
        body: JSON.stringify({ key, value }),
      }),
    twSync: () =>
      request<{
        windowStart: string;
        windowEnd: string;
        metricsUpserted: number;
        ordersUpserted: number;
        adRowsUpserted: number;
        watermark: string;
      }>('/api/settings/tw-sync', { method: 'POST', body: '{}' }),
  },
  assets: {
    listBRoll: () =>
      request<{
        clips: Array<{
          id: number;
          path: string;
          duration_seconds: number;
          width: number;
          height: number;
          tags: string[];
          season: string | null;
          notes: string | null;
          added_at: string;
          url: string;
        }>;
      }>('/api/assets/b-roll'),
    uploadBRoll: async (file: File, tags: string[], season: string, notes: string): Promise<unknown> => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('tags', tags.join(','));
      fd.append('season', season);
      fd.append('notes', notes);
      const r = await fetch('/api/assets/b-roll', { method: 'POST', body: fd, credentials: 'include' });
      if (!r.ok) throw new Error(`Upload ${r.status}: ${await r.text()}`);
      return r.json();
    },
    deleteBRoll: (id: number) =>
      request<{ ok: true }>(`/api/assets/b-roll/${id}`, { method: 'DELETE' }),
    patchBRoll: (id: number, patch: { tags?: string[]; season?: string; notes?: string | null }) =>
      request<{ ok: true; changed: number }>(`/api/assets/b-roll/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    listBrand: () =>
      request<{
        assets: Array<{ name: string; size_bytes: number; added_at: string; url: string; type: 'image' | 'video' | 'other' }>;
      }>('/api/assets/brand'),
    uploadBrand: async (file: File): Promise<unknown> => {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/assets/brand', { method: 'POST', body: fd, credentials: 'include' });
      if (!r.ok) throw new Error(`Upload ${r.status}: ${await r.text()}`);
      return r.json();
    },
    deleteBrand: (name: string) =>
      request<{ ok: true }>(`/api/assets/brand/${encodeURIComponent(name)}`, { method: 'DELETE' }),
    listBucket: () =>
      request<{
        files: Array<{ name: string; exists: boolean; size_bytes: number; content: string }>;
      }>('/api/assets/bucket'),
  },
};
