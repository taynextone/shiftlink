import { KpiCard } from '../../components/KpiCard';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';

export function HospitalDashboardPage() {
  return (
    <section className="stack page-stack">
      <PageHeader
        eyebrow="Krankenhaus"
        title="Hospital Operations Dashboard"
        description="Professionelle Startseite für Bedarfssteuerung, Offers und Vertragsnachweise. Fokus auf operative Klarheit statt Demo-Look."
      />
      <div className="stats-grid">
        <KpiCard label="Bedarfe" value="Importfähig" helper="Idempotenter Shift-Import und operative Statuslisten sind vorhanden." />
        <KpiCard label="Offers" value="Kontrolliert" helper="Kandidaten- und Offer-Flows folgen Backend-Lifecycle-Regeln." />
        <KpiCard label="Verträge" value="Nachvollziehbar" helper="Lifecycle, Signaturen, PDFs und Voids sind auditierbar." />
      </div>
      <div className="content-grid two-thirds">
        <SectionCard
          title="Empfohlene Arbeitsfolge"
          description="So ist der operative Krankenhaus-Workflow aktuell strukturiert."
        >
          <ol className="ordered-list">
            <li>Schichten importieren oder anlegen</li>
            <li>Kandidaten prüfen und Offers auslösen</li>
            <li>Contract Lifecycle beobachten und Execution-Schritte durchführen</li>
          </ol>
        </SectionCard>
        <SectionCard
          title="Geschäftsmodell"
          description="Abgrenzung der Oberfläche im Plattformkontext."
        >
          <p>
            Diese Oberfläche steuert Matching und Plattformgebühren-Prozesse. Sie modelliert keine Arbeitgeber- oder Lohnabrechnungslogik für Shiftlink.
          </p>
        </SectionCard>
      </div>
    </section>
  );
}
