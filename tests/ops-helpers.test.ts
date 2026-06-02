import {
  buildContractStateSteps,
  buildVoidEscalationChecklist,
  computeOfferHealth,
  interpretBillingConflict,
  interpretContractState,
  interpretInvoiceException,
  interpretVoidIntervention,
} from '../web/src/features/hospital/ops-helpers';

describe('hospital ops helpers', () => {
  it('keeps signed offers pointed at contract and dossier review', () => {
    expect(computeOfferHealth({ status: 'SIGNED' } as any)).toEqual({
      label: 'vertraglich gebunden',
      nextAction: 'Vertrag / Dossier prüfen',
      exceptionNote: 'Offer ist bereits im Vertragskontext gebunden.',
    });
  });

  it('describes pending contract signatures from the lifecycle state', () => {
    const lifecycle = {
      status: 'SIGNED',
      executionStatus: 'PENDING_NURSE_SIGNATURE',
    } as any;

    expect(interpretContractState(lifecycle, null)).toEqual({
      label: 'wartet auf Nurse-Signatur',
      nextAction: 'Signaturstatus überwachen oder nachfassen',
    });
  });

  it('blocks void intervention for paid invoices before manual governance work', () => {
    const lifecycle = {
      status: 'SIGNED',
      executionStatus: 'PENDING_HOSPITAL_SIGNATURE',
      invoice: { status: 'PAID' },
    } as any;

    expect(interpretVoidIntervention(lifecycle, null)).toEqual({
      label: 'Void blockiert',
      blocker: 'Bereits bezahlte Plattformrechnungen blockieren diesen Void-Flow.',
      tone: 'error',
    });
    expect(buildVoidEscalationChecklist(lifecycle)).toEqual([
      'Billing-Intervention öffnen und Zahlungsstatus / Nachweise prüfen.',
      'Kommunikationsverlauf prüfen, ob bereits Follow-up oder Zusagen dokumentiert sind.',
      'Danach erst entscheiden, ob manueller Support-/Governance-Eingriff nötig ist.',
    ]);
  });

  it('surfaces voided contracts with still-visible invoices as billing conflicts', () => {
    const lifecycle = {
      executionStatus: 'VOIDED',
      invoice: { status: 'PENDING' },
      voidSummary: { reason: 'Hospital canceled shift' },
    } as any;

    expect(interpretInvoiceException(lifecycle)).toEqual({
      label: 'Void mit Billing-Kontext',
      nextAction: 'Rechnung, Void-Grund und weitere Governance gemeinsam prüfen',
    });
    expect(interpretBillingConflict(lifecycle)).toEqual({
      tone: 'error',
      label: 'Offene Rechnung trotz Void-Kontext',
      detail: 'Der Vertrag wurde bereits beendet, aber eine Rechnung ist weiterhin sichtbar. Billing-Status und Artefakte jetzt gemeinsam prüfen.',
    });
  });

  it('builds terminal state steps for voided contracts', () => {
    const lifecycle = {
      status: 'SIGNED',
      executionStatus: 'VOIDED',
    } as any;

    expect(buildContractStateSteps(lifecycle)).toEqual([
      { state: 'PENDING', label: 'Offer Pending', isActive: false, isTerminal: false },
      { state: 'SIGNED', label: 'Contract Signed', isActive: true, isTerminal: false },
      { state: 'EXECUTING', label: 'In Execution', isActive: false, isTerminal: false },
      { state: 'FULLY_EXECUTED', label: 'Fully Executed', isActive: false, isTerminal: true },
      { state: 'VOIDED', label: 'Voided', isActive: true, isTerminal: true },
    ]);
  });
});
