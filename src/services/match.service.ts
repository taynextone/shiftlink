import createHttpError from 'http-errors';
import { MatchContractStatus, JobShiftStatus, UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';
import { billingQueue, whatsappQueue } from '../config/queues';
import { env } from '../config/env';
import { createContractSnapshot, ensureContractSnapshotForOffer } from './contract.service';
import { generateContractPdfArtifact } from './contract-pdf.service';
import { emitContractPdfGeneratedEvent, emitMatchOfferSignedEvent } from './contract-webhook.service';
import { isPrismaUniqueConstraintError } from './prisma-error.service';

const DEFAULT_OFFER_EXPIRY_HOURS = 24;

function normalizeDate(value: Date) {
  return new Date(value);
}

function buildWhatsappOfferPayload(contract: {
  id: string;
  nurseProfile: { phoneNumber: string; publicId: string; displayName: string; whatsappOptIn: boolean };
  jobShift: { id: string; locationCity: string | null; startTime: Date; endTime: Date; hospitalProfile: { clinicName: string } };
}) {
  return {
    type: 'new-match-offer' as const,
    matchContractId: contract.id,
    phoneNumber: contract.nurseProfile.phoneNumber,
    publicId: contract.nurseProfile.publicId,
    displayName: contract.nurseProfile.displayName,
    jobShiftId: contract.jobShift.id,
    clinicName: contract.jobShift.hospitalProfile.clinicName,
    locationCity: contract.jobShift.locationCity,
    startTime: contract.jobShift.startTime,
    endTime: contract.jobShift.endTime,
    loginUrl: env.NURSE_LOGIN_URL,
  };
}

function isTerminalStatus(status: MatchContractStatus): boolean {
  return (
    status === MatchContractStatus.SIGNED ||
    status === MatchContractStatus.DECLINED ||
    status === MatchContractStatus.EXPIRED ||
    status === MatchContractStatus.CANCELED
  );
}

function computeOfferExpiry(baseDate: Date): Date {
  return new Date(baseDate.getTime() + DEFAULT_OFFER_EXPIRY_HOURS * 60 * 60 * 1000);
}

function isExpired(expiresAt?: Date | null): boolean {
  return Boolean(expiresAt && expiresAt.getTime() <= Date.now());
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

async function markOfferExpiredIfNeeded(contract: any) {
  if (contract.status === MatchContractStatus.PENDING && isExpired(contract.expiresAt)) {
    return prisma.matchContract.update({
      where: { id: contract.id },
      data: {
        status: MatchContractStatus.EXPIRED,
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
  }

  return contract;
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

  if (!nurseProfile.isReleasedForMatching) {
    return [];
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

      const alreadyRelated = shift.matchContracts.some((contract) =>
        contract.nurseProfileId === nurseProfile.id &&
        contract.status !== MatchContractStatus.DECLINED &&
        contract.status !== MatchContractStatus.EXPIRED,
      );

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

  const contracts = await prisma.matchContract.findMany({
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

  return Promise.all(contracts.map((contract) => markOfferExpiredIfNeeded(contract)));
}

export async function listHospitalMatchOffers(actor: { userId: string; role: UserRole }, jobShiftId: string) {
  if (actor.role !== UserRole.HOSPITAL_ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
    throw createHttpError(403, 'Only hospital admins can view match offers');
  }

  const jobShift = await prisma.jobShift.findUnique({
    where: { id: jobShiftId },
    include: {
      hospitalProfile: true,
      matchContracts: {
        include: {
          nurseProfile: true,
          invoice: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!jobShift) {
    throw createHttpError(404, 'Job shift not found');
  }

  if (actor.role !== UserRole.SUPER_ADMIN && jobShift.hospitalProfile.userId !== actor.userId) {
    throw createHttpError(403, 'You are not allowed to view match offers for this job shift');
  }

  const contracts = await Promise.all(jobShift.matchContracts.map((contract) => markOfferExpiredIfNeeded(contract)));

  return {
    jobShift: {
      id: jobShift.id,
      title: jobShift.title,
      status: jobShift.status,
      startTime: jobShift.startTime,
      endTime: jobShift.endTime,
      locationCity: jobShift.locationCity,
    },
    offers: contracts.map((contract) => ({
      id: contract.id,
      status: contract.status,
      expiresAt: contract.expiresAt ?? null,
      respondedAt: contract.respondedAt ?? null,
      signedAt: contract.signedAt,
      createdAt: contract.createdAt,
      updatedAt: contract.updatedAt,
      invoiceId: contract.invoice?.id ?? null,
      nurse: {
        id: contract.nurseProfile.id,
        publicId: contract.nurseProfile.publicId,
        displayName: contract.nurseProfile.displayName,
        minHourlyRate: contract.nurseProfile.minHourlyRate,
        whatsappOptIn: contract.nurseProfile.whatsappOptIn,
      },
    })),
  };
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

  if (jobShift.status !== JobShiftStatus.OPEN) {
    throw createHttpError(409, 'Offers can only be created for open job shifts');
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

  if (!nurseProfile.isReleasedForMatching) {
    throw createHttpError(409, 'Nurse profile is not released for matching yet');
  }

  const existingContract = jobShift.matchContracts.find((contract) => contract.nurseProfileId === input.nurseProfileId);
  if (existingContract) {
    const hydratedExistingContract = await prisma.matchContract.findUnique({
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

    const normalizedExistingContract = hydratedExistingContract
      ? await markOfferExpiredIfNeeded(hydratedExistingContract)
      : null;

    if (
      normalizedExistingContract?.status === MatchContractStatus.DECLINED ||
      normalizedExistingContract?.status === MatchContractStatus.EXPIRED
    ) {
      throw createHttpError(409, 'This nurse already closed the current offer. Create a new shift or explicitly reopen later.');
    }

    if (normalizedExistingContract) {
      return normalizedExistingContract;
    }
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

  let created;
  try {
    created = await prisma.matchContract.create({
      data: {
        jobShiftId: input.jobShiftId,
        nurseProfileId: input.nurseProfileId,
        status: MatchContractStatus.PENDING,
        expiresAt: computeOfferExpiry(new Date()),
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
  } catch (error) {
    if (!isPrismaUniqueConstraintError(error, ['jobShiftId', 'nurseProfileId'])) {
      throw error;
    }

    const concurrentContract = await prisma.matchContract.findUnique({
      where: {
        jobShiftId_nurseProfileId: {
          jobShiftId: input.jobShiftId,
          nurseProfileId: input.nurseProfileId,
        },
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

    if (!concurrentContract) {
      throw error;
    }

    const normalizedConcurrentContract = await markOfferExpiredIfNeeded(concurrentContract);

    if (
      normalizedConcurrentContract.status === MatchContractStatus.DECLINED ||
      normalizedConcurrentContract.status === MatchContractStatus.EXPIRED
    ) {
      throw createHttpError(409, 'This nurse already closed the current offer. Create a new shift or explicitly reopen later.');
    }

    return normalizedConcurrentContract;
  }

  await ensureContractSnapshotForOffer(created.id);

  if (created.nurseProfile.whatsappOptIn) {
    await whatsappQueue.add(
      'new-match-offer-notification',
      buildWhatsappOfferPayload(created),
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

  const normalizedContract = await markOfferExpiredIfNeeded(contract);

  if (isTerminalStatus(normalizedContract.status)) {
    throw createHttpError(409, 'This match offer can no longer be changed');
  }

  if (input.action === 'DECLINE') {
    const declinedContract = await prisma.matchContract.update({
      where: { id: normalizedContract.id },
      data: {
        status: MatchContractStatus.DECLINED,
        respondedAt: new Date(),
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

    return {
      status: 'DECLINED' as const,
      matchContract: declinedContract,
    };
  }

  const signedContract = await signMatchContract(normalizedContract.id, {
    userId: normalizedContract.jobShift.hospitalProfile.userId,
    role: UserRole.HOSPITAL_ADMIN,
  });

  return {
    status: 'ACCEPTED' as const,
    matchContract: signedContract,
  };
}

export async function reopenMatchOffer(
  actor: { userId: string; role: UserRole },
  input: { matchContractId: string },
) {
  const existingContract = await prisma.matchContract.findUnique({
    where: { id: input.matchContractId },
    include: {
      nurseProfile: true,
      jobShift: {
        include: {
          hospitalProfile: true,
          requirements: true,
        },
      },
      invoice: true,
    },
  });

  if (!existingContract) {
    throw createHttpError(404, 'Match contract not found');
  }

  const isSuperAdmin = actor.role === UserRole.SUPER_ADMIN;
  const isHospitalOwner = actor.role === UserRole.HOSPITAL_ADMIN && existingContract.jobShift.hospitalProfile.userId === actor.userId;
  if (!isSuperAdmin && !isHospitalOwner) {
    throw createHttpError(403, 'You are not allowed to reopen this match offer');
  }

  const normalizedContract = await markOfferExpiredIfNeeded(existingContract);

  if (normalizedContract.status !== MatchContractStatus.DECLINED && normalizedContract.status !== MatchContractStatus.EXPIRED) {
    throw createHttpError(409, 'Only declined or expired offers can be reopened');
  }

  const reopenedContract = await prisma.matchContract.update({
    where: { id: normalizedContract.id },
    data: {
      status: MatchContractStatus.PENDING,
      respondedAt: null,
      signedAt: null,
      expiresAt: computeOfferExpiry(new Date()),
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

  if (reopenedContract.nurseProfile.whatsappOptIn) {
    await whatsappQueue.add(
      'reopened-match-offer-notification',
      buildWhatsappOfferPayload(reopenedContract),
      {
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    );
  }

  return reopenedContract;
}

export async function retryMatchOfferWhatsappNotification(
  actor: { userId: string; role: UserRole },
  input: { matchContractId: string },
) {
  const contract = await prisma.matchContract.findUnique({
    where: { id: input.matchContractId },
    include: {
      nurseProfile: true,
      jobShift: {
        include: {
          hospitalProfile: true,
          requirements: true,
        },
      },
      invoice: true,
    },
  });

  if (!contract) {
    throw createHttpError(404, 'Match contract not found');
  }

  const isSuperAdmin = actor.role === UserRole.SUPER_ADMIN;
  const isHospitalOwner = actor.role === UserRole.HOSPITAL_ADMIN && contract.jobShift.hospitalProfile.userId === actor.userId;
  if (!isSuperAdmin && !isHospitalOwner) {
    throw createHttpError(403, 'You are not allowed to retry this WhatsApp notification');
  }

  if (!contract.nurseProfile.whatsappOptIn) {
    throw createHttpError(409, 'Nurse has not opted in to WhatsApp notifications');
  }

  await whatsappQueue.add(
    'retry-match-offer-notification',
    buildWhatsappOfferPayload(contract),
    {
      removeOnComplete: 100,
      removeOnFail: 200,
      jobId: `retry-match-offer:${contract.id}:${Date.now()}`,
    },
  );

  return { matchContractId: contract.id, queued: true };
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

  const normalizedContract = await markOfferExpiredIfNeeded(existingContract);

  if (normalizedContract.status !== MatchContractStatus.PENDING) {
    throw createHttpError(409, 'Only pending match offers can be signed');
  }

  const updatedContract = await prisma.matchContract.updateMany({
    where: {
      id: matchContractId,
      status: MatchContractStatus.PENDING,
    },
    data: {
      status: MatchContractStatus.SIGNED,
      respondedAt: new Date(),
      signedAt: new Date(),
    },
  });

  if (updatedContract.count === 0) {
    const latestContract = await prisma.matchContract.findUnique({
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

    if (!latestContract) {
      throw createHttpError(404, 'Match contract not found');
    }

    if (latestContract.status === MatchContractStatus.SIGNED) {
      return latestContract;
    }

    throw createHttpError(409, 'Only pending match offers can be signed');
  }

  await prisma.jobShift.update({
    where: { id: existingContract.jobShiftId },
    data: {
      status: JobShiftStatus.MATCHED,
    },
  });

  const hydratedUpdatedContract = await prisma.matchContract.findUnique({
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

  if (!hydratedUpdatedContract) {
    throw createHttpError(404, 'Match contract not found');
  }

  const contractSnapshot = await createContractSnapshot(hydratedUpdatedContract.id);
  await generateContractPdfArtifact(hydratedUpdatedContract.id, contractSnapshot);
  await emitMatchOfferSignedEvent(hydratedUpdatedContract.id);
  await emitContractPdfGeneratedEvent(hydratedUpdatedContract.id);

  await autoBookAvailabilityForSignedContract(hydratedUpdatedContract.id);

  if (!hydratedUpdatedContract.invoice) {
    await billingQueue.add(
      'create-invoice',
      {
        matchContractId: hydratedUpdatedContract.id,
      },
      {
        jobId: `invoice:${hydratedUpdatedContract.id}`,
      },
    );
  }

  return hydratedUpdatedContract;
}
