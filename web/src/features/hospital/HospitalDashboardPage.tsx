import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';

export function HospitalDashboardPage() {
  return (
    <section className="stack page-stack">
      <PageHeader
        eyebrow="Krankenhaus"
        title="Hospital Operations Dashboard"
        description="Professionelle Startseite für Bedarfssteuerung, Offers und Vertragsnachweise. Fokus auf operative Klarheit statt Demo-Look."
      />
      <div className="stats-grid">
        <StatCard label="Bedarfe" value="Importfähig" caption="Idempotenter Shift-Import und operative Statuslisten sind vorhanden." />
        <StatCard label="Offers" value="Kontrolliert" caption="Kandidaten- und Offer-Flows folgen Backend-Lifecycle-Regeln." />
        <StatCard label="Verträge" value="Nachvollziehbar" caption="Lifecycle, Signaturen, PDFs und Voids sind auditierbar." />
      </div>
      <div className="content-grid two-thirds">
        <article className="panel">
          <h2>Empfohlene Arbeitsfolge</h2>
          <ol className="ordered-list">
            <li>Schichten importieren oder anlegen</li>
            <li>Kandidaten prüfen und Offers auslösen</li>
            <li>Contract Lifecycle beobachten und Execution-Schritte durchführen</li>
          </ol>
        </article>
        <article className="panel emphasis-panel">
          <h2>Geschäftsmodell</h2>
          <p>
            Diese Oberfläche steuert Matching und Plattformgebühren-Prozesse. Sie modelliert keine Arbeitgeber- oder Lohnabrechnungslogik für Shiftlink.
          </p>
        </article>
      </div>
    </section>
  );
}
