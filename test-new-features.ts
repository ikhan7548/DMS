import http from 'http';

const BASE = 'http://localhost:3001';
let sessionCookie = '';
let passed = 0, failed = 0;

function request(method: string, path: string, body?: any): Promise<{ status: number; data: any; headers: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const bodyStr = body ? JSON.stringify(body) : '';
    const options: http.RequestOptions = {
      hostname: url.hostname, port: url.port, path: url.pathname + url.search,
      method, headers: { 'Content-Type': 'application/json', ...(sessionCookie ? { Cookie: sessionCookie } : {}), ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}) },
    };
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        if (res.headers['set-cookie']) sessionCookie = res.headers['set-cookie'].map((c) => c.split(';')[0]).join('; ');
        try { resolve({ status: res.statusCode!, data: JSON.parse(raw || '{}'), headers: res.headers }); } catch { resolve({ status: res.statusCode!, data: raw, headers: res.headers }); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function ok(msg: string) { console.log(`  \u2705 ${msg}`); passed++; }
function fail(msg: string) { console.log(`  \u274C ${msg}`); failed++; }

async function run() {
  console.log('NEW FEATURE API TESTS\n');

  // Login
  await request('POST', '/api/auth/login', { username: 'admin', pin: '1234' });
  console.log('Logged in\n');

  // 1. Attendance history add
  const addAtt = await request('POST', '/api/attendance/history', { type: 'child', entityId: 1, date: '2025-01-15', checkIn: '08:00', checkOut: '15:00', notes: 'test' });
  addAtt.data.success ? ok('Add attendance record') : fail('Add attendance record');

  // 2. Attendance delete
  const hist = await request('GET', '/api/attendance/history?startDate=2025-01-15&endDate=2025-01-15&type=children');
  if (hist.data.length > 0) {
    const delAtt = await request('DELETE', `/api/attendance/${hist.data[0].id}?type=child`);
    delAtt.data.success ? ok('Delete attendance record') : fail('Delete attendance record');
  } else fail('Delete attendance - no records found');

  // 3. Fee CRUD
  const crFee = await request('POST', '/api/billing/fees', { name: 'TestFee', age_group: 'infant', schedule_type: 'full_time', weekly_rate: 300, effective_date: '2025-01-01' });
  crFee.data.success ? ok('Create fee tier') : fail('Create fee tier');
  const feeId = crFee.data.id;

  const upFee = await request('PUT', `/api/billing/fees/${feeId}`, { name: 'Updated', age_group: 'infant', schedule_type: 'full_time', weekly_rate: 350, is_active: 1 });
  upFee.data.success ? ok('Update fee tier') : fail('Update fee tier');

  const delFee = await request('DELETE', `/api/billing/fees/${feeId}`);
  delFee.data.success ? ok('Delete fee tier') : fail('Delete fee tier');

  // 4. Family accounts
  const fam = await request('GET', '/api/billing/families');
  Array.isArray(fam.data) ? ok(`Family accounts list (${fam.data.length} families)`) : fail('Family accounts list');

  // 5. Role permissions
  const perms = await request('GET', '/api/settings/permissions');
  Array.isArray(perms.data) ? ok('Get role permissions') : fail('Get role permissions');

  const setPerms = await request('PUT', '/api/settings/permissions', { role: 'staff', permissions: { dashboard: true, manage_children: true, manage_billing: false } });
  setPerms.data.success ? ok('Set role permissions') : fail('Set role permissions');

  // 6. Invoice line item CRUD
  const inv = await request('POST', '/api/billing/invoices', { family_id: 1, due_date: '2025-02-28', period_start: '2025-02-01', period_end: '2025-02-28', lineItems: [], notes: 'test' });
  const invId = inv.data.id;

  const addLi = await request('POST', `/api/billing/invoices/${invId}/line-items`, { description: 'Test Tuition', item_type: 'tuition', quantity: 1, unit_price: 250 });
  addLi.data.success ? ok('Add invoice line item') : fail('Add invoice line item');
  const lineId = addLi.data.id;

  const upLi = await request('PUT', `/api/billing/invoices/${invId}/line-items/${lineId}`, { description: 'Updated Tuition', item_type: 'tuition', quantity: 2, unit_price: 250 });
  upLi.data.success ? ok('Update invoice line item') : fail('Update invoice line item');

  const detail = await request('GET', `/api/billing/invoices/${invId}`);
  detail.data.subtotal === 500 ? ok('Invoice totals recalculated (subtotal=500)') : fail(`Invoice totals wrong: ${detail.data.subtotal}`);

  const delLi = await request('DELETE', `/api/billing/invoices/${invId}/line-items/${lineId}`);
  delLi.data.success ? ok('Delete invoice line item') : fail('Delete invoice line item');

  // 7. Payment methods
  const pm = await request('GET', '/api/billing/payment-methods');
  Array.isArray(pm.data) ? ok(`Payment methods (${pm.data.length} active)`) : fail('Payment methods');

  // 8. Payment methods all
  const pmAll = await request('GET', '/api/billing/payment-methods/all');
  Array.isArray(pmAll.data) ? ok(`Payment methods all (${pmAll.data.length} total)`) : fail('Payment methods all');

  console.log(`\n${'='.repeat(45)}`);
  console.log(`  NEW FEATURE TESTS: ${passed} passed, ${failed} failed`);
  console.log(`${'='.repeat(45)}`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => { console.error('Fatal:', e); process.exit(1); });
