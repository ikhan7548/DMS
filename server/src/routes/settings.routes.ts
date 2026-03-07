import { Router, Request, Response } from 'express';
import { sqlite } from '../db/connection';
import { requireAuth, requirePermission, requireRole } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import archiver from 'archiver';
import multer from 'multer';
import fs from 'fs';
import pathLib from 'path';

const router = Router();

// ─── Backup Helpers ────────────────────────────────────
const PROJECT_ROOT = pathLib.resolve(__dirname, '..', '..', '..');
const getDataDir = () => process.env.DATA_DIR || pathLib.join(PROJECT_ROOT, 'data');
const getBackupDir = () => {
  const dir = pathLib.join(getDataDir(), 'backups');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

// Folders/patterns to EXCLUDE from full backups
const BACKUP_EXCLUDE = new Set([
  'node_modules', '.git', '.claude', 'data', 'backups',
]);
const BACKUP_EXCLUDE_EXTENSIONS = new Set([
  '.log', '.db', '.db-wal', '.db-shm',
]);
const BACKUP_EXCLUDE_FILES = new Set([
  '.env', 'nul',
]);

/**
 * Recursively add all project files to an archiver instance.
 * Automatically includes everything EXCEPT node_modules, .git, data, logs, etc.
 * No hardcoded file lists — new files are picked up automatically.
 */
function addProjectFilesToArchive(archive: archiver.Archiver, dir: string, prefix: string = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const name = entry.name;
    const fullPath = pathLib.join(dir, name);
    const archivePath = prefix ? `${prefix}/${name}` : name;

    if (entry.isDirectory()) {
      // Skip excluded directories
      if (BACKUP_EXCLUDE.has(name)) continue;
      addProjectFilesToArchive(archive, fullPath, archivePath);
    } else {
      // Skip excluded files
      if (BACKUP_EXCLUDE_FILES.has(name)) continue;
      const ext = pathLib.extname(name).toLowerCase();
      if (BACKUP_EXCLUDE_EXTENSIONS.has(ext)) continue;
      // Skip temp files
      if (name.startsWith('_temp')) continue;
      archive.file(fullPath, { name: archivePath });
    }
  }
}

// Validate backup filename to prevent path traversal
function isValidBackupFilename(name: string): boolean {
  // Must be a simple filename (no path separators, no ..)
  if (!name || name.includes('/') || name.includes('\\') || name.includes('..')) return false;
  // Must end with .db or .zip
  if (!name.endsWith('.db') && !name.endsWith('.zip')) return false;
  return true;
}

// ─── Auto-Backup Scheduler ─────────────────────────────
let autoBackupTimer: ReturnType<typeof setInterval> | null = null;

function getAutoBackupSettings(): { enabled: boolean; intervalHours: number; type: string; maxBackups: number } {
  try {
    const enabled = sqlite.prepare(`SELECT value FROM settings WHERE key = 'auto_backup_enabled'`).get() as any;
    const interval = sqlite.prepare(`SELECT value FROM settings WHERE key = 'auto_backup_interval_hours'`).get() as any;
    const type = sqlite.prepare(`SELECT value FROM settings WHERE key = 'auto_backup_type'`).get() as any;
    const maxBackups = sqlite.prepare(`SELECT value FROM settings WHERE key = 'auto_backup_max_count'`).get() as any;
    return {
      enabled: enabled?.value === '1' || enabled?.value === 'true',
      intervalHours: parseInt(interval?.value || '24', 10),
      type: type?.value || 'data',
      maxBackups: parseInt(maxBackups?.value || '0', 10),
    };
  } catch { return { enabled: false, intervalHours: 24, type: 'data', maxBackups: 0 }; }
}

// Enforce backup retention: delete oldest backups if count exceeds maxBackups
function enforceBackupRetention() {
  try {
    const settings = getAutoBackupSettings();
    if (settings.maxBackups <= 0) return; // 0 = unlimited

    const backupDir = getBackupDir();
    const files = fs.readdirSync(backupDir)
      .filter(f => (f.endsWith('.db') || f.endsWith('.zip')) && !f.startsWith('_temp'))
      .map(f => ({
        name: f,
        time: fs.statSync(pathLib.join(backupDir, f)).mtimeMs,
      }))
      .sort((a, b) => b.time - a.time); // newest first

    if (files.length > settings.maxBackups) {
      const toDelete = files.slice(settings.maxBackups);
      for (const file of toDelete) {
        try {
          fs.unlinkSync(pathLib.join(backupDir, file.name));
          console.log(`[Backup Retention] Deleted old backup: ${file.name}`);
        } catch (e) {
          console.error(`[Backup Retention] Failed to delete ${file.name}:`, e);
        }
      }
    }
  } catch (err) {
    console.error('[Backup Retention] Error:', err);
  }
}

function performAutoBackup() {
  try {
    const settings = getAutoBackupSettings();
    if (!settings.enabled) return;

    const backupDir = getBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    if (settings.type === 'full') {
      // Full app backup as zip
      const zipPath = pathLib.join(backupDir, `auto-full-backup-${timestamp}.zip`);
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.pipe(output);

      // Add database
      const dataDir = getDataDir();
      const dbPath = pathLib.join(dataDir, 'daycare.db');
      const tempDbPath = pathLib.join(backupDir, `_temp_auto_${timestamp}.db`);
      sqlite.exec(`VACUUM INTO '${tempDbPath}'`);
      archive.file(tempDbPath, { name: 'data/daycare.db' });

      // Add all project files (auto-discovers, excludes node_modules/.git/data/logs)
      addProjectFilesToArchive(archive, PROJECT_ROOT);

      output.on('close', () => {
        // Clean temp db
        try { fs.unlinkSync(tempDbPath); } catch {}
        try {
          sqlite.prepare(`INSERT INTO audit_log (user_id, action, entity_type, details) VALUES (NULL, 'backup', 'auto_full', ?)`).run(`Auto full backup: ${zipPath}`);
        } catch {}
        console.log(`[Auto-Backup] Full backup created: ${zipPath} (${archive.pointer()} bytes)`);
        enforceBackupRetention();
      });

      archive.finalize();
    } else {
      // Data-only backup
      const backupPath = pathLib.join(backupDir, `auto-data-backup-${timestamp}.db`);
      sqlite.exec(`VACUUM INTO '${backupPath}'`);
      try {
        sqlite.prepare(`INSERT INTO audit_log (user_id, action, entity_type, details) VALUES (NULL, 'backup', 'auto_data', ?)`).run(`Auto data backup: ${backupPath}`);
      } catch {}
      console.log(`[Auto-Backup] Data backup created: ${backupPath}`);
      enforceBackupRetention();
    }
  } catch (err) {
    console.error('[Auto-Backup] Failed:', err);
  }
}

function startAutoBackupScheduler() {
  stopAutoBackupScheduler();
  const settings = getAutoBackupSettings();
  if (!settings.enabled) return;
  const ms = settings.intervalHours * 60 * 60 * 1000;
  autoBackupTimer = setInterval(performAutoBackup, ms);
  console.log(`[Auto-Backup] Scheduler started: every ${settings.intervalHours}h, type=${settings.type}`);
}

function stopAutoBackupScheduler() {
  if (autoBackupTimer) {
    clearInterval(autoBackupTimer);
    autoBackupTimer = null;
  }
}

// Start on module load
startAutoBackupScheduler();

// ─── Facility Settings ───────────────────────────────

// GET /api/settings
router.get('/', requireAuth, (req: Request, res: Response) => {
  try {
    const settings = sqlite.prepare(`SELECT key, value FROM settings`).all() as any[];
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings
router.put('/', requireAuth, requirePermission('settings_edit'), (req: Request, res: Response) => {
  try {
    const updates = req.body; // { key: value, ... }
    const upsert = sqlite.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
    `);

    const transaction = sqlite.transaction(() => {
      for (const [key, value] of Object.entries(updates)) {
        upsert.run(key, String(value));
      }
    });

    transaction();

    // Log the change
    sqlite.prepare(`
      INSERT INTO audit_log (user_id, action, entity_type, details)
      VALUES (?, 'update', 'settings', ?)
    `).run(req.session.userId, `Updated settings: ${Object.keys(updates).join(', ')}`);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── User Management ─────────────────────────────────

// GET /api/settings/users
router.get('/users', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  try {
    const users = sqlite.prepare(`
      SELECT u.id, u.username, u.display_name, u.role, u.staff_id, u.is_active, u.language, u.created_at,
        s.first_name as staff_first_name, s.last_name as staff_last_name
      FROM users u
      LEFT JOIN staff s ON u.staff_id = s.id
      ORDER BY u.username
    `).all();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings/users
router.post('/users', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  try {
    const { username, pin, display_name, role, staff_id, language } = req.body;

    if (!username || !pin) {
      return res.status(400).json({ error: 'Username and PIN are required' });
    }

    const pinHash = bcrypt.hashSync(pin, 10);
    const result = sqlite.prepare(`
      INSERT INTO users (username, pin_hash, display_name, role, staff_id, language)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(username, pinHash, display_name || username, role || 'staff', staff_id || null, language || 'en');

    sqlite.prepare(`
      INSERT INTO audit_log (user_id, action, entity_type, entity_id, details)
      VALUES (?, 'create', 'user', ?, ?)
    `).run(req.session.userId, Number(result.lastInsertRowid), `Created user: ${username}`);

    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (err: any) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings/users/:id
router.put('/users/:id', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  try {
    const { display_name, role, staff_id, is_active, language } = req.body;
    sqlite.prepare(`
      UPDATE users SET display_name = COALESCE(?, display_name), role = COALESCE(?, role),
        staff_id = COALESCE(?, staff_id), is_active = COALESCE(?, is_active), language = COALESCE(?, language)
      WHERE id = ?
    `).run(display_name || null, role || null, staff_id !== undefined ? staff_id : null, is_active !== undefined ? is_active : null, language || null, req.params.id);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings/users/:id/pin
router.put('/users/:id/pin', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ error: 'PIN is required' });
    }
    const pinHash = bcrypt.hashSync(pin, 10);
    sqlite.prepare(`UPDATE users SET pin_hash = ? WHERE id = ?`).run(pinHash, req.params.id);

    sqlite.prepare(`
      INSERT INTO audit_log (user_id, action, entity_type, entity_id, details)
      VALUES (?, 'update', 'user', ?, 'PIN reset')
    `).run(req.session.userId, req.params.id);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/settings/users/:id - Permanently delete a user
router.delete('/users/:id', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);

    // Prevent deleting yourself
    if (userId === req.session.userId) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    // Verify user exists
    const user = sqlite.prepare(`SELECT id, username, role FROM users WHERE id = ?`).get(userId) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = sqlite.prepare(
        `SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_active = 1`
      ).get() as { count: number };
      if (adminCount.count <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' });
      }
    }

    const deleteUser = sqlite.transaction(() => {
      // Unlink from audit_log (preserve audit entries, just remove the FK reference)
      sqlite.prepare(`UPDATE audit_log SET user_id = NULL WHERE user_id = ?`).run(userId);

      // Delete the user record
      sqlite.prepare(`DELETE FROM users WHERE id = ?`).run(userId);
    });

    deleteUser();

    // Log the deletion (after transaction since user is gone)
    sqlite.prepare(`
      INSERT INTO audit_log (user_id, action, entity_type, entity_id, details)
      VALUES (?, 'delete', 'user', ?, ?)
    `).run(req.session.userId, userId, `Deleted user: ${user.username}`);

    res.json({ success: true, message: `User "${user.username}" permanently deleted` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Role Permissions ────────────────────────────────

// GET /api/settings/permissions
router.get('/permissions', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  try {
    const perms = sqlite.prepare(`SELECT * FROM role_permissions ORDER BY role, feature`).all();
    res.json(perms);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings/permissions
router.put('/permissions', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  try {
    const { role, permissions } = req.body; // permissions: { feature: boolean }

    const deleteExisting = sqlite.prepare(`DELETE FROM role_permissions WHERE role = ? AND feature = ?`);
    const insert = sqlite.prepare(`INSERT INTO role_permissions (role, feature, can_access) VALUES (?, ?, ?)`);

    const transaction = sqlite.transaction(() => {
      for (const [feature, canAccess] of Object.entries(permissions)) {
        deleteExisting.run(role, feature);
        insert.run(role, feature, canAccess ? 1 : 0);
      }
    });

    transaction();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Audit Log ───────────────────────────────────────

// GET /api/settings/audit-log
router.get('/audit-log', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  try {
    const { startDate, endDate, userId, action, limit: queryLimit } = req.query;
    let query = `
      SELECT al.*, u.username, u.display_name
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (startDate) { query += ` AND al.timestamp >= ?`; params.push(startDate); }
    if (endDate) { query += ` AND al.timestamp <= ?`; params.push(endDate + 'T23:59:59'); }
    if (userId) { query += ` AND al.user_id = ?`; params.push(userId); }
    if (action) { query += ` AND al.action = ?`; params.push(action); }

    query += ` ORDER BY al.timestamp DESC LIMIT ?`;
    params.push(Number(queryLimit) || 100);

    res.json(sqlite.prepare(query).all(...params));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Backup / Restore ────────────────────────────────

// POST /api/settings/backup – Data-only backup (.db file saved + returned as download info)
router.post('/backup', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  try {
    const backupDir = getBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = pathLib.join(backupDir, `daycare-data-backup-${timestamp}.db`);

    sqlite.exec(`VACUUM INTO '${backupPath}'`);

    sqlite.prepare(`
      INSERT INTO audit_log (user_id, action, entity_type, details)
      VALUES (?, 'backup', 'data', ?)
    `).run(req.session.userId, `Data backup created: ${backupPath}`);

    const stat = fs.statSync(backupPath);
    res.json({ success: true, path: backupPath, timestamp, size: stat.size });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings/backup/full – Full application backup as .zip
router.post('/backup/full', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  try {
    const backupDir = getBackupDir();
    const dataDir = getDataDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipFilename = `daycare-full-backup-${timestamp}.zip`;
    const zipPath = pathLib.join(backupDir, zipFilename);

    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      // Clean up temp DB
      try { fs.unlinkSync(tempDbPath); } catch {}

      sqlite.prepare(`
        INSERT INTO audit_log (user_id, action, entity_type, details)
        VALUES (?, 'backup', 'full', ?)
      `).run(req.session.userId, `Full backup created: ${zipPath} (${archive.pointer()} bytes)`);

      const stat = fs.statSync(zipPath);
      res.json({ success: true, path: zipPath, filename: zipFilename, size: stat.size });
    });

    output.on('error', (err: any) => {
      res.status(500).json({ error: err.message });
    });

    archive.on('error', (err: any) => {
      res.status(500).json({ error: err.message });
    });

    archive.pipe(output);

    // 1. Database (vacuumed copy for consistency)
    const tempDbPath = pathLib.join(backupDir, `_temp_full_${timestamp}.db`);
    sqlite.exec(`VACUUM INTO '${tempDbPath}'`);
    archive.file(tempDbPath, { name: 'data/daycare.db' });

    // 2. All project files (auto-discovers everything, excludes node_modules/.git/data/logs)
    addProjectFilesToArchive(archive, PROJECT_ROOT);

    // 3. Add a restore instruction file
    archive.append(
      `# Daycare Management System - Full Backup\n` +
      `# Created: ${new Date().toISOString()}\n\n` +
      `## Windows Restore\n\n` +
      `1. Extract this zip to a folder\n` +
      `2. Make sure Node.js is installed (https://nodejs.org/)\n` +
      `3. Double-click start.bat — it handles everything automatically\n` +
      `   (installs dependencies, runs migration, builds client, starts server)\n\n` +
      `## Linux / Production Server Restore\n\n` +
      `1. Extract this zip to a folder on your server\n` +
      `2. Run: npm run install:all\n` +
      `3. Run: npm run db:migrate\n` +
      `4. Run: npm run build:client\n` +
      `5. Run: npx tsx server/src/index.ts\n` +
      `6. Open http://localhost:3001 in your browser\n\n` +
      `## Docker Deployment\n\n` +
      `1. Extract this zip\n` +
      `2. Run: docker-compose up -d\n`,
      { name: 'RESTORE_INSTRUCTIONS.md' }
    );

    archive.finalize();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings/backup/download-zip – Create a zip of a .db backup for download
router.post('/backup/download-zip', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  try {
    const { filename } = req.body;
    if (!filename || !isValidBackupFilename(filename)) return res.status(400).json({ error: 'Invalid filename' });

    const backupDir = getBackupDir();
    const filePath = pathLib.join(backupDir, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Backup not found' });

    // If already a zip, just send it
    if (filename.endsWith('.zip')) {
      return res.download(filePath, filename);
    }

    // Wrap the .db file in a zip
    const zipName = filename.replace(/\.db$/, '.zip');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err: any) => { res.status(500).end(); });
    archive.pipe(res);
    archive.file(filePath, { name: `data/${filename}` });

    // Add restore note
    archive.append(
      `# Data Backup: ${filename}\n# Created: ${new Date().toISOString()}\n\n` +
      `To restore: copy the .db file to your data/ folder and restart the server.\n`,
      { name: 'RESTORE_INSTRUCTIONS.md' }
    );

    archive.finalize();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/settings/backups – List all backups (both .db and .zip)
router.get('/backups', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  try {
    const backupDir = getBackupDir();

    const files = fs.readdirSync(backupDir)
      .filter((f: string) => (f.endsWith('.db') || f.endsWith('.zip')) && !f.startsWith('_temp'))
      .map((f: string) => {
        const stat = fs.statSync(pathLib.join(backupDir, f));
        const isZip = f.endsWith('.zip');
        const isAuto = f.startsWith('auto-');
        const isFull = f.includes('-full-') || (isZip && !f.includes('-data-'));
        return {
          name: f,
          size: stat.size,
          created: stat.mtime.toISOString(),
          type: isFull ? 'full' : 'data',
          format: isZip ? 'zip' : 'db',
          auto: isAuto,
        };
      })
      .sort((a: any, b: any) => b.created.localeCompare(a.created));

    res.json(files);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/settings/backups/:name/download
router.get('/backups/:name/download', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  try {
    const backupDir = getBackupDir();
    const name = req.params.name as string;
    if (!isValidBackupFilename(name)) return res.status(400).json({ error: 'Invalid filename' });
    const filePath = pathLib.join(backupDir, name);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    res.download(filePath, name);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/settings/backups/:name
router.delete('/backups/:name', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  try {
    const backupDir = getBackupDir();
    const name = req.params.name as string;
    if (!isValidBackupFilename(name)) return res.status(400).json({ error: 'Invalid filename' });
    const filePath = pathLib.join(backupDir, name);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    fs.unlinkSync(filePath);

    sqlite.prepare(`
      INSERT INTO audit_log (user_id, action, entity_type, details)
      VALUES (?, 'delete', 'backup', ?)
    `).run(req.session.userId, `Deleted backup: ${req.params.name}`);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings/restore/upload – Upload a backup file from the user's computer
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, getBackupDir()),
    filename: (_req, file, cb) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `uploaded-${timestamp}-${safeName}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (file.originalname.endsWith('.db') || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only .db and .zip files are allowed'));
    }
  },
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

router.post('/restore/upload', requireAuth, requireRole('admin'), (req: Request, res: Response, next) => {
  upload.single('backupFile')(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const stat = fs.statSync(req.file.path);
    res.json({ success: true, filename: req.file.filename, size: stat.size });
  });
});

// POST /api/settings/restore – Restore from a backup file
router.post('/restore', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  try {
    const { filename } = req.body;
    if (!filename || !isValidBackupFilename(filename)) {
      return res.status(400).json({ error: 'Invalid backup filename' });
    }

    const backupDir = getBackupDir();
    const backupPath = pathLib.join(backupDir, filename);

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }

    const dataDir = getDataDir();
    const dbPath = pathLib.join(dataDir, 'daycare.db');

    // 1. Create a pre-restore safety backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safetyBackupPath = pathLib.join(backupDir, `pre-restore-backup-${timestamp}.db`);
    try {
      sqlite.exec(`VACUUM INTO '${safetyBackupPath}'`);
      console.log(`[Restore] Pre-restore safety backup: ${safetyBackupPath}`);
    } catch (e) {
      console.error('[Restore] Failed to create safety backup:', e);
    }

    // 2. Extract the .db file from zip or use directly
    let sourceDbPath = backupPath;

    if (filename.endsWith('.zip')) {
      // Extract the .db from the zip using adm-zip
      const tempExtractDir = pathLib.join(backupDir, `_temp_restore_${timestamp}`);
      fs.mkdirSync(tempExtractDir, { recursive: true });

      const AdmZip = require('adm-zip');
      const zip = new AdmZip(backupPath);
      const entries = zip.getEntries();
      let dbEntry = entries.find((e: any) => e.entryName.endsWith('daycare.db'));
      if (!dbEntry) {
        // Clean up temp dir
        try { fs.rmSync(tempExtractDir, { recursive: true }); } catch {}
        return res.status(400).json({ error: 'No database file found in zip backup' });
      }
      const extractedDbPath = pathLib.join(tempExtractDir, 'daycare.db');
      fs.writeFileSync(extractedDbPath, dbEntry.getData());
      sourceDbPath = extractedDbPath;
    }

    // 3. Close the current DB connection, replace the file, and signal restart
    // We can't close the connection mid-request, so we copy the backup over
    // and tell the user to restart the service
    const restoreDbPath = pathLib.join(dataDir, 'daycare.db.restore');
    fs.copyFileSync(sourceDbPath, restoreDbPath);

    // Clean up temp extraction dir if zip
    if (filename.endsWith('.zip')) {
      const tempExtractDir = pathLib.join(backupDir, `_temp_restore_${timestamp}`);
      try { fs.rmSync(tempExtractDir, { recursive: true }); } catch {}
    }

    // 4. Actually replace the database — rename current, put restore in place
    const oldDbPath = pathLib.join(dataDir, 'daycare.db.old');
    try { fs.unlinkSync(oldDbPath); } catch {} // Remove any previous .old file

    // We need to close the database to replace it
    // Since better-sqlite3 keeps the file locked, we'll use a different approach:
    // Write a restore marker file that the server reads on startup
    const markerPath = pathLib.join(dataDir, '.restore-pending');
    fs.writeFileSync(markerPath, JSON.stringify({
      restoreFile: restoreDbPath,
      timestamp: new Date().toISOString(),
      originalBackup: filename,
    }));

    // Log the restore action
    try {
      sqlite.prepare(`
        INSERT INTO audit_log (user_id, action, entity_type, details)
        VALUES (?, 'restore', 'backup', ?)
      `).run(req.session.userId, `Restore initiated from: ${filename}`);
    } catch {}

    res.json({
      success: true,
      message: 'Restore prepared. The database will be replaced on next server restart. Please restart the service now.',
      safetyBackup: `pre-restore-backup-${timestamp}.db`,
    });
  } catch (err: any) {
    console.error('[Restore] Error:', err);
    res.status(500).json({ error: err.message || 'Restore failed' });
  }
});

// ─── Auto-Backup Settings ──────────────────────────────

// GET /api/settings/auto-backup
router.get('/auto-backup', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  try {
    const settings = getAutoBackupSettings();
    const lastBackup = sqlite.prepare(`
      SELECT timestamp, details FROM audit_log
      WHERE action = 'backup' AND (entity_type = 'auto_data' OR entity_type = 'auto_full')
      ORDER BY timestamp DESC LIMIT 1
    `).get() as any;

    res.json({
      ...settings,
      schedulerRunning: autoBackupTimer !== null,
      lastAutoBackup: lastBackup?.timestamp || null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings/auto-backup
router.put('/auto-backup', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  try {
    const { enabled, intervalHours, type, maxBackups } = req.body;

    const upsert = sqlite.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
    `);

    sqlite.transaction(() => {
      if (enabled !== undefined) upsert.run('auto_backup_enabled', enabled ? '1' : '0');
      if (intervalHours !== undefined) upsert.run('auto_backup_interval_hours', String(intervalHours));
      if (type !== undefined) upsert.run('auto_backup_type', type);
      if (maxBackups !== undefined) upsert.run('auto_backup_max_count', String(maxBackups));
    })();

    // Restart the scheduler with new settings
    startAutoBackupScheduler();

    // Enforce retention immediately if reduced
    enforceBackupRetention();

    sqlite.prepare(`
      INSERT INTO audit_log (user_id, action, entity_type, details)
      VALUES (?, 'update', 'auto_backup', ?)
    `).run(req.session.userId, `Auto-backup ${enabled ? 'enabled' : 'disabled'}: every ${intervalHours}h, type=${type}, max=${maxBackups || 'unlimited'}`);

    const updatedSettings = getAutoBackupSettings();
    res.json({ success: true, ...updatedSettings, schedulerRunning: autoBackupTimer !== null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings/auto-backup/run-now – Trigger an auto-backup immediately
router.post('/auto-backup/run-now', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  try {
    performAutoBackup();
    res.json({ success: true, message: 'Auto-backup triggered' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/settings/active-staff - Active staff list for user linking
router.get('/active-staff', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  try {
    const staff = sqlite.prepare(`
      SELECT id, first_name, last_name, position
      FROM staff
      WHERE status = 'active'
      ORDER BY first_name, last_name
    `).all();
    res.json(staff);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Communication Log ───────────────────────────────

// GET /api/settings/communication-log
router.get('/communication-log', requireAuth, (req: Request, res: Response) => {
  try {
    const { limit: queryLimit } = req.query;
    let query = `SELECT * FROM communication_log`;

    query += ` ORDER BY date DESC, created_at DESC LIMIT ?`;
    const params: any[] = [Number(queryLimit) || 50];

    res.json(sqlite.prepare(query).all(...params));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings/communication-log
router.post('/communication-log', requireAuth, (req: Request, res: Response) => {
  try {
    const { type, recipient, subject, message, date: commDate } = req.body;
    const result = sqlite.prepare(`
      INSERT INTO communication_log (type, recipient, subject, message, date)
      VALUES (?, ?, ?, ?, ?)
    `).run(type || 'note', recipient || null, subject || null, message, commDate || (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; })());
    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Incident Reports ────────────────────────────────

// GET /api/settings/incidents
router.get('/incidents', requireAuth, (req: Request, res: Response) => {
  try {
    const { childId, startDate, endDate } = req.query;
    let query = `
      SELECT ir.*, c.first_name as child_first_name, c.last_name as child_last_name
      FROM incident_reports ir
      LEFT JOIN children c ON ir.child_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (childId) { query += ` AND ir.child_id = ?`; params.push(childId); }
    if (startDate) { query += ` AND ir.date >= ?`; params.push(startDate); }
    if (endDate) { query += ` AND ir.date <= ?`; params.push(endDate); }

    query += ` ORDER BY ir.date DESC, ir.created_at DESC`;
    res.json(sqlite.prepare(query).all(...params));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings/incidents
router.post('/incidents', requireAuth, (req: Request, res: Response) => {
  try {
    const { child_id, date, description, action_taken, reported_by, parent_notified, notes } = req.body;
    const result = sqlite.prepare(`
      INSERT INTO incident_reports (child_id, date, description, action_taken, reported_by, parent_notified, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(child_id, date, description, action_taken || null, reported_by || req.session.displayName, parent_notified ? 1 : 0, notes || null);
    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Medication Logs ─────────────────────────────────

// GET /api/settings/medications
router.get('/medications', requireAuth, (req: Request, res: Response) => {
  try {
    const { childId } = req.query;
    let query = `
      SELECT ml.*, c.first_name as child_first_name, c.last_name as child_last_name
      FROM medication_logs ml
      LEFT JOIN children c ON ml.child_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (childId) { query += ` AND ml.child_id = ?`; params.push(childId); }
    query += ` ORDER BY ml.time_administered DESC, ml.created_at DESC`;
    res.json(sqlite.prepare(query).all(...params));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings/medications
router.post('/medications', requireAuth, (req: Request, res: Response) => {
  try {
    const { child_id, medication_name, dosage, time_administered, administered_by, notes } = req.body;
    const result = sqlite.prepare(`
      INSERT INTO medication_logs (child_id, medication_name, dosage, time_administered, administered_by, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(child_id, medication_name, dosage, time_administered || new Date().toISOString(), administered_by || req.session.displayName, notes || null);
    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Meal Logs ───────────────────────────────────────

// GET /api/settings/meals
router.get('/meals', requireAuth, (req: Request, res: Response) => {
  try {
    const { date: queryDate } = req.query;
    const d = (queryDate as string) || (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; })();
    const meals = sqlite.prepare(`
      SELECT ml.*, GROUP_CONCAT(c.first_name || ' ' || c.last_name) as children_names
      FROM meal_logs ml
      LEFT JOIN meal_log_children mlc ON ml.id = mlc.meal_log_id
      LEFT JOIN children c ON mlc.child_id = c.id
      WHERE ml.date = ?
      GROUP BY ml.id
      ORDER BY ml.meal_type
    `).all(d);
    res.json(meals);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings/meals
router.post('/meals', requireAuth, (req: Request, res: Response) => {
  try {
    const { date, meal_type, food_items, notes, child_ids } = req.body;

    const transaction = sqlite.transaction(() => {
      const result = sqlite.prepare(`
        INSERT INTO meal_logs (date, meal_type, food_items, notes) VALUES (?, ?, ?, ?)
      `).run(date, meal_type, food_items, notes || null);
      const mealId = Number(result.lastInsertRowid);

      if (child_ids && child_ids.length > 0) {
        const insertChild = sqlite.prepare(`INSERT INTO meal_log_children (meal_log_id, child_id) VALUES (?, ?)`);
        for (const childId of child_ids) {
          insertChild.run(mealId, childId);
        }
      }

      return mealId;
    });

    const mealId = transaction();
    res.json({ success: true, id: mealId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
