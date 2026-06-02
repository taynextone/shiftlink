import { useState } from 'react';
import { ActionBar } from '../../components/ActionBar';
import { FeedbackMessage } from '../../components/FeedbackMessage';
import { Field } from '../../components/Field';
import { FormSection } from '../../components/FormSection';
import { EmptyState } from '../../components/EmptyState';
import { InfoList } from '../../components/InfoList';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { ConfirmModal } from '../../components/ConfirmModal';
import { api, type AdminVerificationOverview, type VerificationDocumentReviewResult } from '../../lib/api';

export function AdminVerificationPage() {
  const [nursePublicId, setNursePublicId] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [status, setStatus] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');
  const [rejectionReason, setRejectionReason] = useState('');
  const [overview, setOverview] = useState<AdminVerificationOverview | null>(null);
  const [releaseReason, setReleaseReason] = useState('Operativ geprüft und für Matching freigegeben.');
  const [result, setResult] = useState<VerificationDocumentReviewResult | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | { title: string; message: string; tone: 'danger' | 'warning' | 'neutral'; onConfirm: () => void | Promise<void> }>(null);
  const rejectionRequired = status === 'REJECTED';
  const nursePublicIdError = !nursePublicId.trim() && feedback?.tone === 'error' && feedback.message.includes('Nurse Public ID') ? 'Pflichtfeld' : null;
  const documentIdError = !documentId.trim() && feedback?.tone === 'error' && feedback.message.includes('Dokument') ? 'Pflichtfeld' : null;
  const rejectionReasonError = rejectionRequired && rejectionReason.trim().length > 0 && rejectionReason.trim().length < 3 ? 'Mindestens 3 Zeichen' : null;
  const hasSelectableDocument = overview ? overview.documents.some((document) => document.id === documentId.trim()) : documentId.trim().length > 0;
  const canSubmit = hasSelectableDocument && (!rejectionRequired || rejectionReason.trim().length >= 3);
  const releaseStatusHint = overview?.nurseProfile.isReleasedForMatching
    ? `Freigegeben${overview.nurseProfile.releasedAt ? ` seit ${new Date(overview.nurseProfile.releasedAt).toLocaleString('de-DE')}` : ''}`
    : 'Noch nicht für Matching freigegeben';
  const reviewedDocuments = overview?.documents.filter((document) => document.reviewedAt).length ?? 0;

  async function handleLookup() {
    if (!nursePublicId.trim()) {
      setFeedback({ tone: 'error', message: 'Bitte zuerst eine Nurse Public ID eingeben.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      await refreshOverviewContext(nursePublicId.trim());
      setFeedback({ tone: 'success', message: 'Verification-Kontext geladen.' });
    } catch (error) {
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Lookup fehlgeschlagen' });
    } finally {
      setSubmitting(false);
    }
  }


  async function handleReleaseChange(release: boolean) {
    if (!overview?.nurseProfile.publicId) {
      setFeedback({ tone: 'error', message: 'Bitte zuerst Verifikationskontext laden.' });
      return;
    }
    if (!release) {
      setConfirmAction({
        title: 'Freigabe zurückziehen',
        message: `Freigabe wirklich zurückziehen?\n\nPflegekraft: ${overview.nurseProfile.displayName} (${overview.nurseProfile.publicId})`,
        tone: 'danger',
        onConfirm: async () => {
          setConfirmAction(null);
          setSubmitting(true);
          setFeedback(null);
          try {
            const response = await api.setMatchingRelease({
              publicId: overview.nurseProfile.publicId,
              release,
              reason: releaseReason.trim() || undefined,
            });
            setOverview(response.releaseControl);
            setResult(null);
            setFeedback({ tone: 'success', message: 'Pflegekraft für Matching zurückgezogen.' });
          } catch (error) {
            setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Release-Änderung fehlgeschlagen' });
          } finally {
            setSubmitting(false);
          }
        },
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const response = await api.setMatchingRelease({
        publicId: overview.nurseProfile.publicId,
        release,
        reason: releaseReason.trim() || undefined,
      });
      setOverview(response.releaseControl);
      setResult(null);
      setFeedback({ tone: 'success', message: 'Pflegekraft für Matching freigegeben.' });
    } catch (error) {
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Release-Änderung fehlgeschlagen' });
    } finally {
      setSubmitting(false);
    }
  }


  async function refreshOverviewContext(publicId: string) {
    const response = await api.getAdminVerificationOverview(publicId);
    setOverview(response.verification);
    setDocumentId((current) => {
      const documents = response.verification.documents;
      if (documents.length === 0) {
        return '';
      }
      return documents.some((document) => document.id === current) ? current : documents[0].id;
    });
  }

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
      await refreshOverviewContext(response.verificationDocument.nurseProfile.publicId);
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
            <Field label="Nurse Public ID" error={nursePublicIdError} helpText="Lädt die echte Verifikationslage einer Pflegekraft, damit Dokumente nicht blind per ID gesucht werden müssen.">
              <input value={nursePublicId} onChange={(event) => setNursePublicId(event.target.value)} placeholder="NUR-..." />
            </Field>
            <ActionBar>
              <button type="button" className="secondary" disabled={submitting || !nursePublicId.trim()} onClick={() => void handleLookup()}>
                {submitting ? 'Lädt…' : 'Verifikationskontext laden'}
              </button>
            </ActionBar>
            {overview ? (
              <>
                <InfoList
                  items={[
                    { label: 'Pflegekraft', value: `${overview.nurseProfile.displayName} (${overview.nurseProfile.publicId})` },
                    { label: 'Release', value: overview.nurseProfile.isReleasedForMatching ? 'released' : 'pending' },
                    { label: 'Release-Hinweis', value: releaseStatusHint },
                    { label: 'Dokumente', value: overview.documents.length },
                    { label: 'Bereits geprüft', value: reviewedDocuments },
                  ]}
                />
                <Field label="Release Reason" helpText="Wird für Freigabe oder Rücknahme mitgeführt, damit die Maßnahme operativ nachvollziehbar bleibt.">
                  <input value={releaseReason} onChange={(event) => setReleaseReason(event.target.value)} placeholder="Freigabegrund" />
                </Field>
                <ActionBar>
                  <button type="button" className="secondary" disabled={submitting} onClick={() => void handleReleaseChange(true)}>
                    {submitting ? 'Bitte warten…' : 'Für Matching freigeben'}
                  </button>
                  <button type="button" className="secondary" disabled={submitting} onClick={() => void handleReleaseChange(false)}>
                    {submitting ? 'Bitte warten…' : 'Freigabe zurückziehen'}
                  </button>
                </ActionBar>
                {overview.documents.length > 0 ? (
                  <>
                    <Field label="Dokument auswählen" helpText="Vorausgewählt ist das neueste verfügbare Dokument.">
                      <select value={documentId} onChange={(event) => setDocumentId(event.target.value)}>
                        {overview.documents.map((document) => (
                          <option key={document.id} value={document.id}>
                            {document.documentType} · {document.status} · {new Date(document.createdAt).toLocaleDateString('de-DE')}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <div className="record-list compact-list">
                      {overview.documents.map((document) => (
                        <button
                          key={document.id}
                          type="button"
                          className={documentId === document.id ? 'selection-card active' : 'selection-card'}
                          onClick={() => setDocumentId(document.id)}
                        >
                          <div>
                            <strong>{document.documentType}</strong>
                            <p>{new Date(document.createdAt).toLocaleDateString('de-DE')} · {document.id}</p>
                            <p>Reviewed: {document.reviewedAt ? new Date(document.reviewedAt).toLocaleString('de-DE') : 'noch nicht geprüft'}</p>
                            <p>{document.rejectionReason ?? 'Keine dokumentierte Ablehnungsbegründung.'}</p>
                          </div>
                          <StatusBadge value={document.status} />
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <EmptyState
                    title="Keine Dokumente im Verifikationskontext"
                    description="Für diese Pflegekraft liegt aktuell nichts zur Review-Entscheidung vor. Release-Entscheidungen bleiben oben separat steuerbar."
                  />
                )}
              </>
            ) : (
              <Field label="Document ID" error={documentIdError} helpText="Fallback, falls du direkt mit einer Dokument-ID arbeitest.">
                <input value={documentId} onChange={(event) => setDocumentId(event.target.value)} placeholder="documentId" />
              </Field>
            )}
            <Field label="Entscheidung" helpText="Ablehnung verlangt eine Begründung mit mindestens 3 Zeichen.">
              <select value={status} onChange={(event) => setStatus(event.target.value as 'VERIFIED' | 'REJECTED')}>
                <option value="VERIFIED">VERIFIED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </Field>
            {rejectionRequired ? (
              <Field label="Rejection Reason" error={rejectionReasonError} helpText="Mindestens 3 Zeichen Begründung bei Ablehnung.">
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
      {confirmAction ? (
        <ConfirmModal
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel="Bestätigen"
          cancelLabel="Abbrechen"
          tone={confirmAction.tone}
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      ) : null}
    </section>
  );
}
