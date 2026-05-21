import { KpiCard } from '../../components/KpiCard';
import { MetricList } from '../../components/MetricList';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';

export function NurseDashboardPage() {
  return (
    <section className="stack page-stack">
      <PageHeader
        eyebrow="Pflegekraft"
        title="Nurse Operations Dashboard"
        description="Ein professioneller Überblick über Freigabe, sichtbare Einsätze und aktive Angebotsprozesse. Fokus auf Klarheit statt Klick-Chaos."
      />
      <div className="stats-grid">
        <KpiCard label="Release" value="Gate aktiv" helper="Marketplace-Sichtbarkeit ist hart an Verifikation gekoppelt." />
        <KpiCard label="Offers" value="Asynchron" helper="Angebote werden über Plattformstatus und nicht über Chat-Fragmente gesteuert." />
        <KpiCard label="Verträge" value="Auditierbar" helper="Snapshots, PDFs und Execution-State sind getrennt modelliert." />
      </div>
      <div className="content-grid two-thirds">
        <SectionCard
          title="Kernablauf"
          description="So ist der Produktfluss für Pflegekräfte aktuell sauber organisiert."
        >
          <MetricList
            items={[
              { label: 'Schritt 1', value: 'Profil & Verifikation' },
              { label: 'Schritt 2', value: 'Matching-Freigabe' },
              { label: 'Schritt 3', value: 'Offers beantworten' },
              { label: 'Schritt 4', value: 'Contract & Execution' },
            ]}
          />
          <ol className="ordered-list compact-ordered-list">
            <li>Profil vervollständigen und Verifikationsdokumente einreichen</li>
            <li>Release für Matching erhalten</li>
            <li>Passende Einsätze prüfen und Offers beantworten</li>
            <li>Vertrags- und Execution-Schritte nachvollziehbar abschließen</li>
          </ol>
        </SectionCard>
        <SectionCard
          title="Produktlogik"
          description="Einordnung des Nurse-Arbeitsbereichs im Geschäftsmodell."
        >
          <p>
            Shiftlink ist kein Arbeitgeber-Frontend. Diese Oberfläche dient Matching, Vertragsfluss und Nachweisführung — nicht Payroll, Payout oder Zeiterfassung als Lohnsystem.
          </p>
          <MetricList
            items={[
              { label: 'Fokus', value: 'Direktvermittlung' },
              { label: 'Nicht enthalten', value: 'Payroll-System' },
            ]}
          />
        </SectionCard>
      </div>
    </section>
  );
}
