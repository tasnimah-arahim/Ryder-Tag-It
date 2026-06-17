import { useState, useEffect } from 'react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { ArrowLeft, Key } from 'lucide-react';

const STATUS_STYLES = {
  success: { background: '#f0fdf4', color: '#166534', border: '1.5px solid #bbf7d0' },
  error:   { background: '#fef2f2', color: '#991b1b', border: '1.5px solid #fecaca' },
  info:    { background: '#eff6ff', color: '#1e40af', border: '1.5px solid #bfdbfe' },
  loading: { background: '#fefce8', color: '#713f12', border: '1.5px solid #fef08a' },
};

export function YubiKeySignIn({ onSuccess, onBack }) {
  const [employeeId, setEmployeeId] = useState('');
  const [status, setStatus] = useState(null);
  const [roster, setRoster] = useState([]);
  const [webAuthnSupported] = useState(() => !!window.PublicKeyCredential);

  // Fetch for button clicks / doRegister refreshes
  async function loadRoster() {
    try {
      const res = await fetch('/api/employees');
      setRoster(await res.json());
    } catch {
      setRoster([]);
    }
  }

  // Initial mount load — fetch is started in the effect body; setState happens
  // asynchronously inside the .then() callback, not synchronously in the effect.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/employees')
      .then(r => r.json())
      .then(list => { if (!cancelled) setRoster(list); })
      .catch(() => { if (!cancelled) setRoster([]); });
    return () => { cancelled = true; };
  }, []);

  function showStatus(message, type) {
    setStatus({ message, type });
  }

  async function doRegister(empId) {
    showStatus(`Starting key registration for employee ${empId}…`, 'loading');
    try {
      const optRes = await fetch(`/api/register/options?employeeId=${encodeURIComponent(empId)}`);
      const options = await optRes.json();
      if (options.error) throw new Error(options.error);

      showStatus('Insert the YubiKey and touch the contact when it flashes…', 'info');
      const regResponse = await startRegistration({ optionsJSON: options });

      showStatus('Verifying with server…', 'loading');
      const verifyRes = await fetch('/api/register/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ employeeId: empId, response: regResponse }),
      });
      const result = await verifyRes.json();

      if (result.verified) {
        showStatus(`${result.message} Employee ${empId} can now sign in.`, 'success');
        loadRoster();
      } else {
        showStatus(`Registration failed: ${result.error}`, 'error');
      }
    } catch (err) {
      showStatus(
        err.name === 'NotAllowedError' ? 'Request cancelled or timed out. Please try again.' : err.message,
        'error',
      );
    }
  }

  async function doSignIn() {
    const id = employeeId.trim();
    if (!id) { showStatus('Please enter your Employee ID.', 'error'); return; }

    showStatus('Requesting authentication options…', 'loading');
    try {
      const optRes = await fetch(`/api/auth/options?employeeId=${encodeURIComponent(id)}`);
      const options = await optRes.json();
      if (optRes.status === 404) {
        showStatus('No YubiKey registered for this Employee ID. Use the "Register" button in the roster below to set up your key first.', 'info');
        return;
      }
      if (options.error) throw new Error(options.error);

      showStatus('Insert your YubiKey and touch the contact when it flashes…', 'info');
      const authResponse = await startAuthentication({ optionsJSON: options });

      showStatus('Verifying…', 'loading');
      const verifyRes = await fetch('/api/auth/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ employeeId: id, response: authResponse }),
      });
      const result = await verifyRes.json();

      if (result.verified) {
        showStatus(result.message, 'success');
        onSuccess({ method: 'yubikey', employeeId: result.employeeId, name: result.name });
      } else {
        showStatus(`Authentication failed: ${result.error}`, 'error');
      }
    } catch (err) {
      showStatus(
        err.name === 'NotAllowedError' ? 'Request cancelled or timed out. Please try again.' : err.message,
        'error',
      );
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#cc0000', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header
        className="flex items-center gap-3 px-5 shrink-0"
        style={{ background: 'white', height: '52px', borderBottom: '1px solid #e8e8e8' }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all active:scale-95"
          style={{ background: '#f0f0f0', color: '#1a1a1a', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={15} />
          <span style={{ fontWeight: 700, fontSize: '13px' }}>Back</span>
        </button>

        <div className="flex items-center gap-0.5">
          <span style={{ fontWeight: 800, fontSize: '20px', color: '#cc0000', letterSpacing: '-0.5px' }}>Ryder</span>
          <span style={{ fontWeight: 800, fontSize: '20px', color: '#6b6b6b', letterSpacing: '-0.5px' }}>Tag</span>
        </div>
        <span style={{ color: '#d0d0d0', fontSize: '16px' }}>·</span>
        <span style={{ color: '#4a4a4a', fontWeight: 600, fontSize: '14px' }}>YubiKey Sign In</span>

        <span
          className="ml-auto rounded-full px-3 py-1 text-xs font-bold"
          style={webAuthnSupported
            ? { background: '#dcfce7', color: '#166534' }
            : { background: '#fef2f2', color: '#991b1b' }}
        >
          {webAuthnSupported ? 'WebAuthn Ready' : 'WebAuthn Not Supported'}
        </span>
      </header>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto flex flex-col items-center gap-5 p-5">

        {/* Sign-in card */}
        <div
          className="w-full rounded-3xl overflow-hidden"
          style={{ maxWidth: '400px', background: 'white', boxShadow: '0 4px 24px rgba(0,0,0,0.15)', borderTop: '4px solid #cc0000' }}
        >
          <div className="p-8 flex flex-col gap-5">
            <div className="text-center">
              <div className="flex items-center justify-center rounded-full mx-auto mb-3"
                   style={{ width: 56, height: 56, background: '#fff1f1' }}>
                <Key size={26} style={{ color: '#cc0000' }} />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Sign In</h2>
              <p style={{ color: '#9a9a9a', fontSize: '14px', margin: '4px 0 0' }}>
                Enter your ID, then touch your YubiKey
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#9a9a9a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Employee PIN
              </label>
              <input
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSignIn()}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="e.g. 10001"
                style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  fontSize: '24px',
                  textAlign: 'center',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  width: '100%',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = '#cc0000'; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
              />
            </div>

            <button
              onClick={doSignIn}
              className="rounded-2xl transition-all active:scale-95"
              style={{
                background: '#cc0000',
                color: 'white',
                fontWeight: 700,
                fontSize: '18px',
                padding: '18px 0',
                width: '100%',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(204,0,0,0.3)',
              }}
            >
              Sign In with YubiKey
            </button>
          </div>
        </div>

        {/* Status */}
        {status && (
          <div
            className="w-full rounded-2xl px-6 py-4 text-center font-semibold"
            style={{ maxWidth: '400px', fontSize: '15px', ...STATUS_STYLES[status.type] }}
          >
            {status.message}
          </div>
        )}

        {/* How-to */}
        <div
          className="w-full rounded-2xl p-5"
          style={{ maxWidth: '400px', background: '#fff1f1', border: '1px solid #fecaca' }}
        >
          <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#cc0000', margin: '0 0 8px' }}>
            How to use
          </p>
          <ol style={{ color: '#7f1d1d', fontSize: '14px', lineHeight: 1.7, paddingLeft: '20px', margin: 0 }}>
            <li>Insert your YubiKey into the USB-C port</li>
            <li>Enter your Employee ID in the field above</li>
            <li>Tap the button and wait for your key to flash</li>
            <li>Touch the gold contact on your YubiKey</li>
          </ol>
        </div>

        {/* Registered associates roster */}
        <div
          className="w-full rounded-3xl overflow-hidden"
          style={{ maxWidth: '400px', background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#cc0000', margin: 0 }}>
              Registered Associates
            </p>
            <button
              onClick={loadRoster}
              style={{ fontSize: '12px', color: '#9a9a9a', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Refresh
            </button>
          </div>

          <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                {['PIN', 'Name', 'Dept', 'YubiKey'].map((h, i) => (
                  <th key={h} style={{
                    padding: '8px 16px',
                    textAlign: i === 3 ? 'center' : 'left',
                    fontSize: '11px', fontWeight: 700, color: '#9a9a9a',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roster.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: '#9a9a9a', fontSize: '12px', fontStyle: 'italic' }}>
                    Loading…
                  </td>
                </tr>
              ) : roster.map(e => (
                <tr key={e.employeeId} style={{ borderBottom: '1px solid #fafafa' }}>
                  <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#1a1a1a' }}>{e.employeeId}</td>
                  <td style={{ padding: '10px 16px', color: '#1a1a1a' }}>{e.name}</td>
                  <td style={{ padding: '10px 16px', color: '#6b6b6b' }}>{e.department}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                    {e.registered ? (
                      <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700 }}>
                        Active
                      </span>
                    ) : (
                      <button
                        onClick={() => doRegister(e.employeeId)}
                        style={{ background: '#fef9c3', color: '#713f12', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                      >
                        Register
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ padding: '10px 16px', borderTop: '1px solid #f0f0f0' }}>
            <p style={{ fontSize: '12px', color: '#9a9a9a', margin: 0 }}>
              Keys are provisioned by IT. Contact your supervisor if your key is missing.
            </p>
          </div>
        </div>

      </main>

      <footer style={{ background: 'white', borderTop: '1px solid #e8e8e8', padding: '10px', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: '#9a9a9a', margin: 0 }}>Ryder System, Inc. — Warehouse Operations</p>
      </footer>
    </div>
  );
}
