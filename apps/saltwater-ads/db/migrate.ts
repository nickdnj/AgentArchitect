import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { db } from './client.ts';

export interface MigrateResult {
  applied: number;
  total: number;
}

export async function migrate(opts: { quiet?: boolean } = {}): Promise<MigrateResult> {
  const log = opts.quiet ? () => {} : console.log;
  const conn = db();
  conn.exec(`CREATE TABLE IF NOT EXISTS schema_version (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL
  );`);

  const applied = conn.query('SELECT version FROM schema_version').all() as { version: string }[];
  const appliedSet = new Set(applied.map((r) => r.version));

  const migrationsDir = resolve(import.meta.dir, 'migrations');
  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();

  let pending = 0;
  for (const f of files) {
    const version = f.split('_')[0];
    if (appliedSet.has(version)) continue;
    pending++;
    log(`applying ${f}...`);
    const sql = await Bun.file(resolve(migrationsDir, f)).text();
    conn.transaction(() => {
      conn.exec(sql);
      conn.run('INSERT INTO schema_version (version, applied_at) VALUES (?, CURRENT_TIMESTAMP)', [version]);
    }).immediate();
  }

  if (pending === 0) {
    log(`schema is up to date (${applied.length} migrations applied)`);
  } else {
    log(`done — ${pending} migration(s) applied`);
  }

  return { applied: pending, total: files.length };
}

if (import.meta.main) {
  migrate().catch((err) => {
    console.error('migration failed:', err);
    process.exit(1);
  });
}
