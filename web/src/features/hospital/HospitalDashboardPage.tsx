import { Link } from 'react-router-dom';
import { KpiCard } from '../../components/KpiCard';
import { MetricList } from '../../components/MetricList';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { useAsyncData } from '../../hooks/useAsyncData';
import { api } from '../../lib/api';
import { buildInterventionHotspots, getCriticalAsyncFailures, getFailedWebhookEvents, getImportBlockedShifts, rankAsyncFailures } from './dashboard-helpers';

export function HospitalDashboardPage() {
  const { data: shiftData } = useAsyncData(() => api.listHospitalJobShifts(), []);
  const { data: billingData } = useAsyncData(() => api.getHospitalBillingSummary(), []);
  const { data: webhookData } = useAsyncData(() => api.listHospitalWebhookEvents(10), []);
  const { data: asyncFailureData } = useAsyncData(() => api.listAsyncProcessFailures(10), []);

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
  const criticalAsyncFailures = getCriticalAsyncFailures(asyncFailures);
  const rankedAsyncFailures = rankAsyncFailures(asyncFailures);

  const interventionHotspots = buildInterventionHotspots({
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
        eyebrow="Krankenhaus"
        title="Hospital Operations Dashboard"
        description="Zentrale operative Startseite für Bedarfe, Offers, Verträge und Billing. Fokus auf echtem Backend-Status statt Platzhalter-Widgets."
      />
      <div className="stats-grid">
        <KpiCard label="Offene Schichten" value={String(openShifts.length)} helper="Bedarfe, die aktiv in Kandidaten- und Offer-Arbeit gezogen werden können." />
        <KpiCard label="Pending Offers" value={String(totalPendingOffers)} helper="Angebote, bei denen operatives Follow-up oder Beobachtung nötig ist." />
        <KpiCard label="Signed Offers" value={String(totalSignedOffers)} helper="Bereits vertraglich gebundene Matchings mit weiterem Governance-/Execution-Bedarf." />
        <KpiCard label="Invoices" value={billing ? String(billing.invoiceCount) : '—'} helper="Rechnungsobjekte aus den bestehenden Plattformgebühren-Flows." />
        <KpiCard label="Webhook Issues" value={String(failedWebhookEvents.length)} helper="Fehlgeschlagene oder noch nicht sauber zugestellte Webhook-Events." />
        <KpiCard label="Async Failures" value={String(asyncFailures.length)} helper="Persistierte Worker-Fehler aus Billing-, WhatsApp- und Webhook-Verarbeitung." />
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
              { label: 'Zuletzt zugestellt', value: webhookEvents.find((event) => event.deliveredAt)?.eventType ?? '—' },
            ]}
          />
          <div className="record-list compact-list">
            {webhookEvents.slice(0, 5).map((event) => (
              <div className="panel subpanel" key={event.id}>
                <strong>{event.eventType}</strong>
                <p>{event.clinicName}</p>
                <p>{event.status} · Attempts: {event.deliveryAttempts}</p>
                <p>{event.lastError ?? 'keine Fehlermeldung'}</p>
              </div>
            ))}
            {webhookEvents.length === 0 ? <p className="hint">Noch keine Webhook-Events sichtbar.</p> : null}
          </div>
        </SectionCard>
        <SectionCard title="Persistierte Worker-Fehler" description="Erste echte Sicht auf nicht nur Webhook-, sondern auch Billing-/WhatsApp-Verarbeitungsfehler.">
          <MetricList
            items={[
              { label: 'Fehler gesamt', value: asyncFailures.length },
              { label: 'Billing', value: asyncFailures.filter((item) => item.queueName === 'billing').length },
              { label: 'WhatsApp', value: asyncFailures.filter((item) => item.queueName === 'whatsapp').length },
              { label: 'Webhook', value: asyncFailures.filter((item) => item.queueName === 'webhook').length },
            ]}
          />
          <div className="record-list compact-list">
            {rankedAsyncFailures.slice(0, 5).map((failure) => (
              <div className="panel subpanel" key={failure.id}>
                <strong>{failure.queueName} · {failure.jobName}</strong>
                <p>{failure.errorMessage}</p>
                <p>{new Date(failure.createdAt).toLocaleString('de-DE')}</p>
              </div>
            ))}
            {asyncFailures.length === 0 ? <p className="hint">Noch keine persistierten Worker-Fehler sichtbar.</p> : null}
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
                <p>Kandidaten suchen und Antwortlage verfolgen</p>
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
          </div>
        </SectionCard>
      </div>
    </section>
  );
}
