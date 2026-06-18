import { Edit3, Send, MapPin, Monitor, Tag, MessageSquare, User } from 'lucide-react';
import { useT } from '../context/TranslationContext';

function SummaryRow({ icon: Icon, label, value, onEdit }) {
  if (!value) return null;
  return (
    <div
      className="flex items-center gap-4 rounded-2xl p-4"
      style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)' }}
    >
      <div
        className="flex items-center justify-center rounded-xl shrink-0"
        style={{ width: 38, height: 38, background: 'white' }}
      >
        <Icon size={18} color="#cc0000" />
      </div>
      <div className="flex-1 min-w-0">
        <div style={{
          fontSize: 'clamp(9px, 1.5vw, 11px)',
          color: 'rgba(255,255,255,0.6)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {label}
        </div>
        <div style={{
          fontSize: 'clamp(14px, 2vw, 16px)',
          fontWeight: 700,
          color: 'white',
          marginTop: 2,
          lineHeight: 1.3
        }}>
          {value}
        </div>
      </div>
      {onEdit && (
        <button
          onClick={onEdit}
          className="rounded-xl p-2 transition-all active:scale-95"
          style={{ background: 'rgba(255,255,255,0.2)' }}
        >
          <Edit3 size={16} color="white" />
        </button>
      )}
    </div>
  );
}

export function Submit({ language, data, onEdit, onSubmit }) {
  const t = useT();

  const locationParts = [
    data.stationNumber && `Station ${data.stationNumber}`,
    data.workstationNumber && `WS ${data.workstationNumber}`,
    data.dockDoorNumber && `Door ${data.dockDoorNumber}`,
  ].filter(Boolean).join(' · ');

  return (
    <div
      className="flex flex-col px-6 py-6"
      style={{ minHeight: 'calc(100dvh - 108px)' }}
    >
      <h2 style={{
        fontSize: 'clamp(22px, 4vw, 28px)',
        fontWeight: 800,
        color: 'white',
        marginBottom: '20px',
        lineHeight: 1.2,
      }}>
        {t.reviewSubmit}
      </h2>

      <div className="flex flex-col gap-3 flex-1">
        {data.reporterName && (
          <SummaryRow
            icon={User}
            label={t.reporter}
            value={data.reporterName}
            onEdit={() => onEdit('reporter')}
          />
        )}
        <SummaryRow
          icon={MapPin}
          label={t.area}
          value={data.area}
          onEdit={() => onEdit('area')}
        />
        <SummaryRow
          icon={MapPin}
          label={t.location}
          value={locationParts}
          onEdit={() => onEdit('location')}
        />
        <SummaryRow
          icon={Monitor}
          label={t.device}
          value={data.device}
          onEdit={() => onEdit('device')}
        />
        <SummaryRow
          icon={Tag}
          label={t.issue}
          value={data.issueCategory}
          onEdit={() => onEdit('classification')}
        />
        {data.additionalComments && (
          <SummaryRow
            icon={MessageSquare}
            label={t.comments}
            value={data.additionalComments}
            onEdit={() => onEdit('classification')}
          />
        )}
      </div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={() => onEdit('area')}
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl transition-all active:scale-95"
          style={{
            background: 'rgba(255,255,255,0.18)',
            color: 'white',
            fontWeight: 700,
            fontSize: 'clamp(14px, 2vw, 16px)',
            padding: 'clamp(14px, 2.5vh, 18px) 0',
            border: '2px solid rgba(255,255,255,0.35)',
          }}
        >
          <Edit3 size={18} />
          {t.editReport}
        </button>
        <button
          onClick={onSubmit}
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl transition-all active:scale-95"
          style={{
            background: 'white',
            color: '#cc0000',
            fontWeight: 800,
            fontSize: 'clamp(14px, 2vw, 16px)',
            padding: 'clamp(14px, 2.5vh, 18px) 0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}
        >
          <Send size={18} />
          {t.submitTicket}
        </button>
      </div>
    </div>
  );
}