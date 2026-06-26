import { Link } from 'react-router-dom';
import { ActionBar } from '../../components/ActionBar';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { AuditLogViewer } from './AuditLogViewer';
import { BusinessMetricsDashboard } from './BusinessMetricsDashboard';
import { HospitalDashboardPage } from '../hospital/HospitalDashboardPage';

export function AdminOpsPage() {
  return (
    <section className="stack page-stack">
      <PageHeader
        eyebrow="Superadmin"
        title="Betriebssteuerung"
        description="Zentraler Einstieg für Warteschlangen-, Webhook-, Abrechnungs- und Interventionslagen. Die nachgelagerte Betriebsansicht bleibt produktnah, wird hier aber klar als Superadmin-Steuerfläche gerahmt."
        actions={
          <ActionBar>
            <Link to="/admin/verification">
              <button type="button" className="secondary">Verifikation</button>
            </Link>
            <Link to="/hospital/dossier">
              <button type="button" className="secondary">Dossiers</button>
            </Link>
            <Link to="/hospital/shifts">
              <button type="button" className="secondary">Schichten</button>
            </Link>
            <Link to="/hospital/offers">
              <button type="button" className="secondary">Angebote</button>
            </Link>
            <Link to="/hospital/contracts">
              <button type="button" className="secondary">Verträge</button>
            </Link>
            <Link to="/hospital/billing">
              <button type="button" className="secondary">Abrechnung</button>
            </Link>
          </ActionBar>
        }
      />
      <div className="metric-list">
        <div className="metric-item">
          <span>Priorität 1</span>
          <strong>Verification und Release-Lagen ohne Produktstillstand halten</strong>
        </div>
        <div className="metric-item">
          <span>Priorität 2</span>
          <strong>Webhook-, Warteschlangen- und asynchrone Fehler früh in den passenden Interventionspfad lenken</strong>
        </div>
        <div className="metric-item">
          <span>Priorität 3</span>
          <strong>Vertrags- und Abrechnungsausnahmen in steuerbare Operator-Schritte überführen</strong>
        </div>
        <div className="metric-item">
          <span>Arbeitsmodus</span>
          <strong>Superadmin zentral, Produktflächen weiterhin direkt aus dem Betriebskontext erreichbar</strong>
        </div>
      </div>

      <SectionCard title="Direkte Interventionspfade" description="Die wichtigsten Operator-Aktionen sind jetzt direkt in den Produktflächen verankert und von hier aus gezielt erreichbar.">
        <div className="record-list compact-list">
          <div className="panel subpanel">
            <strong>Webhook / Hintergrundverarbeitung</strong>
            <p>Webhook erneut senden, asynchronen Fehler als behandelt markieren, Fehlerkarten direkt in passende Interventionspfade lenken.</p>
            <ActionBar>
              <Link to="/admin/ops"><button type="button" className="secondary">Fehlerübersicht öffnen</button></Link>
            </ActionBar>
          </div>
          <div className="panel subpanel">
            <strong>Abrechnung</strong>
            <p>Rechnungsdetail laden, Rechnungen als bezahlt markieren und vom Vertrag direkt in den Abrechnungskontext springen.</p>
            <ActionBar>
              <Link to="/hospital/billing"><button type="button" className="secondary">Abrechnungsinterventionen</button></Link>
            </ActionBar>
          </div>
          <div className="panel subpanel">
            <strong>Angebote / Kommunikation</strong>
            <p>Abgelehnte oder abgelaufene Angebote erneut öffnen; bei Opt-in wird WhatsApp-Kommunikation erneut angestoßen.</p>
            <ActionBar>
              <Link to="/hospital/offers"><button type="button" className="secondary">Angebotsinterventionen</button></Link>
            </ActionBar>
          </div>
        </div>
      </SectionCard>

      <BusinessMetricsDashboard />
      <AuditLogViewer />
      <HospitalDashboardPage mode="superadmin" />
    </section>
  );
}
