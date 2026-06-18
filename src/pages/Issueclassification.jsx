import { ArrowRight } from 'lucide-react';
import { ISSUE_CATEGORIES } from '../components/kiosk-types';
import { useT, useIssueResolver } from '../context/TranslationContext';

export function IssueClassification({ language, data, onChange, onNext }) {
  const t = useT();
  const resolveIssue = useIssueResolver();

  // pull the right list of specific issues for whatever device was picked on the
  // previous screen -- falls back to an empty list if something's gone wrong upstream
  const issueOptions = ISSUE_CATEGORIES[data.device] ?? [];

  const canContinue = data.issueCategory.trim() !== '';

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
          marginBottom: '8px',
        }}
      >
        {t.issueClassification}
      </h2>

      {data.device && (
        <p
          style={{
            color: 'rgba(255,255,255,0.85)',
            textAlign: 'left',
            marginBottom: '24px',
            fontSize: '16px',
          }}
        >
          {t.devices[data.device] ?? data.device}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {issueOptions.map((issue) => {
          // the english string is used as the stored value -- stable id regardless of
          // which language the kiosk is currently displaying
          const value = issue.en;
          const selected = data.issueCategory === value;
          return (
            <button
              key={value}
              onClick={() => onChange({ issueCategory: value })}
              className="flex items-center gap-3 rounded-2xl text-left transition-all active:scale-95"
              style={{
                background: selected ? '#1a1a1a' : 'white',
                color: selected ? 'white' : '#1a1a1a',
                padding: '18px 20px',
                fontWeight: 700,
                fontSize: 'clamp(15px, 2vw, 17px)',
                border: 'none',
                boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '9999px',
                  flexShrink: 0,
                  background: selected ? 'white' : '#cc0000',
                  border: selected ? '2px solid white' : 'none',
                  boxShadow: selected ? 'inset 0 0 0 3px #1a1a1a' : 'none',
                }}
              />
              {resolveIssue(issue)}
            </button>
          );
        })}
      </div>

      <label
        style={{
          display: 'block',
          color: 'white',
          fontWeight: 700,
          fontSize: '13px',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginBottom: '8px',
          textAlign: 'left',
        }}
      >
        {t.additionalComments}
      </label>
      <textarea
        value={data.additionalComments}
        onChange={(e) => onChange({ additionalComments: e.target.value })}
        placeholder={t.typeHere}
        rows={4}
        className="w-full rounded-2xl mb-8"
        style={{
          background: 'rgba(255,255,255,0.12)',
          border: '2px solid rgba(255,255,255,0.3)',
          color: 'white',
          padding: '18px 20px',
          fontSize: '16px',
          fontWeight: 500,
          outline: 'none',
          boxSizing: 'border-box',
          resize: 'vertical',
          fontFamily: 'inherit',
        }}
      />

      <button
        onClick={onNext}
        disabled={!canContinue}
        className="flex items-center justify-center gap-2 rounded-2xl w-full transition-all active:scale-95"
        style={{
          background: canContinue ? 'white' : 'rgba(255,255,255,0.3)',
          color: canContinue ? '#cc0000' : 'rgba(255,255,255,0.7)',
          fontWeight: 800,
          fontSize: 'clamp(16px, 2.5vw, 20px)',
          padding: 'clamp(14px, 2.5vh, 20px) 0',
          border: 'none',
          cursor: canContinue ? 'pointer' : 'not-allowed',
        }}
      >
        {t.continue} <ArrowRight size={20} />
      </button>
    </div>
  );
}