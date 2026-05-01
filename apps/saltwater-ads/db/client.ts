import { Database } from 'bun:sqlite';
import { resolve } from 'node:path';

const DB_PATH = process.env.DB_PATH ?? resolve(import.meta.dir, '../data/saltwater.db');

let _db: Database | null = null;
let _dbWorker: Database | null = null;

function open(): Database {
  const conn = new Database(DB_PATH, { create: true });
  // Eng-review-3 dogfood: bun:sqlite hits SQLITE_IOERR ("disk I/O error")
  // on `PRAGMA journal_mode = WAL` even in single-process — appears to be
  // a Bun-runtime quirk on macOS APFS. The default DELETE journal mode is
  // perfectly adequate for Joe's ~3-briefs/week volume:
  //   - Single writer at a time (we have one process anyway)
  //   - Reads block on writes (worker ticks every 2s, brief POST is rare)
  //   - No SHM/WAL files to corrupt
  //
  // If volume grows past ~50 briefs/day or read-vs-write contention becomes
  // observable, swap bun:sqlite for better-sqlite3 + re-enable WAL.
  // Tracked in TODOS as V-WAL-EVAL.
  conn.exec('PRAGMA foreign_keys = ON;');
  conn.exec('PRAGMA busy_timeout = 5000;');
  return conn;
}

export function db(): Database {
  if (_db) return _db;
  _db = open();
  return _db;
}

/**
 * Worker-specific connection. The inline worker (server/index.ts setInterval)
 * needs its own bun:sqlite Database instance — sharing the singleton with
 * the request-handler path causes bun:sqlite internal state corruption when
 * the setInterval callback interleaves with a request mid-await.
 *
 * Both connections point at the same file. SQLite's file-level locking
 * serializes writes (busy_timeout=5s). Reads are concurrent.
 *
 * Eng-review-3 demo discovery: setInterval(tick) firing while
 * snapshotBucket() was mid-await caused the next conn.run() to throw
 * "disk I/O error". Separate connections fixed it.
 */
export function dbWorker(): Database {
  if (_dbWorker) return _dbWorker;
  _dbWorker = open();
  return _dbWorker;
}

/**
 * Self-healing: when a connection produces a "disk I/O error" — typically
 * because bun:sqlite's WAL coordination got into a bad state after a
 * crashed transaction or process — drop the connection and let the next
 * db() call open a fresh one. Discovered in eng-review-3 demo: under
 * sustained load the singleton would intermittently throw SQLITE_IOERR
 * on a query that worked seconds before.
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
