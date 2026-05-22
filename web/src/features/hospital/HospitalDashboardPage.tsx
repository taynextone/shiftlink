import { Link } from 'react-router-dom';
import { KpiCard } from '../../components/KpiCard';
import { MetricList } from '../../components/MetricList';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { useAsyncData } from '../../hooks/useAsyncData';
import { api } from '../../lib/api';

export function HospitalDashboardPage() {
  const { data: shiftData } = useAsyncData(() => api.listHospitalJobShifts(), []);
  const { data: billingData } = useAsyncData(() => api.getHospitalBillingSummary(), []);

  const shifts = shiftData?.jobShifts ?? [];
  const billing = billingData?.summary;

  const openShifts = shifts.filter((shift) => shift.status === 'OPEN');
  const matchedShifts = shifts.filter((shift) => shift.status === 'MATCHED');
  const totalSignedOffers = shifts.reduce((sum, shift) => sum + (shift.offerCounts?.signed ?? 0), 0);
  const totalPendingOffers = shifts.reduce((sum, shift) => sum + (shift.offerCounts?.pending ?? 0), 0);
  const totalInvoiced = shifts.reduce((sum, shift) => sum + (shift.offerCounts?.invoiced ?? 0), 0);

  const nextOperationalFocus = [
    totalPendingOffers > 0 ? 'Pending Offers nachfassen' : null,
    openShifts.length > 0 ? 'offene Schichten in Kandidaten-/Offer-Flow ziehen' : null,
    billing && billing.pendingInvoiceAmount > 0 ? 'offene Gebühren im Billing prüfen' : null,
  ].filter(Boolean) as string[];

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
      </div>
      <div className="content-grid two-thirds">
        <SectionCard title="Operative Lage" description="Zusammenführung der wichtigsten Arbeitslage aus Schicht-, Offer- und Billing-Kontext.">
          <MetricList
            items={[
              { label: 'Schichten gesamt', value: shifts.length },
              { label: 'Matched Shifts', value: matchedShifts.length },
              { label: 'Invoiced Offers', value: totalInvoiced },
              { label: 'Pending Gebühren', value: billing ? `${billing.pendingInvoiceAmount} €` : '—' },
            ]}
          />
          <ol className="ordered-list compact-ordered-list">
            {nextOperationalFocus.length > 0 ? nextOperationalFocus.map((item) => <li key={item}>{item}</li>) : <li>Keine akute operative Spannung aus den aktuellen Kernmetriken sichtbar.</li>}
          </ol>
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
