import {ArrowLeft, Home} from 'lucide-react';
import {FLOW_STEPS} from './kiosk-types';

const LANG_LABELS = {
    en: 'EN',
    es: 'ES',
    ht: 'HT',
    pt: 'PT'
};

export function KioskShell({
  children,
  currentScreen,
  language,
  onBack,
  onHome,
  onLanguageChange,
  onSignOut,
  authUser,
}) {
  const isWelcome = currentScreen === 'welcome';
  const isConfirmation = currentScreen === 'confirmation';
  const showHeader = !isWelcome;

  const flowSteps = FLOW_STEPS;
  const stepIndex = flowSteps.indexOf(currentScreen);

  return (
    <div
      className="flex flex-col w-full"
      style={{ minHeight: '100dvh', background: '#cc0000' }}
    >
      {/* White header */}
      {showHeader && (
        <header
          className="flex items-center justify-between px-5 shrink-0"
          style={{ background: 'white', height: '52px', borderBottom: '1px solid #e8e8e8' }}
        >
          {/* RyderTag logo */}
          <div className="flex items-center">
            <span style={{ fontWeight: 800, fontSize: '20px', color: '#cc0000', letterSpacing: '-0.5px' }}>
              Ryder
            </span>
            <span style={{ fontWeight: 800, fontSize: '20px', color: '#6b6b6b', letterSpacing: '-0.5px' }}>
              Tag
            </span>
          </div>

          {/* Step indicators */}
          {!isConfirmation && (
            <div className="flex items-center gap-2">
              {flowSteps.map((step, i) => {
                const stepNum = i + 1;
                const isActive = step === currentScreen;
                const isCompleted = stepIndex > i;
                return (
                  <div
                    key={step}
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: 30,
                      height: 30,
                      background: isActive ? '#cc0000' : isCompleted ? '#cc0000' : '#e8e8e8',
                      color: isActive || isCompleted ? 'white' : '#9a9a9a',
                      fontWeight: 700,
                      fontSize: '13px',
                      opacity: isCompleted && !isActive ? 0.45 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    {stepNum}
                  </div>
                );
              })}
            </div>
          )}

          {/* Language switcher */}
          <div className="flex items-center gap-0.5">
            {['en', 'es', 'ht', 'pt'].map((lang) => (
              <button
                key={lang}
                onClick={() => onLanguageChange(lang)}
                className="rounded px-2 py-1 transition-all"
                style={{
                  background: language === lang ? '#cc0000' : 'transparent',
                  color: language === lang ? 'white' : '#9a9a9a',
                  fontWeight: 700,
                  fontSize: '11px',
                }}
              >
                {LANG_LABELS[lang]}
              </button>
            ))}
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="rounded px-2 py-1 ml-2 transition-all"
                title={authUser?.name ? `Signed in as ${authUser.name}` : 'Sign out'}
                style={{
                  background: 'transparent',
                  color: '#9a9a9a',
                  fontWeight: 700,
                  fontSize: '11px',
                  borderLeft: '1px solid #e8e8e8',
                  paddingLeft: '10px',
                  marginLeft: '6px',
                }}
              >
                Sign Out
              </button>
            )}
          </div>
        </header>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Bottom nav */}
      {!isWelcome && !isConfirmation && (
        <footer
          className="flex items-center justify-between px-6 py-3 shrink-0"
          style={{ background: 'white', borderTop: '1px solid #e8e8e8' }}
        >
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-2xl px-5 py-3 transition-all active:scale-95"
            style={{ background: '#f0f0f0', color: '#1a1a1a' }}
          >
            <ArrowLeft size={18} />
            <span style={{ fontWeight: 700, fontSize: '15px' }}>Back</span>
          </button>

          <button
            onClick={onHome}
            className="flex items-center gap-2 rounded-2xl px-5 py-3 transition-all active:scale-95"
            style={{ background: '#f0f0f0', color: '#1a1a1a' }}
          >
            <Home size={18} />
            <span style={{ fontWeight: 700, fontSize: '15px' }}>Home</span>
          </button>
        </footer>
      )}
    </div>
  );
}