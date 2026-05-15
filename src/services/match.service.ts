import createHttpError from 'http-errors';
import { MatchContractStatus, JobShiftStatus, UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';
import { billingQueue, whatsappQueue } from '../config/queues';
import { env } from '../config/env';

function normalizeDate(value: Date) {
  return new Date(value);
}

async function autoBookAvailabilityForSignedContract(matchContractId: string) {
  const contract = await prisma.matchContract.findUnique({
    where: { id: matchContractId },
    include: {
      jobShift: true,
      nurseProfile: {
        include: {
          availabilityBlocks: {
            orderBy: {
              startTime: 'asc',
            },
          },
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

  const blockStart = normalizeDate(matchingBlock.startTime);
  const blockEnd = normalizeDate(matchingBlock.endTime);
  const shiftStart = normalizeDate(contract.jobShift.startTime);
  const shiftEnd = normalizeDate(contract.jobShift.endTime);

  const needsLeftRemainder = blockStart.getTime() < shiftStart.getTime();
  const needsRightRemainder = blockEnd.getTime() > shiftEnd.getTime();

  await prisma.nurseAvailabilityBlock.update({
    where: { id: matchingBlock.id },
    data: {
      startTime: shiftStart,
      endTime: shiftEnd,
      isBooked: true,
    },
  });

  if (needsLeftRemainder) {
    await prisma.nurseAvailabilityBlock.create({
      data: {
        nurseProfileId: matchingBlock.nurseProfileId,
        title: matchingBlock.title,
        city: matchingBlock.city,
        postalCode: matchingBlock.postalCode ?? undefined,
        latitude: matchingBlock.latitude ?? undefined,
        longitude: matchingBlock.longitude ?? undefined,
        radiusKm: matchingBlock.radiusKm,
        startTime: blockStart,
        endTime: shiftStart,
        notes: matchingBlock.notes ?? undefined,
      },
    });
  }

  if (needsRightRemainder) {
    await prisma.nurseAvailabilityBlock.create({
      data: {
        nurseProfileId: matchingBlock.nurseProfileId,
        title: matchingBlock.title,
        city: matchingBlock.city,
        postalCode: matchingBlock.postalCode ?? undefined,
        latitude: matchingBlock.latitude ?? undefined,
        longitude: matchingBlock.longitude ?? undefined,
        radiusKm: matchingBlock.radiusKm,
        startTime: shiftEnd,
        endTime: blockEnd,
        notes: matchingBlock.notes ?? undefined,
      },
    });
  }
}

export async function listVisibleJobShiftsForNurse(actor: { userId: string; role: UserRole }, limit = 20) {
  if (actor.role !== UserRole.NURSE) {
    throw createHttpError(403, 'Only nurses can browse visible job shifts');
  }

  const nurseProfile = await prisma.nurseProfile.findUnique({
    where: { userId: actor.userId },
    include: {
      specializations: true,
      availabilityBlocks: true,
      matchContracts: true,
    },
  });

  if (!nurseProfile) {
    throw createHttpError(404, 'Nurse profile not found');
  }

  const shifts = await prisma.jobShift.findMany({
    where: {
      status: JobShiftStatus.OPEN,
    },
    include: {
      hospitalProfile: true,
      requirements: true,
      matchContracts: true,
    },
    orderBy: {
      startTime: 'asc',
    },
    take: limit,
  });

  const specializationTags = new Set(nurseProfile.specializations.map((item) => item.tag));

  return shifts
    .filter((shift) => {
      const requiredTags = shift.requirements.filter((item) => item.priority === 'REQUIRED').map((item) => item.tag);
      const requiredOk = requiredTags.every((tag) => specializationTags.has(tag));
      if (!requiredOk) {
        return false;
      }

      const hasTimeFit = nurseProfile.availabilityBlocks.some((block) => {
        if (block.isBooked) {
          return false;
        }
        return block.startTime <= shift.startTime && block.endTime >= shift.endTime;
      });

      if (!hasTimeFit) {
        return false;
      }

      const alreadyRelated = shift.matchContracts.some((contract) => contract.nurseProfileId === nurseProfile.id);
      return !alreadyRelated;
    })
    .map((shift) => ({
      id: shift.id,
      title: shift.title,
      department: shift.department,
      stationName: shift.stationName,
      locationCity: shift.locationCity,
      startTime: shift.startTime,
      endTime: shift.endTime,
      totalPlannedHours: shift.totalPlannedHours,
      clinicName: shift.hospitalProfile.clinicName,
      requirements: shift.requirements,
    }));
}

export async function listOwnMatchContracts(actor: { userId: string; role: UserRole }) {
  if (actor.role !== UserRole.NURSE) {
    throw createHttpError(403, 'Only nurses can access their match contracts');
  }

  const nurseProfile = await prisma.nurseProfile.findUnique({
    where: { userId: actor.userId },
  });

  if (!nurseProfile) {
    throw createHttpError(404, 'Nurse profile not found');
  }

  return prisma.matchContract.findMany({
    where: {
      nurseProfileId: nurseProfile.id,
    },
    include: {
      invoice: true,
      jobShift: {
        include: {
          hospitalProfile: true,
          requirements: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function createMatchOffer(
  actor: { userId: string; role: UserRole },
  input: { jobShiftId: string; nurseProfileId: string },
) {
  if (actor.role !== UserRole.HOSPITAL_ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
    throw createHttpError(403, 'Only hospital admins can create match offers');
  }

  const jobShift = await prisma.jobShift.findUnique({
    where: { id: input.jobShiftId },
    include: {
      hospitalProfile: true,
      requirements: true,
      matchContracts: true,
    },
  });

  if (!jobShift) {
    throw createHttpError(404, 'Job shift not found');
  }

  if (actor.role !== UserRole.SUPER_ADMIN && jobShift.hospitalProfile.userId !== actor.userId) {
    throw createHttpError(403, 'You are not allowed to create match offers for this job shift');
  }

  const nurseProfile = await prisma.nurseProfile.findUnique({
    where: { id: input.nurseProfileId },
    include: {
      availabilityBlocks: true,
      specializations: true,
    },
  });

  if (!nurseProfile) {
    throw createHttpError(404, 'Nurse profile not found');
  }

  const existingContract = jobShift.matchContracts.find((contract) => contract.nurseProfileId === input.nurseProfileId);
  if (existingContract) {
    return prisma.matchContract.findUnique({
      where: { id: existingContract.id },
      include: {
        invoice: true,
        nurseProfile: true,
        jobShift: {
          include: {
            hospitalProfile: true,
            requirements: true,
          },
        },
      },
    });
  }

  const matchingBlock = nurseProfile.availabilityBlocks.find((block) => {
    if (block.isBooked) {
      return false;
    }
    return block.startTime <= jobShift.startTime && block.endTime >= jobShift.endTime;
  });

  if (!matchingBlock) {
    throw createHttpError(409, 'Nurse is not available for this job shift');
  }

  const created = await prisma.matchContract.create({
    data: {
      jobShiftId: input.jobShiftId,
      nurseProfileId: input.nurseProfileId,
    },
    include: {
      invoice: true,
      nurseProfile: true,
      jobShift: {
        include: {
          hospitalProfile: true,
          requirements: true,
        },
      },
    },
  });

  if (created.nurseProfile.whatsappOptIn) {
    await whatsappQueue.add(
      'new-match-offer-notification',
      {
        type: 'new-match-offer',
        matchContractId: created.id,
        phoneNumber: created.nurseProfile.phoneNumber,
        publicId: created.nurseProfile.publicId,
        displayName: created.nurseProfile.displayName,
        jobShiftId: created.jobShift.id,
        clinicName: created.jobShift.hospitalProfile.clinicName,
        locationCity: created.jobShift.locationCity,
        startTime: created.jobShift.startTime,
        endTime: created.jobShift.endTime,
        loginUrl: env.NURSE_LOGIN_URL,
      },
      {
        jobId: `new-match-offer:${created.id}`,
      },
    );
  }

  return created;
}

export async function respondToMatchOffer(
  actor: { userId: string; role: UserRole },
  input: { matchContractId: string; action: 'ACCEPT' | 'DECLINE' },
) {
  if (actor.role !== UserRole.NURSE) {
    throw createHttpError(403, 'Only nurses can respond to match offers');
  }

  const nurseProfile = await prisma.nurseProfile.findUnique({
    where: { userId: actor.userId },
  });

  if (!nurseProfile) {
    throw createHttpError(404, 'Nurse profile not found');
  }

  const contract = await prisma.matchContract.findUnique({
    where: { id: input.matchContractId },
    include: {
      invoice: true,
      nurseProfile: true,
      jobShift: {
        include: {
          hospitalProfile: true,
          requirements: true,
        },
      },
    },
  });

  if (!contract) {
    throw createHttpError(404, 'Match contract not found');
  }

  if (contract.nurseProfileId !== nurseProfile.id) {
    throw createHttpError(403, 'You are not allowed to respond to this match offer');
  }

  if (input.action === 'DECLINE') {
    await prisma.matchContract.delete({
      where: { id: contract.id },
    });

    return {
      status: 'DECLINED' as const,
      matchContractId: contract.id,
    };
  }

  const signedContract = await signMatchContract(contract.id, {
    userId: contract.jobShift.hospitalProfile.userId,
    role: UserRole.HOSPITAL_ADMIN,
  });

  return {
    status: 'ACCEPTED' as const,
    matchContract: signedContract,
  };
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

  return updatedContract;
}
