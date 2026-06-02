import { buildInterventionHotspots, getImportBlockedShifts, getPendingOfferShifts, rankAsyncFailures } from '../web/src/features/hospital/dashboard-helpers';

describe('dashboard ops helpers', () => {
  it('deep-links shift import blockers to the first blocked shift', () => {
    const shifts = [
      { id: 'shift_open', status: 'OPEN', offerCounts: { total: 0, pending: 0, signed: 0 } },
      { id: 'shift_pending', status: 'OPEN', offerCounts: { total: 2, pending: 1, signed: 0 } },
      { id: 'shift_signed', status: 'OPEN', offerCounts: { total: 1, pending: 0, signed: 1 } },
    ] as any;

    const hotspots = buildInterventionHotspots({
      isSuperAdmin: true,
      failedWebhookEvents: [],
      criticalAsyncFailures: [],
      totalPendingOffers: 0,
      pendingOfferShifts: [],
      importBlockedShifts: getImportBlockedShifts(shifts),
    });

    expect(hotspots).toEqual([
      expect.objectContaining({
        label: 'Shift Import Blockers',
        action: '/hospital/shifts?focusShiftId=shift_pending',
      }),
    ]);
  });

  it('deep-links pending offer hotspots to the first shift with pending offers', () => {
    const shifts = [
      { id: 'shift_open', status: 'OPEN', offerCounts: { total: 0, pending: 0, signed: 0 } },
      { id: 'shift_pending', status: 'OPEN', offerCounts: { total: 3, pending: 2, signed: 1 } },
    ] as any;

    const hotspots = buildInterventionHotspots({
      isSuperAdmin: true,
      failedWebhookEvents: [],
      criticalAsyncFailures: [],
      totalPendingOffers: 2,
      pendingOfferShifts: getPendingOfferShifts(shifts),
      importBlockedShifts: [],
    });

    expect(hotspots).toEqual([
      expect.objectContaining({
        label: 'Pending Offers',
        action: '/hospital/offers?jobShiftId=shift_pending',
      }),
    ]);
  });

  it('keeps critical async failures ahead of lower-severity queue failures', () => {
    const failures = [
      { id: 'whatsapp_1', queueName: 'whatsapp', createdAt: '2026-06-02T10:00:00.000Z' },
      { id: 'webhook_1', queueName: 'webhook', createdAt: '2026-06-02T08:00:00.000Z' },
      { id: 'billing_1', queueName: 'billing', createdAt: '2026-06-02T07:00:00.000Z' },
    ] as any;

    expect(rankAsyncFailures(failures).map((failure) => failure.id)).toEqual(['billing_1', 'webhook_1', 'whatsapp_1']);
  });
});
