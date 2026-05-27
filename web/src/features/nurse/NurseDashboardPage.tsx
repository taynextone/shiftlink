import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { AsyncState } from '../../components/AsyncState';
import { FeedbackMessage } from '../../components/FeedbackMessage';
import { KpiCard } from '../../components/KpiCard';
import { MetricList } from '../../components/MetricList';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { api } from '../../lib/api';

export function NurseDashboardPage() {
  const { data, loading, error } = useAsyncData(() => api.getNurseDashboardSummary(), []);
  const dashboard = data?.dashboard;

  const pendingDocuments = useMemo(
    () => dashboard?.documents.filter((d) => d.status === 'PENDING').length ?? 0,
    [dashboard],
  );

  const completedDocs = useMemo(
    () => dashboard?.documents.filter((d) => d.status === 'VERIFIED').length ?? 0,
    [dashboard],
  );

  const activeContracts = useMemo(
    () => dashboard?.recentContracts.filter((c) => ['SIGNED', 'ACTIVATED'].includes(c.status)).length ?? 0,
    [dashboard],
  );

  return (
    <section className="stack page-stack">
      <PageHeader
        eyebrow="Pflegekraft"
        title="Dashboard"
        description="Überblick über Verifikation, Verfügbarkeit und aktive Verträge."
      />

      {error ? <FeedbackMessage tone="error" message={error} /> : null}

      <AsyncState loading={loading} isEmpty={!dashboard} emptyMessage="Lade Dashboard…">
        {dashboard && (
          <>
            {/* Onboarding progress */}
            <SectionCard
              title={dashboard.onboarding.isComplete ? '✅ Profil vollständig' : `Onboarding (${dashboard.onboarding.completedSteps}/${dashboard.onboarding.totalSteps})`}
              description={dashboard.onboarding.isComplete
                ? 'Alle Schritte abgeschlossen. Du bist einsatzbereit.'
                : 'Vervollständige diese Schritte, um auf dem Marketplace sichtbar zu sein.'}
            >
              <div className="onboarding-steps">
                {dashboard.onboarding.steps.map((step) => (
                  <div key={step.label} className={`onboarding-step ${step.done ? 'done' : 'pending'}`}>
                    <span className={step.done ? 'status-badge success' : 'status-badge'}>
                      {step.done ? '✓' : '○'}
                    </span>
                    <span>{step.label}</span>
                  </div>
                ))}
              </div>
              {!dashboard.onboarding.isComplete && (
                <div style={{ marginTop: '0.75rem' }}>
                  <Link to="/nurse/profile">→ Zu Profil & Verifikation</Link>
                </div>
              )}
            </SectionCard>

            {/* KPI row */}
            <div className="stats-grid">
              <KpiCard
                label="Matching-Freigabe"
                value={dashboard.nurseProfile.isReleasedForMatching ? 'Aktiv' : 'Ausstehend'}
                helper={dashboard.nurseProfile.isReleasedForMatching
                  ? `Freigegeben am ${dashboard.nurseProfile.releasedAt ? new Date(dashboard.nurseProfile.releasedAt).toLocaleDateString('de-DE') : '—'}`
                  : 'Warte auf Verifikationsfreigabe durch Admin.'}
              />
              <KpiCard
                label="Dokumente"
                value={`${completedDocs}/${dashboard.documents.length}`}
                helper={pendingDocuments > 0 ? `${pendingDocuments} Dokumente werden geprüft` : 'Alle Dokumente verifiziert.'}
              />
              <KpiCard
                label="Aktive Verträge"
                value={`${activeContracts}`}
                helper={`${dashboard.recentContracts.length} Verträge insgesamt`}
              />
            </div>

            <div className="content-grid two-columns-equal">
              {/* Recent contracts */}
              <SectionCard title="Letzte Verträge" description="Deine aktuellen und vergangenen Verträge.">
                {dashboard.recentContracts.length > 0 ? (
                  <div className="record-list compact-list">
                    {dashboard.recentContracts.map((contract) => (
                      <Link to={`/nurse/contracts?contractId=${contract.id}`} key={contract.id} className="selection-card">
                        <div>
                          <strong>{contract.jobShift.title ?? 'Einsatz'}</strong>
                          <p className="hint">
                            {contract.jobShift.locationCity} · {new Date(contract.jobShift.startTime).toLocaleDateString('de-DE')}
                          </p>
                          {contract.latestInvoice && (
                            <p className="hint">Rechnung: {contract.latestInvoice.status} · {contract.latestInvoice.amount} €</p>
                          )}
                        </div>
                        <StatusBadge value={contract.status} />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="hint">Noch keine Verträge. Sobald du Matching-Freigabe hast, siehst du hier Angebote.</p>
                )}
              </SectionCard>

              {/* Upcoming availability */}
              <SectionCard title="Kommende Verfügbarkeit" description="Deine eingetragenen Verfügbarkeitsblöcke.">
                {dashboard.upcomingAvailability.length > 0 ? (
                  <div className="record-list compact-list">
                    {dashboard.upcomingAvailability.map((block) => (
                      <Link to="/nurse/availability" key={block.id} className="selection-card">
                        <div>
                          <strong>{block.title ?? 'Verfügbarkeit'}</strong>
                          <p className="hint">
                            {block.city} · {new Date(block.startTime).toLocaleDateString('de-DE')} → {new Date(block.endTime).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <>
                    <p className="hint">Keine Verfügbarkeit eingetragen.</p>
                    <Link to="/nurse/availability">→ Verfügbarkeit eintragen</Link>
                  </>
                )}
              </SectionCard>
            </div>

            {/* Document status */}
            {dashboard.documents.length > 0 && (
              <SectionCard title="Verifikationsdokumente" description="Status deiner hochgeladenen Dokumente.">
                <div className="document-list">
                  {dashboard.documents.map((doc) => (
                    <div className="document-row" key={doc.id}>
                      <span>{doc.documentType}</span>
                      <StatusBadge value={doc.status} />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                  <Link to="/nurse/profile">→ Dokumente verwalten</Link>
                </div>
              </SectionCard>
            )}
          </>
        )}
      </AsyncState>
    </section>
  );
}
