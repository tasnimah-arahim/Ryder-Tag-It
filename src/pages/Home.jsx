import { TRANSLATIONS } from '../components/kiosk-types';

// hardcoded for now, will come from ServiceNow later
const LANG_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'ht', label: 'Kreyòl Ayisyen' },
  { value: 'pt', label: 'Português' },
];

export function Home({ language, onStart, onLanguageChange, onSignOut }) {
  const t = TRANSLATIONS[language] ?? TRANSLATIONS['en'];

  return (
    <div
      className="flex flex-col items-center justify-center px-6"
      style={{ minHeight: '100dvh', background: '#cc0000' }}
    >
      {/* RyderTag logo */}
      <div className="flex items-center gap-0.5 mb-6">
        <span style={{
          fontWeight: 800,
          fontSize: 'clamp(32px, 6vw, 52px)',
          color: 'white',
          letterSpacing: '-1px'
        }}>
          Ryder
        </span>
        <span style={{
          fontWeight: 800,
          fontSize: 'clamp(32px, 6vw, 52px)',
          color: 'rgba(255,255,255,0.55)',
          letterSpacing: '-1px'
        }}>
          Tag
        </span>
      </div>

      {/* Subtitle */}
      <p style={{
        color: 'rgba(255,255,255,0.8)',
        fontSize: 'clamp(14px, 2vw, 18px)',
        fontWeight: 400,
        marginBottom: 'clamp(24px, 4vh, 48px)',
        letterSpacing: '0.01em',
      }}>
        {t.selectLanguage}
      </p>

      {/* Language buttons - dynamic, will come from ServiceNow */}
      <div
        className="flex flex-col gap-3 w-full"
        style={{ maxWidth: 'min(420px, 90vw)' }}
      >
        {LANG_OPTIONS.map(({ value, label }) => {
          const selected = language === value;
          return (
            <button
              key={value}
              onClick={() => onLanguageChange(value)}
              className="rounded-2xl transition-all active:scale-95"
              style={{
                background: selected ? 'white' : 'rgba(255,255,255,0.18)',
                color: selected ? '#cc0000' : 'white',
                fontWeight: 700,
                fontSize: 'clamp(16px, 2.5vw, 20px)',
                padding: 'clamp(14px, 2.5vh, 20px) 0',
                border: selected ? 'none' : '2px solid rgba(255,255,255,0.3)',
                boxShadow: selected ? '0 4px 20px rgba(0,0,0,0.15)' : 'none',
                width: '100%',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Start Report button */}
      <button
        onClick={onStart}
        className="rounded-2xl mt-8 transition-all active:scale-95"
        style={{
          background: 'white',
          color: '#cc0000',
          fontWeight: 800,
          fontSize: 'clamp(16px, 2.5vw, 20px)',
          padding: 'clamp(14px, 2.5vh, 20px) 0',
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          width: 'min(420px, 90vw)',
        }}
      >
        {t.startReport}
      </button>

      {onSignOut && (
        <button
          onClick={onSignOut}
          style={{
            marginTop: '20px',
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
          }}
        >
          Sign Out
        </button>
      )}
    </div>
  );
}