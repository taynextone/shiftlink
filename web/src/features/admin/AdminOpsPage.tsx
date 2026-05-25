import { PageHeader } from '../../components/PageHeader';
import { HospitalDashboardPage } from '../hospital/HospitalDashboardPage';

export function AdminOpsPage() {
  return (
    <section className="stack page-stack">
      <PageHeader
        eyebrow="Superadmin"
        title="Operations Control Plane"
        description="Zentraler Einstieg für Queue-, Webhook-, Billing- und Interventionslagen. Die nachgelagerte Ops-Ansicht bleibt produktnah, wird hier aber klar als Superadmin-Steuerfläche gerahmt."
      />
      <HospitalDashboardPage mode="superadmin" />
    </section>
  );
}
