# API Reference

## Daycare Management System

**Base URL**: `http://10.0.0.70:3001/api` (production) or `http://localhost:3001/api` (development)

**Authentication**: All endpoints except `POST /api/auth/login` require a valid session cookie. The server uses `express-session` with HTTP-only cookies.

**Content-Type**: `application/json` for all request/response bodies unless noted otherwise.

---

## Table of Contents

1. [Authentication](#1-authentication-apiauthroutes)
2. [Children](#2-children-apichildren)
3. [Parents](#3-parents-apiparents)
4. [Staff](#4-staff-apistaff)
5. [Attendance](#5-attendance-apiattendance)
6. [Billing](#6-billing-apibilling)
7. [Reports](#7-reports-apireports)
8. [Settings](#8-settings-apisettings)
9. [Health Check](#9-health-check)

---

## 1. Authentication (`/api/auth`) {#1-authentication-apiauthroutes}

**File**: `server/src/routes/auth.routes.ts`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Authenticate with username and PIN |
| POST | `/api/auth/logout` | Yes | Destroy session and clear cookie |
| GET | `/api/auth/session` | Yes | Get current authenticated user info |

### POST `/api/auth/login`

**Body**:
```json
{ "username": "admin", "pin": "1234" }
```

**Success (200)**:
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "display_name": "Administrator",
    "role": "admin",
    "language": "en",
    "permissions": ["*"]
  }
}
```

**Error (401)**: `{ "error": "Invalid username or PIN" }`

---

## 2. Children (`/api/children`)

**File**: `server/src/routes/children.routes.ts`
**Auth**: All endpoints require authentication.

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/children` | `children_view` | List children with optional filters |
| GET | `/api/children/:id` | `children_view` | Get child with parents, contacts, pickups, immunizations |
| POST | `/api/children` | `children_enroll` | Create new child record |
| PUT | `/api/children/:id` | `children_edit` | Update child information |
| DELETE | `/api/children/:id` | `children_edit` | Archive child (set status to 'withdrawn') |

### Emergency Contacts

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/children/:id/emergency-contacts` | `children_contacts` | List emergency contacts |
| POST | `/api/children/:id/emergency-contacts` | `children_contacts` | Add emergency contact |
| PUT | `/api/children/:childId/emergency-contacts/:id` | `children_contacts` | Update emergency contact |
| DELETE | `/api/children/:childId/emergency-contacts/:id` | `children_contacts` | Delete emergency contact |

### Authorized Pickups

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/children/:id/authorized-pickups` | `children_contacts` | List authorized pickups |
| POST | `/api/children/:id/authorized-pickups` | `children_contacts` | Add authorized pickup |
| PUT | `/api/children/:childId/authorized-pickups/:id` | `children_contacts` | Update authorized pickup |
| DELETE | `/api/children/:childId/authorized-pickups/:id` | `children_contacts` | Delete authorized pickup |

### Immunizations

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/children/:id/immunizations` | `children_medical` | List immunization records |
| POST | `/api/children/:id/immunizations` | `children_medical` | Add immunization record |
| PUT | `/api/children/:childId/immunizations/:id` | `children_medical` | Update immunization record |
| DELETE | `/api/children/:childId/immunizations/:id` | `children_medical` | Delete immunization record |

### Query Parameters (GET `/api/children`)

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter: `active`, `inactive`, `withdrawn`, `all` |
| `search` | string | Search by first/last name |

---

## 3. Parents (`/api/parents`)

**File**: `server/src/routes/parents.routes.ts`

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/parents` | `children_view` | List all parents |
| GET | `/api/parents/:id` | `children_view` | Get parent with linked children |
| POST | `/api/parents` | `children_enroll` | Create new parent |
| PUT | `/api/parents/:id` | `children_edit` | Update parent info |
| POST | `/api/parents/:id/link/:childId` | `children_edit` | Link parent to child |
| DELETE | `/api/parents/:id` | `children_edit` | Delete parent and unlink from children |

---

## 4. Staff (`/api/staff`)

**File**: `server/src/routes/staff.routes.ts`

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/staff` | `staff_view` | List staff with optional filters |
| GET | `/api/staff/:id` | `staff_view` | Get staff with certifications and background checks |
| POST | `/api/staff` | `staff_edit` | Create new staff member |
| PUT | `/api/staff/:id` | `staff_edit` | Update staff info |

### Certifications

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/staff/:id/certifications` | `staff_view` | List certifications |
| POST | `/api/staff/:id/certifications` | `staff_edit` | Add certification |
| PUT | `/api/staff/:staffId/certifications/:id` | `staff_edit` | Update certification |
| DELETE | `/api/staff/:staffId/certifications/:id` | `staff_edit` | Delete certification |

### Background Checks

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/staff/:id/background-checks` | `staff_view` | List background checks |
| POST | `/api/staff/:id/background-checks` | `staff_edit` | Add background check |
| PUT | `/api/staff/:staffId/background-checks/:id` | `staff_edit` | Update background check |
| DELETE | `/api/staff/:staffId/background-checks/:id` | `staff_edit` | Delete background check |

### Query Parameters (GET `/api/staff`)

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter: `active`, `inactive`, `all` |
| `search` | string | Search by first/last name |

---

## 5. Attendance (`/api/attendance`)

**File**: `server/src/routes/attendance.routes.ts`

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/attendance/today/children` | `attendance_checkin` | Today's children with check-in status |
| GET | `/api/attendance/today/staff` | `attendance_checkin` | Today's staff with clock-in status |
| POST | `/api/attendance/children/checkin` | `attendance_checkin` | Check in a child |
| POST | `/api/attendance/children/:id/checkout` | `attendance_checkout` | Check out a child |
| POST | `/api/attendance/staff/clockin` | `attendance_checkin` | Clock in a staff member |
| POST | `/api/attendance/staff/:id/clockout` | `attendance_checkout` | Clock out a staff member |
| GET | `/api/attendance/points` | `attendance_checkin` | Virginia Point System status |
| GET | `/api/attendance/history` | `attendance_history` | Historical attendance records |
| POST | `/api/attendance/history` | `attendance_edit_times` | Manually add attendance record |
| PUT | `/api/attendance/:id/correct` | `attendance_edit_times` | Correct attendance times |
| DELETE | `/api/attendance/:id` | `attendance_edit_times` | Delete attendance record |

### POST `/api/attendance/children/checkin`

**Body**: `{ "childId": 1 }`

### POST `/api/attendance/children/:id/checkout`

No body required. Uses URL param `:id`.

### PUT `/api/attendance/:id/correct`

**Body**:
```json
{
  "type": "child",
  "check_in_time": "08:30",
  "check_out_time": "17:00",
  "reason": "Parent reported incorrect check-in time"
}
```

### Query Parameters (GET `/api/attendance/history`)

| Param | Type | Description |
|-------|------|-------------|
| `startDate` | string (YYYY-MM-DD) | Start of date range |
| `endDate` | string (YYYY-MM-DD) | End of date range |
| `type` | string | `all`, `child`, `staff` |

---

## 6. Billing (`/api/billing`)

**File**: `server/src/routes/billing.routes.ts`

### Fee Configurations

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/billing/fees` | `billing_view` | Get active fee configurations |
| GET | `/api/billing/fees/all` | `billing_view` | Get all fee configurations |
| POST | `/api/billing/fees` | `billing_manage` | Create fee configuration |
| PUT | `/api/billing/fees/:id` | `billing_manage` | Update fee configuration |
| DELETE | `/api/billing/fees/:id` | `billing_manage` | Delete fee configuration |

### Invoices

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/billing/invoices` | `billing_view` | List invoices with filters |
| GET | `/api/billing/invoices/:id` | `billing_view` | Get invoice with line items and payments |
| POST | `/api/billing/invoices` | `billing_manage` | Create invoice with line items |
| PUT | `/api/billing/invoices/:id` | `billing_manage` | Update invoice |
| POST | `/api/billing/invoices/:id/void` | `billing_manage` | Void an invoice |
| PUT | `/api/billing/invoices/:id/split-billing` | `billing_manage` | Configure split billing |
| POST | `/api/billing/invoices/:id/line-items` | `billing_manage` | Add line item |
| PUT | `/api/billing/invoices/:invoiceId/line-items/:id` | `billing_manage` | Update line item |
| DELETE | `/api/billing/invoices/:invoiceId/line-items/:id` | `billing_manage` | Delete line item |

### Payments

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| POST | `/api/billing/payments` | `billing_manage` | Record payment |
| GET | `/api/billing/payments` | `billing_view` | List payments with filters |

### Family Accounts & Reports

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/billing/family/:parentId` | `billing_view` | Family account summary |
| GET | `/api/billing/families` | `billing_view` | List all families with balances |
| GET | `/api/billing/aging` | `billing_view` | Aging report |
| POST | `/api/billing/generate` | `billing_manage` | Generate batch invoices |

### Payment Methods

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/billing/payment-methods` | `billing_view` | Get active payment methods |
| GET | `/api/billing/payment-methods/all` | `billing_view` | Get all payment methods |
| POST | `/api/billing/payment-methods` | `billing_manage` | Create payment method |
| PUT | `/api/billing/payment-methods/:id` | `billing_manage` | Update payment method |

### Query Parameters (GET `/api/billing/invoices`)

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | `draft`, `issued`, `partially_paid`, `paid`, `overdue`, `void` |
| `startDate` | string | Start of billing period |
| `endDate` | string | End of billing period |
| `familyId` | number | Filter by family/parent ID |

---

## 7. Reports (`/api/reports`)

**File**: `server/src/routes/reports.routes.ts`

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/reports/dashboard` | `dashboard` | Dashboard aggregated data |
| GET | `/api/reports/attendance` | `reports_view` | Attendance report (daily/summary/detail) |
| GET | `/api/reports/financial` | `reports_view` | Financial summary |
| GET | `/api/reports/financial/invoices` | `reports_view` | Invoices filtered by status |
| GET | `/api/reports/financial/payments` | `reports_view` | Payments for date range |
| GET | `/api/reports/payroll` | `reports_view` | Staff payroll summary |
| GET | `/api/reports/payroll/detail` | `reports_view` | Daily payroll for specific staff |
| GET | `/api/reports/compliance` | `compliance_view` | Compliance report |
| GET | `/api/reports/export/attendance` | `reports_export` | Export attendance as CSV |
| GET | `/api/reports/export/payroll` | `reports_export` | Export payroll as CSV |
| GET | `/api/reports/export/financial` | `reports_export` | Export financial data as CSV |

### GET `/api/reports/dashboard` Response

```json
{
  "children": { "checkedIn": 8, "total": 10, "capacity": 12, "present": [...] },
  "staff": { "clockedIn": 3, "total": 5, "present": [...] },
  "compliance": { "totalPoints": 14, "caregiversNeeded": 1, "caregiversPresent": 3, "isCompliant": true },
  "billing": { "totalOutstanding": 1500, "pastDueAccounts": [...] },
  "expirations": { "certifications": [...], "backgroundChecks": [...] }
}
```

### Query Parameters (GET `/api/reports/financial/invoices`)

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | `billed`, `collected`, `outstanding`, `paid`, `pending` |
| `startDate` | string | Period start |
| `endDate` | string | Period end |

---

## 8. Settings (`/api/settings`)

**File**: `server/src/routes/settings.routes.ts`

### General Settings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/settings` | Yes | Get all facility settings |
| PUT | `/api/settings` | Admin | Update settings (batch key-value) |

### User Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/settings/users` | Admin | List all users |
| POST | `/api/settings/users` | Admin | Create user |
| PUT | `/api/settings/users/:id` | Admin | Update user |
| PUT | `/api/settings/users/:id/pin` | Admin | Reset user PIN |

### Permissions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/settings/permissions` | Admin | Get role permissions |
| PUT | `/api/settings/permissions` | Admin | Update role permissions |

### Backup & Restore

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/settings/backup` | Admin | Create data backup (.db) |
| POST | `/api/settings/backup/full` | Admin | Create full backup (.zip) |
| POST | `/api/settings/backup/download-zip` | Admin | Wrap backup in zip for download |
| GET | `/api/settings/backups` | Admin | List all backups |
| GET | `/api/settings/backups/:name/download` | Admin | Download backup file |
| DELETE | `/api/settings/backups/:name` | Admin | Delete backup |

### Auto-Backup

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/settings/auto-backup` | Admin | Get auto-backup config and status |
| PUT | `/api/settings/auto-backup` | Admin | Update auto-backup settings |
| POST | `/api/settings/auto-backup/run-now` | Admin | Trigger backup immediately |

### Miscellaneous

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/settings/active-staff` | Yes | Get active staff list (for user linking) |
| GET | `/api/settings/communication-log` | Yes | Get communication log |
| POST | `/api/settings/communication-log` | Yes | Add communication log entry |
| GET | `/api/settings/incidents` | Yes | Get incident reports |
| POST | `/api/settings/incidents` | Yes | Create incident report |
| GET | `/api/settings/medications` | Yes | Get medication logs |
| POST | `/api/settings/medications` | Yes | Log medication administration |
| GET | `/api/settings/meals` | Yes | Get meal logs for date |
| POST | `/api/settings/meals` | Yes | Create meal log with children |

---

## 9. Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Server health check |

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-02-19T12:00:00.000Z",
  "uptime": 86400
}
```

---

## Summary

| Route Group | Endpoints |
|-------------|-----------|
| Auth | 3 |
| Children | 18 |
| Parents | 6 |
| Staff | 12 |
| Attendance | 11 |
| Billing | 25 |
| Reports | 11 |
| Settings | 27 |
| Health | 1 |
| **Total** | **114** |
