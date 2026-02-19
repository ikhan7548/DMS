# Software Requirements Specification (SRS)

## Daycare Management System

**Version:** 2.0.0
**Last Updated:** February 2026
**Platform:** Web Application (Self-Hosted on TrueNAS)
**Target Environment:** Virginia Licensed Family Day Home

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [System Architecture](#3-system-architecture)
4. [Functional Requirements](#4-functional-requirements)
5. [Data Model](#5-data-model)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Security Requirements](#7-security-requirements)
8. [External Interfaces](#8-external-interfaces)
9. [Migration Notes](#9-migration-notes)

---

## 1. Introduction

### 1.1 Purpose

The Daycare Management System (DMS) is a comprehensive web application designed for managing the operations of a Virginia-licensed family day home. It is the successor to HDMA (Home Daycare Management Application), redesigned as a self-hosted web application running on TrueNAS to enable multi-device access from desktops, tablets, and phones on the local network.

### 1.2 Scope

The system manages the following core business domains:

- **Child Enrollment & Management** - Complete child records with medical, contact, and schedule information
- **Staff Management** - Staff profiles, certifications, background checks, and training records
- **Attendance Tracking** - Daily check-in/check-out for children and clock-in/clock-out for staff with Virginia Point System ratio compliance
- **Billing & Invoicing** - Fee configuration, invoice generation, payment recording, split billing, and aging reports
- **Reporting** - Attendance reports, financial reports, CSV and PDF export
- **Administrative Settings** - Facility configuration, user management, role-based permissions, backup/restore, appearance customization, and internationalization

### 1.3 Target Users & Devices

| Role | Device | Use Case |
|------|--------|----------|
| **Owner/Administrator** | Desktop (office) | Administrative work: invoicing, enrollment, staff management, reports |
| **Owner/Administrator** | Phone (mobile) | Quick check on dashboard, approve actions on the go |
| **Staff** | Tablet (daycare room) | Daily attendance check-in/check-out, meal logging |
| **Substitute** | Tablet (daycare room) | Attendance check-in/check-out only |

### 1.4 Key Difference from HDMA (v1.0)

| Aspect | HDMA v1.0 (Electron) | DMS v2.0 (Web) |
|--------|----------------------|-----------------|
| Platform | Windows desktop only | Any device with a web browser |
| Multi-user | Single user at a time | Multiple simultaneous users |
| Access | Must be at the computer | Any device on local network |
| Hosting | Runs on user's PC | Self-hosted on TrueNAS server |
| Database | SQLite (local file) | PostgreSQL or SQLite (server) |
| Installation | Windows installer | Docker container on TrueNAS |

### 1.5 Regulatory Context

The application is designed for compliance with Virginia Department of Social Services (VDSS) regulations for licensed family day homes, specifically:

- Virginia Point System for child-to-caregiver ratio compliance
- Staff certification tracking (CPR, First Aid, MAT, Pre-Licensure Orientation, Annual Training)
- Background check tracking (Child Abuse Registry, VA Criminal, FBI Fingerprint, Sex Offender)
- Licensed capacity management

---

## 2. Overall Description

### 2.1 Product Perspective

DMS is a self-hosted web application deployed as a Docker container on the user's TrueNAS server. The server runs 24/7 on the local network, making the application accessible from any device (desktop, tablet, phone) via a web browser without requiring internet access.

### 2.2 Product Functions Summary

| Module | Key Functions |
|--------|---------------|
| Dashboard | Real-time headcount, staff on duty, ratio compliance status, alerts, quick actions |
| Children | Enrollment, profiles, medical info, emergency contacts, authorized pickups, immunizations |
| Staff | Enrollment, profiles, certifications, background checks, training logs |
| Attendance | Child check-in/check-out, staff clock-in/clock-out, Virginia Point System, attendance history, time corrections |
| Billing | Fee configurations, invoice generation/management, payment recording, split billing, family accounts, aging reports |
| Reports | Attendance reports, financial reports, CSV export, PDF export |
| Settings | Facility info, app branding, user management, billing configuration, role permissions, backup/restore, appearance themes, language |

### 2.3 Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Material-UI (MUI) |
| State Management | Zustand |
| Routing | React Router v7 |
| Backend | Node.js with Express.js (or Fastify) |
| API Layer | RESTful API (or tRPC) |
| Database | PostgreSQL (recommended) or SQLite |
| ORM | Drizzle ORM |
| Authentication | Session-based with PIN + bcryptjs hashing |
| Internationalization | i18next, react-i18next |
| PDF Generation | jsPDF |
| Containerization | Docker |
| Hosting | TrueNAS (Docker/VM) |
| Build Tool | Vite |
| Version Control | Git, GitHub |

### 2.4 Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                    TrueNAS Server                    │
│                  (Local Network, 24/7)               │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │           Docker Container (DMS)              │  │
│  │                                               │  │
│  │  ┌─────────────┐    ┌──────────────────────┐  │  │
│  │  │  Frontend    │    │  Backend (API)       │  │  │
│  │  │  React SPA   │◄──►│  Node.js + Express   │  │  │
│  │  │  (Vite build)│    │  REST API endpoints  │  │  │
│  │  └─────────────┘    └──────────┬───────────┘  │  │
│  │                                │              │  │
│  │                     ┌──────────▼───────────┐  │  │
│  │                     │  PostgreSQL / SQLite  │  │  │
│  │                     │  (Data persistence)   │  │  │
│  │                     └──────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  Volume Mount: /data → TrueNAS dataset              │
│  (Database, backups, uploads persist across restarts)│
└───────────────┬─────────────────────────────────────┘
                │ Local Network (e.g., 192.168.1.x:3000)
    ┌───────────┼───────────────┐
    │           │               │
┌───▼───┐  ┌───▼───┐    ┌──────▼──────┐
│Desktop│  │Tablet │    │   Phone     │
│(Office)│ │(Daycare)│   │(Owner mobile)│
│Browser │  │Browser │   │  Browser    │
└────────┘  └────────┘   └─────────────┘
```

---

## 3. System Architecture

### 3.1 Architecture Overview

The application follows a standard client-server web architecture:

- **Frontend (Client)**: React Single Page Application (SPA) served as static files
- **Backend (Server)**: Node.js REST API handling business logic and database access
- **Database**: PostgreSQL (or SQLite) for data persistence
- **Container**: Docker for deployment on TrueNAS

### 3.2 API Design

The backend exposes RESTful API endpoints organized by module:

```
/api/auth          - Authentication (login, logout, session)
/api/children      - Child CRUD operations
/api/parents       - Parent CRUD operations
/api/staff         - Staff CRUD operations
/api/attendance    - Check-in/out, clock-in/out, history
/api/billing       - Invoices, payments, fees, family accounts
/api/reports       - Report generation, CSV/PDF export
/api/settings      - App configuration, backup/restore
```

### 3.3 Database Configuration

**PostgreSQL (Recommended):**
- Runs as a separate Docker container or TrueNAS plugin
- Connection via environment variables
- Supports concurrent multi-user access natively
- Better suited for web application workloads

**SQLite (Alternative):**
- Single file, simpler setup
- Stored on TrueNAS dataset volume mount
- WAL mode for concurrent read support
- Pragmas: foreign_keys ON, busy_timeout 5000ms, cache_size 20MB, synchronous NORMAL

### 3.4 Frontend Architecture

- **Routing**: React Router (BrowserRouter for web, not HashRouter)
- **State**: Zustand stores for auth, theme, branding, UI
- **API Calls**: Fetch/Axios to backend REST API (replaces Electron IPC)
- **Lazy Loading**: Code splitting for all page components
- **Responsive Design**: MUI breakpoints for desktop, tablet, and phone layouts

### 3.5 Real-Time Updates

For multi-user attendance tracking:
- **Polling**: Dashboard and Attendance pages poll the API at intervals (15-30 seconds)
- **Future Enhancement**: WebSocket or Server-Sent Events (SSE) for instant updates

---

## 4. Functional Requirements

### 4.1 Authentication & Authorization

#### FR-AUTH-001: PIN-Based Login
- Users authenticate with a username and numeric PIN
- PINs are hashed using bcryptjs before storage
- Minimum PIN length: 4 characters
- Failed login displays "Invalid username or PIN" error message

#### FR-AUTH-002: Session Management
- Server-side session management (express-session or JWT)
- Session persists across page navigation and browser refreshes
- Configurable session timeout (default: 8 hours for a daycare work day)
- Logout clears session on server and client
- Last login timestamp is recorded for each user
- Multiple simultaneous sessions supported (different devices)

#### FR-AUTH-003: Role-Based Access Control (RBAC)
- Five roles: `admin`, `provider`, `staff`, `substitute`, `parent`
- Admin and Provider roles have full access (wildcard `*` permission)
- Staff, Substitute, and Parent roles have configurable granular permissions
- Navigation items are filtered based on user permissions
- API routes are protected with middleware permission checks

#### FR-AUTH-004: Granular Permissions (22 Features)
Configurable permissions for non-admin roles:

| Feature Key | Description |
|-------------|-------------|
| `dashboard` | View dashboard |
| `children_view` | View child list and details |
| `children_contacts` | View/manage emergency contacts |
| `children_medical` | View/manage medical information |
| `children_edit` | Edit child records |
| `children_enroll` | Enroll new children |
| `staff_view` | View staff list and details |
| `staff_edit` | Edit staff records |
| `attendance_checkin` | Check in/out children |
| `attendance_checkout` | Check out children |
| `attendance_history` | View attendance history |
| `attendance_edit_times` | Edit attendance times (corrections) |
| `billing_view` | View billing information |
| `billing_manage` | Manage billing (invoices, payments) |
| `meals_view` | View meal logs |
| `meals_edit` | Edit meal logs |
| `reports_view` | View reports |
| `reports_export` | Export reports (CSV/PDF) |
| `settings_view` | View settings |
| `settings_edit` | Edit settings |
| `compliance_view` | View compliance records |
| `compliance_edit` | Edit compliance records |

### 4.2 Dashboard

#### FR-DASH-001: Real-Time Dashboard
- Auto-refreshes every 30 seconds via API polling
- Displays current date
- Responsive layout for desktop, tablet, and phone

#### FR-DASH-002: Headcount Card
- Shows number of currently checked-in children
- Shows current occupancy vs. licensed capacity (e.g., "8/12")

#### FR-DASH-003: Staff On Duty Card
- Shows count of currently clocked-in staff
- Lists names of clocked-in staff as chips

#### FR-DASH-004: Ratio Compliance Card
- Shows compliant/non-compliant status with color coding (green/red)
- Displays total points used per caregiver
- Shows caregivers needed vs. present

#### FR-DASH-005: Children Present List
- Lists all currently checked-in children with check-in times

#### FR-DASH-006: Alerts Panel
- **Certification Expiration Alerts**: Warns when staff certifications expire within 30 days (error) or later (warning)
- **Past Due Account Alerts**: Shows families with past-due balances and number of days overdue

#### FR-DASH-007: Quick Actions
- "Check In" button navigates to Attendance page
- "Add Child" button navigates to Child Enrollment form
- "Record Payment" button navigates to Payment form

### 4.3 Children Module

#### FR-CHILD-001: Child List
- Displays all enrolled children in a searchable list
- Search by name (first name, last name)
- Filter by status: Active, Inactive, Withdrawn, All
- Click on child name navigates to child detail page

#### FR-CHILD-002: Child Enrollment (Multi-Step Wizard)
The enrollment form is a 4-step wizard:

**Step 1 - Basic Info:**
- First Name (required)
- Last Name (required)
- Nickname (optional)
- Sex: Male, Female, Other (required)
- Date of Birth (required)
- Home Address (required)
- Enrollment Date (required, defaults to today)
- Expected Schedule: Full Time, Part Time, After School, Before School, Drop In (required)
- Scheduled Days (Mon-Fri checkboxes, shown for Part Time/After School/Before School)
- School Dismissal Time (shown for After School schedule)
- Fee Tier (optional, links to fee configuration)
- Days Per Week (auto-calculated from scheduled days)

**Step 2 - Parent/Guardian:**
- First Name, Last Name (required)
- Relationship: Mother, Father, Guardian, Grandparent, Other
- Phone (required)
- Email (optional)
- Home Address (optional)
- Employer (optional)
- Primary parent flag
- Emergency contact flag

**Step 3 - Medical Info:**
- Physician Name, Physician Phone
- Medical Insurance
- Allergies
- Dietary Restrictions
- Special Needs flag (toggle)
- Emergency Medical Authorization (toggle)
- Medication Administration Consent (toggle)
- Notes (free text)

**Step 4 - Review:**
- Summary of all entered information before submission
- Highlights allergies as warnings

#### FR-CHILD-003: Child Detail Page
Tabbed interface with the following tabs:

- **Profile**: Child information with edit capability
- **Medical Info**: Physician, allergies, dietary restrictions, insurance
- **Emergency Contacts**: List with add/edit/delete functionality
  - Fields: Name, Relationship, Phone, Priority Order, Authorized Pickup flag
- **Authorized Pickups**: Separate list of authorized pickup persons
  - Fields: Name, Relationship, Phone
- **Immunizations**: Immunization record management
  - Fields: Immunization type, Date administered, Provider
- **Attendance History**: Historical attendance records for the specific child

#### FR-CHILD-004: Edit Child
- Edit form pre-populated with current data
- All enrollment fields are editable
- Schedule type changes dynamically show/hide related fields

#### FR-CHILD-005: Additional Child Data Fields
- `is_provider_own_child` - Indicates if child is the provider's own child
- `is_resident_child` - Indicates if child resides at the daycare address
- `identity_verified` - Identity verification flag
- `identity_verified_date` - Date identity was verified
- `identity_verified_by` - Who verified identity
- `rate_tier_id` - Link to fee configuration for billing

### 4.4 Staff Module

#### FR-STAFF-001: Staff List
- Displays all staff members in a searchable list
- Search by name
- Filter by status: Active, Inactive, All

#### FR-STAFF-002: Staff Enrollment Form
Required fields:
- First Name, Last Name
- Date of Birth
- Home Address
- Phone
- Hire Date
- Position: Provider, Assistant, Substitute

Optional fields:
- Email
- Hourly Rate, Overtime Rate, Pay Frequency
- Emergency Contact Name, Phone, Relationship
- High School Diploma (boolean)
- TB Screening Date, TB Screening Result

#### FR-STAFF-003: Staff Detail Page
Tabbed interface:

- **Profile**: Staff information with edit capability
- **Certifications**: Certification record management
  - Certification Types: CPR, First Aid, MAT (Medication Administration Training), Pre-Licensure Orientation, Annual Training
  - Fields: Cert Name, Issue Date, Expiry Date, Training Hours, Sponsoring Organization
  - Visual indicators for expiring/expired certifications
- **Background Checks**: Background check record management
  - Check Types: Child Abuse Registry, VA Criminal, FBI Fingerprint, Sex Offender Registry
  - Fields: Check Date, Expiry Date, Result (pass/fail/pending), Notes
- **Training Log**: Training record history
- **Timecards**: Staff time clock history and hours summary

#### FR-STAFF-004: Edit Staff
- Edit form pre-populated with current data
- All enrollment fields are editable

### 4.5 Attendance Module

#### FR-ATT-001: Today's Attendance View
- Split view: Children Check-In (left, wider) and Staff Clock (right, narrower)
- Auto-refreshes every 15 seconds via API polling
- Shows count of checked-in children and clocked-in staff
- Touch-optimized for tablet use

#### FR-ATT-002: Child Check-In/Check-Out
- Grid of child cards showing all active children
- Card-based toggle: tap/click to check in, tap/click again to check out
- Visual states:
  - Not checked in: gray background
  - Checked in: green background with check-in time displayed
- Displays child's nickname (if available) or first name
- Records date and timestamp automatically (server-side)

#### FR-ATT-003: Staff Clock-In/Clock-Out
- List of active staff members with clock in/out buttons
- Visual states:
  - Not clocked in: neutral background
  - Clocked in: blue background with clock-in time displayed
- Shows staff position alongside name
- Records date and timestamp automatically (server-side)

#### FR-ATT-004: Virginia Point System
Real-time ratio compliance calculation based on Virginia regulations:

| Age Group | Age Range | Points Per Child |
|-----------|-----------|-----------------|
| Infant | Birth - 15 months | 4 |
| Young Toddler | 16 - 23 months | 3 |
| Toddler/Preschool | 2 - 4 years | 2 |
| School Age | 5 - 9 years | 1 |
| Older School Age | 10+ years | 0 |

- Maximum 16 points per caregiver
- Caregivers needed = ceil(totalPoints / 16)
- Compliance status bar shows:
  - Total points
  - Caregivers needed vs. present
  - Breakdown by age group (count and points per group)
  - Green/red visual indicator for compliant/non-compliant
- Substitute annual hour limit tracking: 240 hours per year

#### FR-ATT-005: Attendance History
- Date range filter (start date, end date)
- Filter by type: All, Children, Staff
- Results table: Date, Name, Type (Child/Staff), Check-in/Clock-in, Check-out/Clock-out, Total Hours
- Records count displayed

#### FR-ATT-006: Time Correction
- Edit button on each attendance record opens time correction dialog
- Editable fields: Check-in time, Check-out time
- Reason field required for all corrections
- Validation: Reason cannot be blank
- Success/error feedback messages

### 4.6 Billing Module

#### FR-BILL-001: Billing Dashboard
Summary cards (clickable, navigate to filtered views):
- **Total Outstanding**: Sum of all unpaid invoice balances
- **Collected This Month**: Total payments received in the current month
- **Overdue Accounts**: Count of invoices past due date
- **Pending Invoices**: Count of draft/issued invoices

Quick Actions:
- Fee Configuration
- Invoices
- Record Payment
- Family Accounts
- Aging Report

Lists:
- Recent Payments (family name, date, method, amount)
- Past Due Accounts (family name, days overdue, amount)

#### FR-BILL-002: Fee Configuration
- CRUD operations for fee schedules
- Fields:
  - Name/Description
  - Age Group (infant, toddler, preschool, school_age)
  - Schedule Type (full_time, part_time, drop_in, after_school, before_school)
  - Weekly Rate, Daily Rate, Hourly Rate
  - Registration Fee
  - Late Pickup Fee (per minute)
  - Late Payment Fee
  - Sibling Discount Percentage
  - Effective Date
  - Active/Inactive status

#### FR-BILL-003: Invoice Generation
- Select billing period (start date to end date)
- Auto-generates invoices for enrolled children based on fee configurations
- Generated invoices start in "Draft" or "Issued" status
- Auto-generated invoice number

#### FR-BILL-004: Invoice List
- View all invoices with filtering by status
- Status types: Draft, Issued, Partially Paid, Paid, Overdue, Void
- Click to view invoice detail

#### FR-BILL-005: Invoice Detail Page
- **Header**: Invoice number, family name, issue date, due date, billing period, balance due
- **Line Items Table**: Description, Fee Type, Quantity, Unit Price, Total per item
  - Inline editing of line items (description, quantity, unit price)
  - Add new line item (description, fee type, unit price, quantity)
  - Delete line item with confirmation dialog
  - Fee Types: Tuition, Registration, Late Pickup, Late Payment, Supply, Credit, Other
  - Auto-recalculates totals on changes
- **Summary**: Total Amount, Amount Paid, Balance Due
- **Payments Applied**: List of payments applied to this invoice
- **Split Billing**: Toggle to enable split billing
  - Parent pays percentage (0-100%)
  - Third-party payer name and address
  - Shows parent portion and third-party portion amounts
  - Save/clear split billing
- **Print**: Renders printable invoice with optional letterhead and footer
  - When split billing is enabled, generates separate printable invoices for parent and third-party payer
- **Actions**: Record Payment, Print, Void Invoice

#### FR-BILL-006: Payment Recording
- Select family from dropdown
- Enter payment amount
- Select payment method: Cash, Check, Money Order, Credit Card, ACH, Zelle, Venmo, Subsidy, Other
- Enter reference number (optional)
- Enter notes (optional)
- Payment can be applied to a specific invoice
- Success/error feedback

#### FR-BILL-007: Family Accounts
- List of all families with current balances
- Family detail view with current balance, enrolled children, and transaction history

#### FR-BILL-008: Aging Report
- Groups outstanding accounts by age: Current, 1-7 days, 8-14 days, 15-30 days, 30+ days past due

#### FR-BILL-009: Invoice Settings (in Settings)
- Due date configuration (upon receipt or N days after)
- Invoice letterhead (layout selection + image upload)
- Invoice footer (3 customizable lines with preview)

#### FR-BILL-010: Printable Invoice
- Uses browser print functionality
- Includes letterhead image with selected layout
- Shows invoice header, line items, totals, footer
- Split billing generates separate invoices per payer

### 4.7 Reports Module

#### FR-RPT-001: Attendance Reports
- Date range filter (defaults to last 30 days)
- Filter by type (All, Children, Staff) and specific entity
- Results table: Date, Name, Type, Check-in, Check-out, Total Hours
- Record count display

#### FR-RPT-002: Financial Reports
- Date range and family filter
- Summary: Total Revenue, Total Payments, Total Outstanding

#### FR-RPT-003: CSV Export
- Exports report data to CSV file (server generates, browser downloads)

#### FR-RPT-004: PDF Export
- Exports report data to formatted PDF with headers, tables, page numbers

### 4.8 Settings Module

#### FR-SET-001: Facility Information
- App branding (title, abbreviation)
- Facility details (name, address, phone, email, EIN, license, capacity, hours, fiscal year)

#### FR-SET-002: User Management
- User CRUD: username, display name, PIN, role, staff link, active status
- PIN reset capability

#### FR-SET-003: Billing & Invoices Configuration
- Invoice due date settings
- Letterhead layout and image upload
- Invoice footer lines
- Data retention period

#### FR-SET-004: Role Permissions
- Per-role toggle for each of 22 features
- Admin/Provider always have full access

#### FR-SET-005: Backup & Restore
- **Data Backup**: Database dump to file on server
- **Application Backup**: Full backup as downloadable archive
- **Restore**: Upload backup file to restore
- **Backup History**: List with download, restore, delete actions
- **Automated Backups**: Scheduled daily backup (new for web version)

#### FR-SET-006: Appearance
- Multiple color themes with instant application

#### FR-SET-007: Language
- English, Spanish, Urdu

### 4.9 Navigation

#### FR-NAV-001: Responsive Sidebar
- Desktop: Permanent sidebar with icons and labels
- Tablet: Collapsible sidebar, toggle with hamburger menu
- Phone: Drawer-style sidebar, slides in from left
- Navigation items filtered by user permissions
- Active page highlighted

#### FR-NAV-002: Header
- App name and branding
- Current user display name
- Sidebar toggle button
- Logout button

### 4.10 Data Archival & Retention

- Records archival to dedicated archive table
- Configurable retention period (30-3650 days)
- Automatic cleanup of expired archives
- CSV export of archived data

### 4.11 Audit Logging

- System records audit logs for significant operations
- Includes: action type, entity type, entity ID, user ID, timestamp, details

---

## 5. Data Model

### 5.1 Database Tables (31 Tables)

The data model is carried forward from HDMA v1.0 with the same 31 tables.

#### Core Entity Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `users` | Application user accounts | username, pin_hash, display_name, role, staff_id, language, is_active, last_login |
| `children` | Enrolled children records | first_name, last_name, nickname, sex, date_of_birth, home_address, enrollment_date, expected_schedule, days_per_week, scheduled_days, school_dismissal_time, status, physician info, allergies, dietary_restrictions, special_needs, medical consents, identity_verified fields, rate_tier_id, notes |
| `parents` | Parent/guardian records | first_name, last_name, relationship, home_address, phone_cell, phone_home, email, employer info, work_schedule, is_primary |
| `staff` | Staff member records | first_name, last_name, date_of_birth, home_address, phone, email, hire_date, position, hourly_rate, overtime_rate, pay_frequency, status, emergency contact fields, tb_screening fields, high_school_diploma |

#### Relationship Tables

| Table | Description |
|-------|-------------|
| `child_parent` | Links children to parents (M:N) |
| `emergency_contacts` | Emergency contacts per child |
| `authorized_pickups` | Authorized pickup persons per child |

#### Attendance Tables

| Table | Description |
|-------|-------------|
| `attendance_child` | Child daily attendance records |
| `attendance_staff` | Staff daily time clock records |

#### Billing Tables

| Table | Description |
|-------|-------------|
| `invoices` | Invoice records with split billing support |
| `invoice_line_items` | Individual charges on invoices |
| `payments` | Payment records |
| `fee_configurations` | Fee schedule definitions |
| `payment_methods` | Available payment methods |

#### Staff Records Tables

| Table | Description |
|-------|-------------|
| `staff_certifications` | Staff certification records |
| `background_checks` | Staff background check records |

#### Health & Safety Tables

| Table | Description |
|-------|-------------|
| `immunizations` | Child immunization records |
| `medication_logs` | Medication administration records |
| `incident_reports` | Incident/accident reports |
| `compliance_docs` | Compliance document tracking |
| `drill_logs` | Safety drill records |

#### Meal Tracking Tables

| Table | Description |
|-------|-------------|
| `meal_logs` | Meal service records |
| `meal_log_children` | Children present for meals |

#### Financial Tables

| Table | Description |
|-------|-------------|
| `payroll` | Staff payroll records |

#### System Tables

| Table | Description |
|-------|-------------|
| `settings` | Key-value configuration store |
| `role_permissions` | Granular role-based permissions |
| `audit_log` | System audit trail |
| `communication_log` | Parent communication records |
| `archived_records` | Archived/soft-deleted records |

### 5.2 Entity Relationships

```
users ─────────── staff (optional staff_id link)
children ──┬── child_parent ── parents
           ├── emergency_contacts
           ├── authorized_pickups
           ├── immunizations
           ├── attendance_child
           ├── medication_logs
           ├── incident_reports
           └── meal_log_children ── meal_logs
staff ─────┬── attendance_staff
           ├── staff_certifications
           ├── background_checks
           └── payroll
parents ───┬── invoices (family_id)
           └── payments (family_id)
invoices ──┬── invoice_line_items
           └── payments (invoice_id)
fee_configurations ── children (rate_tier_id)
```

---

## 6. Non-Functional Requirements

### 6.1 Performance

- **NFR-PERF-001**: Dashboard loads within 3 seconds on local network
- **NFR-PERF-002**: Attendance page refreshes every 15 seconds without UI lag
- **NFR-PERF-003**: API response time under 500ms for standard queries
- **NFR-PERF-004**: Support 5+ simultaneous users without degradation
- **NFR-PERF-005**: Pages are lazy-loaded with code splitting

### 6.2 Usability

- **NFR-USE-001**: Touch-friendly interface for tablet use (large check-in/check-out cards)
- **NFR-USE-002**: Color-coded compliance indicators (green = compliant, red = non-compliant)
- **NFR-USE-003**: Fully responsive layout (desktop, tablet, phone breakpoints)
- **NFR-USE-004**: Multi-language support (English, Spanish, Urdu)
- **NFR-USE-005**: Multiple color themes
- **NFR-USE-006**: Works in any modern browser (Chrome, Firefox, Safari, Edge)

### 6.3 Reliability

- **NFR-REL-001**: TrueNAS server provides 24/7 availability
- **NFR-REL-002**: Automated daily database backups
- **NFR-REL-003**: Docker container auto-restarts on failure
- **NFR-REL-004**: Foreign key enforcement ensures data integrity
- **NFR-REL-005**: Server-side validation prevents invalid data

### 6.4 Scalability

- **NFR-SCALE-001**: PostgreSQL handles concurrent multi-user access
- **NFR-SCALE-002**: Stateless API design supports horizontal scaling if needed
- **NFR-SCALE-003**: Static frontend assets served efficiently

### 6.5 Portability

- **NFR-PORT-001**: Docker container runs on any TrueNAS system (Core or Scale)
- **NFR-PORT-002**: Accessible from any device with a modern web browser
- **NFR-PORT-003**: Database backup is a standard dump file, easily transferable

### 6.6 Maintainability

- **NFR-MAIN-001**: TypeScript provides type safety across frontend and backend
- **NFR-MAIN-002**: Drizzle ORM manages database schema and migrations
- **NFR-MAIN-003**: Docker-based deployment simplifies updates
- **NFR-MAIN-004**: Environment variables for all configuration
- **NFR-MAIN-005**: i18n externalized strings for easy translation

---

## 7. Security Requirements

### 7.1 Authentication Security
- **SR-001**: PINs are hashed using bcryptjs (never stored in plaintext)
- **SR-002**: Minimum PIN length of 4 characters
- **SR-003**: Generic error messages prevent username enumeration
- **SR-004**: Session tokens are HTTP-only, secure cookies
- **SR-005**: Configurable session expiry

### 7.2 Network Security
- **SR-006**: Application accessible only on local network (no internet exposure required)
- **SR-007**: Optional HTTPS with self-signed certificate for local network encryption
- **SR-008**: CORS configured to allow only local network origins

### 7.3 API Security
- **SR-009**: All API routes require authentication (except login)
- **SR-010**: Permission middleware validates role-based access on every request
- **SR-011**: Input validation and sanitization on all API endpoints
- **SR-012**: Rate limiting on login endpoint to prevent brute force

### 7.4 Data Security
- **SR-013**: Database stored on TrueNAS dataset with filesystem-level permissions
- **SR-014**: Backup files stored on TrueNAS with restricted access
- **SR-015**: No sensitive data in URL parameters

---

## 8. External Interfaces

### 8.1 REST API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Authenticate user |
| POST | `/api/auth/logout` | End session |
| GET | `/api/auth/session` | Get current session |
| GET | `/api/children` | List children (query params for filtering) |
| POST | `/api/children` | Create child |
| GET | `/api/children/:id` | Get child details |
| PUT | `/api/children/:id` | Update child |
| DELETE | `/api/children/:id` | Delete/archive child |
| GET | `/api/parents` | List parents |
| POST | `/api/parents` | Create parent |
| POST | `/api/parents/:id/link/:childId` | Link parent to child |
| GET | `/api/staff` | List staff |
| POST | `/api/staff` | Create staff |
| GET | `/api/staff/:id` | Get staff details |
| PUT | `/api/staff/:id` | Update staff |
| POST | `/api/attendance/children/checkin` | Check in child |
| POST | `/api/attendance/children/checkout` | Check out child |
| POST | `/api/attendance/staff/clockin` | Clock in staff |
| POST | `/api/attendance/staff/clockout` | Clock out staff |
| GET | `/api/attendance/today` | Get today's attendance |
| GET | `/api/attendance/points` | Get point system status |
| GET | `/api/attendance/history` | Get attendance history |
| GET | `/api/billing/summary` | Get billing dashboard data |
| POST | `/api/billing/invoices/generate` | Generate invoices |
| GET | `/api/billing/invoices` | List invoices |
| GET | `/api/billing/invoices/:id` | Get invoice details |
| PUT | `/api/billing/invoices/:id/void` | Void invoice |
| POST | `/api/billing/payments` | Record payment |
| GET | `/api/billing/fees` | List fee configurations |
| POST | `/api/billing/fees` | Create fee configuration |
| GET | `/api/billing/aging` | Get aging report |
| GET | `/api/reports/dashboard` | Get dashboard data |
| GET | `/api/reports/attendance` | Generate attendance report |
| GET | `/api/reports/financial` | Generate financial report |
| GET | `/api/reports/export/csv` | Export CSV |
| GET | `/api/reports/export/pdf` | Export PDF |
| GET | `/api/settings` | Get all settings |
| PUT | `/api/settings` | Update settings |
| GET | `/api/settings/users` | List users |
| POST | `/api/settings/users` | Create user |
| POST | `/api/settings/backup` | Create backup |
| POST | `/api/settings/restore` | Restore from backup |

### 8.2 Docker Configuration

```yaml
# docker-compose.yml
version: '3.8'
services:
  dms-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://dms:password@db:5432/daycare
      - SESSION_SECRET=<random-secret>
      - NODE_ENV=production
    volumes:
      - dms-data:/app/data
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=daycare
      - POSTGRES_USER=dms
      - POSTGRES_PASSWORD=<secure-password>
    volumes:
      - db-data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  dms-data:
  db-data:
```

### 8.3 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `SESSION_SECRET` | Secret for session encryption | Required |
| `PORT` | HTTP server port | `3000` |
| `NODE_ENV` | Environment mode | `production` |
| `BACKUP_DIR` | Directory for backup files | `/app/data/backups` |
| `LOG_LEVEL` | Logging verbosity | `info` |

---

## 9. Migration Notes

### 9.1 Migrating from HDMA v1.0

The following changes are needed to convert the existing Electron app to a web app:

| Component | HDMA v1.0 (Electron) | DMS v2.0 (Web) |
|-----------|---------------------|----------------|
| IPC Communication | Electron IPC channels | REST API calls (fetch/axios) |
| Database Access | Direct better-sqlite3 in main process | Server-side via API + ORM |
| Routing | HashRouter | BrowserRouter |
| File Dialogs | Electron dialog.showSaveDialog | Browser download / file input |
| Session Storage | In-memory (main process) | Server-side sessions (express-session) |
| Window Management | Electron BrowserWindow | Standard browser window |
| Native Modules | better-sqlite3 (native) | pg (PostgreSQL driver, pure JS) |
| Build/Package | electron-builder → NSIS installer | Docker image |
| Auto-Update | Not implemented | Docker image pull |

### 9.2 Code Reuse Strategy

The following code can be directly reused:
- **All React components** (pages, forms, lists, dialogs) - only API call layer changes
- **Zustand stores** (auth, theme, branding, UI) - minimal changes
- **i18n translations** (en.json, es.json, ur.json) - no changes
- **Drizzle ORM schema** - same tables, adapt for PostgreSQL types
- **Business logic services** - move to Express route handlers
- **Constants** (Virginia points, roles, billing) - no changes
- **MUI theme configurations** - no changes

### 9.3 What Needs to Be Built New

- Express.js (or Fastify) backend with REST API routes
- Authentication middleware (session-based)
- Permission middleware for API routes
- Docker configuration (Dockerfile, docker-compose.yml)
- Server-side file handling (backup/restore, image upload, CSV/PDF generation)
- CORS configuration
- Environment variable management

---

## Appendix A: Seed Data Summary

For testing and demonstration, the application includes seed data:

| Entity | Count | Notes |
|--------|-------|-------|
| Children | 25 | Across 10 families, various ages and schedules |
| Parents | 17 | Single and two-parent families |
| Staff | 10 | 1 provider, 6 assistants, 2 substitutes, 1 inactive |
| Emergency Contacts | Multiple | Linked to seeded children |
| Staff Certifications | Multiple | CPR, First Aid, MAT for active staff |
| Background Checks | Multiple | Various types for active staff |
| Fee Configurations | 9 | Infant/Toddler/Preschool/School-Age, Full/Part-Time/Drop-In |
| Invoices | 7 | With line items in various statuses |
| Payments | 5 | Various payment methods |
| User Accounts | 6 | admin, provider, staff, substitute users |
| Facility Settings | Full | Virginia-based daycare configuration |
