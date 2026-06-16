import { ArrowRight } from 'lucide-react';
import { TRANSLATIONS } from '../components/kiosk-types';

// the 3 input fields on this screen, in the order they're shown
const FIELDS = [
  { key: 'stationNumber', placeholder: 'e.g. ST-204' },
  { key: 'workstationNumber', placeholder: 'e.g. WS-07' },
  { key: 'dockDoorNumber', placeholder: 'e.g. DD-12' },
];

export function ExactLocation({ language, data, onChange, onNext }) {
  const t = TRANSLATIONS[language] ?? TRANSLATIONS.en;

  // Continue only unlocks once at least one of the three fields has something in it
  const canContinue =
    data.stationNumber.trim() !== '' ||
    data.workstationNumber.trim() !== '' ||
    data.dockDoorNumber.trim() !== '';

  return (
    <div
      className="px-6 py-8"
      style={{ background: '#cc0000', minHeight: '100%' }}
    >
      <h2
        style={{
          color: 'white',
          fontWeight: 800,
          fontSize: 'clamp(24px, 4vw, 34px)',
          textAlign: 'left',
          marginBottom: '8px',
        }}
      >
        {t.specifyLocation}
      </h2>

      {data.area && (
        <p
          style={{
            color: 'rgba(255,255,255,0.85)',
            textAlign: 'left',
            marginBottom: '28px',
            fontSize: '16px',
          }}
        >
          {t.area}: <strong>{t.areas[data.area]}</strong>
        </p>
      )}

      <div className="flex flex-col gap-6 mb-10">
        {FIELDS.map(({ key, placeholder }) => (
          <div key={key} className="text-left">
            <label
              style={{
                display: 'block',
                color: 'rgba(255,255,255,0.85)',
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              {t[key]}
            </label>
            <input
              type="text"
              value={data[key]}
              onChange={(e) => onChange({ [key]: e.target.value })}
              placeholder={placeholder}
              className="w-full rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '2px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '18px 20px',
                fontSize: '18px',
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        disabled={!canContinue}
        className="flex items-center justify-center gap-2 rounded-2xl w-full transition-all active:scale-95"
        style={{
          background: canContinue ? 'white' : 'rgba(255,255,255,0.3)',
          color: canContinue ? '#cc0000' : 'rgba(255,255,255,0.7)',
          fontWeight: 800,
          fontSize: 'clamp(16px, 2.5vw, 20px)',
          padding: 'clamp(14px, 2.5vh, 20px) 0',
          border: 'none',
          cursor: canContinue ? 'pointer' : 'not-allowed',
        }}
      >
        {t.continue} <ArrowRight size={20} />
      </button>
    </div>
  );
}