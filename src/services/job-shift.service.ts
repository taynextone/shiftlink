import createHttpError from 'http-errors';
import { Prisma, UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';
import { CreateJobShiftInput } from '../schemas/job-shift.schema';

export async function createJobShift(actor: { userId: string; role: UserRole }, input: CreateJobShiftInput) {
  if (actor.role !== UserRole.HOSPITAL_ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
    throw createHttpError(403, 'Only hospital admins can create job shifts');
  }

  const hospitalProfile = await prisma.hospitalProfile.findUnique({
    where: { userId: actor.userId },
  });

  if (!hospitalProfile && actor.role !== UserRole.SUPER_ADMIN) {
    throw createHttpError(404, 'Hospital profile not found');
  }

  const hospitalProfileId = hospitalProfile?.id;

  if (!hospitalProfileId) {
    throw createHttpError(400, 'Super admin job shift creation requires a mapped hospital profile');
  }

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
