import { getInvoiceBillingPath, getLinkedBillingExportStatus, parseBillingStatusFilter } from '../web/src/features/hospital/billing-helpers';

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
});
