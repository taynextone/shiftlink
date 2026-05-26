import { prisma } from '../config/prisma';

export type PayrollExportRow = {
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

export async function getPayrollExport(hospitalProfileId: string): Promise<{ rows: PayrollExportRow[] }> {
  const invoices = await prisma.invoice.findMany({
    where: {
      matchContract: {
        jobShift: {
          hospitalProfileId,
        },
      },
    },
    include: {
      matchContract: {
        include: {
          nurseProfile: true,
          jobShift: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const rows: PayrollExportRow[] = invoices.map((invoice) => ({
    nurseDisplayName: invoice.matchContract.nurseProfile.displayName,
    nursePublicId: invoice.matchContract.nurseProfile.publicId,
    contractId: invoice.matchContract.id,
    jobShiftTitle: invoice.matchContract.jobShift.title ?? 'Pflegeeinsatz',
    jobShiftStartDate: invoice.matchContract.jobShift.startTime.toISOString().slice(0, 10),
    jobShiftEndDate: invoice.matchContract.jobShift.endTime.toISOString().slice(0, 10),
    agreedHours: invoice.matchContract.jobShift.totalPlannedHours.toNumber(),
    hourlyRate: invoice.matchContract.nurseProfile.minHourlyRate.toNumber(),
    totalAmount: invoice.amount.toString(),
    invoiceStatus: invoice.status,
    invoiceId: invoice.id,
  }));

  return { rows };
}
