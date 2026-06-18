import { useState, useEffect } from 'react';
import { KioskShell } from './components/KioskShell';
import { Home } from './pages/Home';
import { WhereIssue } from './pages/WhereIssue';
import { ExactLocation } from './pages/ExactLocation';
import { DeviceSelection } from './pages/DeviceSelection';
import { IssueClassification } from './pages/IssueClassification';
import { WarehouseSelection } from './pages/WarehouseSelection';
import { Submit } from './pages/Submit';
import { Confirmation } from './pages/Confirmation';
import { AuthGate } from './pages/AuthGate';
import { YubiKeySignIn } from './pages/YubiKeySignIn';
import { OktaSignIn } from './pages/OktaSignIn';
import { WarehouseSetup } from './pages/WarehouseSetup';
import { setSessionToken, getWarehouseByCode } from './services/api';

const EMPTY_REPORT = {
  language: 'en',
  warehouse: '',
  area: '',
  stationNumber: '',
  workstationNumber: '',
  dockDoorNumber: '',
  otherLocation: '',
  device: '',
  reporterName: '',
  issueCategory: '',
<<<<<<< Updated upstream
  additionalComments: '',
  warehouse: '',
=======
  otherIssueDetails: '',
>>>>>>> Stashed changes
};

const SCREEN_ORDER = [
  'welcome',
  'warehouse',
  'area',
  'location',
  'device',
  'classification',
  'review',
  'confirmation',
];

function App() {
  const [screen,   setScreen]   = useState('welcome');
  const [language, setLanguage] = useState('en');
  const [report,   setReport]   = useState({ ...EMPTY_REPORT });

  // ── Auth state ──────────────────────────────────────────────────────────────
  const [authPhase, setAuthPhase] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.has('code') && params.has('state')) || params.has('error')
      ? 'okta'
      : 'gate';
  });
  const [authUser, setAuthUser] = useState(null);

  // ── Warehouse state ─────────────────────────────────────────────────────────
  // warehousePhase: 'idle' | 'loading' | 'setup' | 'ready'
  const [warehousePhase, setWarehousePhase] = useState('idle');
  const [warehouse, setWarehouse]           = useState('');

  // After auth completes, resolve the saved warehouse code.
  useEffect(() => {
    if (authPhase !== 'done') return;
    let cancelled = false;

    (async () => {
      const stored = localStorage.getItem('ryder.kiosk.warehouse');
      if (!stored) {
        if (!cancelled) setWarehousePhase('setup');
        return;
      }
      if (!cancelled) setWarehousePhase('loading');
      try {
        const wh = await getWarehouseByCode(stored);
        if (!cancelled) {
          if (wh) { setWarehouse(stored); setWarehousePhase('ready'); }
          else { localStorage.removeItem('ryder.kiosk.warehouse'); setWarehousePhase('setup'); }
        }
      } catch {
        // Network/SN unavailable — trust the stored code so the kiosk still works.
        if (!cancelled) { setWarehouse(stored); setWarehousePhase('ready'); }
      }
    })();

    return () => { cancelled = true; };
  }, [authPhase]);

  useEffect(() => {
    if(warehouse) setReport({ ...EMPTY_REPORT, warehouse });
  }, [warehouse]);

  function handleAuthSuccess(authInfo) {
    setSessionToken(authInfo.token);
    setAuthUser(authInfo);
    setAuthPhase('done');
  }

  function handleSignOut() {
    if (authUser?.onSignOut) authUser.onSignOut();
    setSessionToken(null);
    setAuthUser(null);
    setAuthPhase('gate');
    setWarehousePhase('idle');
    // Keep warehouse code in localStorage — it's a kiosk setting, not a user setting.
    // Warehouse will be re-validated on next login.
    setReport({ ...EMPTY_REPORT });
    setScreen('welcome');
  }

  function handleWarehouseSelected(code) {
    setWarehouse(code);
    setWarehousePhase('ready');
  }

  function handleChangeWarehouse() {
    localStorage.removeItem('ryder.kiosk.warehouse');
    setWarehouse('');
    setWarehousePhase('setup');
    setReport({ ...EMPTY_REPORT });
    setScreen('welcome');
  }

  // ── Kiosk navigation ────────────────────────────────────────────────────────
  const updateReport = (updates) => setReport(prev => ({ ...prev, ...updates }));

  const goNext = () => {
    const idx = SCREEN_ORDER.indexOf(screen);
    if (idx < SCREEN_ORDER.length - 1) setScreen(SCREEN_ORDER[idx + 1]);
  };

  const goBack = () => {
    const idx = SCREEN_ORDER.indexOf(screen);
    if (idx > 0) setScreen(SCREEN_ORDER[idx - 1]);
  };

  const handleHome = () => {
    setScreen('welcome');
    setReport({ ...EMPTY_REPORT, warehouse });
  };

  const renderKioskScreen = () => {
    switch (screen) {
      case 'welcome':
        return (
          <Home
            language={language}
            onStart={() => setScreen('warehouse')}
            onLanguageChange={setLanguage}
            onSignOut={handleSignOut}
          />
        );
      case 'warehouse':
        return (
          <WarehouseSelection
            language={language}
            data={report}
            onChange={updateReport}
            onNext={goNext}
          />
        );
      case 'area':
        return (
          <WhereIssue
            language={language}
            data={report}
            onChange={updateReport}
            onNext={goNext}
          />
        );
      case 'location':
        return (
          <ExactLocation
            language={language}
            data={report}
            onChange={updateReport}
            onNext={goNext}
          />
        );
      case 'device':
        return (
          <DeviceSelection
            language={language}
            data={report}
            onChange={updateReport}
            onNext={goNext}
            warehouse={warehouse}
          />
        );
      case 'classification':
        return (
          <IssueClassification
            language={language}
            data={report}
            onChange={updateReport}
            onNext={goNext}
            warehouse={warehouse}
          />
        );
      case 'review':
        return (
          <Submit
            language={language}
            data={report}
            onEdit={(s) => setScreen(s)}
            onSubmit={() => setScreen('confirmation')}
          />
        );
      case 'confirmation':
        return (
          <Confirmation
            language={language}
            data={report}
            onReportAnother={() => { setReport({ ...EMPTY_REPORT, warehouse }); setScreen('area'); }}
            onHome={handleHome}
          />
        );
      default:
        return null;
    }
  };

  // ── Auth gate ────────────────────────────────────────────────────────────────
  if (authPhase === 'gate') {
    return (
      <AuthGate
        onSelectYubiKey={() => setAuthPhase('yubikey')}
        onSelectOkta={() => setAuthPhase('okta')}
      />
    );
  }

  if (authPhase === 'yubikey') {
    return (
      <YubiKeySignIn
        onSuccess={handleAuthSuccess}
        onBack={() => setAuthPhase('gate')}
      />
    );
  }

  if (authPhase === 'okta') {
    return (
      <OktaSignIn
        onSuccess={handleAuthSuccess}
        onBack={() => setAuthPhase('gate')}
      />
    );
  }

  // ── Warehouse resolution (auth === 'done') ───────────────────────────────────
  if (warehousePhase === 'loading') {
    return (
      <div style={{ minHeight: '100dvh', background: '#cc0000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'white', fontSize: '18px', fontWeight: 600 }}>Loading…</div>
      </div>
    );
  }

  if (warehousePhase === 'setup') {
    return <WarehouseSetup onComplete={handleWarehouseSelected} />;
  }

  // ── Kiosk flow (auth === 'done' && warehousePhase === 'ready') ───────────────
  return (
    <KioskShell
      currentScreen={screen}
      language={language}
      onBack={goBack}
      onHome={handleHome}
      onLanguageChange={setLanguage}
      onSignOut={handleSignOut}
      onChangeWarehouse={handleChangeWarehouse}
      authUser={authUser}
      warehouse={warehouse}
    >
      {renderKioskScreen()}
    </KioskShell>
  );
}

export default App;
