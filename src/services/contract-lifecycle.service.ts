import { prisma } from '../config/prisma';
import createHttpError from 'http-errors';
import { billingQueue } from '../config/queues';

const NO_SHOW_DEADLINE_HOURS = 24;

export async function activateContract(contractId: string) {
  const contract = await prisma.matchContract.findUnique({
    where: { id: contractId },
  });

  if (!contract) {
    throw createHttpError(404, 'Contract not found');
  }

  if (contract.status !== 'SIGNED') {
    throw createHttpError(409, 'Only signed contracts can be activated');
  }

  return prisma.matchContract.update({
    where: { id: contractId },
    data: {
      status: 'ACTIVE',
      activatedAt: new Date(),
    },
  });
}

export async function reportNoShow(contractId: string, actor: { userId: string; role: string }) {
  const contract = await prisma.matchContract.findUnique({
    where: { id: contractId },
    include: { jobShift: { include: { hospitalProfile: true } } },
  });

  if (!contract) {
    throw createHttpError(404, 'Contract not found');
  }

  if (contract.status !== 'SIGNED' && contract.status !== 'ACTIVE') {
    throw createHttpError(409, 'Can only report no-show for signed or active contracts');
  }

  // Hospital can only report no-show within deadline
  if (contract.noShowDeadline && new Date() > contract.noShowDeadline) {
    throw createHttpError(409, 'No-show reporting deadline has passed');
  }

  const updated = await prisma.matchContract.update({
    where: { id: contractId },
    data: {
      status: 'NO_SHOW_REPORTED',
      noShowReportedAt: new Date(),
      cancelReason: 'No-show reported by hospital',
    },
  });

  // No-Refund Policy: Create invoice if not exists
  const freshContract = await prisma.matchContract.findUnique({ where: { id: contractId }, include: { invoice: true } });
  if (!freshContract?.invoice) {
    await billingQueue.add('create-invoice', { matchContractId: contractId }, { jobId: `invoice:${contractId}` });
  }

  return updated;
}

export async function cancelByHospital(contractId: string, reason: string) {
  const contract = await prisma.matchContract.findUnique({
    where: { id: contractId },
  });

  if (!contract) {
    throw createHttpError(404, 'Contract not found');
  }

  if (!['SIGNED', 'ACTIVE'].includes(contract.status)) {
    throw createHttpError(409, 'Can only cancel signed or active contracts');
  }

  const updated = await prisma.matchContract.update({
    where: { id: contractId },
    data: {
      status: 'CANCELED_BY_HOSPITAL',
      canceledAt: new Date(),
      cancelReason: reason,
    },
  });

  // No-Refund Policy: Create invoice if not exists
  const freshContract = await prisma.matchContract.findUnique({ where: { id: contractId }, include: { invoice: true } });
  if (!freshContract?.invoice) {
    await billingQueue.add('create-invoice', { matchContractId: contractId }, { jobId: `invoice:${contractId}` });
  }

  return updated;
}

export async function completeContract(contractId: string) {
  const contract = await prisma.matchContract.findUnique({
    where: { id: contractId },
  });

  if (!contract) {
    throw createHttpError(404, 'Contract not found');
  }

  if (contract.status !== 'ACTIVE') {
    throw createHttpError(409, 'Only active contracts can be completed');
  }

  return prisma.matchContract.update({
    where: { id: contractId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  });
}

export async function setNoShowDeadline(contractId: string) {
  const contract = await prisma.matchContract.findUnique({
    where: { id: contractId },
  });

  if (!contract) {
    throw createHttpError(404, 'Contract not found');
  }

  if (contract.status !== 'SIGNED') {
    throw createHttpError(409, 'No-show deadline can only be set for signed contracts');
  }

  const deadline = new Date();
  deadline.setHours(deadline.getHours() + NO_SHOW_DEADLINE_HOURS);

  return prisma.matchContract.update({
    where: { id: contractId },
    data: {
      noShowDeadline: deadline,
    },
  });
}
