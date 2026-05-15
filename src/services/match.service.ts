import createHttpError from 'http-errors';
import { MatchContractStatus, JobShiftStatus, UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';
import { billingQueue, whatsappQueue } from '../config/queues';

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

async function autoBookAvailabilityForSignedContract(matchContractId: string) {
  const contract = await prisma.matchContract.findUnique({
    where: { id: matchContractId },
    include: {
      jobShift: true,
      nurseProfile: {
        include: {
          availabilityBlocks: true,
        },
      },
    },
  });

  if (!contract) {
    throw new Error(`Match contract ${matchContractId} not found for availability auto-booking`);
  }

  const matchingBlock = contract.nurseProfile.availabilityBlocks.find((block) => {
    if (block.isBooked) {
      return false;
    }
    return block.startTime <= contract.jobShift.startTime && block.endTime >= contract.jobShift.endTime;
  });

  if (!matchingBlock) {
    throw new Error(`No matching availability block found for contract ${matchContractId}`);
  }

  await prisma.nurseAvailabilityBlock.update({
    where: { id: matchingBlock.id },
    data: { isBooked: true },
  });
}

export async function signMatchContract(matchContractId: string, actor: { userId: string; role: UserRole }) {
  const existingContract = await prisma.matchContract.findUnique({
    where: { id: matchContractId },
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

  if (!existingContract) {
    throw createHttpError(404, 'Match contract not found');
  }

  const ownerUserId = existingContract.jobShift.hospitalProfile.userId;
  const canSign = actor.role === UserRole.SUPER_ADMIN || actor.userId === ownerUserId;

  if (!canSign) {
    throw createHttpError(403, 'You are not allowed to sign this match contract');
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

  await autoBookAvailabilityForSignedContract(updatedContract.id);

  if (!updatedContract.invoice) {
    await billingQueue.add(
      'create-invoice',
      {
        matchContractId: updatedContract.id,
      },
      {
        jobId: `invoice:${updatedContract.id}`,
      },
    );
  }

  if (updatedContract.nurseProfile.whatsappOptIn) {
    await whatsappQueue.add(
      'signed-match-notification',
      {
        matchContractId: updatedContract.id,
        phoneNumber: updatedContract.nurseProfile.phoneNumber,
      },
      {
        jobId: `signed-match-notification:${updatedContract.id}`,
      },
    );
  }

  return updatedContract;
}
