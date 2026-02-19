import http from 'http';

const BASE = 'http://localhost:3001';
let sessionCookie = '';

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

async function run() {
  await request('POST', '/api/auth/login', { username: 'admin', pin: '1234' });
  console.log('Logged in');

  const res = await request('PUT', '/api/settings/permissions', { role: 'staff', permissions: { dashboard: true, manage_children: true, manage_billing: false } });
  console.log('Status:', res.status);
  console.log('Data:', JSON.stringify(res.data, null, 2));
}

run().catch(e => console.error('Fatal:', e));
