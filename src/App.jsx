import { useState } from 'react';
import { KioskShell } from './components/KioskShell';
import { TranslationContext } from './context/TranslationContext';
import { useTranslations } from './hooks/useTranslations';
import { Home } from './pages/Home';
import { WhereIssue } from './pages/WhereIssue';
import { ExactLocation } from './pages/ExactLocation';
import { DeviceSelection } from './pages/DeviceSelection';
import { IssueClassification } from './pages/IssueClassification';
import { Submit } from './pages/Submit';
import { Confirmation } from './pages/Confirmation';

import { AuthGate } from './pages/AuthGate';
import { YubiKeySignIn } from './pages/YubiKeySignIn';
import { OktaSignIn } from './pages/OktaSignIn';

const EMPTY_REPORT = {
  language: 'en',
  area: '',
  stationNumber: '',
  workstationNumber: '',
  dockDoorNumber: '',
  device: '',
  reporterName: '',
  issueCategory: '',
  additionalComments: '',
};

const SCREEN_ORDER = [
  'welcome',
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

  const { t, issueTranslations } = useTranslations(language);

  // ── Auth state ──────────────────────────────────────────────────────────────
  // authPhase: 'gate' | 'yubikey' | 'okta' | 'done'
  // Lazily detect an Auth0 redirect callback (code+state in URL) on first render
  // so OktaSignIn can call handleRedirectCallback() before the params disappear.
  const [authPhase, setAuthPhase] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.has('code') && params.has('state')) || params.has('error')
      ? 'okta'
      : 'gate';
  });
  const [authUser, setAuthUser] = useState(null);

  function handleAuthSuccess(authInfo) {
    setAuthUser(authInfo);
    setAuthPhase('done');
  }

  // Resets auth + report and returns to the auth gate.
  function handleSignOut() {
    if (authUser?.onSignOut) {
      authUser.onSignOut(); // Auth0: redirects browser to logout endpoint
    }
    setAuthUser(null);
    setAuthPhase('gate');
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

  // Resets the current report/screen but keeps the user authenticated.
  const handleHome = () => {
    setScreen('welcome');
    setReport({ ...EMPTY_REPORT });
  };

  const renderKioskScreen = () => {
    switch (screen) {
      case 'welcome':
        return (
          <Home
            language={language}
            onStart={() => setScreen('area')}
            onLanguageChange={setLanguage}
            onSignOut={handleSignOut}
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
          />
        );
      case 'classification':
        return (
          <IssueClassification
            language={language}
            data={report}
            onChange={updateReport}
            onNext={goNext}
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
            onReportAnother={() => { setReport({ ...EMPTY_REPORT }); setScreen('area'); }}
            onHome={handleHome}
          />
        );

      default:
        return null;
    }
  };

  // ── Auth gate (renders before the kiosk shell) ───────────────────────────
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

  // ── Kiosk flow (auth === 'done') ─────────────────────────────────────────
  return (    <TranslationContext.Provider value={{ t, issueTranslations, language }}>    <KioskShell
      currentScreen={screen}
      language={language}
      onBack={goBack}
      onHome={handleHome}
      onLanguageChange={setLanguage}
      onSignOut={handleSignOut}
      authUser={authUser}
    >
      {renderKioskScreen()}
    </KioskShell>
    </TranslationContext.Provider>
  );
}

export default App;
