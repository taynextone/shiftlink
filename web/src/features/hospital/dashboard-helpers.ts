import type { AsyncProcessFailureRow, HospitalBillingSummary, HospitalJobShift, HospitalWebhookEventRow } from '../../lib/api';

export function describeWebhookStatus(event: HospitalWebhookEventRow) {
  if (event.status === 'FAILED_OR_PENDING_RETRY') {
    return {
      label: 'Retry oder manueller Eingriff nötig',
      detail: event.lastError ?? 'Webhook-Zustellung konnte bisher nicht sauber abgeschlossen werden.',
    };
  }

  if (event.status === 'DELIVERED') {
    return {
      label: 'zugestellt',
      detail: event.deliveredAt ? `Erfolgreich zugestellt am ${new Date(event.deliveredAt).toLocaleString('de-DE')}.` : 'Erfolgreich zugestellt.',
    };
  }

  return {
    label: event.status,
    detail: event.lastError ?? 'Status ohne zusätzliche Fehlerdetails.',
  };
}

export function describeAsyncFailure(failure: AsyncProcessFailureRow) {
  const attempts = failure.attemptCount ?? 0;
  const attemptText = attempts > 0 ? `${attempts} Versuch${attempts === 1 ? '' : 'e'}` : 'noch kein Retry-Zähler';

  if (failure.queueName === 'billing') {
    return {
      label: 'Billing-Fehler priorisieren',
      detail: `${attemptText}; Gebühren- oder Rechnungsprozess prüfen, bevor weitere Contract-Governance-Aktionen laufen.`,
    };
  }

  if (failure.queueName === 'webhook') {
    return {
      label: 'Webhook-Failure beobachten',
      detail: `${attemptText}; Delivery-Kontext, Zielsystem und letzte Fehlermeldung gemeinsam prüfen.`,
    };
  }

  if (failure.queueName === 'whatsapp') {
    return {
      label: 'Kommunikationsfehler nachhalten',
      detail: `${attemptText}; Zustellung, Nummernkontext und eventuelle Folgeauswirkungen für Offer-/Contract-Kommunikation prüfen.`,
    };
  }

  return {
    label: `${failure.queueName}-Fehler`,
    detail: `${attemptText}; Queue-Kontext und Folgeprozess manuell prüfen.`,
  };
}

export function getImportBlockedShifts(shifts: HospitalJobShift[]) {
  return shifts.filter((shift) => shift.status !== 'OPEN' || (shift.offerCounts?.signed ?? 0) > 0 || (shift.offerCounts?.pending ?? 0) > 0);
}

export function getPendingOfferShifts(shifts: HospitalJobShift[]) {
  return shifts.filter((shift) => (shift.offerCounts?.pending ?? 0) > 0);
}

export function getFailedWebhookEvents(webhookEvents: HospitalWebhookEventRow[]) {
  return webhookEvents.filter((event) => event.status === 'FAILED_OR_PENDING_RETRY');
}

export function getCriticalAsyncFailures(asyncFailures: AsyncProcessFailureRow[]) {
  return asyncFailures.filter((failure) => failure.queueName === 'billing' || failure.queueName === 'webhook');
}

export function rankAsyncFailures(asyncFailures: AsyncProcessFailureRow[]) {
  const severity = { billing: 3, webhook: 2, whatsapp: 1 } as Record<string, number>;
  return [...asyncFailures].sort((a, b) => {
    const severityDiff = (severity[b.queueName] ?? 0) - (severity[a.queueName] ?? 0);
    if (severityDiff !== 0) return severityDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function buildInterventionHotspots(input: {
  isSuperAdmin: boolean;
  failedWebhookEvents: HospitalWebhookEventRow[];
  criticalAsyncFailures: AsyncProcessFailureRow[];
  totalPendingOffers: number;
  pendingOfferShifts: HospitalJobShift[];
  importBlockedShifts: HospitalJobShift[];
  billing?: HospitalBillingSummary;
}) {
  const { isSuperAdmin, failedWebhookEvents, criticalAsyncFailures, totalPendingOffers, pendingOfferShifts, importBlockedShifts, billing } = input;
  const firstPendingOfferShift = pendingOfferShifts[0];
  const firstBlockedShift = importBlockedShifts[0];

  const hotspots = [
    failedWebhookEvents.length > 0
      ? { label: 'Webhook Delivery', value: `${failedWebhookEvents.length} Probleme`, action: isSuperAdmin ? '/admin/ops' : '/hospital', hint: 'fehlgeschlagene oder hängende Webhook-Zustellungen im Processing-Bereich prüfen', priority: 2 }
      : null,
    criticalAsyncFailures.length > 0
      ? { label: 'Async Worker Failures', value: `${criticalAsyncFailures.length} kritisch`, action: isSuperAdmin ? '/admin/ops' : '/hospital', hint: isSuperAdmin ? 'kritische Worker-Fehler aus der Superadmin-Control-Plane priorisieren' : 'kritische Worker-Fehler erfordern Superadmin-Einbezug', priority: 1 }
      : null,
    totalPendingOffers > 0
      ? { label: 'Pending Offers', value: `${totalPendingOffers} offen`, action: firstPendingOfferShift ? `/hospital/offers?jobShiftId=${encodeURIComponent(firstPendingOfferShift.id)}` : '/hospital/offers', hint: 'Antwortlage und Blocker im Offer-Flow prüfen', priority: 3 }
      : null,
    importBlockedShifts.length > 0
      ? { label: 'Shift Import Blockers', value: `${importBlockedShifts.length} betroffen`, action: firstBlockedShift ? `/hospital/shifts?focusShiftId=${encodeURIComponent(firstBlockedShift.id)}` : '/hospital/shifts', hint: 'offene/pending/signed Lagen blockieren Re-Imports', priority: 4 }
      : null,
    billing && billing.pendingInvoiceAmount > 0
      ? { label: 'Pending Fees', value: `${billing.pendingInvoiceAmount} €`, action: '/hospital/billing', hint: 'offene Gebühren und Rechnungsfälle operativ nachhalten', priority: 5 }
      : null,
  ].filter((item): item is { label: string; value: string; action: string; hint: string; priority: number } => Boolean(item));

  return hotspots.sort((a, b) => a.priority - b.priority);
}
