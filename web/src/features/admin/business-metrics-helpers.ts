export type BusinessMetrics = {
  users: { totalNurses: number; totalHospitals: number };
  shifts: { total: number };
  contracts: { total: number; signed: number; pending: number; declined: number; expired: number; conversionRate: number };
  invoices: { total: number; paid: number; pending: number; paymentRate: number };
  notifications: { total: number; delivered: number; failed: number; deliveryRate: number };
};

export type MetricInterventionLink = {
  label: string;
  to: string;
};

export function getContractMetricInterventions(metrics: BusinessMetrics): MetricInterventionLink[] {
  const links: MetricInterventionLink[] = [];
  if (metrics.contracts.pending > 0) {
    links.push({ label: 'Offene Angebote pruefen', to: '/hospital/offers' });
  }
  if (metrics.contracts.declined > 0 || metrics.contracts.expired > 0) {
    links.push({ label: 'Wiederöffnung von Angeboten pruefen', to: '/hospital/offers' });
  }
  return links;
}

export function getInvoiceMetricInterventions(metrics: BusinessMetrics): MetricInterventionLink[] {
  return metrics.invoices.pending > 0
    ? [{ label: 'Offene Rechnungen pruefen', to: '/hospital/billing?status=PENDING' }]
    : [];
}

export function getNotificationMetricInterventions(metrics: BusinessMetrics): MetricInterventionLink[] {
  return metrics.notifications.failed > 0
    ? [{ label: 'Zustellfehler pruefen', to: '/admin/ops?failureQueue=whatsapp' }]
    : [];
}
