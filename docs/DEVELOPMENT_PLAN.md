# Development Plan

## Daycare Management System - Web App on TrueNAS

**Version:** 2.0.0
**Last Updated:** February 2026
**Source:** Migration from HDMA v1.0 (Electron Desktop App)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Decisions](#2-architecture-decisions)
3. [Development Phases](#3-development-phases)
4. [Phase 1: Project Scaffolding & Infrastructure](#4-phase-1-project-scaffolding--infrastructure)
5. [Phase 2: Authentication & User Management](#5-phase-2-authentication--user-management)
6. [Phase 3: Core Modules - Children & Staff](#6-phase-3-core-modules---children--staff)
7. [Phase 4: Attendance & Virginia Point System](#7-phase-4-attendance--virginia-point-system)
8. [Phase 5: Billing & Invoicing](#8-phase-5-billing--invoicing)
9. [Phase 6: Dashboard & Reports](#9-phase-6-dashboard--reports)
10. [Phase 7: Settings & Administration](#10-phase-7-settings--administration)
11. [Phase 8: Docker & TrueNAS Deployment](#11-phase-8-docker--truenas-deployment)
12. [Phase 9: Testing & Polish](#12-phase-9-testing--polish)
13. [Code Reuse Strategy](#13-code-reuse-strategy)
14. [Risk Assessment](#14-risk-assessment)
15. [File Structure](#15-file-structure)

---

## 1. Project Overview

### 1.1 Goal

Convert the existing HDMA Electron desktop application into a self-hosted web application that runs on TrueNAS, accessible from any device (desktop, tablet, phone) on the local network.

### 1.2 Key Principles

- **Maximize code reuse** from the existing HDMA React components
- **Same feature set** - all HDMA v1.0 features must be preserved
- **Multi-device support** - responsive design for desktop, tablet, phone
- **Multi-user** - simultaneous access from multiple devices
- **Self-hosted** - runs on the owner's TrueNAS server, no cloud dependency
- **Docker-based** - easy deployment and updates

### 1.3 What We're Building

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 19 + MUI + TypeScript | Reuse existing components |
| Backend | Express.js + TypeScript | New - replaces Electron main process |
| Database | PostgreSQL 16 | New - replaces SQLite |
| ORM | Drizzle ORM | Reuse schema, adapt for PostgreSQL |
| Container | Docker + docker-compose | New |
| Server | TrueNAS (user's existing hardware) | Existing |

---

## 2. Architecture Decisions

### 2.1 Why Express.js (Backend)

- Mature, well-documented Node.js framework
- Easy to understand for maintenance
- Large ecosystem of middleware (CORS, sessions, body parsing, rate limiting)
- TypeScript support
- Maps naturally from Electron IPC handlers to Express route handlers

### 2.2 Why PostgreSQL (Database)

- Robust concurrent access for multi-user web app
- Runs as Docker container alongside the app
- Drizzle ORM supports PostgreSQL with minimal schema changes
- Better for production web workloads than SQLite
- TrueNAS can run PostgreSQL natively or in Docker

### 2.3 Why Docker (Deployment)

- TrueNAS Scale has native Docker/Kubernetes support
- TrueNAS Core can run Docker via a VM (e.g., Debian VM with Docker)
- Reproducible, portable deployment
- Easy updates: pull new image, restart container
- Isolates the application from the host system

### 2.4 Why REST API (Not tRPC/GraphQL)

- Simpler to debug and understand
- Standard HTTP methods and status codes
- Easy to test with Postman/curl
- Frontend only needs fetch/axios
- Sufficient for this application's complexity

---

## 3. Development Phases

| Phase | Description | Estimated Sessions |
|-------|-------------|-------------------|
| **Phase 1** | Project Scaffolding & Infrastructure | 2-3 sessions |
| **Phase 2** | Authentication & User Management | 2-3 sessions |
| **Phase 3** | Core Modules - Children & Staff | 3-4 sessions |
| **Phase 4** | Attendance & Virginia Point System | 2-3 sessions |
| **Phase 5** | Billing & Invoicing | 4-5 sessions |
| **Phase 6** | Dashboard & Reports | 2-3 sessions |
| **Phase 7** | Settings & Administration | 3-4 sessions |
| **Phase 8** | Docker & TrueNAS Deployment | 2-3 sessions |
| **Phase 9** | Testing & Polish | 3-4 sessions |
| **Total** | | **23-32 sessions** |

A "session" is one working period with Claude doing the development. Each session typically covers one focused area.

---

## 4. Phase 1: Project Scaffolding & Infrastructure

### 4.1 Tasks

- [ ] Initialize monorepo or multi-package project structure
- [ ] Set up backend (Express.js + TypeScript)
  - [ ] Create `server/` directory with Express app
  - [ ] Configure TypeScript for backend
  - [ ] Set up middleware stack (CORS, body-parser, cookie-parser, express-session)
  - [ ] Set up error handling middleware
  - [ ] Set up logging (morgan or pino)
  - [ ] Create health check endpoint (`GET /api/health`)
- [ ] Set up frontend (Vite + React)
  - [ ] Create `client/` directory with Vite React app
  - [ ] Configure TypeScript for frontend
  - [ ] Install MUI, Zustand, React Router, i18next, jsPDF
  - [ ] Copy shared constants from HDMA (roles, virginia-points, billing)
  - [ ] Copy i18n translation files from HDMA
  - [ ] Set up API client utility (axios or fetch wrapper)
- [ ] Set up database
  - [ ] Configure Drizzle ORM for PostgreSQL
  - [ ] Migrate schema from HDMA SQLite to PostgreSQL (adapt types)
  - [ ] Create migration files
  - [ ] Set up database connection with environment variables
  - [ ] Port seed data script
- [ ] Set up Docker
  - [ ] Create `Dockerfile` for the application
  - [ ] Create `docker-compose.yml` with app + PostgreSQL
  - [ ] Configure volume mounts for data persistence
  - [ ] Test container builds and starts

### 4.2 Deliverables

- Working project structure with both frontend and backend
- Database schema deployed to PostgreSQL
- Docker containers build and start successfully
- Health check endpoint responds
- Frontend loads in browser with MUI rendering

---

## 5. Phase 2: Authentication & User Management

### 5.1 Tasks

- [ ] Backend: Authentication routes
  - [ ] `POST /api/auth/login` - Validate username + PIN, create session
  - [ ] `POST /api/auth/logout` - Destroy session
  - [ ] `GET /api/auth/session` - Return current user info
  - [ ] Configure express-session with secure settings
  - [ ] Implement bcryptjs PIN hashing (port from HDMA auth.service)
- [ ] Backend: Auth middleware
  - [ ] `requireAuth` middleware - check session exists
  - [ ] `requirePermission(permission)` middleware - check role-based access
  - [ ] `requireRole(roles)` middleware - check user role
- [ ] Backend: User management routes
  - [ ] `GET /api/settings/users` - List all users
  - [ ] `POST /api/settings/users` - Create user
  - [ ] `PUT /api/settings/users/:id` - Update user
  - [ ] `PUT /api/settings/users/:id/pin` - Reset PIN
- [ ] Frontend: Login page
  - [ ] Port `LoginPage.tsx` from HDMA
  - [ ] Replace `window.api.auth.login()` with API call
  - [ ] Update `useAuthStore` to use API calls
- [ ] Frontend: Protected routes
  - [ ] Port `ProtectedRoute.tsx` from HDMA
  - [ ] Update to check session via API on app load
  - [ ] Redirect to login if not authenticated
- [ ] Frontend: User management UI
  - [ ] Port user management section from SettingsPage
  - [ ] Replace IPC calls with API calls

### 5.2 Deliverables

- Users can log in with username and PIN
- Sessions persist across page refreshes
- Multiple users can be logged in simultaneously from different devices
- Protected routes redirect unauthenticated users to login
- Admin can create/edit users and reset PINs

---

## 6. Phase 3: Core Modules - Children & Staff

### 6.1 Tasks - Children

- [ ] Backend: Children API routes
  - [ ] `GET /api/children` - List with search/filter
  - [ ] `POST /api/children` - Create child
  - [ ] `GET /api/children/:id` - Get details with relations
  - [ ] `PUT /api/children/:id` - Update child
  - [ ] `DELETE /api/children/:id` - Archive/delete child
- [ ] Backend: Parents API routes
  - [ ] `GET /api/parents` - List parents
  - [ ] `POST /api/parents` - Create parent
  - [ ] `POST /api/parents/:id/link/:childId` - Link parent to child
  - [ ] `PUT /api/parents/:id` - Update parent
  - [ ] `DELETE /api/parents/:id` - Delete parent
- [ ] Backend: Emergency contacts & authorized pickups routes
- [ ] Backend: Immunizations routes
- [ ] Frontend: Port child components
  - [ ] `ChildListPage.tsx` - Replace IPC with API calls
  - [ ] `ChildEnrollmentForm.tsx` - Replace IPC with API calls
  - [ ] `ChildDetailPage.tsx` - Replace IPC with API calls

### 6.2 Tasks - Staff

- [ ] Backend: Staff API routes
  - [ ] `GET /api/staff` - List with search/filter
  - [ ] `POST /api/staff` - Create staff
  - [ ] `GET /api/staff/:id` - Get details with certifications and background checks
  - [ ] `PUT /api/staff/:id` - Update staff
- [ ] Backend: Staff certifications routes
- [ ] Backend: Background checks routes
- [ ] Frontend: Port staff components
  - [ ] `StaffListPage.tsx` - Replace IPC with API calls
  - [ ] `StaffEnrollmentForm.tsx` - Replace IPC with API calls
  - [ ] `StaffDetailPage.tsx` - Replace IPC with API calls

### 6.3 Deliverables

- Full CRUD for children with enrollment wizard
- Full CRUD for parents, emergency contacts, authorized pickups, immunizations
- Full CRUD for staff with certifications and background checks
- All list pages with search and filter working

---

## 7. Phase 4: Attendance & Virginia Point System

### 7.1 Tasks

- [ ] Backend: Attendance API routes
  - [ ] `GET /api/attendance/today/children` - Today's child attendance status
  - [ ] `GET /api/attendance/today/staff` - Today's staff attendance status
  - [ ] `POST /api/attendance/children/checkin` - Check in child
  - [ ] `POST /api/attendance/children/:id/checkout` - Check out child
  - [ ] `POST /api/attendance/staff/clockin` - Clock in staff
  - [ ] `POST /api/attendance/staff/:id/clockout` - Clock out staff
  - [ ] `GET /api/attendance/points` - Get point system status
  - [ ] `GET /api/attendance/history` - Historical records with filters
  - [ ] `PUT /api/attendance/:id/correct` - Time correction
- [ ] Backend: Port Virginia Point System service
  - [ ] Age calculation from date of birth
  - [ ] Point assignment by age group
  - [ ] Caregiver requirement calculation
  - [ ] Compliance status determination
- [ ] Frontend: Port attendance components
  - [ ] `AttendancePage.tsx` - Replace IPC with API calls, keep touch-friendly UI
  - [ ] `AttendanceHistory.tsx` - Replace IPC with API calls
  - [ ] Ensure responsive layout for tablet use

### 7.2 Deliverables

- Tap-to-check-in/check-out for children (tablet-optimized)
- Staff clock-in/clock-out
- Real-time Virginia Point System compliance display
- Attendance history with date range filtering
- Time correction with reason tracking

---

## 8. Phase 5: Billing & Invoicing

### 8.1 Tasks

- [ ] Backend: Fee configuration routes
  - [ ] CRUD for fee configurations
- [ ] Backend: Invoice routes
  - [ ] `POST /api/billing/invoices/generate` - Generate invoices for period
  - [ ] `GET /api/billing/invoices` - List invoices with status filter
  - [ ] `GET /api/billing/invoices/:id` - Full invoice detail with line items and payments
  - [ ] `PUT /api/billing/invoices/:id/void` - Void invoice
  - [ ] `POST /api/billing/invoices/:id/line-items` - Add line item
  - [ ] `PUT /api/billing/invoices/:id/line-items/:itemId` - Update line item
  - [ ] `DELETE /api/billing/invoices/:id/line-items/:itemId` - Delete line item
  - [ ] `PUT /api/billing/invoices/:id/split-billing` - Update split billing
- [ ] Backend: Payment routes
  - [ ] `POST /api/billing/payments` - Record payment
  - [ ] `GET /api/billing/payments` - List payments
- [ ] Backend: Family account routes
  - [ ] `GET /api/billing/families` - List family accounts
  - [ ] `GET /api/billing/families/:id` - Family account detail
- [ ] Backend: Billing summary and aging report routes
- [ ] Frontend: Port billing components
  - [ ] `BillingDashboard.tsx` - Replace IPC with API calls
  - [ ] `FeeConfigPage.tsx` - Replace IPC with API calls
  - [ ] `InvoiceListPage.tsx` - Replace IPC with API calls
  - [ ] `InvoiceDetailPage.tsx` - Replace IPC with API calls (including split billing)
  - [ ] `PaymentRecordForm.tsx` - Replace IPC with API calls
  - [ ] `FamilyAccountPage.tsx` - Replace IPC with API calls
  - [ ] `AgingReport.tsx` - Replace IPC with API calls
  - [ ] `PrintableInvoice.tsx` - No changes needed (browser print)

### 8.2 Deliverables

- Fee configuration management
- Invoice generation, viewing, editing line items
- Payment recording with multiple payment methods
- Split billing with dual printable invoices
- Family accounts with transaction history
- Aging report

---

## 9. Phase 6: Dashboard & Reports

### 9.1 Tasks

- [ ] Backend: Dashboard route
  - [ ] `GET /api/reports/dashboard` - Aggregated dashboard data
  - [ ] Checked-in children count and list
  - [ ] Clocked-in staff count and list
  - [ ] Point system status
  - [ ] Past due accounts
  - [ ] Certification expiration alerts
  - [ ] Licensed capacity info
- [ ] Backend: Report routes
  - [ ] `GET /api/reports/attendance` - Attendance report with filters
  - [ ] `GET /api/reports/financial` - Financial report with filters
  - [ ] `GET /api/reports/export/csv` - Server-side CSV generation, return as download
  - [ ] `GET /api/reports/export/pdf` - Server-side PDF generation, return as download
- [ ] Frontend: Port dashboard and report components
  - [ ] `DashboardPage.tsx` - Replace IPC with API calls
  - [ ] `ReportsPage.tsx` - Replace IPC with API calls
  - [ ] Update CSV/PDF export to trigger file download from API

### 9.2 Deliverables

- Dashboard with real-time data (polling every 30 seconds)
- Attendance reports with date range and entity filters
- Financial reports with revenue, payments, and outstanding summary
- CSV and PDF export (generated server-side, downloaded by browser)

---

## 10. Phase 7: Settings & Administration

### 10.1 Tasks

- [ ] Backend: Settings routes
  - [ ] `GET /api/settings` - Get all settings
  - [ ] `PUT /api/settings` - Update settings
  - [ ] `GET /api/settings/facility` - Get facility info
  - [ ] `PUT /api/settings/facility` - Update facility info
  - [ ] `GET /api/settings/branding` - Get app branding
- [ ] Backend: Role permissions routes
  - [ ] `GET /api/settings/permissions/:role` - Get role permissions
  - [ ] `PUT /api/settings/permissions/:role` - Update role permission
- [ ] Backend: Backup/Restore routes
  - [ ] `POST /api/settings/backup/data` - Create database backup
  - [ ] `POST /api/settings/backup/app` - Create full application backup
  - [ ] `POST /api/settings/restore` - Restore from uploaded backup file
  - [ ] `GET /api/settings/backup/history` - List backup history
  - [ ] `GET /api/settings/backup/:id/download` - Download backup file
  - [ ] `DELETE /api/settings/backup/:id` - Delete backup
- [ ] Backend: Letterhead image upload
  - [ ] `POST /api/settings/letterhead` - Upload letterhead image (multipart/form-data)
  - [ ] `GET /api/settings/letterhead` - Get letterhead data URL
- [ ] Backend: Data retention routes
  - [ ] Archive records
  - [ ] Get archived records
  - [ ] Process expired archives
  - [ ] Export data as CSV
- [ ] Frontend: Port settings components
  - [ ] `SettingsPage.tsx` - Replace IPC with API calls for all tabs
  - [ ] File upload for letterhead (HTML file input instead of Electron dialog)
  - [ ] Backup download via browser download (instead of Electron Save dialog)
  - [ ] Backup restore via file upload (instead of Electron Open dialog)

### 10.2 Deliverables

- All settings tabs functional (Facility, Users, Billing, Permissions, Backup, Appearance, Language)
- Backup/restore with browser-based file upload/download
- Letterhead upload via web form
- Role permissions configuration

---

## 11. Phase 8: Docker & TrueNAS Deployment

### 11.1 Tasks

- [ ] Finalize Dockerfile
  - [ ] Multi-stage build (build frontend, package with backend)
  - [ ] Minimal production image (node:20-alpine)
  - [ ] Expose port 3000
- [ ] Finalize docker-compose.yml
  - [ ] App container with environment variables
  - [ ] PostgreSQL container with persistent volume
  - [ ] Network configuration
  - [ ] Auto-restart policies
  - [ ] Health checks
- [ ] Configure TrueNAS deployment
  - [ ] Document steps for TrueNAS Scale (native Docker/Kubernetes)
  - [ ] Document steps for TrueNAS Core (via VM with Docker)
  - [ ] Configure TrueNAS dataset for data persistence
  - [ ] Set up automated daily backups via cron/scheduled task
- [ ] Configure networking
  - [ ] Static IP or hostname for the TrueNAS server
  - [ ] Port forwarding if needed
  - [ ] Optional: mDNS/Bonjour for `daycare.local` access
- [ ] Test deployment
  - [ ] Test from desktop browser
  - [ ] Test from tablet browser
  - [ ] Test from phone browser
  - [ ] Test container restart (data persists)
  - [ ] Test database backup and restore

### 11.2 Deliverables

- Docker image builds successfully
- docker-compose up starts the entire stack
- Application accessible from all devices on local network
- Data persists across container restarts
- Deployment documentation for TrueNAS

---

## 12. Phase 9: Testing & Polish

### 12.1 Tasks

- [ ] Functional testing
  - [ ] Test all CRUD operations for each module
  - [ ] Test attendance check-in/check-out from tablet
  - [ ] Test billing workflow end-to-end
  - [ ] Test multi-user scenarios (staff on tablet + admin on desktop simultaneously)
  - [ ] Test all reports and exports
  - [ ] Test backup and restore
- [ ] Responsive design testing
  - [ ] Desktop (1920x1080, 1366x768)
  - [ ] Tablet (1024x768, 768x1024)
  - [ ] Phone (390x844, 412x915)
  - [ ] Test touch interactions on tablet/phone
- [ ] Cross-browser testing
  - [ ] Chrome (primary)
  - [ ] Firefox
  - [ ] Safari (iOS)
  - [ ] Edge
- [ ] Security testing
  - [ ] Verify unauthenticated API access is blocked
  - [ ] Verify permission-based access control on API
  - [ ] Verify session expiry works
  - [ ] Test with invalid/malicious input
- [ ] Performance testing
  - [ ] Dashboard load time
  - [ ] Attendance page refresh performance
  - [ ] API response times under normal load
- [ ] Polish
  - [ ] Consistent error handling and messages
  - [ ] Loading states for all API calls
  - [ ] Empty states for lists with no data
  - [ ] Verify all i18n strings are present in all languages
  - [ ] Verify all themes work correctly

### 12.2 Deliverables

- All features working across desktop, tablet, and phone
- No critical bugs
- Responsive design verified on all target screen sizes
- Security verified
- Ready for daily use

---

## 13. Code Reuse Strategy

### 13.1 Direct Reuse (No/Minimal Changes)

These files can be copied directly from HDMA:

| Category | Files | Changes Needed |
|----------|-------|---------------|
| Constants | `roles.ts`, `virginia-points.ts`, `billing.ts` | None |
| i18n | `en.json`, `es.json` | None |
| Themes | `theme.ts` | None |
| Print Components | `PrintableInvoice.tsx` | None |

### 13.2 Adapt (Replace IPC with API Calls)

These files need the IPC calls replaced with fetch/axios API calls:

| Component | IPC Calls to Replace |
|-----------|---------------------|
| `DashboardPage.tsx` | `window.api.reports.getDashboardData()` → `GET /api/reports/dashboard` |
| `AttendancePage.tsx` | `window.api.attendance.*` → `POST/GET /api/attendance/*` |
| `ChildListPage.tsx` | `window.api.children.getAll()` → `GET /api/children` |
| `ChildEnrollmentForm.tsx` | `window.api.children.create()` → `POST /api/children` |
| `ChildDetailPage.tsx` | `window.api.children.getById()` → `GET /api/children/:id` |
| `StaffListPage.tsx` | `window.api.staff.getAll()` → `GET /api/staff` |
| `StaffDetailPage.tsx` | `window.api.staff.getById()` → `GET /api/staff/:id` |
| `BillingDashboard.tsx` | `window.api.billing.getSummary()` → `GET /api/billing/summary` |
| `InvoiceDetailPage.tsx` | `window.api.billing.*` → various billing API calls |
| `ReportsPage.tsx` | `window.api.reports.*` → `GET /api/reports/*` |
| `SettingsPage.tsx` | `window.api.settings.*` → `GET/PUT /api/settings/*` |

### 13.3 Build New

| Component | Description |
|-----------|-------------|
| `server/index.ts` | Express app setup, middleware, start |
| `server/routes/*.ts` | API route handlers for each module |
| `server/middleware/auth.ts` | Session authentication middleware |
| `server/middleware/permissions.ts` | Role-based permission middleware |
| `server/services/*.ts` | Port business logic from HDMA services |
| `server/db/connection.ts` | PostgreSQL connection via Drizzle |
| `server/db/schema.ts` | Adapted schema for PostgreSQL |
| `client/src/lib/api.ts` | API client utility (replaces `window.api`) |
| `Dockerfile` | Multi-stage Docker build |
| `docker-compose.yml` | App + PostgreSQL composition |

### 13.4 API Client Pattern

Create a centralized API client that mirrors the `window.api` structure:

```typescript
// client/src/lib/api.ts
const API_BASE = '/api';

async function request(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include', // Include session cookie
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  auth: {
    login: (username: string, pin: string) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify({ username, pin }) }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    getSession: () => request('/auth/session'),
  },
  children: {
    getAll: (params?: Record<string, string>) =>
      request(`/children?${new URLSearchParams(params)}`),
    getById: (id: number) => request(`/children/${id}`),
    create: (data: any) =>
      request('/children', { method: 'POST', body: JSON.stringify(data) }),
    // ... more methods
  },
  // ... more modules
};
```

This means component changes are minimal:
```typescript
// Before (HDMA):
const result = await window.api.children.getAll({ status: 'active' });

// After (DMS):
const result = await api.children.getAll({ status: 'active' });
```

---

## 14. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| TrueNAS Core lacks native Docker | High | Use a Debian/Ubuntu VM on TrueNAS Core with Docker installed. Document setup steps. |
| PostgreSQL migration issues | Medium | Drizzle ORM handles most type differences. Test schema migration thoroughly in Phase 1. |
| Multi-user data conflicts | Medium | Use database transactions for critical operations. PostgreSQL handles concurrency well. |
| Tablet browser compatibility | Low | MUI is well-tested on mobile browsers. Test on actual tablet during Phase 9. |
| Network connectivity | Low | App runs on local network. TrueNAS server is always on. No internet dependency. |
| Session management complexity | Low | Use proven express-session library. Configure appropriate timeout for daycare hours. |

---

## 15. File Structure

```
daycare-management-system/
├── docs/
│   ├── SRS.md
│   ├── DEVELOPMENT_PLAN.md
│   ├── ADMIN_GUIDE.md
│   └── USER_GUIDE.md
├── client/                          # Frontend (React)
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── assets/
│   │   │   └── styles/
│   │   │       └── theme.ts         # Reuse from HDMA
│   │   ├── components/
│   │   │   ├── attendance/
│   │   │   │   ├── AttendancePage.tsx    # Adapt from HDMA
│   │   │   │   └── AttendanceHistory.tsx # Adapt from HDMA
│   │   │   ├── auth/
│   │   │   │   └── LoginPage.tsx         # Adapt from HDMA
│   │   │   ├── billing/
│   │   │   │   ├── BillingDashboard.tsx  # Adapt from HDMA
│   │   │   │   ├── FeeConfigPage.tsx     # Adapt from HDMA
│   │   │   │   ├── InvoiceListPage.tsx   # Adapt from HDMA
│   │   │   │   ├── InvoiceDetailPage.tsx # Adapt from HDMA
│   │   │   │   ├── PaymentRecordForm.tsx # Adapt from HDMA
│   │   │   │   ├── FamilyAccountPage.tsx # Adapt from HDMA
│   │   │   │   ├── AgingReport.tsx       # Adapt from HDMA
│   │   │   │   └── PrintableInvoice.tsx  # Reuse from HDMA
│   │   │   ├── children/
│   │   │   │   ├── ChildListPage.tsx        # Adapt from HDMA
│   │   │   │   ├── ChildDetailPage.tsx      # Adapt from HDMA
│   │   │   │   └── ChildEnrollmentForm.tsx  # Adapt from HDMA
│   │   │   ├── dashboard/
│   │   │   │   └── DashboardPage.tsx     # Adapt from HDMA
│   │   │   ├── layout/
│   │   │   │   ├── AppShell.tsx          # Adapt from HDMA
│   │   │   │   ├── Header.tsx            # Adapt from HDMA
│   │   │   │   └── Sidebar.tsx           # Adapt from HDMA (responsive)
│   │   │   ├── reports/
│   │   │   │   └── ReportsPage.tsx       # Adapt from HDMA
│   │   │   ├── settings/
│   │   │   │   └── SettingsPage.tsx      # Adapt from HDMA
│   │   │   └── staff/
│   │   │       ├── StaffListPage.tsx        # Adapt from HDMA
│   │   │       ├── StaffDetailPage.tsx      # Adapt from HDMA
│   │   │       └── StaffEnrollmentForm.tsx  # Adapt from HDMA
│   │   ├── i18n/
│   │   │   ├── en.json               # Reuse from HDMA
│   │   │   ├── es.json               # Reuse from HDMA
│   │   │   └── index.ts
│   │   ├── lib/
│   │   │   └── api.ts                # NEW - API client (replaces window.api)
│   │   ├── router/
│   │   │   ├── index.tsx             # Adapt (BrowserRouter)
│   │   │   └── ProtectedRoute.tsx    # Adapt from HDMA
│   │   ├── stores/
│   │   │   ├── authStore.ts          # Adapt from HDMA (use API)
│   │   │   ├── themeStore.ts         # Adapt from HDMA (use API)
│   │   │   ├── brandingStore.ts      # Adapt from HDMA (use API)
│   │   │   └── uiStore.ts            # Reuse from HDMA
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/                           # Backend (Express)
│   ├── src/
│   │   ├── db/
│   │   │   ├── connection.ts         # NEW - PostgreSQL connection
│   │   │   ├── schema.ts            # Adapt from HDMA (PostgreSQL types)
│   │   │   ├── migrations/          # Drizzle migrations
│   │   │   └── seed.ts              # Adapt from HDMA
│   │   ├── middleware/
│   │   │   ├── auth.ts              # NEW - Session auth middleware
│   │   │   ├── permissions.ts       # NEW - RBAC middleware
│   │   │   ├── errorHandler.ts      # NEW - Error handling
│   │   │   └── rateLimiter.ts       # NEW - Rate limiting
│   │   ├── routes/
│   │   │   ├── auth.routes.ts       # NEW - Auth endpoints
│   │   │   ├── children.routes.ts   # NEW - Children endpoints
│   │   │   ├── parents.routes.ts    # NEW - Parents endpoints
│   │   │   ├── staff.routes.ts      # NEW - Staff endpoints
│   │   │   ├── attendance.routes.ts # NEW - Attendance endpoints
│   │   │   ├── billing.routes.ts    # NEW - Billing endpoints
│   │   │   ├── reports.routes.ts    # NEW - Reports endpoints
│   │   │   └── settings.routes.ts   # NEW - Settings endpoints
│   │   ├── services/
│   │   │   ├── auth.service.ts      # Port from HDMA
│   │   │   ├── child.service.ts     # Port from HDMA
│   │   │   ├── staff.service.ts     # Port from HDMA
│   │   │   ├── attendance.service.ts # Port from HDMA
│   │   │   ├── billing.service.ts   # Port from HDMA
│   │   │   ├── point-system.service.ts # Port from HDMA
│   │   │   ├── report.service.ts    # Port from HDMA
│   │   │   ├── backup.service.ts    # Port from HDMA (adapt for server)
│   │   │   └── audit.service.ts     # Port from HDMA
│   │   └── index.ts                 # NEW - Express app entry point
│   ├── package.json
│   └── tsconfig.json
├── shared/                           # Shared between client & server
│   └── constants/
│       ├── roles.ts                  # Reuse from HDMA
│       ├── virginia-points.ts        # Reuse from HDMA
│       └── billing.ts               # Reuse from HDMA
├── docker-compose.yml               # NEW
├── Dockerfile                       # NEW
├── .env.example                     # NEW - Environment variable template
├── package.json                     # Root package.json
├── README.md
└── .gitignore
```

---

## Appendix: Quick Start Development Commands

```bash
# Install dependencies
npm install

# Start development (frontend + backend)
npm run dev

# Build for production
npm run build

# Run database migrations
npm run db:migrate

# Seed test data
npm run db:seed

# Build Docker image
docker build -t daycare-management-system .

# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```
