import {
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  DoorOpen,
  Package,
  Truck,
  PackageOpen,
  Layers,
  Laptop,
  MoreHorizontal,
} from 'lucide-react';
import { TRANSLATIONS } from '../components/kiosk-types';
import { useState, useEffect } from 'react';
import { getAreas } from '../services/api';
// icon + translation key for each area option, in the order they should appear
const AREA_OPTIONS = [
  { value: 'inbound', icon: ArrowDownCircle },
  { value: 'outbound', icon: ArrowUpCircle },
  { value: 'mainFrontOffice', icon: Building2 },
  { value: 'dockDoor', icon: DoorOpen },
  { value: 'packingArea', icon: Package },
  { value: 'shippingArea', icon: Truck },
  { value: 'receivingArea', icon: PackageOpen },
  { value: 'stagingArea', icon: Layers },
  { value: 'mobileWorkstation', icon: Laptop },
  { value: 'other', icon: MoreHorizontal },
];

export function WhereIssue({ language, data, onChange, onNext }) {
  const t = TRANSLATIONS[language] ?? TRANSLATIONS.en;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [areas, setAreas] = useState([]);
  // TODO: uncomment this when backend /api/areas is connected to the database
  // useEffect(() => {
  //   getAreas(language)
  //     .then(data => {
  //       setAreas(data);
  //       setLoading(false);
  //     })
  //     .catch(err => {
  //       setError(err.message);
  //       setLoading(false);
  //     });
  // }, [language]);

  // TEMPORARY: using hardcoded list until backend is ready
  useEffect(() => {
    setAreas(AREA_OPTIONS);
    setLoading(false);
  }, []);

  // tapping an option saves it to the report and immediately advances to the next screen
  const handleSelect = (value) => {
    onChange({ area: value });
    onNext();
  };

  if (loading) return <div style={{ color: 'white', padding: '40px' }}>Loading...</div>;
  if (error) return <div style={{ color: 'white', padding: '40px' }}>Error: {error}</div>;
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
          marginBottom: '24px',
        }}
      >
        {t.whereIssue}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {areas.map(({ value, icon: Icon }) => {
          const selected = data.area === value;
          return (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl transition-all active:scale-95"
              style={{
                background: selected ? '#1a1a1a' : 'white',
                color: selected ? 'white' : '#1a1a1a',
                padding: 'clamp(22px, 4vh, 32px) 16px',
                fontWeight: 700,
                fontSize: 'clamp(15px, 2vw, 18px)',
                border: 'none',
                boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
              }}
            >
              <Icon size={28} strokeWidth={2} />
              <span>{t.areas[value]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}