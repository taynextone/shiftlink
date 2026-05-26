import { useMemo } from 'react';
import { SectionCard } from '../../components/SectionCard';
import { FeedbackMessage } from '../../components/FeedbackMessage';
import { MetricList } from '../../components/MetricList';
import { useAsyncData } from '../../hooks/useAsyncData';
import { api } from '../../lib/api';

export function BusinessMetricsDashboard() {
  const { data, loading, error, reload } = useAsyncData(() => api.getBusinessMetrics(), []);

  const metrics = data;

  const contractFunnel = useMemo(() => {
    if (!metrics) return [];
    return [
      { label: 'Total Offers', value: metrics.contracts.total },
      { label: 'Signed', value: metrics.contracts.signed },
      { label: 'Pending', value: metrics.contracts.pending },
      { label: 'Declined', value: metrics.contracts.declined },
      { label: 'Expired', value: metrics.contracts.expired },
      { label: 'Conversion Rate', value: `${metrics.contracts.conversionRate}%` },
    ];
  }, [metrics]);

  const invoicePipeline = useMemo(() => {
    if (!metrics) return [];
    return [
      { label: 'Total Invoices', value: metrics.invoices.total },
      { label: 'Paid', value: metrics.invoices.paid },
      { label: 'Pending', value: metrics.invoices.pending },
      { label: 'Payment Rate', value: `${metrics.invoices.paymentRate}%` },
    ];
  }, [metrics]);

  const notificationStats = useMemo(() => {
    if (!metrics) return [];
    return [
      { label: 'Total Messages', value: metrics.notifications.total },
      { label: 'Delivered', value: metrics.notifications.delivered },
      { label: 'Failed', value: metrics.notifications.failed },
      { label: 'Delivery Rate', value: `${metrics.notifications.deliveryRate}%` },
    ];
  }, [metrics]);

  return (
    <div className="stack">
      <SectionCard
        title="Business KPIs"
        description="Überblick über die wichtigsten Geschäftsmetriken."
        actions={
          <button type="button" className="secondary" onClick={() => void reload()}>
            Aktualisieren
          </button>
        }
      >
        {loading ? <p className="hint">Wird geladen…</p> : null}
        {error ? <FeedbackMessage tone="error" message={`Fehler beim Laden: ${String(error)}`} /> : null}
        {metrics ? (
          <div className="content-grid two-columns-equal">
            <MetricList
              items={[
                { label: 'Pflegekräfte', value: metrics.users.totalNurses },
                { label: 'Kliniken', value: metrics.users.totalHospitals },
                { label: 'Schichten', value: metrics.shifts.total },
              ]}
            />
            <MetricList items={contractFunnel} />
          </div>
        ) : null}
      </SectionCard>

      {metrics && metrics.invoices.total > 0 ? (
        <SectionCard title="Invoice Pipeline" description="Aktuelle Rechnungs- und Zahlungslage.">
          <MetricList items={invoicePipeline} />
        </SectionCard>
      ) : null}

      {metrics && metrics.notifications.total > 0 ? (
        <SectionCard title="Kommunikations-Statistik" description="WhatsApp-Nachrichten Zustellungsübersicht.">
          <MetricList items={notificationStats} />
        </SectionCard>
      ) : null}
    </div>
  );
}
