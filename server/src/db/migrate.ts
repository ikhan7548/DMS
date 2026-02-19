import { sqlite } from './connection';
import * as schema from './schema';

/**
 * Create all tables if they don't exist.
 * Uses raw SQL since we're using better-sqlite3 directly.
 */
function createTables() {
  console.log('Running database migrations...');

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      pin_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff',
      staff_id INTEGER REFERENCES staff(id),
      language TEXT NOT NULL DEFAULT 'en',
      is_active INTEGER NOT NULL DEFAULT 1,
      last_login TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      date_of_birth TEXT,
      home_address TEXT,
      phone TEXT,
      email TEXT,
      hire_date TEXT NOT NULL,
      position TEXT NOT NULL DEFAULT 'assistant',
      hourly_rate REAL,
      overtime_rate REAL,
      pay_frequency TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      emergency_contact_relationship TEXT,
      high_school_diploma INTEGER DEFAULT 0,
      tb_screening_date TEXT,
      tb_screening_result TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS children (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      nickname TEXT,
      sex TEXT NOT NULL DEFAULT 'male',
      date_of_birth TEXT NOT NULL,
      home_address TEXT,
      enrollment_date TEXT NOT NULL,
      expected_schedule TEXT NOT NULL DEFAULT 'full_time',
      days_per_week INTEGER DEFAULT 5,
      scheduled_days TEXT,
      school_dismissal_time TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      physician_name TEXT,
      physician_phone TEXT,
      medical_insurance TEXT,
      allergies TEXT,
      dietary_restrictions TEXT,
      special_needs INTEGER DEFAULT 0,
      emergency_medical_auth INTEGER DEFAULT 0,
      medication_admin_consent INTEGER DEFAULT 0,
      identity_verified INTEGER DEFAULT 0,
      identity_verified_date TEXT,
      identity_verified_by TEXT,
      is_provider_own_child INTEGER DEFAULT 0,
      is_resident_child INTEGER DEFAULT 0,
      rate_tier_id INTEGER REFERENCES fee_configurations(id),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS parents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      relationship TEXT DEFAULT 'mother',
      home_address TEXT,
      phone_cell TEXT,
      phone_home TEXT,
      email TEXT,
      employer_name TEXT,
      employer_phone TEXT,
      work_schedule TEXT,
      is_primary INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS child_parent (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL REFERENCES children(id),
      parent_id INTEGER NOT NULL REFERENCES parents(id),
      relationship TEXT
    );

    CREATE TABLE IF NOT EXISTS emergency_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL REFERENCES children(id),
      name TEXT NOT NULL,
      relationship TEXT,
      phone TEXT NOT NULL,
      is_authorized_pickup INTEGER DEFAULT 0,
      priority_order INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS authorized_pickups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL REFERENCES children(id),
      name TEXT NOT NULL,
      relationship TEXT,
      phone TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS attendance_child (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL REFERENCES children(id),
      date TEXT NOT NULL,
      check_in_time TEXT NOT NULL,
      check_out_time TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS attendance_staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL REFERENCES staff(id),
      date TEXT NOT NULL,
      clock_in TEXT NOT NULL,
      clock_out TEXT,
      break_minutes INTEGER DEFAULT 0,
      total_hours REAL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS fee_configurations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age_group TEXT,
      schedule_type TEXT,
      weekly_rate REAL DEFAULT 0,
      daily_rate REAL DEFAULT 0,
      hourly_rate REAL DEFAULT 0,
      registration_fee REAL DEFAULT 0,
      late_pickup_fee_per_minute REAL DEFAULT 1,
      late_payment_fee REAL DEFAULT 25,
      sibling_discount_pct REAL DEFAULT 0,
      effective_date TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT NOT NULL UNIQUE,
      family_id INTEGER NOT NULL REFERENCES parents(id),
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      subtotal REAL DEFAULT 0,
      discounts REAL DEFAULT 0,
      additional_fees REAL DEFAULT 0,
      late_fees REAL DEFAULT 0,
      total REAL DEFAULT 0,
      amount_paid REAL DEFAULT 0,
      balance_due REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft',
      due_date TEXT,
      due_date_type TEXT,
      issued_date TEXT,
      notes TEXT,
      split_billing_pct REAL,
      split_billing_payer TEXT,
      split_billing_payer_address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invoice_line_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id),
      child_id INTEGER REFERENCES children(id),
      description TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      item_type TEXT NOT NULL DEFAULT 'tuition',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_id INTEGER NOT NULL REFERENCES parents(id),
      invoice_id INTEGER REFERENCES invoices(id),
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      method TEXT NOT NULL DEFAULT 'cash',
      reference_number TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payment_methods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS staff_certifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL REFERENCES staff(id),
      cert_type TEXT NOT NULL,
      cert_name TEXT,
      issue_date TEXT,
      expiry_date TEXT,
      training_hours REAL,
      sponsoring_org TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS background_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL REFERENCES staff(id),
      check_type TEXT NOT NULL,
      check_date TEXT,
      expiry_date TEXT,
      result TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS immunizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL REFERENCES children(id),
      immunization_type TEXT NOT NULL,
      date_administered TEXT,
      provider TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS medication_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL REFERENCES children(id),
      medication_name TEXT NOT NULL,
      dosage TEXT,
      time_administered TEXT,
      administered_by TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS incident_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL REFERENCES children(id),
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      action_taken TEXT,
      reported_by TEXT,
      parent_notified INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS compliance_docs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_type TEXT NOT NULL,
      description TEXT,
      issue_date TEXT,
      expiry_date TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS drill_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      drill_type TEXT NOT NULL,
      date TEXT NOT NULL,
      participants TEXT,
      duration_minutes INTEGER,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS meal_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      food_items TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS meal_log_children (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_log_id INTEGER NOT NULL REFERENCES meal_logs(id),
      child_id INTEGER NOT NULL REFERENCES children(id)
    );

    CREATE TABLE IF NOT EXISTS payroll (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL REFERENCES staff(id),
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      regular_hours REAL DEFAULT 0,
      overtime_hours REAL DEFAULT 0,
      hourly_rate REAL DEFAULT 0,
      overtime_rate REAL DEFAULT 0,
      gross_pay REAL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      feature TEXT NOT NULL,
      can_access INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      user_id INTEGER,
      details TEXT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS communication_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      recipient TEXT,
      subject TEXT,
      message TEXT,
      date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS archived_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_table TEXT NOT NULL,
      original_id INTEGER NOT NULL,
      data TEXT NOT NULL,
      archived_date TEXT NOT NULL DEFAULT (datetime('now')),
      retention_expires TEXT
    );
  `);

  console.log('All tables created successfully.');
}

createTables();
console.log('Database migration complete.');
process.exit(0);
