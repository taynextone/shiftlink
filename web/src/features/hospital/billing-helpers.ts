export type BillingStatusFilter = 'PENDING' | 'PAID' | '';

export function parseBillingStatusFilter(value: string | null): BillingStatusFilter {
  return value === 'PENDING' || value === 'PAID' ? value : '';
}

export function getLinkedBillingExportStatus(invoiceId: string, status: BillingStatusFilter): BillingStatusFilter | null {
  if (status) {
    return status;
  }
  return invoiceId.trim() ? '' : null;
}

export function getInvoiceBillingPath(invoiceId: string) {
  return `/hospital/billing?invoiceId=${encodeURIComponent(invoiceId)}`;
}
