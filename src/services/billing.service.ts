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
