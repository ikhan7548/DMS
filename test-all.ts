// Comprehensive API Test Script for Daycare Management System
import http from 'http';

const BASE = 'http://localhost:3001';
let sessionCookie = '';
let passed = 0;
let failed = 0;
const failures: string[] = [];

function request(method: string, path: string, body?: any): Promise<{ status: number; data: any; headers: any; raw: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const bodyStr = body ? JSON.stringify(body) : '';
    const options: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        ...(sessionCookie ? { Cookie: sessionCookie } : {}),
      },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const setCookie = res.headers['set-cookie'];
        if (setCookie) sessionCookie = setCookie.map((c: string) => c.split(';')[0]).join('; ');
        try {
          resolve({ status: res.statusCode || 0, data: JSON.parse(data), headers: res.headers, raw: data });
        } catch {
          resolve({ status: res.statusCode || 0, data: null, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', (e) => resolve({ status: 0, data: null, headers: {}, raw: e.message }));
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function test(name: string, ok: boolean, detail?: string) {
  if (ok) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}${detail ? ' - ' + detail : ''}`);
    failed++;
    failures.push(`${name}: ${detail || 'failed'}`);
  }
}

async function run() {
  console.log('═══════════════════════════════════════════');
  console.log('  COMPREHENSIVE API TEST SUITE');
  console.log('═══════════════════════════════════════════\n');

  // ═══ 1. AUTHENTICATION ═══
  console.log('1. AUTHENTICATION');

  const health = await request('GET', '/api/health');
  test('Health check', health.status === 200 && health.data?.status === 'ok');

  const badLogin = await request('POST', '/api/auth/login', { username: 'admin', pin: 'wrong' });
  test('Reject wrong PIN', badLogin.status === 401);

  const login = await request('POST', '/api/auth/login', { username: 'admin', pin: '1234' });
  test('Login admin/1234', login.status === 200 && login.data?.success === true, `status=${login.status}, data=${login.raw?.substring(0,200)}`);

  const session = await request('GET', '/api/auth/session');
  test('Session check', session.data?.authenticated === true, `data=${JSON.stringify(session.data)?.substring(0,200)}`);

  // ═══ 2. DASHBOARD / REPORTS ═══
  console.log('\n2. DASHBOARD');

  const dashboard = await request('GET', '/api/reports/dashboard');
  test('Dashboard loads', dashboard.status === 200 && !dashboard.data?.error, `status=${dashboard.status}, error=${dashboard.data?.error}`);
  if (dashboard.status === 200 && !dashboard.data?.error) {
    test('Dashboard has children stats', dashboard.data?.children !== undefined, `keys: ${Object.keys(dashboard.data || {})}`);
    test('Dashboard has staff stats', dashboard.data?.staff !== undefined);
    test('Dashboard has compliance', dashboard.data?.compliance !== undefined);
    test('Dashboard has billing', dashboard.data?.billing !== undefined);
  }

  // ═══ 3. CHILDREN ═══
  console.log('\n3. CHILDREN');

  const children = await request('GET', '/api/children');
  test('List children', children.status === 200 && Array.isArray(children.data), `status=${children.status}, type=${typeof children.data}, error=${children.data?.error}`);
  const childCount = Array.isArray(children.data) ? children.data.length : 0;
  test('Children seeded', childCount >= 10, `count=${childCount}`);

  if (childCount > 0) {
    const firstChild = children.data[0];
    test('Child has first_name', !!firstChild.first_name, `keys: ${Object.keys(firstChild).join(',')}`);
    test('Child has last_name', !!firstChild.last_name);
    test('Child has date_of_birth', !!firstChild.date_of_birth);
    test('Child has status', !!firstChild.status);

    const childDetail = await request('GET', `/api/children/${firstChild.id}`);
    test('Get child detail', childDetail.status === 200 && !childDetail.data?.error, `status=${childDetail.status}, error=${childDetail.data?.error}`);
    if (childDetail.status === 200 && !childDetail.data?.error) {
      test('Detail has parents', Array.isArray(childDetail.data?.parents), `type=${typeof childDetail.data?.parents}`);
      test('Detail has emergencyContacts', Array.isArray(childDetail.data?.emergencyContacts), `type=${typeof childDetail.data?.emergencyContacts}`);
      test('Detail has immunizations', Array.isArray(childDetail.data?.immunizations), `type=${typeof childDetail.data?.immunizations}`);
      test('Detail has authorizedPickups', Array.isArray(childDetail.data?.authorizedPickups), `type=${typeof childDetail.data?.authorizedPickups}`);
    }
  }

  // Test create child
  const newChild = await request('POST', '/api/children', {
    first_name: 'TestChild', last_name: 'TestLast', date_of_birth: '2023-06-15',
    sex: 'male', expected_schedule: 'full_time',
  });
  test('Create child', newChild.status === 201 && (newChild.data?.success || newChild.data?.id), `status=${newChild.status}, data=${JSON.stringify(newChild.data)?.substring(0,200)}`);

  // ═══ 4. STAFF ═══
  console.log('\n4. STAFF');

  const staff = await request('GET', '/api/staff');
  test('List staff', staff.status === 200 && Array.isArray(staff.data), `status=${staff.status}, error=${staff.data?.error}`);
  const staffCount = Array.isArray(staff.data) ? staff.data.length : 0;
  test('Staff seeded', staffCount >= 5, `count=${staffCount}`);

  if (staffCount > 0) {
    const firstStaff = staff.data[0];
    test('Staff has first_name', !!firstStaff.first_name);
    test('Staff has position', firstStaff.position !== undefined);

    const staffDetail = await request('GET', `/api/staff/${firstStaff.id}`);
    test('Get staff detail', staffDetail.status === 200 && !staffDetail.data?.error, `status=${staffDetail.status}, error=${staffDetail.data?.error}`);
    if (staffDetail.status === 200 && !staffDetail.data?.error) {
      test('Detail has certifications', Array.isArray(staffDetail.data?.certifications), `type=${typeof staffDetail.data?.certifications}`);
      test('Detail has backgroundChecks', Array.isArray(staffDetail.data?.backgroundChecks), `type=${typeof staffDetail.data?.backgroundChecks}`);
    }
  }

  // ═══ 5. PARENTS ═══
  console.log('\n5. PARENTS');

  const parents = await request('GET', '/api/parents');
  test('List parents', parents.status === 200 && Array.isArray(parents.data), `status=${parents.status}, error=${parents.data?.error}`);
  test('Parents seeded', Array.isArray(parents.data) && parents.data.length >= 10, `count=${parents.data?.length}`);

  // ═══ 6. ATTENDANCE ═══
  console.log('\n6. ATTENDANCE');

  const todayChildren = await request('GET', '/api/attendance/today/children');
  test('Today children list', todayChildren.status === 200 && Array.isArray(todayChildren.data), `status=${todayChildren.status}, error=${todayChildren.data?.error}`);

  const todayStaff = await request('GET', '/api/attendance/today/staff');
  test('Today staff list', todayStaff.status === 200 && Array.isArray(todayStaff.data), `status=${todayStaff.status}, error=${todayStaff.data?.error}`);

  // Check-in a child
  if (Array.isArray(todayChildren.data) && todayChildren.data.length > 0) {
    const unchecked = todayChildren.data.find((c: any) => !c.checked_in);
    if (unchecked) {
      const checkin = await request('POST', '/api/attendance/children/checkin', { childId: unchecked.id });
      test('Check in child', checkin.status === 200 && checkin.data?.success, `status=${checkin.status}, data=${JSON.stringify(checkin.data)?.substring(0,200)}`);

      if (checkin.data?.id) {
        const checkout = await request('POST', `/api/attendance/children/${checkin.data.id}/checkout`);
        test('Check out child', checkout.status === 200 && checkout.data?.success, `data=${JSON.stringify(checkout.data)}`);
      }
    }
  }

  // Clock-in a staff
  if (Array.isArray(todayStaff.data) && todayStaff.data.length > 0) {
    const unclocked = todayStaff.data.find((s: any) => !s.clocked_in);
    if (unclocked) {
      const clockin = await request('POST', '/api/attendance/staff/clockin', { staffId: unclocked.id });
      test('Clock in staff', clockin.status === 200 && clockin.data?.success, `status=${clockin.status}, data=${JSON.stringify(clockin.data)?.substring(0,200)}`);

      if (clockin.data?.id) {
        const clockout = await request('POST', `/api/attendance/staff/${clockin.data.id}/clockout`);
        test('Clock out staff', clockout.status === 200 && clockout.data?.success, `data=${JSON.stringify(clockout.data)}`);
      }
    }
  }

  const points = await request('GET', '/api/attendance/points');
  test('Virginia Points', points.status === 200 && points.data?.totalPoints !== undefined, `status=${points.status}, error=${points.data?.error}`);

  const history = await request('GET', '/api/attendance/history?startDate=2025-01-01&endDate=2026-12-31');
  test('Attendance history', history.status === 200 && Array.isArray(history.data), `status=${history.status}, error=${history.data?.error}`);

  // ═══ 7. BILLING ═══
  console.log('\n7. BILLING');

  const fees = await request('GET', '/api/billing/fees');
  test('List fees', fees.status === 200 && Array.isArray(fees.data), `status=${fees.status}, error=${fees.data?.error}`);

  const invoices = await request('GET', '/api/billing/invoices');
  test('List invoices', invoices.status === 200 && Array.isArray(invoices.data), `status=${invoices.status}, error=${invoices.data?.error}`);

  // Create invoice
  const parentForInv = Array.isArray(parents.data) ? parents.data[0] : null;
  if (parentForInv) {
    const inv = await request('POST', '/api/billing/invoices', {
      family_id: parentForInv.id,
      due_date: '2026-03-01', period_start: '2026-02-01', period_end: '2026-02-28',
      lineItems: [{ description: 'Weekly Tuition', item_type: 'tuition', unit_price: 300, quantity: 1 }],
    });
    test('Create invoice', inv.status === 200 && (inv.data?.success || inv.data?.id), `status=${inv.status}, data=${JSON.stringify(inv.data)?.substring(0,300)}`);

    if (inv.data?.id) {
      const invDetail = await request('GET', `/api/billing/invoices/${inv.data.id}`);
      test('Get invoice detail', invDetail.status === 200 && !invDetail.data?.error, `status=${invDetail.status}, error=${invDetail.data?.error}`);

      // Record payment
      const payment = await request('POST', '/api/billing/payments', {
        invoice_id: inv.data.id, amount: 150, method: 'cash',
      });
      test('Record payment', payment.status === 200 && (payment.data?.success || payment.data?.id), `status=${payment.status}, data=${JSON.stringify(payment.data)?.substring(0,200)}`);
    }
  }

  const payments = await request('GET', '/api/billing/payments');
  test('List payments', payments.status === 200 && Array.isArray(payments.data), `status=${payments.status}, error=${payments.data?.error}`);

  const aging = await request('GET', '/api/billing/aging');
  test('Aging report', aging.status === 200 && aging.data?.totals !== undefined, `status=${aging.status}, error=${aging.data?.error}`);

  // ═══ 8. REPORTS ═══
  console.log('\n8. REPORTS');

  const attReport = await request('GET', '/api/reports/attendance?startDate=2025-01-01&endDate=2026-12-31');
  test('Attendance report', attReport.status === 200 && !attReport.data?.error, `status=${attReport.status}, error=${attReport.data?.error}`);

  const finReport = await request('GET', '/api/reports/financial?startDate=2025-01-01&endDate=2026-12-31');
  test('Financial report', finReport.status === 200 && !finReport.data?.error, `status=${finReport.status}, error=${finReport.data?.error}`);

  const compReport = await request('GET', '/api/reports/compliance');
  test('Compliance report', compReport.status === 200 && !compReport.data?.error, `status=${compReport.status}, error=${compReport.data?.error}`);

  const csvExport = await request('GET', '/api/reports/export/attendance?startDate=2025-01-01&endDate=2026-12-31&type=children');
  test('CSV export', csvExport.status === 200, `status=${csvExport.status}`);

  // ═══ 9. SETTINGS ═══
  console.log('\n9. SETTINGS');

  const settings = await request('GET', '/api/settings');
  test('Get settings', settings.status === 200 && typeof settings.data === 'object' && !settings.data?.error, `status=${settings.status}, error=${settings.data?.error}`);

  const users = await request('GET', '/api/settings/users');
  test('List users', users.status === 200 && Array.isArray(users.data), `status=${users.status}, error=${users.data?.error}`);

  const auditLog = await request('GET', '/api/settings/audit-log');
  test('Audit log', auditLog.status === 200 && Array.isArray(auditLog.data), `status=${auditLog.status}, error=${auditLog.data?.error}`);

  const backups = await request('GET', '/api/settings/backups');
  test('List backups', backups.status === 200 && Array.isArray(backups.data), `status=${backups.status}, error=${backups.data?.error}`);

  const incidents = await request('GET', '/api/settings/incidents');
  test('List incidents', incidents.status === 200 && Array.isArray(incidents.data), `status=${incidents.status}, error=${incidents.data?.error}`);

  const medications = await request('GET', '/api/settings/medications');
  test('List medications', medications.status === 200 && Array.isArray(medications.data), `status=${medications.status}, error=${medications.data?.error}`);

  const meals = await request('GET', '/api/settings/meals');
  test('List meals', meals.status === 200 && Array.isArray(meals.data), `status=${meals.status}, error=${meals.data?.error}`);

  // Logout
  const logout = await request('POST', '/api/auth/logout');
  test('Logout', logout.status === 200);

  const afterLogout = await request('GET', '/api/children');
  test('Rejected after logout', afterLogout.status === 401);

  // ═══ SUMMARY ═══
  console.log('\n═══════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════');

  if (failures.length > 0) {
    console.log('\nFAILURES:');
    failures.forEach(f => console.log(`  ❌ ${f}`));
  }

  process.exit(failed > 0 ? 1 : 0);
}

run();
