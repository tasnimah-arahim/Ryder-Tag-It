import { useState, useEffect, useRef } from 'react';
import { createAuth0Client } from '@auth0/auth0-spa-js';
import { ArrowLeft, Building2 } from 'lucide-react';

// Read from Vite env vars; fall back to the dev tenant values.
// Add http://localhost:5173 to Allowed Callback URLs in your Auth0 dashboard.
const AUTH0_DOMAIN    = import.meta.env.VITE_AUTH0_DOMAIN    || 'dev-5ckox5r6gx5hfdw3.us.auth0.com';
const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID || '2qco1c1abi14JBiqbbG6HgqcyaHvi4Rx';

export function OktaSignIn({ onSuccess, onBack }) {
  const [view, setView]   = useState('loading'); // 'loading' | 'unauthenticated' | 'error'
  const [error, setError] = useState('');
  const clientRef    = useRef(null);
  // Avoid stale-closure issues in the one-time init effect without adding onSuccess to deps.
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => { onSuccessRef.current = onSuccess; });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const client = await createAuth0Client({
          domain:   AUTH0_DOMAIN,
          clientId: AUTH0_CLIENT_ID,
          authorizationParams: { redirect_uri: window.location.origin },
        });
        if (cancelled) return;
        clientRef.current = client;

        // Handle error params returned by Auth0 after a failed redirect.
        if (window.location.search.includes('error=')) {
          const params = new URLSearchParams(window.location.search);
          setError(`${params.get('error')}: ${params.get('error_description')}`);
          setView('error');
          window.history.replaceState({}, '', window.location.pathname);
          return;
        }

        // Process the redirect callback when Auth0 sends back code + state.
        if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
          await client.handleRedirectCallback();
          window.history.replaceState({}, '', window.location.pathname);
        }

        if (await client.isAuthenticated()) {
          const user = await client.getUser();
          // Exchange Auth0 identity for a server-side session token so the
          // ServiceNow proxy routes can verify the request is authenticated.
          let token = null;
          try {
            const sessionRes = await fetch('/api/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sub: user?.sub, name: user?.name }),
            });
            const sessionData = await sessionRes.json();
            token = sessionData.token ?? null;
          } catch {
            // Non-fatal: kiosk auth still succeeded; SN proxy calls will get 401.
          }
          if (!cancelled) {
            onSuccessRef.current({
              method: 'okta',
              user,
              token,
              onSignOut: () => client.logout({ logoutParams: { returnTo: window.location.origin } }),
            });
          }
          return;
        }

        if (!cancelled) setView('unauthenticated');
      } catch (err) {
        if (!cancelled) { setError(err.message); setView('error'); }
      }
    })();

    return () => { cancelled = true; };
  }, []);

  function handleLogin() {
    clientRef.current?.loginWithRedirect();
  }

  function handleSignup() {
    clientRef.current?.loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } });
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
        <span style={{ color: '#4a4a4a', fontWeight: 600, fontSize: '14px' }}>Enterprise Sign In</span>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-5">
        <div
          className="w-full rounded-3xl overflow-hidden"
          style={{ maxWidth: '380px', background: 'white', boxShadow: '0 4px 24px rgba(0,0,0,0.15)', borderTop: '4px solid #cc0000' }}
        >
          <div className="p-8 flex flex-col gap-5">
            <div className="text-center">
              <div className="flex items-center justify-center rounded-full mx-auto mb-3"
                   style={{ width: 56, height: 56, background: '#fff1f1' }}>
                <Building2 size={26} style={{ color: '#cc0000' }} />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Enterprise Sign In</h2>
              <p style={{ color: '#9a9a9a', fontSize: '14px', margin: '4px 0 0' }}>
                Sign in with your company account.
              </p>
            </div>

            {view === 'loading' && (
              <div style={{ textAlign: 'center', padding: '12px', color: '#9a9a9a', fontSize: '14px' }}>
                Loading…
              </div>
            )}

            {view === 'error' && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px', color: '#991b1b', fontSize: '14px', textAlign: 'center' }}>
                {error}
              </div>
            )}

            {view === 'unauthenticated' && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleLogin}
                  className="rounded-2xl transition-all active:scale-95"
                  style={{
                    background: '#cc0000',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '17px',
                    padding: '16px 0',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(204,0,0,0.3)',
                  }}
                >
                  Sign In
                </button>
                <button
                  onClick={handleSignup}
                  className="rounded-2xl transition-all active:scale-95"
                  style={{
                    background: 'transparent',
                    color: '#cc0000',
                    fontWeight: 700,
                    fontSize: '17px',
                    padding: '16px 0',
                    border: '2px solid #fecaca',
                    cursor: 'pointer',
                  }}
                >
                  Create Account
                </button>
              </div>
            )}

            <p style={{ fontSize: '12px', color: '#9a9a9a', textAlign: 'center', margin: 0 }}>
              If unavailable, go back and use YubiKey sign in.
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
