import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { KpiCard } from '../../components/KpiCard';
import { MetricList } from '../../components/MetricList';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useAuth } from '../../state/AuthContext';
import { api } from '../../lib/api';
import { buildInterventionHotspots, describeAsyncFailure, describeWebhookStatus, getCriticalAsyncFailures, getFailedWebhookEvents, getImportBlockedShifts, rankAsyncFailures } from './dashboard-helpers';

export function HospitalDashboardPage({ mode = 'hospital' }: { mode?: 'hospital' | 'superadmin' }) {
  const { session } = useAuth();
  const [failureQueueFilter, setFailureQueueFilter] = useState<'ALL' | 'billing' | 'webhook' | 'whatsapp'>('ALL');
  const isSuperAdmin = session?.role === 'SUPER_ADMIN';

  const { data: shiftData } = useAsyncData(() => api.listHospitalJobShifts(), []);
  const { data: billingData } = useAsyncData(() => api.getHospitalBillingSummary(), []);
  const { data: webhookData } = useAsyncData(() => api.listHospitalWebhookEvents(10), []);
  const { data: asyncFailureData } = useAsyncData(() => (isSuperAdmin ? api.listAsyncProcessFailures(10) : Promise.resolve({ failures: [] })), [isSuperAdmin]);

  const shifts = shiftData?.jobShifts ?? [];
  const billing = billingData?.summary;
  const webhookEvents = webhookData?.events ?? [];
  const asyncFailures = asyncFailureData?.failures ?? [];

  const openShifts = shifts.filter((shift) => shift.status === 'OPEN');
  const matchedShifts = shifts.filter((shift) => shift.status === 'MATCHED');
  const totalSignedOffers = shifts.reduce((sum, shift) => sum + (shift.offerCounts?.signed ?? 0), 0);
  const totalPendingOffers = shifts.reduce((sum, shift) => sum + (shift.offerCounts?.pending ?? 0), 0);
  const totalInvoiced = shifts.reduce((sum, shift) => sum + (shift.offerCounts?.invoiced ?? 0), 0);
  const importBlockedShifts = getImportBlockedShifts(shifts);
  const failedWebhookEvents = getFailedWebhookEvents(webhookEvents);
  const rankedWebhookEvents = useMemo(
    () => [...webhookEvents].sort((left, right) => {
      const leftFailed = left.status === 'FAILED_OR_PENDING_RETRY' ? 0 : 1;
      const rightFailed = right.status === 'FAILED_OR_PENDING_RETRY' ? 0 : 1;
      if (leftFailed !== rightFailed) {
        return leftFailed - rightFailed;
      }
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }),
    [webhookEvents],
  );
  const criticalAsyncFailures = getCriticalAsyncFailures(asyncFailures);
  const rankedAsyncFailures = rankAsyncFailures(asyncFailures);
  const visibleAsyncFailures = useMemo(
    () => rankedAsyncFailures.filter((failure) => failureQueueFilter === 'ALL' || failure.queueName === failureQueueFilter),
    [failureQueueFilter, rankedAsyncFailures],
  );

  const interventionHotspots = buildInterventionHotspots({
    isSuperAdmin,
    failedWebhookEvents,
    criticalAsyncFailures,
    totalPendingOffers,
    importBlockedShifts,
    billing,
  });

  const nextOperationalFocus = interventionHotspots.map((item) => item.hint);

  return (
    <section className="stack page-stack">
      <PageHeader
        eyebrow={mode === 'superadmin' ? 'Superadmin' : 'Krankenhaus'}
        title={mode === 'superadmin' ? 'Superadmin Operations Control Plane' : 'Hospital Operations Dashboard'}
        description={mode === 'superadmin' ? 'Zentrale Superadmin-Sicht auf operative Hotspots, Failures und Governance-nahe Interventionen.' : 'Zentrale operative Startseite für Bedarfe, Offers, Verträge und Billing. Fokus auf echtem Backend-Status statt Platzhalter-Widgets.'}
      />
      <div className="stats-grid">
        <KpiCard label="Offene Schichten" value={String(openShifts.length)} helper="Bedarfe, die aktiv in Kandidaten- und Offer-Arbeit gezogen werden können." />
        <KpiCard label="Pending Offers" value={String(totalPendingOffers)} helper="Angebote, bei denen operatives Follow-up oder Beobachtung nötig ist." />
        <KpiCard label="Signed Offers" value={String(totalSignedOffers)} helper="Bereits vertraglich gebundene Matchings mit weiterem Governance-/Execution-Bedarf." />
        <KpiCard label="Invoices" value={billing ? String(billing.invoiceCount) : '—'} helper="Rechnungsobjekte aus den bestehenden Plattformgebühren-Flows." />
        <KpiCard label="Webhook Issues" value={String(failedWebhookEvents.length)} helper="Fehlgeschlagene oder noch nicht sauber zugestellte Webhook-Events." />
        <KpiCard label="Async Failures" value={String(asyncFailures.length)} helper={isSuperAdmin ? 'Persistierte Worker-Fehler aus Billing-, WhatsApp- und Webhook-Verarbeitung.' : 'Persistierte Worker-Fehler sind nur in der Superadmin-Sicht sichtbar.'} />
      </div>
      <div className="content-grid two-thirds">
        <SectionCard title="Intervention Hotspots" description="Die wichtigsten operativen Spannungen, priorisiert für direkte Bearbeitung.">
          <MetricList
            items={[
              { label: 'Hotspots', value: interventionHotspots.length },
              { label: 'Matched Shifts', value: matchedShifts.length },
              { label: 'Invoiced Offers', value: totalInvoiced },
              { label: 'Pending Gebühren', value: billing ? `${billing.pendingInvoiceAmount} €` : '—' },
            ]}
          />
          <div className="record-list compact-list">
            {interventionHotspots.map((item) => (
              <Link className="selection-card" key={item.label} to={item.action}>
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.hint}</p>
                </div>
                <span>{item.value}</span>
              </Link>
            ))}
            {interventionHotspots.length === 0 ? <p className="hint">Aktuell keine priorisierten Intervention-Hotspots aus den sichtbaren Betriebsdaten.</p> : null}
          </div>
        </SectionCard>
        <SectionCard title="Operative Lage" description="Zusammenführung der wichtigsten Arbeitslage aus Schicht-, Offer- und Billing-Kontext.">
          <MetricList
            items={[
              { label: 'Schichten gesamt', value: shifts.length },
              { label: 'Matched Shifts', value: matchedShifts.length },
              { label: 'Import-blockierte Schichten', value: importBlockedShifts.length },
              { label: 'Pending Gebühren', value: billing ? `${billing.pendingInvoiceAmount} €` : '—' },
            ]}
          />
          <ol className="ordered-list compact-ordered-list">
            {nextOperationalFocus.length > 0 ? nextOperationalFocus.map((item) => <li key={item}>{item}</li>) : <li>Keine akute operative Spannung aus den aktuellen Kernmetriken sichtbar.</li>}
          </ol>
        </SectionCard>
        <SectionCard title="Webhook / Processing Visibility" description="Erste echte Sicht auf Delivery-Probleme und asynchrone Prozessspannung.">
          <MetricList
            items={[
              { label: 'Webhook Events', value: webhookEvents.length },
              { label: 'Probleme', value: failedWebhookEvents.length },
              { label: 'Angezeigte Einträge', value: rankedWebhookEvents.slice(0, 5).length },
              { label: 'Davon fehlgeschlagen', value: rankedWebhookEvents.slice(0, 5).filter((event) => event.status === 'FAILED_OR_PENDING_RETRY').length },
              { label: 'Zuletzt zugestellt', value: webhookEvents.find((event) => event.deliveredAt)?.deliveredAt ? new Date(webhookEvents.find((event) => event.deliveredAt)!.deliveredAt!).toLocaleString('de-DE') : '—' },
            ]}
          />
          <div className="record-list compact-list">
            {rankedWebhookEvents.slice(0, 5).map((event) => {
              const status = describeWebhookStatus(event);
              return (
                <Link className="panel subpanel" key={event.id} to={mode === 'superadmin' ? '/admin/ops' : '/hospital'}>
                  <strong>{event.eventType}</strong>
                  <p>{event.clinicName}</p>
                  <p>{status.label} · Attempts: {event.deliveryAttempts}</p>
                  <p>Letzter Versuch: {event.lastAttemptAt ? new Date(event.lastAttemptAt).toLocaleString('de-DE') : '—'}</p>
                  <p>{status.detail}</p>
                </Link>
              );
            })}
            {webhookEvents.length === 0 ? <p className="hint">Noch keine Webhook-Events sichtbar.</p> : null}
          </div>
        </SectionCard>
        <SectionCard title="Persistierte Worker-Fehler" description={isSuperAdmin ? 'Erste echte Sicht auf nicht nur Webhook-, sondern auch Billing-/WhatsApp-Verarbeitungsfehler.' : 'Diese Sicht ist bewusst auf Superadmin-Ebene begrenzt und erscheint für Hospital Admins nur als Governance-Hinweis.'}>
          <MetricList
            items={[
              { label: 'Fehler gesamt', value: asyncFailures.length },
              { label: 'Billing', value: asyncFailures.filter((item) => item.queueName === 'billing').length },
              { label: 'WhatsApp', value: asyncFailures.filter((item) => item.queueName === 'whatsapp').length },
              { label: 'Webhook', value: asyncFailures.filter((item) => item.queueName === 'webhook').length },
              { label: 'Im aktuellen Filter', value: visibleAsyncFailures.length },
            ]}
          />
          {isSuperAdmin ? (
            <>
              <div className="form-grid two">
                <label>
                  <span>Queue-Filter</span>
                  <select value={failureQueueFilter} onChange={(event) => setFailureQueueFilter(event.target.value as 'ALL' | 'billing' | 'webhook' | 'whatsapp')}>
                    <option value="ALL">Alle</option>
                    <option value="billing">billing</option>
                    <option value="webhook">webhook</option>
                    <option value="whatsapp">whatsapp</option>
                  </select>
                </label>
              </div>
              <p className="hint">Filter nur die sichtbare Fehlerliste; die KPI-Zahlen oben bleiben global.</p>
            </>
          ) : null}
          <div className="record-list compact-list">
            {visibleAsyncFailures.slice(0, 5).map((failure) => {
              const status = describeAsyncFailure(failure);
              const destination = failure.queueName === 'billing'
                ? '/hospital/billing'
                : failure.queueName === 'webhook'
                  ? mode === 'superadmin'
                    ? '/admin/ops'
                    : '/hospital'
                  : failure.queueName === 'whatsapp'
                    ? '/hospital/offers'
                    : mode === 'superadmin'
                      ? '/admin/ops'
                      : '/hospital';
              const nextActionLabel = failure.queueName === 'billing'
                ? 'Zu Billing-Intervention'
                : failure.queueName === 'webhook'
                  ? 'Zu Webhook-Ops'
                  : failure.queueName === 'whatsapp'
                    ? 'Zu Offer-Kommunikation'
                    : 'Zu Ops-Übersicht';
              return (
                <Link className="panel subpanel" key={failure.id} to={destination}>
                  <strong>{failure.queueName} · {failure.jobName}</strong>
                  <p>{status.label}</p>
                  <p>{failure.errorMessage}</p>
                  <p>{status.detail}</p>
                  <p>Job ID: {failure.jobId ?? '—'}</p>
                  <p>Entity: {failure.relatedEntityId ?? '—'}</p>
                  <p>Attempts: {failure.attemptCount ?? 0}</p>
                  <p>Nächster Pfad: {nextActionLabel}</p>
                  <p>{new Date(failure.createdAt).toLocaleString('de-DE')}</p>
                </Link>
              );
            })}
            {visibleAsyncFailures.length === 0 ? <p className="hint">{isSuperAdmin ? 'Für den aktuellen Queue-Filter sind keine persistierten Worker-Fehler sichtbar.' : 'Für Hospital Admins ist diese Fehlerklasse nicht direkt sichtbar; bei Bedarf Superadmin einbeziehen.'}</p> : null}
          </div>
        </SectionCard>
        <SectionCard title="Direkte Arbeitswege" description="Schneller Einstieg in die bereits ausgebauten Operations-Flows.">
          <MetricList
            items={[
              { label: 'Offers', value: 'Kandidaten & Angebotssteuerung' },
              { label: 'Verträge', value: 'Lifecycle, Execution, PDFs' },
              { label: 'Billing', value: 'Gebühren & Exporte' },
              { label: 'Dossiers', value: 'verifizierte Nurse-Unterlagen' },
            ]}
          />
          <div className="record-list compact-list">
            <Link className="selection-card" to="/hospital/shifts">
              <div>
                <strong>Schichten öffnen</strong>
                <p>Bedarfe importieren und operative Grundlage prüfen</p>
              </div>
            </Link>
            <Link className="selection-card" to="/hospital/offers">
              <div>
                <strong>Offers öffnen</strong>
                <p>Kandidaten suchen, Offer-Antworten steuern und Antwortlage verfolgen</p>
              </div>
            </Link>
            <Link className="selection-card" to="/hospital/contracts">
              <div>
                <strong>Verträge öffnen</strong>
                <p>Lifecycle, Execution und Artefakte steuern</p>
              </div>
            </Link>
            <Link className="selection-card" to="/hospital/billing">
              <div>
                <strong>Billing öffnen</strong>
                <p>Gebühren, Rechnungen und Exportdaten prüfen</p>
              </div>
            </Link>
            {mode === 'superadmin' ? (
              <Link className="selection-card" to="/admin/verification">
                <div>
                  <strong>Verification Ops öffnen</strong>
                  <p>Dokumentenprüfung, Release-Entscheidungen und Rücknahmen zentral bearbeiten</p>
                </div>
              </Link>
            ) : null}
          </div>
        </SectionCard>
      </div>
    </section>
  );
}
