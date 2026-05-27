import { useState } from 'react';
import { SignaturePad } from './SignaturePad';
import { FeedbackMessage } from './FeedbackMessage';

type SignatureDialogProps = {
  title: string;
  contractId: string;
  party: 'HOSPITAL' | 'NURSE';
  consentText: string;
  onSign: (contractId: string, party: 'HOSPITAL' | 'NURSE', consentText: string, signatureImage: string) => Promise<{ fullyExecuted: boolean }>;
  onClose: () => void;
  onStatus: (status: { tone: 'success' | 'error'; message: string }) => void;
};

export function SignatureDialog({
  title,
  contractId,
  party,
  consentText,
  onSign,
  onClose,
  onStatus,
}: SignatureDialogProps) {
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!signatureImage) {
      setError('Bitte unterschreiben Sie zuerst.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await onSign(contractId, party, consentText, signatureImage);
      if (result.fullyExecuted) {
        onStatus({ tone: 'success', message: 'Vertrag vollständig signiert! Beide Parteien haben unterschrieben.' });
      } else {
        onStatus({ tone: 'success', message: `${party === 'HOSPITAL' ? 'Klinik' : 'Pflegekraft'}-Signatur gespeichert. Auf Gegenpartei warten.` });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signatur fehlgeschlagen');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500, width: '90%' }}>
        <h3>{title}</h3>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <p className="hint">Vertrag: {contractId}</p>
            <p className="hint" style={{ marginTop: '0.5rem' }}>
              Mit Ihrer Unterschrift bestätigen Sie: <em>{consentText}</em>
            </p>
          </div>

          <SignaturePad
            onChange={setSignatureImage}
            width={400}
            height={200}
            label="Hier unterschreiben"
            error={error ?? undefined}
            disabled={submitting}
          />

          {error ? <FeedbackMessage tone="error" message={error} /> : null}
        </div>
        <div className="confirm-modal-actions">
          <button type="button" onClick={onClose} className="btn btn-ghost" disabled={submitting}>
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={submitting || !signatureImage}
          >
            {submitting ? 'Wird signiert…' : 'Unterschreiben'}
          </button>
        </div>
      </div>
    </div>
  );
}
