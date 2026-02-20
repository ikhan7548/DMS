# CLAUDE.md — AI Assistant Context

> This file provides context for Claude Code (or any AI assistant) working on this codebase.

## Project Overview

**Daycare Management System (DMS) v2.0** — A self-hosted web application for managing a Virginia-licensed family day home. Successor to HDMA v1.0 (Electron desktop app). Runs on a TrueNAS Core VM, accessible from desktops, tablets, and phones on the local network.

**GitHub**: https://github.com/ikhan7548/DMS.git (public, branch: `main`)

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Frontend** | React 19 + TypeScript | Vite 6 build tool |
| **UI Framework** | MUI v6 (Material-UI) | `@mui/material`, `@mui/icons-material` |
| **State** | Zustand v5 | Stores in `client/src/stores/` |
| **Data Fetching** | @tanstack/react-query v5 + Axios | |
| **Routing** | React Router v7 | BrowserRouter |
| **Backend** | Express.js + TypeScript | Runs with `tsx` (ts-node equivalent) |
| **Database** | SQLite via better-sqlite3 | **NOT PostgreSQL** |
| **ORM** | None — **raw SQL queries** | **NOT Drizzle ORM** (drizzle-orm is a dependency but unused for queries) |
| **Auth** | express-session + bcryptjs | PIN-based, 24-hour cookies |
| **PDF** | jsPDF (server-side) | |
| **Backup** | archiver (zip), raw file copy (db) | |
| **Date Library** | dayjs | |
| **Port** | **3001** | NOT 3000 |

---

## Critical Gotchas

1. **Port is 3001**, not 3000. The server listens on port 3001.
2. **Database is SQLite** (better-sqlite3), NOT PostgreSQL. The `drizzle-orm` package is listed in dependencies but the app uses raw SQL via `sqlite.exec()` and `sqlite.prepare().all()`.
3. **Raw SQL queries** — All database operations use `better-sqlite3` directly with raw SQL. There is no ORM query builder.
4. **MUI Grid2** — Import as `import Grid2 from '@mui/material/Grid2'` or `import { Grid2 as Grid } from '@mui/material'`. Use the `size` prop (e.g., `size={{ xs: 12, md: 6 }}`), NOT `xs={12} md={6}`.
5. **Dark mode pattern** — Use theme-aware conditional values:
   ```tsx
   backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(21, 101, 192, 0.15)' : '#E3F2FD'
   ```
   Or use MUI theme tokens: `color: 'success.main'` instead of `color: '#2E7D32'`.
6. **Path alias** — `@shared` resolves to `../shared` (configured in `vite.config.ts`).
7. **Session auth** — All API routes (except login) require authentication via `requireAuth` middleware. Some require `requirePermission('feature_key')` or `requireRole('admin')`.

---

## Project Structure

```
daycare-management-system/
├── CLAUDE.md                    # This file
├── CHANGELOG.md                 # Version history
├── DD_logo.png                  # Ducklings Daycare logo (253x240)
├── Dockerfile                   # Multi-stage Docker build (Node 20 Alpine)
├── docker-compose.yml           # Docker Compose config
├── .env.example                 # Environment variable template
├── package.json                 # Root: concurrently, sharp
│
├── client/                      # Frontend (React 19 + Vite 6)
│   ├── index.html               # Entry HTML with PWA manifest link
│   ├── vite.config.ts           # Vite config (port 5173, proxy /api → 3001)
│   ├── package.json
│   ├── public/
│   │   ├── manifest.json        # PWA manifest (Ducklings Daycare)
│   │   ├── logo-192.png         # PWA icon (192x192, padded)
│   │   ├── logo-512.png         # PWA icon (512x512, padded)
│   │   └── favicon.png          # Favicon (64x64)
│   └── src/
│       ├── App.tsx              # Root component with router
│       ├── main.tsx             # Entry point
│       ├── components/          # Reusable components (AppShell, Sidebar, etc.)
│       ├── pages/               # 18 page components
│       │   ├── DashboardPage.tsx
│       │   ├── LoginPage.tsx
│       │   ├── ChildrenPage.tsx
│       │   ├── ChildDetailPage.tsx
│       │   ├── StaffPage.tsx
│       │   ├── StaffDetailPage.tsx
│       │   ├── ParentsPage.tsx
│       │   ├── AttendancePage.tsx
│       │   ├── AttendanceHistoryPage.tsx
│       │   ├── BillingDashboardPage.tsx
│       │   ├── BillingPage.tsx         # (Invoices list)
│       │   ├── InvoiceDetailPage.tsx
│       │   ├── FeeConfigPage.tsx
│       │   ├── FamilyAccountPage.tsx
│       │   ├── PaymentMethodsPage.tsx
│       │   ├── AgingReportPage.tsx
│       │   ├── ReportsPage.tsx         # 4 tabs: Overview, Child Detail, Staff Detail, Financial
│       │   └── SettingsPage.tsx        # 8 tabs (see below)
│       ├── stores/              # Zustand stores
│       │   ├── authStore.ts
│       │   ├── themeStore.ts
│       │   ├── brandingStore.ts
│       │   └── uiStore.ts
│       └── lib/
│           └── api.ts           # Axios-based API client
│
├── server/                      # Backend (Express + better-sqlite3)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts             # Express app entry (port 3001)
│       ├── db/
│       │   ├── connection.ts    # SQLite connection (data/daycare.db)
│       │   ├── schema.ts        # Drizzle schema (reference only)
│       │   ├── migrate.ts       # Raw SQL CREATE TABLE statements (28 tables)
│       │   └── seed.ts          # Seed data script
│       ├── middleware/
│       │   ├── auth.ts          # requireAuth, requireRole, requirePermission
│       │   ├── errorHandler.ts  # Error handling middleware
│       │   └── rateLimiter.ts   # Rate limiting
│       └── routes/              # 8 route files (~124 endpoints)
│           ├── auth.routes.ts
│           ├── children.routes.ts
│           ├── parents.routes.ts
│           ├── staff.routes.ts
│           ├── attendance.routes.ts
│           ├── billing.routes.ts
│           ├── reports.routes.ts
│           └── settings.routes.ts
│
├── shared/                      # Shared constants
│   └── constants/
│       ├── roles.ts
│       ├── virginia-points.ts
│       └── billing.ts
│
├── scripts/
│   └── generate-icons.js       # Sharp-based PWA icon generator
│
├── data/                        # SQLite database (gitignored)
│   └── daycare.db
│
├── backups/                     # Backup files (gitignored)
│
└── docs/                        # Documentation
    ├── SRS.md
    ├── DEVELOPMENT_PLAN.md
    ├── ADMIN_GUIDE.md
    ├── USER_GUIDE.md
    ├── API_REFERENCE.md
    ├── DATABASE_SCHEMA.md
    └── DEPLOYMENT_GUIDE.md
```

---

## Common Commands

### Development (Windows — local machine)
```bash
# Install all dependencies
npm install && cd client && npm install && cd ../server && npm install && cd ..

# Start both frontend and backend in dev mode
npm run dev
# Or separately:
cd client && npx vite          # Frontend on http://localhost:5173
cd server && npx tsx src/index.ts  # Backend on http://localhost:3001

# Build client for production
cd client && npx vite build    # Output: client/dist/

# Run database migrations
cd server && npx tsx src/db/migrate.ts

# Seed database with test data
cd server && npx tsx src/db/seed.ts

# Generate PWA icons (requires sharp)
node scripts/generate-icons.js
```

### Deployment (Ubuntu VM at 10.0.0.70)
```bash
# SSH into VM
ssh ikhan@10.0.0.70

# Update app on VM
cd ~/daycare && git pull && cd client && npx vite build && cd .. && sudo systemctl restart daycare

# Check service status
sudo systemctl status daycare

# View logs
sudo journalctl -u daycare -f

# Restart service
sudo systemctl restart daycare
```

---

## Deployment Details

| Item | Value |
|------|-------|
| **Host** | TrueNAS Core (FreeNAS) |
| **VM** | Ubuntu Server 24.04 LTS (minimized) |
| **VM IP** | 10.0.0.70 (static) |
| **Gateway** | 10.0.0.1 |
| **Network Interface** | igc1 (bridged) |
| **DNS** | 8.8.8.8, 8.8.4.4 |
| **App Path** | /home/ikhan/daycare |
| **DB Path** | /home/ikhan/daycare/data/daycare.db |
| **Service** | systemd — daycare.service |
| **User** | ikhan |
| **Node.js** | v20.x (nodesource) |
| **Access URL** | http://10.0.0.70:3001 |
| **Auto-start** | TrueNAS boots → VM auto-starts → systemd service starts |
| **PWA** | manifest.json with maskable icons, "Add to Home Screen" on Android/iOS |

### Systemd Service File (`/etc/systemd/system/daycare.service`)
```ini
[Unit]
Description=Daycare Management System
After=network.target

[Service]
Type=simple
User=ikhan
WorkingDirectory=/home/ikhan/daycare
ExecStart=/usr/bin/npx tsx server/src/index.ts
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

---

## Database

- **Engine**: SQLite via better-sqlite3
- **File**: `data/daycare.db` (auto-created on first run)
- **Tables**: 28 (see `docs/DATABASE_SCHEMA.md` for full schema)
- **Migrations**: `server/src/db/migrate.ts` — raw SQL `CREATE TABLE IF NOT EXISTS`
- **Pragmas**: `journal_mode=WAL`, `foreign_keys=ON`, `busy_timeout=5000`, `cache_size=-20000`, `synchronous=NORMAL`

### Seed Data
| Entity | Count |
|--------|-------|
| Users | 6 (admin, provider, staff1-3, substitute) |
| Staff | 5 |
| Children | 10 |
| Parents | 10 |
| Fee Configurations | 9 |

Default login: `admin` / `1234`

---

## Settings Page Tabs (8)

1. **Facility Info** — App branding + facility details
2. **Users** — User CRUD, PIN reset
3. **Billing & Invoices** — Due date, letterhead upload, footer, data retention
4. **Role Permissions** — 22 feature toggles per role
5. **Backup & Restore** — Data backup, full backup, restore, auto-backup scheduler
6. **Compliance** — Incidents, medications, meals, drills, communication log
7. **Appearance** — Color theme selection + dark mode toggle
8. **Language** — English, Spanish, Urdu

---

## Reports Page Tabs (4)

1. **Overview** — Attendance summary with date range, CSV/PDF export
2. **Child Detail** — Individual child attendance report
3. **Staff Detail** — Individual staff attendance/hours report
4. **Financial** — Revenue summary, clickable drill-down cards (Billed, Collected, Outstanding), monthly trends, payroll summary

---

## Key Patterns

### API Route Pattern
```typescript
// server/src/routes/example.routes.ts
import { Router } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth';
import { sqlite } from '../db/connection';

const router = Router();
router.use(requireAuth);

router.get('/', requirePermission('feature_view'), (req, res) => {
  const rows = sqlite.prepare('SELECT * FROM table WHERE status = ?').all('active');
  res.json(rows);
});

export default router;
```

### Frontend Page Pattern
```tsx
// client/src/pages/ExamplePage.tsx
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export default function ExamplePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['example'],
    queryFn: () => axios.get('/api/example').then(r => r.data),
  });
  // ... MUI components
}
```

### Dark Mode Pattern
```tsx
// Use theme-aware conditional values for backgrounds
backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100'

// Use MUI tokens for colors (auto-adapts to dark mode)
color: 'success.main'  // instead of '#2E7D32'
color: 'primary.main'  // instead of '#1565C0'
```
