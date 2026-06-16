import { CheckCircle, RefreshCw, Home } from 'lucide-react';
import { TRANSLATIONS } from '../components/kiosk-types';

export function Confirmation({ language, data, onReportAnother, onHome }) {
  const t = TRANSLATIONS[language] ?? TRANSLATIONS['en'];

  return (
    <div
      className="flex flex-col items-center justify-center px-8 py-12"
      style={{ minHeight: 'calc(100dvh - 52px)' }}
    >
      {/* Success icon */}
      <div
        className="flex items-center justify-center rounded-full mb-8"
        style={{
          width: 'clamp(80px, 12vw, 108px)',
          height: 'clamp(80px, 12vw, 108px)',
          background: 'rgba(255,255,255,0.2)',
          border: '4px solid white',
        }}
      >
        <CheckCircle size={60} color="white" strokeWidth={2.5} />
      </div>

      {/* Thank you */}
      <h1 style={{
        fontSize: 'clamp(28px, 5vw, 36px)',
        fontWeight: 800,
        color: 'white',
        textAlign: 'center',
        marginBottom: '12px',
        lineHeight: 1.2,
      }}>
        {t.thankYou}
      </h1>

      <p style={{
        fontSize: 'clamp(15px, 2.5vw, 18px)',
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        marginBottom: 'clamp(32px, 5vh, 48px)',
        lineHeight: 1.5,
        maxWidth: '340px',
      }}>
        {t.ticketSubmitted}
      </p>

      {/* Summary chip */}
      <div
        className="rounded-2xl px-6 py-4 mb-10"
        style={{
          background: 'rgba(255,255,255,0.15)',
          border: '1.5px solid rgba(255,255,255,0.3)',
          textAlign: 'center',
        }}
      >
        <div style={{
          fontSize: 'clamp(11px, 1.5vw, 13px)',
          color: 'rgba(255,255,255,0.65)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 6
        }}>
          {data.device} · {data.area}
        </div>
        <div style={{
          fontSize: 'clamp(15px, 2vw, 17px)',
          fontWeight: 700,
          color: 'white'
        }}>
          {data.issueCategory}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-4 w-full" style={{ maxWidth: 'min(400px, 90vw)' }}>
        <button
          onClick={onReportAnother}
          className="flex items-center justify-center gap-3 rounded-2xl transition-all active:scale-95"
          style={{
            background: 'white',
            color: '#cc0000',
            fontWeight: 800,
            fontSize: 'clamp(15px, 2.5vw, 18px)',
            padding: 'clamp(14px, 2.5vh, 20px) 0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
        >
          <RefreshCw size={20} />
          {t.reportAnother}
        </button>

        <button
          onClick={onHome}
          className="flex items-center justify-center gap-3 rounded-2xl transition-all active:scale-95"
          style={{
            background: 'rgba(255,255,255,0.18)',
            color: 'white',
            fontWeight: 700,
            fontSize: 'clamp(15px, 2.5vw, 18px)',
            padding: 'clamp(14px, 2.5vh, 20px) 0',
            border: '2px solid rgba(255,255,255,0.35)',
          }}
        >
          <Home size={20} />
          {t.returnHome}
        </button>
      </div>
    </div>
  );
}