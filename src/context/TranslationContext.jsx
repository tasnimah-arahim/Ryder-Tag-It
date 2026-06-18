import { createContext, useContext } from 'react';
import { TRANSLATIONS } from '../components/kiosk-types';

// The context value shape:
// {
//   t:                 object   — translations object (same shape as TRANSLATIONS['en'])
//   language:          string   — current language code, e.g. 'en', 'es', 'fr'
//   issueTranslations: object | null — { [enString]: translatedString } for dynamic langs
// }
export const TranslationContext = createContext({
  t: TRANSLATIONS['en'],
  language: 'en',
  issueTranslations: null,
});

// Drop-in replacement for: const t = TRANSLATIONS[language] ?? TRANSLATIONS['en'];
export function useT() {
  return useContext(TranslationContext).t;
}

// Use in IssueClassification to resolve issue labels for any language.
// Returns a resolver function that can safely be called inside .map().
// For static langs (en/es/ht/pt) it reads from the issue object directly.
// For dynamic langs it reads from the Azure-translated map.
export function useIssueResolver() {
  const { language, issueTranslations } = useContext(TranslationContext);
  return (issue) => {
    if (issueTranslations && issueTranslations[issue.en]) {
      return issueTranslations[issue.en];
    }
    return issue[language] ?? issue.en;
  };
}
