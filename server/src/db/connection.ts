import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'path';
import fs from 'fs';
import * as schema from './schema';

// Use project root's data directory (__dirname is server/src/db, go up 3 levels to project root)
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const DATA_DIR = process.env.DATA_DIR || path.join(PROJECT_ROOT, 'data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'daycare.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ─── Check for pending restore BEFORE opening the database ───
const restoreMarkerPath = path.join(DATA_DIR, '.restore-pending');
if (fs.existsSync(restoreMarkerPath)) {
  try {
    const marker = JSON.parse(fs.readFileSync(restoreMarkerPath, 'utf-8'));
    const restoreFile = marker.restoreFile;

    if (fs.existsSync(restoreFile)) {
      console.log(`[Restore] Applying pending restore from: ${marker.originalBackup}`);
      // Rename current DB to .old
      const oldDbPath = path.join(DATA_DIR, 'daycare.db.old');
      try { fs.unlinkSync(oldDbPath); } catch {}
      if (fs.existsSync(DB_PATH)) {
        fs.renameSync(DB_PATH, oldDbPath);
      }
      // Also remove WAL/SHM files from previous DB
      try { fs.unlinkSync(DB_PATH + '-wal'); } catch {}
      try { fs.unlinkSync(DB_PATH + '-shm'); } catch {}
      // Move restored DB into place
      fs.renameSync(restoreFile, DB_PATH);
      console.log(`[Restore] Database restored successfully.`);
    } else {
      console.error(`[Restore] Restore file not found: ${restoreFile}`);
    }
    // Remove the marker
    fs.unlinkSync(restoreMarkerPath);
  } catch (err) {
    console.error('[Restore] Error during restore:', err);
    try { fs.unlinkSync(restoreMarkerPath); } catch {}
  }
}

console.log(`  Database: ${DB_PATH}`);

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
