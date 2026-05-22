import { useState } from 'react';
import { ActionBar } from '../../components/ActionBar';
import { FeedbackMessage } from '../../components/FeedbackMessage';
import { Field } from '../../components/Field';
import { FormSection } from '../../components/FormSection';
import { InfoList } from '../../components/InfoList';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { api, type VerificationDocumentReviewResult } from '../../lib/api';

export function AdminVerificationPage() {
  const [documentId, setDocumentId] = useState('');
  const [status, setStatus] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');
  const [rejectionReason, setRejectionReason] = useState('');
  const [result, setResult] = useState<VerificationDocumentReviewResult | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const rejectionRequired = status === 'REJECTED';
  const canSubmit = documentId.trim().length > 0 && (!rejectionRequired || rejectionReason.trim().length >= 3);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      setFeedback({ tone: 'error', message: 'Bitte Eingaben vervollständigen, bevor du fortfährst.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const response = await api.reviewVerificationDocument({
        documentId: documentId.trim(),
        status,
        rejectionReason: rejectionRequired ? rejectionReason.trim() : undefined,
      });
      setResult(response.verificationDocument);
      setFeedback({ tone: 'success', message: `Dokument ${status === 'VERIFIED' ? 'verifiziert' : 'abgelehnt'}.` });
    } catch (error) {
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Review fehlgeschlagen' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="stack page-stack">
      <PageHeader
        eyebrow="Operations"
        title="Verification Review"
        description="Erste Superadmin-Oberfläche für die operative Prüfung und Freigabe von Verifikationsdokumenten."
      />
      <div className="content-grid two-columns-equal">
        <form className="panel form-panel stack" onSubmit={handleSubmit}>
          <FormSection title="Dokumentenreview" description="Greift auf den echten Superadmin-Review-Endpoint zurück und aktualisiert den Release-Zustand der Pflegekraft.">
            <Field label="Document ID" helpText="Echte VerificationDocument-ID aus dem Backoffice-/Datenkontext.">
              <input value={documentId} onChange={(event) => setDocumentId(event.target.value)} placeholder="documentId" />
            </Field>
            <Field label="Entscheidung">
              <select value={status} onChange={(event) => setStatus(event.target.value as 'VERIFIED' | 'REJECTED')}>
                <option value="VERIFIED">VERIFIED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </Field>
            {rejectionRequired ? (
              <Field label="Rejection Reason" helpText="Mindestens 3 Zeichen Begründung bei Ablehnung.">
                <input value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Begründung" />
              </Field>
            ) : null}
          </FormSection>
          <ActionBar>
            <button type="submit" disabled={submitting || !canSubmit}>{submitting ? 'Prüft…' : 'Review ausführen'}</button>
          </ActionBar>
        </form>

        <SectionCard title="Review Result" description="Zeigt den zurückgelieferten Dokument- und Nurse-Status nach der Aktion.">
          {result ? (
            <>
              <div className="summary-grid">
                <div className="summary-card">
                  <span>Document Status</span>
                  <StatusBadge value={result.status} />
                </div>
                <div className="summary-card">
                  <span>Nurse Release</span>
                  <StatusBadge value={result.nurseProfile.isReleasedForMatching ? 'released' : 'pending'} />
                </div>
              </div>
              <InfoList
                items={[
                  { label: 'Document ID', value: result.id },
                  { label: 'Typ', value: result.documentType },
                  { label: 'Reviewed At', value: result.reviewedAt ? new Date(result.reviewedAt).toLocaleString('de-DE') : '—' },
                  { label: 'Pflegekraft', value: `${result.nurseProfile.displayName} (${result.nurseProfile.publicId})` },
                  { label: 'Rejection Reason', value: result.rejectionReason ?? '—' },
                ]}
              />
            </>
          ) : (
            <p className="hint">Noch kein Dokument geprüft.</p>
          )}
        </SectionCard>
      </div>
      {feedback ? <FeedbackMessage tone={feedback.tone} message={feedback.message} /> : null}
    </section>
  );
}
