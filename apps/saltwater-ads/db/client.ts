import { Database } from 'bun:sqlite';
import { resolve } from 'node:path';

// SAD §3 — DB driver.
//
// 2026-05-02 V-EVAL pass:
//   - better-sqlite3 doesn't load in Bun (oven-sh/bun#4290, 3+ years open)
//   - libsql works but is async-only (162 sync call sites in this codebase)
//   - bun:sqlite WAL mode itself produces SQLITE_IOERR on Bun 1.3.8 (verified
//     empirically — every re-open() after a self-heal threw IOERR on the
//     PRAGMA chain). Cross-process WAL is also broken (the symptom that
//     started the investigation).
//
// Conclusion: stay on bun:sqlite + DELETE journal mode (default). The app
// runs as a SINGLE PROCESS with INLINE_WORKER=true so request handlers and
// the tick loop share one driver. dbWorker() returns a separate Database
// instance to avoid mid-await state corruption (eng-review-3 finding).
//
// When this becomes a real bottleneck (Joe ≥ ~50 briefs/day OR Bun ships
// better-sqlite3 / a fixed bun:sqlite WAL), revisit. Tracked as V-WAL-EVAL.

const DB_PATH = process.env.DB_PATH ?? resolve(import.meta.dir, '../data/saltwater.db');

let _db: Database | null = null;
let _dbWorker: Database | null = null;

function open(): Database {
  const conn = new Database(DB_PATH, { create: true });
  // DELETE journal mode (default — DON'T touch journal_mode on bun:sqlite).
  // busy_timeout lets a contended writer wait briefly instead of throwing.
  conn.exec('PRAGMA busy_timeout = 5000;');
  conn.exec('PRAGMA foreign_keys = ON;');
  return conn;
}

export function db(): Database {
  if (_db) return _db;
  _db = open();
  return _db;
}

/**
 * Worker-specific connection. Each process should hold its own; cross-process
 * coordination happens via WAL + the SQLite file lock, not via shared in-memory
 * state.
 */
export function dbWorker(): Database {
  if (_dbWorker) return _dbWorker;
  _dbWorker = open();
  return _dbWorker;
}

/**
 * Self-healing: if a connection produces "disk I/O error" or similar driver
 * hiccup, drop the singleton so the next db() call opens a fresh one. Cheap
 * insurance — under WAL it should rarely fire.
 */
export function resetDbConnection(): void {
  try { _db?.close(); } catch { /* ignore */ }
  try { _dbWorker?.close(); } catch { /* ignore */ }
  _db = null;
  _dbWorker = null;
}

export function closeDb(): void {
  _db?.close();
  _dbWorker?.close();
  _db = null;
  _dbWorker = null;
}

/**
 * Test helper: open an isolated in-memory DB. Used by state-machine.test.ts
 * to exercise CAS patterns without touching the singleton or disk.
 */
export function openInMemoryDb(): Database {
  const conn = new Database(':memory:');
  conn.exec('PRAGMA foreign_keys = ON;');
  return conn;
}

export type { Database };
