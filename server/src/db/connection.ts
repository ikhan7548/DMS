import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'path';
import fs from 'fs';
import * as schema from './schema';

// Use project root's data directory (__dirname is server/src/db, go up 3 levels to project root)
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const DATA_DIR = process.env.DATA_DIR || path.join(PROJECT_ROOT, 'data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'daycare.db');

console.log(`  Database: ${DB_PATH}`);

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const sqlite = new Database(DB_PATH);

// Set pragmas for performance and safety
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');
sqlite.pragma('busy_timeout = 5000');
sqlite.pragma('cache_size = -20000');
sqlite.pragma('synchronous = NORMAL');

export const db = drizzle(sqlite, { schema });
export { sqlite };
export default db;
