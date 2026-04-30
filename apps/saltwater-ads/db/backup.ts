import { $ } from 'bun';
import { resolve } from 'node:path';

const DB_PATH = process.env.DB_PATH ?? resolve(import.meta.dir, '../data/saltwater.db');
const BACKUPS_DIR = resolve(import.meta.dir, '../data/backups');
const RETENTION_DAYS = 30;

async function backup(): Promise<void> {
  const date = new Date().toISOString().slice(0, 10);
  const dest = resolve(BACKUPS_DIR, `saltwater-${date}.db`);
  await $`mkdir -p ${BACKUPS_DIR}`;
  await $`sqlite3 ${DB_PATH} ".backup ${dest}"`;
  console.log(`backup → ${dest}`);

  // prune older than retention window
  const cutoff = Date.now() - RETENTION_DAYS * 86400 * 1000;
  const fs = await import('node:fs/promises');
  for (const f of await fs.readdir(BACKUPS_DIR)) {
    const stat = await fs.stat(resolve(BACKUPS_DIR, f));
    if (stat.mtimeMs < cutoff) {
      await fs.unlink(resolve(BACKUPS_DIR, f));
      console.log(`pruned ${f}`);
    }
  }
}

if (import.meta.main) {
  backup().catch((err) => {
    console.error('backup failed:', err);
    process.exit(1);
  });
}
