import {
  Printer,
  Monitor,
  Scan,
  Scale,
  Laptop,
  Server,
  Keyboard,
  Mouse,
  Zap,
  Wifi,
  KeyRound,
  Tag,
  Smartphone,
  Cable,
  MoreHorizontal,
} from 'lucide-react';
import { TRANSLATIONS } from '../components/kiosk-types';
import { useState, useEffect } from 'react';
import { getDevices } from '../services/api';

// value must match the keys in ISSUE_CATEGORIES (kiosk-types.js) so the next
// screen can look up the right list of specific issues for whatever is picked here
const DEVICE_OPTIONS = [
  { value: 'Printer',            icon: Printer        },
  { value: 'Monitor',            icon: Monitor        },
  { value: 'Scanner',            icon: Scan           },
  { value: 'Scale',              icon: Scale          },
  { value: 'Laptop',             icon: Laptop         },
  { value: 'Desktop',            icon: Server         },
  { value: 'Keyboard',           icon: Keyboard       },
  { value: 'Mouse',              icon: Mouse          },
  { value: 'Power Outlet',       icon: Zap            },
  { value: 'Network Connection', icon: Wifi           },
  { value: 'YubiKey',            icon: KeyRound       },
  { value: 'Label Printer',      icon: Tag            },
  { value: 'Handheld Device',    icon: Smartphone     },
  { value: 'Cables',             icon: Cable          },
  { value: 'Other',              icon: MoreHorizontal },
];

const MOST_COMMON_DEVICE = 'Printer';

function iconForDevice(value) {
  return DEVICE_OPTIONS.find(o => o.value === value)?.icon ?? MoreHorizontal;
}

export function DeviceSelection({ language, data, onChange, onNext, warehouse }) {
  const t = TRANSLATIONS[language] ?? TRANSLATIONS.en;

  const [devices, setDevices] = useState(DEVICE_OPTIONS);

  useEffect(() => {
    if (!warehouse) return;
    let cancelled = false;
    getDevices(warehouse)
      .then(apiDevices => {
        if (!cancelled && apiDevices?.length) {
          setDevices(apiDevices.map(d => ({ value: d.value, icon: iconForDevice(d.value) })));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [warehouse]);

  const handleSelect = (value) => {
    onChange({ device: value });
    onNext();
  };

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
          marginBottom: '16px',
        }}
      >
        {t.whatEquipment}
      </h2>

      <div
        className="inline-flex items-center gap-2 rounded-full"
        style={{
          background: 'rgba(255,255,255,0.18)',
          color: 'white',
          fontWeight: 700,
          fontSize: '14px',
          padding: '8px 16px',
          marginBottom: '24px',
        }}
      >
        <Printer size={16} />
        {t.mostCommon}: {t.devices[MOST_COMMON_DEVICE]}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {devices.map(({ value, icon: Icon }) => {
          const selected = data.device === value;
          const isMostCommon = value === MOST_COMMON_DEVICE;
          return (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              className="relative flex flex-col items-center justify-center gap-3 rounded-2xl transition-all active:scale-95"
              style={{
                background: selected ? '#1a1a1a' : 'white',
                color: selected ? 'white' : '#1a1a1a',
                padding: 'clamp(20px, 4vh, 28px) 16px',
                fontWeight: 700,
                fontSize: 'clamp(15px, 2vw, 18px)',
                border: 'none',
                boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
              }}
            >
              {isMostCommon && (
                <span
                  className="absolute"
                  style={{
                    top: -10,
                    right: -10,
                    background: '#cc0000',
                    color: 'white',
                    borderRadius: '9999px',
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 800,
                    border: '2px solid white',
                  }}
                >
                  #1
                </span>
              )}
              <Icon size={28} strokeWidth={2} />
              <span>{t.devices[value] ?? value}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
