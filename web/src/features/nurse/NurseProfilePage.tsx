import { AsyncState } from '../../components/AsyncState';
import { FeedbackMessage } from '../../components/FeedbackMessage';
import { InfoList } from '../../components/InfoList';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
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
          </div>
        ) : null}
      </AsyncState>
    </section>
  );
}
