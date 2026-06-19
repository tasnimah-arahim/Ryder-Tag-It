import http from 'node:http';
import { randomUUID } from 'node:crypto';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';

const PORT    = process.env.PORT    || 3000;
const RP_NAME = process.env.RP_NAME || 'Ryder Kiosk';
const RP_ID   = process.env.RP_ID   || 'localhost';
const ORIGIN  = process.env.ORIGIN  || 'http://localhost:5173';

const SN_INSTANCE_URL = process.env.SN_INSTANCE_URL || '';
const SN_USER         = process.env.SN_USER         || '';
const SN_PASSWORD     = process.env.SN_PASSWORD     || '';

// In-memory store — swap for a real DB in production.
const users      = new Map(); // employeeId -> { id, name, department, credentials[] }
const challenges = new Map(); // employeeId -> challengeString
const sessions   = new Map(); // token -> { employeeId, name, createdAt }

const SEED_EMPLOYEES = [
  { id: '10001', name: 'Carlos Mendez',   department: 'Receiving' },
  { id: '10002', name: 'Tamara Williams', department: 'Shipping'  },
  { id: '10003', name: 'James Okafor',    department: 'Inventory' },
  { id: '10004', name: 'Linda Pham',      department: 'Receiving' },
  { id: '10005', name: 'Derek Hughes',    department: 'Shipping'  },
];

for (const emp of SEED_EMPLOYEES) {
  users.set(emp.id, { id: emp.id, name: emp.name, department: emp.department, credentials: [] });
}

function getOrCreateUser(employeeId) {
  if (!users.has(employeeId)) {
    users.set(employeeId, { id: employeeId, name: `Employee ${employeeId}`, department: 'Unknown', credentials: [] });
  }
  return users.get(employeeId);
}

function send(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(raw)); }
      catch { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

function toJSONSafe(obj) {
  return JSON.parse(JSON.stringify(obj, (_k, v) =>
    (v instanceof Uint8Array ? Buffer.from(v).toString('base64url') : v)
  ));
}

// ── Session helpers ───────────────────────────────────────────────────────────

function issueSession(employeeId, name) {
  const token = randomUUID();
  sessions.set(token, { employeeId, name, createdAt: Date.now() });
  return token;
}

function getSession(req) {
  const auth = req.headers['authorization'];
  if (!auth?.startsWith('Bearer ')) return null;
  return sessions.get(auth.slice(7)) ?? null;
}

function requireSession(req, res) {
  const session = getSession(req);
  if (!session) { send(res, 401, { error: 'Authentication required' }); return null; }
  return session;
}

// ── ServiceNow proxy helper ───────────────────────────────────────────────────

function serviceNowFetch(path, options = {}) {
  if (!SN_INSTANCE_URL || !SN_USER || !SN_PASSWORD) {
    throw new Error('ServiceNow env vars (SN_INSTANCE_URL, SN_USER, SN_PASSWORD) are not set');
  }
  const auth = Buffer.from(`${SN_USER}:${SN_PASSWORD}`).toString('base64');
  return fetch(`${SN_INSTANCE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
      ...(options.headers ?? {}),
    },
  });
}

const server = http.createServer(async (req, res) => {
  const url      = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;
  const method   = req.method;

  try {
    // ── Registration ─────────────────────────────────────────────────────────

    if (method === 'GET' && pathname === '/api/register/options') {
      const employeeId = url.searchParams.get('employeeId');
      if (!employeeId) return send(res, 400, { error: 'employeeId is required' });

      const user = getOrCreateUser(employeeId);
      const options = await generateRegistrationOptions({
        rpName:          RP_NAME,
        rpID:            RP_ID,
        userID:          Buffer.from(employeeId, 'utf8'),
        userName:        employeeId,
        userDisplayName: user.name,
        attestationType: 'none',
        authenticatorSelection: {
          authenticatorAttachment: 'cross-platform',
          residentKey:             'discouraged',
          userVerification:        'discouraged',
        },
        excludeCredentials: user.credentials.map(c => ({
          id:         c.id,
          transports: c.transports,
        })),
        timeout: 60000,
      });

      challenges.set(employeeId, options.challenge);
      console.log(`[register/options] Challenge issued for employee ${employeeId}`);
      return send(res, 200, toJSONSafe(options));
    }

    if (method === 'POST' && pathname === '/api/register/verify') {
      let body;
      try { body = await readBody(req); } catch (e) { return send(res, 400, { error: e.message }); }

      const { employeeId, response } = body;
      if (!employeeId || !response) {
        return send(res, 400, { error: 'employeeId and response are required' });
      }

      const currentChallenge = challenges.get(employeeId);
      if (!currentChallenge) {
        return send(res, 400, { error: 'No active challenge – call /api/register/options first' });
      }

      const { verified, registrationInfo } = await verifyRegistrationResponse({
        response,
        expectedChallenge:       currentChallenge,
        expectedOrigin:          ORIGIN,
        expectedRPID:            RP_ID,
        requireUserVerification: false,
      });

      if (verified && registrationInfo) {
        const { id, publicKey, counter, transports } = registrationInfo.credential;
        const user = getOrCreateUser(employeeId);
        user.credentials.push({
          id,
          publicKey,
          counter,
          transports: transports ?? response.response?.transports ?? [],
        });
        challenges.delete(employeeId);
        console.log(`[register/verify] Employee ${employeeId} registered credential`);
        return send(res, 200, { verified: true, message: 'YubiKey registered successfully!' });
      }

      return send(res, 400, { verified: false, error: 'Verification failed' });
    }

    // ── Authentication ────────────────────────────────────────────────────────

    if (method === 'GET' && pathname === '/api/auth/options') {
      const employeeId = url.searchParams.get('employeeId');
      if (!employeeId) return send(res, 400, { error: 'employeeId is required' });

      const user = users.get(employeeId);
      if (!user || user.credentials.length === 0) {
        return send(res, 404, { error: 'No registered credentials found for this Employee ID. Please register first.' });
      }

      const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        allowCredentials: user.credentials.map(c => ({
          id:         c.id,
          transports: c.transports?.length ? c.transports : ['usb'],
        })),
        userVerification: 'discouraged',
        timeout: 60000,
      });

      challenges.set(employeeId, options.challenge);
      console.log(`[auth/options] Challenge issued for employee ${employeeId}`);
      return send(res, 200, options);
    }

    if (method === 'POST' && pathname === '/api/auth/verify') {
      let body;
      try { body = await readBody(req); } catch (e) { return send(res, 400, { error: e.message }); }

      const { employeeId, response } = body;
      if (!employeeId || !response) {
        return send(res, 400, { error: 'employeeId and response are required' });
      }

      const currentChallenge = challenges.get(employeeId);
      if (!currentChallenge) {
        return send(res, 400, { error: 'No active challenge – call /api/auth/options first' });
      }

      const user = users.get(employeeId);
      const cred = user?.credentials.find(c => c.id === response.id);
      if (!cred) {
        return send(res, 400, { error: 'Credential not found. Please register your YubiKey first.' });
      }

      const { verified, authenticationInfo } = await verifyAuthenticationResponse({
        response,
        expectedChallenge:       currentChallenge,
        expectedOrigin:          ORIGIN,
        expectedRPID:            RP_ID,
        requireUserVerification: false,
        credential: {
          id:         cred.id,
          publicKey:  cred.publicKey,
          counter:    cred.counter,
          transports: cred.transports,
        },
      });

      if (verified) {
        cred.counter = authenticationInfo.newCounter;
        challenges.delete(employeeId);
        const userData = users.get(employeeId);
        const token = issueSession(employeeId, userData?.name);
        console.log(`[auth/verify] Employee ${employeeId} authenticated`);
        return send(res, 200, {
          verified:   true,
          employeeId,
          name:       userData?.name,
          token,
          message:    `Welcome, ${userData?.name || 'Employee ' + employeeId}!`,
        });
      }

      return send(res, 400, { verified: false, error: 'Authentication failed' });
    }

    // Issues a session for Okta/Auth0-authenticated users.
    // The Auth0 access token is not verified server-side here; add JWT validation
    // via the Auth0 JWKS endpoint before deploying to production.
    if (method === 'POST' && pathname === '/api/auth/session') {
      let body;
      try { body = await readBody(req); } catch (e) { return send(res, 400, { error: e.message }); }
      const token = issueSession(body.sub || 'okta-user', body.name || 'Staff');
      console.log(`[auth/session] Session issued for Okta user ${body.sub || 'unknown'}`);
      return send(res, 200, { token });
    }

    // ── ServiceNow proxy (session required on all routes) ─────────────────────

    if (method === 'GET' && pathname === '/api/warehouses') {
      if (!requireSession(req, res)) return;

      const code = url.searchParams.get('code');
      let snPath;
      if (code) {
        snPath = `/api/now/table/x_rys_rydertag_warehouses_db?sysparm_query=warehouse_code%3D${encodeURIComponent(code)}&sysparm_limit=1`;
      } else {
        snPath = '/api/now/table/x_rys_rydertag_warehouses_db?sysparm_fields=warehouse_code%2Cname&sysparm_limit=500';
      }

      const snRes  = await serviceNowFetch(snPath);
      const snData = await snRes.json();
      if (!snRes.ok) return send(res, snRes.status, { error: snData.error?.message || 'ServiceNow error' });
      return send(res, 200, snData.result ?? []);
    }

    if (method === 'GET' && pathname === '/api/devices') {
      if (!requireSession(req, res)) return;

      const warehouseCode = url.searchParams.get('warehouse');
      if (!warehouseCode) return send(res, 400, { error: 'warehouse query param is required' });

      const snPath = `/api/now/table/x_rys_rydertag_warehouse_devices_db`
        + `?sysparm_fields=device_type&sysparm_display_value=all`
        + `&sysparm_query=warehouse.warehouse_code%3D${encodeURIComponent(warehouseCode)}`
        + `&sysparm_limit=100`;

      const snRes  = await serviceNowFetch(snPath);
      const snData = await snRes.json();
      if (!snRes.ok) return send(res, snRes.status, { error: snData.error?.message || 'ServiceNow error' });

      const devices = (snData.result ?? []).map(r => ({
        value: r.device_type?.display_value ?? r.device_type?.value ?? r.device_type,
      }));
      return send(res, 200, devices);
    }

    if (method === 'GET' && pathname === '/api/issues') {
      if (!requireSession(req, res)) return;

      const warehouseCode = url.searchParams.get('warehouse');
      if (!warehouseCode) return send(res, 400, { error: 'warehouse query param is required' });

      const device = url.searchParams.get('device');
      let query = `warehouse.warehouse_code%3D${encodeURIComponent(warehouseCode)}`;
      if (device) query += `%5Edevice_type%3D${encodeURIComponent(device)}`;

      const snPath = `/api/now/table/x_rys_rydertag_warehouse_questions_db`
        + `?sysparm_fields=issue_questions&sysparm_display_value=all`
        + `&sysparm_query=${query}`
        + `&sysparm_limit=100`;

      const snRes  = await serviceNowFetch(snPath);
      const snData = await snRes.json();
      if (!snRes.ok) return send(res, snRes.status, { error: snData.error?.message || 'ServiceNow error' });

      const issues = (snData.result ?? []).map(r => ({
        en: r.issue_questions?.display_value ?? r.issue_questions?.value ?? r.issue_questions,
      }));
      return send(res, 200, issues);

      const devices = (snData.result ?? []).map(r => ({
        en: r.device_questions?.display_value ?? r.device_questions?.value ?? r.device_questions,
      }));
      return send(res, 200, devices);
    }

    if (method === 'POST' && pathname === '/api/submit') {
      const session = requireSession(req, res);
      if (!session) return;

      let body;
      try { body = await readBody(req); } catch (e) { return send(res, 400, { error: e.message }); }

      if (!body.warehouse) return send(res, 400, { error: 'warehouse is required' });

      const locationParts = [
        body.stationNumber    && `Station ${body.stationNumber}`,
        body.workstationNumber && `WS ${body.workstationNumber}`,
        body.dockDoorNumber   && `Door ${body.dockDoorNumber}`,
        body.area,
      ].filter(Boolean);

      const ticket = {
        incident_severity:    '3',
        device:               body.device           ?? '',
        warehouse:            body.warehouse,
        other:                '',
        specific_location:    locationParts.join(', ') || 'Unspecified',
        issue_type:           body.issueCategory    ?? '',
        incident_commander:   body.reporterName     || session.name || 'Kiosk User'
      };

      const snRes  = await serviceNowFetch('/api/now/table/x_rys_rydertag_ticket', {
        method: 'POST',
        body:   JSON.stringify(ticket),
      });
      const snData = await snRes.json();
      if (!snRes.ok) return send(res, snRes.status, { error: snData.error?.message || 'ServiceNow error' });

      console.log(`[submit] Ticket created for warehouse ${body.warehouse} by ${session.name}`);
      return send(res, 201, { success: true, result: snData.result });
    }

    // ── Debug endpoints ───────────────────────────────────────────────────────

    if (method === 'GET' && pathname === '/api/employees') {
      const list = [...users.entries()].map(([id, u]) => ({
        employeeId: id,
        name:       u.name,
        department: u.department,
        registered: u.credentials.length > 0,
      }));
      return send(res, 200, list);
    }

    if (method === 'GET' && pathname === '/api/users') {
      const list = [...users.entries()].map(([id, u]) => ({
        employeeId:      id,
        credentialCount: u.credentials.length,
      }));
      return send(res, 200, list);
    }

    res.writeHead(404); res.end('Not Found');

  } catch (err) {
    console.error('[server]', err.message);
    send(res, 500, { error: 'Internal server error' });
  }
});

server.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   Ryder YubiKey Kiosk – API Server   ║');
  console.log('╚══════════════════════════════════════╝');
  console.log(`  API URL : http://localhost:${PORT}`);
  console.log(`  RP ID   : ${RP_ID}`);
  console.log(`  Origin  : ${ORIGIN}`);
  console.log(`  SN URL  : ${SN_INSTANCE_URL || '(not set — set SN_INSTANCE_URL)'}`);
  console.log('  Store   : In-memory (resets on restart)');
  console.log('');
  console.log('  Requests are proxied from Vite (localhost:5173) — no CORS needed.');
  console.log('  To override: export ORIGIN=<your-origin> before starting.\n');
});
