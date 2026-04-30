import { Database } from 'bun:sqlite';
import { resolve } from 'node:path';

const DB_PATH = process.env.DB_PATH ?? resolve(import.meta.dir, '../data/saltwater.db');

let _db: Database | null = null;

export function db(): Database {
  if (_db) return _db;
  _db = new Database(DB_PATH, { create: true });
  _db.exec('PRAGMA journal_mode = WAL;');
  _db.exec('PRAGMA synchronous = NORMAL;');
  _db.exec('PRAGMA foreign_keys = ON;');
  _db.exec('PRAGMA busy_timeout = 5000;');
  return _db;
}

export function closeDb(): void {
  _db?.close();
  _db = null;
}
