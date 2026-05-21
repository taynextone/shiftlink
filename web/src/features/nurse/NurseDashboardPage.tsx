import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';

export function NurseDashboardPage() {
  return (
    <section className="stack page-stack">
      <PageHeader
        eyebrow="Pflegekraft"
        title="Nurse Operations Dashboard"
        description="Ein professioneller Überblick über Freigabe, sichtbare Einsätze und aktive Angebotsprozesse. Fokus auf Klarheit statt Klick-Chaos."
      />
      <div className="stats-grid">
        <StatCard label="Release" value="Gate aktiv" caption="Marketplace-Sichtbarkeit ist hart an Verifikation gekoppelt." />
        <StatCard label="Offers" value="Asynchron" caption="Angebote werden über Plattformstatus und nicht über Chat-Fragmente gesteuert." />
        <StatCard label="Verträge" value="Auditierbar" caption="Snapshots, PDFs und Execution-State sind getrennt modelliert." />
      </div>
      <div className="content-grid two-thirds">
        <article className="panel">
          <h2>Kernablauf</h2>
          <ol className="ordered-list">
            <li>Profil vervollständigen und Verifikationsdokumente einreichen</li>
            <li>Release für Matching erhalten</li>
            <li>Passende Einsätze prüfen und Offers beantworten</li>
            <li>Vertrags- und Execution-Schritte nachvollziehbar abschließen</li>
          </ol>
        </article>
        <article className="panel emphasis-panel">
          <h2>Produktlogik</h2>
          <p>
            Shiftlink ist kein Arbeitgeber-Frontend. Diese Oberfläche dient Matching, Vertragsfluss und Nachweisführung — nicht Payroll, Payout oder Zeiterfassung als Lohnsystem.
          </p>
        </article>
      </div>
    </section>
  );
}
