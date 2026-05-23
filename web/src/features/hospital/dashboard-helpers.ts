import type { AsyncProcessFailureRow, HospitalBillingSummary, HospitalJobShift, HospitalWebhookEventRow } from '../../lib/api';

export function getImportBlockedShifts(shifts: HospitalJobShift[]) {
  return shifts.filter((shift) => shift.status !== 'OPEN' || (shift.offerCounts?.signed ?? 0) > 0 || (shift.offerCounts?.pending ?? 0) > 0);
}

export function getFailedWebhookEvents(webhookEvents: HospitalWebhookEventRow[]) {
  return webhookEvents.filter((event) => event.status === 'FAILED_OR_PENDING_RETRY');
}

export function getCriticalAsyncFailures(asyncFailures: AsyncProcessFailureRow[]) {
  return asyncFailures.filter((failure) => failure.queueName === 'billing' || failure.queueName === 'webhook');
}

export function buildInterventionHotspots(input: {
  failedWebhookEvents: HospitalWebhookEventRow[];
  criticalAsyncFailures: AsyncProcessFailureRow[];
  totalPendingOffers: number;
  importBlockedShifts: HospitalJobShift[];
  billing?: HospitalBillingSummary;
}) {
  const { failedWebhookEvents, criticalAsyncFailures, totalPendingOffers, importBlockedShifts, billing } = input;

  return [
    failedWebhookEvents.length > 0
      ? { label: 'Webhook Delivery', value: `${failedWebhookEvents.length} Probleme`, action: '/hospital', hint: 'fehlgeschlagene oder hängende Webhook-Zustellungen prüfen' }
      : null,
    criticalAsyncFailures.length > 0
      ? { label: 'Async Worker Failures', value: `${criticalAsyncFailures.length} kritisch`, action: '/hospital', hint: 'persistierte Billing-/Webhook-Fehler priorisieren' }
      : null,
    totalPendingOffers > 0
      ? { label: 'Pending Offers', value: `${totalPendingOffers} offen`, action: '/hospital/offers', hint: 'Antwortlage und Blocker im Offer-Flow prüfen' }
      : null,
    importBlockedShifts.length > 0
      ? { label: 'Shift Import Blockers', value: `${importBlockedShifts.length} betroffen`, action: '/hospital/shifts', hint: 'offene/pending/signed Lagen blockieren Re-Imports' }
      : null,
    billing && billing.pendingInvoiceAmount > 0
      ? { label: 'Pending Fees', value: `${billing.pendingInvoiceAmount} €`, action: '/hospital/billing', hint: 'offene Gebühren operativ nachhalten' }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string; action: string; hint: string }>;
}
