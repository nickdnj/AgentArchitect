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
    approve: (id: number) =>
      request<{ download_url: string }>(`/api/variants/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ ai_disclosure_acknowledged: true }),
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
  },
};
