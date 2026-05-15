import createHttpError from 'http-errors';
import { UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';

function deg2rad(value: number): number {
  return (value * Math.PI) / 180;
}

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const earthRadiusKm = 6371;
  const dLat = deg2rad(bLat - aLat);
  const dLng = deg2rad(bLng - aLng);
  const lat1 = deg2rad(aLat);
  const lat2 = deg2rad(bLat);

  const haversine =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return earthRadiusKm * c;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export async function findCandidatesForJobShift(actor: { userId: string; role: UserRole }, jobShiftId: string) {
  if (actor.role !== UserRole.HOSPITAL_ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
    throw createHttpError(403, 'Only hospital admins can search for candidates');
  }

  const jobShift = await prisma.jobShift.findUnique({
    where: { id: jobShiftId },
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
    throw createHttpError(403, 'You are not allowed to search candidates for this job shift');
  }

  const nurseProfiles = await prisma.nurseProfile.findMany({
    include: {
      specializations: true,
      availabilityBlocks: true,
      matchContracts: {
        where: {
          status: 'SIGNED',
        },
        include: {
          jobShift: true,
        },
      },
    },
  });

  const requiredTags = jobShift.requirements.filter((r) => r.priority === 'REQUIRED').map((r) => r.tag);
  const preferredTags = jobShift.requirements.filter((r) => r.priority === 'PREFERRED').map((r) => r.tag);

  const candidates = nurseProfiles
    .map((nurse) => {
      const nurseTags = nurse.specializations.map((item) => item.tag);
      const hasRequiredTags = requiredTags.every((tag) => nurseTags.includes(tag));
      if (!hasRequiredTags) {
        return null;
      }

      const matchingBlock = nurse.availabilityBlocks.find((block) => {
        if (block.isBooked) {
          return false;
        }

        const timeFits =
          block.startTime <= jobShift.startTime &&
          block.endTime >= jobShift.endTime;

        if (!timeFits) {
          return false;
        }

        const conflictingBooking = nurse.matchContracts.some((contract) =>
          overlaps(jobShift.startTime, jobShift.endTime, contract.jobShift.startTime, contract.jobShift.endTime),
        );

        if (conflictingBooking) {
          return false;
        }

        if (
          block.latitude &&
          block.longitude &&
          jobShift.locationLatitude &&
          jobShift.locationLongitude
        ) {
          const distance = distanceKm(
            Number(block.latitude),
            Number(block.longitude),
            Number(jobShift.locationLatitude),
            Number(jobShift.locationLongitude),
          );
          return distance <= block.radiusKm;
        }

        if (block.city && jobShift.locationCity) {
          return block.city.toLowerCase() === jobShift.locationCity.toLowerCase();
        }

        return false;
      });

      if (!matchingBlock) {
        return null;
      }

      const preferredTagMatches = preferredTags.filter((tag) => nurseTags.includes(tag)).length;

      return {
        nurseProfileId: nurse.id,
        publicId: nurse.publicId,
        displayName: nurse.displayName,
        minHourlyRate: nurse.minHourlyRate,
        preferredShiftType: nurse.preferredShiftType,
        preferredTagMatches,
        matchingAvailabilityBlockId: matchingBlock.id,
        matchingCity: matchingBlock.city,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => {
      if (b.preferredTagMatches !== a.preferredTagMatches) {
        return b.preferredTagMatches - a.preferredTagMatches;
      }
      return Number(a.minHourlyRate) - Number(b.minHourlyRate);
    });

  return {
    jobShiftId: jobShift.id,
    candidates,
  };
}
