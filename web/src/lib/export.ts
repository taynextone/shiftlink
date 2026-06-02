import type { HospitalBillingExportRow } from './api';

export type PayrollExportCsvRow = {
  nurseDisplayName: string;
  nursePublicId: string;
  contractId: string;
  jobShiftTitle: string;
  jobShiftStartDate: string;
  jobShiftEndDate: string;
  agreedHours: number;
  hourlyRate: number;
  totalAmount: string;
  invoiceStatus: string;
  invoiceId: string;
};

function csvEscape(value: unknown): string {
  const text = String(value ?? '');
  if (!/[;"\n\r]/.test(text)) {
    return text;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildPayrollExportCsv(rows: PayrollExportCsvRow[]): string {
  const headers = [
    'Pflegekraft',
    'Public ID',
    'Contract ID',
    'Schicht',
    'Startdatum',
    'Enddatum',
    'Vereinbarte Stunden',
    'Stundensatz',
    'Gesamtbetrag',
    'Invoice Status',
    'Invoice ID',
  ];

  return [
    headers.map(csvEscape).join(';'),
    ...rows.map((row) => [
      row.nurseDisplayName,
      row.nursePublicId,
      row.contractId,
      row.jobShiftTitle,
      row.jobShiftStartDate,
      row.jobShiftEndDate,
      row.agreedHours,
      row.hourlyRate,
      row.totalAmount,
      row.invoiceStatus,
      row.invoiceId,
    ].map(csvEscape).join(';')),
  ].join('\n');
}

export function exportPayrollAsCsv(rows: PayrollExportCsvRow[], filename = 'payroll-export') {
  const csv = buildPayrollExportCsv(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

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
