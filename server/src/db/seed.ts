import bcrypt from 'bcryptjs';
import { db, sqlite } from './connection';
import * as schema from './schema';

async function seed() {
  console.log('Seeding database...');

  // Run migrations first
  const migrateSQL = require('fs').readFileSync(
    require('path').join(__dirname, 'migrate.ts'),
    'utf8'
  );
  // Instead, just create tables inline
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT, first_name TEXT NOT NULL, last_name TEXT NOT NULL,
      date_of_birth TEXT, home_address TEXT, phone TEXT, email TEXT, hire_date TEXT NOT NULL,
      position TEXT NOT NULL DEFAULT 'assistant', hourly_rate REAL, overtime_rate REAL,
      pay_frequency TEXT, status TEXT NOT NULL DEFAULT 'active', emergency_contact_name TEXT,
      emergency_contact_phone TEXT, emergency_contact_relationship TEXT,
      high_school_diploma INTEGER DEFAULT 0, tb_screening_date TEXT, tb_screening_result TEXT,
      notes TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, pin_hash TEXT NOT NULL,
      display_name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'staff', staff_id INTEGER REFERENCES staff(id),
      language TEXT NOT NULL DEFAULT 'en', is_active INTEGER NOT NULL DEFAULT 1, last_login TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS fee_configurations (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, age_group TEXT, schedule_type TEXT,
      weekly_rate REAL DEFAULT 0, daily_rate REAL DEFAULT 0, hourly_rate REAL DEFAULT 0,
      registration_fee REAL DEFAULT 0, late_pickup_fee_per_minute REAL DEFAULT 1,
      late_payment_fee REAL DEFAULT 25, sibling_discount_pct REAL DEFAULT 0,
      effective_date TEXT, is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS children (
      id INTEGER PRIMARY KEY AUTOINCREMENT, first_name TEXT NOT NULL, last_name TEXT NOT NULL,
      nickname TEXT, sex TEXT NOT NULL DEFAULT 'male', date_of_birth TEXT NOT NULL,
      home_address TEXT, enrollment_date TEXT NOT NULL, expected_schedule TEXT NOT NULL DEFAULT 'full_time',
      days_per_week INTEGER DEFAULT 5, scheduled_days TEXT, school_dismissal_time TEXT,
      status TEXT NOT NULL DEFAULT 'active', physician_name TEXT, physician_phone TEXT,
      medical_insurance TEXT, allergies TEXT, dietary_restrictions TEXT,
      special_needs INTEGER DEFAULT 0, emergency_medical_auth INTEGER DEFAULT 0,
      medication_admin_consent INTEGER DEFAULT 0, identity_verified INTEGER DEFAULT 0,
      identity_verified_date TEXT, identity_verified_by TEXT, is_provider_own_child INTEGER DEFAULT 0,
      is_resident_child INTEGER DEFAULT 0, rate_tier_id INTEGER REFERENCES fee_configurations(id),
      notes TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS parents (
      id INTEGER PRIMARY KEY AUTOINCREMENT, first_name TEXT NOT NULL, last_name TEXT NOT NULL,
      relationship TEXT DEFAULT 'mother', home_address TEXT, phone_cell TEXT, phone_home TEXT,
      email TEXT, employer_name TEXT, employer_phone TEXT, work_schedule TEXT,
      is_primary INTEGER DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS child_parent (
      id INTEGER PRIMARY KEY AUTOINCREMENT, child_id INTEGER NOT NULL REFERENCES children(id),
      parent_id INTEGER NOT NULL REFERENCES parents(id), relationship TEXT
    );
    CREATE TABLE IF NOT EXISTS emergency_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT, child_id INTEGER NOT NULL REFERENCES children(id),
      name TEXT NOT NULL, relationship TEXT, phone TEXT NOT NULL,
      is_authorized_pickup INTEGER DEFAULT 0, priority_order INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT NOT NULL UNIQUE, value TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS role_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT, role TEXT NOT NULL, feature TEXT NOT NULL,
      can_access INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS staff_certifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT, staff_id INTEGER NOT NULL REFERENCES staff(id),
      cert_type TEXT NOT NULL, cert_name TEXT, issue_date TEXT, expiry_date TEXT,
      training_hours REAL, sponsoring_org TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS background_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT, staff_id INTEGER NOT NULL REFERENCES staff(id),
      check_type TEXT NOT NULL, check_date TEXT, expiry_date TEXT, result TEXT, notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Clear existing data
  sqlite.exec(`
    DELETE FROM child_parent;
    DELETE FROM emergency_contacts;
    DELETE FROM staff_certifications;
    DELETE FROM background_checks;
    DELETE FROM children;
    DELETE FROM parents;
    DELETE FROM users;
    DELETE FROM staff;
    DELETE FROM fee_configurations;
    DELETE FROM settings;
    DELETE FROM role_permissions;
  `);

  // ---- STAFF ----
  const staffData = [
    { first_name: 'Amira', last_name: 'Khan', hire_date: '2020-01-15', position: 'provider', phone: '(703) 555-0101', email: 'amira@ducklings.com', hourly_rate: 25.0 },
    { first_name: 'Rachel', last_name: 'Williams', hire_date: '2021-03-01', position: 'assistant', phone: '(703) 555-0102', email: 'rachel@ducklings.com', hourly_rate: 16.0 },
    { first_name: 'Jessica', last_name: 'Martinez', hire_date: '2021-06-15', position: 'assistant', phone: '(703) 555-0103', email: 'jessica@ducklings.com', hourly_rate: 15.5 },
    { first_name: 'Sarah', last_name: 'Johnson', hire_date: '2022-01-10', position: 'assistant', phone: '(703) 555-0104', hourly_rate: 15.0 },
    { first_name: 'Emily', last_name: 'Davis', hire_date: '2023-08-01', position: 'substitute', phone: '(703) 555-0105', hourly_rate: 14.0 },
  ];

  const staffIds: number[] = [];
  for (const s of staffData) {
    const result = sqlite.prepare(
      `INSERT INTO staff (first_name, last_name, hire_date, position, phone, email, hourly_rate, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`
    ).run(s.first_name, s.last_name, s.hire_date, s.position, s.phone || null, s.email || null, s.hourly_rate || null);
    staffIds.push(Number(result.lastInsertRowid));
  }
  console.log(`  Created ${staffIds.length} staff members`);

  // ---- STAFF CERTIFICATIONS ----
  const certData = [
    { staff_id: staffIds[0], cert_type: 'cpr', cert_name: 'CPR/AED', issue_date: '2025-06-01', expiry_date: '2027-06-01', training_hours: 4, sponsoring_org: 'American Red Cross' },
    { staff_id: staffIds[0], cert_type: 'first_aid', cert_name: 'First Aid', issue_date: '2025-06-01', expiry_date: '2027-06-01', training_hours: 4, sponsoring_org: 'American Red Cross' },
    { staff_id: staffIds[0], cert_type: 'mat', cert_name: 'MAT Certification', issue_date: '2025-01-15', expiry_date: '2028-01-15', training_hours: 8, sponsoring_org: 'VA DSS' },
    { staff_id: staffIds[1], cert_type: 'cpr', cert_name: 'CPR/AED', issue_date: '2025-03-15', expiry_date: '2027-03-15', training_hours: 4, sponsoring_org: 'American Red Cross' },
    { staff_id: staffIds[1], cert_type: 'first_aid', cert_name: 'First Aid', issue_date: '2025-03-15', expiry_date: '2027-03-15', training_hours: 4, sponsoring_org: 'American Red Cross' },
    { staff_id: staffIds[2], cert_type: 'cpr', cert_name: 'CPR/AED', issue_date: '2024-11-01', expiry_date: '2026-11-01', training_hours: 4, sponsoring_org: 'American Heart Association' },
    { staff_id: staffIds[2], cert_type: 'first_aid', cert_name: 'First Aid', issue_date: '2024-11-01', expiry_date: '2026-11-01', training_hours: 4, sponsoring_org: 'American Heart Association' },
  ];
  for (const c of certData) {
    sqlite.prepare(
      `INSERT INTO staff_certifications (staff_id, cert_type, cert_name, issue_date, expiry_date, training_hours, sponsoring_org) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(c.staff_id, c.cert_type, c.cert_name, c.issue_date, c.expiry_date, c.training_hours, c.sponsoring_org);
  }
  console.log(`  Created ${certData.length} staff certifications`);

  // ---- BACKGROUND CHECKS ----
  for (const sid of staffIds.slice(0, 4)) {
    for (const checkType of ['child_abuse_registry', 'va_criminal', 'fbi_fingerprint', 'sex_offender']) {
      sqlite.prepare(
        `INSERT INTO background_checks (staff_id, check_type, check_date, expiry_date, result) VALUES (?, ?, ?, ?, 'pass')`
      ).run(sid, checkType, '2024-01-15', '2029-01-15');
    }
  }
  console.log(`  Created background checks for staff`);

  // ---- USERS ----
  const pin1234 = bcrypt.hashSync('1234', 10);
  const pin5678 = bcrypt.hashSync('5678', 10);

  const usersData = [
    { username: 'admin', pin_hash: pin1234, display_name: 'Administrator', role: 'admin', staff_id: null },
    { username: 'amira', pin_hash: pin1234, display_name: 'Amira Khan', role: 'provider', staff_id: staffIds[0] },
    { username: 'rachel', pin_hash: pin5678, display_name: 'Rachel Williams', role: 'staff', staff_id: staffIds[1] },
    { username: 'jessica', pin_hash: pin5678, display_name: 'Jessica Martinez', role: 'staff', staff_id: staffIds[2] },
    { username: 'sarah', pin_hash: pin5678, display_name: 'Sarah Johnson', role: 'staff', staff_id: staffIds[3] },
    { username: 'emily', pin_hash: pin5678, display_name: 'Emily Davis', role: 'substitute', staff_id: staffIds[4] },
  ];
  for (const u of usersData) {
    sqlite.prepare(
      `INSERT INTO users (username, pin_hash, display_name, role, staff_id) VALUES (?, ?, ?, ?, ?)`
    ).run(u.username, u.pin_hash, u.display_name, u.role, u.staff_id);
  }
  console.log(`  Created ${usersData.length} user accounts`);

  // ---- FEE CONFIGURATIONS ----
  const feeData = [
    { name: 'Infant Full-Time', age_group: 'infant', schedule_type: 'full_time', weekly_rate: 350, daily_rate: 80, hourly_rate: 15, registration_fee: 75 },
    { name: 'Infant Part-Time', age_group: 'infant', schedule_type: 'part_time', weekly_rate: 225, daily_rate: 80, hourly_rate: 15, registration_fee: 75 },
    { name: 'Toddler Full-Time', age_group: 'toddler', schedule_type: 'full_time', weekly_rate: 300, daily_rate: 70, hourly_rate: 13, registration_fee: 50 },
    { name: 'Toddler Part-Time', age_group: 'toddler', schedule_type: 'part_time', weekly_rate: 200, daily_rate: 70, hourly_rate: 13, registration_fee: 50 },
    { name: 'Preschool Full-Time', age_group: 'preschool', schedule_type: 'full_time', weekly_rate: 275, daily_rate: 65, hourly_rate: 12, registration_fee: 50 },
    { name: 'Preschool Part-Time', age_group: 'preschool', schedule_type: 'part_time', weekly_rate: 180, daily_rate: 65, hourly_rate: 12, registration_fee: 50 },
    { name: 'School-Age After School', age_group: 'school_age', schedule_type: 'after_school', weekly_rate: 150, daily_rate: 40, hourly_rate: 10, registration_fee: 25 },
    { name: 'School-Age Before School', age_group: 'school_age', schedule_type: 'before_school', weekly_rate: 100, daily_rate: 25, hourly_rate: 10, registration_fee: 25 },
    { name: 'Drop-In', age_group: null, schedule_type: 'drop_in', weekly_rate: 0, daily_rate: 75, hourly_rate: 15, registration_fee: 0 },
  ];
  const feeIds: number[] = [];
  for (const f of feeData) {
    const result = sqlite.prepare(
      `INSERT INTO fee_configurations (name, age_group, schedule_type, weekly_rate, daily_rate, hourly_rate, registration_fee, effective_date) VALUES (?, ?, ?, ?, ?, ?, ?, '2025-01-01')`
    ).run(f.name, f.age_group, f.schedule_type, f.weekly_rate, f.daily_rate, f.hourly_rate, f.registration_fee);
    feeIds.push(Number(result.lastInsertRowid));
  }
  console.log(`  Created ${feeIds.length} fee configurations`);

  // ---- CHILDREN ----
  const childrenData = [
    { first_name: 'Sophia', last_name: 'Anderson', nickname: 'Sophie', sex: 'female', date_of_birth: '2024-08-15', schedule: 'full_time', fee_idx: 0, allergies: 'Peanuts' },
    { first_name: 'Liam', last_name: 'Anderson', nickname: null, sex: 'male', date_of_birth: '2023-02-10', schedule: 'full_time', fee_idx: 2, allergies: null },
    { first_name: 'Emma', last_name: 'Brown', nickname: 'Emmy', sex: 'female', date_of_birth: '2023-11-20', schedule: 'full_time', fee_idx: 1, allergies: null },
    { first_name: 'Noah', last_name: 'Garcia', nickname: null, sex: 'male', date_of_birth: '2022-05-03', schedule: 'full_time', fee_idx: 4, allergies: 'Dairy' },
    { first_name: 'Olivia', last_name: 'Garcia', nickname: 'Liv', sex: 'female', date_of_birth: '2024-01-25', schedule: 'full_time', fee_idx: 2, allergies: null },
    { first_name: 'Ava', last_name: 'Wilson', nickname: null, sex: 'female', date_of_birth: '2021-09-14', schedule: 'part_time', fee_idx: 5, allergies: null },
    { first_name: 'James', last_name: 'Taylor', nickname: 'JJ', sex: 'male', date_of_birth: '2019-03-22', schedule: 'after_school', fee_idx: 6, allergies: 'Shellfish' },
    { first_name: 'Mia', last_name: 'Thomas', nickname: null, sex: 'female', date_of_birth: '2022-07-08', schedule: 'full_time', fee_idx: 4, allergies: null },
    { first_name: 'Benjamin', last_name: 'Lee', nickname: 'Ben', sex: 'male', date_of_birth: '2023-04-17', schedule: 'full_time', fee_idx: 2, allergies: null },
    { first_name: 'Charlotte', last_name: 'Harris', nickname: 'Charlie', sex: 'female', date_of_birth: '2024-06-30', schedule: 'full_time', fee_idx: 0, allergies: 'Eggs, Soy' },
  ];
  const childIds: number[] = [];
  for (const c of childrenData) {
    const result = sqlite.prepare(
      `INSERT INTO children (first_name, last_name, nickname, sex, date_of_birth, enrollment_date, expected_schedule, rate_tier_id, allergies, emergency_medical_auth, medication_admin_consent) VALUES (?, ?, ?, ?, ?, '2025-01-06', ?, ?, ?, 1, 1)`
    ).run(c.first_name, c.last_name, c.nickname, c.sex, c.date_of_birth, c.schedule, feeIds[c.fee_idx], c.allergies);
    childIds.push(Number(result.lastInsertRowid));
  }
  console.log(`  Created ${childIds.length} children`);

  // ---- PARENTS ----
  const parentsData = [
    { first_name: 'Michael', last_name: 'Anderson', relationship: 'father', phone_cell: '(703) 555-1001', email: 'michael.anderson@email.com' },
    { first_name: 'Jennifer', last_name: 'Anderson', relationship: 'mother', phone_cell: '(703) 555-1002', email: 'jennifer.anderson@email.com' },
    { first_name: 'Maria', last_name: 'Brown', relationship: 'mother', phone_cell: '(703) 555-1003', email: 'maria.brown@email.com' },
    { first_name: 'Carlos', last_name: 'Garcia', relationship: 'father', phone_cell: '(703) 555-1004', email: 'carlos.garcia@email.com' },
    { first_name: 'Ana', last_name: 'Garcia', relationship: 'mother', phone_cell: '(703) 555-1005', email: 'ana.garcia@email.com' },
    { first_name: 'David', last_name: 'Wilson', relationship: 'father', phone_cell: '(703) 555-1006', email: 'david.wilson@email.com' },
    { first_name: 'Lisa', last_name: 'Taylor', relationship: 'mother', phone_cell: '(703) 555-1007', email: 'lisa.taylor@email.com' },
    { first_name: 'Grace', last_name: 'Thomas', relationship: 'mother', phone_cell: '(703) 555-1008', email: 'grace.thomas@email.com' },
    { first_name: 'Kevin', last_name: 'Lee', relationship: 'father', phone_cell: '(703) 555-1009', email: 'kevin.lee@email.com' },
    { first_name: 'Susan', last_name: 'Harris', relationship: 'mother', phone_cell: '(703) 555-1010', email: 'susan.harris@email.com' },
  ];
  const parentIds: number[] = [];
  for (const p of parentsData) {
    const result = sqlite.prepare(
      `INSERT INTO parents (first_name, last_name, relationship, phone_cell, email) VALUES (?, ?, ?, ?, ?)`
    ).run(p.first_name, p.last_name, p.relationship, p.phone_cell, p.email);
    parentIds.push(Number(result.lastInsertRowid));
  }
  console.log(`  Created ${parentIds.length} parents`);

  // ---- CHILD-PARENT LINKS ----
  const links = [
    [childIds[0], parentIds[0]], [childIds[0], parentIds[1]], // Sophia Anderson
    [childIds[1], parentIds[0]], [childIds[1], parentIds[1]], // Liam Anderson
    [childIds[2], parentIds[2]],                              // Emma Brown
    [childIds[3], parentIds[3]], [childIds[3], parentIds[4]], // Noah Garcia
    [childIds[4], parentIds[3]], [childIds[4], parentIds[4]], // Olivia Garcia
    [childIds[5], parentIds[5]],                              // Ava Wilson
    [childIds[6], parentIds[6]],                              // James Taylor
    [childIds[7], parentIds[7]],                              // Mia Thomas
    [childIds[8], parentIds[8]],                              // Benjamin Lee
    [childIds[9], parentIds[9]],                              // Charlotte Harris
  ];
  for (const [cid, pid] of links) {
    sqlite.prepare(`INSERT INTO child_parent (child_id, parent_id) VALUES (?, ?)`).run(cid, pid);
  }
  console.log(`  Created ${links.length} child-parent links`);

  // ---- EMERGENCY CONTACTS ----
  const ecData = [
    { child_id: childIds[0], name: 'Robert Anderson', relationship: 'grandfather', phone: '(703) 555-2001', priority: 1 },
    { child_id: childIds[3], name: 'Rosa Garcia', relationship: 'grandmother', phone: '(703) 555-2002', priority: 1 },
    { child_id: childIds[6], name: 'Mark Taylor', relationship: 'uncle', phone: '(703) 555-2003', priority: 1 },
    { child_id: childIds[9], name: 'Diane Harris', relationship: 'grandmother', phone: '(703) 555-2004', priority: 1 },
  ];
  for (const ec of ecData) {
    sqlite.prepare(
      `INSERT INTO emergency_contacts (child_id, name, relationship, phone, is_authorized_pickup, priority_order) VALUES (?, ?, ?, ?, 1, ?)`
    ).run(ec.child_id, ec.name, ec.relationship, ec.phone, ec.priority);
  }
  console.log(`  Created ${ecData.length} emergency contacts`);

  // ---- SETTINGS ----
  const settingsData: [string, string][] = [
    ['facility_name', 'Ducklings Family Day Home'],
    ['facility_address', '123 Oak Street, Ashburn, VA 20147'],
    ['facility_phone', '(703) 555-0100'],
    ['facility_email', 'info@ducklingsdaycare.com'],
    ['facility_ein', '54-1234567'],
    ['facility_license_number', 'VA-FDH-2024-0042'],
    ['facility_licensed_capacity', '12'],
    ['facility_operating_hours_start', '06:30'],
    ['facility_operating_hours_end', '18:00'],
    ['facility_fiscal_year_start', '01'],
    ['app_name', 'Ducklings Daycare'],
    ['app_subtitle', 'DD'],
    ['app_theme', 'default'],
    ['invoice_due_date_type', 'days_after'],
    ['invoice_due_date_days', '7'],
    ['invoice_letterhead_layout', 'full_width'],
    ['invoice_footer_line1', 'Ducklings Family Day Home'],
    ['invoice_footer_line2', '123 Oak Street, Ashburn, VA 20147 | (703) 555-0100'],
    ['invoice_footer_line3', 'info@ducklingsdaycare.com | EIN: 54-1234567'],
    ['data_retention_days', '365'],
  ];
  for (const [key, value] of settingsData) {
    sqlite.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`).run(key, value);
  }
  console.log(`  Created ${settingsData.length} settings`);

  // ---- ROLE PERMISSIONS ----
  const features = [
    'dashboard', 'children_view', 'children_contacts', 'children_medical',
    'children_edit', 'children_enroll', 'staff_view', 'staff_edit',
    'attendance_checkin', 'attendance_checkout', 'attendance_history', 'attendance_edit_times',
    'billing_view', 'billing_manage', 'meals_view', 'meals_edit',
    'reports_view', 'reports_export', 'settings_view', 'settings_edit',
    'compliance_view', 'compliance_edit',
  ];
  const staffPerms = ['dashboard', 'children_view', 'children_contacts', 'children_medical', 'attendance_checkin', 'attendance_checkout', 'attendance_history', 'meals_view', 'meals_edit', 'compliance_view'];
  const subPerms = ['dashboard', 'children_view', 'attendance_checkin', 'attendance_checkout', 'meals_view'];

  for (const feature of features) {
    sqlite.prepare(`INSERT INTO role_permissions (role, feature, can_access) VALUES ('staff', ?, ?)`).run(feature, staffPerms.includes(feature) ? 1 : 0);
    sqlite.prepare(`INSERT INTO role_permissions (role, feature, can_access) VALUES ('substitute', ?, ?)`).run(feature, subPerms.includes(feature) ? 1 : 0);
  }
  console.log(`  Created role permissions`);

  console.log('Seed complete!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
