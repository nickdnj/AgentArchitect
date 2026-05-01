import { Database } from 'bun:sqlite';
import { resolve } from 'node:path';

const DB_PATH = process.env.DB_PATH ?? resolve(import.meta.dir, '../data/saltwater.db');

let _db: Database | null = null;

function open(): Database {
  const conn = new Database(DB_PATH, { create: true });
  conn.exec('PRAGMA journal_mode = WAL;');
  conn.exec('PRAGMA synchronous = NORMAL;');
  conn.exec('PRAGMA foreign_keys = ON;');
  conn.exec('PRAGMA busy_timeout = 5000;');
  // Auto-checkpoint every 100 pages to keep the WAL file from growing
  // unbounded under prolonged write activity. Without this, eng-review-3
  // dogfood saw WAL hit 2MB+ and trigger occasional 'disk I/O error'.
  conn.exec('PRAGMA wal_autocheckpoint = 100;');
  return conn;
}

export function db(): Database {
  if (_db) return _db;
  _db = open();
  return _db;
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
  _db = null;
}

export function closeDb(): void {
  _db?.close();
  _db = null;
}
