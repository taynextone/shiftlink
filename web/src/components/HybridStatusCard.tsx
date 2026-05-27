import { useState, useEffect } from 'react';
import { ActionBar } from './ActionBar';
import { api, type HybridSignatureStatus as HybridSigStatus } from '../lib/api';
import { FeedbackMessage } from './FeedbackMessage';
import { SectionCard } from './SectionCard';
import { StatusBadge } from './StatusBadge';

type HybridStatusCardProps = {
  contractId: string;
  onUpdatePaperStatus: (status: 'PENDING' | 'SIGNED' | 'WAIVED') => Promise<void>;
};

export function HybridStatusCard({ contractId, onUpdatePaperStatus }: HybridStatusCardProps) {
  const [status, setStatus] = useState<HybridSigStatus | null>(null);

  useEffect(() => {
    if (!contractId) return;
    api.getHybridSignatureStatus(contractId).then(setStatus).catch(() => {});
  }, [contractId]);

  if (!status) return <SectionCard title="Vertrags-Status" description="Lade Signatur-Status…"><p className="hint">Lade…</p></SectionCard>;
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  async function handlePaperAction(newStatus: 'PENDING' | 'SIGNED' | 'WAIVED') {
    setPending(true);
    setFeedback(null);
    try {
      await onUpdatePaperStatus(newStatus);
      setFeedback({ tone: 'success', message: `Papiervertrag-Status aktualisiert: ${newStatus}` });
    } catch (err) {
      setFeedback({ tone: 'error', message: err instanceof Error ? err.message : 'Aktualisierung fehlgeschlagen' });
    } finally {
      setPending(false);
    }
  }

  return (
    <SectionCard
      title="Vertrags-Status (EES + Papier)"
      description="Hybrid-Workflow: Digitale Unterschrift per Screen + Papiervertrag vor Ort"
    >
      <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="hint">Digitale Signatur (EES)</span>
          <span>
            {status.digital.fullySigned ? (
              <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Vollständig signiert</span>
            ) : (
              <span style={{ color: '#b7791f' }}>
                Klinik: {status.digital.hospitalSigned ? '✓' : '○'} | Pflegekraft: {status.digital.nurseSigned ? '✓' : '○'}
              </span>
            )}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="hint">Papiervertrag</span>
          <span>
            {status.paper.signed ? (
              <span style={{ color: '#16a34a', fontWeight: 600 }}>
                ✓ Vor Ort unterschrieben {status.paper.signedAt ? `am ${new Date(status.paper.signedAt).toLocaleDateString('de-DE')}` : ''}
              </span>
            ) : status.paper.waived ? (
              <span style={{ color: '#5c6b80' }}>— Verzichtet</span>
            ) : status.paper.status === 'PENDING' ? (
              <span style={{ color: '#b7791f' }}>○ Ausstehend</span>
            ) : (
              <span style={{ color: '#5c6b80' }}>— Nicht erforderlich</span>
            )}
          </span>
        </div>
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600 }}>Hybrid-Status</span>
          {status.hybridComplete ? (
            <span style={{ color: '#16a34a', fontWeight: 600 }}>✅ Bereit für Einsatz</span>
          ) : (
            <span style={{ color: '#b7791f', fontWeight: 600 }}>⏳ Noch nicht komplett</span>
          )}
        </div>
      </div>

      {feedback ? <FeedbackMessage tone={feedback.tone} message={feedback.message} /> : null}

      <ActionBar>
        <button type="button" disabled={pending} onClick={() => handlePaperAction('PENDING')}>
          Papier ausstehend
        </button>
        <button type="button" disabled={pending} onClick={() => handlePaperAction('SIGNED')}>
          Papier signiert
        </button>
        <button type="button" className="secondary" disabled={pending} onClick={() => handlePaperAction('WAIVED')}>
          Verzichten
        </button>
      </ActionBar>
    </SectionCard>
  );
}
