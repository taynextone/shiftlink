import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AsyncState } from '../../components/AsyncState';
import { ConfirmModal } from '../../components/ConfirmModal';
import { FeedbackMessage } from '../../components/FeedbackMessage';
import { Field } from '../../components/Field';
import { InfoList } from '../../components/InfoList';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useAuth } from '../../state/AuthContext';
import { api } from '../../lib/api';

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  EXAMEN: 'Examen',
  SPECIALIZATION_CERTIFICATE: 'Fachweiterbildung',
  OCCUPATIONAL_HEALTH_CLEARANCE: 'Arbeitsmedizinischer Nachweis',
};

const ALL_DOCUMENT_TYPES = ['EXAMEN', 'SPECIALIZATION_CERTIFICATE', 'OCCUPATIONAL_HEALTH_CLEARANCE'] as const;

function VerificationTimeline({ documents }: { documents: Array<{ id: string; documentType: string; status: string; reviewedAt?: string | null; createdAt: string; rejectionReason?: string | null }> }) {
  const events = documents
    .flatMap((doc) => [
      { type: 'uploaded', date: doc.createdAt, documentType: doc.documentType, status: 'PENDING' },
      ...(doc.reviewedAt
        ? [{ type: doc.status === 'VERIFIED' ? 'verified' : 'rejected', date: doc.reviewedAt, documentType: doc.documentType, status: doc.status }]
        : []),
    ])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (events.length === 0) return null;

  return (
    <div className="timeline">
      {events.map((event, index) => {
        const doc = documents.find((d) => d.documentType === event.documentType);
        return (
          <div key={`${event.type}-${event.documentType}-${index}`} className={`timeline-item status-${event.status.toLowerCase()}`}>
            <span className="timeline-dot" />
            <div className="timeline-content">
              <p>
                <strong>{DOCUMENT_TYPE_LABELS[event.documentType] ?? event.documentType}</strong>
                {' — '}
                {event.type === 'uploaded' && 'Hochgeladen'}
                {event.type === 'verified' && 'Verifiziert'}
                {event.type === 'rejected' && 'Abgelehnt'}
              </p>
              <p className="hint">{new Date(event.date).toLocaleString('de-DE')}</p>
              {event.type === 'rejected' && doc?.rejectionReason ? (
                <p className="hint">Grund: {doc.rejectionReason}</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function NurseProfilePage() {
  const navigate = useNavigate();
  const { setAuthenticatedUser } = useAuth();
  const { data, loading, error, reload } = useAsyncData(() => api.getVerificationOverview(), []);
  const verification = data?.verification ?? null;
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<'EXAMEN' | 'SPECIALIZATION_CERTIFICATE' | 'OCCUPATIONAL_HEALTH_CLEARANCE'>('EXAMEN');
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Track which document types the nurse has already uploaded (any status)
  const uploadedTypes = new Set(verification?.documents.map((d) => d.documentType) ?? []);
  const availableTypes = ALL_DOCUMENT_TYPES.filter((t) => !uploadedTypes.has(t));

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadStatus({ tone: 'error', message: 'Datei ist zu groß (max. 10 MB).' });
      return;
    }

    setUploading(true);
    setUploadStatus(null);
    try {
      await api.uploadVerificationDocument({
        documentType: selectedDocumentType,
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
      });
      setUploadStatus({ tone: 'success', message: `Dokument "${file.name}" erfolgreich hochgeladen.` });
      await reload();
    } catch (err) {
      setUploadStatus({ tone: 'error', message: err instanceof Error ? err.message : 'Upload fehlgeschlagen' });
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await api.deleteAccount();
      await setAuthenticatedUser(null);
      navigate('/');
    } catch (err) {
      setUploadStatus({ tone: 'error', message: err instanceof Error ? err.message : 'Account-Löschung fehlgeschlagen' });
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function handleExportData() {
    setExporting(true);
    setUploadStatus(null);
    try {
      const result = await api.exportData();
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shiftlink-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setUploadStatus({ tone: 'success', message: 'Datenexport heruntergeladen.' });
    } catch (err) {
      setUploadStatus({ tone: 'error', message: err instanceof Error ? err.message : 'Export fehlgeschlagen' });
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className="stack page-stack">
      <PageHeader
        eyebrow="Pflegekraft"
        title="Profil & Verifikation"
        description="Matching-Freigabe ist eine Sicherheits- und Compliance-Grenze. Die Oberfläche zeigt diesen Zustand bewusst prominent und nüchtern an."
      />
      {error ? <FeedbackMessage tone="error" message={error} /> : null}
      <AsyncState loading={loading} isEmpty={!verification} emptyMessage="Noch keine Verifikationsdaten vorhanden.">
        {verification ? (
          <div className="content-grid two-columns-equal">
            <SectionCard
              title="Matching-Freigabe"
              description="Gate für Marketplace-Sichtbarkeit und Angebotsfähigkeit."
              actions={<StatusBadge value={verification.isReleasedForMatching ? 'released' : 'pending'} />}
            >
              <InfoList
                items={[
                  { label: 'Freigegeben', value: verification.isReleasedForMatching ? 'Ja' : 'Nein' },
                  { label: 'Released at', value: verification.releasedAt ? new Date(verification.releasedAt).toLocaleString('de-DE') : '—' },
                ]}
              />
              {!verification.isReleasedForMatching && verification.documents.length > 0 && (
                <p className="hint" style={{ marginTop: '0.75rem' }}>
                  {verification.documents.every((d) => d.status === 'VERIFIED')
                    ? 'Alle Dokumente verifiziert. Freigabe durch Admin ausstehend.'
                    : 'Verifikation noch nicht abgeschlossen. Bitte lade alle erforderlichen Dokumente hoch.'}
                </p>
              )}
            </SectionCard>

            <SectionCard title="Dokumente" description="Verifikationsrelevante Nachweise mit Statussicht.">
              <div className="document-list">
                {verification.documents.length === 0 ? (
                  <p className="hint">Keine Dokumente hochgeladen.</p>
                ) : (
                  verification.documents.map((document) => (
                    <div className="document-row" key={document.id}>
                      <div>
                        <span>{DOCUMENT_TYPE_LABELS[document.documentType] ?? document.documentType}</span>
                        {document.reviewedAt ? (
                          <p className="hint">
                            Geprüft am {new Date(document.reviewedAt).toLocaleDateString('de-DE')}
                          </p>
                        ) : (
                          <p className="hint">Wird geprüft</p>
                        )}
                      </div>
                      <StatusBadge value={document.status} />
                    </div>
                  ))
                )}
              </div>
            </SectionCard>

            <SectionCard title="Verifikations-Verlauf" description="Zeitlicher Ablauf der Verifikationsschritte.">
              {verification.documents.length > 0 ? (
                <VerificationTimeline documents={verification.documents} />
              ) : (
                <p className="hint">Noch keine Verifikationsaktivität.</p>
              )}
            </SectionCard>

            <SectionCard title="Datenschutz & Account" description="DSGVO-Rechte: Datenexport und Account-Löschung.">
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => void handleExportData()}
                  disabled={exporting}
                >
                  {exporting ? 'Exportiert…' : 'Daten exportieren (JSON)'}
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => setConfirmDelete(true)}
                  disabled={deleting}
                >
                  Account löschen
                </button>
              </div>
              <p className="hint" style={{ marginTop: '0.5rem' }}>
                Die Account-Löschung entfernt alle personenbezogenen Daten unwiderruflich. Verträge und Rechnungen bleiben aus Compliance-Gründen anonymisiert erhalten.
              </p>
            </SectionCard>

            {availableTypes.length > 0 && (
              <SectionCard title="Dokument hochladen" description="Lade Verifikationsnachweise hoch (max. 10 MB, PDF oder Bilder).">
                <div className="form-grid two">
                  <Field label="Dokumenttyp">
                    <select value={selectedDocumentType} onChange={(event) => setSelectedDocumentType(event.target.value as typeof selectedDocumentType)}>
                      {availableTypes.map((t) => (
                        <option key={t} value={t}>{DOCUMENT_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Datei">
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} disabled={uploading} />
                  </Field>
                </div>
                {uploading ? <p className="hint">Upload läuft…</p> : null}
                {uploadStatus ? <FeedbackMessage tone={uploadStatus.tone} message={uploadStatus.message} /> : null}
              </SectionCard>
            )}
          </div>
        ) : null}
      </AsyncState>
      {confirmDelete ? (
        <ConfirmModal
          title="Account unwiderruflich löschen"
          message="Alle personenbezogenen Daten werden gelöscht. Dieser Vorgang kann nicht rückgängig gemacht werden."
          confirmLabel="Ja, Account löschen"
          cancelLabel="Abbrechen"
          tone="danger"
          onConfirm={() => void handleDeleteAccount()}
          onCancel={() => setConfirmDelete(false)}
        />
      ) : null}
    </section>
  );
}
