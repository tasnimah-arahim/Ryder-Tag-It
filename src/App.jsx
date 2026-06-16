import { useState } from 'react';
import { KioskShell } from './components/KioskShell';
import { Home } from './pages/Home';
import { WhereIssue } from './pages/WhereIssue';
import { ExactLocation } from './pages/ExactLocation';
import { DeviceSelection } from './pages/DeviceSelection';
import { IssueClassification } from './pages/IssueClassification';


// this is the deault state, every field gets reset to this when user goes back to home.
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
];

function App() {
  // this will track the screen that is being shown
  const [screen, setScreen] = useState('welcome');
  // language user selects, default is English
  const [language, setLanguage] = useState('en');
  // this will hold all the data the user inputs, it gets reset when user goes back to home
  const [report, setReport] = useState({ ...EMPTY_REPORT });


  const updateReport = (updates) => {
    // merge the updates into the report, ... prev is used to keep the existing values in report and only update the ones that are changed
    setReport((prev) => ({ ...prev, ...updates }));
  };

  // screens current position in screen_order is found, functions made to move back or forward
  const goNext = () => {
    const idx = SCREEN_ORDER.indexOf(screen);
    if (idx < SCREEN_ORDER.length - 1) setScreen(SCREEN_ORDER[idx + 1]);
  };

  const goBack = () => {
    const idx = SCREEN_ORDER.indexOf(screen);
    if (idx > 0) setScreen(SCREEN_ORDER[idx - 1]);
  };

  // resets reports, goes back to welcome screen
  const handleHome = () => {
    setScreen('welcome');
    setReport({ ...EMPTY_REPORT });
  };

  // depending on the value of screen, the corresponding component is rendered, 
  // props are passed down to each component to manage state and navigation
  const renderScreen = () => {
    switch (screen) {
      case 'welcome':
        return (
          <Home
            language={language}
            onStart={() => setScreen('area')}
            onLanguageChange={setLanguage}
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
      default:
        return null;
    }
  };


  return (
    <KioskShell
      currentScreen={screen}
      language={language}
      onBack={goBack}
      onHome={handleHome}
      onLanguageChange={setLanguage}
    >
      {renderScreen()}
    </KioskShell>
  );
}

export default App;