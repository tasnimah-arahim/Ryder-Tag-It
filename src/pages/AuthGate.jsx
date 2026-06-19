import { Key, Building2 } from 'lucide-react';

export function AuthGate({ onSelectYubiKey, onSelectOkta }) {
  return (
    <div
      className="flex flex-col items-center justify-center px-6"
      style={{ minHeight: '100dvh', background: '#cc0000' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-0.5 mb-2">
        <span style={{ fontWeight: 800, fontSize: 'clamp(32px, 6vw, 52px)', color: 'white', letterSpacing: '-1px' }}>
          Ryder
        </span>
        <span style={{ fontWeight: 800, fontSize: 'clamp(32px, 6vw, 52px)', color: 'rgba(255,255,255,0.55)', letterSpacing: '-1px' }}>
          Tag
        </span>
      </div>

      <p style={{
        color: 'rgba(255,255,255,0.8)',
        fontSize: 'clamp(14px, 2vw, 18px)',
        fontWeight: 400,
        marginTop: 'clamp(12px, 2vh, 20px)',
        marginBottom: 'clamp(24px, 4vh, 48px)',
        letterSpacing: '0.01em',
      }}>
        Sign in to continue
      </p>

      <div className="flex flex-col gap-4 w-full" style={{ maxWidth: 'min(420px, 90vw)' }}>
        {/* YubiKey option — primary (white card) */}
        <button
          onClick={onSelectYubiKey}
          className="rounded-2xl text-left transition-all active:scale-95"
          style={{
            background: 'white',
            padding: 'clamp(18px, 3vh, 24px) clamp(20px, 3vw, 28px)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <Key size={22} style={{ color: '#cc0000', flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: 'clamp(16px, 2.5vw, 20px)', color: '#1a1a1a' }}>
              YubiKey Sign In
            </span>
          </div>
          <p style={{ color: '#6b6b6b', fontSize: 'clamp(13px, 1.8vw, 15px)', margin: '0 0 0 34px' }}>
            Use your employee PIN and hardware key
          </p>
        </button>

        {/* Auth0 / Enterprise option — secondary (now white card) */}
        <button
          onClick={onSelectOkta}
          className="rounded-2xl text-left transition-all active:scale-95"
          style={{
            background: 'white',
            border: 'none',
            padding: 'clamp(18px, 3vh, 24px) clamp(20px, 3vw, 28px)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <Building2 size={22} style={{ color: '#1a1a1a', flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: 'clamp(16px, 2.5vw, 20px)', color: '#1a1a1a' }}>
              Enterprise Sign In
            </span>
          </div>
          <p style={{ color: '#6b6b6b', fontSize: 'clamp(13px, 1.8vw, 15px)', margin: '0 0 0 34px' }}>
            Sign in with your company account via Auth0
          </p>
        </button>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', marginTop: 'clamp(20px, 3vh, 32px)' }}>
        Need help? Contact your supervisor or IT support.
      </p>
    </div>
  );
}
