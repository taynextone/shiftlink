import createHttpError from 'http-errors';
import { MatchContractStatus, JobShiftStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { billingQueue, whatsappQueue } from '../config/queues';

export async function signMatchContract(matchContractId: string) {
  const existingContract = await prisma.matchContract.findUnique({
    where: { id: matchContractId },
    include: {
      nurseProfile: true,
      jobShift: {
        include: {
          hospitalProfile: true,
        },
      },
    },
  });

  if (!existingContract) {
    throw createHttpError(404, 'Match contract not found');
  }

  if (existingContract.status === MatchContractStatus.SIGNED) {
    return existingContract;
  }

  const updatedContract = await prisma.matchContract.update({
    where: { id: matchContractId },
    data: {
      status: MatchContractStatus.SIGNED,
      signedAt: new Date(),
      jobShift: {
        update: {
          status: JobShiftStatus.MATCHED,
        },
      },
    },
    include: {
      nurseProfile: true,
      jobShift: {
        include: {
          hospitalProfile: true,
        },
      },
      invoice: true,
    },
  });

  await billingQueue.add('create-invoice', {
    matchContractId: updatedContract.id,
  });

  if (updatedContract.nurseProfile.whatsappOptIn) {
    await whatsappQueue.add('signed-match-notification', {
      matchContractId: updatedContract.id,
      phoneNumber: updatedContract.nurseProfile.phoneNumber,
    });
  }

  return updatedContract;
}
