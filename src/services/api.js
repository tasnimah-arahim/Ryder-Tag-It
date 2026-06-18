
const BASE_URL = '/api';


// this is called by home.jsx to get the list of languages that will be on the welcome screen
export async function getLanguages() {
  const res = await fetch(`${BASE_URL}/languages`);
  return res.json();
}

// this is called by whereIssue.jsx, it passes the selected language so the backend knows whether or not to translate
export async function getAreas(lang) {
  const res = await fetch(`${BASE_URL}/areas?lang=${lang}`);
  return res.json();
}

// this is called by deviceselection.jsx, does the same as get areas
export async function getDevices(lang) {
  const res = await fetch(`${BASE_URL}/devices?lang=${lang}`);
  return res.json();
}

// this is called by issueClassification, it checks what dev was selected so it can return the right issues
export async function getIssueCategories(device, lang) {
  const res = await fetch(`${BASE_URL}/issues?device=${device}&lang=${lang}`);
  return res.json();
}

// translates an array of English strings to the given target language code via the backend.
// the backend keeps the Azure API key secret; never call Azure Translator directly from the browser.
export async function translateStrings(texts, targetLang) {
  const res = await fetch(`${BASE_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts, targetLang }),
  });
  if (!res.ok) throw new Error(`Translation request failed: ${res.status}`);
  const data = await res.json();
  return data.translated; // string[]
}

// called by submit.jsx, it sends the report obj to the backend to be sent to ServiceNow
export async function submitReport(reportData) {
  const res = await fetch(`${BASE_URL}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportData)
  });
  return res.json();
}
