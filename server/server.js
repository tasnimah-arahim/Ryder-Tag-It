import http from 'node:http';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';

const PORT    = process.env.PORT    || 3000;
const RP_NAME = process.env.RP_NAME || 'Ryder Kiosk';
const RP_ID   = process.env.RP_ID   || 'localhost';
// Default ORIGIN matches the Vite dev server so WebAuthn works without extra config.
// In production, set to your full HTTPS origin (e.g. https://kiosk.ryder.com).
// RP_ID must be the bare domain (no protocol/port); ORIGIN is the full origin.
const ORIGIN  = process.env.ORIGIN  || 'http://localhost:5173';

// In-memory store — swap for a real DB in production.
// users:      Map<employeeId, { id, name, department, credentials[] }>
// challenges: Map<employeeId, challengeString>
const users      = new Map();
const challenges = new Map();

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

// Converts Uint8Array / Buffer values to base64url so JSON.stringify never drops binary fields.
function toJSONSafe(obj) {
  return JSON.parse(JSON.stringify(obj, (_k, v) =>
    (v instanceof Uint8Array ? Buffer.from(v).toString('base64url') : v)
  ));
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
        // v11: credential fields are nested under registrationInfo.credential
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
        // v11: field renamed from 'authenticator' to 'credential'; keys renamed too
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
        console.log(`[auth/verify] Employee ${employeeId} authenticated`);
        return send(res, 200, {
          verified:   true,
          employeeId,
          name:       userData?.name,
          message:    `Welcome, ${userData?.name || 'Employee ' + employeeId}!`,
        });
      }

      return send(res, 400, { verified: false, error: 'Authentication failed' });
    }

    // ── Debug endpoints — gate behind auth in production ─────────────────────

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
  console.log('  Store   : In-memory (resets on restart)');
  console.log('');
  console.log('  Requests are proxied from Vite (localhost:5173) — no CORS needed.');
  console.log('  To override: export ORIGIN=<your-origin> before starting.\n');
});
