import createHttpError from 'http-errors';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

const PLATFORM_FEE_PER_HOUR = new Prisma.Decimal(3);

export async function createInvoiceForSignedContract(matchContractId: string) {
  const contract = await prisma.matchContract.findUnique({
    where: { id: matchContractId },
    include: {
      invoice: true,
      jobShift: true,
    },
  });

  if (!contract) {
    throw new Error(`Match contract ${matchContractId} not found`);
  }

  if (contract.invoice) {
    return contract.invoice;
  }

  const amount = new Prisma.Decimal(contract.jobShift.totalPlannedHours).mul(PLATFORM_FEE_PER_HOUR);

  return prisma.invoice.create({
    data: {
      matchContractId: contract.id,
      amount,
    },
  });
}

export async function getInvoiceDetail(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      matchContract: {
        include: {
          jobShift: true,
          nurseProfile: true,
        },
      },
    },
  });

  if (!invoice) {
    throw createHttpError(404, `Invoice ${invoiceId} not found`);
  }

  return {
    id: invoice.id,
    status: invoice.status,
    amount: invoice.amount.toString(),
    invoicePdfUrl: invoice.invoicePdfUrl,
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
    contractId: invoice.matchContractId,
    contractStatus: invoice.matchContract.status,
    jobShiftTitle: invoice.matchContract.jobShift.title,
    jobShiftLocation: invoice.matchContract.jobShift.locationCity,
    nurseDisplayName: invoice.matchContract.nurseProfile.displayName,
    nursePublicId: invoice.matchContract.nurseProfile.publicId,
  };
}

export async function markInvoicePaid(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) {
    throw createHttpError(404, `Invoice ${invoiceId} not found`);
  }

  if (invoice.status === 'PAID') {
    throw createHttpError(409, 'Invoice is already paid');
  }

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: 'PAID' },
  });
}
