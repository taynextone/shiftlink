export type BillingStatusFilter = 'PENDING' | 'PAID' | '';

export function parseBillingStatusFilter(value: string | null): BillingStatusFilter {
  return value === 'PENDING' || value === 'PAID' ? value : '';
}
