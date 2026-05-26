import type { ContractExecutionOverview, ContractLifecycle, ContractVoidOverview, HospitalOffer } from '../../lib/api';

export function computeOfferHealth(offer: HospitalOffer) {
  if (offer.status === 'SIGNED') {
    return { label: 'vertraglich gebunden', nextAction: 'Vertrag / Dossier prüfen', exceptionNote: 'Offer ist bereits im Vertragskontext gebunden.' };
  }
  if (offer.status === 'DECLINED') {
    return { label: 'durch Pflegekraft beendet', nextAction: 'neue Schicht oder Reopen-Entscheidung', exceptionNote: 'Backend-Regel: neue Schicht oder explizite spätere Wiederöffnung nötig.' };
  }
  if (offer.status === 'EXPIRED') {
    return { label: 'abgelaufen', nextAction: 'neues Angebot vorbereiten', exceptionNote: 'Abgelaufene Offers bleiben historisch sichtbar, sind aber operativ abgeschlossen.' };
  }
  if (offer.status === 'PENDING') {
    return { label: 'wartet auf Antwort', nextAction: 'direkt annehmen, ablehnen oder Antwortstatus eng verfolgen', exceptionNote: 'Offer kann jetzt direkt aus der Hospital-Oberfläche beantwortet werden.' };
  }
  return { label: 'operativ beobachten', nextAction: 'Kontext prüfen', exceptionNote: 'Sonderfall manuell prüfen.' };
}

export function interpretContractState(lifecycle: ContractLifecycle | null, execution: ContractExecutionOverview | null) {
  if (!lifecycle) {
    return null;
  }

  if (lifecycle.status === 'SIGNED' && lifecycle.executionStatus === 'FULLY_EXECUTED') {
    return { label: 'vollständig ausgeführt', nextAction: lifecycle.invoice ? 'Abrechnung und PDF prüfen' : 'Rechnungserstellung beobachten' };
  }
  if (lifecycle.status === 'SIGNED' && lifecycle.executionStatus === 'PENDING_NURSE_SIGNATURE') {
    return { label: 'wartet auf Nurse-Signatur', nextAction: 'Signaturstatus überwachen oder nachfassen' };
  }
  if (lifecycle.status === 'SIGNED' && lifecycle.executionStatus === 'PENDING_HOSPITAL_SIGNATURE') {
    return { label: 'wartet auf Hospital-Signatur', nextAction: 'Execution signieren' };
  }
  if (lifecycle.status === 'PENDING') {
    return { label: 'Offer noch offen', nextAction: 'Offer im Hospital-Kontext direkt beantworten oder Antwortstatus prüfen' };
  }
  if (lifecycle.status === 'DECLINED') {
    return { label: 'durch Pflegekraft beendet', nextAction: 'Schicht-/Reopen-Entscheidung treffen' };
  }
  if (lifecycle.status === 'EXPIRED') {
    return { label: 'Angebot abgelaufen', nextAction: 'neues Angebot vorbereiten' };
  }
  if (lifecycle.status === 'CANCELED') {
    return { label: 'abgebrochen', nextAction: 'Historie dokumentieren und Kontext prüfen' };
  }

  return { label: execution ? execution.executionStatus : lifecycle.executionStatus, nextAction: 'Lifecycle-Details prüfen' };
}

export type InterventionTone = 'success' | 'warning' | 'error' | 'info';

export type VoidInterventionResult = {
  label: string;
  blocker: string;
  tone: InterventionTone;
};

export function interpretVoidIntervention(lifecycle: ContractLifecycle | null, voiding: ContractVoidOverview | null): VoidInterventionResult | null {
  if (!lifecycle) {
    return null;
  }
  if (voiding?.voidEvent) {
    return { label: 'bereits voided', blocker: 'Der Vertrag wurde bereits beendet und dokumentiert.', tone: 'info' as const };
  }
  if (lifecycle.executionStatus === 'FULLY_EXECUTED') {
    return { label: 'Void blockiert', blocker: 'Vollständig ausgeführte Verträge können über diesen Flow nicht voided werden.', tone: 'error' as const };
  }
  if (lifecycle.invoice?.status === 'PAID') {
    return { label: 'Void blockiert', blocker: 'Bereits bezahlte Plattformrechnungen blockieren diesen Void-Flow.', tone: 'error' as const };
  }
  if (lifecycle.status === 'CANCELED') {
    return { label: 'bereits storniert', blocker: 'Dieser Vertrag ist bereits storniert.', tone: 'warning' as const };
  }
  return { label: 'Void möglich', blocker: 'Kein technischer Blocker sichtbar. Grund sauber dokumentieren.', tone: 'success' as const };
}


export function interpretInvoiceException(lifecycle: ContractLifecycle | null) {
  if (!lifecycle?.invoice) {
    return { label: 'keine Rechnung sichtbar', nextAction: 'Execution- und Billing-Kontext weiter beobachten' };
  }

  if (lifecycle.invoice.status === 'PAID') {
    return { label: 'Rechnung bezahlt', nextAction: 'Nur noch Nachweis, Historie und eventuelle Void-Blocker prüfen' };
  }

  if (lifecycle.voidSummary?.reason) {
    return { label: 'Void mit Billing-Kontext', nextAction: 'Rechnung, Void-Grund und weitere Governance gemeinsam prüfen' };
  }

  if (lifecycle.fullyExecutedAt) {
    return { label: 'vollständig ausgeführt, Rechnung offen', nextAction: 'Rechnungsstatus und PDF/Export-Artefakte nachhalten' };
  }

  return { label: `Rechnung ${lifecycle.invoice.status}`, nextAction: 'Billing-Seite und Contract-Artefakte gemeinsam prüfen' };
}

export function interpretBillingConflict(lifecycle: ContractLifecycle | null): BillingConflictResult | null {
  if (!lifecycle?.invoice) {
    return null;
  }

  if (lifecycle.invoice.status === 'PAID') {
    return {
      tone: 'error' as const,
      label: 'Bezahlte Rechnung blockiert Governance-Eingriffe',
      detail: 'Die Rechnung ist bereits bezahlt. Void oder nachträgliche Korrekturen brauchen einen expliziten Billing-/Support-Follow-up.',
    };
  }

  if (lifecycle.voidSummary?.reason) {
    return {
      tone: 'error' as const,
      label: 'Offene Rechnung trotz Void-Kontext',
      detail: 'Der Vertrag wurde bereits beendet, aber eine Rechnung ist weiterhin sichtbar. Billing-Status und Artefakte jetzt gemeinsam prüfen.',
    };
  }

  if (lifecycle.invoice.status === 'PENDING' && lifecycle.executionStatus !== 'FULLY_EXECUTED') {
    return {
      tone: 'success' as const,
      label: 'Rechnung sichtbar vor vollständiger Ausführung',
      detail: 'Execution, Rechnung und PDF-Artefakte gemeinsam beobachten, damit keine Governance-Lücke zwischen Vertrag und Billing entsteht.',
    };
  }

  if (lifecycle.invoice.status === 'OVERDUE') {
    return {
      tone: 'error' as const,
      label: 'Überfällige Rechnung erfordert sofortige Behandlung',
      detail: 'Die Rechnung ist überfällig. Billing-Kontext, offene Beträge und mögliche Zinsen oder Inkasso-Folgen prüfen, bevor weitere Governance-Aktionen erfolgen.',
    };
  }

  if (lifecycle.invoice.status === 'CANCELED') {
    return {
      tone: 'warning' as const,
      label: 'Rechnung storniert – Billing-Governance prüfen',
      detail: 'Die Rechnung wurde storniert. Sicherstellen, dass keine offenen Abrechnungsartefakte bestehen, bevor der Vertrag weiter verarbeitet wird.',
    };
  }

  if (lifecycle.invoice.status === 'DRAFT') {
    return {
      tone: 'info' as const,
      label: 'Rechnung in Entwurfsphase',
      detail: 'Die Rechnung befindet sich noch im Entwurfsstadium. Billing eng beobachten, sobald sie final freigegeben ist, um Governance-Lücken zu vermeiden.',
    };
  }

  return null;
}

export type BillingConflictResult = {
  tone: InterventionTone;
  label: string;
  detail: string;
};

export function buildVoidEscalationChecklist(lifecycle: ContractLifecycle | null) {
  if (!lifecycle) {
    return [] as string[];
  }

  if (lifecycle.invoice?.status === 'PAID') {
    return [
      'Billing-Intervention öffnen und Zahlungsstatus / Nachweise prüfen.',
      'Kommunikationsverlauf prüfen, ob bereits Follow-up oder Zusagen dokumentiert sind.',
      'Danach erst entscheiden, ob manueller Support-/Governance-Eingriff nötig ist.',
    ];
  }

  if (lifecycle.executionStatus === 'FULLY_EXECUTED') {
    return [
      'Vertrags- und Execution-Historie prüfen.',
      'Billing-/PDF-Artefakte gegen den Abschlusszustand gegenlesen.',
      'Nur mit dokumentiertem Ausnahmegrund in manuelle Eskalation gehen.',
    ];
  }

  if (lifecycle.status === 'CANCELED') {
    return [
      'Bestehende Void-/Storno-Historie prüfen.',
      'Kommunikation und Billing-Kontext gegen den stornierten Zustand abgleichen.',
    ];
  }

  return [] as string[];
}
