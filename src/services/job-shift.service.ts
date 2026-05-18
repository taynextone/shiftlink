import createHttpError from 'http-errors';
import { JobShiftStatus, Prisma, UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';
import { CreateJobShiftInput, ListJobShiftsQueryInput } from '../schemas/job-shift.schema';

async function requireHospitalProfile(actor: { userId: string; role: UserRole }) {
  const hospitalProfile = await prisma.hospitalProfile.findUnique({
    where: { userId: actor.userId },
  });

  if (!hospitalProfile && actor.role !== UserRole.SUPER_ADMIN) {
    throw createHttpError(404, 'Hospital profile not found');
  }

  const hospitalProfileId = hospitalProfile?.id;

  if (!hospitalProfileId) {
    throw createHttpError(400, 'Super admin job shift access requires a mapped hospital profile');
  }

  return hospitalProfileId;
}

export async function createJobShift(actor: { userId: string; role: UserRole }, input: CreateJobShiftInput) {
  if (actor.role !== UserRole.HOSPITAL_ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
    throw createHttpError(403, 'Only hospital admins can create job shifts');
  }

  const hospitalProfileId = await requireHospitalProfile(actor);

  return prisma.jobShift.create({
    data: {
      hospitalProfileId,
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
    },
    include: {
      requirements: true,
    },
  });
}

export async function listHospitalJobShifts(
  actor: { userId: string; role: UserRole },
  query: ListJobShiftsQueryInput = {},
) {
  if (actor.role !== UserRole.HOSPITAL_ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
    throw createHttpError(403, 'Only hospital admins can view job shifts');
  }

  const hospitalProfileId = await requireHospitalProfile(actor);

  const where: Prisma.JobShiftWhereInput = {
    hospitalProfileId,
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
