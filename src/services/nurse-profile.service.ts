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
  });

  if (!existingProfile) {
    throw createHttpError(404, 'Nurse profile not found');
  }

  const data: Prisma.NurseProfileUpdateInput = {
    firstName: input.firstName,
    lastName: input.lastName,
    iban: input.iban,
    minHourlyRate: input.minHourlyRate !== undefined ? new Prisma.Decimal(input.minHourlyRate) : undefined,
    phoneNumber: input.phoneNumber,
    whatsappOptIn: input.whatsappOptIn,
    examenFileUrl: input.examenFileUrl,
    availabilityCity: input.availabilityCity,
    availabilityPostalCode: input.availabilityPostalCode,
    availabilityLatitude:
      input.availabilityLatitude !== undefined ? new Prisma.Decimal(input.availabilityLatitude) : undefined,
    availabilityLongitude:
      input.availabilityLongitude !== undefined ? new Prisma.Decimal(input.availabilityLongitude) : undefined,
    availabilityRadiusKm: input.availabilityRadiusKm,
    isAvailable: input.isAvailable,
  };

  return prisma.nurseProfile.update({
    where: { userId: actor.userId },
    data,
  });
}
