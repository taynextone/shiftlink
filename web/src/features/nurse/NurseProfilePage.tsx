import { PageHeader } from '../../components/PageHeader';
import { AsyncState } from '../../components/AsyncState';
import { useAsyncData } from '../../hooks/useAsyncData';
import { api } from '../../lib/api';

export function NurseProfilePage() {
  const { data, loading, error } = useAsyncData(() => api.getVerificationOverview(), []);
  const verification = data?.verification ?? null;

  return (
    <section className="stack page-stack">
      <PageHeader
        eyebrow="Pflegekraft"
        title="Profil & Verifikation"
        description="Matching-Freigabe ist eine Sicherheits- und Compliance-Grenze. Die Oberfläche zeigt diesen Zustand bewusst prominent und nüchtern an."
      />
      <AsyncState loading={loading} error={error} isEmpty={!verification} emptyMessage="Noch keine Verifikationsdaten vorhanden.">
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
      </AsyncState>
    </section>
  );
}
