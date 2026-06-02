import { getInvoiceBillingPath, getLinkedBillingExportStatus, parseBillingStatusFilter } from '../web/src/features/hospital/billing-helpers';
import { buildPayrollExportCsv } from '../web/src/lib/export';

describe('billing helpers', () => {
  it.each([
    ['PENDING', 'PENDING'],
    ['PAID', 'PAID'],
    ['FAILED', ''],
    ['', ''],
    [null, ''],
  ] as const)('parses %s as %s', (input, expected) => {
    expect(parseBillingStatusFilter(input)).toBe(expected);
  });

  it.each([
    ['invoice_1', 'PENDING', 'PENDING'],
    ['invoice_1', 'PAID', 'PAID'],
    ['invoice_1', '', ''],
    ['', 'PENDING', 'PENDING'],
    ['', '', null],
  ] as const)('derives linked export status from invoice=%s status=%s', (invoiceId, status, expected) => {
    expect(getLinkedBillingExportStatus(invoiceId, status)).toBe(expected);
  });

  it('builds encoded invoice billing deep links', () => {
    expect(getInvoiceBillingPath('invoice 1/2')).toBe('/hospital/billing?invoiceId=invoice%201%2F2');
  });

  it('escapes HR payroll export fields for clinical handoff CSVs', () => {
    const csv = buildPayrollExportCsv([
      {
        nurseDisplayName: 'Nurse "Nova"; ICU',
        nursePublicId: 'NUR-AB12CD34',
        contractId: 'contract_1',
        jobShiftTitle: 'ITS Einsatz\nNacht',
        jobShiftStartDate: '2026-06-16',
        jobShiftEndDate: '2026-06-16',
        agreedHours: 12,
        hourlyRate: 50,
        totalAmount: '600.00',
        invoiceStatus: 'PAID',
        invoiceId: 'invoice_1',
      },
    ]);

    expect(csv).toContain('"Nurse ""Nova""; ICU"');
    expect(csv).toContain('"ITS Einsatz\nNacht"');
    expect(csv.split('\n')[0]).toBe('Pflegekraft;Public ID;Contract ID;Schicht;Startdatum;Enddatum;Vereinbarte Stunden;Stundensatz;Gesamtbetrag;Invoice Status;Invoice ID');
  });
});
