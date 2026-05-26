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
        title="Operations Control Plane"
        description="Zentraler Einstieg für Queue-, Webhook-, Billing- und Interventionslagen. Die nachgelagerte Ops-Ansicht bleibt produktnah, wird hier aber klar als Superadmin-Steuerfläche gerahmt."
        actions={
          <ActionBar>
            <Link to="/admin/verification">
              <button type="button" className="secondary">Verification Ops</button>
            </Link>
            <Link to="/hospital/dossier">
              <button type="button" className="secondary">Dossier-Ops</button>
            </Link>
            <Link to="/hospital/shifts">
              <button type="button" className="secondary">Shift-Ops</button>
            </Link>
            <Link to="/hospital/offers">
              <button type="button" className="secondary">Offer-Ops</button>
            </Link>
            <Link to="/hospital/contracts">
              <button type="button" className="secondary">Vertrags-Ops</button>
            </Link>
            <Link to="/hospital/billing">
              <button type="button" className="secondary">Billing-Ops</button>
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
          <strong>Webhook-, Queue- und Async-Failures früh in den passenden Interventionspfad lenken</strong>
        </div>
        <div className="metric-item">
          <span>Priorität 3</span>
          <strong>Vertrags- und Billing-Ausnahmen in steuerbare Operator-Schritte überführen</strong>
        </div>
        <div className="metric-item">
          <span>Arbeitsmodus</span>
          <strong>Superadmin zentral, Produktflächen weiterhin direkt aus dem Ops-Kontext erreichbar</strong>
        </div>
      </div>

      <SectionCard title="Direkte Interventionspfade" description="Die wichtigsten Operator-Aktionen sind jetzt direkt in den Produktflächen verankert und von hier aus gezielt erreichbar.">
        <div className="record-list compact-list">
          <div className="panel subpanel">
            <strong>Webhook / Async</strong>
            <p>Webhook erneut senden, Async-Failure als behandelt markieren, Failure-Karten direkt in passende Ops-Pfade lenken.</p>
            <ActionBar>
              <Link to="/admin/ops"><button type="button" className="secondary">Failure-Board öffnen</button></Link>
            </ActionBar>
          </div>
          <div className="panel subpanel">
            <strong>Billing</strong>
            <p>Invoice-Detail laden, Rechnungen als bezahlt markieren und vom Contract direkt in den Billing-Kontext springen.</p>
            <ActionBar>
              <Link to="/hospital/billing"><button type="button" className="secondary">Billing-Interventionen</button></Link>
            </ActionBar>
          </div>
          <div className="panel subpanel">
            <strong>Offers / Kommunikation</strong>
            <p>Declined oder expired Offers erneut öffnen; bei Opt-in wird WhatsApp-Kommunikation erneut angestoßen.</p>
            <ActionBar>
              <Link to="/hospital/offers"><button type="button" className="secondary">Offer-Interventionen</button></Link>
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
