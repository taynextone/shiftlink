import { Link } from 'react-router-dom';
import { ActionBar } from '../../components/ActionBar';
import { PageHeader } from '../../components/PageHeader';
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
            <Link to="/hospital/contracts">
              <button type="button" className="secondary">Vertrags-Ops</button>
            </Link>
            <Link to="/hospital/billing">
              <button type="button" className="secondary">Billing-Ops</button>
            </Link>
          </ActionBar>
        }
      />
      <HospitalDashboardPage mode="superadmin" />
    </section>
  );
}
