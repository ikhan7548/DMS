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
| Frontend | React 19 + MUI v6 + TypeScript + Vite 6 | Reuse existing components |
| Backend | Express.js + TypeScript | New - replaces Electron main process |
| Database | SQLite via better-sqlite3 | Kept same as HDMA |
| Database Access | Raw SQL queries | No ORM query builder |
| Deployment | TrueNAS Core VM (Ubuntu Server) + systemd | Docker available as alternative |
| Server | TrueNAS (user's existing hardware) | Existing |

---

## 2. Architecture Decisions

### 2.1 Why Express.js (Backend)

- Mature, well-documented Node.js framework
- Easy to understand for maintenance
- Large ecosystem of middleware (CORS, sessions, body parsing, rate limiting)
- TypeScript support
- Maps naturally from Electron IPC handlers to Express route handlers

### 2.2 Why SQLite (Database)

- Same database engine as HDMA v1.0, zero migration effort
- Single file, simple backup (just copy the .db file)
- better-sqlite3 is fast and synchronous
- WAL mode handles concurrent reads from multiple users
- Sufficient for a family day home with 5-10 concurrent users
- No separate database server to manage

### 2.3 Why TrueNAS VM + Systemd (Deployment)

- TrueNAS Core doesn't support Docker natively (jail approach had networking issues)
- Ubuntu Server VM with bridged networking works reliably
- Systemd service provides auto-start and auto-restart
- Simple update workflow: git pull → build → restart
- Docker Compose available as alternative for TrueNAS Scale

### 2.4 Why REST API (Not tRPC/GraphQL)

- Simpler to debug and understand
- Standard HTTP methods and status codes
- Easy to test with Postman/curl
- Frontend only needs fetch/axios
- Sufficient for this application's complexity

---

## 3. Development Phases

| Phase | Description | Status |
|-------|-------------|--------|
| **Phase 1** | Project Scaffolding & Infrastructure | **COMPLETE** |
| **Phase 2** | Authentication & User Management | **COMPLETE** |
| **Phase 3** | Core Modules - Children & Staff | **COMPLETE** |
| **Phase 4** | Attendance & Virginia Point System | **COMPLETE** |
| **Phase 5** | Billing & Invoicing | **COMPLETE** |
| **Phase 6** | Dashboard & Reports | **COMPLETE** |
| **Phase 7** | Settings & Administration | **COMPLETE** |
| **Phase 8** | TrueNAS Deployment | **COMPLETE** |
| **Phase 9** | Testing & Polish | **COMPLETE** |

All phases completed in February 2026. Development done with Claude Code (AI-assisted).

---

## 4. Phase 1: Project Scaffolding & Infrastructure

### 4.1 Tasks

- [x] Initialize monorepo or multi-package project structure
- [x] Set up backend (Express.js + TypeScript)
  - [x] Create `server/` directory with Express app
  - [x] Configure TypeScript for backend
  - [x] Set up middleware stack (CORS, body-parser, cookie-parser, express-session)
  - [x] Set up error handling middleware
  - [x] Set up logging (morgan)
  - [x] Create health check endpoint (`GET /api/health`)
- [x] Set up frontend (Vite + React)
  - [x] Create `client/` directory with Vite React app
  - [x] Configure TypeScript for frontend
  - [x] Install MUI, Zustand, React Router, dayjs, @tanstack/react-query
  - [x] Copy shared constants from HDMA (roles, virginia-points, billing)
  - [x] Set up API client utility (axios)
- [x] Set up database
  - [x] Configure better-sqlite3 with raw SQL
  - [x] Create migration file with CREATE TABLE IF NOT EXISTS
  - [x] Set up database connection (data/daycare.db)
  - [x] Port seed data script
- [x] Set up Docker (optional)
  - [x] Create `Dockerfile` for the application
  - [x] Create `docker-compose.yml`
  - [x] Configure volume mounts for data persistence

### 4.2 Deliverables

- ✅ Working project structure with both frontend and backend
- ✅ Database schema deployed to SQLite (28 tables)
- ✅ Health check endpoint responds
- ✅ Frontend loads in browser with MUI rendering
- ✅ Docker config available (optional)

---

## 5. Phase 2: Authentication & User Management

### 5.1 Tasks

- [x]Backend: Authentication routes
  - [x]`POST /api/auth/login` - Validate username + PIN, create session
  - [x]`POST /api/auth/logout` - Destroy session
  - [x]`GET /api/auth/session` - Return current user info
  - [x]Configure express-session with secure settings
  - [x]Implement bcryptjs PIN hashing (port from HDMA auth.service)
- [x]Backend: Auth middleware
  - [x]`requireAuth` middleware - check session exists
  - [x]`requirePermission(permission)` middleware - check role-based access
  - [x]`requireRole(roles)` middleware - check user role
- [x]Backend: User management routes
  - [x]`GET /api/settings/users` - List all users
  - [x]`POST /api/settings/users` - Create user
  - [x]`PUT /api/settings/users/:id` - Update user
  - [x]`PUT /api/settings/users/:id/pin` - Reset PIN
- [x]Frontend: Login page
  - [x]Port `LoginPage.tsx` from HDMA
  - [x]Replace `window.api.auth.login()` with API call
  - [x]Update `useAuthStore` to use API calls
- [x]Frontend: Protected routes
  - [x]Port `ProtectedRoute.tsx` from HDMA
  - [x]Update to check session via API on app load
  - [x]Redirect to login if not authenticated
- [x]Frontend: User management UI
  - [x]Port user management section from SettingsPage
  - [x]Replace IPC calls with API calls

### 5.2 Deliverables

- Users can log in with username and PIN
- Sessions persist across page refreshes
- Multiple users can be logged in simultaneously from different devices
- Protected routes redirect unauthenticated users to login
- Admin can create/edit users and reset PINs

---

## 6. Phase 3: Core Modules - Children & Staff

### 6.1 Tasks - Children

- [x]Backend: Children API routes
  - [x]`GET /api/children` - List with search/filter
  - [x]`POST /api/children` - Create child
  - [x]`GET /api/children/:id` - Get details with relations
  - [x]`PUT /api/children/:id` - Update child
  - [x]`DELETE /api/children/:id` - Archive/delete child
- [x]Backend: Parents API routes
  - [x]`GET /api/parents` - List parents
  - [x]`POST /api/parents` - Create parent
  - [x]`POST /api/parents/:id/link/:childId` - Link parent to child
  - [x]`PUT /api/parents/:id` - Update parent
  - [x]`DELETE /api/parents/:id` - Delete parent
- [x]Backend: Emergency contacts & authorized pickups routes
- [x]Backend: Immunizations routes
- [x]Frontend: Port child components
  - [x]`ChildListPage.tsx` - Replace IPC with API calls
  - [x]`ChildEnrollmentForm.tsx` - Replace IPC with API calls
  - [x]`ChildDetailPage.tsx` - Replace IPC with API calls

### 6.2 Tasks - Staff

- [x]Backend: Staff API routes
  - [x]`GET /api/staff` - List with search/filter
  - [x]`POST /api/staff` - Create staff
  - [x]`GET /api/staff/:id` - Get details with certifications and background checks
  - [x]`PUT /api/staff/:id` - Update staff
- [x]Backend: Staff certifications routes
- [x]Backend: Background checks routes
- [x]Frontend: Port staff components
  - [x]`StaffListPage.tsx` - Replace IPC with API calls
  - [x]`StaffEnrollmentForm.tsx` - Replace IPC with API calls
  - [x]`StaffDetailPage.tsx` - Replace IPC with API calls

### 6.3 Deliverables

- Full CRUD for children with enrollment wizard
- Full CRUD for parents, emergency contacts, authorized pickups, immunizations
- Full CRUD for staff with certifications and background checks
- All list pages with search and filter working

---

## 7. Phase 4: Attendance & Virginia Point System

### 7.1 Tasks

- [x]Backend: Attendance API routes
  - [x]`GET /api/attendance/today/children` - Today's child attendance status
  - [x]`GET /api/attendance/today/staff` - Today's staff attendance status
  - [x]`POST /api/attendance/children/checkin` - Check in child
  - [x]`POST /api/attendance/children/:id/checkout` - Check out child
  - [x]`POST /api/attendance/staff/clockin` - Clock in staff
  - [x]`POST /api/attendance/staff/:id/clockout` - Clock out staff
  - [x]`GET /api/attendance/points` - Get point system status
  - [x]`GET /api/attendance/history` - Historical records with filters
  - [x]`PUT /api/attendance/:id/correct` - Time correction
- [x]Backend: Port Virginia Point System service
  - [x]Age calculation from date of birth
  - [x]Point assignment by age group
  - [x]Caregiver requirement calculation
  - [x]Compliance status determination
- [x]Frontend: Port attendance components
  - [x]`AttendancePage.tsx` - Replace IPC with API calls, keep touch-friendly UI
  - [x]`AttendanceHistory.tsx` - Replace IPC with API calls
  - [x]Ensure responsive layout for tablet use

### 7.2 Deliverables

- Tap-to-check-in/check-out for children (tablet-optimized)
- Staff clock-in/clock-out
- Real-time Virginia Point System compliance display
- Attendance history with date range filtering
- Time correction with reason tracking

---

## 8. Phase 5: Billing & Invoicing

### 8.1 Tasks

- [x]Backend: Fee configuration routes
  - [x]CRUD for fee configurations
- [x]Backend: Invoice routes
  - [x]`POST /api/billing/invoices/generate` - Generate invoices for period
  - [x]`GET /api/billing/invoices` - List invoices with status filter
  - [x]`GET /api/billing/invoices/:id` - Full invoice detail with line items and payments
  - [x]`PUT /api/billing/invoices/:id/void` - Void invoice
  - [x]`POST /api/billing/invoices/:id/line-items` - Add line item
  - [x]`PUT /api/billing/invoices/:id/line-items/:itemId` - Update line item
  - [x]`DELETE /api/billing/invoices/:id/line-items/:itemId` - Delete line item
  - [x]`PUT /api/billing/invoices/:id/split-billing` - Update split billing
- [x]Backend: Payment routes
  - [x]`POST /api/billing/payments` - Record payment
  - [x]`GET /api/billing/payments` - List payments
- [x]Backend: Family account routes
  - [x]`GET /api/billing/families` - List family accounts
  - [x]`GET /api/billing/families/:id` - Family account detail
- [x]Backend: Billing summary and aging report routes
- [x]Frontend: Port billing components
  - [x]`BillingDashboard.tsx` - Replace IPC with API calls
  - [x]`FeeConfigPage.tsx` - Replace IPC with API calls
  - [x]`InvoiceListPage.tsx` - Replace IPC with API calls
  - [x]`InvoiceDetailPage.tsx` - Replace IPC with API calls (including split billing)
  - [x]`PaymentRecordForm.tsx` - Replace IPC with API calls
  - [x]`FamilyAccountPage.tsx` - Replace IPC with API calls
  - [x]`AgingReport.tsx` - Replace IPC with API calls
  - [x]`PrintableInvoice.tsx` - No changes needed (browser print)

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

- [x]Backend: Dashboard route
  - [x]`GET /api/reports/dashboard` - Aggregated dashboard data
  - [x]Checked-in children count and list
  - [x]Clocked-in staff count and list
  - [x]Point system status
  - [x]Past due accounts
  - [x]Certification expiration alerts
  - [x]Licensed capacity info
- [x]Backend: Report routes
  - [x]`GET /api/reports/attendance` - Attendance report with filters
  - [x]`GET /api/reports/financial` - Financial report with filters
  - [x]`GET /api/reports/export/csv` - Server-side CSV generation, return as download
  - [x]`GET /api/reports/export/pdf` - Server-side PDF generation, return as download
- [x]Frontend: Port dashboard and report components
  - [x]`DashboardPage.tsx` - Replace IPC with API calls
  - [x]`ReportsPage.tsx` - Replace IPC with API calls
  - [x]Update CSV/PDF export to trigger file download from API

### 9.2 Deliverables

- Dashboard with real-time data (polling every 30 seconds)
- Attendance reports with date range and entity filters
- Financial reports with revenue, payments, and outstanding summary
- CSV and PDF export (generated server-side, downloaded by browser)

---

## 10. Phase 7: Settings & Administration

### 10.1 Tasks

- [x]Backend: Settings routes
  - [x]`GET /api/settings` - Get all settings
  - [x]`PUT /api/settings` - Update settings
  - [x]`GET /api/settings/facility` - Get facility info
  - [x]`PUT /api/settings/facility` - Update facility info
  - [x]`GET /api/settings/branding` - Get app branding
- [x]Backend: Role permissions routes
  - [x]`GET /api/settings/permissions/:role` - Get role permissions
  - [x]`PUT /api/settings/permissions/:role` - Update role permission
- [x]Backend: Backup/Restore routes
  - [x]`POST /api/settings/backup/data` - Create database backup
  - [x]`POST /api/settings/backup/app` - Create full application backup
  - [x]`POST /api/settings/restore` - Restore from uploaded backup file
  - [x]`GET /api/settings/backup/history` - List backup history
  - [x]`GET /api/settings/backup/:id/download` - Download backup file
  - [x]`DELETE /api/settings/backup/:id` - Delete backup
- [x]Backend: Letterhead image upload
  - [x]`POST /api/settings/letterhead` - Upload letterhead image (multipart/form-data)
  - [x]`GET /api/settings/letterhead` - Get letterhead data URL
- [x]Backend: Data retention routes
  - [x]Archive records
  - [x]Get archived records
  - [x]Process expired archives
  - [x]Export data as CSV
- [x]Frontend: Port settings components
  - [x]`SettingsPage.tsx` - Replace IPC with API calls for all tabs
  - [x]File upload for letterhead (HTML file input instead of Electron dialog)
  - [x]Backup download via browser download (instead of Electron Save dialog)
  - [x]Backup restore via file upload (instead of Electron Open dialog)

### 10.2 Deliverables

- All settings tabs functional (Facility, Users, Billing, Permissions, Backup, Appearance, Language)
- Backup/restore with browser-based file upload/download
- Letterhead upload via web form
- Role permissions configuration

---

## 11. Phase 8: TrueNAS Deployment

### 11.1 Tasks

- [x] Create Ubuntu Server 24.04 VM on TrueNAS Core
  - [x] UEFI boot, 1 CPU, 2GB RAM, 10GB disk
  - [x] Static IP: 10.0.0.70 on igc1 (bridged)
  - [x] VM auto-start enabled
- [x] Install Node.js 20, Git on VM
- [x] Clone repository from GitHub
- [x] Build client, run migrations and seed
- [x] Create systemd service (daycare.service)
  - [x] Auto-start on boot
  - [x] Restart on failure
- [x] Test access from desktop, tablet, phone
- [x] Set up PWA with home screen icons
- [x] Docker config available as alternative (Dockerfile + docker-compose.yml)

### 11.2 Deliverables

- ✅ App running on VM at http://10.0.0.70:3001
- ✅ Auto-start chain: TrueNAS → VM → systemd → app
- ✅ Accessible from desktop, tablet, phone
- ✅ PWA home screen support with branded icons
- ✅ Data persists across restarts
- ✅ Deployment guide documented

---

## 12. Phase 9: Testing & Polish

### 12.1 Tasks

- [x]Functional testing
  - [x]Test all CRUD operations for each module
  - [x]Test attendance check-in/check-out from tablet
  - [x]Test billing workflow end-to-end
  - [x]Test multi-user scenarios (staff on tablet + admin on desktop simultaneously)
  - [x]Test all reports and exports
  - [x]Test backup and restore
- [x]Responsive design testing
  - [x]Desktop (1920x1080, 1366x768)
  - [x]Tablet (1024x768, 768x1024)
  - [x]Phone (390x844, 412x915)
  - [x]Test touch interactions on tablet/phone
- [x]Cross-browser testing
  - [x]Chrome (primary)
  - [x]Firefox
  - [x]Safari (iOS)
  - [x]Edge
- [x]Security testing
  - [x]Verify unauthenticated API access is blocked
  - [x]Verify permission-based access control on API
  - [x]Verify session expiry works
  - [x]Test with invalid/malicious input
- [x]Performance testing
  - [x]Dashboard load time
  - [x]Attendance page refresh performance
  - [x]API response times under normal load
- [x]Polish
  - [x]Consistent error handling and messages
  - [x]Loading states for all API calls
  - [x]Empty states for lists with no data
  - [x]Verify all i18n strings are present in all languages
  - [x]Verify all themes work correctly

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
| `server/db/connection.ts` | SQLite connection via better-sqlite3 |
| `server/db/migrate.ts` | Raw SQL CREATE TABLE statements |
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
| TrueNAS Core lacks native Docker | High | **Resolved**: Used Ubuntu Server VM with systemd instead. Jail approach had VNET networking issues. |
| Database migration | Low | **Resolved**: Kept SQLite (same as HDMA v1.0). No migration needed. |
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
│   │   │   ├── connection.ts         # NEW - SQLite connection (better-sqlite3)
│   │   │   ├── schema.ts            # Drizzle schema (reference only, not used for queries)
│   │   │   ├── migrate.ts           # Raw SQL CREATE TABLE migrations
│   │   │   └── seed.ts              # Seed data script
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
