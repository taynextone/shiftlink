import { parseBillingStatusFilter } from '../web/src/features/hospital/billing-helpers';

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
});
