# Changelog

All notable changes to the Daycare Management System are documented in this file.

---

## [2.0.0] — February 2026

### Overview
Complete rebuild of HDMA v1.0 (Electron desktop app) as a self-hosted web application. Designed for multi-device access from desktops, tablets, and phones on a local network.

### Architecture
- **Frontend**: React 19 + MUI v6 + Vite 6 + TypeScript
- **Backend**: Express.js + better-sqlite3 + TypeScript
- **Database**: SQLite with raw SQL queries
- **Deployment**: TrueNAS Core VM (Ubuntu Server 24.04) with systemd service
- **Repository**: https://github.com/ikhan7548/DMS.git

### Features — Authentication & Users
- PIN-based login with bcryptjs hashing
- Session-based authentication (express-session, 24-hour cookies)
- Role-based access control: Admin, Provider, Staff, Substitute
- 22 granular permission features configurable per role
- Multiple simultaneous sessions from different devices
- Rate limiting on login endpoint

### Features — Dashboard
- Real-time headcount with capacity indicator
- Staff on duty count with name chips
- Virginia Point System ratio compliance (green/red)
- Children present list with check-in times
- Certification expiration alerts (30/90 day warnings)
- Past-due account alerts
- Quick action buttons (Check In, Add Child, Record Payment)
- Auto-refresh every 30 seconds
- Dark mode compatible stat cards

### Features — Children Module
- Child list with search and status filters (Active, Inactive, Withdrawn)
- 4-step enrollment wizard (Basic Info, Parent, Medical, Review)
- Child detail page with 6 tabs: Profile, Medical, Emergency Contacts, Authorized Pickups, Immunizations, Attendance
- Emergency contacts with priority ordering and pickup authorization
- Schedule types: Full Time, Part Time, After School, Before School, Drop In
- Fee tier assignment linking children to fee configurations
- Identity verification tracking
- Provider's own child and resident child flags

### Features — Parents Module
- Parent list with search
- Parent detail with linked children
- Parent-child relationship linking
- Employer and work schedule tracking

### Features — Staff Module
- Staff list with search and status filters
- Staff enrollment form with pay rate tracking
- Staff detail page with tabs: Profile, Certifications, Background Checks, Training, Timecards
- Virginia certification tracking: CPR, First Aid, MAT, Pre-Licensure, Annual Training
- Background check tracking: Child Abuse Registry, VA Criminal, FBI Fingerprint, Sex Offender
- Expiration alerts on dashboard
- Emergency contact for staff members
- TB screening and education tracking

### Features — Attendance
- Touch-optimized child check-in/check-out cards (tablet-friendly)
- Staff clock-in/clock-out with hours calculation
- Virginia Point System real-time compliance bar with age group breakdown
- Auto-refresh every 15 seconds
- Attendance history with date range filters
- Time correction with mandatory reason field
- Manual attendance record creation
- Delete attendance records

### Features — Billing
- Billing dashboard with clickable summary cards (Outstanding, Collected, Overdue, Pending)
- Fee configuration management (9 default tiers by age group and schedule)
- Invoice generation for billing periods
- Invoice detail with editable line items (add, edit, delete)
- Line item types: Tuition, Registration, Late Pickup, Late Payment, Supply, Credit, Other
- Split billing between parent and third-party payer
- Printable invoices with letterhead and footer (separate per split-billing payer)
- Payment recording with multiple methods: Cash, Check, Money Order, Credit Card, ACH, Zelle, Venmo, Subsidy, Other
- Custom payment methods management
- Family accounts with balance tracking
- Aging report: Current, 1-7, 8-14, 15-30, 30+ days past due
- Batch invoice generation

### Features — Reports (4 tabs)
- **Overview Tab**: Attendance summary with date range, type filter, entity filter, CSV/PDF export
- **Child Detail Tab**: Individual child attendance report with summary stats
- **Staff Detail Tab**: Individual staff attendance/hours report with summary stats
- **Financial Tab**: Revenue summary, clickable drill-down cards (Billed → invoices, Collected → payments, Outstanding → unpaid), monthly revenue trend, payroll summary table
- **Staff Payroll**: Hours breakdown, regular/overtime calculation, estimated pay
- CSV export for attendance, payroll, and financial data

### Features — Settings (8 tabs)
- **Facility Info**: App branding (title, abbreviation) + facility details (name, address, EIN, license, capacity, hours)
- **Users**: User CRUD, PIN reset, staff linking, role assignment
- **Billing & Invoices**: Due date config, letterhead upload with layout options, invoice footer (3 lines with preview), data retention period
- **Role Permissions**: 22-feature permission grid per role
- **Backup & Restore**: Data backup (db copy), full backup (zip archive), restore from file, backup history with download/delete, auto-backup scheduler (configurable interval)
- **Compliance**: Incident reports, medication logs, meal tracking with child attendance, drill logs, communication log
- **Appearance**: Color theme selection + dark mode toggle
- **Language**: English, Spanish, Urdu

### Features — PWA Support
- Web app manifest (manifest.json) for "Add to Home Screen"
- Properly sized icons with padding (192x192, 512x512) for maskable display
- Standalone display mode
- Branded as "Ducklings Daycare"

### Features — Dark Mode
- Full dark mode support via MUI theme
- Theme-aware backgrounds on all pages (Dashboard, Attendance, Billing, Reports, Settings, Aging Report, Invoice Detail)
- MUI token-based colors for automatic dark mode adaptation

### Features — Infrastructure
- Docker support (Dockerfile + docker-compose.yml)
- Systemd service for auto-start on VM boot
- Health check endpoint (GET /api/health)
- Morgan request logging
- CORS configuration for local network
- Error handling middleware with 404 handler
- SPA fallback for client-side routing in production

### Deployment
- TrueNAS Core VM: Ubuntu Server 24.04 at 10.0.0.70
- Systemd auto-start chain: TrueNAS → VM → daycare.service
- GitHub-based deployment workflow: push → pull on VM → build → restart

### Seed Data
- 6 user accounts (admin/1234, provider, staff1-3, substitute)
- 5 staff members with certifications and background checks
- 10 children across various ages and schedules
- 10 parents linked to children
- 9 fee configurations (by age group and schedule type)
- Facility settings configured for Virginia-based daycare
