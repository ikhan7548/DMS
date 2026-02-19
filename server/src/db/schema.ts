import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ============================================================
// USERS
// ============================================================
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  pin_hash: text('pin_hash').notNull(),
  display_name: text('display_name').notNull(),
  role: text('role', { enum: ['admin', 'provider', 'staff', 'substitute', 'parent'] }).notNull().default('staff'),
  staff_id: integer('staff_id').references(() => staff.id),
  language: text('language').notNull().default('en'),
  is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  last_login: text('last_login'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ============================================================
// CHILDREN
// ============================================================
export const children = sqliteTable('children', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  nickname: text('nickname'),
  sex: text('sex', { enum: ['male', 'female', 'other'] }).notNull().default('male'),
  date_of_birth: text('date_of_birth').notNull(),
  home_address: text('home_address'),
  enrollment_date: text('enrollment_date').notNull(),
  expected_schedule: text('expected_schedule', {
    enum: ['full_time', 'part_time', 'drop_in', 'after_school', 'before_school'],
  }).notNull().default('full_time'),
  days_per_week: integer('days_per_week').default(5),
  scheduled_days: text('scheduled_days'),
  school_dismissal_time: text('school_dismissal_time'),
  status: text('status', { enum: ['active', 'inactive', 'withdrawn'] }).notNull().default('active'),
  physician_name: text('physician_name'),
  physician_phone: text('physician_phone'),
  medical_insurance: text('medical_insurance'),
  allergies: text('allergies'),
  dietary_restrictions: text('dietary_restrictions'),
  special_needs: integer('special_needs', { mode: 'boolean' }).default(false),
  emergency_medical_auth: integer('emergency_medical_auth', { mode: 'boolean' }).default(false),
  medication_admin_consent: integer('medication_admin_consent', { mode: 'boolean' }).default(false),
  identity_verified: integer('identity_verified', { mode: 'boolean' }).default(false),
  identity_verified_date: text('identity_verified_date'),
  identity_verified_by: text('identity_verified_by'),
  is_provider_own_child: integer('is_provider_own_child', { mode: 'boolean' }).default(false),
  is_resident_child: integer('is_resident_child', { mode: 'boolean' }).default(false),
  rate_tier_id: integer('rate_tier_id').references(() => feeConfigurations.id),
  notes: text('notes'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ============================================================
// PARENTS
// ============================================================
export const parents = sqliteTable('parents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  relationship: text('relationship').default('mother'),
  home_address: text('home_address'),
  phone_cell: text('phone_cell'),
  phone_home: text('phone_home'),
  email: text('email'),
  employer_name: text('employer_name'),
  employer_phone: text('employer_phone'),
  work_schedule: text('work_schedule'),
  is_primary: integer('is_primary', { mode: 'boolean' }).default(true),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ============================================================
// CHILD-PARENT JUNCTION
// ============================================================
export const childParent = sqliteTable('child_parent', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  child_id: integer('child_id').notNull().references(() => children.id),
  parent_id: integer('parent_id').notNull().references(() => parents.id),
  relationship: text('relationship'),
});

// ============================================================
// STAFF
// ============================================================
export const staff = sqliteTable('staff', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  date_of_birth: text('date_of_birth'),
  home_address: text('home_address'),
  phone: text('phone'),
  email: text('email'),
  hire_date: text('hire_date').notNull(),
  position: text('position', { enum: ['provider', 'assistant', 'substitute'] }).notNull().default('assistant'),
  hourly_rate: real('hourly_rate'),
  overtime_rate: real('overtime_rate'),
  pay_frequency: text('pay_frequency', { enum: ['weekly', 'biweekly', 'semimonthly', 'monthly'] }),
  status: text('status', { enum: ['active', 'inactive'] }).notNull().default('active'),
  emergency_contact_name: text('emergency_contact_name'),
  emergency_contact_phone: text('emergency_contact_phone'),
  emergency_contact_relationship: text('emergency_contact_relationship'),
  high_school_diploma: integer('high_school_diploma', { mode: 'boolean' }).default(false),
  tb_screening_date: text('tb_screening_date'),
  tb_screening_result: text('tb_screening_result'),
  notes: text('notes'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ============================================================
// EMERGENCY CONTACTS
// ============================================================
export const emergencyContacts = sqliteTable('emergency_contacts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  child_id: integer('child_id').notNull().references(() => children.id),
  name: text('name').notNull(),
  relationship: text('relationship'),
  phone: text('phone').notNull(),
  is_authorized_pickup: integer('is_authorized_pickup', { mode: 'boolean' }).default(false),
  priority_order: integer('priority_order').default(1),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ============================================================
// AUTHORIZED PICKUPS
// ============================================================
export const authorizedPickups = sqliteTable('authorized_pickups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  child_id: integer('child_id').notNull().references(() => children.id),
  name: text('name').notNull(),
  relationship: text('relationship'),
  phone: text('phone'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ============================================================
// ATTENDANCE - CHILDREN
// ============================================================
export const attendanceChild = sqliteTable('attendance_child', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  child_id: integer('child_id').notNull().references(() => children.id),
  date: text('date').notNull(),
  check_in_time: text('check_in_time').notNull(),
  check_out_time: text('check_out_time'),
  notes: text('notes'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ============================================================
// ATTENDANCE - STAFF
// ============================================================
export const attendanceStaff = sqliteTable('attendance_staff', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  staff_id: integer('staff_id').notNull().references(() => staff.id),
  date: text('date').notNull(),
  clock_in: text('clock_in').notNull(),
  clock_out: text('clock_out'),
  break_minutes: integer('break_minutes').default(0),
  total_hours: real('total_hours'),
  notes: text('notes'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ============================================================
// INVOICES
// ============================================================
export const invoices = sqliteTable('invoices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoice_number: text('invoice_number').notNull().unique(),
  family_id: integer('family_id').notNull().references(() => parents.id),
  period_start: text('period_start').notNull(),
  period_end: text('period_end').notNull(),
  subtotal: real('subtotal').default(0),
  discounts: real('discounts').default(0),
  additional_fees: real('additional_fees').default(0),
  late_fees: real('late_fees').default(0),
  total: real('total').default(0),
  amount_paid: real('amount_paid').default(0),
  balance_due: real('balance_due').default(0),
  status: text('status', {
    enum: ['draft', 'issued', 'partially_paid', 'paid', 'overdue', 'void'],
  }).notNull().default('draft'),
  due_date: text('due_date'),
  due_date_type: text('due_date_type'),
  issued_date: text('issued_date'),
  notes: text('notes'),
  split_billing_pct: real('split_billing_pct'),
  split_billing_payer: text('split_billing_payer'),
  split_billing_payer_address: text('split_billing_payer_address'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ============================================================
// INVOICE LINE ITEMS
// ============================================================
export const invoiceLineItems = sqliteTable('invoice_line_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoice_id: integer('invoice_id').notNull().references(() => invoices.id),
  child_id: integer('child_id').references(() => children.id),
  description: text('description').notNull(),
  quantity: real('quantity').notNull().default(1),
  unit_price: real('unit_price').notNull().default(0),
  total: real('total').notNull().default(0),
  item_type: text('item_type', {
    enum: ['tuition', 'registration', 'late_pickup', 'late_payment', 'supply', 'credit', 'other'],
  }).notNull().default('tuition'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ============================================================
// PAYMENTS
// ============================================================
export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  family_id: integer('family_id').notNull().references(() => parents.id),
  invoice_id: integer('invoice_id').references(() => invoices.id),
  date: text('date').notNull(),
  amount: real('amount').notNull(),
  method: text('method').notNull().default('cash'),
  reference_number: text('reference_number'),
  notes: text('notes'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ============================================================
// FEE CONFIGURATIONS
// ============================================================
export const feeConfigurations = sqliteTable('fee_configurations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  age_group: text('age_group'),
  schedule_type: text('schedule_type'),
  weekly_rate: real('weekly_rate').default(0),
  daily_rate: real('daily_rate').default(0),
  hourly_rate: real('hourly_rate').default(0),
  registration_fee: real('registration_fee').default(0),
  late_pickup_fee_per_minute: real('late_pickup_fee_per_minute').default(1),
  late_payment_fee: real('late_payment_fee').default(25),
  sibling_discount_pct: real('sibling_discount_pct').default(0),
  effective_date: text('effective_date'),
  is_active: integer('is_active', { mode: 'boolean' }).default(true),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ============================================================
// PAYMENT METHODS
// ============================================================
export const paymentMethods = sqliteTable('payment_methods', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  is_active: integer('is_active', { mode: 'boolean' }).default(true),
});

// ============================================================
// STAFF CERTIFICATIONS
// ============================================================
export const staffCertifications = sqliteTable('staff_certifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  staff_id: integer('staff_id').notNull().references(() => staff.id),
  cert_type: text('cert_type', {
    enum: ['cpr', 'first_aid', 'mat', 'pre_licensure_orientation', 'annual_training'],
  }).notNull(),
  cert_name: text('cert_name'),
  issue_date: text('issue_date'),
  expiry_date: text('expiry_date'),
  training_hours: real('training_hours'),
  sponsoring_org: text('sponsoring_org'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ============================================================
// BACKGROUND CHECKS
// ============================================================
export const backgroundChecks = sqliteTable('background_checks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  staff_id: integer('staff_id').notNull().references(() => staff.id),
  check_type: text('check_type', {
    enum: ['child_abuse_registry', 'va_criminal', 'fbi_fingerprint', 'sex_offender'],
  }).notNull(),
  check_date: text('check_date'),
  expiry_date: text('expiry_date'),
  result: text('result', { enum: ['pass', 'fail', 'pending'] }),
  notes: text('notes'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ============================================================
// IMMUNIZATIONS
// ============================================================
export const immunizations = sqliteTable('immunizations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  child_id: integer('child_id').notNull().references(() => children.id),
  immunization_type: text('immunization_type').notNull(),
  date_administered: text('date_administered'),
  provider: text('provider'),
  notes: text('notes'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ============================================================
// MEDICATION LOGS
// ============================================================
export const medicationLogs = sqliteTable('medication_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  child_id: integer('child_id').notNull().references(() => children.id),
  medication_name: text('medication_name').notNull(),
  dosage: text('dosage'),
  time_administered: text('time_administered'),
  administered_by: text('administered_by'),
  notes: text('notes'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ============================================================
// INCIDENT REPORTS
// ============================================================
export const incidentReports = sqliteTable('incident_reports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  child_id: integer('child_id').notNull().references(() => children.id),
  date: text('date').notNull(),
  description: text('description').notNull(),
  action_taken: text('action_taken'),
  reported_by: text('reported_by'),
  parent_notified: integer('parent_notified', { mode: 'boolean' }).default(false),
  notes: text('notes'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ============================================================
// COMPLIANCE DOCS
// ============================================================
export const complianceDocs = sqliteTable('compliance_docs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  doc_type: text('doc_type').notNull(),
  description: text('description'),
  issue_date: text('issue_date'),
  expiry_date: text('expiry_date'),
  notes: text('notes'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ============================================================
// DRILL LOGS
// ============================================================
export const drillLogs = sqliteTable('drill_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  drill_type: text('drill_type').notNull(),
  date: text('date').notNull(),
  participants: text('participants'),
  duration_minutes: integer('duration_minutes'),
  notes: text('notes'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ============================================================
// MEAL LOGS
// ============================================================
export const mealLogs = sqliteTable('meal_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),
  meal_type: text('meal_type', { enum: ['breakfast', 'am_snack', 'lunch', 'pm_snack', 'dinner'] }).notNull(),
  food_items: text('food_items'),
  notes: text('notes'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ============================================================
// MEAL LOG CHILDREN
// ============================================================
export const mealLogChildren = sqliteTable('meal_log_children', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  meal_log_id: integer('meal_log_id').notNull().references(() => mealLogs.id),
  child_id: integer('child_id').notNull().references(() => children.id),
});

// ============================================================
// PAYROLL
// ============================================================
export const payroll = sqliteTable('payroll', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  staff_id: integer('staff_id').notNull().references(() => staff.id),
  period_start: text('period_start').notNull(),
  period_end: text('period_end').notNull(),
  regular_hours: real('regular_hours').default(0),
  overtime_hours: real('overtime_hours').default(0),
  hourly_rate: real('hourly_rate').default(0),
  overtime_rate: real('overtime_rate').default(0),
  gross_pay: real('gross_pay').default(0),
  notes: text('notes'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ============================================================
// SETTINGS (key-value store)
// ============================================================
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value'),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ============================================================
// ROLE PERMISSIONS
// ============================================================
export const rolePermissions = sqliteTable('role_permissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  role: text('role').notNull(),
  feature: text('feature').notNull(),
  can_access: integer('can_access', { mode: 'boolean' }).notNull().default(false),
});

// ============================================================
// AUDIT LOG
// ============================================================
export const auditLog = sqliteTable('audit_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  action: text('action').notNull(),
  entity_type: text('entity_type'),
  entity_id: integer('entity_id'),
  user_id: integer('user_id'),
  details: text('details'),
  timestamp: text('timestamp').notNull().default(sql`(datetime('now'))`),
});

// ============================================================
// COMMUNICATION LOG
// ============================================================
export const communicationLog = sqliteTable('communication_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type'),
  recipient: text('recipient'),
  subject: text('subject'),
  message: text('message'),
  date: text('date'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ============================================================
// ARCHIVED RECORDS
// ============================================================
export const archivedRecords = sqliteTable('archived_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  original_table: text('original_table').notNull(),
  original_id: integer('original_id').notNull(),
  data: text('data').notNull(),
  archived_date: text('archived_date').notNull().default(sql`(datetime('now'))`),
  retention_expires: text('retention_expires'),
});
