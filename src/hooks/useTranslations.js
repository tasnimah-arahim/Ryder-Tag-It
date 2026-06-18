import { useState, useEffect } from 'react';
import { TRANSLATIONS, ISSUE_CATEGORIES } from '../components/kiosk-types';
import { translateStrings } from '../services/api';

export function useTranslations(language) {
  const [state, setState] = useState(() => ({
    t: TRANSLATIONS['en'],
    issueTranslations: null,
    loading: language !== 'en',
  }));

  useEffect(() => {
    // English is the source language — no translation needed.
    if (language === 'en') {
      setState({ t: TRANSLATIONS['en'], issueTranslations: null, loading: false });
      return;
    }

    const en = TRANSLATIONS['en'];

    // 1. Flat string keys (top-level, non-object values)
    const flatEntries = Object.entries(en).filter(([, v]) => typeof v === 'string');
    const flatTexts   = flatEntries.map(([, v]) => v);

    // 2. Area labels
    const areaEntries = Object.entries(en.areas);
    const areaTexts   = areaEntries.map(([, v]) => v);

    // 3. Device labels
    const deviceEntries = Object.entries(en.devices);
    const deviceTexts   = deviceEntries.map(([, v]) => v);

    // 4. Unique issue-category strings (using English as the stable source key)
    const allIssues          = Object.values(ISSUE_CATEGORIES).flat();
    const uniqueIssueTexts   = [...new Set(allIssues.map(i => i.en))];

    const allTexts = [...flatTexts, ...areaTexts, ...deviceTexts, ...uniqueIssueTexts];

    translateStrings(allTexts, language)
      .then(translated => {
        let idx = 0;

        // Rebuild the translations object in the same shape as TRANSLATIONS['en']
        const newT = { ...en };
        flatEntries.forEach(([k]) => { newT[k] = translated[idx++]; });

        newT.areas = { ...en.areas };
        areaEntries.forEach(([k]) => { newT.areas[k] = translated[idx++]; });

        newT.devices = { ...en.devices };
        deviceEntries.forEach(([k]) => { newT.devices[k] = translated[idx++]; });

        // Build a lookup map for issue labels
        const issueTranslations = {};
        uniqueIssueTexts.forEach(enText => { issueTranslations[enText] = translated[idx++]; });

        const result = { t: newT, issueTranslations };
        setState({ ...result, loading: false });
      })
      .catch(err => {
        console.warn('[useTranslations] Azure translation failed, falling back to English:', err.message);
        setState({ t: TRANSLATIONS['en'], issueTranslations: null, loading: false });
      });
  }, [language]);

  return state;
}
