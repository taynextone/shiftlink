import { useState } from 'react';
import { AsyncState } from '../../components/AsyncState';
import { FeedbackMessage } from '../../components/FeedbackMessage';
import { Field } from '../../components/Field';
import { InfoList } from '../../components/InfoList';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { api } from '../../lib/api';

export function NurseProfilePage() {
  const { data, loading, error, reload } = useAsyncData(() => api.getVerificationOverview(), []);
  const verification = data?.verification ?? null;
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState('EXAMEN');

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
        documentType: selectedDocumentType as 'EXAMEN' | 'OCCUPATIONAL_HEALTH_CLEARANCE',
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
            </SectionCard>
            <SectionCard title="Dokumente" description="Verifikationsrelevante Nachweise mit Statussicht.">
              <div className="document-list">
                {verification.documents.map((document) => (
                  <div className="document-row" key={document.id}>
                    <span>{document.documentType}</span>
                    <StatusBadge value={document.status} />
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Dokument hochladen" description="Lade Verifikationsnachweise hoch (max. 10 MB, PDF oder Bilder).">
              <div className="form-grid two">
                <Field label="Dokumenttyp">
                  <select value={selectedDocumentType} onChange={(event) => setSelectedDocumentType(event.target.value)}>
                    <option value="EXAMEN">Examen</option>
                    <option value="OCCUPATIONAL_HEALTH_CLEARANCE">Arbeitszeugnis</option>
                  </select>
                </Field>
                <Field label="Datei">
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} disabled={uploading} />
                </Field>
              </div>
              {uploading ? <p className="hint">Upload läuft…</p> : null}
              {uploadStatus ? <FeedbackMessage tone={uploadStatus.tone} message={uploadStatus.message} /> : null}
            </SectionCard>
          </div>
        ) : null}
      </AsyncState>
    </section>
  );
}
