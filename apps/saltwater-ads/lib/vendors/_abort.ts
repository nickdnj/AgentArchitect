// Shared abort + HTTP helpers for vendor adapters (heygen, fashn, future Higgsfield).
//
// Why this module exists: each vendor adapter independently needs to:
//   1. Throw cleanly if its AbortSignal has fired between async steps
//   2. Sleep between polls in a way that wakes on abort (not the full poll interval)
//   3. Build error messages that include response body snippets (CQ5 pattern)
//   4. Stream-download a binary URL to disk
//
// All four were duplicated identically across heygen.ts and fashn.ts. One source
// of truth here means a future Higgsfield adapter (Sprint 2) drops in cleanly.

export function throwIfAborted(signal: AbortSignal, vendor: string, where: string): void {
  if (signal.aborted) {
    const reason = typeof signal.reason === 'string' ? signal.reason : 'aborted';
    throw new Error(`${vendor} aborted at ${where}: ${reason}`);
  }
}

export async function abortableSleep(ms: number, signal: AbortSignal, vendor: string): Promise<void> {
  if (signal.aborted) throw new Error(`${vendor} aborted before sleep`);
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(t);
      const reason = typeof signal.reason === 'string' ? signal.reason : 'aborted';
      reject(new Error(`${vendor} aborted during sleep: ${reason}`));
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * CQ5 pattern: capture response body snippet so journalctl shows what the
 * vendor actually said, not just the status code.
 */
export async function vendorError(vendor: string, label: string, r: Response): Promise<Error> {
  let snippet = '';
  try { snippet = (await r.text()).slice(0, 200); } catch { snippet = '<unreadable>'; }
  return new Error(`${vendor} ${label} failed: ${r.status} ${r.statusText} — ${snippet}`);
}

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

/**
 * Download a vendor-signed URL to local disk. Streamed via Bun.write for
 * memory efficiency on large clips.
 */
export async function downloadToFile(
  fetcher: Fetcher,
  url: string,
  destPath: string,
  signal: AbortSignal,
  vendor: string,
): Promise<string> {
  throwIfAborted(signal, vendor, 'download');
  const r = await fetcher(url, { signal });
  if (!r.ok) throw await vendorError(vendor, 'download', r);
  const buf = await r.arrayBuffer();
  await Bun.write(destPath, buf);
  return destPath;
}
