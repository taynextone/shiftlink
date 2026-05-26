import type { HospitalBillingExportRow } from './api';

export function exportRowsAsCsv(rows: HospitalBillingExportRow[], filename = 'billing-export') {
  const headers = [
    'Invoice ID',
    'Invoice Status',
    'Contract ID',
    'Match Status',
    'Job Shift ID',
  ];

  const csvRows = [
    headers.join(';'),
    ...rows.map((row) => [
      row.invoiceId,
      row.invoiceStatus,
      row.matchContractId,
      row.matchStatus,
      row.jobShiftId,
    ].join(';')),
  ];

  const csv = csvRows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
