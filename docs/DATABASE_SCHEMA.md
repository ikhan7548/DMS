# Database Schema

## Daycare Management System

**Engine**: SQLite via better-sqlite3
**File**: `data/daycare.db`
**Migrations**: `server/src/db/migrate.ts` (raw SQL `CREATE TABLE IF NOT EXISTS`)
**Pragmas**: journal_mode=WAL, foreign_keys=ON, busy_timeout=5000, cache_size=-20000, synchronous=NORMAL

---

## Table of Contents

1. [Core Entity Tables](#1-core-entity-tables)
2. [Relationship Tables](#2-relationship-tables)
3. [Attendance Tables](#3-attendance-tables)
4. [Billing Tables](#4-billing-tables)
5. [Staff Records Tables](#5-staff-records-tables)
6. [Health & Safety Tables](#6-health--safety-tables)
7. [Meal Tracking Tables](#7-meal-tracking-tables)
8. [Financial Tables](#8-financial-tables)
9. [System Tables](#9-system-tables)
10. [Entity Relationships](#10-entity-relationships)

---

## 1. Core Entity Tables

### `users`
Application user accounts for authentication.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | | |
| username | TEXT | NOT NULL UNIQUE | | Login username |
| pin_hash | TEXT | NOT NULL | | bcryptjs hashed PIN |
| display_name | TEXT | NOT NULL | | Shown in UI |
| role | TEXT | NOT NULL | 'staff' | admin, provider, staff, substitute |
| staff_id | INTEGER | REFERENCES staff(id) | NULL | Link to staff record |
| language | TEXT | NOT NULL | 'en' | en, es, ur |
| is_active | INTEGER | NOT NULL | 1 | 0=inactive, 1=active |
| last_login | TEXT | | NULL | ISO datetime |
| created_at | TEXT | NOT NULL | datetime('now') | |
| updated_at | TEXT | NOT NULL | datetime('now') | |

### `children`
Enrolled children records.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | | |
| first_name | TEXT | NOT NULL | | |
| last_name | TEXT | NOT NULL | | |
| nickname | TEXT | | NULL | |
| sex | TEXT | NOT NULL | 'male' | male, female, other |
| date_of_birth | TEXT | NOT NULL | | YYYY-MM-DD |
| home_address | TEXT | | NULL | |
| enrollment_date | TEXT | NOT NULL | | YYYY-MM-DD |
| expected_schedule | TEXT | NOT NULL | 'full_time' | full_time, part_time, after_school, before_school, drop_in |
| days_per_week | INTEGER | | 5 | |
| scheduled_days | TEXT | | NULL | JSON array of day names |
| school_dismissal_time | TEXT | | NULL | HH:MM for after_school |
| status | TEXT | NOT NULL | 'active' | active, inactive, withdrawn |
| physician_name | TEXT | | NULL | |
| physician_phone | TEXT | | NULL | |
| medical_insurance | TEXT | | NULL | |
| allergies | TEXT | | NULL | |
| dietary_restrictions | TEXT | | NULL | |
| special_needs | INTEGER | | 0 | Boolean flag |
| emergency_medical_auth | INTEGER | | 0 | Boolean flag |
| medication_admin_consent | INTEGER | | 0 | Boolean flag |
| identity_verified | INTEGER | | 0 | Boolean flag |
| identity_verified_date | TEXT | | NULL | |
| identity_verified_by | TEXT | | NULL | |
| is_provider_own_child | INTEGER | | 0 | Boolean flag |
| is_resident_child | INTEGER | | 0 | Boolean flag |
| rate_tier_id | INTEGER | REFERENCES fee_configurations(id) | NULL | Fee schedule link |
| notes | TEXT | | NULL | |
| created_at | TEXT | NOT NULL | datetime('now') | |
| updated_at | TEXT | NOT NULL | datetime('now') | |

### `parents`
Parent/guardian records.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | | |
| first_name | TEXT | NOT NULL | | |
| last_name | TEXT | NOT NULL | | |
| relationship | TEXT | | 'mother' | mother, father, guardian, grandparent, other |
| home_address | TEXT | | NULL | |
| phone_cell | TEXT | | NULL | |
| phone_home | TEXT | | NULL | |
| email | TEXT | | NULL | |
| employer_name | TEXT | | NULL | |
| employer_phone | TEXT | | NULL | |
| work_schedule | TEXT | | NULL | |
| is_primary | INTEGER | | 1 | Boolean flag |
| created_at | TEXT | NOT NULL | datetime('now') | |
| updated_at | TEXT | NOT NULL | datetime('now') | |

### `staff`
Staff member records.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | | |
| first_name | TEXT | NOT NULL | | |
| last_name | TEXT | NOT NULL | | |
| date_of_birth | TEXT | | NULL | |
| home_address | TEXT | | NULL | |
| phone | TEXT | | NULL | |
| email | TEXT | | NULL | |
| hire_date | TEXT | NOT NULL | | YYYY-MM-DD |
| position | TEXT | NOT NULL | 'assistant' | provider, assistant, substitute |
| hourly_rate | REAL | | NULL | |
| overtime_rate | REAL | | NULL | |
| pay_frequency | TEXT | | NULL | weekly, biweekly, monthly |
| status | TEXT | NOT NULL | 'active' | active, inactive |
| emergency_contact_name | TEXT | | NULL | |
| emergency_contact_phone | TEXT | | NULL | |
| emergency_contact_relationship | TEXT | | NULL | |
| high_school_diploma | INTEGER | | 0 | Boolean flag |
| tb_screening_date | TEXT | | NULL | |
| tb_screening_result | TEXT | | NULL | |
| notes | TEXT | | NULL | |
| created_at | TEXT | NOT NULL | datetime('now') | |
| updated_at | TEXT | NOT NULL | datetime('now') | |

---

## 2. Relationship Tables

### `child_parent`
Links children to parents (many-to-many).

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | | |
| child_id | INTEGER | NOT NULL REFERENCES children(id) | | |
| parent_id | INTEGER | NOT NULL REFERENCES parents(id) | | |
| relationship | TEXT | | NULL | |

### `emergency_contacts`
Emergency contacts per child.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | | |
| child_id | INTEGER | NOT NULL REFERENCES children(id) | | |
| name | TEXT | NOT NULL | | |
| relationship | TEXT | | NULL | |
| phone | TEXT | NOT NULL | | |
| is_authorized_pickup | INTEGER | | 0 | Boolean flag |
| priority_order | INTEGER | | 1 | 1=highest priority |
| created_at | TEXT | NOT NULL | datetime('now') | |

### `authorized_pickups`
Authorized pickup persons per child.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | | |
| child_id | INTEGER | NOT NULL REFERENCES children(id) | | |
| name | TEXT | NOT NULL | | |
| relationship | TEXT | | NULL | |
| phone | TEXT | | NULL | |
| created_at | TEXT | NOT NULL | datetime('now') | |

---

## 3. Attendance Tables

### `attendance_child`
Daily child attendance records.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | | |
| child_id | INTEGER | NOT NULL REFERENCES children(id) | | |
| date | TEXT | NOT NULL | | YYYY-MM-DD |
| check_in_time | TEXT | NOT NULL | | HH:MM:SS or ISO |
| check_out_time | TEXT | | NULL | |
| notes | TEXT | | NULL | |
| created_at | TEXT | NOT NULL | datetime('now') | |

### `attendance_staff`
Daily staff time clock records.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | | |
| staff_id | INTEGER | NOT NULL REFERENCES staff(id) | | |
| date | TEXT | NOT NULL | | YYYY-MM-DD |
| clock_in | TEXT | NOT NULL | | HH:MM:SS or ISO |
| clock_out | TEXT | | NULL | |
| break_minutes | INTEGER | | 0 | |
| total_hours | REAL | | NULL | Calculated on clock-out |
| notes | TEXT | | NULL | |
| created_at | TEXT | NOT NULL | datetime('now') | |

---

## 4. Billing Tables

### `fee_configurations`
Fee schedule definitions.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | | |
| name | TEXT | NOT NULL | | e.g. "Infant Full-Time" |
| age_group | TEXT | | NULL | infant, toddler, preschool, school_age |
| schedule_type | TEXT | | NULL | full_time, part_time, drop_in, etc. |
| weekly_rate | REAL | | 0 | |
| daily_rate | REAL | | 0 | |
| hourly_rate | REAL | | 0 | |
| registration_fee | REAL | | 0 | |
| late_pickup_fee_per_minute | REAL | | 1 | |
| late_payment_fee | REAL | | 25 | |
| sibling_discount_pct | REAL | | 0 | Percentage (0-100) |
| effective_date | TEXT | | NULL | |
| is_active | INTEGER | | 1 | |
| created_at | TEXT | NOT NULL | datetime('now') | |
| updated_at | TEXT | NOT NULL | datetime('now') | |

### `invoices`
Invoice records.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | | |
| invoice_number | TEXT | NOT NULL UNIQUE | | Auto-generated |
| family_id | INTEGER | NOT NULL REFERENCES parents(id) | | Parent/family link |
| period_start | TEXT | NOT NULL | | Billing period start |
| period_end | TEXT | NOT NULL | | Billing period end |
| subtotal | REAL | | 0 | |
| discounts | REAL | | 0 | |
| additional_fees | REAL | | 0 | |
| late_fees | REAL | | 0 | |
| total | REAL | | 0 | |
| amount_paid | REAL | | 0 | |
| balance_due | REAL | | 0 | |
| status | TEXT | NOT NULL | 'draft' | draft, issued, partially_paid, paid, overdue, void |
| due_date | TEXT | | NULL | |
| due_date_type | TEXT | | NULL | upon_receipt, days_after |
| issued_date | TEXT | | NULL | |
| notes | TEXT | | NULL | |
| split_billing_pct | REAL | | NULL | Parent's percentage |
| split_billing_payer | TEXT | | NULL | Third-party name |
| split_billing_payer_address | TEXT | | NULL | |
| created_at | TEXT | NOT NULL | datetime('now') | |
| updated_at | TEXT | NOT NULL | datetime('now') | |

### `invoice_line_items`
Individual charges on invoices.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | | |
| invoice_id | INTEGER | NOT NULL REFERENCES invoices(id) | | |
| child_id | INTEGER | REFERENCES children(id) | NULL | |
| description | TEXT | NOT NULL | | |
| quantity | REAL | NOT NULL | 1 | |
| unit_price | REAL | NOT NULL | 0 | |
| total | REAL | NOT NULL | 0 | quantity × unit_price |
| item_type | TEXT | NOT NULL | 'tuition' | tuition, registration, late_pickup, late_payment, supply, credit, other |
| created_at | TEXT | NOT NULL | datetime('now') | |

### `payments`
Payment records.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | | |
| family_id | INTEGER | NOT NULL REFERENCES parents(id) | | |
| invoice_id | INTEGER | REFERENCES invoices(id) | NULL | |
| date | TEXT | NOT NULL | | Payment date |
| amount | REAL | NOT NULL | | |
| method | TEXT | NOT NULL | 'cash' | cash, check, money_order, etc. |
| reference_number | TEXT | | NULL | |
| notes | TEXT | | NULL | |
| created_at | TEXT | NOT NULL | datetime('now') | |

### `payment_methods`
Available payment methods.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | | |
| name | TEXT | NOT NULL | | e.g. "Cash", "Zelle" |
| is_active | INTEGER | | 1 | |

---

## 5. Staff Records Tables

### `staff_certifications`
Staff certification records.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | | |
| staff_id | INTEGER | NOT NULL REFERENCES staff(id) | | |
| cert_type | TEXT | NOT NULL | | CPR, First Aid, MAT, etc. |
| cert_name | TEXT | | NULL | |
| issue_date | TEXT | | NULL | |
| expiry_date | TEXT | | NULL | |
| training_hours | REAL | | NULL | |
| sponsoring_org | TEXT | | NULL | |
| created_at | TEXT | NOT NULL | datetime('now') | |

### `background_checks`
Staff background check records.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | | |
| staff_id | INTEGER | NOT NULL REFERENCES staff(id) | | |
| check_type | TEXT | NOT NULL | | Child Abuse Registry, VA Criminal, etc. |
| check_date | TEXT | | NULL | |
| expiry_date | TEXT | | NULL | |
| result | TEXT | | NULL | pass, fail, pending |
| notes | TEXT | | NULL | |
| created_at | TEXT | NOT NULL | datetime('now') | |

---

## 6. Health & Safety Tables

### `immunizations`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | | |
| child_id | INTEGER | NOT NULL REFERENCES children(id) | | |
| immunization_type | TEXT | NOT NULL | | |
| date_administered | TEXT | | NULL | |
| provider | TEXT | | NULL | |
| notes | TEXT | | NULL | |
| created_at | TEXT | NOT NULL | datetime('now') | |

### `medication_logs`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | | |
| child_id | INTEGER | NOT NULL REFERENCES children(id) | | |
| medication_name | TEXT | NOT NULL | | |
| dosage | TEXT | | NULL | |
| time_administered | TEXT | | NULL | |
| administered_by | TEXT | | NULL | |
| notes | TEXT | | NULL | |
| created_at | TEXT | NOT NULL | datetime('now') | |

### `incident_reports`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | | |
| child_id | INTEGER | NOT NULL REFERENCES children(id) | | |
| date | TEXT | NOT NULL | | |
| description | TEXT | NOT NULL | | |
| action_taken | TEXT | | NULL | |
| reported_by | TEXT | | NULL | |
| parent_notified | INTEGER | | 0 | Boolean flag |
| notes | TEXT | | NULL | |
| created_at | TEXT | NOT NULL | datetime('now') | |

### `compliance_docs`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | | |
| doc_type | TEXT | NOT NULL | | |
| description | TEXT | | NULL | |
| issue_date | TEXT | | NULL | |
| expiry_date | TEXT | | NULL | |
| notes | TEXT | | NULL | |
| created_at | TEXT | NOT NULL | datetime('now') | |

### `drill_logs`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | | |
| drill_type | TEXT | NOT NULL | | fire, tornado, etc. |
| date | TEXT | NOT NULL | | |
| participants | TEXT | | NULL | |
| duration_minutes | INTEGER | | NULL | |
| notes | TEXT | | NULL | |
| created_at | TEXT | NOT NULL | datetime('now') | |

---

## 7. Meal Tracking Tables

### `meal_logs`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | | |
| date | TEXT | NOT NULL | | |
| meal_type | TEXT | NOT NULL | | breakfast, lunch, snack |
| food_items | TEXT | | NULL | |
| notes | TEXT | | NULL | |
| created_at | TEXT | NOT NULL | datetime('now') | |

### `meal_log_children`
Links children to meal logs (attendance at meals).

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | | |
| meal_log_id | INTEGER | NOT NULL REFERENCES meal_logs(id) | | |
| child_id | INTEGER | NOT NULL REFERENCES children(id) | | |

---

## 8. Financial Tables

### `payroll`
Staff payroll records.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | | |
| staff_id | INTEGER | NOT NULL REFERENCES staff(id) | | |
| period_start | TEXT | NOT NULL | | |
| period_end | TEXT | NOT NULL | | |
| regular_hours | REAL | | 0 | |
| overtime_hours | REAL | | 0 | |
| hourly_rate | REAL | | 0 | |
| overtime_rate | REAL | | 0 | |
| gross_pay | REAL | | 0 | |
| notes | TEXT | | NULL | |
| created_at | TEXT | NOT NULL | datetime('now') | |

---

## 9. System Tables

### `settings`
Key-value configuration store.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | | |
| key | TEXT | NOT NULL UNIQUE | | Setting key |
| value | TEXT | | NULL | Setting value (JSON or string) |
| updated_at | TEXT | NOT NULL | datetime('now') | |

### `role_permissions`
Granular role-based permissions (22 features).

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | | |
| role | TEXT | NOT NULL | | staff, substitute, parent |
| feature | TEXT | NOT NULL | | Feature key |
| can_access | INTEGER | NOT NULL | 0 | Boolean flag |

### `audit_log`
System audit trail.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | | |
| action | TEXT | NOT NULL | | Action performed |
| entity_type | TEXT | | NULL | Table/entity affected |
| entity_id | INTEGER | | NULL | |
| user_id | INTEGER | | NULL | |
| details | TEXT | | NULL | JSON details |
| timestamp | TEXT | NOT NULL | datetime('now') | |

### `communication_log`
Parent communication records.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | | |
| type | TEXT | | NULL | note, email, sms, phone, other |
| recipient | TEXT | | NULL | |
| subject | TEXT | | NULL | |
| message | TEXT | | NULL | |
| date | TEXT | | NULL | |
| created_at | TEXT | NOT NULL | datetime('now') | |

### `archived_records`
Archived/soft-deleted records for data retention.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | | |
| original_table | TEXT | NOT NULL | | Source table name |
| original_id | INTEGER | NOT NULL | | Original record ID |
| data | TEXT | NOT NULL | | JSON blob of archived record |
| archived_date | TEXT | NOT NULL | datetime('now') | |
| retention_expires | TEXT | | NULL | When record can be purged |

---

## 10. Entity Relationships

```
users ─────────── staff (optional staff_id FK)

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

### Table Count: 28 tables total

| Category | Tables | Count |
|----------|--------|-------|
| Core Entities | users, children, parents, staff | 4 |
| Relationships | child_parent, emergency_contacts, authorized_pickups | 3 |
| Attendance | attendance_child, attendance_staff | 2 |
| Billing | fee_configurations, invoices, invoice_line_items, payments, payment_methods | 5 |
| Staff Records | staff_certifications, background_checks | 2 |
| Health & Safety | immunizations, medication_logs, incident_reports, compliance_docs, drill_logs | 5 |
| Meals | meal_logs, meal_log_children | 2 |
| Financial | payroll | 1 |
| System | settings, role_permissions, audit_log, communication_log, archived_records | 5 |
