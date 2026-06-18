import { useState, useEffect } from 'react';
import { Search, MapPin, CheckCircle } from 'lucide-react';
import { getWarehouses } from '../services/api';

export function WarehouseSetup({ onComplete }) {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState('');

  useEffect(() => {
    getWarehouses()
      .then(list => { setWarehouses(list); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  function handleSelect(code) {
    localStorage.setItem('ryder.kiosk.warehouse', code);
    onComplete(code);
  }

  const filtered = warehouses.filter(w => {
    const q = search.toLowerCase();
    return (
      (w.warehouse_code ?? '').toLowerCase().includes(q) ||
      (w.name ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ minHeight: '100dvh', background: '#cc0000', display: 'flex', flexDirection: 'column' }}>
      <header
        className="flex items-center gap-3 px-5 shrink-0"
        style={{ background: 'white', height: '52px', borderBottom: '1px solid #e8e8e8' }}
      >
        <div className="flex items-center gap-0.5">
          <span style={{ fontWeight: 800, fontSize: '20px', color: '#cc0000', letterSpacing: '-0.5px' }}>Ryder</span>
          <span style={{ fontWeight: 800, fontSize: '20px', color: '#6b6b6b', letterSpacing: '-0.5px' }}>Tag</span>
        </div>
        <span style={{ color: '#d0d0d0', fontSize: '16px' }}>·</span>
        <span style={{ color: '#4a4a4a', fontWeight: 600, fontSize: '14px' }}>Kiosk Setup</span>
      </header>

      <main className="flex-1 overflow-y-auto flex flex-col items-center p-5 gap-4">
        <div
          className="w-full rounded-3xl overflow-hidden"
          style={{ maxWidth: '480px', background: 'white', boxShadow: '0 4px 24px rgba(0,0,0,0.15)', borderTop: '4px solid #cc0000' }}
        >
          <div className="p-6 flex flex-col gap-4">
            <div className="text-center">
              <div
                className="flex items-center justify-center rounded-full mx-auto mb-3"
                style={{ width: 56, height: 56, background: '#fff1f1' }}
              >
                <MapPin size={26} style={{ color: '#cc0000' }} />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
                Select Warehouse
              </h2>
              <p style={{ color: '#9a9a9a', fontSize: '14px', margin: '4px 0 0' }}>
                Choose the location for this kiosk. This is saved until changed.
              </p>
            </div>

            <div
              className="flex items-center gap-2 rounded-xl px-4"
              style={{ background: '#f5f5f5', border: '2px solid #e5e7eb' }}
            >
              <Search size={16} color="#9a9a9a" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by code or name…"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  padding: '12px 0',
                  fontSize: '15px',
                  color: '#1a1a1a',
                }}
              />
            </div>

            {loading && (
              <div style={{ textAlign: 'center', padding: '24px', color: '#9a9a9a', fontSize: '14px' }}>
                Loading warehouses…
              </div>
            )}

            {error && (
              <div
                style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px', color: '#991b1b', fontSize: '14px', textAlign: 'center' }}
              >
                {error}
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px', color: '#9a9a9a', fontSize: '14px' }}>
                {search ? 'No warehouses match your search.' : 'No warehouses found.'}
              </div>
            )}

            {!loading && !error && filtered.length > 0 && (
              <div
                className="flex flex-col gap-2"
                style={{ maxHeight: '340px', overflowY: 'auto' }}
              >
                {filtered.map(w => (
                  <button
                    key={w.warehouse_code}
                    onClick={() => handleSelect(w.warehouse_code)}
                    className="flex items-center gap-3 rounded-xl text-left transition-all active:scale-95"
                    style={{ background: '#f9fafb', border: '2px solid #e5e7eb', padding: '14px 16px', cursor: 'pointer' }}
                  >
                    <CheckCircle size={18} color="#cc0000" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#1a1a1a' }}>
                        {w.warehouse_code}
                      </div>
                      {w.name && (
                        <div style={{ fontSize: '13px', color: '#6b6b6b', marginTop: '1px' }}>
                          {w.name}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer style={{ background: 'white', borderTop: '1px solid #e8e8e8', padding: '10px', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: '#9a9a9a', margin: 0 }}>Ryder System, Inc. — Warehouse Operations</p>
      </footer>
    </div>
  );
}
