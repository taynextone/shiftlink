import createHttpError from 'http-errors';
import { Prisma, UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';
import {
  CopyAvailabilityBlockInput,
  CreateAvailabilityBlockInput,
  ReplaceAvailabilityBlocksInput,
  SetAvailabilityBlockBookedInput,
  UpdateAvailabilityBlockInput,
} from '../schemas/nurse-availability.schema';

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

async function getOwnNurseProfile(actor: { userId: string; role: UserRole }) {
  if (actor.role !== UserRole.NURSE) {
    throw createHttpError(403, 'Only nurses can manage availability');
  }

  const profile = await prisma.nurseProfile.findUnique({
    where: { userId: actor.userId },
    include: {
      availabilityBlocks: {
        orderBy: {
          startTime: 'asc',
        },
      },
    },
  });

  if (!profile) {
    throw createHttpError(404, 'Nurse profile not found');
  }

  return profile;
}

function toCreateInput(block: CreateAvailabilityBlockInput) {
  return {
    title: block.title,
    city: block.city,
    postalCode: block.postalCode,
    latitude: block.latitude !== undefined ? new Prisma.Decimal(block.latitude) : undefined,
    longitude: block.longitude !== undefined ? new Prisma.Decimal(block.longitude) : undefined,
    radiusKm: block.radiusKm,
    startTime: new Date(block.startTime),
    endTime: new Date(block.endTime),
    notes: block.notes,
  };
}

export async function listOwnAvailabilityBlocks(actor: { userId: string; role: UserRole }) {
  const profile = await getOwnNurseProfile(actor);
  return profile.availabilityBlocks;
}

export async function createOwnAvailabilityBlock(actor: { userId: string; role: UserRole }, input: CreateAvailabilityBlockInput) {
  const profile = await getOwnNurseProfile(actor);
  const start = new Date(input.startTime);
  const end = new Date(input.endTime);

  const hasConflict = profile.availabilityBlocks.some((block) => overlaps(start, end, block.startTime, block.endTime));
  if (hasConflict) {
    throw createHttpError(409, 'Availability block overlaps with an existing block');
  }

  return prisma.nurseAvailabilityBlock.create({
    data: {
      nurseProfileId: profile.id,
      ...toCreateInput(input),
    },
  });
}

export async function updateOwnAvailabilityBlock(
  actor: { userId: string; role: UserRole },
  blockId: string,
  input: UpdateAvailabilityBlockInput,
) {
  const profile = await getOwnNurseProfile(actor);
  const existing = profile.availabilityBlocks.find((block) => block.id === blockId);

  if (!existing) {
    throw createHttpError(404, 'Availability block not found');
  }

  if (existing.isBooked) {
    throw createHttpError(409, 'Booked availability blocks cannot be edited through the nurse self-service flow');
  }

  const nextStart = input.startTime ? new Date(input.startTime) : existing.startTime;
  const nextEnd = input.endTime ? new Date(input.endTime) : existing.endTime;

  const conflict = profile.availabilityBlocks
    .filter((block) => block.id !== blockId)
    .some((block) => overlaps(nextStart, nextEnd, block.startTime, block.endTime));

  if (conflict) {
    throw createHttpError(409, 'Updated availability block overlaps with an existing block');
  }

  return prisma.nurseAvailabilityBlock.update({
    where: { id: blockId },
    data: {
      title: input.title,
      city: input.city,
      postalCode: input.postalCode,
      latitude: input.latitude !== undefined ? new Prisma.Decimal(input.latitude) : undefined,
      longitude: input.longitude !== undefined ? new Prisma.Decimal(input.longitude) : undefined,
      radiusKm: input.radiusKm,
      startTime: input.startTime ? new Date(input.startTime) : undefined,
      endTime: input.endTime ? new Date(input.endTime) : undefined,
      notes: input.notes,
    },
  });
}

export async function deleteOwnAvailabilityBlock(actor: { userId: string; role: UserRole }, blockId: string) {
  const profile = await getOwnNurseProfile(actor);
  const existing = profile.availabilityBlocks.find((block) => block.id === blockId);

  if (!existing) {
    throw createHttpError(404, 'Availability block not found');
  }

  if (existing.isBooked) {
    throw createHttpError(409, 'Booked availability blocks cannot be deleted through the nurse self-service flow');
  }

  await prisma.nurseAvailabilityBlock.delete({
    where: { id: blockId },
  });
}

export async function replaceOwnAvailabilityBlocks(
  actor: { userId: string; role: UserRole },
  input: ReplaceAvailabilityBlocksInput,
) {
  const profile = await getOwnNurseProfile(actor);
  const bookedBlocks = profile.availabilityBlocks.filter((block) => block.isBooked);

  if (bookedBlocks.length > 0) {
    throw createHttpError(409, 'Booked availability blocks cannot be replaced wholesale');
  }

  const blocks = input.blocks.map((block) => ({ start: new Date(block.startTime), end: new Date(block.endTime) }));
  const sorted = [...blocks].sort((a, b) => a.start.getTime() - b.start.getTime());
  for (let i = 1; i < sorted.length; i += 1) {
    if (overlaps(sorted[i - 1].start, sorted[i - 1].end, sorted[i].start, sorted[i].end)) {
      throw createHttpError(409, 'Replacement availability blocks overlap each other');
    }
  }

  await prisma.nurseAvailabilityBlock.deleteMany({
    where: { nurseProfileId: profile.id },
  });

  if (input.blocks.length === 0) {
    return [];
  }

  await prisma.nurseAvailabilityBlock.createMany({
    data: input.blocks.map((block) => ({
      nurseProfileId: profile.id,
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
  });

  return prisma.nurseAvailabilityBlock.findMany({
    where: { nurseProfileId: profile.id },
    orderBy: { startTime: 'asc' },
  });
}

export async function copyOwnAvailabilityBlock(actor: { userId: string; role: UserRole }, input: CopyAvailabilityBlockInput) {
  const profile = await getOwnNurseProfile(actor);

  const sourceBlock = profile.availabilityBlocks.find((block) => block.id === input.sourceBlockId);
  if (!sourceBlock) {
    throw createHttpError(404, 'Source availability block not found');
  }

  const proposed = input.copies.map((copy) => ({ start: new Date(copy.startTime), end: new Date(copy.endTime) }));
  const allExisting = profile.availabilityBlocks;

  for (const candidate of proposed) {
    const existingConflict = allExisting.some((block) => overlaps(candidate.start, candidate.end, block.startTime, block.endTime));
    if (existingConflict) {
      throw createHttpError(409, 'Copied availability block overlaps with an existing block');
    }
  }

  for (let i = 0; i < proposed.length; i += 1) {
    for (let j = i + 1; j < proposed.length; j += 1) {
      if (overlaps(proposed[i].start, proposed[i].end, proposed[j].start, proposed[j].end)) {
        throw createHttpError(409, 'Copied availability blocks overlap each other');
      }
    }
  }

  await prisma.nurseAvailabilityBlock.createMany({
    data: input.copies.map((copy) => ({
      nurseProfileId: profile.id,
      title: sourceBlock.title,
      city: sourceBlock.city,
      postalCode: sourceBlock.postalCode ?? undefined,
      latitude: sourceBlock.latitude ?? undefined,
      longitude: sourceBlock.longitude ?? undefined,
      radiusKm: sourceBlock.radiusKm,
      startTime: new Date(copy.startTime),
      endTime: new Date(copy.endTime),
      notes: sourceBlock.notes ?? undefined,
    })),
  });

  return prisma.nurseAvailabilityBlock.findMany({
    where: { nurseProfileId: profile.id },
    orderBy: { startTime: 'asc' },
  });
}

export async function setAvailabilityBlockBookedState(
  blockId: string,
  input: SetAvailabilityBlockBookedInput,
  actor?: { role?: UserRole },
) {
  if (actor && actor.role !== UserRole.SUPER_ADMIN) {
    throw createHttpError(403, 'Only super admins can change booked state directly');
  }

  const existing = await prisma.nurseAvailabilityBlock.findUnique({
    where: { id: blockId },
  });

  if (!existing) {
    throw createHttpError(404, 'Availability block not found');
  }

  return prisma.nurseAvailabilityBlock.update({
    where: { id: blockId },
    data: {
      isBooked: input.isBooked,
    },
  });
}
