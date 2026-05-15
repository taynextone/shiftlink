import createHttpError from 'http-errors';
import { Prisma, UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';
import { UpdateNurseProfileInput } from '../schemas/nurse-profile.schema';

export async function updateOwnNurseProfile(actor: { userId: string; role: UserRole }, input: UpdateNurseProfileInput) {
  if (actor.role !== UserRole.NURSE) {
    throw createHttpError(403, 'Only nurses can update nurse profiles');
  }

  const existingProfile = await prisma.nurseProfile.findUnique({
    where: { userId: actor.userId },
    include: {
      availabilityBlocks: true,
    },
  });

  if (!existingProfile) {
    throw createHttpError(404, 'Nurse profile not found');
  }

  const bookedBlocks = existingProfile.availabilityBlocks.filter((block) => block.isBooked);

  if (bookedBlocks.length > 0 && input.availabilityBlocks) {
    throw createHttpError(409, 'Booked availability blocks cannot be replaced through the general profile update flow');
  }

  const data: Prisma.NurseProfileUpdateInput = {
    displayName: input.displayName,
    firstName: input.firstName,
    lastName: input.lastName,
    iban: input.iban,
    minHourlyRate: input.minHourlyRate !== undefined ? new Prisma.Decimal(input.minHourlyRate) : undefined,
    phoneNumber: input.phoneNumber,
    whatsappOptIn: input.whatsappOptIn,
    examenFileUrl: input.examenFileUrl,
    preferredShiftType: input.preferredShiftType,
    minAssignmentHours: input.minAssignmentHours,
    maxAssignmentHours: input.maxAssignmentHours,
    preferredRegionsNote: input.preferredRegionsNote,
    specializations: input.specializationTags
      ? {
          deleteMany: {},
          create: input.specializationTags.map((tag) => ({ tag })),
        }
      : undefined,
    availabilityBlocks: input.availabilityBlocks
      ? {
          deleteMany: {},
          create: input.availabilityBlocks.map((block) => ({
            title: block.title,
            city: block.city,
            postalCode: block.postalCode,
            latitude: block.latitude !== undefined ? new Prisma.Decimal(block.latitude) : undefined,
            longitude: block.longitude !== undefined ? new Prisma.Decimal(block.longitude) : undefined,
            radiusKm: block.radiusKm,
            startTime: new Date(block.startTime),
            endTime: new Date(block.endTime),
            notes: block.notes,
          })),
        }
      : undefined,
  };

  return prisma.nurseProfile.update({
    where: { userId: actor.userId },
    data,
    include: {
      specializations: true,
      availabilityBlocks: true,
    },
  });
}

export async function getPublicNurseProfile(publicId: string) {
  const profile = await prisma.nurseProfile.findUnique({
    where: { publicId },
    include: {
      specializations: true,
      availabilityBlocks: {
        where: {
          isBooked: false,
        },
        orderBy: {
          startTime: 'asc',
        },
      },
    },
  });

  if (!profile) {
    throw createHttpError(404, 'Nurse profile not found');
  }

  return {
    publicId: profile.publicId,
    displayName: profile.displayName,
    minHourlyRate: profile.minHourlyRate,
    preferredShiftType: profile.preferredShiftType,
    minAssignmentHours: profile.minAssignmentHours,
    maxAssignmentHours: profile.maxAssignmentHours,
    preferredRegionsNote: profile.preferredRegionsNote,
    specializations: profile.specializations.map((item) => item.tag),
    availabilityBlocks: profile.availabilityBlocks.map((block) => ({
      id: block.id,
      title: block.title,
      city: block.city,
      postalCode: block.postalCode,
      radiusKm: block.radiusKm,
      startTime: block.startTime,
      endTime: block.endTime,
      notes: block.notes,
    })),
  };
}
