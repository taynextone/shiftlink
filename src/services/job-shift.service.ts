import createHttpError from 'http-errors';
import { JobShiftStatus, MatchContractStatus, Prisma, UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';
import { CreateJobShiftInput, ImportJobShiftInput, ListJobShiftsQueryInput } from '../schemas/job-shift.schema';
import { createHospitalWebhookEvent } from './webhook.service';

async function requireHospitalProfile(actor: { userId: string; role: UserRole }) {
  const hospitalProfile = await prisma.hospitalProfile.findUnique({
    where: { userId: actor.userId },
  });

  if (!hospitalProfile && actor.role !== UserRole.SUPER_ADMIN) {
    throw createHttpError(404, 'Hospital profile not found');
  }

  const hospitalProfileId = hospitalProfile?.id;

  if (!hospitalProfileId || !hospitalProfile) {
    throw createHttpError(400, 'Super admin job shift access requires a mapped hospital profile');
  }

  return hospitalProfile;
}

function buildCreateData(hospitalProfileId: string, input: CreateJobShiftInput | ImportJobShiftInput): Prisma.JobShiftCreateInput {
  return {
    hospitalProfile: {
      connect: {
        id: hospitalProfileId,
      },
    },
    externalJobShiftId: input.externalJobShiftId,
    title: input.title,
    department: input.department,
    stationName: input.stationName,
    locationCity: input.locationCity,
    locationPostalCode: input.locationPostalCode,
    locationLatitude: input.locationLatitude !== undefined ? new Prisma.Decimal(input.locationLatitude) : undefined,
    locationLongitude: input.locationLongitude !== undefined ? new Prisma.Decimal(input.locationLongitude) : undefined,
    startTime: new Date(input.startTime),
    endTime: new Date(input.endTime),
    totalPlannedHours: new Prisma.Decimal(input.totalPlannedHours),
    requirements: {
      create: input.requirements.map((requirement) => ({
        tag: requirement.tag,
        priority: requirement.priority,
      })),
    },
  };
}

function buildUpdateData(input: ImportJobShiftInput): Prisma.JobShiftUpdateInput {
  return {
    title: input.title,
    department: input.department,
    stationName: input.stationName,
    locationCity: input.locationCity,
    locationPostalCode: input.locationPostalCode,
    locationLatitude: input.locationLatitude !== undefined ? new Prisma.Decimal(input.locationLatitude) : null,
    locationLongitude: input.locationLongitude !== undefined ? new Prisma.Decimal(input.locationLongitude) : null,
    startTime: new Date(input.startTime),
    endTime: new Date(input.endTime),
    totalPlannedHours: new Prisma.Decimal(input.totalPlannedHours),
    requirements: {
      deleteMany: {},
      create: input.requirements.map((requirement) => ({
        tag: requirement.tag,
        priority: requirement.priority,
      })),
    },
  };
}

function hasLockedOfferState(matchContracts: Array<{ status: MatchContractStatus }>) {
  return matchContracts.some((contract) => contract.status === MatchContractStatus.SIGNED);
}

function hasOpenOfferState(matchContracts: Array<{ status: MatchContractStatus }>) {
  return matchContracts.some((contract) => contract.status === MatchContractStatus.PENDING);
}

export async function createJobShift(actor: { userId: string; role: UserRole }, input: CreateJobShiftInput) {
  if (actor.role !== UserRole.HOSPITAL_ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
    throw createHttpError(403, 'Only hospital admins can create job shifts');
  }

  const hospitalProfile = await requireHospitalProfile(actor);

  const jobShift = await prisma.jobShift.create({
    data: buildCreateData(hospitalProfile.id, input),
    include: {
      requirements: true,
    },
  });

  await createHospitalWebhookEvent({
    hospitalProfileId: hospitalProfile.id,
    eventType: 'shift.created',
    payload: {
      jobShiftId: jobShift.id,
      externalJobShiftId: jobShift.externalJobShiftId,
      status: jobShift.status,
    },
  });

  return jobShift;
}

export async function importHospitalJobShift(actor: { userId: string; role: UserRole }, input: ImportJobShiftInput) {
  if (actor.role !== UserRole.HOSPITAL_ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
    throw createHttpError(403, 'Only hospital admins can import job shifts');
  }

  const hospitalProfile = await requireHospitalProfile(actor);

  const existing = await prisma.jobShift.findUnique({
    where: {
      hospitalProfileId_externalJobShiftId: {
        hospitalProfileId: hospitalProfile.id,
        externalJobShiftId: input.externalJobShiftId,
      },
    },
    include: {
      requirements: true,
      matchContracts: true,
    },
  });

  if (!existing) {
    const jobShift = await prisma.jobShift.create({
      data: buildCreateData(hospitalProfile.id, input),
      include: {
        requirements: true,
      },
    });

    await createHospitalWebhookEvent({
      hospitalProfileId: hospitalProfile.id,
      eventType: 'shift.imported',
      payload: {
        jobShiftId: jobShift.id,
        externalJobShiftId: jobShift.externalJobShiftId,
        status: jobShift.status,
        mode: 'created',
      },
    });

    return {
      mode: 'created' as const,
      jobShift,
    };
  }

  if (existing.status !== JobShiftStatus.OPEN) {
    throw createHttpError(409, 'Only open job shifts can be updated through import');
  }

  if (hasLockedOfferState(existing.matchContracts)) {
    throw createHttpError(409, 'Imported shift cannot be changed after a signed match exists');
  }

  if (hasOpenOfferState(existing.matchContracts)) {
    throw createHttpError(409, 'Imported shift cannot be changed while pending offers exist');
  }

  const updated = await prisma.jobShift.update({
    where: { id: existing.id },
    data: buildUpdateData(input),
    include: {
      requirements: true,
    },
  });

  await createHospitalWebhookEvent({
    hospitalProfileId: hospitalProfile.id,
    eventType: 'shift.imported',
    payload: {
      jobShiftId: updated.id,
      externalJobShiftId: updated.externalJobShiftId,
      status: updated.status,
      mode: 'updated',
    },
  });

  return {
    mode: 'updated' as const,
    jobShift: updated,
  };
}

export async function listHospitalJobShifts(
  actor: { userId: string; role: UserRole },
  query: ListJobShiftsQueryInput = {},
) {
  if (actor.role !== UserRole.HOSPITAL_ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
    throw createHttpError(403, 'Only hospital admins can view job shifts');
  }

  const hospitalProfile = await requireHospitalProfile(actor);

  const where: Prisma.JobShiftWhereInput = {
    hospitalProfileId: hospitalProfile.id,
    status: query.status as JobShiftStatus | undefined,
  };

  const jobShifts = await prisma.jobShift.findMany({
    where,
    include: {
      requirements: true,
      matchContracts: {
        include: {
          invoice: true,
        },
      },
    },
    orderBy: {
      startTime: 'asc',
    },
    take: query.limit ?? 50,
  });

  return {
    jobShifts: jobShifts.map((jobShift) => {
      const counts = jobShift.matchContracts.reduce(
        (acc, contract) => {
          acc.total += 1;
          if (contract.status === 'PENDING') acc.pending += 1;
          if (contract.status === 'DECLINED') acc.declined += 1;
          if (contract.status === 'SIGNED') acc.signed += 1;
          if (contract.status === 'EXPIRED') acc.expired += 1;
          if (contract.status === 'CANCELED') acc.canceled += 1;
          if (contract.invoice) acc.invoiced += 1;
          return acc;
        },
        { total: 0, pending: 0, declined: 0, signed: 0, expired: 0, canceled: 0, invoiced: 0 },
      );

      return {
        id: jobShift.id,
        externalJobShiftId: jobShift.externalJobShiftId,
        title: jobShift.title,
        department: jobShift.department,
        stationName: jobShift.stationName,
        locationCity: jobShift.locationCity,
        startTime: jobShift.startTime,
        endTime: jobShift.endTime,
        status: jobShift.status,
        totalPlannedHours: jobShift.totalPlannedHours,
        requirements: jobShift.requirements,
        offerCounts: counts,
      };
    }),
  };
}
