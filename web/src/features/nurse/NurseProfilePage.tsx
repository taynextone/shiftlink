import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { api, type VerificationOverview } from '../../lib/api';

export function NurseProfilePage() {
  const [verification, setVerification] = useState<VerificationOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getVerificationOverview()
      .then((data) => setVerification(data.verification))
      .catch((err) => setError(err instanceof Error ? err.message : 'Verifikationsstatus konnte nicht geladen werden'));
  }, []);

  return (
    <section className="stack page-stack">
      <PageHeader
        eyebrow="Pflegekraft"
        title="Profil & Verifikation"
        description="Matching-Freigabe ist eine Sicherheits- und Compliance-Grenze. Die Oberfläche zeigt diesen Zustand bewusst prominent und nüchtern an."
      />
      {error ? <p className="hint error">{error}</p> : null}
      {verification ? (
        <article className="panel detail-panel">
          <div className="detail-row">
            <span>Freigegeben für Matching</span>
            <strong>{verification.isReleasedForMatching ? 'Ja' : 'Nein'}</strong>
          </div>
          <div className="detail-row">
            <span>Released at</span>
            <strong>{verification.releasedAt ? new Date(verification.releasedAt).toLocaleString('de-DE') : '—'}</strong>
          </div>
          <div className="document-list">
            {verification.documents.map((document) => (
              <div className="document-row" key={document.id}>
                <span>{document.documentType}</span>
                <strong>{document.status}</strong>
              </div>
            ))}
          </div>
        </article>
      ) : null}
    </section>
  );
}
