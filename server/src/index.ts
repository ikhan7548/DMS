import express from 'express';
import cors from 'cors';
import session from 'express-session';
import SqliteStoreFactory from 'better-sqlite3-session-store';
import Database from 'better-sqlite3';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// NOTE: Restore-on-startup logic lives in db/connection.ts so it runs
// BEFORE the database file is opened (import hoisting would otherwise
// open the DB before this code could swap the file).

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const DATA_DIR = process.env.DATA_DIR || path.join(PROJECT_ROOT, 'data');

// Import routes
import authRoutes from './routes/auth.routes';
import childrenRoutes from './routes/children.routes';
import parentsRoutes from './routes/parents.routes';
import staffRoutes from './routes/staff.routes';
import attendanceRoutes from './routes/attendance.routes';
import billingRoutes from './routes/billing.routes';
import reportsRoutes from './routes/reports.routes';
import settingsRoutes from './routes/settings.routes';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ─── Middleware ───────────────────────────────────────

// Request logging
app.use(morgan('short'));

// CORS - allow client dev server and same-origin in production
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:5173', 'http://localhost:3001'],
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session management — stored in SQLite so sessions survive server restarts
const SqliteStore = SqliteStoreFactory(session);
const sessionDb = new Database(path.join(DATA_DIR, 'sessions.db'));
app.use(session({
  store: new SqliteStore({ client: sessionDb }),
  secret: process.env.SESSION_SECRET || 'daycare-management-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiry on every request so session stays alive while actively used
  cookie: {
    secure: false, // Set true behind HTTPS reverse proxy
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours of inactivity before logout
    sameSite: 'lax',
  },
}));

// ─── API Routes ──────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/parents', parentsRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);

// ─── Health Check ────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── Static Files (Production) ───────────────────────
// Serve the built React client in production
const clientBuildPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));

// SPA fallback: serve index.html for any non-API route
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  const indexPath = path.join(clientBuildPath, 'index.html');
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // In development, the client is served by Vite
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Daycare Management System</title></head>
        <body>
          <h1>Daycare Management System API</h1>
          <p>API server is running on port ${PORT}</p>
          <p>In development, the client runs on <a href="${CLIENT_URL}">${CLIENT_URL}</a></p>
          <p><a href="/api/health">Health Check</a></p>
        </body>
      </html>
    `);
  }
});

// ─── Error Handling ──────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🏫 Daycare Management System API Server`);
  console.log(`   Running on http://0.0.0.0:${PORT}`);
  console.log(`   Client URL: ${CLIENT_URL}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Press Ctrl+C to stop\n`);
});

export default app;
