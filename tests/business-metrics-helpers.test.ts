import {
  type BusinessMetrics,
  getContractMetricInterventions,
  getInvoiceMetricInterventions,
  getNotificationMetricInterventions,
} from '../web/src/features/admin/business-metrics-helpers';

function metrics(overrides: Partial<BusinessMetrics> = {}): BusinessMetrics {
  return {
    users: { totalNurses: 0, totalHospitals: 0 },
    shifts: { total: 0 },
    contracts: { total: 0, signed: 0, pending: 0, declined: 0, expired: 0, conversionRate: 0 },
    invoices: { total: 0, paid: 0, pending: 0, paymentRate: 0 },
    notifications: { total: 0, delivered: 0, failed: 0, deliveryRate: 0 },
    ...overrides,
  };
}

describe('business metrics helper interventions', () => {
  it('routes pending and stale offer metrics into offer operations', () => {
    const links = getContractMetricInterventions(metrics({
      contracts: { total: 8, signed: 3, pending: 2, declined: 2, expired: 1, conversionRate: 38 },
    }));

    expect(links).toEqual([
      { label: 'Pending Offers pruefen', to: '/hospital/offers' },
      { label: 'Offer-Reopen pruefen', to: '/hospital/offers' },
    ]);
  });

  it('routes pending invoices into billing operations', () => {
    expect(getInvoiceMetricInterventions(metrics({
      invoices: { total: 4, paid: 2, pending: 2, paymentRate: 50 },
    }))).toEqual([{ label: 'Pending Invoices pruefen', to: '/hospital/billing' }]);
  });

  it('routes failed delivery metrics into the superadmin control plane', () => {
    expect(getNotificationMetricInterventions(metrics({
      notifications: { total: 5, delivered: 3, failed: 2, deliveryRate: 60 },
    }))).toEqual([{ label: 'Delivery Failures pruefen', to: '/admin/ops' }]);
  });

  it('keeps healthy metrics free of intervention links', () => {
    const healthyMetrics = metrics({
      contracts: { total: 3, signed: 3, pending: 0, declined: 0, expired: 0, conversionRate: 100 },
      invoices: { total: 3, paid: 3, pending: 0, paymentRate: 100 },
      notifications: { total: 3, delivered: 3, failed: 0, deliveryRate: 100 },
    });

    expect(getContractMetricInterventions(healthyMetrics)).toEqual([]);
    expect(getInvoiceMetricInterventions(healthyMetrics)).toEqual([]);
    expect(getNotificationMetricInterventions(healthyMetrics)).toEqual([]);
  });
});
