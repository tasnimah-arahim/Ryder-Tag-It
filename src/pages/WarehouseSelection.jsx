import { ArrowRight } from 'lucide-react';
import { TRANSLATIONS } from '../components/kiosk-types';
import { useState, useEffect } from 'react';

export function WarehouseSelection({ language, data, onChange, onNext }) {
  const t = TRANSLATIONS[language] ?? TRANSLATIONS.en;
  const [selected, setSelected] = useState(data.warehouse || '');

  useEffect(() => {
    setSelected(data.warehouse || '');
  }, [data.warehouse]);

  const WAREHOUSES = [
    { value: 'w1', label: t.warehouses?.w1 ?? 'Warehouse 1' },
    { value: 'w2', label: t.warehouses?.w2 ?? 'Warehouse 2' },
    { value: 'w3', label: t.warehouses?.w3 ?? 'Warehouse 3' },
    { value: 'w4', label: t.warehouses?.w4 ?? 'Warehouse 4' },
  ];

  const canContinue = selected !== '';

  const handleSelect = (val) => {
    setSelected(val);
    onChange({ warehouse: val });
  };

  return (
    <div
      className="flex flex-col items-center justify-center px-6 py-8"
      style={{
        minHeight: '100%',
        background: 'radial-gradient(circle at top, rgba(255,255,255,0.16), transparent 35%), #cc0000',
      }}
    >
      <div
        className="w-full"
        style={{
          maxWidth: '520px',
          background: 'rgba(255,255,255,0.09)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: '32px',
          boxShadow: '0 30px 60px rgba(0,0,0,0.18)',
          backdropFilter: 'blur(20px)',
          padding: '36px 28px',
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <p
            style={{
              color: 'rgba(255,255,255,0.9)',
              fontWeight: 700,
              fontSize: 'clamp(18px, 2.5vw, 24px)',
              marginBottom: '12px',
            }}
          >
            {t.selectWarehouse ?? 'Which warehouse are you located in?'}
          </p>
          <p
            style={{
              color: 'rgba(255,255,255,0.72)',
              lineHeight: 1.7,
              fontSize: 'clamp(14px, 1.8vw, 16px)',
            }}
          >
            Choose your warehouse before we continue to the next step. This helps us route your report to the correct location.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '18px' }}>
          <label
            htmlFor="warehouse-select"
            style={{
              display: 'block',
              color: 'rgba(255,255,255,0.8)',
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            Warehouse Location
          </label>

          <div
            style={{
              position: 'relative',
              borderRadius: '22px',
              overflow: 'hidden',
              border: '2px solid rgba(255,255,255,0.25)',
              background: 'rgba(255,255,255,0.08)',
            }}
          >
            <select
              id="warehouse-select"
              value={selected}
              onChange={(e) => handleSelect(e.target.value)}
              className="w-full"
              style={{
                width: '100%',
                padding: '18px 20px',
                fontSize: '18px',
                fontWeight: 700,
                border: 'none',
                background: 'transparent',
                color: 'white',
                appearance: 'none',
                WebkitAppearance: 'none',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="" disabled hidden>
                {"Select a warehouse"}
              </option>
              {WAREHOUSES.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>

            <span
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.75)',
                pointerEvents: 'none',
                fontSize: '18px',
              }}
            >
              ▼
            </span>
          </div>

          <button
            onClick={onNext}
            disabled={!canContinue}
            className="flex items-center justify-center gap-2 rounded-2xl transition-all active:scale-95"
            style={{
              background: canContinue ? 'white' : 'rgba(255,255,255,0.25)',
              color: canContinue ? '#cc0000' : 'rgba(255,255,255,0.6)',
              fontWeight: 800,
              fontSize: 'clamp(16px, 2.5vw, 20px)',
              padding: '18px 0',
              border: 'none',
              cursor: canContinue ? 'pointer' : 'not-allowed',
              width: '100%',
            }}
          >
            {t.next ?? 'Next'} <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
